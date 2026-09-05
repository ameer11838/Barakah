# Barakah

Muslim community mutual-aid MVP for hackathon demos: request help in free text, mock-AI parse, match near **ICPC Paterson**, accept on a map, confirm both sides, earn points.

## Stack

- Expo Router + TypeScript
- Zustand + AsyncStorage (no backend)
- `react-native-maps` (native) with a web pin list fallback
- Soft glass UI + hand-authored geometric star lattice (low opacity)

## Run (iOS Simulator)

```bash
npm install
npx expo start
```

Then press `i` for the iOS Simulator.

Web preview (agent / laptop):

```bash
npx expo start --web --port 8082
```

## Demo script (~6 minutes)

You are **Aisha Rahman** (Tier 2) — one account that can request and help.

1. **Map** — open pins around ICPC (Jummah ride, food, Eastside ride, moving help).
2. **Accept** a community food or ride pin → confirm completion (as helper) → points.
3. **Home → Request help** — paste:  
   `Need a ride to Jummah tomorrow around 1pm, near ICPC`  
   → mock AI parse → review → submit.
4. Wait ~2s — **Omar Hassan** auto-accepts with a match reason.
5. Confirm completion as requester → rate → check **Profile** badges / Tier 3 locks on childcare.

Reset anytime from **Profile → Reset demo data**.

## What’s mocked on purpose

- No paid LLM (heuristic parse + fake latency)
- No real auth / SMS / push
- ID upload is demo-only; Approve Tier 2 is a local button
- Childcare / elder transport shown as Tier 3 / ICPC roadmap
