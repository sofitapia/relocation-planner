import Anthropic from '@anthropic-ai/sdk'

// ─── Prompt building ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert international relocation consultant specialising in personalised moving checklists. Your job is to generate a comprehensive, actionable, month-by-month checklist for someone relocating internationally.

Rules:
- Be specific. Use the destination city name in task descriptions.
- Include real country-specific administrative, legal, and bureaucratic requirements — actual visa types, insurance systems, registration processes, tax obligations — all specific to the origin and destination countries.
- Lifestyle tasks (fitness, food, social, hobbies) must be specific to the destination city and the person's stated preferences. Name actual things they should look for.
- The timeline must be realistic given how many months of preparation are available.
- Do not include generic advice. Every task should feel personally written for this person.
- Return ONLY valid JSON. No markdown, no explanation, no preamble.`

function label(map, value) {
  return map[value] || value || 'not specified'
}

export function buildPrompt(answers) {
  const {
    originCity, originCountry, destCity, destCountry, movingDate,
    nationality, passports, timeInOrigin, isHometown, hometownYearsAgo,
    firstTimeAbroad, workStatus, travelingWith,
    fitnessHabits, socialStyle, foodHabits, hobbies, priorities,
  } = answers

  const daysUntil   = Math.ceil((new Date(movingDate) - new Date()) / 86400000)
  const monthsUntil = Math.max(1, Math.round(daysUntil / 30))

  const passportStr = Array.isArray(passports) && passports.length > 0
    ? passports.join(', ') : 'Not specified'

  const fitnessMap = {
    gym: 'gym', running: 'running', cycling: 'cycling', swimming: 'swimming',
    'team-sports': 'team sports', climbing: 'climbing', yoga: 'yoga / Pilates', none: 'none',
  }
  const foodMap = {
    restaurants: 'eating out at restaurants', 'home-cooking': 'cooking at home',
    'farmers-markets': 'farmers markets / fresh produce', 'coffee-shops': 'coffee shops as workspace',
    'new-cuisines': 'trying new cuisines',
  }
  const hobbyMap = {
    music: 'live music / gigs', 'art-museums': 'art and museums', volunteering: 'volunteering',
    nightlife: 'nightlife', 'nature-hiking': 'nature and hiking', reading: 'reading / bookshops',
    gaming: 'gaming', theatre: 'theatre / performing arts',
  }
  const priorityMap = {
    'building-career': 'building career', 'finding-community': 'finding community',
    'exploring-city': 'exploring the city', 'establishing-routine': 'establishing daily routine',
    'family-life': 'family life',
  }
  const workMap = {
    secured: 'Job secured — moving for a specific role',
    searching: 'Will look for work after arriving',
    'not-working': 'Not working (student / retired / other)',
  }
  const travelMap = {
    alone: 'Moving alone', partner: 'Moving with a partner',
    family: 'Moving with family (children)', 'partner-family': 'Moving with a partner and children',
  }
  const timeMap = {
    lt1: 'Less than 1 year', '1-3': '1–3 years', '3-5': '3–5 years',
    '5-10': '5–10 years', '10+': '10+ years', lifetime: 'Whole life (never moved before)',
  }

  const fitnessStr   = fmt(fitnessHabits, fitnessMap)
  const foodStr      = fmt(foodHabits, foodMap)
  const hobbiesStr   = fmt(hobbies, hobbyMap)
  const prioritiesStr = fmt(priorities, priorityMap)

  // Country-specific hints
  const nlDeparture = originCountry === 'Netherlands'
    ? '\n- DUTCH DEPARTURE (mandatory): uitschrijven at gemeente, cancel zorgverzekering, notify Belastingdienst (M-form if needed), DigiD note, OV-chipkaart refund, bank notification, BSN admin'
    : ''
  const nlArrival = destCountry === 'Netherlands'
    ? '\n- DUTCH ARRIVAL (mandatory): BRP registration at gemeente, sign up for mandatory zorgverzekering'
    : ''
  const mxArrival = destCountry === 'Mexico'
    ? '\n- MEXICO ARRIVAL (mandatory): research correct visa/residency permit (Residente Temporal for 180+ days, Residente Permanente for long-term), get CURP (population registry code), get RFC (tax ID), open bank account (BBVA/Santander/HSBC are common for foreigners), register with IMSS if employed or get private health insurance otherwise, get local SIM card (Telcel or AT&T), register with home country embassy/consulate, find a notario público'
    : ''
  const countryHints = nlDeparture + nlArrival + mxArrival

  return `Generate a personalised moving checklist for this person.

MOVE DETAILS
- Origin: ${originCity}, ${originCountry}
- Destination: ${destCity}, ${destCountry}
- Moving date: ${movingDate} (${monthsUntil} month${monthsUntil === 1 ? '' : 's'} from now)

