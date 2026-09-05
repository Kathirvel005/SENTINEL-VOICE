from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.models.task import Task, TaskVersion, TaskStatus
from app.models.session import Session, OrbState
from app.models.event import SentinelEvent
from app.models.evaluation import EvaluationMetrics


class CreateSessionRequest(BaseModel):
    is_stress_mode: bool = False
    tool_delay_ms: int = 3500
    interruption_threshold: float = 0.65


class CreateSessionResponse(BaseModel):
    session: Session


class CreateTaskRequest(BaseModel):
    session_id: str
    intent: str
    constraints: Optional[Dict[str, Any]] = None
    tool_name: Optional[str] = None


class InterruptTaskRequest(BaseModel):
    session_id: str
    new_intent: Optional[str] = None
    additional_constraints: Optional[Dict[str, Any]] = None
    reason: str = "User interrupted via voice activity"


class TaskResponse(BaseModel):
    task: Task


class EventsResponse(BaseModel):
    session_id: str
    events: List[SentinelEvent]


class EvaluationResponse(BaseModel):
    metrics: EvaluationMetrics


class WSClientMessage(BaseModel):
    type: str  # "audio_chunk", "interrupt", "user_utterance", "set_mode", "ping"
    session_id: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class WSServerMessage(BaseModel):
    type: str  # "state_change", "audio_chunk", "event", "transcript", "stale_rejected", "metrics_update", "error"
    session_id: str
    payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: float
