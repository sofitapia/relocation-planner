// Each task has: id, category, label, monthsBefore (months before moving date to assign it)
// monthsBefore: 3 means "assign to the month that is 3 months before the move"

export const CATEGORIES = {
  Admin:   {},
  Packing: {},
  Social:  {},
  Explore: {},
}

export const TASKS = [
  // 3+ months before
  { id: 1, category: 'Admin', label: 'Research cost of living in {destination}', monthsBefore: 3 },
  { id: 2, category: 'Admin', label: 'Create a moving budget spreadsheet', monthsBefore: 3 },
  { id: 3, category: 'Admin', label: 'Research neighborhoods in {destination}', monthsBefore: 3 },
  { id: 4, category: 'Admin', label: 'Start apartment/house hunting in {destination}', monthsBefore: 3 },
  { id: 5, category: 'Explore', label: 'Research schools, hospitals, and services in {destination}', monthsBefore: 3 },
  { id: 6, category: 'Explore', label: 'Join local online communities for {destination}', monthsBefore: 3 },
  { id: 7, category: 'Social', label: 'Tell close friends and family about the move', monthsBefore: 3 },
  { id: 8, category: 'Packing', label: 'Declutter and donate items you won\'t bring', monthsBefore: 3 },

  // 2 months before
  { id: 9, category: 'Admin', label: 'Confirm housing in {destination}', monthsBefore: 2 },
  { id: 10, category: 'Admin', label: 'Research and book a moving company or truck rental', monthsBefore: 2 },
  { id: 11, category: 'Admin', label: 'Notify employer or begin job search in {destination}', monthsBefore: 2 },
  { id: 12, category: 'Admin', label: 'Research health insurance options in {destination}', monthsBefore: 2 },
  { id: 13, category: 'Packing', label: 'Order packing supplies (boxes, tape, bubble wrap)', monthsBefore: 2 },
  { id: 14, category: 'Packing', label: 'Start packing non-essential items', monthsBefore: 2 },
  { id: 15, category: 'Social', label: 'Plan a farewell gathering with friends', monthsBefore: 2 },
  { id: 16, category: 'Explore', label: 'Plan a scouting trip to {destination} if possible', monthsBefore: 2 },

  // 1 month before
  { id: 17, category: 'Admin', label: 'Update address with bank and financial institutions', monthsBefore: 1 },
  { id: 18, category: 'Admin', label: 'Forward mail to new address', monthsBefore: 1 },
  { id: 19, category: 'Admin', label: 'Notify subscriptions and online accounts of address change', monthsBefore: 1 },
  { id: 20, category: 'Admin', label: 'Transfer or request medical and dental records', monthsBefore: 1 },
  { id: 21, category: 'Admin', label: 'Confirm moving company details and finalize date', monthsBefore: 1 },
  { id: 22, category: 'Packing', label: 'Pack the majority of your belongings', monthsBefore: 1 },
  { id: 23, category: 'Packing', label: 'Label all boxes by room and category', monthsBefore: 1 },
  { id: 24, category: 'Social', label: 'Exchange contact info and say personal goodbyes', monthsBefore: 1 },
  { id: 25, category: 'Explore', label: 'Research top things to do in {destination}', monthsBefore: 1 },

  // Moving month (monthsBefore: 0)
  { id: 26, category: 'Admin', label: 'Transfer utilities to your new address in {destination}', monthsBefore: 0 },
  { id: 27, category: 'Admin', label: 'Confirm internet setup at new home in {destination}', monthsBefore: 0 },
  { id: 28, category: 'Packing', label: 'Pack an essentials bag (documents, chargers, toiletries)', monthsBefore: 0 },
  { id: 29, category: 'Packing', label: 'Do a final walkthrough of your old place', monthsBefore: 0 },
  { id: 30, category: 'Social', label: 'Send your new address to everyone who needs it', monthsBefore: 0 },
  { id: 31, category: 'Explore', label: 'Find your nearest grocery store and pharmacy in {destination}', monthsBefore: 0 },

  // After the move (monthsBefore: -1)
  { id: 32, category: 'Admin', label: 'Update driver\'s license and vehicle registration', monthsBefore: -1 },
  { id: 33, category: 'Admin', label: 'Register to vote in {destination}', monthsBefore: -1 },
  { id: 34, category: 'Admin', label: 'Find a new doctor, dentist, and other healthcare providers', monthsBefore: -1 },
  { id: 35, category: 'Packing', label: 'Unpack and organize each room', monthsBefore: -1 },
  { id: 36, category: 'Packing', label: 'Return any borrowed packing supplies', monthsBefore: -1 },
  { id: 37, category: 'Social', label: 'Introduce yourself to your new neighbors', monthsBefore: -1 },
  { id: 38, category: 'Social', label: 'Find local clubs, groups, or classes to meet people', monthsBefore: -1 },
  { id: 39, category: 'Explore', label: 'Explore a new neighborhood in {destination} each weekend', monthsBefore: -1 },
  { id: 40, category: 'Explore', label: 'Try a local restaurant or café in {destination}', monthsBefore: -1 },
]

