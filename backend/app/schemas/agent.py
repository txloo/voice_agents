import uuid
from datetime import datetime

from pydantic import BaseModel


class AgentCreate(BaseModel):
    name: str
    description: str | None = None


class AgentUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None


class AgentResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    name: str
    description: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class AgentVersionCreate(BaseModel):
    system_prompt: str
    pipeline_config: dict = {}
    tools_config: dict = {}
    voice_config: dict = {}


class AgentVersionResponse(BaseModel):
    id: uuid.UUID
    agent_id: uuid.UUID
    version_number: int
    system_prompt: str
    pipeline_config: dict
    tools_config: dict
    voice_config: dict
    is_published: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PipelineConfig(BaseModel):
    stt_provider: str = "deepgram"
    stt_model: str = "nova-3"
    llm_provider: str = "openai"
    llm_model: str = "gpt-4o-mini"
    tts_provider: str = "fish"
    tts_model: str = "s2.1-pro-free"
    voice_id: str | None = "9a9cf47702da476aa4629e2506d4a857"


class VoiceConfig(BaseModel):
    greeting: str = "Hello, how can I help you today?"
    language: str = "en"
    max_tokens: int = 300
    temperature: float = 0.7
