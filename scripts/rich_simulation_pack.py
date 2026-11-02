"""Additive synthetic scenarios through existing API/matching. No timestamps rewritten."""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import asyncio
import random
from uuid import UUID, uuid5

TAG = 'DEMO[rich-simulation-v1]'
NAMESPACE = UUID('b9125354-c021-4a6b-8e86-f6af734c7355')

async def add_rich_scenarios(application, core):
    import httpx
    from sqlalchemy import func
    from app.database import SessionLocal
    from app.models import Market, User, P2PFill
    from app.services import demo_guarantors as demo
    from scripts.seed_demo_markets import _place, complement_odds
    from scripts.ux_v3_preview import signed_init_data
    makers = core['liquidity_makers']
    with SessionLocal() as db:
        demo.require_demo(db)
        if len(makers)<2 or any(db.get(User, uid) is None or db.get(User, uid).telegram_id is not None for uid in makers):
            raise RuntimeError('Only the marked simulation liquidity makers may trade')
    transport=httpx.ASGITransport(app=application,client=('127.0.0.1',12345))
    result={}
    async with httpx.AsyncClient(transport=transport,base_url='http://127.0.0.1:8877') as client:
        async def request(method,path,actor,body=None):
            response=await client.request(method,path,json=body,headers={'Authorization':'tma '+signed_init_data(actor)})
            if response.status_code!=200:raise RuntimeError(f'Rich SIM {method} {path}: {response.status_code} {response.text}')
            return response.json()
        async def event(key,title,category):
            marker=TAG+' '+key
            human_description=('История встречных предложений с разными коэффициентами. Тестовые исполнения и условные средства.' if key=='rich_history' else 'Учебное событие: '+title.removeprefix('ТЕСТ · ')+' Используются только условные средства.')
            with SessionLocal() as db:
                found=db.query(Market).filter(Market.description.in_([marker,human_description])).all()
                if len(found)>1:raise RuntimeError('Ambiguous rich scenario; no automatic cleanup permitted')
                existing=found[0] if found else None
                mid=existing.id if existing else None
                pending=existing is not None and existing.status.value=='pending'
            if mid is None:
                now=datetime.now(timezone.utc)
                data=await request('POST','/ux-v3/events','creator',{
                    'request_id':str(uuid5(NAMESPACE,key)), 'event_type':'public',
                    'question':title,'outcomes':['Да','Нет'],'category':category,
                    'description':human_description,'rules':'ТЕСТ. Сравнить результат с опубликованным протоколом.',
                    'criteria':['Условие подтверждено протоколом','Условие не подтверждено протоколом'],
                    'resolution_method':'Проверка тестового протокола',
                    'unverifiable':'Отмена и возврат по обычному механизму',
                    'primary_source':{'name':'ТЕСТ · Протокол','url':'https://example.com/simulation'},
                    'close_at':(now+timedelta(days=7)).isoformat(),'ends_at':None,'timing_version':'start-v1'})
                mid=data['id'];pending=True
            if pending:await request('POST',f'/markets/{mid}/approve','moderator')
            result[key]={'id':mid,'question':title,'type':'public'}
            return mid
        def place(mid,actor,outcome,money,odds,key):
            with SessionLocal() as db:
                demo.require_demo(db)
                return _place(db,mid,actor,outcome,money,odds,str(uuid5(NAMESPACE,f'{mid}:{key}')))
        mid=await event('rich_history','ТЕСТ · Сто сделок и больше: цена закрытия выше порога?','crypto')
        rng=random.Random(20261103)
        for i in range(100):
            odds=rng.choice([Decimal('1.25'),Decimal('2'),Decimal('2.5'),Decimal('4'),Decimal('5')])
            side=i%2;amount=Decimal(2+i%7)
            place(mid,makers[i%len(makers)],side,amount,odds,f'{i}:maker')
            place(mid,makers[(i+1)%len(makers)],1-side,amount*(odds-1),complement_odds(float(odds)),f'{i}:taker')
            await asyncio.sleep(.02)
        for side in [0,1]:
            for level,odds in enumerate([3,4,5]):place(mid,makers[(side+level)%len(makers)],side,25+level*10,odds,f'book:{side}:{level}')
        titles=[('sport','Команда Альфа выйдет в финал?'),('esports','Команда Бета выиграет первую карту?'),('crypto','Индекс завершит неделю выше порога?'),('unique','Новый парк откроется в срок?'),('sport','Теннисист выиграет первый сет?'),('esports','Матч завершится за две карты?'),('unique','Фестиваль состоится в назначенный день?'),('crypto','Проект выпустит обновление в срок?'),('sport','Команда сохранит лидерство в группе?'),('esports','Состав выйдет в плей-офф?'),('unique','Спутник достигнет рабочей орбиты?'),('sport','Финал закончится без дополнительного времени?')]
        for i,(category,title) in enumerate(titles):
            mid=await event(f'rich_market_{i}','ТЕСТ · '+title,category)
            place(mid,makers[i%len(makers)],0,20+i,3,'yes')
            place(mid,makers[(i+1)%len(makers)],1,30+i,4,'no')
    with SessionLocal() as db:
        count=db.query(func.count(P2PFill.id)).filter_by(market_id=result['rich_history']['id']).scalar()
    return {'rich_scenario_version':1,'rich_scenarios':result,'rich_history_fills':count}
