from enum import Enum
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
import time
import uuid


class EventType(str, Enum):
    SESSION_STARTED = "SESSION_STARTED"
    USER_SPEECH = "USER_SPEECH"
    TASK_CREATED = "TASK_CREATED"
    TOOL_STARTED = "TOOL_STARTED"
    TOOL_PROGRESS = "TOOL_PROGRESS"
    TOOL_COMPLETED = "TOOL_COMPLETED"
    TOOL_CANCELLED = "TOOL_CANCELLED"
    RIME_STREAM_STARTED = "RIME_STREAM_STARTED"
    USER_INTERRUPT = "USER_INTERRUPT"
    AUDIO_STOPPED = "AUDIO_STOPPED"
    TASK_INVALIDATED = "TASK_INVALIDATED"
    TASK_VERSION_INCREMENTED = "TASK_VERSION_INCREMENTED"
    RESULT_REJECTED = "RESULT_REJECTED"
    RESULT_ACCEPTED = "RESULT_ACCEPTED"
    RIME_RESPONSE_PLAYED = "RIME_RESPONSE_PLAYED"
    STATE_UPDATED = "STATE_UPDATED"
    RECOVERY_COMPLETED = "RECOVERY_COMPLETED"
    ERROR = "ERROR"


class SentinelEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:8]}")
    timestamp: float = Field(default_factory=time.time)
    formatted_time: str = Field(default_factory=lambda: time.strftime("%H:%M:%S"))
    session_id: str
    task_id: Optional[str] = None
    task_version: Optional[int] = None
    event_type: EventType
    description: str
    payload: Dict[str, Any] = Field(default_factory=dict)
