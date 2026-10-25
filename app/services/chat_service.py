from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session, aliased, joinedload

from app.models import ChatMessage, ChatReadState, Market, MarketStatus, User


def scope_key(market_id: int | None) -> str:
    return "lobby" if market_id is None else f"market:{int(market_id)}"


def _scope_filter(query, market_id: int | None):
    if market_id is None:
        return query.filter(ChatMessage.market_id.is_(None))
    return query.filter(ChatMessage.market_id == int(market_id))


def _author_name(user: User | None) -> str:
    if user is None:
        return "Пользователь"
    return (
        (user.display_name or "").strip()
        or ((user.telegram_username or "").strip() and f"@{user.telegram_username.strip().lstrip('@')}")
        or (user.username or "").strip()
        or f"Пользователь {user.id}"
    )


def _reply_preview(message: ChatMessage | None) -> dict | None:
    if message is None:
        return None
    deleted = message.deleted_at is not None
    return {
        "id": message.id,
        "author_name": _author_name(message.author),
        "text": "Сообщение удалено" if deleted else message.text,
        "deleted": deleted,
    }


def _market_brief(market: Market | None) -> dict | None:
    if market is None:
        return None
    status = market.status.value if hasattr(market.status, "value") else str(market.status)
    return {"id": market.id, "question": market.question, "status": status}


def message_to_out(message: ChatMessage) -> dict:
    deleted = message.deleted_at is not None
    author = message.author
    return {
        "id": message.id,
        "author": {
            "id": author.id,
            "display_name": _author_name(author),
            "telegram_username": author.telegram_username,
            "photo_url": author.photo_url,
            "is_admin": bool(author.is_admin),
        },
        "market_id": message.market_id,
        "text": "Сообщение удалено" if deleted else message.text,
        "reply_to": _reply_preview(message.reply_to),
        "attached_market": _market_brief(message.attached_market),
        "deleted": deleted,
        "created_at": message.created_at,
    }


def list_messages(
    db: Session,
    *,
    market_id: int | None,
    limit: int = 100,
    before_id: int | None = None,
) -> dict:
    limit = max(1, min(int(limit), 200))
    query = (
        db.query(ChatMessage)
        .options(
            joinedload(ChatMessage.author),
            joinedload(ChatMessage.reply_to).joinedload(ChatMessage.author),
            joinedload(ChatMessage.attached_market),
        )
    )
    query = _scope_filter(query, market_id)
    if before_id is not None:
        query = query.filter(ChatMessage.id < int(before_id))
    rows = query.order_by(ChatMessage.id.desc()).limit(limit + 1).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    rows.reverse()
    return {
        "items": [message_to_out(row) for row in rows],
        "has_more": has_more,
        "next_before_id": rows[0].id if has_more and rows else None,
    }


def _validate_reply_scope(db: Session, reply_to_id: int | None, market_id: int | None) -> ChatMessage | None:
    if reply_to_id is None:
        return None
    parent = db.get(ChatMessage, int(reply_to_id))
    if parent is None or parent.deleted_at is not None:
        raise ValueError("Сообщение для ответа недоступно")
    if parent.market_id != market_id:
        raise ValueError("Нельзя отвечать сообщению из другого чата")
    return parent


def _validate_attachment(db: Session, attached_market_id: int | None) -> Market | None:
    if attached_market_id is None:
        return None
    market = db.get(Market, int(attached_market_id))
    if market is None or market.status in (MarketStatus.pending, MarketStatus.rejected):
        raise ValueError("Событие для вложения недоступно")
    if (market.visibility or "public") != "public":
        raise ValueError("В общий чат можно прикреплять только публичные события")
    return market


def create_message(
    db: Session,
    *,
    user: User,
    market_id: int | None,
    text: str,
    reply_to_id: int | None = None,
    attached_market_id: int | None = None,
) -> dict:
    body = (text or "").strip()
    if not body:
        raise ValueError("Сообщение не может быть пустым")
    if len(body) > 1000:
        raise ValueError("Сообщение слишком длинное")
    _validate_reply_scope(db, reply_to_id, market_id)
    attachment = _validate_attachment(db, attached_market_id)
    message = ChatMessage(
        user_id=user.id,
        market_id=market_id,
        text=body,
        reply_to_id=reply_to_id,
        attached_market_id=attachment.id if attachment is not None else None,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message_to_out(
        db.query(ChatMessage)
        .options(
            joinedload(ChatMessage.author),
            joinedload(ChatMessage.reply_to).joinedload(ChatMessage.author),
            joinedload(ChatMessage.attached_market),
        )
        .filter(ChatMessage.id == message.id)
        .one()
    )


def delete_message(db: Session, *, user: User, message_id: int) -> dict:
    message = (
        db.query(ChatMessage)
        .options(
            joinedload(ChatMessage.author),
            joinedload(ChatMessage.reply_to).joinedload(ChatMessage.author),
            joinedload(ChatMessage.attached_market),
        )
        .filter(ChatMessage.id == int(message_id))
        .one_or_none()
    )
    if message is None:
        raise LookupError("Сообщение не найдено")
    if message.user_id != user.id and not user.is_admin:
        raise PermissionError("Удалить это сообщение может автор или администратор")
    if message.deleted_at is None:
        message.text = ""
        message.attached_market_id = None
        message.deleted_at = datetime.now(timezone.utc).replace(tzinfo=None)
        db.commit()
        db.refresh(message)
    return message_to_out(message)


def mark_read(db: Session, *, user_id: int, market_id: int | None) -> int:
    query = db.query(func.max(ChatMessage.id))
    query = _scope_filter(query, market_id)
    latest = int(query.scalar() or 0)
    key = scope_key(market_id)
    state = (
        db.query(ChatReadState)
        .filter(ChatReadState.user_id == user_id, ChatReadState.scope_key == key)
        .one_or_none()
    )
    if state is None:
        state = ChatReadState(
            user_id=user_id,
            scope_key=key,
            last_read_message_id=latest,
        )
        db.add(state)
    else:
        state.last_read_message_id = max(int(state.last_read_message_id or 0), latest)
    db.commit()
    return latest


def unread_replies(db: Session, *, user_id: int) -> dict:
    parent = aliased(ChatMessage)
    rows = (
        db.query(ChatMessage)
        .join(parent, ChatMessage.reply_to_id == parent.id)
        .filter(
            parent.user_id == user_id,
            parent.deleted_at.is_(None),
            ChatMessage.user_id != user_id,
            ChatMessage.deleted_at.is_(None),
        )
        .order_by(ChatMessage.id.asc())
        .all()
    )
    states = {
        row.scope_key: int(row.last_read_message_id or 0)
        for row in db.query(ChatReadState).filter(ChatReadState.user_id == user_id).all()
    }
    lobby = 0
    markets: dict[str, int] = {}
    for row in rows:
        key = scope_key(row.market_id)
        if row.id <= states.get(key, 0):
            continue
        if row.market_id is None:
            lobby += 1
        else:
            market_key = str(row.market_id)
            markets[market_key] = markets.get(market_key, 0) + 1
    return {
        "lobby": lobby,
        "markets": markets,
        "total": lobby + sum(markets.values()),
    }
