"""Opt-in demo actors. No Telegram impersonation, direct balance writes or fake fills.

Every action uses the same revision/authority/funding services as a real guarantor.
The environment guard, database marker and registered synthetic actor are mandatory.
"""
from datetime import timedelta
from pathlib import PurePosixPath

from fastapi import HTTPException
from sqlalchemy.engine import make_url

from app.config import settings
from app.models import (DemoEnvironment, DemoGuarantorActor, DemoGuarantorRun, EventConfigV3,
                        EventRevisionV3, GuarantorCase, GuarantorMessage,
                        GuarantorProfile, Market, User)
from app.services import guarantors as gs, market_service as ms

STRATEGIES = {
    'fixed': ('Фикс', 'fixed', '5', '0', 3),
    'percent': ('Процент', 'percent', '0', '3', 5),
    'combined': ('Процент + фикс', 'combined', '2', '3', 7),
    'percent_minimum': ('Процент с минимумом', 'percent_minimum', '20', '3', 9),
    'negotiator': ('Переговорщик', 'percent', '0', '4', 11),
    'flexible': ('Гибкий', 'percent', '0', '2', 13),
}
SCENARIOS = {'negotiate', 'decline', 'no_response', 'invite_expiry',
             'agreement_error', 'winner_0', 'winner_1', 'cancel', 'timeout'}


class _AtomicActionSession:
    """Join existing service commits to the worker's outer unit of work.

    Services still flush at their normal boundaries, but only tick can commit
    action + cursor + next_at together. Never passed to an HTTP dependency.
    """
    def __init__(self, session):
        self.session = session

    def __getattr__(self, name):
        return getattr(self.session, name)

    def commit(self):
        self.session.flush()


def require_environment():
    # A switch alone must never enable this on the default/working database.
    url = make_url(settings.database_url)
    name = PurePosixPath(url.database or '').name.lower()
    named_test = name.startswith(('betton-test-', 'betton-demo-', 'betton_test_', 'betton_demo_'))
    if not (settings.betton_demo_automation
            and settings.betton_environment in ('demo', 'test') and named_test):
        raise HTTPException(403, 'Автоматические гаранты доступны только в отдельной демонстрационной базе')


def require_demo(db):
    require_environment()
    marker = db.get(DemoEnvironment, 1)
    if not marker or marker.version != 1:
        raise HTTPException(403, 'База не инициализирована как отдельное демонстрационное окружение')


def initialize_empty_database(db):
    """CLI bootstrap only. Never adopt a populated database, even a test-named one."""
    require_environment()
    if db.get(DemoEnvironment, 1):
        raise HTTPException(409, 'Демонстрационная база уже инициализирована')
    if db.query(User.id).first() or db.query(Market.id).first():
        raise HTTPException(409, 'Инициализация разрешена только в новой пустой базе; данные не изменены')
    db.add(DemoEnvironment(id=1, version=1))
    db.commit()


def install(db, admin):
    ms.require_admin(admin)
    require_demo(db)
    result = []
    for strategy, (label, *_rest) in STRATEGIES.items():
        actor = db.query(DemoGuarantorActor).filter_by(strategy=strategy).first()
        if not actor:
            # Do not adopt an existing account by its name.
            username = '__betton_demo_guarantor_' + strategy
            if db.query(User).filter_by(username=username).first():
                raise HTTPException(409, 'Имя тестового гаранта уже занято; существующий аккаунт не изменён')
            user = User(username=username, telegram_id=None, display_name='ТЕСТ · ' + label,
                        balance_nano=0, balance_legacy=0)
            db.add(user)
            db.flush()
            actor = DemoGuarantorActor(user_id=user.id, strategy=strategy)
            db.add(actor)
            db.add(GuarantorProfile(user_id=user.id, status='approved',
                bio='Автоматический тестовый гарант. Не реальный Telegram-аккаунт. Стратегия: ' + label,
                topics='Только демонстрационные события',
                available_until=gs.now() + timedelta(hours=1), last_seen_at=gs.now()))
        result.append({'user_id': actor.user_id, 'strategy': strategy})
    db.commit()
    return result


