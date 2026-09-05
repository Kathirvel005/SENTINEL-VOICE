import logging
from typing import Dict, Any, Tuple
from app.models.task import Task
from app.models.event import SentinelEvent, EventType
from app.state.in_memory import state_store

logger = logging.getLogger("sentinel.stale_guard")


class StaleResultGuard:
    """Independent barrier preventing stale tool or LLM results from ever being spoken."""

    @staticmethod
    async def validate_result(
        session_id: str,
        task: Task,
        result_version: int,
        result_data: Dict[str, Any],
        origin_tool: str = "unknown"
    ) -> Tuple[bool, str]:
        """Validates if an asynchronous result matches the active current task version.
        
        Returns:
            (is_accepted: bool, reason: str)
        """
        current_version = task.current_version
        
        if result_version != current_version:
            reason = (
                f"STALE_RESULT_REJECTED: Result version {result_version} does not match "
                f"current active task version {current_version} for task '{task.task_id}'. "
                f"Tool '{origin_tool}' output fenced and blocked from speech playback."
            )
            logger.warning(reason)
            
            # Record telemetry
            await state_store.update_metrics(
                session_id,
                stale_results_generated=1,
                stale_results_prevented=1,
            )
            
            # Emit telemetry event
            event = SentinelEvent(
                session_id=session_id,
                task_id=task.task_id,
                task_version=result_version,
                event_type=EventType.RESULT_REJECTED,
                description=f"Stale result v{result_version} rejected (active is v{current_version})",
                payload={
                    "origin_tool": origin_tool,
                    "rejected_version": result_version,
                    "active_version": current_version,
                    "reason": reason,
                }
            )
            await state_store.append_event(event)
            return False, reason
        
        # Result matches active version
        accept_reason = (
            f"RESULT_ACCEPTED: Result version {result_version} is active and verified. "
            f"Authorized for Rime speech synthesis."
        )
        logger.info(accept_reason)
        
        event = SentinelEvent(
            session_id=session_id,
            task_id=task.task_id,
            task_version=result_version,
            event_type=EventType.RESULT_ACCEPTED,
            description=f"Result v{result_version} accepted for speech synthesis",
            payload={
                "origin_tool": origin_tool,
                "version": result_version,
                "result_data": result_data,
            }
        )
        await state_store.append_event(event)
        return True, accept_reason
