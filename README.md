# Wallet Wise

Wallet Wise is a full-stack MVP expense manager with a Progressive Web App frontend, Express API, Firestore-ready persistence, category budgets, dashboard analytics, and an AI chat assistant for spend queries and smart expense entry.

## Stack

- Frontend: React + Vite + Tailwind CSS + Recharts
- Backend: Node.js + Express
- Database: Firebase Firestore with a local memory fallback for dev
- AI: Gemini API with structured intent extraction
- PWA: `vite-plugin-pwa`

## Features

- Expense CRUD with amount, category, source, date, merchant, and note
- Dashboard with total spend, category breakdown, monthly trend, and recent transactions
- Category management with reusable icon and accent options
- Monthly budget tracking with >80% warning state
- AI chat for:
  - spend summaries
  - category/source queries
  - budget risk checks
  - natural-language expense entry
- Installable PWA with offline UI asset caching

## Project Structure

```text
wallet_wise/
├─ client/                  # React + Vite + Tailwind PWA
│  ├─ public/
│  └─ src/
│     ├─ app/
│     ├─ components/
│     ├─ pages/
│     ├─ services/
│     ├─ store/
│     ├─ styles/
│     ├─ types/
│     └─ utils/
├─ server/                  # Express API + AI orchestration + data adapters
│  └─ src/
│     ├─ config/
│     ├─ lib/
│     ├─ routes/
│     ├─ schemas/
│     ├─ services/
│     └─ types/
├─ shared/                  # reserved for future shared contracts
├─ requirement.txt
└─ package.json
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env templates:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

3. Choose a data mode in `server/.env`:

- `DATA_PROVIDER=memory` for local demo data
- `DATA_PROVIDER=firestore` for Firebase Firestore

4. If using Firestore, configure:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

5. If using the AI assistant, configure:

- `GEMINI_API_KEY` or `GOOGLE_API_KEY`
- optionally `GEMINI_MODEL`

6. Start the backend:

```bash
npm run dev:server
```

7. Start the frontend in another terminal:

```bash
npm run dev:client
```

## Scripts

- `npm run dev:server`
- `npm run dev:client`
- `npm run build`
- `npm run build:server`
- `npm run build:client`

## API

### Expenses

- `GET /api/expenses`
- `POST /api/expenses`
- `PUT /api/expenses/:id`
- `DELETE /api/expenses/:id`

### Categories

- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

### Budgets

- `GET /api/budgets?month=YYYY-MM`
- `POST /api/budgets`

### Chat

- `POST /api/chat`

Example:

```json
{
  "message": "I spent 450 on Zomato using HDFC card"
}
```

## Notes

- The server defaults to a memory adapter so the UI works immediately during local development.
- Switching `DATA_PROVIDER=firestore` enables the production Firestore path without changing the client.
- The client sends `x-user-id` on each request. Default is `demo-user`.
- In production, the API now expects Firebase bearer tokens by default and no longer trusts the dev fallback identity path.

## Verification

- `npm --workspace client run build`
- `npm --workspace server run build`
- API smoke-tested locally against `GET /api/health`, `GET /api/categories`, `GET /api/expenses`, `GET /api/budgets`, and `POST /api/chat`
