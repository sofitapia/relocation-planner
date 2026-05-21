import { useState } from 'react'
import { generateChecklist, getMonthLabel, CATEGORIES } from './checklistData'
import './index.css'

function CategoryBadge({ category }) {
  const { badge, icon } = CATEGORIES[category]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${badge}`}>
      {icon} {category}
    </span>
  )
}

function TaskItem({ task, checked, onToggle }) {
  return (
    <li
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${checked ? 'opacity-50' : ''}`}
      onClick={() => onToggle(task.id)}
    >
      <div className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors ${
        checked ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300'
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 flex flex-wrap items-center gap-2">
        <span className={`text-sm text-gray-700 ${checked ? 'line-through text-gray-400' : ''}`}>
          {task.label}
        </span>
        <CategoryBadge category={task.category} />
      </div>
    </li>
  )
}

function MonthCard({ monthData, movingDate, checked, onToggle, activeFilter }) {
  const [open, setOpen] = useState(true)
  const { year, month, tasks } = monthData
  const label = getMonthLabel(year, month, movingDate)

  const filtered = activeFilter ? tasks.filter(t => t.category === activeFilter) : tasks
  const doneCount = filtered.filter(t => checked[t.id]).length
  const allDone = doneCount === filtered.length && filtered.length > 0

  if (filtered.length === 0) return null

  return (
    <div className={`rounded-2xl border transition-all ${allDone ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'} shadow-sm`}>
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <h2 className="text-base font-semibold text-gray-900">{label}</h2>
          <p className="text-xs text-gray-500 mt-0.5">{doneCount}/{filtered.length} tasks done</p>
        </div>
        <div className="flex items-center gap-3">
          {allDone && <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Complete ✓</span>}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <ul className="px-4 pb-4 divide-y divide-gray-50">
          {filtered.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              checked={!!checked[task.id]}
              onToggle={onToggle}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

function PlannerForm({ onGenerate }) {
  const [destination, setDestination] = useState('')
  const [movingDate, setMovingDate] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = (e) => {
    e.preventDefault()
    if (destination && movingDate) onGenerate(destination.trim(), movingDate)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏡</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Relocation Planner</h1>
          <p className="text-gray-500">Get a personalized month-by-month moving checklist</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Where are you moving to?
            </label>
            <input
              type="text"
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Barcelona, Spain"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              When is your moving date?
            </label>
            <input
              type="date"
              value={movingDate}
              onChange={e => setMovingDate(e.target.value)}
              min={today}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
          >
            Generate My Checklist →
          </button>
        </form>
      </div>
    </div>
  )
}

export default function App() {
  const [plan, setPlan] = useState(null)
  const [checked, setChecked] = useState({})
  const [activeFilter, setActiveFilter] = useState(null)

  const handleGenerate = (destination, movingDate) => {
    const checklist = generateChecklist(movingDate, destination)
    setPlan({ destination, movingDate, checklist })
    setChecked({})
    setActiveFilter(null)
  }

  const handleToggle = (id) => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!plan) return <PlannerForm onGenerate={handleGenerate} />

  const allTasks = plan.checklist.flatMap(m => m.tasks)
  const filteredTasks = activeFilter ? allTasks.filter(t => t.category === activeFilter) : allTasks
  const totalDone = filteredTasks.filter(t => checked[t.id]).length
  const progress = filteredTasks.length > 0 ? Math.round((totalDone / filteredTasks.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Moving to {plan.destination}</h1>
            <p className="text-xs text-gray-500">
              {new Date(plan.movingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setPlan(null)}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← Start over
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">{totalDone} of {filteredTasks.length} tasks done</span>
            <span className="text-xs font-semibold text-indigo-600">{progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeFilter === null ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {Object.entries(CATEGORIES).map(([cat, { icon, badge }]) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(prev => prev === cat ? null : cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === cat ? badge + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {icon} {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {plan.checklist.map(monthData => (
          <MonthCard
            key={monthData.key}
            monthData={monthData}
            movingDate={plan.movingDate}
            checked={checked}
            onToggle={handleToggle}
            activeFilter={activeFilter}
          />
        ))}

        {progress === 100 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">🎉</div>
            <p className="text-gray-700 font-semibold">All done! Enjoy {plan.destination}!</p>
          </div>
        )}
      </div>
    </div>
  )
}
