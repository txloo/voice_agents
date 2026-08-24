import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_tenant
from app.database import get_db
from app.models.agent import Agent, Call
from app.models.tenant import Tenant
from app.schemas.call import CallResponse, CallTranscriptResponse

router = APIRouter(prefix="/calls", tags=["calls"])


@router.get("", response_model=list[CallResponse])
async def list_calls(
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    result = await db.execute(
        select(Call)
        .where(Call.tenant_id == tenant.id)
        .order_by(Call.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{call_id}", response_model=CallResponse)
async def get_call(
    call_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Call).where(Call.id == uuid.UUID(call_id), Call.tenant_id == tenant.id)
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.get("/{call_id}/transcript", response_model=CallTranscriptResponse)
async def get_call_transcript(
    call_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Call).where(Call.id == uuid.UUID(call_id), Call.tenant_id == tenant.id)
    )
    call = result.scalar_one_or_none()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return CallTranscriptResponse(id=call.id, transcript=call.transcript, status=call.status)
