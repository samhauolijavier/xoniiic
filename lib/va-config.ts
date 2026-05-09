// Edit this file to update VA responsibilities — no code changes needed elsewhere.

export type VAStatus = 'active' | 'upcoming' | 'inactive'
export type Priority = 'High' | 'Medium' | 'Low'
export type TaskStatus = 'Not Started' | 'In Progress' | 'Done' | 'Blocked'
export type Project = 'Zeepo' | 'The RAD CRM' | 'Go High Level' | 'General'

export interface VA {
  id: string
  name: string
  status: VAStatus
  color: string // tailwind bg class
  initials: string
}

export interface Category {
  id: string
  label: string
  project: Project
  assignedTo: string // VA id
  note?: string
}

// ── VAs ─────────────────────────────────────────────────────────────────────
// Add new VAs here. status: 'upcoming' shows them as "joining soon" in the UI.
export const VAS: VA[] = [
  {
    id: 'jeremy',
    name: 'Jeremy',
    status: 'active',
    color: 'bg-purple-600',
    initials: 'JR',
  },
  {
    id: 'hera',
    name: 'Hera',
    status: 'upcoming',
    color: 'bg-orange-500',
    initials: 'HR',
  },
]

// ── Task Categories → VA Assignment ─────────────────────────────────────────
// To reassign a category, just change assignedTo to the new VA's id.
// To add a category, add a new entry — it'll appear in the task form automatically.
export const CATEGORIES: Category[] = [
  // Jeremy — current responsibilities
  {
    id: 'zeepo-onboarding',
    label: 'Zeepo Back-End Onboarding',
    project: 'Zeepo',
    assignedTo: 'jeremy',
  },
  {
    id: 'zeepo-a2p-registration',
    label: 'Zeepo A2P Registration',
    project: 'Zeepo',
    assignedTo: 'jeremy',
  },
  {
    id: 'rad-handwritten-cards',
    label: 'The RAD CRM Handwritten Card Charges',
    project: 'The RAD CRM',
    assignedTo: 'jeremy',
  },
  {
    id: 'ghl-inbox',
    label: 'GHL Admin Inbox Watch',
    project: 'Go High Level',
    assignedTo: 'jeremy',
  },
  {
    id: 'email-watch',
    label: 'Email Watch',
    project: 'General',
    assignedTo: 'jeremy',
  },

  // Jeremy — phase 2 (shift here when Hera onboards)
  {
    id: 'rad-financial',
    label: 'The RAD CRM Financial Management',
    project: 'The RAD CRM',
    assignedTo: 'jeremy',
    note: 'Phase 2 — shift Jeremy here when Hera onboards',
  },
  {
    id: 'rad-subscriptions',
    label: 'The RAD CRM Account Subscription Updates',
    project: 'The RAD CRM',
    assignedTo: 'jeremy',
    note: 'Phase 2',
  },
  {
    id: 'rad-email',
    label: 'The RAD CRM Email Watch',
    project: 'The RAD CRM',
    assignedTo: 'jeremy',
    note: 'Phase 2',
  },

  // Hera — when she joins
  {
    id: 'workflow-dev',
    label: 'Workflow Development',
    project: 'General',
    assignedTo: 'hera',
  },
  {
    id: 'troubleshooting',
    label: 'Troubleshooting',
    project: 'General',
    assignedTo: 'hera',
  },
]

export const PROJECTS: Project[] = ['Zeepo', 'The RAD CRM', 'Go High Level', 'General']

// ── Helpers ──────────────────────────────────────────────────────────────────
export function getVAById(id: string): VA | undefined {
  return VAS.find((va) => va.id === id)
}

export function getVAForCategory(categoryId: string): VA | undefined {
  const cat = CATEGORIES.find((c) => c.id === categoryId)
  if (!cat) return undefined
  return getVAById(cat.assignedTo)
}

export function getCategoriesForVA(vaId: string): Category[] {
  return CATEGORIES.filter((c) => c.assignedTo === vaId)
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id)
}
