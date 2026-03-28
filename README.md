# Strength Training App

This is a Next.js app for tracking workout plans, logging sets, viewing history, and syncing plans from Google Slides. It uses SQLite locally and in production.

## Requirements

- Node.js 20+
- npm
- Fly.io CLI (`flyctl`) for deployment

## Run Locally

1. Install dependencies:

```bash
npm ci
```

2. Create `.env.local` if you want to enable optional integrations. The app can run without most env vars, but these are useful:

```bash
GEMINI_API_KEY=your_api_key_here
NEXTAUTH_URL=http://localhost:3000
```

Notes:

- `GEMINI_API_KEY` is optional, but required for the LLM-powered workout text features.
- If `DATABASE_PATH` is not set, the app uses `data/gym.db` locally.
- The app will create the `data/` directory automatically if it does not exist.

3. Set up the database schema (required on first run):

```bash
npm run db:push
```

4. Start the development server:

```bash
npm run dev
```

5. Open the app:

[http://localhost:3000](http://localhost:3000)

## Database

This project uses Drizzle with SQLite.

Useful commands:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
```

By default, local database files live under `data/`, which is already ignored by git.

## Run Tests Locally

Run the full test suite:

```bash
npm test -- --run
```

Run Vitest in watch mode:

```bash
npm test
```

The current local test suite passes with:

- 17 test files
- 51 tests

## Build and Run Production Locally

Build the app:

```bash
npm run build
```

Start the production server:

```bash
npm run start
```

## Android App Wrapper

An Android wrapper project now lives in `android-app/`.

- It packages the deployed site `https://gym-tracker-kpasam.fly.dev` inside a native Android `WebView`.
- This is the practical mobile path for this codebase because the app depends on Next.js API routes and SQLite on the server.
- Build notes and sideload instructions are in `android-app/README.md`.

## Deploy to Server

This repo is set up to deploy to Fly.io using:

- `fly.toml`
- `Dockerfile`
- a persistent volume mounted at `/data`

### One-time Fly setup

1. Install and log in to Fly:

```bash
fly auth login
```

2. Create the app if it does not already exist:

```bash
fly apps create gym-tracker-kpasam
```

3. Create the persistent volume used by SQLite:

```bash
fly volumes create gym_data --region sjc --size 1
```

4. Set secrets if needed:

```bash
fly secrets set GEMINI_API_KEY=your_api_key_here
fly secrets set NEXTAUTH_URL=https://your-app-name.fly.dev
```

Notes:

- In production, the container uses `DATABASE_PATH=/data/gym.db`.
- The Fly volume is mounted to `/data`, so SQLite data persists across deploys.

### Deploy

Run:

```bash
fly deploy
```

### Verify deployment

After deploy:

```bash
fly status
fly logs
```

## Production Notes

- The app runs on port `3000`.
- A scheduled server-side cron job triggers a daily sync at `5:00 AM` server local time.
- The app syncs workout plans from a Google Slides export endpoint.

## Troubleshooting

- If login works locally but LLM-generated text is missing, make sure `GEMINI_API_KEY` is set.
- If deploy succeeds but data does not persist, confirm the Fly volume `gym_data` exists and is mounted at `/data`.
- If the app cannot find the database locally, make sure the process can write to the `data/` directory.
