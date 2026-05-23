import { useState, useEffect } from 'react'
import { generateChecklist, getMonthLabel, CATEGORIES } from './checklistData'
import { generateWithClaude, testApiKey } from './claudeApi'
import './index.css'

// ─── Data ─────────────────────────────────────────────────────────────────────

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

const PASSPORT_COUNTRIES = [
  'Argentina', 'Australia', 'Austria', 'Belgium', 'Brazil', 'Bulgaria',
  'Canada', 'Croatia', 'Cyprus', 'Czech Republic', 'Denmark', 'Estonia',
  'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Ireland', 'Italy',
  'Japan', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Mexico',
  'Netherlands', 'New Zealand', 'Norway', 'Poland', 'Portugal', 'Romania',
  'Singapore', 'Slovakia', 'Slovenia', 'South Africa', 'Spain', 'Sweden',
  'Switzerland', 'Thailand', 'United Arab Emirates', 'United Kingdom', 'United States',
]

const CITY_IMAGES = {
  'amsterdam':   'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=1600&q=80&auto=format&fit=crop',
  'barcelona':   'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1600&q=80&auto=format&fit=crop',
  'paris':       'https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=1600&q=80&auto=format&fit=crop',
  'tokyo':       'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=1600&q=80&auto=format&fit=crop',
  'london':      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1600&q=80&auto=format&fit=crop',
  'mexico city': 'https://images.unsplash.com/photo-1547995886-6dc09384c6e6?w=1600&q=80&auto=format&fit=crop',
}

// ─── Step helpers ─────────────────────────────────────────────────────────────

// Resolve a field that may be a string or a function of answers
const res = (field, answers) => typeof field === 'function' ? field(answers) : field

// Find the next step index that should not be skipped
function getNextStep(fromIdx, answers) {
  let i = fromIdx + 1
  while (i < STEPS.length && STEPS[i].shouldSkip?.(answers)) i++
  return i
}

// Find the previous step index that should not be skipped
function getPrevStep(fromIdx, answers) {
  let i = fromIdx - 1
  while (i >= 0 && STEPS[i].shouldSkip?.(answers)) i--
  return i
}

// Apply answer auto-sets triggered by the step just completed
function applyAutoSets(stepId, answers) {
  const updated = { ...answers }

  if (stepId === 'timeInOrigin' && answers.timeInOrigin === 'lifetime') {
    // Lived whole life in origin → logically impossible to also be returning to a hometown
    // and this must be their first international move
    updated.isHometown = 'no'
    updated.firstTimeAbroad = 'yes'
  }

  if (stepId === 'isHometown' && answers.isHometown === 'yes') {
    // Destination is hometown → they've clearly moved internationally before
    updated.firstTimeAbroad = 'no'
  }

  if (stepId === 'isHometown' && answers.isHometown === 'no') {
    // Clear any stale hometownYearsAgo answer from a previous 'yes' selection
    updated.hometownYearsAgo = ''
  }

  return updated
}

// ─── Onboarding steps ─────────────────────────────────────────────────────────

