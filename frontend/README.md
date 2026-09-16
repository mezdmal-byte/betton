# BetTON React UI

Design v1 is frozen. `feature/react-api-readonly` connects the accepted screens to the existing FastAPI backend for **read-only** product flows. Storybook stays fixture-driven and offline.

```bash
npm install
npm run dev
npm run storybook
npm test
npm run test:visual
```

## Local QA (do not change the user database)

Terminal 1 — existing FastAPI app on port 8000:

```bash
# from repo root, with the project venv and .env already configured
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Terminal 2 — React Vite app (proxies `/markets`, `/auth`, `/users`, `/health` to that server):

```bash
cd frontend
copy .env.example .env
npm run dev
```

Open the Vite URL (default `http://127.0.0.1:5173`). Do not put Cloudflare tunnel URLs or Telegram `initData` in committed files.

### Checks

1. Public Markets feed loads from `GET /markets`.
2. **Новые / Популярные / Скоро** request `sort=new|popular|closing`.
3. Categories: Все omits `category`; Спорт → `sport`; Политика → `politics`; Другое → `unique`.
4. Search sends `q=`.
5. P2P cards use `best_offers` for quotes/liquidity.
6. Markets without a best offer render the existing no-liquidity state.
7. Opening a card loads `GET /markets/{id}` (and `GET /markets/{id}/orderbook` for P2P, read-only).
8. Ordinary browser has no Telegram `initData`: header balance is `—`, never fixture `1.2K TON`.
9. Telegram Mini App sends `Authorization: tma <initData>` from `window.Telegram.WebApp.initData` and `POST /auth/telegram`.
10. After auth, header balance comes from `GET /users/{id}/account` (`balance_nano`).

Unlisted share links use `?share=` / Telegram `start_param` and `X-Market-Share-Token`, matching the existing Mini App. Share resolve (`GET /markets/share/{token}`) still requires Telegram auth.

Quick Trade / Create / Own Price CTAs are visual or disabled in this pass. They must not POST orders or create markets.

## Known limitation: legacy LMSR

The existing backend may still expose `mechanism="lmsr"` markets. The React adapter is P2P-oriented and uses `best_offers` / `available_to_me`. That is not LMSR parity. Do not treat missing P2P offers as a reason to invent AMM odds or fake liquidity. An explicit LMSR compatibility decision is deferred.

