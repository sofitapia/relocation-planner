# Relocation Planner

A React + Vite + Tailwind web app. Users enter a moving date and destination to get a personalized month-by-month checklist split into Admin, Packing, Social, and Explore categories. Progress is saved to localStorage.

## Future Features

### Onboarding questionnaire
Collect context before generating the checklist:
- How long did you live in your current location?
- Is it your hometown?
- First time moving abroad?
- Moving for work, or finding a job on arrival?
- Moving alone, or with family/partner?

Tasks should adapt based on answers (e.g. moving with family adds school enrollment tasks; moving for work skips job-search tasks).

### Country-specific departure rules
Inject admin tasks based on the country being left. Examples:
- **Netherlands**: deregister at the municipality (uitschrijven), cancel mandatory health insurance (zorgverzekering), handle BSN-related admin

### Country-specific arrival rules
Inject admin tasks based on the destination country. Examples:
- **Netherlands**: register at municipality, sign up for mandatory health insurance
- **Mexico**: no mandatory health insurance required on arrival

### Visa / immigration questions
Ask about immigration status to surface relevant tasks:
- What visa/permit were you on in your current country?
- Do you need a visa for the destination?
- What is your nationality / where are you from?
- What passports and/or visas do you currently hold?
- Generate visa application or permit tasks accordingly

Nationality and passport data are critical for accurate immigration tasks — an EU passport holder moving within Europe has completely different requirements than a non-EU national. Holding multiple passports changes the visa logic entirely (e.g. a user with both a US and an EU passport may have visa-free options a single-passport holder would not).

Tasks should adapt based on all questionnaire answers combined (onboarding context + departure country + destination country + visa/immigration status).

### Phase 2: Claude API integration
Connect the Claude API to generate country-specific immigration and legal tasks dynamically for any origin/destination country combination, instead of relying on hardcoded templates. This enables full coverage of any country pair without manual maintenance.

### "Week in your life" onboarding
After the logistics questions, ask the user to describe a typical week in their current city. Capture:
- Fitness and sport routines (gym, climbing, running clubs, team sports, yoga, etc.)
- Social habits (close friends, family nearby, both, or mostly solo)
- Food preferences (restaurants vs. cooking at home, markets, cuisine types)
- Hobbies and clubs (book clubs, maker spaces, language exchanges, etc.)
- Work/career focus level (is work central to identity or strictly 9–5)
- Volunteering interests (causes, types of organizations)
- Cultural habits (museums, live music, theatre, nightlife, galleries)

Use these answers to generate a **"Rebuild Your Life"** section in the checklist, specific to the destination. Examples:
- "Find a climbing gym in Mexico City"
- "Locate the nearest farmers market in Amsterdam"
- "Search for volunteer opportunities with environmental organizations in Barcelona"
- "Find a running club or parkrun in your new neighbourhood"

This transforms the app from a logistics checklist into a **life continuity planner** — helping people not just move their stuff but rebuild the life they love in a new place. This section should be Claude API-generated: the user's lifestyle profile + destination feeds into a prompt that returns personalised "rebuild" tasks. Hardcoding these per city would be impossible.

#### Passport and visa logic
Current implementation handles basic EU/non-EU logic as a proof of concept. Full implementation should use the Claude API to dynamically generate immigration requirements based on:
- Origin country
- Destination country
- Nationalities and passports held
- Current visa/permit status in the origin country

Every country combination has unique rules that are impossible to hardcode manually. The API call should happen after the onboarding questionnaire is complete and feed directly into checklist generation — producing a set of immigration tasks (or confirming none are needed) specific to that user's exact situation. This is the core Phase 2 technical goal.
