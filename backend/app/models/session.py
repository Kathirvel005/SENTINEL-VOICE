from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time
import uuid
from app.models.task import Task


class OrbState(str, Enum):
    IDLE = "IDLE"
    LISTENING = "LISTENING"
    THINKING = "THINKING"
    TOOL_WORKING = "TOOL_WORKING"
    SPEAKING = "SPEAKING"
    INTERRUPTED = "INTERRUPTED"
    RECOVERING = "RECOVERING"


class ConversationTurn(BaseModel):
    turn_id: str = Field(default_factory=lambda: f"turn_{uuid.uuid4().hex[:8]}")
    timestamp: float = Field(default_factory=time.time)
    role: str  # "user" or "assistant"
    content: str
    task_id: Optional[str] = None
    task_version: Optional[int] = None
    interrupted: bool = False
    language_detected: Optional[str] = "en"
    audio_duration_ms: Optional[float] = None


class Session(BaseModel):
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:8]}")
    created_at: float = Field(default_factory=time.time)
    active_task_id: Optional[str] = None
    orb_state: OrbState = OrbState.IDLE
    current_language: str = "English"
    code_switching_detected: bool = False
    turns: List[ConversationTurn] = Field(default_factory=list)
    accumulated_constraints: Dict[str, Any] = Field(default_factory=dict)
    is_stress_mode: bool = False
    tool_delay_ms: int = 3500
    interruption_threshold: float = 0.65
    speaker_persona: str = "neerja"
    speech_rate: str = "+0%"
    speech_pitch: str = "+0Hz"
