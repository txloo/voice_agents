import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth import get_current_tenant, get_current_user
from app.database import get_db
from app.models.agent import Agent, AgentVersion
from app.models.tenant import Tenant, User
from app.schemas.agent import (
    AgentCreate,
    AgentResponse,
    AgentUpdate,
    AgentVersionCreate,
    AgentVersionResponse,
)

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("", response_model=list[AgentResponse])
async def list_agents(
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Agent).where(Agent.tenant_id == tenant.id).order_by(Agent.created_at.desc()))
    return result.scalars().all()


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(
    body: AgentCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    agent = Agent(tenant_id=tenant.id, name=body.name, description=body.description)
    db.add(agent)
    await db.commit()
    await db.refresh(agent)
    return agent


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.tenant_id == tenant.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.patch("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    body: AgentUpdate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.tenant_id == tenant.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(agent, field, value)

    await db.commit()
    await db.refresh(agent)
    return agent


@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agent(
    agent_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.tenant_id == tenant.id)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    await db.delete(agent)
    await db.commit()


@router.get("/{agent_id}/versions", response_model=list[AgentVersionResponse])
async def list_agent_versions(
    agent_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    agent_result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.tenant_id == tenant.id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    result = await db.execute(
        select(AgentVersion)
        .where(AgentVersion.agent_id == agent.id)
        .order_by(AgentVersion.version_number.desc())
    )
    return result.scalars().all()


@router.post("/{agent_id}/versions", response_model=AgentVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_agent_version(
    agent_id: str,
    body: AgentVersionCreate,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    agent_result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.tenant_id == tenant.id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    count_result = await db.execute(
        select(AgentVersion).where(AgentVersion.agent_id == agent.id)
    )
    existing_versions = count_result.scalars().all()
    next_version = max((v.version_number for v in existing_versions), default=0) + 1

    version = AgentVersion(
        agent_id=agent.id,
        version_number=next_version,
        system_prompt=body.system_prompt,
        pipeline_config=body.pipeline_config,
        tools_config=body.tools_config,
        voice_config=body.voice_config,
    )
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return version


@router.post("/{agent_id}/versions/{version_id}/publish", response_model=AgentVersionResponse)
async def publish_agent_version(
    agent_id: str,
    version_id: str,
    tenant: Tenant = Depends(get_current_tenant),
    db: AsyncSession = Depends(get_db),
):
    agent_result = await db.execute(
        select(Agent).where(Agent.id == uuid.UUID(agent_id), Agent.tenant_id == tenant.id)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    version_result = await db.execute(
        select(AgentVersion).where(
            AgentVersion.id == uuid.UUID(version_id), AgentVersion.agent_id == agent.id
        )
    )
    version = version_result.scalar_one_or_none()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Unpublish all other versions
    for v in agent.versions:
        v.is_published = False

    version.is_published = True
    agent.status = "active"
    await db.commit()
    await db.refresh(version)
    return version