def configure(db, admin, mid, scenario, enabled=True):
    ms.require_admin(admin)
    require_demo(db)
    if scenario not in SCENARIOS:
        raise HTTPException(422, 'Неизвестный тестовый сценарий')
    market = ms._lock_market(db, mid)
    config, case = db.get(EventConfigV3, mid), db.get(GuarantorCase, mid)
    actor = db.get(DemoGuarantorActor, case.guarantor_id) if case else None
    if not config or config.event_type != 'guarantor' or config.terms.get('_reward_engine') != 1 or not actor:
        raise HTTPException(409, 'Требуется новое событие UX v3 с зарегистрированным тестовым гарантом')
    if db.get(User, actor.user_id).telegram_id is not None:
        raise HTTPException(403, 'Автоматизация Telegram-аккаунтов запрещена')
    row = db.get(DemoGuarantorRun, mid)
    if row and row.actor_id != actor.user_id:
        raise HTTPException(409, 'Гарант события изменился; старый сценарий нельзя переназначить')
    if actor.strategy not in STRATEGIES:
        raise HTTPException(409, 'Неизвестная стратегия тестового гаранта')
    if enabled and case.state in ('settled', 'cancelled', 'needs_guarantor'):
        raise HTTPException(409, 'Завершённый сценарий нельзя запустить заново')
    # Overrides change future behaviour only. Never rewind acknowledgements,
    # questions, counteroffers or financial history by clearing the cursor.
    final_choices = {'negotiate', 'winner_0', 'winner_1', 'cancel', 'timeout'}
    if row and scenario != row.scenario and case.state != 'invited' and not (
            case.state in ('review', 'collecting', 'active') and scenario in final_choices):
        raise HTTPException(409, 'Гарант уже ответил: можно изменить только будущий тестовый результат или остановить сценарий')
    if not row:
        row = DemoGuarantorRun(market_id=mid, actor_id=actor.user_id, progress={})
        db.add(row)
    row.scenario, row.enabled, row.last_error = scenario, enabled, None
    row.progress = {**(row.progress or {}), '_generation': (row.progress or {}).get('_generation', 0) + 1}
    row.next_at = gs.now() + timedelta(seconds=STRATEGIES[actor.strategy][-1])
    db.add(EventRevisionV3(market_id=mid, revision=config.revision, actor_id=admin.id,
        kind='demo_control', snapshot={'scenario': scenario, 'enabled': enabled, 'guarantor_id': actor.user_id}))
    db.commit()
    return {'market_id': mid, 'enabled': row.enabled, 'scenario': scenario, 'next_at': row.next_at}


def register_created_event(db, market, config, case):
    """Join create_event's intent transaction; never commit or adopt old events.

    The event intent serializes retries and market_id is the run's primary key.
    Real guarantors take no demo path, even in an ordinary production database.
    """
    actor = db.get(DemoGuarantorActor, case.guarantor_id)
    if not actor:
        return
    require_demo(db)
    user = db.get(User, actor.user_id)
    if user.telegram_id is not None:
        raise HTTPException(403, 'Автоматизация Telegram-аккаунтов запрещена')
    if actor.strategy not in STRATEGIES or config.terms.get('_reward_engine') != 1:
        raise HTTPException(409, 'Недействительная стратегия тестового гаранта')
    if db.get(DemoGuarantorRun, market.id):
        raise HTTPException(409, 'Автоматический сценарий уже зарегистрирован')
    db.add(DemoGuarantorRun(market_id=market.id, actor_id=actor.user_id,
        scenario='winner_0', enabled=True, progress={'_generation': 1},
        next_at=gs.now() + timedelta(seconds=STRATEGIES[actor.strategy][-1])))
    db.add(EventRevisionV3(market_id=market.id, revision=config.revision,
        actor_id=actor.user_id, kind='demo_default', snapshot={
            'scenario': 'winner_0', 'strategy': actor.strategy,
            'result_policy': 'ТЕСТ: первый исход после срока; не результат реального события'}))


def _act(db, market, actor, action, **fields):
    from app.guarantor_routes import CaseAction
    return gs.transition(db, market.id, actor, CaseAction(action=action, **fields))


