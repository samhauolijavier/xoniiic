import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { db, withRetry } from '@/lib/db'
import { normalizeReference, referenceLooksValid, seatPrice } from '@/lib/sandbox'
import { notifyDiscord } from '@/lib/discord'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const me = session.user as { id: string }

  const price = await seatPrice()
  const body = await req.json().catch(() => ({}))
  const reference = normalizeReference(String(body.reference ?? ''))
  const proofUrl = typeof body.proofUrl === 'string' && body.proofUrl ? body.proofUrl : null

  if (!referenceLooksValid(reference)) {
    return NextResponse.json({
      error: 'That does not look like a GCash reference number. Check your receipt and type the reference exactly.',
    }, { status: 400 })
  }

  try {
    const alreadyOpen = await withRetry(() => db.gcashPayment.findFirst({
      where: { userId: me.id, state: { in: ['awaiting_proof', 'awaiting_check'] } },
      select: { reference: true, createdAt: true },
    }))
    if (alreadyOpen) {
      return NextResponse.json({
        error: `You already have a payment waiting to be checked (${alreadyOpen.reference}). We will get to it — no need to send again.`,
      }, { status: 409 })
    }

    const payment = await withRetry(() => db.gcashPayment.create({
      data: {
        userId: me.id,
        reference,
        amount: price,
        proofUrl,
        // A reference typed in means the money has moved; what is missing is a
        // human confirming it landed. Only a claim with no reference at all
        // sits at awaiting_proof.
        state: proofUrl || reference ? 'awaiting_check' : 'awaiting_proof',
      },
      select: { id: true, reference: true, state: true, createdAt: true },
    }))

    // Awaited, not fired and forgotten: on serverless the function can be torn
    // down the moment the response goes out, which kills a floating promise and
    // loses the notice silently. It times out at four seconds and cannot throw,
    // so the worst case is a claim that lands without a ping.
    const claimant = await withRetry(() => db.user.findUnique({
      where: { id: me.id },
      select: { name: true, email: true },
    }))
    await notifyDiscord({
      title: 'Payment to check',
      description: 'Someone has paid for a practice account and is waiting on us.',
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://virtualfreaks.co'}/admin/seats`,
      tone: 'action',
      fields: [
        { name: 'Who', value: claimant?.name || 'No name yet', inline: true },
        { name: 'Email', value: claimant?.email || 'unknown', inline: true },
        { name: 'GCash reference', value: reference, inline: true },
        { name: 'Amount', value: `PHP ${price}`, inline: true },
      ],
    })

    return NextResponse.json({
      message: 'Got it. Your seat opens as soon as we match the payment — usually the same day.',
      payment,
    })
  } catch (error: unknown) {
    // The reference is unique across every user on purpose: one payment cannot
    // buy two seats, and a copied reference is caught here rather than by us.
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({
        error: 'That reference number has already been used. If you think this is a mistake, message us and we will sort it out.',
      }, { status: 409 })
    }
    console.error('Sandbox claim error:', error)
    return NextResponse.json({ error: 'Database connection failed. Please try again.' }, { status: 500 })
  }
}
