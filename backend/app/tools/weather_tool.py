import asyncio
import time
import logging
from typing import Dict, Any, Optional, Callable, Awaitable
from app.tools.base import BaseTool
from app.models.event import EventType

logger = logging.getLogger("sentinel.weather_tool")


class WeatherTool(BaseTool):
    """Provides current and forecasted weather for given locations."""

    def __init__(self):
        super().__init__(name="WeatherTool")

    async def execute(
        self,
        session_id: str,
        task_id: str,
        task_version: int,
        params: Dict[str, Any],
        cancellation_token: asyncio.Event,
        progress_callback: Optional[Callable[[int, str], Awaitable[None]]] = None,
        artificial_delay_ms: int = 2500,
    ) -> Dict[str, Any]:
        location = params.get("location", "Chennai")
        start_time = time.time()

        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_STARTED,
            description=f"Querying weather radar for {location}",
            payload={"location": location}
        )

        # Allow cancellation
        half_delay = (artificial_delay_ms / 1000.0) / 2
        await asyncio.sleep(half_delay)
        if cancellation_token.is_set():
            await self.emit_event(
                session_id=session_id,
                task_id=task_id,
                task_version=task_version,
                event_type=EventType.TOOL_CANCELLED,
                description=f"Weather query for {location} cancelled",
                payload={"location": location}
            )
            raise asyncio.CancelledError("WeatherTool cancelled")

        await asyncio.sleep(half_delay)
        if cancellation_token.is_set():
            raise asyncio.CancelledError("WeatherTool cancelled")

        result = {
            "location": location,
            "temperature_c": 31,
            "condition": "Partly Cloudy with high humidity",
            "humidity_percent": 78,
            "precipitation_chance": "20%",
            "uv_index": 8,
            "advisory": "Comfortable for indoor and shaded outdoor activities.",
            "summary": f"The weather in {location} is currently 31 degrees Celsius, partly cloudy with 78% humidity."
        }

        elapsed_ms = (time.time() - start_time) * 1000.0
        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_COMPLETED,
            description=f"Weather retrieved for {location}: 31°C, Partly Cloudy",
            payload={"result": result, "elapsed_ms": elapsed_ms}
        )
        return result
