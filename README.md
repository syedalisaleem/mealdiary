# MealDiary 🍽️

A private, local-first food diary for your phone. Take a photo of a meal, get a quick AI estimate of calories and macros, fix anything that looks wrong, and track your day against your goals.

**No account. No cloud. No backend.** Everything (diary, profile, goals, settings, photos) lives only on this device. The only network call in the whole app is the optional photo analysis — and that goes straight to the AI provider you configure with **your own API key**. If no key is set, the app works fine as a manual food diary.

## Run it in Expo Go (fastest way to test)

```bash
npm install
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone (Android or iOS). Your phone and computer must be on the same network. No native build needed — everything used here works inside Expo Go.

You can also press `a` (Android emulator), `i` (iOS simulator), or `w` (web) from the terminal.

## What you can do

- **Scan a meal** — take a photo or pick one from your library, get calories/protein/carbs/fat estimated, then edit anything before saving.
- **Manual diary** — search ~130 built-in common foods or enter a custom entry with your own numbers. Works fully offline.
- **Daily totals** — calories with a progress ring vs. your target, plus protein/carbs/fat bars.
- **Goals** — set them manually, or compute them from your profile (Mifflin-St Jeor BMR × activity × goal).
- **History** — browse the last 30 days, tap a day to see its meals, and a 7-day calorie chart.
- **Edit / delete** — every entry can be edited or deleted; settings include **Delete all data on this device**.

## Setting up AI photo analysis

1. Open **Settings → AI photo analysis**.
2. Pick a provider:
   - **OpenAI** — paste an `sk-...` key (default model `gpt-4o-mini`).
   - **Custom (OpenAI-compatible)** — any service with a `/chat/completions` API: OpenRouter, Groq, Together, local endpoints, etc. Set the base URL and model.
   - **Google Gemini** — paste an `AIza...` key (default model `gemini-2.5-flash`).
3. Tap **Test connection** to verify, then **Save**.

Your key is stored in the device's secure storage (SecureStore) and is only sent to the provider you configured, as an `Authorization` header or Gemini query param. It never leaves your phone otherwise.

## Privacy & data

- Diary, profile, goals and AI settings are stored with AsyncStorage; the API key in SecureStore; meal photos in the app's documents folder.
- There is no telemetry, no analytics SDK, no network calls other than the AI analysis request you trigger.
- **Settings → Delete all data on this device** wipes everything including your API key and saved photos.

## Project structure

```
src/
  app/            Routes (expo-router)
    (tabs)/       Today · History · Settings
    scan.tsx      Photo capture → AI estimate
    add.tsx       Manual entry (food search)
    entry-edit.tsx  Shared editor for new/edited entries
  components/     Small UI kit (cards, fields, segmented, bars)
  lib/
    storage.ts    Local persistence + app state hook
    ai.ts         OpenAI-compatible + Gemini clients (photo → JSON estimate)
    nutrition.ts  BMR / target calculations, totals
    foods.ts      Built-in food database
    dates.ts, format.ts, types.ts
```

## Tech notes

- Expo SDK 57, expo-router, TypeScript.
- No UI libraries — hand-rolled themed components (light/dark).
- Photo analysis prompts the model to return strict JSON, which is parsed defensively and clamped to sane ranges.
