import asyncio
import time
import logging
from typing import Dict, Any, Optional, Callable, Awaitable
from app.tools.base import BaseTool
from app.models.event import EventType

logger = logging.getLogger("sentinel.search_tool")


class SearchTool(BaseTool):
    """Simulated general web search tool with cancellation tokens."""

    def __init__(self):
        super().__init__(name="SearchTool")

    async def execute(
        self,
        session_id: str,
        task_id: str,
        task_version: int,
        params: Dict[str, Any],
        cancellation_token: asyncio.Event,
        progress_callback: Optional[Callable[[int, str], Awaitable[None]]] = None,
        artificial_delay_ms: int = 2000,
    ) -> Dict[str, Any]:
        query = params.get("query", "")
        start_time = time.time()

        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_STARTED,
            description=f"Executing search: '{query}'",
            payload={"query": query}
        )

        steps = 4
        interval = (artificial_delay_ms / 1000.0) / steps
        for step in range(1, steps + 1):
            if cancellation_token.is_set():
                await self.emit_event(
                    session_id=session_id,
                    task_id=task_id,
                    task_version=task_version,
                    event_type=EventType.TOOL_CANCELLED,
                    description=f"Search for '{query}' cancelled",
                    payload={"step": step}
                )
                raise asyncio.CancelledError("SearchTool cancelled")
            await asyncio.sleep(interval)

        result = {
            "query": query,
            "top_result": f"Verified information regarding '{query}'",
            "snippets": [
                f"Realtime index result for {query}",
                "Confirmed telemetry and status data"
            ],
            "summary": f"Here is the latest data found for {query}."
        }

        elapsed_ms = (time.time() - start_time) * 1000.0
        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_COMPLETED,
            description=f"Search completed for '{query}'",
            payload={"result": result, "elapsed_ms": elapsed_ms}
        )
        return result
