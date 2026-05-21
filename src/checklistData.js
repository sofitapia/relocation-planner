// Each task has: id, category, label, monthsBefore (months before moving date to assign it)
// monthsBefore: 3 means "assign to the month that is 3 months before the move"

export const CATEGORIES = {
  Admin: { color: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', icon: '📋' },
  Packing: { color: 'amber', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', icon: '📦' },
  Social: { color: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', icon: '🤝' },
  Explore: { color: 'green', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-700', icon: '🗺️' },
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

export function generateChecklist(movingDate, destination) {
  const moveDate = new Date(movingDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build a map of monthsBefore -> tasks
  const tasksByMonth = {}

  TASKS.forEach((task) => {
    const taskDate = new Date(moveDate)
    taskDate.setMonth(taskDate.getMonth() - task.monthsBefore)

    // Get the year-month key (e.g., "2025-03")
    const year = taskDate.getFullYear()
    const month = taskDate.getMonth()
    const key = `${year}-${String(month + 1).padStart(2, '0')}`

    if (!tasksByMonth[key]) {
      tasksByMonth[key] = { year, month, tasks: [] }
    }

    tasksByMonth[key].tasks.push({
      ...task,
      label: task.label.replace(/{destination}/g, destination || 'your new city'),
    })
  })

  // Sort months chronologically
  const sorted = Object.entries(tasksByMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => ({ key, ...value }))

  return sorted
}

export function getMonthLabel(year, month, moveDate) {
  const date = new Date(moveDate)
  const moveYear = date.getFullYear()
  const moveMonth = date.getMonth()

  const diffMonths = (year - moveYear) * 12 + (month - moveMonth)

  const name = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' })

  if (diffMonths === 0) return `${name} — Moving Month 🚛`
  if (diffMonths > 0) return `${name} — After the Move`
  if (diffMonths === -1) return `${name} — 1 Month Before`
  return `${name} — ${Math.abs(diffMonths)} Months Before`
}
