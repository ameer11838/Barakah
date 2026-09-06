# Barakah

**Mutual aid for a Muslim community, on one phone.** Someone types what they need
in plain language — *"Need a ride to Jummah tomorrow around 1pm, near the masjid"* —
and Barakah reads it, works out what is actually being asked for, and routes it to
the nearest verified neighbour who offers that kind of help. Both sides confirm
afterwards, and the helper earns points.

It is unaffiliated by design. The app has no home masjid baked into it: a
"community" is just an anchor point and a label, and on launch Barakah tries to
re-centre itself on wherever you actually are. The same build works in any city.

There is no backend. Everything runs on the device.

---

## How it works

**1. Say it in your own words.** No category dropdown to start with. You type a
sentence and the parser narrates its reading token by token — category, urgency,
timing, location, any stated preference — settling each field as it decides,
with a confidence score. Every field stays editable, and low confidence opens
the category picker rather than quietly guessing.

Nothing in the fixed list fits? Pick **Something else** and describe it. Real
need does not arrange itself into seven buckets, and the alternative to an
explicit "other" is a request silently filed as the closest wrong category.

**2. Matching, with a reason.** Helpers are ranked on distance, whether they
offer the category, trust tier, rating and how recently they were last matched —
so the same person is not paged for everything. The match comes back with a
plain-English reason, not a score.

**3. Trust tiers.** Everyday help (rides, food, moving, laptops) needs a Tier 2
verified helper. **Childcare and elder transport require Tier 3** — background
checked, or on a partner institution's vetted roster. Neighbours are never paged
for those. The gate is on the category, so an open-ended "something else"
request cannot be used as a side door into it.

**4. Nobody free?** The request escalates to the community's partner
institution's volunteer roster instead of expiring.

**Badges are derived, never accumulated.** You hold exactly one **rank** — the
highest you have reached, so titles replace each other instead of piling up —
alongside as many **traits** as you have earned, one per kind of help you have
actually taken on (Road Ready, Open Table, Heavy Lifting, Entrusted, Both Ways).
All of it is computed from the request records, so it cannot drift out of sync
with what someone did.

**5. Both sides confirm.** Points post only when both people confirm — 25 per
help, and deliberately **none** for childcare or elder transport, which should
not be gamified.

---

## Running it