PERSONAL PROFILE
- Nationality: ${nationality || 'not specified'}
- Passports / visas held: ${passportStr}
- Time lived in ${originCountry}: ${label(timeMap, timeInOrigin)}
- Is ${destCity} their hometown: ${isHometown === 'yes' ? `Yes (previously lived there: ${label({lt5:'<5 yrs','5-10':'5–10 yrs','10-18':'10–18 yrs',most:'most of life'}, hometownYearsAgo)})` : 'No'}
- First time moving abroad: ${firstTimeAbroad === 'yes' ? 'Yes' : 'No'}
- Work situation: ${label(workMap, workStatus)}
- Moving with: ${label(travelMap, travelingWith)}

LIFESTYLE PREFERENCES
- Fitness routine: ${fitnessStr}
- Social style: ${socialStyle?.replace(/-/g, ' ') || 'not specified'}
- Food habits: ${foodStr}
- Hobbies / interests: ${hobbiesStr}
- Priorities in new place: ${prioritiesStr}
${countryHints ? `\nCOUNTRY-SPECIFIC REQUIREMENTS TO INCLUDE:${countryHints}` : ''}

INSTRUCTIONS
Create sections from earliest preparation through post-move settlement. Use the actual calendar months where possible (e.g. "July 2026 — 3 Months Before"). End with a "Rebuild Your Life" section using their lifestyle preferences to generate specific, city-scoped tasks.

Task categories must be exactly one of: Admin, Packing, Social, Explore

Return ONLY this JSON:
{
  "sections": [
    {
      "key": "unique-kebab-case-key",
      "label": "Section heading",
      "tasks": [
        { "id": 1001, "category": "Admin", "label": "Specific task mentioning ${destCity} where relevant" }
      ]
    }
  ]
}`
}

function fmt(arr, map) {
  if (!Array.isArray(arr) || arr.length === 0) return 'not specified'
  return arr.filter(v => v !== 'none').map(v => map[v] || v).join(', ') || 'none'
}

// ─── Key test ─────────────────────────────────────────────────────────────────

export async function testApiKey(apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  // Cheapest possible call — just verifies auth and connectivity
  await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1,
    messages: [{ role: 'user', content: 'Hi' }],
  })
}

// ─── API call ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set(['Admin', 'Packing', 'Social', 'Explore'])

export async function generateWithClaude(answers, apiKey) {
  const prompt = buildPrompt(answers)

  // Debug: log what we're sending so issues are visible in the browser console
  console.group('[Relocation Planner] Claude API call')
  console.log('Key (first 12 chars):', apiKey ? `${apiKey.slice(0, 12)}...` : 'MISSING')
  console.log('Key length:', apiKey?.length ?? 0)
  console.log('Prompt length (chars):', prompt.length)
  console.log('Prompt preview (first 500):', prompt.slice(0, 500))
  console.groupEnd()

  if (!apiKey) throw new Error('API key is empty — check localStorage for "claude-api-key"')

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = response.content[0].text.trim()
  console.log('[Relocation Planner] Raw response length (chars):', raw.length)
  console.log('[Relocation Planner] Response stop_reason:', response.stop_reason)

  // Extract JSON: find the outermost { ... } regardless of markdown wrapping.
  // We avoid regex on the full response because non-greedy matching can stop early
  // on long outputs, producing truncated JSON.
  const start = raw.indexOf('{')
  const end   = raw.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    console.error('[Relocation Planner] No JSON object found. Full response:', raw)
    throw new Error(`No JSON found in Claude response. Response was: ${raw.slice(0, 200)}`)
  }

  const jsonStr = raw.slice(start, end + 1)
  console.log('[Relocation Planner] Extracted JSON length (chars):', jsonStr.length)

  let data
  try {
    data = JSON.parse(jsonStr)
  } catch (parseErr) {
    console.error('[Relocation Planner] JSON.parse failed on extracted string:', jsonStr.slice(0, 500))
    throw new Error(`Claude response was not valid JSON: ${parseErr.message}`)
  }

  if (!Array.isArray(data?.sections)) {
    throw new Error('Claude response is missing the "sections" array.')
  }

  const checklist = data.sections
    .filter(s => Array.isArray(s.tasks) && s.tasks.length > 0)
    .map((section, si) => ({
      key:   section.key   || `ai-${si}`,
      label: section.label || `Section ${si + 1}`,
      tasks: section.tasks.map((task, ti) => ({
        id:       1000 + si * 100 + ti,
        category: VALID_CATEGORIES.has(task.category) ? task.category : 'Admin',
        label:    String(task.label ?? ''),
      })),
    }))

  if (checklist.length === 0) throw new Error('Claude returned no tasks.')

  return { checklist, mode: 'ai' }
}
