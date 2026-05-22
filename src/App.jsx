import { useState, useEffect } from 'react'
import { generateChecklist, getMonthLabel, CATEGORIES } from './checklistData'
import './index.css'

const COUNTRIES = [
  { name: 'Argentina',            cities: ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'La Plata'] },
  { name: 'Australia',            cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { name: 'Belgium',              cities: ['Brussels', 'Antwerp', 'Ghent', 'Bruges', 'Liège'] },
  { name: 'Brazil',               cities: ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Curitiba'] },
  { name: 'Canada',               cities: ['Toronto', 'Vancouver', 'Montréal', 'Calgary', 'Ottawa'] },
  { name: 'Denmark',              cities: ['Copenhagen', 'Aarhus', 'Odense', 'Aalborg'] },
  { name: 'France',               cities: ['Paris', 'Lyon', 'Marseille', 'Nice', 'Bordeaux'] },
  { name: 'Germany',              cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'] },
  { name: 'Ireland',              cities: ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford'] },
  { name: 'Italy',                cities: ['Rome', 'Milan', 'Florence', 'Naples', 'Turin'] },
  { name: 'Japan',                cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Fukuoka'] },
  { name: 'Mexico',               cities: ['Mexico City', 'Guadalajara', 'Monterrey', 'Cancún', 'Oaxaca'] },
  { name: 'Netherlands',          cities: ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'] },
  { name: 'New Zealand',          cities: ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Dunedin'] },
  { name: 'Norway',               cities: ['Oslo', 'Bergen', 'Trondheim', 'Stavanger', 'Tromsø'] },
  { name: 'Portugal',             cities: ['Lisbon', 'Porto', 'Faro', 'Braga', 'Funchal'] },
  { name: 'Singapore',            cities: ['Singapore'] },
  { name: 'South Africa',         cities: ['Cape Town', 'Johannesburg', 'Durban', 'Pretoria', 'Port Elizabeth'] },
  { name: 'Spain',                cities: ['Barcelona', 'Madrid', 'Valencia', 'Seville', 'Málaga'] },
  { name: 'Sweden',               cities: ['Stockholm', 'Gothenburg', 'Malmö', 'Uppsala', 'Västerås'] },
  { name: 'Switzerland',          cities: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'] },
  { name: 'Thailand',             cities: ['Bangkok', 'Chiang Mai', 'Phuket', 'Pattaya', 'Khon Kaen'] },
  { name: 'United Arab Emirates', cities: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman'] },
  { name: 'United Kingdom',       cities: ['London', 'Manchester', 'Edinburgh', 'Bristol', 'Birmingham'] },
  { name: 'United States',        cities: ['New York', 'Los Angeles', 'Chicago', 'Miami', 'Austin', 'San Francisco', 'Seattle', 'Boston'] },
]

// Passport countries — all 27 EU members + major non-EU countries, alphabetical
const PASSPORT_COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Bulgaria',
  'Canada', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy',
  'Japan', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Mexico',
  'Netherlands', 'New Zealand', 'Norway', 'Poland', 'Portugal', 'Romania',
  'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'Spain', 'Sweden',
  'Switzerland', 'Thailand', 'United Arab Emirates', 'United Kingdom', 'United States',
]

// ─── Shared primitives ────────────────────────────────────────────────────────

const SELECT_CLS = "w-full bg-zinc-800 border border-zinc-600 text-zinc-100 pl-4 pr-10 py-3.5 text-sm focus:outline-none focus:border-[#c8ff00] transition-colors appearance-none cursor-pointer"
const LABEL_CLS  = "block text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3"

function Chevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

// ─── Onboarding steps ─────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 'origin',
    title: 'Where are you moving from?',
    subtitle: "We'll generate your departure admin tasks based on this.",
    type: 'location',
    countryKey: 'originCountry',
    cityKey: 'originCity',
    validate: a => a.originCountry && a.originCity,
  },
  {
    id: 'destination',
    title: 'Where are you moving to?',
    subtitle: "Your arrival tasks and timeline are built around this.",
    type: 'location',
    countryKey: 'destCountry',
    cityKey: 'destCity',
    validate: a => a.destCountry && a.destCity,
  },
  {
    id: 'movingDate',
    title: 'When is your moving date?',
    subtitle: 'Your entire checklist timeline is built around this.',
    type: 'date',
    validate: a => !!a.movingDate,
  },
  {
    id: 'nationality',
    title: 'What is your nationality?',
    subtitle: 'This affects your visa and immigration requirements.',
    type: 'nationality',
    validate: a => !!a.nationality,
  },
  {
    id: 'passports',
    title: 'What passports do you hold?',
    subtitle: 'Select all that apply. Multiple passports can open very different options.',
    type: 'passports',
    optional: true,
    validate: () => true,
  },
  {
    id: 'timeInOrigin',
    title: 'How long have you lived in your origin country?',
    subtitle: null,
    type: 'radio',
    options: [
      { label: 'Less than 1 year',  value: 'lt1' },
      { label: '1–3 years',          value: '1-3' },
      { label: '3–5 years',          value: '3-5' },
      { label: '5–10 years',         value: '5-10' },
      { label: '10+ years',          value: '10+' },
      { label: 'My whole life',      value: 'lifetime' },
    ],
    validate: a => !!a.timeInOrigin,
  },
  {
    id: 'isHometown',
    title: 'Is the destination your hometown?',
    subtitle: "If so, we'll skip the 'discover the city' tasks.",
    type: 'radio',
    options: [
      { label: 'Yes, I grew up there',  value: 'yes' },
      { label: "No, it's new to me",    value: 'no' },
    ],
    validate: a => !!a.isHometown,
  },
  {
    id: 'firstTimeAbroad',
    title: 'Is this your first time moving abroad?',
    subtitle: null,
    type: 'radio',
    options: [
      { label: 'Yes',                         value: 'yes' },
      { label: "No, I've done this before",   value: 'no' },
    ],
    validate: a => !!a.firstTimeAbroad,
  },
  {
    id: 'workStatus',
    title: 'Are you moving for work?',
    subtitle: null,
    type: 'radio',
    options: [
      { label: 'Yes — job secured, moving for a specific role', value: 'secured' },
      { label: 'Will look for work after arriving',              value: 'searching' },
      { label: 'Not working (student, retired, other)',          value: 'not-working' },
    ],
    validate: a => !!a.workStatus,
  },
  {
    id: 'travelingWith',
    title: 'Are you moving alone or with others?',
    subtitle: "We'll add relevant tasks for your situation.",
    type: 'radio',
    options: [
      { label: 'Alone',                        value: 'alone' },
      { label: 'With a partner',               value: 'partner' },
      { label: 'With family (children)',        value: 'family' },
      { label: 'With a partner and children',  value: 'partner-family' },
    ],
    validate: a => !!a.travelingWith,
  },
]

// ─── Onboarding sub-components ────────────────────────────────────────────────

function LocationInput({ countryKey, cityKey, answers, setAnswers }) {
  const country = answers[countryKey]
  const cities = COUNTRIES.find(c => c.name === country)?.cities ?? []
  return (
    <div className="space-y-6">
      <div>
        <label className={LABEL_CLS}>Country</label>
        <div className="relative">
          <select
            value={country}
            onChange={e => setAnswers(a => ({ ...a, [countryKey]: e.target.value, [cityKey]: '' }))}
            className={SELECT_CLS}
          >
            <option value="">Select a country</option>
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <Chevron />
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>City or Region</label>
        <div className="relative">
          <select
            value={answers[cityKey]}
            onChange={e => setAnswers(a => ({ ...a, [cityKey]: e.target.value }))}
            disabled={!country}
            className={SELECT_CLS + (!country ? ' opacity-40 cursor-not-allowed' : '')}
          >
            <option value="">{country ? 'Select a city' : 'Select a country first'}</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Chevron />
        </div>
      </div>
    </div>
  )
}

function RadioInput({ step, answers, onSelect }) {
  const current = answers[step.id]
  return (
    <ul className="space-y-3">
      {step.options.map(opt => (
        <li key={opt.value}>
          <button
            onClick={() => onSelect(opt.value)}
            className={`w-full text-left px-5 py-4 border text-sm font-medium transition-all ${
              current === opt.value
                ? 'border-[#c8ff00] text-[#c8ff00] bg-[#c8ff00]/5'
                : 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'
            }`}
          >
            {opt.label}
          </button>
        </li>
      ))}
    </ul>
  )
}

function PassportMultiSelect({ selected, onChange }) {
  const toggle = country => {
    if (selected.includes(country)) {
      onChange(selected.filter(c => c !== country))
    } else {
      onChange([...selected, country])
    }
  }

  return (
    <div>
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map(c => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className="text-[10px] font-bold uppercase tracking-widest bg-[#c8ff00] text-black px-2.5 py-1 hover:bg-red-400 hover:text-white transition-colors"
            >
              {c} ×
            </button>
          ))}
        </div>
      )}

      {/* Scrollable country list */}
      <div className="border border-zinc-600 overflow-y-auto max-h-64">
        {PASSPORT_COUNTRIES.map(c => {
          const isSelected = selected.includes(c)
          return (
            <button
              key={c}
              onClick={() => toggle(c)}
              className={`w-full text-left px-4 py-3 border-b border-zinc-800 last:border-0 text-sm transition-colors flex items-center justify-between ${
                isSelected
                  ? 'bg-[#c8ff00]/10 text-[#c8ff00]'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              {c}
              {isSelected && (
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Onboarding form ──────────────────────────────────────────────────────────

function OnboardingForm({ onComplete }) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    originCountry: '', originCity: '',
    destCountry: '',   destCity: '',
    movingDate: '',
    nationality: '',
    passports: [],
    timeInOrigin: '',
    isHometown: '',
    firstTimeAbroad: '',
    workStatus: '',
    travelingWith: '',
  })

  const total   = STEPS.length
  const current = STEPS[step]
  const isLast  = step === total - 1
  const canAdvance = current.validate(answers)

  const advance = (updatedAnswers = answers) => {
    if (isLast) {
      onComplete(updatedAnswers)
    } else {
      setStep(s => s + 1)
    }
  }

  // Radio steps auto-advance on selection
  const handleRadioSelect = value => {
    const updated = { ...answers, [current.id]: value }
    setAnswers(updated)
    setTimeout(() => advance(updated), 180)
  }

  const today = new Date().toISOString().split('T')[0]
  const progress = ((step + 1) / total) * 100

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      {/* Progress bar */}
      <div className="px-8 pt-8 pb-0 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
            {step + 1} / {total}
          </span>
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="text-[10px] text-zinc-600 hover:text-zinc-300 uppercase tracking-widest font-bold transition-colors"
            >
              Back
            </button>
          )}
        </div>
        <div className="h-px bg-zinc-800">
          <div
            className="h-px bg-[#c8ff00] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question + input */}
      <div className="flex-1 flex flex-col px-8 pt-10 pb-10 max-w-lg mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-3xl font-black text-zinc-50 leading-tight tracking-tight mb-3">
            {current.title}
          </h2>
          {current.subtitle && (
            <p className="text-sm text-zinc-500 leading-relaxed">{current.subtitle}</p>
          )}
        </div>

        <div className="flex-1">
          {current.type === 'location' && (
            <LocationInput
              countryKey={current.countryKey}
              cityKey={current.cityKey}
              answers={answers}
              setAnswers={setAnswers}
            />
          )}

          {current.type === 'date' && (
            <input
              type="date"
              value={answers.movingDate}
              onChange={e => setAnswers(a => ({ ...a, movingDate: e.target.value }))}
              min={today}
              style={{ colorScheme: 'dark' }}
              className="w-full bg-zinc-800 border border-zinc-600 text-zinc-100 px-4 py-3.5 text-sm focus:outline-none focus:border-[#c8ff00] transition-colors cursor-pointer"
            />
          )}

          {current.type === 'nationality' && (
            <div className="relative">
              <select
                value={answers.nationality}
                onChange={e => setAnswers(a => ({ ...a, nationality: e.target.value }))}
                className={SELECT_CLS}
              >
                <option value="">Select a country</option>
                {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <Chevron />
            </div>
          )}

          {current.type === 'passports' && (
            <div>
              <PassportMultiSelect
                selected={answers.passports}
                onChange={val => setAnswers(a => ({ ...a, passports: val }))}
              />
              {current.optional && (
                <button
                  onClick={() => advance()}
                  className="mt-4 text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest font-bold transition-colors"
                >
                  Skip this question
                </button>
              )}
            </div>
          )}

          {current.type === 'radio' && (
            <RadioInput step={current} answers={answers} onSelect={handleRadioSelect} />
          )}
        </div>

        {/* Next/Generate button — not shown for radio (auto-advances) */}
        {current.type !== 'radio' && (
          <div className="pt-10">
            <button
              onClick={() => advance()}
              disabled={!canAdvance}
              className={`w-full py-4 font-black text-sm uppercase tracking-widest transition-all ${
                canAdvance
                  ? 'bg-[#c8ff00] text-black hover:bg-[#d4ff33] active:scale-[0.99]'
                  : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
              }`}
            >
              {isLast ? 'Generate My Checklist' : 'Next'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Checklist components ─────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  return (
    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-600 whitespace-nowrap flex-shrink-0">
      {category}
    </span>
  )
}

function TaskItem({ task, checked, onToggle }) {
  return (
    <li
      className="flex items-start gap-4 py-4 border-b border-zinc-800 last:border-0 cursor-pointer group"
      onClick={() => onToggle(task.id)}
    >
      <div className={`mt-0.5 w-4 h-4 flex-shrink-0 border flex items-center justify-center transition-colors ${
        checked
          ? 'bg-[#c8ff00] border-[#c8ff00]'
          : 'border-zinc-700 group-hover:border-zinc-400'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 flex items-baseline justify-between gap-4 min-w-0">
        <span className={`text-sm leading-relaxed transition-colors ${
          checked ? 'line-through text-zinc-600' : 'text-zinc-200'
        }`}>
          {task.label}
        </span>
        <CategoryBadge category={task.category} />
      </div>
    </li>
  )
}

function UrgencyBanner({ movingDate }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const moveDate = new Date(movingDate + 'T00:00:00')
  const days = Math.ceil((moveDate - today) / (1000 * 60 * 60 * 24))

  let message, critical = false
  if (days <= 0) {
    critical = true
    message = days === 0
      ? "Today is moving day."
      : `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} since the move — time to settle in.`
  } else if (days <= 7) {
    critical = true
    message = `${days} day${days === 1 ? '' : 's'} left. Focus on essentials only.`
  } else if (days <= 14) {
    message = `${days} days left. Time to accelerate.`
  } else if (days <= 30) {
    message = `${days} days left. Stay on schedule.`
  } else if (days <= 60) {
    message = `${days} days left. Start now.`
  } else {
    return null
  }

  return (
    <div className={critical ? 'bg-[#c8ff00]' : 'border-b border-zinc-800'}>
      <div className="max-w-2xl mx-auto px-6 py-2.5">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${critical ? 'text-black' : 'text-[#c8ff00]'}`}>
          {message}
        </p>
      </div>
    </div>
  )
}

function MonthCard({ monthData, movingDate, checked, onToggle, activeFilter }) {
  const [open, setOpen] = useState(true)
  const { year, month, tasks, label: customLabel } = monthData
  const label = customLabel ?? getMonthLabel(year, month, movingDate)

  const filtered = activeFilter ? tasks.filter(t => t.category === activeFilter) : tasks
  const doneCount = filtered.filter(t => checked[t.id]).length
  const allDone = doneCount === filtered.length && filtered.length > 0

  if (filtered.length === 0) return null

  return (
    <div className={`transition-opacity ${allDone ? 'opacity-40' : ''}`}>
      <button
        className="w-full flex items-center justify-between py-5 text-left border-t border-zinc-800"
        onClick={() => setOpen(o => !o)}
      >
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300">{label}</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-1">
            {doneCount}/{filtered.length} tasks
            {allDone && <span className="text-[#c8ff00] ml-2">— Done</span>}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-zinc-600 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <ul className="pb-2">
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

// ─── App ──────────────────────────────────────────────────────────────────────

function contextSummary(answers) {
  if (!answers) return null
  const parts = []
  if (answers.originCity) parts.push(`From ${answers.originCity}`)
  if (answers.workStatus === 'secured')     parts.push('job secured')
  if (answers.workStatus === 'searching')   parts.push('job search on arrival')
  if (answers.workStatus === 'not-working') parts.push('not working')
  if (answers.travelingWith === 'partner')         parts.push('with partner')
  if (answers.travelingWith === 'family')           parts.push('with family')
  if (answers.travelingWith === 'partner-family')   parts.push('with partner & family')
  return parts.length ? parts.join(' · ') : null
}

export default function App() {
  const [plan, setPlan] = useState(() => {
    try {
      const saved = localStorage.getItem('relocation-plan')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem('relocation-checked')
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })
  const [activeFilter, setActiveFilter] = useState(null)

  useEffect(() => {
    if (plan) localStorage.setItem('relocation-plan', JSON.stringify(plan))
    else localStorage.removeItem('relocation-plan')
  }, [plan])

  useEffect(() => {
    localStorage.setItem('relocation-checked', JSON.stringify(checked))
  }, [checked])

  const handleGenerate = answers => {
    const { checklist, mode } = generateChecklist(answers)
    const destination = `${answers.destCity}, ${answers.destCountry}`
    setPlan({ destination, movingDate: answers.movingDate, checklist, mode, answers })
    setChecked({})
    setActiveFilter(null)
  }

  const handleToggle = id => {
    setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (!plan) return <OnboardingForm onComplete={handleGenerate} />

  const allTasks = plan.checklist.flatMap(m => m.tasks)
  const filteredTasks = activeFilter ? allTasks.filter(t => t.category === activeFilter) : allTasks
  const totalDone = filteredTasks.filter(t => checked[t.id]).length
  const progress = filteredTasks.length > 0 ? Math.round((totalDone / filteredTasks.length) * 100) : 0

  const isMexicoCity = plan.destination.toLowerCase().includes('mexico city')
  const heroImage = isMexicoCity
    ? 'https://images.unsplash.com/photo-1547995886-6dc09384c6e6?w=1600&q=80&auto=format&fit=crop'
    : null
  const summary = contextSummary(plan.answers)

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="bg-[#0f0f0f] border-b border-zinc-800 sticky top-0 z-10">

        {heroImage ? (
          <div
            className="relative"
            style={{ backgroundImage: `url('${heroImage}')`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }}
          >
            <div className="absolute inset-0 bg-black/60" />
            <div className="relative max-w-2xl mx-auto px-6 pt-10 pb-7 flex items-end justify-between">
              <div>
                <h1 className="text-5xl font-black text-white leading-[0.95] tracking-tight">
                  {plan.destination}
                </h1>
                <p className="text-[10px] text-zinc-400 mt-3 uppercase tracking-widest">
                  {new Date(plan.movingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  {summary && <span className="ml-3 text-zinc-500">{summary}</span>}
                </p>
              </div>
              <button
                onClick={() => { setPlan(null); setChecked({}); setActiveFilter(null) }}
                className="text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-widest transition-colors mb-1"
              >
                Start over
              </button>
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-6 pt-5 pb-4 flex items-start justify-between">
            <div>
              <h1 className="text-lg font-black text-zinc-50 leading-tight tracking-tight">
                {plan.destination}
              </h1>
              <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-widest">
                {new Date(plan.movingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {summary && <span className="ml-3">{summary}</span>}
              </p>
            </div>
            <button
              onClick={() => { setPlan(null); setChecked({}); setActiveFilter(null) }}
              className="text-[10px] text-zinc-600 hover:text-zinc-300 font-bold uppercase tracking-widest transition-colors mt-1"
            >
              Start over
            </button>
          </div>
        )}

        <div className="max-w-2xl mx-auto px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-600 uppercase tracking-widest">
              {totalDone} / {filteredTasks.length} tasks
            </span>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{progress}%</span>
          </div>
          <div className="h-px bg-zinc-800">
            <div
              className="h-px bg-[#c8ff00] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <UrgencyBanner movingDate={plan.movingDate} />

        <div className="max-w-2xl mx-auto px-6 pt-4 pb-4 flex gap-8">
          {['All', ...Object.keys(CATEGORIES)].map(cat => {
            const isActive = cat === 'All' ? activeFilter === null : activeFilter === cat
            return (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat === 'All' ? null : prev => prev === cat ? null : cat)}
                className={`text-[10px] font-bold uppercase tracking-widest py-1 transition-colors border-b-2 ${
                  isActive
                    ? 'text-[#c8ff00] border-[#c8ff00]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 pb-20">
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
          <div className="pt-16 pb-8 border-t border-zinc-800 mt-4">
            <p className="text-2xl font-black text-zinc-50 tracking-tight">All done.</p>
            <p className="text-zinc-600 text-sm mt-1">Enjoy {plan.destination}.</p>
          </div>
        )}
      </div>
    </div>
  )
}
