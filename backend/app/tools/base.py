import asyncio
import time
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Callable, Awaitable
from app.models.event import SentinelEvent, EventType
from app.state.in_memory import state_store

logger = logging.getLogger("sentinel.tools")


class BaseTool(ABC):
    """Abstract base class for tools with cancellation, version tagging, and event emission."""

    def __init__(self, name: str):
        self.name = name

    async def emit_event(
        self,
        session_id: str,
        task_id: str,
        task_version: int,
        event_type: EventType,
        description: str,
        payload: Dict[str, Any],
    ):
        event = SentinelEvent(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=event_type,
            description=description,
            payload=payload,
        )
        await state_store.append_event(event)

    @abstractmethod
    async def execute(
        self,
        session_id: str,
        task_id: str,
        task_version: int,
        params: Dict[str, Any],
        cancellation_token: asyncio.Event,
        progress_callback: Optional[Callable[[int, str], Awaitable[None]]] = None,
        artificial_delay_ms: int = 3500,
    ) -> Dict[str, Any]:
        """Executes the tool logic with cooperative cancellation check."""
        pass
