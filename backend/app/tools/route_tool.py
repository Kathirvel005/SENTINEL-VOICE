import asyncio
import time
import logging
from typing import Dict, Any, Optional, Callable, Awaitable
from app.tools.base import BaseTool
from app.models.event import EventType

logger = logging.getLogger("sentinel.route_tool")


class RouteTool(BaseTool):
    """Calculates navigation routes with configurable artificial latency and cancellation."""

    def __init__(self):
        super().__init__(name="RouteTool")

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
        origin = params.get("origin", "Coimbatore")
        destination = params.get("destination", "Chennai")
        route_preference = params.get("route_preference", "fastest")
        highway_allowed = params.get("highway_allowed", True)

        start_time = time.time()
        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_STARTED,
            description=f"Route calculation started: {origin} -> {destination} ({route_preference}, highways={highway_allowed})",
            payload={
                "origin": origin,
                "destination": destination,
                "preference": route_preference,
                "highway_allowed": highway_allowed,
                "delay_ms": artificial_delay_ms,
            }
        )

        # Simulate heavy route optimization in steps to allow cooperative cancellation
        steps = 5
        step_interval = (artificial_delay_ms / 1000.0) / steps

        for step in range(1, steps + 1):
            if cancellation_token.is_set():
                logger.warning(f"RouteTool for task {task_id} v{task_version} cancelled at step {step}/{steps}")
                await self.emit_event(
                    session_id=session_id,
                    task_id=task_id,
                    task_version=task_version,
                    event_type=EventType.TOOL_CANCELLED,
                    description=f"Route calculation aborted mid-execution (step {step}/{steps}) due to interruption",
                    payload={"step": step, "total_steps": steps}
                )
                raise asyncio.CancelledError("Route calculation cancelled by user interrupt")

            progress_pct = int((step / steps) * 100)
            step_desc = f"Analyzing segments {step}/{steps} (Corridor {origin}-{destination})"
            if progress_callback:
                await progress_callback(progress_pct, step_desc)

            await self.emit_event(
                session_id=session_id,
                task_id=task_id,
                task_version=task_version,
                event_type=EventType.TOOL_PROGRESS,
                description=f"Route analysis {progress_pct}%: {step_desc}",
                payload={"progress_percent": progress_pct, "step": step}
            )
            await asyncio.sleep(step_interval)

        # Final cancellation check before returning
        if cancellation_token.is_set():
            raise asyncio.CancelledError("Cancelled at finish")

        # Formulate realistic result based on constraints
        if not highway_allowed or route_preference in ["cheapest", "no_toll"]:
            result = {
                "origin": origin,
                "destination": destination,
                "route_name": "State Highway SH-15 via Tiruvannamalai (Non-Highway Route)",
                "distance_km": 495,
                "estimated_duration": "9 hours 30 mins",
                "toll_cost_inr": 0,
                "highway_used": False,
                "cheapest": True,
                "highlights": ["Zero tolls", "Avoids all national expressways", "Scenic countryside"],
                "summary": f"Cheapest non-highway route from {origin} to {destination} is via SH-15 and Tiruvannamalai. Distance is 495 km, estimated time 9.5 hours, with zero toll charges."
            }
        else:
            result = {
                "origin": origin,
                "destination": destination,
                "route_name": "National Highway NH-544 / NH-44 via Salem & Vellore (Express Route)",
                "distance_km": 510,
                "estimated_duration": "7 hours 45 mins",
                "toll_cost_inr": 580,
                "highway_used": True,
                "cheapest": False,
                "highlights": ["Fastest four-lane expressway", "Smooth transit", "Multiple food plazas"],
                "summary": f"Fastest route from {origin} to {destination} is via NH-544 and NH-44 through Salem and Vellore. Distance is 510 km, estimated duration 7 hours 45 minutes, with total tolls of 580 rupees."
            }

        elapsed_ms = (time.time() - start_time) * 1000.0
        await self.emit_event(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            event_type=EventType.TOOL_COMPLETED,
            description=f"Route calculation completed in {elapsed_ms:.1f}ms: {result['route_name']}",
            payload={"result": result, "elapsed_ms": elapsed_ms}
        )
        return result