// EU member states — used for passport-based immigration logic
export const EU_COUNTRIES = new Set([
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czech Republic',
  'Denmark', 'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary',
  'Ireland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
  'Netherlands', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia',
  'Spain', 'Sweden',
])

const holdsEUPassport   = a => Array.isArray(a.passports) && a.passports.some(p => EU_COUNTRIES.has(p))
const holdsDestPassport = a => Array.isArray(a.passports) && a.passports.includes(a.destCountry)
const destIsEU          = a => EU_COUNTRIES.has(a.destCountry)
const hasPassportData   = a => Array.isArray(a.passports) && a.passports.length > 0

// Tasks added conditionally based on onboarding answers
const CONDITIONAL_TASKS = [
  // Leaving Netherlands
  { id: 101, category: 'Admin', monthsBefore: 2, label: 'Deregister at your municipality (uitschrijven)',
    condition: a => a.originCountry === 'Netherlands' },
  { id: 102, category: 'Admin', monthsBefore: 1, label: 'Cancel your mandatory health insurance (zorgverzekering)',
    condition: a => a.originCountry === 'Netherlands' },
  { id: 103, category: 'Admin', monthsBefore: 1, label: 'Notify the Belastingdienst (Dutch Tax Authority) of your departure',
    condition: a => a.originCountry === 'Netherlands' },

  // Arriving in Netherlands
  { id: 111, category: 'Admin', monthsBefore: -1, label: 'Register at the local municipality (BRP registration)',
    condition: a => a.destCountry === 'Netherlands' },
  { id: 112, category: 'Admin', monthsBefore: -1, label: 'Sign up for mandatory health insurance in the Netherlands',
    condition: a => a.destCountry === 'Netherlands' },

  // Work: job secured — skip if EU→EU (freedom of movement) or already holds dest passport
  { id: 121, category: 'Admin', monthsBefore: 3, label: 'Prepare employment contract and documents for your permit application',
    condition: a => a.workStatus === 'secured' && !holdsDestPassport(a) && !(holdsEUPassport(a) && destIsEU(a)) },
  { id: 122, category: 'Admin', monthsBefore: 2, label: 'Apply for work visa or residence permit for {destination}',
    condition: a => a.workStatus === 'secured' && !holdsDestPassport(a) && !(holdsEUPassport(a) && destIsEU(a)) },

  // Passport: EU citizen moving to EU — freedom of movement applies
  { id: 160, category: 'Admin', monthsBefore: 3,
    label: 'As an EU citizen, you have freedom of movement in {destination} — no visa or work permit required to live and work there.',
    condition: a => hasPassportData(a) && holdsEUPassport(a) && destIsEU(a) && !holdsDestPassport(a) },

  // Passport: non-EU moving to EU, and does not hold destination country passport
  { id: 161, category: 'Admin', monthsBefore: 3,
    label: 'Research long-stay visa and residence permit options for {destination} based on your passport(s)',
    condition: a => hasPassportData(a) && !holdsEUPassport(a) && !holdsDestPassport(a) && destIsEU(a) },
  { id: 162, category: 'Admin', monthsBefore: 2,
    label: 'Apply for your visa or residence permit for {destination}',
    condition: a => hasPassportData(a) && !holdsEUPassport(a) && !holdsDestPassport(a) && destIsEU(a) },

  // Work: searching on arrival
  { id: 131, category: 'Admin', monthsBefore: 1, label: 'Update your CV for the {destination} job market',
    condition: a => a.workStatus === 'searching' },
  { id: 132, category: 'Explore', monthsBefore: 2, label: 'Research key employers and job platforms in {destination}',
    condition: a => a.workStatus === 'searching' },

  // Moving with children
  { id: 141, category: 'Admin', monthsBefore: 3, label: 'Research schools and enrollment process in {destination}',
    condition: a => a.travelingWith === 'family' || a.travelingWith === 'partner-family' },
  { id: 142, category: 'Admin', monthsBefore: 2, label: 'Research childcare and pediatric healthcare options in {destination}',
    condition: a => a.travelingWith === 'family' || a.travelingWith === 'partner-family' },
  { id: 143, category: 'Admin', monthsBefore: 1, label: 'Confirm school enrollment for children in {destination}',
    condition: a => a.travelingWith === 'family' || a.travelingWith === 'partner-family' },

  // First time moving abroad
  { id: 151, category: 'Admin', monthsBefore: 3, label: 'Research tax obligations as an expat in {destination}',
    condition: a => a.firstTimeAbroad === 'yes' },
  { id: 152, category: 'Admin', monthsBefore: 2, label: 'Open an international bank account or notify your current bank of the move',
    condition: a => a.firstTimeAbroad === 'yes' },
]

