from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, DemoGuarantorRun
from app.telegram_auth import get_current_user
from app.services import demo_guarantors as demo, market_service as ms

router = APIRouter(prefix='/demo/guarantors', tags=['Isolated demo only'])


class RunInput(BaseModel):
    scenario: str = 'negotiate'
    enabled: bool = True


@router.post('/install')
def install(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return demo.install(db, user)


@router.put('/events/{mid}')
def configure(mid: int, req: RunInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return demo.configure(db, user, mid, req.scenario, req.enabled)


@router.get('/runs')
def runs(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ms.require_admin(user)
    demo.require_demo(db)
    return [{'market_id': r.market_id, 'actor_id': r.actor_id, 'enabled': r.enabled,
             'scenario': r.scenario, 'next_at': r.next_at, 'last_error': r.last_error}
            for r in db.query(DemoGuarantorRun).order_by(DemoGuarantorRun.market_id.desc()).limit(100)]
