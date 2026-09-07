# Betton

P2P-платформа предсказаний (в духе Polymarket) с автоматическим маркетмейкером **LMSR**. Комиссия за вход и ставки — **0%**. Монетизация — **чаевые** победителя до **1%** чистой прибыли при закрытии рынка.

## Архитектура

```
betton/
├── main.py                 # uvicorn main:app
├── bot/main.py             # Telegram-бот (aiogram)
├── requirements.txt
├── app/
│   ├── lmsr.py
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   └── services/market_service.py
└── tests/test_lmsr.py
```

Поток: Telegram / HTTP → FastAPI → `market_service` → LMSR + PostgreSQL.

Пользователь создаёт событие с параметром ликвидности `b` и покупает акции Yes/No. AMM всегда котирует обе стороны. При резолюции акция победившего исхода стоит 1; проигравшие — 0. Победитель может отдать чаевые `tip_rate ∈ [0, 0.01]` от `max(0, payout − cost_basis)`.

## LMSR

- Стоимость: `C(q) = b · ln(Σ exp(qᵢ / b))`
- Цена: `pᵢ = exp(qᵢ / b) / Σ exp(qⱼ / b)`
- Акции за сумму `m`: закрытая форма из `C(q + x eᵢ) − C(q) = m`

Чем больше `b`, тем глубже книга и тем меньше сдвиг цены от одной ставки.

## Запуск

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
# SQLite: файл betton.db в корне проекта
# Бот стартует вместе с API (lifespan), если задан BOT_TOKEN
```

Документация API: http://127.0.0.1:8000/docs

### Render (Web Service)

Start Command — только uvicorn, без `&` и без отдельного процесса бота:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

В Environment добавьте `BOT_TOKEN` (и при необходимости `MINI_APP_URL` на https-адрес сервиса). Не используйте `--reload` на Render: два воркера дадут конфликт polling.

```bash
pytest tests/test_lmsr.py
```