const STEPS = [
  // Hero search — origin, destination and date in one screen
  {
    id: 'hero',
    type: 'hero-search',
    hideFromProgress: true,
    validate: a => {
      if (!a.originCountry || !a.originCity) return false
      if (!a.destCountry   || !a.destCity)   return false
      if (!a.movingDate) return false
      if (a.destCity === a.originCity && a.destCountry === a.originCountry) {
        return 'Origin and destination cannot be the same city. Please choose a different destination.'
      }
      return true
    },
  },
  // 2
  {
    id: 'nationality',
    title: 'What is your nationality?',
    subtitle: 'This affects your visa and immigration requirements.',
    type: 'nationality',
    validate: a => !!a.nationality,
  },
  // 5
  {
    id: 'passports',
    title: 'What passports do you hold?',
    subtitle: 'Select all that apply. Multiple passports can open very different options.',
    type: 'passports', optional: true,
    validate: () => true,
  },
  // 6
  {
    id: 'timeInOrigin',
    title: a => a.originCity ? `How long have you lived in ${a.originCity}?` : 'How long have you lived in your origin country?',
    subtitle: null, type: 'radio',
    options: [
      { label: 'Less than 1 year', value: 'lt1' },
      { label: '1–3 years',         value: '1-3' },
      { label: '3–5 years',         value: '3-5' },
      { label: '5–10 years',        value: '5-10' },
      { label: '10+ years',         value: '10+' },
      { label: 'My whole life',     value: 'lifetime' },
    ],
    validate: a => !!a.timeInOrigin,
  },
  // 7 — skipped when timeInOrigin is 'lifetime' (can't have a hometown elsewhere if you've never left)
  {
    id: 'isHometown',
    title: a => a.destCity ? `Is ${a.destCity} your hometown?` : 'Is the destination your hometown?',
    subtitle: a => a.timeInOrigin === '10+'
      ? `You've been in ${a.originCity || 'your origin city'} a long time — is ${a.destCity || 'the destination'} where you originally grew up?`
      : "If so, we'll skip the 'discover the city' tasks and ask what you're returning to.",
    type: 'radio',
    shouldSkip: a => a.timeInOrigin === 'lifetime',
    options: [
      { label: 'Yes, I grew up there', value: 'yes' },
      { label: "No, it's new to me",   value: 'no' },
    ],
    validate: a => a.timeInOrigin === 'lifetime' || !!a.isHometown,
  },
  // 8 — only shown when isHometown = yes
  {
    id: 'hometownYearsAgo',
    title: a => `How long did you live in ${a.destCity || 'your hometown'} before leaving?`,
    subtitle: "This helps us understand what you're returning to.",
    type: 'radio',
    shouldSkip: a => a.isHometown !== 'yes',
    options: [
      { label: 'Less than 5 years',              value: 'lt5' },
      { label: '5–10 years',                      value: '5-10' },
      { label: '10–18 years — grew up there',     value: '10-18' },
      { label: 'Most of my life',                 value: 'most' },
    ],
    validate: a => a.isHometown !== 'yes' || !!a.hometownYearsAgo,
  },
  // 9 — skipped when isHometown=yes (returning home = not first time) or timeInOrigin=lifetime (never left = first time, auto-set)
  {
    id: 'firstTimeAbroad',
    title: 'Is this your first time moving abroad?',
    subtitle: null, type: 'radio',
    shouldSkip: a => a.isHometown === 'yes' || a.timeInOrigin === 'lifetime',
    warning: a => a.timeInOrigin === '10+'
      ? `You've lived in ${a.originCountry || 'your origin country'} for 10+ years — just confirming this is your first international move.`
      : null,
    options: [
      { label: 'Yes',                       value: 'yes' },
      { label: "No, I've done this before", value: 'no' },
    ],
    validate: a => a.isHometown === 'yes' || a.timeInOrigin === 'lifetime' || !!a.firstTimeAbroad,
  },
  // 10
  {
    id: 'workStatus',
    title: 'Are you moving for work?',
    subtitle: a => a.originCountry === a.destCountry ? 'Since this is a domestic move, this affects your relocation timeline.' : null,
    type: 'radio',
    options: [
      { label: 'Yes — job secured, moving for a specific role', value: 'secured' },
      { label: 'Will look for work after arriving',              value: 'searching' },
      { label: 'Not working (student, retired, other)',          value: 'not-working' },
    ],
    validate: a => !!a.workStatus,
  },
  // 11
  {
    id: 'travelingWith',
    title: 'Are you moving alone or with others?',
    subtitle: "We'll add relevant tasks for your situation.",
    type: 'radio',
    options: [
      { label: 'Alone',                       value: 'alone' },
      { label: 'With a partner',              value: 'partner' },
      { label: 'With family (children)',       value: 'family' },
      { label: 'With a partner and children', value: 'partner-family' },
    ],
    validate: a => !!a.travelingWith,
  },
  // 12 — section break
  {
    id: 'lifeSection',
    title: 'Your life there.',
    subtitle: a => `The logistics are covered. Now let's make sure you can rebuild the life you love in ${a.destCity || 'your new city'}.`,
    type: 'section-intro',
    validate: () => true,
  },
  // 13
  {
    id: 'fitnessHabits',
    title: 'What does your fitness routine look like?',
    subtitle: a => `Select everything that applies — we'll find the spots in ${a.destCity || 'your new city'}.`,
    type: 'multiselect', validate: () => true,
    options: [
      { label: 'Gym',            value: 'gym' },
      { label: 'Running',        value: 'running' },
      { label: 'Cycling',        value: 'cycling' },
      { label: 'Swimming',       value: 'swimming' },
      { label: 'Team sports',    value: 'team-sports' },
      { label: 'Climbing',       value: 'climbing' },
      { label: 'Yoga / Pilates', value: 'yoga' },
      { label: 'None',           value: 'none' },
    ],
  },
  // 14
  {
    id: 'socialStyle',
    title: 'How would you describe your social life?',
    subtitle: null, type: 'radio',
    options: [
      { label: 'Mostly close friends — quality over quantity',     value: 'close-friends' },
      { label: 'Big social circle — I thrive with lots of people', value: 'big-circle' },
      { label: 'Mix of both',                                       value: 'mixed' },
      { label: 'Mostly family',                                     value: 'family-focused' },
      { label: "Still building my social life",                     value: 'building' },
    ],
    validate: a => !!a.socialStyle,
  },
  // 15
  {
    id: 'foodHabits',
    title: 'What are your food habits?',
    subtitle: a => `We'll help you find your favourites in ${a.destCity || 'the new city'}.`,
    type: 'multiselect', validate: () => true,
    options: [
      { label: 'Love eating out at restaurants', value: 'restaurants' },
      { label: 'Prefer cooking at home',          value: 'home-cooking' },
      { label: 'Farmers markets / fresh produce', value: 'farmers-markets' },
      { label: 'Coffee shops as my workspace',    value: 'coffee-shops' },
      { label: 'Always trying new cuisines',      value: 'new-cuisines' },
    ],
  },
  // 16
  {
    id: 'hobbies',
    title: 'What are your hobbies and interests?',
    subtitle: null, type: 'multiselect', validate: () => true,
    options: [
      { label: 'Music — gigs, concerts, live venues', value: 'music' },
      { label: 'Art and museums',                      value: 'art-museums' },
      { label: 'Volunteering',                          value: 'volunteering' },
      { label: 'Nightlife',                             value: 'nightlife' },
      { label: 'Nature and hiking',                    value: 'nature-hiking' },
      { label: 'Reading and bookshops',                value: 'reading' },
      { label: 'Gaming',                               value: 'gaming' },
      { label: 'Theatre and performing arts',          value: 'theatre' },
    ],
  },
  // 17
  {
    id: 'priorities',
    title: 'What matters most to you in the new place?',
    subtitle: "Select everything that applies.",
    type: 'multiselect', validate: () => true,
    options: [
      { label: 'Building my career',      value: 'building-career' },
      { label: 'Finding community',        value: 'finding-community' },
      { label: 'Exploring the city',       value: 'exploring-city' },
      { label: 'Establishing my routine', value: 'establishing-routine' },
      { label: 'Family life',             value: 'family-life' },
    ],
  },
]

// ─── Shared input styles ──────────────────────────────────────────────────────

const SELECT_CLS = "w-full bg-white border border-rule text-ink pl-4 pr-10 py-3.5 text-sm focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer"
const LABEL_CLS  = "block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute mb-2.5"
const SERIF      = "font-['Playfair_Display']"

// ─── Shared primitives ────────────────────────────────────────────────────────

function Chevron() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-ink-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

function ChevronSmall() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
      <svg className="w-3.5 h-3.5 text-ink-mute" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}

