/**
 * Run once to create the VA Tasks database in your Notion workspace.
 *
 * Usage:
 *   1. Set env vars: NOTION_TOKEN and NOTION_PARENT_PAGE_ID
 *   2. npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/setup-notion.ts
 *   3. Copy the printed database ID into your .env.local as NOTION_TASKS_DATABASE_ID
 */

import { Client } from '@notionhq/client'
import { CATEGORIES, VAS, PROJECTS } from '../lib/va-config'

const notion = new Client({ auth: process.env.NOTION_TOKEN })

async function main() {
  const parentPageId = process.env.NOTION_PARENT_PAGE_ID
  if (!process.env.NOTION_TOKEN) throw new Error('Missing NOTION_TOKEN')
  if (!parentPageId) throw new Error('Missing NOTION_PARENT_PAGE_ID')

  console.log('Creating VA Tasks database in Notion...\n')

  const categoryOptions = CATEGORIES.map((c) => ({ name: c.label }))
  const vaOptions = [
    ...VAS.map((va) => ({ name: va.name })),
    { name: 'Unassigned' },
  ]
  const projectOptions = PROJECTS.map((p) => ({ name: p }))

  const db = await notion.databases.create({
    parent: { type: 'page_id', page_id: parentPageId },
    title: [{ type: 'text', text: { content: 'VA Tasks' } }],
    icon: { type: 'emoji', emoji: '✅' },
    properties: {
      Name: { title: {} },

      Status: {
        select: {
          options: [
            { name: 'Not Started', color: 'gray' },
            { name: 'In Progress', color: 'blue' },
            { name: 'Done', color: 'green' },
            { name: 'Blocked', color: 'red' },
          ],
        },
      },

      Priority: {
        select: {
          options: [
            { name: 'High', color: 'red' },
            { name: 'Medium', color: 'yellow' },
            { name: 'Low', color: 'gray' },
          ],
        },
      },

      Category: {
        select: { options: categoryOptions },
      },

      // Internal ID for programmatic lookups — not displayed to VAs
      'Category ID': { rich_text: {} },

      'Assigned To': {
        select: { options: vaOptions },
      },

      Project: {
        select: { options: projectOptions },
      },

      Notes: { rich_text: {} },
    },
  })

  const dbId = db.id
  const dbUrl = (db as { url?: string }).url ?? ''

  console.log('✅ Database created successfully!\n')
  console.log('──────────────────────────────────────────')
  console.log(`Database ID: ${dbId}`)
  console.log(`URL: ${dbUrl}`)
  console.log('──────────────────────────────────────────\n')
  console.log('Add this to your .env.local:')
  console.log(`NOTION_TASKS_DATABASE_ID=${dbId}\n`)

  // Seed a welcome task
  await notion.pages.create({
    parent: { database_id: dbId },
    properties: {
      Name: { title: [{ text: { content: '👋 Welcome — your VA task system is live!' } }] },
      Status: { select: { name: 'Done' } },
      Priority: { select: { name: 'Low' } },
      Category: { select: { name: 'Zeepo Back-End Onboarding' } },
      'Category ID': { rich_text: [{ text: { content: 'zeepo-onboarding' } }] },
      'Assigned To': { select: { name: 'Jeremy' } },
      Project: { select: { name: 'Zeepo' } },
      Notes: {
        rich_text: [{
          text: {
            content: 'Setup complete. Add tasks from the VA Tasks dashboard in the app.',
          },
        }],
      },
    },
  })

  console.log('Seeded a welcome task. You\'re good to go!')
}

main().catch((err) => {
  console.error('Setup failed:', err)
  process.exit(1)
})
