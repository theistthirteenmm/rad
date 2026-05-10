from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

from ..database import get_db
from ..models import Invoice, User
from .auth import get_current_user

router = APIRouter(prefix='/api/accounting', tags=['accounting'])


def _require_accountant(user: User = Depends(get_current_user)) -> User:
    if user.role not in ('accountant', 'admin'):
        raise HTTPException(status_code=403, detail='دسترسی مجاز نیست')
    return user


class InvoiceIn(BaseModel):
    invoice_kind: str
    invoice_type: str = ''
    template: str = ''
    subject: str = ''
    taxpayer_role: str = ''
    tax_number: str = ''
    total: float = 0
    vat: float = 0
    status: str = ''
    issue_date: str = ''
    portfolio_date: str = ''
    counterparty_id: str = ''
    counterparty_tax_number: str = ''
    branch: str = ''
    counterparty_name: str = ''
    counterparty_trade_name: str = ''
    counterparty_type: str = ''
    settlement_method: str = ''
    year_period: str = ''
    total_without_tax: float = 0
    reference_invoice: str = ''
    response_datetime: str = ''
    settlement_balance: float = 0
    extra_data: dict = {}


class InvoiceOut(BaseModel):
    id: int
    invoice_kind: str
    invoice_type: str
    template: str
    subject: str
    taxpayer_role: str
    tax_number: str
    total: float
    vat: float
    status: str
    issue_date: str
    portfolio_date: str
    counterparty_id: str
    counterparty_tax_number: str
    branch: str
    counterparty_name: str
    counterparty_trade_name: str
    counterparty_type: str
    settlement_method: str
    year_period: str
    total_without_tax: float
    reference_invoice: str
    response_datetime: str
    settlement_balance: float
    extra_data: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def _to_out(inv: Invoice) -> dict:
    return {
        'id': inv.id,
        'invoice_kind': inv.invoice_kind or '',
        'invoice_type': inv.invoice_type or '',
        'template': inv.template or '',
        'subject': inv.subject or '',
        'taxpayer_role': inv.taxpayer_role or '',
        'tax_number': inv.tax_number or '',
        'total': inv.total or 0,
        'vat': inv.vat or 0,
        'status': inv.status or '',
        'issue_date': inv.issue_date or '',
        'portfolio_date': inv.portfolio_date or '',
        'counterparty_id': inv.counterparty_id or '',
        'counterparty_tax_number': inv.counterparty_tax_number or '',
        'branch': inv.branch or '',
        'counterparty_name': inv.counterparty_name or '',
        'counterparty_trade_name': inv.counterparty_trade_name or '',
        'counterparty_type': inv.counterparty_type or '',
        'settlement_method': inv.settlement_method or '',
        'year_period': inv.year_period or '',
        'total_without_tax': inv.total_without_tax or 0,
        'reference_invoice': inv.reference_invoice or '',
        'response_datetime': inv.response_datetime or '',
        'settlement_balance': inv.settlement_balance or 0,
        'extra_data': inv.extra_data or {},
        'created_at': inv.created_at.isoformat() if inv.created_at else '',
        'updated_at': inv.updated_at.isoformat() if inv.updated_at else '',
    }


@router.get('/invoices')
async def list_invoices(
    kind: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 200,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_accountant),
):
    q = select(Invoice).where(Invoice.owner_id == user.id)
    if kind:
        q = q.where(Invoice.invoice_kind == kind)
    if status:
        q = q.where(Invoice.status == status)
    if search:
        q = q.where(
            Invoice.counterparty_name.ilike(f'%{search}%') |
            Invoice.tax_number.ilike(f'%{search}%') |
            Invoice.counterparty_id.ilike(f'%{search}%')
        )
    q = q.order_by(Invoice.id.desc()).offset(skip).limit(limit)
    result = await db.execute(q)
    return [_to_out(r) for r in result.scalars().all()]


@router.get('/summary')
async def get_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_accountant),
):
    for kind in ('خرید', 'فروش'):
        q = select(
            func.count(Invoice.id),
            func.sum(Invoice.total),
            func.sum(Invoice.vat),
            func.sum(Invoice.total_without_tax),
        ).where(Invoice.owner_id == user.id, Invoice.invoice_kind == kind)
        r = await db.execute(q)
        row = r.one()
        if kind == 'خرید':
            purchase = {'count': row[0], 'total': row[1] or 0, 'vat': row[2] or 0, 'without_tax': row[3] or 0}
        else:
            sale = {'count': row[0], 'total': row[1] or 0, 'vat': row[2] or 0, 'without_tax': row[3] or 0}
    return {'purchase': purchase, 'sale': sale}


@router.post('/invoices')
async def create_invoice(
    body: InvoiceIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_accountant),
):
    inv = Invoice(owner_id=user.id, **body.model_dump())
    db.add(inv)
    await db.commit()
    await db.refresh(inv)
    return _to_out(inv)


@router.post('/invoices/bulk')
async def bulk_create(
    body: List[InvoiceIn],
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_accountant),
):
    objs = [Invoice(owner_id=user.id, **item.model_dump()) for item in body]
    db.add_all(objs)
    await db.commit()
    return {'created': len(objs)}


@router.put('/invoices/{inv_id}')
async def update_invoice(
    inv_id: int,
    body: InvoiceIn,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_accountant),
):
    r = await db.execute(select(Invoice).where(Invoice.id == inv_id, Invoice.owner_id == user.id))
    inv = r.scalar_one_or_none()
    if not inv:
        raise HTTPException(404, 'صورت‌حساب یافت نشد')
    for k, v in body.model_dump().items():
        setattr(inv, k, v)
    inv.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(inv)
    return _to_out(inv)


@router.delete('/invoices/{inv_id}')
async def delete_invoice(
    inv_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_accountant),
):
    r = await db.execute(select(Invoice).where(Invoice.id == inv_id, Invoice.owner_id == user.id))
    inv = r.scalar_one_or_none()
    if not inv:
        raise HTTPException(404, 'صورت‌حساب یافت نشد')
    await db.delete(inv)
    await db.commit()
    return {'deleted': inv_id}


@router.delete('/invoices')
async def delete_many(
    ids: List[int],
    db: AsyncSession = Depends(get_db),
    user: User = Depends(_require_accountant),
):
    r = await db.execute(select(Invoice).where(Invoice.id.in_(ids), Invoice.owner_id == user.id))
    invoices = r.scalars().all()
    for inv in invoices:
        await db.delete(inv)
    await db.commit()
    return {'deleted': len(invoices)}