function NextButton({ onClick, disabled, label = 'Next' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 font-semibold text-sm uppercase tracking-[0.14em] transition-all active:scale-[0.99] ${
        disabled
          ? 'bg-rule text-ink-mute cursor-not-allowed'
          : 'bg-ink text-cream hover:bg-ink-mid'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Onboarding sub-components ────────────────────────────────────────────────

function LocationInput({ countryKey, cityKey, answers, setAnswers }) {
  const country = answers[countryKey]
  const cities = COUNTRIES.find(c => c.name === country)?.cities ?? []
  return (
    <div className="space-y-6">
      <div>
        <label className={LABEL_CLS}>Country</label>
        <div className="relative">
          <select value={country} onChange={e => setAnswers(a => ({ ...a, [countryKey]: e.target.value, [cityKey]: '' }))} className={SELECT_CLS}>
            <option value="">Select a country</option>
            {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
          <Chevron />
        </div>
      </div>
      <div>
        <label className={LABEL_CLS}>City or Region</label>
        <div className="relative">
          <select value={answers[cityKey]} onChange={e => setAnswers(a => ({ ...a, [cityKey]: e.target.value }))} disabled={!country} className={SELECT_CLS + (!country ? ' opacity-40 cursor-not-allowed' : '')}>
            <option value="">{country ? 'Select a city' : 'Select a country first'}</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <Chevron />
        </div>
      </div>
    </div>
  )
}

function RadioInput({ step, answers, setAnswers }) {
  const current = answers[step.id]
  return (
    <ul className="space-y-2.5">
      {step.options.map(opt => (
        <li key={opt.value}>
          <button type="button" onClick={() => setAnswers(a => ({ ...a, [step.id]: opt.value }))}
            className={`w-full text-left px-5 py-4 border text-sm transition-all ${
              current === opt.value
                ? 'border-gold text-gold bg-gold/5'
                : 'border-rule text-ink hover:border-ink-mute bg-white'
            }`}>
            {opt.label}
          </button>
        </li>
      ))}
    </ul>
  )
}

// Values that are mutually exclusive with all other selections
const EXCLUSIVE_VALUES = new Set(['none', 'neither'])

function MultiSelectInput({ step, answers, setAnswers }) {
  const selected = answers[step.id] || []
  const toggle = value => {
    let next
    if (EXCLUSIVE_VALUES.has(value)) {
      // 'None'/'Neither': clear everything else, or deselect if already chosen
      next = selected.includes(value) ? [] : [value]
    } else if (selected.includes(value)) {
      // Deselecting a normal option
      next = selected.filter(v => v !== value)
    } else {
      // Selecting a normal option: drop any exclusive value first
      next = [...selected.filter(v => !EXCLUSIVE_VALUES.has(v)), value]
    }
    setAnswers(a => ({ ...a, [step.id]: next }))
  }
  return (
    <ul className="space-y-2.5">
      {step.options.map(opt => {
        const isSelected = selected.includes(opt.value)
        return (
          <li key={opt.value}>
            <button type="button" onClick={() => toggle(opt.value)}
              className={`w-full text-left px-5 py-4 border text-sm transition-all ${
                isSelected
                  ? 'border-gold text-gold bg-gold/5'
                  : 'border-rule text-ink hover:border-ink-mute bg-white'
              }`}>
              {opt.label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function PassportMultiSelect({ selected, onChange }) {
  const toggle = country => onChange(
    selected.includes(country) ? selected.filter(c => c !== country) : [...selected, country]
  )
  return (
    <div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map(c => (
            <button key={c} type="button" onClick={() => toggle(c)}
              className="text-[9px] font-semibold uppercase tracking-[0.12em] bg-gold text-white px-2.5 py-1 hover:bg-ink transition-colors">
              {c} ×
            </button>
          ))}
        </div>
      )}
      <div className="border border-rule overflow-y-auto max-h-64">
        {PASSPORT_COUNTRIES.map(c => {
          const isSelected = selected.includes(c)
          return (
            <button key={c} type="button" onClick={() => toggle(c)}
              className={`w-full text-left px-4 py-3 border-b border-rule last:border-0 text-sm transition-colors flex items-center justify-between ${
                isSelected ? 'bg-gold/10 text-ink font-medium' : 'text-ink hover:bg-surface'
              }`}>
              {c}
              {isSelected && (
                <svg className="w-3.5 h-3.5 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
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

function SettingsScreen({ onClose }) {
  // storedKey = what's currently in localStorage (shown as masked confirmation)
  // newKey    = what the user is typing to replace/add
  const [storedKey, setStoredKey] = useState(() => localStorage.getItem('claude-api-key') || '')
  const [newKey, setNewKey]       = useState('')
  const [testStatus, setTestStatus] = useState(null) // null | 'testing' | 'ok' | 'error'
  const [testMsg, setTestMsg]     = useState('')

  // The key to test: prefer what's typed; fall back to stored
  const activeKey = newKey.trim() || storedKey

  const save = () => {
    const trimmed = newKey.trim()
    if (!trimmed) return
    localStorage.setItem('claude-api-key', trimmed)
    setStoredKey(trimmed)
    setNewKey('')
    setTestStatus(null)
  }

  const remove = () => {
    localStorage.removeItem('claude-api-key')
    setStoredKey('')
    setNewKey('')
    setTestStatus(null)
  }

  const test = async () => {
    if (!activeKey) return
    setTestStatus('testing')
    setTestMsg('')
    try {
      await testApiKey(activeKey)
      // Key works — if it was a newly typed key, save it automatically
      if (newKey.trim()) {
        localStorage.setItem('claude-api-key', newKey.trim())
        setStoredKey(newKey.trim())
        setNewKey('')
      }
      setTestStatus('ok')
    } catch (err) {
      setTestStatus('error')
      const msg = err.message || ''
      setTestMsg(
        msg.includes('401') || msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('invalid')
          ? 'Invalid API key — double-check it at console.anthropic.com'
          : msg.slice(0, 140) || 'Connection failed. Check your network.'
      )
    }
  }

  const maskKey = k => k.length > 8 ? `${k.slice(0, 8)}...` : k

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <div className="px-8 pt-8 pb-0 max-w-lg mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h1 className={`${SERIF} text-2xl font-medium text-ink`}>Settings</h1>
          <button type="button" onClick={onClose}
            className="text-[10px] text-ink-mute hover:text-ink-mid uppercase tracking-[0.14em] font-medium transition-colors">
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 px-8 max-w-lg mx-auto w-full space-y-6">

        {/* Stored key status */}
        {storedKey ? (
          <div className="flex items-center justify-between px-4 py-3 bg-gold/10 border border-gold/30">
            <div>
              <p className="text-[10px] text-ink-mute uppercase tracking-[0.12em] font-semibold mb-0.5">Key stored</p>
              <p className="text-sm font-mono text-ink">{maskKey(storedKey)}</p>
            </div>
            <button type="button" onClick={remove}
              className="text-[10px] text-ink-mute hover:text-red-600 uppercase tracking-[0.12em] font-medium transition-colors">
              Remove
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border border-rule">
            <p className="text-xs text-ink-mute">No API key stored — add one below.</p>
          </div>
        )}

        {/* New key input */}
        <div>
          <label className={LABEL_CLS}>{storedKey ? 'Replace with new key' : 'Add Claude API key'}</label>
          <input
            type="password"
            value={newKey}
            onChange={e => { setNewKey(e.target.value); setTestStatus(null) }}
            placeholder="sk-ant-api03-..."
            autoComplete="off"
            className="w-full bg-white border border-rule text-ink px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-colors font-mono"
          />
          <p className="text-[10px] text-ink-mute mt-2 leading-relaxed">
            Stored locally in your browser, sent only to Anthropic.{' '}
            Get a key at <span className="text-ink-mid">console.anthropic.com</span>
          </p>
        </div>

        {/* Test result */}
        {testStatus === 'ok' && (
          <p className="text-xs text-gold font-semibold uppercase tracking-[0.1em]">
            Key verified — working correctly
          </p>
        )}
        {testStatus === 'error' && (
          <p className="text-xs text-red-600 leading-relaxed">{testMsg}</p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={test}
            disabled={!activeKey || testStatus === 'testing'}
            className={`flex-1 py-3.5 font-semibold text-sm uppercase tracking-[0.14em] border transition-all ${
              activeKey && testStatus !== 'testing'
                ? 'border-ink text-ink hover:bg-ink hover:text-cream'
                : 'border-rule text-ink-mute cursor-not-allowed'
            }`}
          >
            {testStatus === 'testing' ? 'Testing...' : 'Test Key'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!newKey.trim()}
            className={`flex-1 py-3.5 font-semibold text-sm uppercase tracking-[0.14em] transition-all ${
              newKey.trim()
                ? 'bg-ink text-cream hover:bg-ink-mid active:scale-[0.99]'
                : 'bg-rule text-ink-mute cursor-not-allowed'
            }`}
          >
            Save Key
          </button>
        </div>

        {/* Info */}
        <div className="border-t border-rule pt-6 space-y-4">
          <div>
            <p className={`${SERIF} text-sm italic text-ink-mid mb-1.5`}>With a Claude API key</p>
            <p className="text-xs text-ink-mute leading-relaxed">
              Your onboarding answers are sent to Claude to generate a fully personalised, country-specific checklist — real visa requirements, local admin steps, and lifestyle tasks tailored to your destination city.
            </p>
          </div>
          <div>
            <p className={`${SERIF} text-sm italic text-ink-mid mb-1.5`}>Without a key</p>
            <p className="text-xs text-ink-mute leading-relaxed">
              The app uses a template checklist covering the most common tasks, with country-specific rules for the Netherlands pre-loaded.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function GeneratingScreen({ destination }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-8 text-center">
      <p className="text-[10px] text-ink-mute uppercase tracking-[0.2em] font-medium mb-6">
        Generating your checklist
      </p>
      <h1 className={`${SERIF} text-4xl text-ink italic leading-tight mb-8`}>
        {destination}
      </h1>
      <p className="text-sm text-ink-mute mb-10">
        Claude is building your personalised checklist...
      </p>
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
    </div>
  )
}

function HeroSearchStep({ answers, setAnswers, error, onNext, onOpenSettings }) {
  const today = new Date().toISOString().split('T')[0]

  const originCities = COUNTRIES.find(c => c.name === answers.originCountry)?.cities ?? []
  const destCities   = COUNTRIES.find(c => c.name === answers.destCountry)?.cities ?? []

  const destKey  = (answers.destCity || '').toLowerCase()
  const bgImage  = Object.entries(CITY_IMAGES).find(([k]) => destKey.includes(k))?.[1] ?? null
  const hasPhoto = !!bgImage

  const swap = () => setAnswers(a => ({
    ...a,
    originCountry: a.destCountry, originCity: a.destCity,
    destCountry: a.originCountry, destCity: a.originCity,
  }))

  const isDomestic = answers.originCountry && answers.destCountry &&
    answers.originCountry === answers.destCountry &&
    answers.destCity !== answers.originCity

  const selectCls = "w-full bg-white border border-rule text-ink pl-3 pr-7 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors appearance-none cursor-pointer rounded-lg"
  const labelCls  = "block text-[9px] font-bold uppercase tracking-[0.16em] text-ink-mute mb-1.5"

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-5 overflow-hidden">
      {/* Background */}
      {bgImage ? (
        <>
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/50 to-black/70" />
        </>
      ) : (
        <div className="absolute inset-0 bg-cream" />
      )}

      {/* Settings link */}
      <button type="button" onClick={onOpenSettings}
        className={`absolute top-5 right-5 z-10 text-[9px] font-semibold uppercase tracking-[0.14em] transition-colors ${hasPhoto ? 'text-white/60 hover:text-white' : 'text-ink-mute hover:text-ink-mid'}`}>
        Settings
      </button>

      {/* Content */}
      <div className="relative z-10 w-full max-w-3xl lg:max-w-5xl mx-auto">

        {/* Headline */}
        <div className={`text-center mb-8 lg:mb-12 ${hasPhoto ? 'text-white' : 'text-ink'}`}>
          <h1 className={`${SERIF} text-5xl md:text-6xl lg:text-7xl xl:text-8xl italic leading-tight mb-3`}>
            Relocation Planner
          </h1>
          <p className={`text-sm lg:text-base ${hasPhoto ? 'text-white/60' : 'text-ink-mute'}`}>
            Your personalised month-by-month moving checklist
          </p>
        </div>

        {/* Search card */}
        <div className={`rounded-2xl shadow-2xl p-5 lg:p-8 ${hasPhoto ? 'bg-white/95 backdrop-blur-md' : 'bg-white border border-rule'}`}>

          {/* Input row */}
          <div className="flex flex-col md:flex-row md:items-end gap-4">

            {/* FROM */}
            <div className="flex-1 min-w-0">
              <label className={labelCls}>From</label>
              <div className="space-y-2">
                <div className="relative">
                  <select value={answers.originCountry}
                    onChange={e => setAnswers(a => ({ ...a, originCountry: e.target.value, originCity: '' }))}
                    className={selectCls}>
                    <option value="">Country</option>
                    {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <ChevronSmall />
                </div>
                <div className="relative">
                  <select value={answers.originCity}
                    onChange={e => setAnswers(a => ({ ...a, originCity: e.target.value }))}
                    disabled={!answers.originCountry}
                    className={selectCls + (!answers.originCountry ? ' opacity-40 cursor-not-allowed' : '')}>
                    <option value="">{answers.originCountry ? 'City' : '—'}</option>
                    {originCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronSmall />
                </div>
              </div>
            </div>

            {/* Swap button — sits between FROM and TO */}
            <div className="flex justify-center md:pb-1 md:flex-shrink-0">
              <button type="button" onClick={swap}
                className="w-9 h-9 rounded-full border border-rule bg-cream hover:border-gold hover:text-gold text-ink-mute flex items-center justify-center transition-all hover:rotate-180 duration-300"
                title="Swap origin and destination">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* TO */}
            <div className="flex-1 min-w-0">
              <label className={labelCls}>To</label>
              <div className="space-y-2">
                <div className="relative">
                  <select value={answers.destCountry}
                    onChange={e => setAnswers(a => ({ ...a, destCountry: e.target.value, destCity: '' }))}
                    className={selectCls}>
                    <option value="">Country</option>
                    {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <ChevronSmall />
                </div>
                <div className="relative">
                  <select value={answers.destCity}
                    onChange={e => setAnswers(a => ({ ...a, destCity: e.target.value }))}
                    disabled={!answers.destCountry}
                    className={selectCls + (!answers.destCountry ? ' opacity-40 cursor-not-allowed' : '')}>
                    <option value="">{answers.destCountry ? 'City' : '—'}</option>
                    {destCities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronSmall />
                </div>
              </div>
            </div>

            {/* DATE */}
            <div className="md:w-44 md:flex-shrink-0">
              <label className={labelCls}>Moving Date</label>
              <input type="date" value={answers.movingDate}
                onChange={e => setAnswers(a => ({ ...a, movingDate: e.target.value }))}
                min={today} style={{ colorScheme: 'light' }}
                className="w-full bg-white border border-rule text-ink px-3 py-2.5 text-sm focus:outline-none focus:border-gold transition-colors cursor-pointer rounded-lg" />
            </div>

          </div>

          {/* Domestic note */}
          {isDomestic && (
            <p className="mt-3 text-xs text-ink-mid">
              Domestic move within {answers.destCountry} — visa and immigration tasks will be skipped.
            </p>
          )}

          {/* Validation error */}
          {error && (
            <p className="mt-3 text-xs text-red-600">{error}</p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={onNext}
            className="px-10 py-4 bg-gold text-white font-semibold text-sm uppercase tracking-[0.14em] rounded-full hover:bg-[#9B6E23] active:scale-[0.98] transition-all shadow-lg">
            Start Planning
          </button>
        </div>

        <p className={`text-center text-[9px] mt-4 uppercase tracking-[0.12em] ${hasPhoto ? 'text-white/40' : 'text-ink-mute'}`}>
          Takes about 5 minutes · Personalised by Claude
        </p>

      </div>
    </div>
  )
}

function ContextPanel({ answers }) {
  const destKey  = (answers.destCity || '').toLowerCase()
  const bgImage  = Object.entries(CITY_IMAGES).find(([k]) => destKey.includes(k))?.[1] ?? null
  const hasPhoto = !!bgImage

  const lines = []
  if (answers.originCity && answers.originCountry)
    lines.push(`From ${answers.originCity}, ${answers.originCountry}`)
  if (answers.destCity && answers.destCountry)
    lines.push(`To ${answers.destCity}, ${answers.destCountry}`)
  if (answers.movingDate)
    lines.push(new Date(answers.movingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
  if (answers.nationality) lines.push(`Nationality: ${answers.nationality}`)
  if (answers.workStatus === 'secured')     lines.push('Job secured')
  if (answers.workStatus === 'searching')   lines.push('Looking for work on arrival')
  if (answers.workStatus === 'not-working') lines.push('Not working')
  if (answers.travelingWith === 'partner')        lines.push('Moving with partner')
  if (answers.travelingWith === 'family')          lines.push('Moving with family')
  if (answers.travelingWith === 'partner-family')  lines.push('Moving with partner & family')
  if (answers.isHometown === 'yes') lines.push(`${answers.destCity} is your hometown`)
  if (answers.firstTimeAbroad === 'yes') lines.push('First time moving abroad')

  return (
    <div className="hidden lg:flex lg:flex-col lg:flex-1 lg:min-h-screen relative overflow-hidden">
      {hasPhoto ? (
        <>
          <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/55" />
        </>
      ) : (
        <div className="absolute inset-0 bg-surface" />
      )}

      <div className={`relative z-10 p-12 xl:p-16 flex flex-col h-full ${hasPhoto ? 'text-white' : 'text-ink'}`}>
        {answers.destCity ? (
          <h2 className={`${SERIF} text-4xl xl:text-5xl italic leading-tight mb-2`}>
            {answers.destCity}
          </h2>
        ) : (
          <h2 className={`${SERIF} text-4xl xl:text-5xl italic leading-tight mb-2 ${hasPhoto ? 'text-white/30' : 'text-ink-mute'}`}>
            Where to?
          </h2>
        )}
        {answers.destCountry && (
          <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${hasPhoto ? 'text-white/50' : 'text-ink-mute'}`}>
            {answers.destCountry}
          </p>
        )}

        {lines.length > 0 && (
          <div className="mt-auto">
            <p className={`text-[9px] font-bold uppercase tracking-[0.18em] mb-4 ${hasPhoto ? 'text-white/40' : 'text-ink-mute'}`}>
              Your move so far
            </p>
            <ul className="space-y-2.5">
              {lines.map((l, i) => (
                <li key={i} className={`text-sm leading-snug ${hasPhoto ? 'text-white/80' : 'text-ink-mid'}`}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        {lines.length === 0 && (
          <div className="flex-1 flex items-end">
            <p className={`${SERIF} text-2xl italic ${hasPhoto ? 'text-white/20' : 'text-ink-mute/30'}`}>
              Your move, your story.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function OnboardingForm({ onComplete, onOpenSettings }) {
  const [stepIdx, setStepIdx] = useState(0) // index into full STEPS array
  const [answers, setAnswers] = useState({
    originCountry: '', originCity: '',
    destCountry: '',   destCity: '',
    movingDate: '',
    nationality: '',
    passports: [],
    timeInOrigin: '',
    isHometown: '',
    hometownYearsAgo: '',
    firstTimeAbroad: '',
    workStatus: '',
    travelingWith: '',
    fitnessHabits: [],
    socialStyle: '',
    foodHabits: [],
    hobbies: [],
    priorities: [],
  })
  const [error, setError] = useState(null)

  const current = STEPS[stepIdx]
  const today   = new Date().toISOString().split('T')[0]

  // Progress excludes the hero step and skipped steps
  const visibleSteps  = STEPS.filter(s => !s.shouldSkip?.(answers) && !s.hideFromProgress)
  const visibleIdx    = visibleSteps.findIndex(s => s.id === current.id)
  const total         = visibleSteps.length
  const progress      = visibleIdx >= 0 ? ((visibleIdx + 1) / total) * 100 : 0
  const isLast        = visibleIdx === total - 1

  const advance = () => {
    const valid = current.validate ? current.validate(answers) : true
    if (valid === false) return
    if (typeof valid === 'string') { setError(valid); return }
    setError(null)

    const updatedAnswers = applyAutoSets(current.id, answers)
    setAnswers(updatedAnswers)

    const nextIdx = getNextStep(stepIdx, updatedAnswers)
    if (nextIdx >= STEPS.length) {
      onComplete(updatedAnswers)
    } else {
      setStepIdx(nextIdx)
    }
  }

  const goBack = () => {
    setError(null)
    const prevIdx = getPrevStep(stepIdx, answers)
    if (prevIdx >= 0) setStepIdx(prevIdx)
  }

  const warning = current.warning?.(answers) ?? null

  // Hero step gets its own full-screen layout
  if (current.type === 'hero-search') {
    return (
      <HeroSearchStep
        answers={answers}
        setAnswers={a => { setAnswers(a); setError(null) }}
        error={error}
        onNext={advance}
        onOpenSettings={onOpenSettings}
      />
    )
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col lg:flex-row">

      {/* ── Left column: progress + question + input ── */}
      <div className="flex-1 flex flex-col lg:max-w-2xl xl:max-w-2xl">
        {/* Progress bar */}
        <div className="px-8 pt-8 pb-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-ink-mute uppercase tracking-[0.14em] font-medium">
              {visibleIdx + 1} / {total}
            </span>
            <div className="flex items-center gap-4">
              {stepIdx > 0 && (
                <button type="button" onClick={goBack}
                  className="text-[10px] text-ink-mute hover:text-ink-mid uppercase tracking-[0.14em] font-medium transition-colors">
                  Back
                </button>
              )}
              <button type="button" onClick={onOpenSettings}
                className="text-[10px] text-ink-mute hover:text-ink-mid uppercase tracking-[0.14em] font-medium transition-colors">
                Settings
              </button>
            </div>
          </div>
          <div className="h-px bg-rule">
            <div className="h-px bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Question + input */}
        <div className="flex-1 flex flex-col px-8 pt-10 pb-10 lg:pt-16 lg:pb-16">
          <div className="mb-8 lg:mb-10">
            <h2 className={`${SERIF} text-[2rem] lg:text-[2.75rem] xl:text-[3rem] font-medium text-ink leading-tight mb-3 ${current.type === 'section-intro' ? 'italic' : ''}`}>
              {res(current.title, answers)}
            </h2>
            {res(current.subtitle, answers) && (
              <p className="text-sm lg:text-base text-ink-mid leading-relaxed">{res(current.subtitle, answers)}</p>
            )}
          </div>

          {warning && (
            <div className="mb-6 px-4 py-3 border border-gold/40 bg-gold/5">
              <p className="text-xs text-ink-mid leading-relaxed">{warning}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 px-4 py-3 border border-red-300 bg-red-50">
              <p className="text-xs text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="flex-1">
            {current.type === 'location' && (
              <LocationInput countryKey={current.countryKey} cityKey={current.cityKey} answers={answers} setAnswers={a => { setAnswers(a); setError(null) }} />
            )}
            {current.type === 'date' && (
              <input type="date" value={answers.movingDate} onChange={e => { setAnswers(a => ({ ...a, movingDate: e.target.value })); setError(null) }}
                min={today} style={{ colorScheme: 'light' }}
                className="w-full bg-white border border-rule text-ink px-4 py-3.5 text-sm focus:outline-none focus:border-gold transition-colors cursor-pointer" />
            )}
            {current.type === 'nationality' && (
              <div className="relative">
                <select value={answers.nationality} onChange={e => setAnswers(a => ({ ...a, nationality: e.target.value }))} className={SELECT_CLS}>
                  <option value="">Select a country</option>
                  {COUNTRIES.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                </select>
                <Chevron />
              </div>
            )}
            {current.type === 'passports' && (
              <div>
                <PassportMultiSelect selected={answers.passports} onChange={val => setAnswers(a => ({ ...a, passports: val }))} />
                {current.optional && (
                  <button type="button" onClick={() => setStepIdx(getNextStep(stepIdx, answers))}
                    className="mt-4 text-[10px] text-ink-mute hover:text-ink-mid uppercase tracking-[0.14em] font-medium transition-colors">
                    Skip this question
                  </button>
                )}
              </div>
            )}
            {current.type === 'radio' && (
              <RadioInput step={current} answers={answers} setAnswers={setAnswers} />
            )}
            {current.type === 'multiselect' && (
              <MultiSelectInput step={current} answers={answers} setAnswers={setAnswers} />
            )}
          </div>

          <div className="pt-10">
            <NextButton onClick={advance} disabled={false} label={isLast ? 'Generate My Checklist' : 'Next'} />
          </div>
        </div>
      </div>

      {/* ── Right column: context panel (desktop only) ── */}
      <ContextPanel answers={answers} />
    </div>
  )
}

// ─── Checklist components ─────────────────────────────────────────────────────

function CategoryBadge({ category }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-ink-mute whitespace-nowrap flex-shrink-0">
      {category}
    </span>
  )
}

function TaskItem({ task, checked, onToggle }) {
  return (
    <li
      className={`flex items-start gap-4 py-4 border-b border-rule last:border-0 cursor-pointer group ${checked ? 'opacity-50' : ''}`}
      onClick={() => onToggle(task.id)}
    >
      <div className={`mt-0.5 w-4 h-4 flex-shrink-0 border flex items-center justify-center transition-colors ${
        checked ? 'bg-gold border-gold' : 'border-rule-mid group-hover:border-ink-mute'
      }`}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 flex items-baseline justify-between gap-4 min-w-0">
        <span className={`text-sm leading-relaxed transition-colors ${checked ? 'line-through text-ink-mute' : 'text-ink'}`}>
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
    message = days === 0 ? "Today is moving day." : `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} since the move — time to settle in.`
  } else if (days <= 7) {
    critical = true
    message = `${days} day${days === 1 ? '' : 's'} remaining. Focus on essentials.`
  } else if (days <= 14) {
    message = `${days} days remaining. Time to accelerate.`
  } else if (days <= 30) {
    message = `${days} days remaining. Stay on schedule.`
  } else if (days <= 60) {
    message = `${days} days remaining. Start now.`
  } else {
    return null
  }

  return (
    <div className={critical ? 'bg-gold' : 'border-b border-rule'}>
      <div className="max-w-2xl mx-auto px-6 py-2.5">
        <p className={`text-[10px] font-semibold uppercase tracking-[0.13em] ${critical ? 'text-white' : 'text-gold'}`}>
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
      <button className="w-full flex items-center justify-between py-6 text-left border-t border-rule" onClick={() => setOpen(o => !o)}>
        <div>
          <h2 className={`${SERIF} text-lg font-medium text-ink`}>{label}</h2>
          <p className="text-[9px] text-ink-mute uppercase tracking-[0.13em] mt-1 font-medium">
            {doneCount} of {filtered.length} tasks
            {allDone && <span className="text-gold ml-2">— Complete</span>}
          </p>
        </div>
        <svg className={`w-4 h-4 text-ink-mute transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul className="pb-4">
          {filtered.map(task => <TaskItem key={task.id} task={task} checked={!!checked[task.id]} onToggle={onToggle} />)}
        </ul>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contextSummary(answers) {
  if (!answers) return null
  const parts = []
  if (answers.originCity) parts.push(`From ${answers.originCity}`)
  if (answers.workStatus === 'secured')     parts.push('job secured')
  if (answers.workStatus === 'searching')   parts.push('job search on arrival')
  if (answers.workStatus === 'not-working') parts.push('not working')
  if (answers.travelingWith === 'partner')        parts.push('with partner')
  if (answers.travelingWith === 'family')          parts.push('with family')
  if (answers.travelingWith === 'partner-family')  parts.push('with partner & family')
  return parts.length ? parts.join(' · ') : null
}

function heroImageFor(destination) {
  const key = destination.toLowerCase()
  for (const [city, url] of Object.entries(CITY_IMAGES)) {
    if (key.includes(city)) return url
  }
  return null
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [plan, setPlan] = useState(() => {
    try { return JSON.parse(localStorage.getItem('relocation-plan')) || null }
    catch { return null }
  })
  const [checked, setChecked] = useState(() => {
    try { return JSON.parse(localStorage.getItem('relocation-checked')) || {} }
    catch { return {} }
  })
  const [activeFilter, setActiveFilter]   = useState(null)
  const [showSettings, setShowSettings]   = useState(false)
  const [isGenerating, setIsGenerating]   = useState(false)
  const [generatingDest, setGeneratingDest] = useState('')
  const [aiError, setAiError]             = useState(null)

  useEffect(() => {
    if (plan) localStorage.setItem('relocation-plan', JSON.stringify(plan))
    else localStorage.removeItem('relocation-plan')
  }, [plan])

  useEffect(() => {
    localStorage.setItem('relocation-checked', JSON.stringify(checked))
  }, [checked])

  const handleGenerate = async answers => {
    const destination = `${answers.destCity}, ${answers.destCountry}`
    const apiKey = localStorage.getItem('claude-api-key')

    if (apiKey) {
      setGeneratingDest(destination)
      setIsGenerating(true)
      setAiError(null)
      console.log('[Relocation Planner] Starting generation. Key in localStorage:', !!localStorage.getItem('claude-api-key'))
      try {
        const { checklist, mode } = await generateWithClaude(answers, apiKey)
        setPlan({ destination, movingDate: answers.movingDate, checklist, mode, answers, aiGenerated: true })
      } catch (err) {
        console.error('[Relocation Planner] Claude API error (full):', err)
        console.error('  err.message:', err.message)
        console.error('  err.status:', err.status)
        console.error('  err.error:', err.error)
        setAiError(err.message)
        const { checklist, mode } = generateChecklist(answers)
        setPlan({ destination, movingDate: answers.movingDate, checklist, mode, answers, aiGenerated: false })
      } finally {
        setIsGenerating(false)
      }
    } else {
      const { checklist, mode } = generateChecklist(answers)
      setPlan({ destination, movingDate: answers.movingDate, checklist, mode, answers, aiGenerated: false })
    }
    setChecked({})
    setActiveFilter(null)
  }

  const handleToggle = id => setChecked(prev => ({ ...prev, [id]: !prev[id] }))
  const resetAll = () => { setPlan(null); setChecked({}); setActiveFilter(null); setAiError(null) }

  if (showSettings) return <SettingsScreen onClose={() => setShowSettings(false)} />
  if (isGenerating)  return <GeneratingScreen destination={generatingDest} />
  if (!plan)         return <OnboardingForm onComplete={handleGenerate} onOpenSettings={() => setShowSettings(true)} />

  const allTasks      = plan.checklist.flatMap(m => m.tasks)
  const filteredTasks = activeFilter ? allTasks.filter(t => t.category === activeFilter) : allTasks
  const totalDone     = filteredTasks.filter(t => checked[t.id]).length
  const progress      = filteredTasks.length > 0 ? Math.round((totalDone / filteredTasks.length) * 100) : 0
  const heroImage     = heroImageFor(plan.destination)
  const summary       = contextSummary(plan.answers)
  const dateStr       = new Date(plan.movingDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Hero (non-sticky) ─────────────────────────────────────────── */}
      {heroImage ? (
        <div className="relative h-[50vh] min-h-[280px] max-h-[420px]">
          <img src={heroImage} alt={plan.destination} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/65" />
          <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8 max-w-2xl mx-auto">
            <p className="text-[10px] text-white/60 uppercase tracking-[0.14em] mb-2 font-medium">
              {dateStr}{summary && <span className="ml-3">{summary}</span>}
            </p>
            <h1 className={`${SERIF} text-5xl text-white italic leading-tight`}>
              {plan.destination}
            </h1>
          </div>
        </div>
      ) : (
        <div className="border-b border-rule px-6 pt-14 pb-10 max-w-2xl mx-auto">
          <p className="text-[10px] text-ink-mute uppercase tracking-[0.14em] mb-3 font-medium">
            {dateStr}{summary && <span className="ml-3">{summary}</span>}
          </p>
          <h1 className={`${SERIF} text-5xl text-ink italic leading-tight`}>
            {plan.destination}
          </h1>
        </div>
      )}

      {/* ── Desktop sidebar + Mobile sticky nav + Checklist ─────────── */}
      <div className="lg:flex">

        {/* Desktop sidebar — hidden on mobile */}
        <aside className="hidden lg:flex lg:flex-col lg:w-72 xl:w-80 lg:flex-shrink-0 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-rule lg:overflow-y-auto" style={{ backgroundColor: '#F5F0E8' }}>
          {/* Destination */}
          <div className="px-7 py-7 border-b border-rule">
            <h2 className={`${SERIF} text-2xl text-ink italic leading-tight mb-1`}>{plan.destination}</h2>
            <p className="text-[9px] text-ink-mute uppercase tracking-[0.13em]">{dateStr}</p>
            {summary && <p className="text-[9px] text-ink-mute mt-0.5 uppercase tracking-[0.1em]">{summary}</p>}
          </div>

          {/* Progress */}
          <div className="px-7 py-5 border-b border-rule">
            <div className="flex justify-between mb-2">
              <span className="text-[9px] text-ink-mute uppercase tracking-[0.13em]">{totalDone} / {filteredTasks.length} tasks</span>
              <span className="text-[9px] text-ink-mid font-semibold uppercase tracking-[0.13em]">{progress}%</span>
            </div>
            <div className="h-px bg-rule">
              <div className="h-px bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* AI status */}
          {aiError && (
            <div className="px-7 py-3 border-b border-rule">
              <p className="text-[10px] text-red-600 leading-relaxed">
                Claude API error.{' '}
                <button onClick={() => setShowSettings(true)} className="underline">Check key.</button>
              </p>
            </div>
          )}
          {!plan.aiGenerated && !aiError && (
            <div className="px-7 py-3 border-b border-rule">
              <p className="text-[10px] text-ink-mute leading-relaxed">
                Template checklist.{' '}
                <button onClick={() => setShowSettings(true)} className="underline hover:text-ink-mid">Add API key</button>
                {' '}for Claude personalisation.
              </p>
            </div>
          )}
          {plan.aiGenerated && (
            <div className="px-7 py-3 border-b border-rule">
              <p className="text-[9px] text-gold font-semibold uppercase tracking-[0.1em]">Personalised by Claude</p>
            </div>
          )}

          <UrgencyBanner movingDate={plan.movingDate} />

          {/* Vertical filter nav */}
          <div className="px-7 py-6 flex-1">
            <p className="text-[9px] text-ink-mute uppercase tracking-[0.16em] font-semibold mb-3">Filter by</p>
            {['All', ...Object.keys(CATEGORIES)].map(cat => {
              const isActive = cat === 'All' ? activeFilter === null : activeFilter === cat
              return (
                <button key={cat}
                  onClick={() => setActiveFilter(cat === 'All' ? null : prev => prev === cat ? null : cat)}
                  className={`block w-full text-left py-2 text-[10px] font-semibold uppercase tracking-[0.14em] border-l-2 pl-3 mb-0.5 transition-colors ${
                    isActive ? 'border-gold text-gold' : 'border-transparent text-ink-mute hover:text-ink-mid hover:border-rule'
                  }`}>
                  {cat}
                </button>
              )
            })}
          </div>

          {/* Sidebar actions */}
          <div className="px-7 py-5 border-t border-rule space-y-2">
            <button onClick={() => setShowSettings(true)}
              className="block text-[9px] text-ink-mute hover:text-ink-mid uppercase tracking-[0.13em] font-medium transition-colors">
              Settings
            </button>
            <button onClick={resetAll}
              className="block text-[9px] text-ink-mid hover:text-ink uppercase tracking-[0.13em] font-semibold transition-colors">
              Start over
            </button>
          </div>
        </aside>

        {/* Main content column */}
        <div className="lg:flex-1 min-w-0">

          {/* Mobile sticky nav — hidden on desktop */}
          <div className="lg:hidden border-b border-rule sticky top-0 z-10" style={{ backgroundColor: '#F5F0E8' }}>
            <div className="max-w-2xl mx-auto px-6 pt-4 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-ink-mute uppercase tracking-[0.13em] font-medium">
                  {totalDone} of {filteredTasks.length} tasks
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] text-ink-mid uppercase tracking-[0.13em] font-semibold">{progress}%</span>
                  <button onClick={() => setShowSettings(true)} className="text-[9px] text-ink-mute hover:text-ink-mid uppercase tracking-[0.13em] font-medium transition-colors">Settings</button>
                  <button onClick={resetAll} className="text-[9px] text-ink-mid hover:text-ink border-b border-ink-mute hover:border-ink uppercase tracking-[0.13em] font-semibold transition-colors">Start over</button>
                </div>
              </div>
              <div className="h-px bg-rule">
                <div className="h-px bg-gold transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            {aiError && (
              <div className="max-w-2xl mx-auto px-6 py-2 border-b border-rule">
                <p className="text-[10px] text-red-600">Claude API error. <button onClick={() => setShowSettings(true)} className="underline">Check key.</button></p>
              </div>
            )}
            {!plan.aiGenerated && !aiError && (
              <div className="max-w-2xl mx-auto px-6 py-2 border-b border-rule">
                <p className="text-[10px] text-ink-mute">Template checklist. <button onClick={() => setShowSettings(true)} className="underline hover:text-ink-mid">Add Claude API key</button> for a personalised version.</p>
              </div>
            )}
            {plan.aiGenerated && (
              <div className="max-w-2xl mx-auto px-6 py-2 border-b border-rule">
                <p className="text-[10px] text-gold font-medium uppercase tracking-[0.1em]">Personalised by Claude</p>
              </div>
            )}
            <UrgencyBanner movingDate={plan.movingDate} />
            <div className="max-w-2xl mx-auto px-6 pt-3 pb-3 flex gap-6">
              {['All', ...Object.keys(CATEGORIES)].map(cat => {
                const isActive = cat === 'All' ? activeFilter === null : activeFilter === cat
                return (
                  <button key={cat}
                    onClick={() => setActiveFilter(cat === 'All' ? null : prev => prev === cat ? null : cat)}
                    className={`text-[9px] font-semibold uppercase tracking-[0.14em] py-1 border-b-2 transition-colors ${
                      isActive ? 'text-gold border-gold' : 'text-ink-mute border-transparent hover:text-ink-mid'
                    }`}>
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Checklist ──────────────────────────────────────────────── */}
          <div className="px-6 lg:px-10 xl:px-14 pt-4 pb-24 max-w-2xl mx-auto lg:max-w-none">
            {plan.checklist.map(monthData => (
              <MonthCard key={monthData.key} monthData={monthData} movingDate={plan.movingDate}
                checked={checked} onToggle={handleToggle} activeFilter={activeFilter} />
            ))}
            {progress === 100 && (
              <div className="pt-16 pb-8 border-t border-rule mt-4">
                <p className={`${SERIF} text-2xl lg:text-3xl text-ink italic`}>All done.</p>
                <p className="text-ink-mid text-sm mt-2">Enjoy {plan.destination}.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
