# BetTON React UI

Design v1 is frozen. `feature/react-full-preview` connects the accepted screens to **existing** FastAPI write+read endpoints for a Telegram showcase under `/v2/`. Storybook stays fixture-driven and offline.

The legacy Mini App remains at `/`. Do not treat this preview as a replacement.

```bash
npm install
npm run build
npm test
npm run storybook
```

## Production preview path

Vite `base` is `/v2/`. FastAPI serves `frontend/dist` at `/v2/` from the same process as the legacy Mini App.

```
/       = legacy Mini App (rollback)
/v2/    = React preview
```

Runtime is FastAPI + built static assets + the existing Cloudflare tunnel. Do not keep a Vite dev server running as production.

### Build

```bash
cd frontend
npm install
npm run build
```

### Always-on launcher

From the repo root, after a DB backup if you will place real orders:

```bat
start-betton-always-on.bat
```

The launcher rebuilds `frontend/dist` when it is missing or older than `frontend/src`, `frontend/index.html`, `frontend/package.json`, `frontend/package-lock.json`, or `frontend/vite.config.ts`. Then it starts uvicorn + cloudflared with the existing watchdog.

Open:

- legacy Mini App: `<public-base>/`
- React preview: `<public-base>/v2/`

Do not commit tunnel URLs.

## LMSR compatibility

Old `mechanism="lmsr"` markets are **not** rendered as P2P books. React does not invent AMM odds or `best_offers`. Opening an LMSR market shows an explicit compatibility state and a button to the legacy Mini App at `/`.

P2P is the primary new-product path in this preview.

## Wired existing endpoints

- `POST /auth/telegram`
- `GET /users/{id}/account|positions|orders|transactions|settlements|markets`
- `GET /markets`, `GET /markets/{id}`, `GET /markets/share/{token}`
- `GET /markets/{id}/orderbook`
- `POST /markets/{id}/orders/quote`
- `POST /markets/{id}/orders`
- `POST /orders/{id}/cancel`
- `POST /markets`
- `GET /moderation/markets`
- `POST /markets/{id}/approve|reject|close|resolve|cancel`
- `GET /creators/{id}`
- `GET /health`

Auth remains `Authorization: tma <initData>`. Unlisted access remains `X-Market-Share-Token` / `?share=` / Telegram `start_param`.

## Manual QA (Telegram `/v2/`)

Before write-QA: back up the live SQLite/Postgres file. Tests never use that DB.

AUTH

- real Telegram auth
- header balance from account
- expired session overlay

FEED

- search / filter / sort
- market detail
- LMSR card opens compatibility, not fake P2P quotes

QUICK TRADE

- no liquidity
- full fill
- partial fill (backend preview)
- stale quote
- insufficient balance
- success; balance refreshes from backend (no optimistic money)

OWN PRICE

- create resting limit
- partial immediate + remainder from backend preview
- cancel remainder from Portfolio with confirmation

PORTFOLIO

- positions / orders / history
- empty / loading / error

CREATE

- public P2P → pending moderation state
- unlisted P2P → returned share token preserved
- open unlisted via share token

ADMIN

- moderation only if `is_admin`
- approve / reject / close / resolve / void where backend already allows

ROLLBACK

- `/` still serves the legacy Mini App throughout
