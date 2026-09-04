/*
 * The scenario curriculum, as data.
 *
 * Every practice brief is a PDF whose filename is its key — ghl-b01.pdf and so
 * on — so the uploader can look up what a file IS instead of asking somebody to
 * retype a title, a track and a summary thirty times. That tedium is the reason
 * a resources page stays empty.
 *
 * It is also the source of truth for the curriculum itself. When the quiz gets
 * built it keys off the same records, so a scenario cannot exist on the page
 * under one title and in the marking under another.
 *
 * Adding a track later means adding rows here. Nothing else changes.
 */

export interface ScenarioMeta {
  /** matches the uploaded filename, minus its extension */
  key: string
  /** the short code printed on the brief, e.g. B01 */
  code: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  /** how the public page groups it */
  track: string
  title: string
  client: string
  /** the client's own words — the hook, and what the listing shows */
  summary: string
  minutes: string
}

export const SCENARIOS: Record<string, ScenarioMeta> = {
  'ghl-b01': {
    key: 'ghl-b01',
    code: 'B01',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'The account you just inherited',
    client: 'Cedar & Pine Dental · two locations',
    summary: 'The last guy set all this up and then went quiet on us. I have no idea if any of it works. Can you just have a look and tell me what you find?',
    minutes: '40 min',
  },
  'ghl-b02': {
    key: 'ghl-b02',
    code: 'B02',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'Five hundred contacts, and not one duplicate',
    client: 'Ironwood Gym · single location',
    summary: 'Here’s the export from our old system. Some of it is a mess, I know. Just get it in there so we can start texting people about the January promo.',
    minutes: '55 min',
  },
  'ghl-b03': {
    key: 'ghl-b03',
    code: 'B03',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'Change the business name once, not forty times',
    client: 'Kalesa Coffee · three branches',
    summary: 'We’re adding ‘Co.’ to the name. It’s in the emails, the texts, the booking confirmations — everywhere. Please don’t tell me you have to go through them one by one.',
    minutes: '30 min',
  },
  'ghl-b04': {
    key: 'ghl-b04',
    code: 'B04',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'Everyone who filled the form and never booked',
    client: 'Sunspot Roofing · storm-season leads',
    summary: 'There have to be people who asked for a quote and then just… nothing. I want to call them. Can you get me a list?',
    minutes: '40 min',
  },
  'ghl-b05': {
    key: 'ghl-b05',
    code: 'B05',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'A booking link that works for the client, not for you',
    client: 'Studio Marisol · portrait photography',
    summary: 'I shoot Tuesday to Saturday. A session is an hour and a half and I need a couple of hours before it to set up and get my head right. And please, nobody books me the same day — it’s happened twice and both times were a disaster.',
    minutes: '45 min',
  },
  'ghl-b06': {
    key: 'ghl-b06',
    code: 'B06',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'A pipeline that matches how they actually sell',
    client: 'Northgate Auto Glass · mobile service',
    summary: 'So they call, we quote them, then they either book or they go with someone cheaper. Then we do the job and they pay. That’s pretty much it. Four stages?',
    minutes: '45 min',
  },
  'ghl-b07': {
    key: 'ghl-b07',
    code: 'B07',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'Your first workflow, and what fires when',
    client: 'PetalWorks · florist',
    summary: 'When someone enquires I want them to get an email straight away, and then a text the next day if they haven’t got back to us.',
    minutes: '50 min',
  },
  'ghl-b08': {
    key: 'ghl-b08',
    code: 'B08',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'Stop retyping the same reply fifty times a week',
    client: 'Bellweather Insurance · final expense',
    summary: 'I send the same six messages all day. ‘What are your hours,’ ‘can you send the quote again,’ ‘are you licensed in my state.’ My thumbs hurt.',
    minutes: '35 min',
  },
  'ghl-b09': {
    key: 'ghl-b09',
    code: 'B09',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'Read the dashboard and name what is broken',
    client: 'Harbor & Co. Bookkeeping · B2B',
    summary: 'Our numbers look fine to me. My business partner says something’s wrong. One of us is right — which one?',
    minutes: '30 min',
  },
  'ghl-b10': {
    key: 'ghl-b10',
    code: 'B10',
    level: 'Beginner',
    track: 'GoHighLevel \u00b7 Beginner',
    title: 'A form that does not lose people halfway',
    client: 'Ironwood Gym · free trial offer',
    summary: 'Loads of people start filling it in on their phone and then just vanish. My nephew built it, so.',
    minutes: '45 min',
  },
  'ghl-i01': {
    key: 'ghl-i01',
    code: 'I01',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'The form that fires twice, and then not at all',
    client: 'Sunspot Roofing · after a hailstorm',
    summary: 'A guy filled the form out last week, got the whole sequence. He filled it out again today for his mother’s house and got absolutely nothing. Meanwhile my wife tested it and got two of everything.',
    minutes: '1 hr',
  },
  'ghl-i02': {
    key: 'ghl-i02',
    code: 'I02',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'Missed-call text-back that does not embarrass anyone',
    client: 'Northgate Auto Glass · mobile technicians',
    summary: 'If we miss a call I want them texted straight away. My competitor does it and he’s eating my lunch.',
    minutes: '1.5 hrs',
  },
  'ghl-i03': {
    key: 'ghl-i03',
    code: 'I03',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: '“Wait one day” does not mean what you think',
    client: 'Kalesa Coffee · loyalty campaign',
    summary: 'The follow-up text is supposed to go out the next morning. A customer showed me hers — it arrived at eleven at night. She was not delighted.',
    minutes: '1 hr',
  },
  'ghl-i04': {
    key: 'ghl-i04',
    code: 'I04',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'Only the people who actually said yes',
    client: 'Bellweather Insurance · compliance-sensitive',
    summary: 'There’s a tickbox on the form for text updates. Obviously only text the ones who ticked it. I don’t need another complaint.',
    minutes: '1 hr',
  },
  'ghl-i05': {
    key: 'ghl-i05',
    code: 'I05',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'Round robin, or collective?',
    client: 'Cedar & Pine Dental · three hygienists, one part-time',
    summary: 'Just one link, and it goes to whoever’s free. Rita only does Tuesdays and Thursdays though. And for the new-patient consult I need the dentist and the hygienist both in the room.',
    minutes: '1.5 hrs',
  },
  'ghl-i06': {
    key: 'ghl-i06',
    code: 'I06',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'Move it to Booked without anyone touching it',
    client: 'PetalWorks · wedding enquiries',
    summary: 'I’m dragging cards across that board every evening like it’s 1994. When they book a consultation it should just move itself. And I want to see what the pipeline is worth.',
    minutes: '1.5 hrs',
  },
  'ghl-i07': {
    key: 'ghl-i07',
    code: 'I07',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'A form that asks different questions',
    client: 'Vela Legal · small practice',
    summary: 'Personal injury and family law need completely different questions, and I don’t want to scare a divorce client with a form about car accidents. Also sometimes people come to us for things we don’t even do.',
    minutes: '1.5 hrs',
  },
  'ghl-i08': {
    key: 'ghl-i08',
    code: 'I08',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'Six reasons a calendar shows nothing',
    client: 'Studio Marisol · a completely blank Tuesday',
    summary: 'It says no times available. On a Tuesday. I am sitting here doing nothing on a Tuesday.',
    minutes: '1.5 hrs',
  },
  'ghl-i09': {
    key: 'ghl-i09',
    code: 'I09',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'Which link did they actually click?',
    client: 'Sunspot Roofing · one email, three offers',
    summary: 'The email has three things in it — free inspection, financing, and the storm-damage guide. I want to know which one each person cared about so we know what to say when we ring them.',
    minutes: '1 hr',
  },
  'ghl-i10': {
    key: 'ghl-i10',
    code: 'I10',
    level: 'Intermediate',
    track: 'GoHighLevel \u00b7 Intermediate',
    title: 'Put the page live on their domain today',
    client: 'Harbor & Co. Bookkeeping · tax season',
    summary: 'We’re running ads from Monday and the page needs to be on our own domain, not some link that looks like spam. I’ve given you access to wherever the website lives.',
    minutes: '1.5 hrs',
  },
  'ghl-a01': {
    key: 'ghl-a01',
    code: 'A01',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'Get the A2P registration approved',
    client: 'Bellweather Insurance · rejected twice already',
    summary: 'We’ve been knocked back twice and nobody will tell us why. We cannot send a single text until this is sorted and it is costing us every day.',
    minutes: '3 hrs',
  },
  'ghl-a02': {
    key: 'ghl-a02',
    code: 'A02',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'Why the emails are landing in spam',
    client: 'Ironwood Gym · open rate fell off a cliff',
    summary: 'We used to get 30% opens and now it’s 4%. Nothing changed on our end. Someone told me it’s a DNS thing?',
    minutes: '2.5 hrs',
  },
  'ghl-a03': {
    key: 'ghl-a03',
    code: 'A03',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'Triage an account three agencies have touched',
    client: 'Cedar & Pine Dental · six months after B01',
    summary: 'We’ve had three people in here since you last looked. There are about forty workflows and nobody knows which ones are live. Can we just wipe it and start again?',
    minutes: '3 hrs',
  },
  'ghl-a04': {
    key: 'ghl-a04',
    code: 'A04',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'The reminder that must never send twice',
    client: 'Bellweather Insurance · appointment reminders',
    summary: 'A lady got the same reminder four times last Thursday. She complained to the carrier. I cannot have that happen again — understand me, not once.',
    minutes: '2.5 hrs',
  },
  'ghl-a05': {
    key: 'ghl-a05',
    code: 'A05',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'An import went out to two thousand people',
    client: 'Kalesa Coffee · this morning',
    summary: 'The new girl imported the list and it’s gone out to everyone. Wrong names on half of them. My phone has not stopped. What do we do.',
    minutes: '2.5 hrs',
  },
  'ghl-a06': {
    key: 'ghl-a06',
    code: 'A06',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'Two locations, one number, correct routing',
    client: 'Cedar & Pine Dental · north and south',
    summary: 'People keep booking at the wrong branch and then turning up furious eleven miles away. Same number on everything, same website. Just make it work.',
    minutes: '3 hrs',
  },
  'ghl-a07': {
    key: 'ghl-a07',
    code: 'A07',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'Where did the leads actually come from?',
    client: 'Sunspot Roofing · three channels, one budget',
    summary: 'I’m spending on Facebook, Google and those yard signs. My wife wants to cut one. Which one is working?',
    minutes: '3 hrs',
  },
  'ghl-a08': {
    key: 'ghl-a08',
    code: 'A08',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'A nurture sequence that knows when to stop',
    client: 'Studio Marisol · nine touches over thirty days',
    summary: 'Someone booked with me on the Tuesday and was still getting ‘still thinking about it?’ emails a fortnight later. She showed me. I wanted the floor to swallow me.',
    minutes: '2.5 hrs',
  },
  'ghl-a09': {
    key: 'ghl-a09',
    code: 'A09',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'Move them over without losing a booking',
    client: 'Harbor & Co. Bookkeeping · leaving their old system',
    summary: 'We want to be off the old platform by the end of the month. There are already appointments booked into next quarter. Nothing can go missing — these are clients’ tax deadlines.',
    minutes: '4 hrs',
  },
  'ghl-a10': {
    key: 'ghl-a10',
    code: 'A10',
    level: 'Advanced',
    track: 'GoHighLevel \u00b7 Advanced',
    title: 'Write it up so somebody else can run it',
    client: 'Any of the above · the capstone',
    summary: 'You’re going on leave for two weeks. Whoever covers you has never seen this account. Write it down.',
    minutes: '2 hrs',
  },
}

/** Filename in, metadata out. Tolerates any extension and stray case. */
export function scenarioFromFilename(name: string): ScenarioMeta | undefined {
  const stem = name.replace(/\.[^.]+$/, '').trim().toLowerCase()
  return SCENARIOS[stem]
}

export const SCENARIO_COUNT = Object.keys(SCENARIOS).length
