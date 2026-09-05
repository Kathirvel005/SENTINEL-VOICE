from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time
import uuid


class TaskStatus(str, Enum):
    CREATED = "CREATED"
    RUNNING = "RUNNING"
    INTERRUPTED = "INTERRUPTED"
    CANCEL_REQUESTED = "CANCEL_REQUESTED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"
    STALE = "STALE"
    FAILED = "FAILED"


class TaskConstraint(BaseModel):
    key: str
    value: Any
    is_negated: bool = False  # e.g., highway_avoid: True


class TaskVersion(BaseModel):
    session_id: str
    task_id: str
    version_number: int
    intent: str
    constraints: Dict[str, Any] = Field(default_factory=dict)
    status: TaskStatus = TaskStatus.CREATED
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    cancellation_reason: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    spoken_response: Optional[str] = None


class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task_{uuid.uuid4().hex[:8]}")
    session_id: str
    current_version: int = 1
    intent: str
    constraints: Dict[str, Any] = Field(default_factory=dict)
    status: TaskStatus = TaskStatus.CREATED
    tool_name: Optional[str] = None
    created_at: float = Field(default_factory=time.time)
    updated_at: float = Field(default_factory=time.time)
    version_history: List[TaskVersion] = Field(default_factory=list)
    active_result: Optional[Dict[str, Any]] = None

    def get_version(self, version_num: int) -> Optional[TaskVersion]:
        for v in self.version_history:
            if v.version_number == version_num:
                return v
        return None
