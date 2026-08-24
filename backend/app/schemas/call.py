import uuid
from datetime import datetime

from pydantic import BaseModel


class CallCreate(BaseModel):
    agent_id: uuid.UUID
    to_number: str
    from_number: str | None = None


class CallResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    direction: str
    from_number: str | None
    to_number: str | None
    status: str
    duration_seconds: int | None
    cost_cents: int
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CallTranscriptResponse(BaseModel):
    id: uuid.UUID
    transcript: list[dict]
    status: str

    model_config = {"from_attributes": True}


class ProviderKeyCreate(BaseModel):
    provider: str
    name: str
    api_key: str


class ProviderKeyResponse(BaseModel):
    id: uuid.UUID
    provider: str
    name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PhoneNumberResponse(BaseModel):
    id: uuid.UUID
    number: str
    friendly_name: str | None
    agent_id: uuid.UUID | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