def _step(db, run, actor, market, case, config):
    user = db.get(User, actor.user_id)
    if user.telegram_id is not None or case.guarantor_id != actor.user_id:
        raise HTTPException(403, 'Тестовый актор больше не соответствует назначенному гаранту')
    progress = dict(run.progress or {})
    if run.scenario in ('no_response', 'invite_expiry'):
        return progress
    if case.state == 'invited':
        _act(db, market, user, 'decline' if run.scenario == 'decline' else 'acknowledge', revision=case.revision)
        return progress
    if case.state == 'review':
        if run.scenario == 'agreement_error':
            raise HTTPException(409, 'ТЕСТ: контролируемая ошибка согласования; условия не подтверждены')
        latest = db.query(GuarantorMessage).filter_by(market_id=market.id, user_id=market.creator_id, kind='message').order_by(GuarantorMessage.id.desc()).first()
        # A negotiator starts with a question rather than an instant tariff.
        if actor.strategy == 'negotiator' and not progress.get('asked'):
            _act(db, market, user, 'message', text='ТЕСТ: уточните, какой источник и какие доказательства подтверждают каждый исход. Затем согласуем тариф.')
            progress['asked'] = True
            progress['asked_revision'] = case.revision
            progress['asked_after_message'] = latest.id if latest else 0
            return progress
        if actor.strategy == 'negotiator' and not progress.get('clarified'):
            if (not latest or latest.id <= progress.get('asked_after_message', 0)) and case.revision <= progress.get('asked_revision', 0):
                return progress
            progress['clarified'] = True
        reward = config.reward or {}
        if not reward:
            from app.ux_v3_routes import RewardInput, negotiate_reward
            _, mode, fixed, percent, _ = STRATEGIES[actor.strategy]
            if actor.strategy == 'flexible':
                # No invented future volume: use only the submitted conditions.
                complex_rules = len(str(config.terms.get('rules', ''))) > 400
                mode, fixed, percent = ('combined', '2', '2') if complex_rules else ('percent', '0', '1.5')
            negotiate_reward(market.id, RewardInput(expected_revision=case.revision,
                mode=mode, fixed_ton=fixed, percent=percent), user=user, db=db)
            return progress
        if reward.get('proposed_by') != user.id and user.id not in reward.get('accepted_by', []):
            from app.ux_v3_routes import RewardInput, negotiate_reward
            if actor.strategy == 'percent' and not progress.get('countered'):
                negotiate_reward(market.id, RewardInput(expected_revision=case.revision,
                    mode='percent', percent='2'), user=user, db=db)
                progress['countered'] = True
            elif actor.strategy in ('fixed', 'combined', 'percent_minimum') and reward.get('mode') != STRATEGIES[actor.strategy][1]:
                _, mode, fixed, percent, _ = STRATEGIES[actor.strategy]
                negotiate_reward(market.id, RewardInput(expected_revision=case.revision,
                    mode=mode, fixed_ton=fixed, percent=percent), user=user, db=db)
            else:
                negotiate_reward(market.id, RewardInput(expected_revision=case.revision,
                    action='accept'), user=user, db=db)
            return progress
        if case.creator_confirmed == case.revision and market.creator_id in reward.get('accepted_by', []):
            _act(db, market, user, 'accept', revision=case.revision)
        elif latest and latest.id > progress.get('last_message', 0):
            _act(db, market, user, 'message', text='ТЕСТ: вижу обновление. Подтвердите текущую редакцию правил и тарифа; открытие ставок выполнит сервер после общего согласия.')
            progress['last_message'] = latest.id
        return progress
    if case.state == 'active' and gs.now() >= config.ends_at:
        if run.scenario in ('winner_0', 'winner_1'):
            _act(db, market, user, 'propose', revision=case.revision,
                outcome=int(run.scenario[-1]), text='ТЕСТ: воспроизводимый демонстрационный исход №' + str(int(run.scenario[-1]) + 1) + '; не результат реального события')
        elif run.scenario == 'cancel':
            _act(db, market, user, 'cancel', revision=case.revision,
                text='ТЕСТ: отмена без определения победителя')
        # timeout deliberately does nothing; normal expiry worker refunds at 24h.
    return progress


def tick(db):
    require_demo(db)
    # Heartbeat never authenticates an actor or changes a suspended profile.
    for actor in db.query(DemoGuarantorActor).all():
        profile = db.get(GuarantorProfile, actor.user_id)
        if profile and profile.status == 'approved':
            profile.last_seen_at = gs.now()
            profile.available_until = gs.now() + timedelta(seconds=90)
    db.commit()
    ids = [r[0] for r in db.query(DemoGuarantorRun.market_id).filter(
        DemoGuarantorRun.enabled.is_(True), DemoGuarantorRun.next_at <= gs.now()).all()]
    for mid in ids:
        failed_generation = None
        try:
            market = ms._lock_market(db, mid)
            run = db.query(DemoGuarantorRun).filter_by(market_id=mid).with_for_update().populate_existing().first()
            if not run.enabled or run.next_at > gs.now():
                db.rollback()
                continue
            failed_generation = (run.progress or {}).get('_generation', 0)
            actor = db.get(DemoGuarantorActor, run.actor_id)
            config, case = db.get(EventConfigV3, mid), db.get(GuarantorCase, mid)
            if not actor or not config or not case or config.terms.get('_reward_engine') != 1:
                raise HTTPException(409, 'Тестовая привязка больше не действительна')
            atomic = _AtomicActionSession(db)
            gs.expire(atomic, market, case)
            if case.state in ('settled', 'cancelled', 'needs_guarantor'):
                run.enabled = False
            else:
                run.progress = _step(atomic, run, actor, market, case, config)
                if case.state in ('settled', 'cancelled', 'needs_guarantor'):
                    run.enabled = False
            run.next_at = gs.now() + timedelta(seconds=STRATEGIES[actor.strategy][-1])
            db.commit()
        except Exception as exc:
            db.rollback()
            if failed_generation is None:
                continue
            ms._lock_market(db, mid)
            run = db.query(DemoGuarantorRun).filter_by(market_id=mid).with_for_update().populate_existing().first()
            if not run or (run.progress or {}).get('_generation', 0) != failed_generation:
                db.rollback()
                continue  # Never pause a newer admin configuration after rollback.
            run.enabled = False
            run.last_error = str(exc.detail)[:300] if isinstance(exc, HTTPException) else 'Ошибка тестового сценария; действие и курсор отменены'
            db.commit()


def process_due():
    # Disabled by default, including all existing production/local configurations.
    if not settings.betton_demo_automation:
        return
    from app.database import SessionLocal
    with SessionLocal() as db:
        tick(db)
