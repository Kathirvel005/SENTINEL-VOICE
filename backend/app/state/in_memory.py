import asyncio
from typing import Dict, List, Optional
from app.models.session import Session, OrbState
from app.models.task import Task, TaskVersion
from app.models.event import SentinelEvent, EventType
from app.models.evaluation import EvaluationMetrics


class InMemoryStateStore:
    """Thread-safe, asynchronous in-memory state store for Sentinel Voice."""

    def __init__(self):
        self._lock = asyncio.Lock()
        self.sessions: Dict[str, Session] = {}
        self.tasks: Dict[str, Task] = {}
        self.events: Dict[str, List[SentinelEvent]] = {}
        self.metrics: Dict[str, EvaluationMetrics] = {}

    async def get_or_create_session(
        self,
        session_id: Optional[str] = None,
        is_stress_mode: bool = False,
        tool_delay_ms: int = 3500,
        interruption_threshold: float = 0.65,
    ) -> Session:
        async with self._lock:
            if session_id and session_id in self.sessions:
                return self.sessions[session_id]
            
            session = Session(
                session_id=session_id or f"sess_{len(self.sessions) + 1}",
                is_stress_mode=is_stress_mode,
                tool_delay_ms=tool_delay_ms,
                interruption_threshold=interruption_threshold,
            )
            self.sessions[session.session_id] = session
            self.events[session.session_id] = []
            self.metrics[session.session_id] = EvaluationMetrics(session_id=session.session_id)
            return session

    async def get_session(self, session_id: str) -> Optional[Session]:
        async with self._lock:
            return self.sessions.get(session_id)

    async def update_orb_state(self, session_id: str, state: OrbState):
        async with self._lock:
            if session_id in self.sessions:
                self.sessions[session_id].orb_state = state

    async def set_active_task(self, session_id: str, task_id: str):
        async with self._lock:
            if session_id in self.sessions:
                self.sessions[session_id].active_task_id = task_id

    async def save_task(self, task: Task):
        async with self._lock:
            self.tasks[task.task_id] = task

    async def get_task(self, task_id: str) -> Optional[Task]:
        async with self._lock:
            return self.tasks.get(task_id)

    async def append_event(self, event: SentinelEvent):
        async with self._lock:
            if event.session_id not in self.events:
                self.events[event.session_id] = []
            self.events[event.session_id].append(event)

    async def get_events(self, session_id: str, limit: int = 100) -> List[SentinelEvent]:
        async with self._lock:
            evts = self.events.get(session_id, [])
            return evts[-limit:]

    async def get_metrics(self, session_id: str) -> EvaluationMetrics:
        async with self._lock:
            if session_id not in self.metrics:
                self.metrics[session_id] = EvaluationMetrics(session_id=session_id)
            self.metrics[session_id].recompute()
            return self.metrics[session_id]

    async def update_metrics(self, session_id: str, **kwargs):
        async with self._lock:
            if session_id not in self.metrics:
                self.metrics[session_id] = EvaluationMetrics(session_id=session_id)
            metrics = self.metrics[session_id]
            for k, v in kwargs.items():
                if hasattr(metrics, k):
                    current_val = getattr(metrics, k)
                    if isinstance(current_val, list) and isinstance(v, (int, float)):
                        current_val.append(v)
                    elif isinstance(current_val, int) and isinstance(v, int):
                        setattr(metrics, k, current_val + v)
                    else:
                        setattr(metrics, k, v)
            metrics.recompute()


# Global singleton store
state_store = InMemoryStateStore()
