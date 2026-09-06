# Barakah

Hackathon MVP for Muslim community mutual aid near **ICPC Paterson**. Request help in free text, mock-AI parse, match on a map, confirm both sides, earn points.

## Stack

- Expo Router + TypeScript
- Zustand + AsyncStorage (no backend)
- `react-native-maps` (native) with a web pin list fallback
- Soft glass UI on a sage wash (teal accent)

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

You are **Aisha Rahman** (Tier 2). One account can request and help.

1. **Map:** open pins around ICPC (Jummah ride, food, Eastside ride, moving help).
2. **Accept** a food or ride pin, confirm completion as helper, get points.
3. **Home → Request help.** Paste:
   `Need a ride to Jummah tomorrow around 1pm, near ICPC`  
   Then parse, review, submit.
4. Wait about 2 seconds. **Omar Hassan** auto-accepts with a match reason.
5. Confirm as requester, rate, check **Profile** badges. Tier 3 locks are under **Help settings**.
6. Optional: **Profile → Partners** for the Green Market offer.

Reset anytime from **Profile → Reset demo data**.

## What’s mocked on purpose

- No paid LLM (heuristic parse + fake latency)
- No real auth / SMS / push
- ID upload is demo-only; Approve Tier 2 is a local button
- Childcare / elder transport shown as Tier 3 / ICPC only
