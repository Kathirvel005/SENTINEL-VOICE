import asyncio
import time
import logging
from typing import Dict, Any, Optional, Callable, Awaitable
from app.tools.base import BaseTool
from app.models.event import EventType

logger = logging.getLogger("sentinel.activity_tool")


class ActivityTool(BaseTool):
    """Recommends indoor or outdoor activities based on preferences and context."""

    def __init__(self):
        super().__init__(name="ActivityTool")

    async def execute(
        self,
        session_id: str,
        task_id: str,
        task_version: int,
        params: Dict[str, Any],
        cancellation_token: asyncio.Event,
        progress_callback: Optional[Callable[[int, str], Awaitable[None]]] = None,
        artificial_delay_ms: int = 3000,
    ) -> Dict[str, Any]:
        location = params.get("location", "Chennai")
        activity_type = params.get("activity_type", "outdoor").lower()  # "indoor" or "outdoor"
        start_time = time.time()

        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_STARTED,
            description=f"Searching for {activity_type} activities in {location}",
            payload={"location": location, "activity_type": activity_type}
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
                    description=f"{activity_type.capitalize()} activity search cancelled due to constraint update",
                    payload={"step": step, "activity_type": activity_type}
                )
                raise asyncio.CancelledError("Activity search cancelled")
            await asyncio.sleep(interval)

        if activity_type == "indoor":
            result = {
                "location": location,
                "activity_type": "indoor",
                "recommendation": "DakshinaChitra Heritage Museum or Phoenix MarketCity Arcade",
                "details": "Air-conditioned indoor arts experience and interactive entertainment zone.",
                "duration": "2 - 3 hours",
                "summary": f"For indoor activities in {location}, I recommend visiting the air-conditioned DakshinaChitra cultural gallery or Phoenix entertainment center."
            }
        else:
            result = {
                "location": location,
                "activity_type": "outdoor",
                "recommendation": "Marina Beach Promenade Walk and Guindy National Park Trail",
                "details": "Scenic coastal breeze walk followed by shaded deer park trail.",
                "duration": "2 - 4 hours",
                "summary": f"For outdoor activities in {location}, the evening breeze along Marina Beach promenade and Guindy nature trail is ideal."
            }

        elapsed_ms = (time.time() - start_time) * 1000.0
        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_COMPLETED,
            description=f"Activity recommendations found: {result['recommendation']}",
            payload={"result": result, "elapsed_ms": elapsed_ms}
        )
        return result