// Base task IDs to remove based on answers
const TASK_SKIPS = [
  { taskId: 6,  when: a => a.isHometown === 'yes' },  // Join local online communities
  { taskId: 25, when: a => a.isHometown === 'yes' },  // Research top things to do
  { taskId: 39, when: a => a.isHometown === 'yes' },  // Explore a new neighborhood
  { taskId: 40, when: a => a.isHometown === 'yes' },  // Try a local restaurant
  { taskId: 11, when: a => a.workStatus === 'not-working' }, // Notify employer / begin job search
]

const CATEGORY_PRIORITY = { Admin: 0, Packing: 1, Social: 2, Explore: 3 }

export function generateChecklist(answers = {}) {
  const movingDate = answers.movingDate || ''
  const destination = answers.destCity && answers.destCountry
    ? `${answers.destCity}, ${answers.destCountry}`
    : answers.destination || 'your new city'

  const moveDate = new Date(movingDate + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const daysUntilMove = Math.ceil((moveDate - today) / (1000 * 60 * 60 * 24))

  // Build active task list: base tasks filtered + conditional tasks added
  const skippedIds = new Set(
    TASK_SKIPS.filter(r => r.when(answers)).map(r => r.taskId)
  )
  const baseTasks = TASKS.filter(t => !skippedIds.has(t.id))
  const extraTasks = CONDITIONAL_TASKS.filter(t => t.condition(answers))
  const allTasks = [...baseTasks, ...extraTasks]

  const fill = t => ({ ...t, label: t.label.replace(/{destination}/g, destination) })

  // Compressed mode: < 30 days — collapse pre-move tasks into one urgent bucket
  if (daysUntilMove < 30) {
    const preTasks = allTasks
      .filter(t => t.monthsBefore >= 1)
      .sort((a, b) =>
        (CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category]) || (a.id - b.id)
      )
      .map(fill)

    const moveTasks = allTasks.filter(t => t.monthsBefore === 0).map(fill)
    const afterTasks = allTasks.filter(t => t.monthsBefore < 0).map(fill)

    const buckets = []

    if (daysUntilMove > 0 && preTasks.length) {
      const d = daysUntilMove
      buckets.push({
        key: 'before-move',
        label: d === 1 ? 'Tomorrow — Final Day' : `Before Your Move — ${d} days left`,
        tasks: preTasks,
      })
    }

    buckets.push({
      key: 'moving-day',
      label: daysUntilMove <= 0 ? (daysUntilMove < 0 ? 'Moving Day — Settling In' : 'Today — Moving Day') : 'Moving Day',
      tasks: moveTasks,
    })

    if (afterTasks.length) {
      buckets.push({ key: 'after-move', label: 'After the Move', tasks: afterTasks })
    }

    return { checklist: buckets, mode: 'compressed' }
  }

  // Normal mode: assign to calendar months, skip past months
  const tasksByMonth = {}
  const todayYM = today.getFullYear() * 12 + today.getMonth()

  allTasks.forEach(task => {
    const taskDate = new Date(moveDate)
    taskDate.setMonth(taskDate.getMonth() - task.monthsBefore)

    const year = taskDate.getFullYear()
    const month = taskDate.getMonth()

    if (year * 12 + month < todayYM) return

    const key = `${year}-${String(month + 1).padStart(2, '0')}`
    if (!tasksByMonth[key]) tasksByMonth[key] = { year, month, tasks: [] }
    tasksByMonth[key].tasks.push(fill(task))
  })

  const checklist = Object.entries(tasksByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, ...value }))

  return { checklist, mode: 'normal' }
}

export function getMonthLabel(year, month, moveDate) {
  const date = new Date(moveDate + 'T00:00:00')
  const moveYear = date.getFullYear()
  const moveMonth = date.getMonth()

  const diffMonths = (year - moveYear) * 12 + (month - moveMonth)

  const name = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  if (diffMonths === 0) return `${name} — Moving Month`
  if (diffMonths > 0) return `${name} — After the Move`
  if (diffMonths === -1) return `${name} — 1 Month Before`
  return `${name} — ${Math.abs(diffMonths)} Months Before`
}