**You need:** Node 20 or newer, and the [Expo Go](https://expo.dev/go) app if you
want it on a real phone. No API keys, no account, no backend to stand up.

```bash
npm install
npx expo start
```

Then pick a target from the terminal:

| Key | Target | Notes |
| --- | --- | --- |
| `i` | iOS Simulator | Requires Xcode. The best experience — real blur and map. |
| `a` | Android emulator | Requires Android Studio. Blur degrades, see below. |
| `w` | Web browser | Fastest to check. The map is replaced by a list. |
| — | Physical device | Scan the QR code with Expo Go. |

Web-only, on a fixed port:

```bash
npx expo start --web --port 8082
```

If the bundler behaves strangely after a dependency change, clear its cache:

```bash
npx expo start --clear
```

### Optional: turn on real email

Accept and completion notices always appear in-app and as a device notification.
They can *also* be emailed. With nothing configured, sending is skipped and
reported as skipped — the app never claims an email was delivered when it was
not.

Create a `.env` file (git-ignored) with **either** provider:

```bash
# EmailJS — designed for client-side senders; the public key is meant to be public
EXPO_PUBLIC_EMAILJS_SERVICE_ID=...
EXPO_PUBLIC_EMAILJS_TEMPLATE_ID=...
EXPO_PUBLIC_EMAILJS_PUBLIC_KEY=...

# Resend — a normal REST API. The key ships readable in the bundle.
# Fine for a demo, not for production.
EXPO_PUBLIC_RESEND_API_KEY=...
EXPO_PUBLIC_RESEND_FROM="Barakah <onboarding@resend.dev>"
```

Then add your address in **Profile → Email**.

---

## Demo script (~5 minutes)

Barakah is a two-sided exchange, so the demo shows both sides. You can **switch
person** from **Profile → Demo: view as** — send a request as one neighbour,
then become another and accept it.

On launch the app asks for location and re-centres the whole community on you.
On a simulator that will be whatever fake location the simulator reports (often
San Francisco); set a real one under **Features → Location → Custom Location**
in the iOS Simulator menu.

1. **Welcome screen** — the first launch opens on it. It says what Barakah is
   in three claims, then **Get started**. (Reachable again any time from
   **Profile → Welcome screen**, so you can show it without wiping data.)
2. **Profile** — set your name. Note the persona list, and that
   **Auto-accept helper** is off, so nothing gets accepted behind your back.
3. **Home → Request help** — type:
   > `Need a ride to Jummah tomorrow around 1pm, near the masjid`

   Watch the parse stream in, fields settling one at a time with a confidence
   score. Submit. It goes out to the helpers in range and waits.
4. **Profile → Demo: view as → Omar Hassan.** You are now the neighbour on the
   other end.
5. **Activity → Incoming.** The request is there. Accept it — the requester gets
   a notification, the map pin pulses, and the camera eases onto it.

   Note the requests Omar *cannot* take, with the reason shown. Childcare and
   elder transport stay locked to Tier 3 helpers; the rule is visible, not
   hidden.
6. **Confirm completion** as Omar, then **switch back** and confirm as the
   requester. Points post on the second confirmation, with a short celebration.
7. **Profile → Standing** — Omar has picked up the **Road Ready** trait and moved
   toward his next title.
8. **Profile → Notifications** — every notice raised, and honestly whether it was
   pushed, emailed, or only recorded.

Turn **Auto-accept helper** on if you would rather run the short version
single-handed: a plausible helper then accepts about two seconds after you
submit. **Profile → Reset demo data** starts over.

## Project layout

```
app/                 Screens (expo-router file-based routing)
  welcome.tsx        First-launch introduction
  (tabs)/            Home, Map, Activity, Profile
  request.tsx        Free-text request + streaming parse
  request/[id].tsx   Request detail, confirmation, rating
components/
  motion/            Reveal, PressScale, PulseRing, Confetti, TypingCaret
  ui/                GlassCard, PillButton, ConfidenceMeter, Chips, CategoryIcon
lib/
  mockParse.ts       Heuristic request parsing (the single source of meaning)
  streamParse.ts     Token-by-token presentation of that parse
  matching.ts        Helper ranking, auto-accept, and eligibility rules
  badges.ts          Ranks and traits, derived from request records
  geocode.ts         Place lookup, device location
  notify.ts          Push + email + in-app notice, each failing independently
  email.ts           EmailJS / Resend senders
  theme.ts           Light/dark resolution
  community.ts       Community anchor and re-homing
store/               Zustand store, persisted to AsyncStorage
seed/community.ts    Demo people, partners, and open requests
types/barakah.ts     Domain types, categories, tier rules
```

**Theming.** Every colour is a token on a `Palette`, and both schemes implement
the full type — so forgetting a colour in dark mode is a compile error, not a
screen you discover is broken later. Screens never ask which scheme is active;
they read `c.text`. The choice (System / Light / Dark) persists and survives a
demo reset.

---

## What is mocked, on purpose

Being straight about this matters more than the demo looking finished.

- **The parse is heuristic, not an LLM.** Regex and ordered rules with simulated
  latency. It genuinely reads the sentence, but no model is called and no paid
  API is involved.
- **Auto-accept is a demo switch, off by default.** With it on, a plausible
  helper accepts after ~2.2 seconds so the flow can be shown single-handed.
- **No auth.** One device, and you can become any seeded neighbour from Profile.
  A real build would have accounts; this keeps both sides demonstrable on one
  phone.
- **ID verification is a local button.** "Approve Tier 2" flips a flag; nothing
  is uploaded or reviewed.
- **Notifications are local, not remote push.** They fire on the device and work
  in Expo Go. Remote push on iOS needs a development build.
- **Data lives only on the device**, in AsyncStorage. Reinstalling clears it.

## Known platform limits

- **Maps are native-only.** `react-native-maps` has no web implementation, so the
  web build swaps in a scrollable list of the same requests.
- **Android blur is a fill, not a blur.** As of Expo SDK 57, a bare `BlurView`
  on Android renders semi-transparent rather than blurred; true blur needs the
  background wrapped in a `BlurTargetView`. Android gets a denser opaque panel
  that stays legible instead.
