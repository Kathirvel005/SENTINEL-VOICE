import time
import asyncio
import logging
from typing import Dict, Any, Optional
from app.models.task import Task
from app.models.session import OrbState
from app.models.event import SentinelEvent, EventType
from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.audio.playback_manager import AudioPlaybackManager
from app.providers.rime.client import rime_service

logger = logging.getLogger("sentinel.interrupt_manager")


class InterruptManager:
    """Orchestrates instantaneous interruption, audio halting, tool cancellation, and state recovery."""

    def __init__(self):
        self.active_cancellation_tokens: Dict[str, asyncio.Event] = {}

    def register_tool_token(self, task_id: str, version_num: int, token: asyncio.Event):
        key = f"{task_id}_v{version_num}"
        self.active_cancellation_tokens[key] = token

    def unregister_tool_token(self, task_id: str, version_num: int):
        key = f"{task_id}_v{version_num}"
        self.active_cancellation_tokens.pop(key, None)

    async def handle_interruption(
        self,
        session_id: str,
        playback_manager: AudioPlaybackManager,
        new_intent: Optional[str] = None,
        additional_constraints: Optional[Dict[str, Any]] = None,
        reason: str = "Voice activity detected during playback",
    ) -> Dict[str, Any]:
        """Executes full interruption sequence in sub-50ms window."""
        t_interrupt = time.time()
        session = await state_store.get_session(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")

        active_task_id = session.active_task_id
        if not active_task_id:
            logger.info("Interruption triggered but no active task found.")
            return {"status": "no_active_task"}

        task = await state_store.get_task(active_task_id)
        if not task:
            return {"status": "task_not_found"}

        old_version = task.current_version

        # 1. Emit USER_INTERRUPT event
        await state_store.append_event(
            SentinelEvent(
                session_id=session_id,
                task_id=task.task_id,
                task_version=old_version,
                event_type=EventType.USER_INTERRUPT,
                description=f"Interruption detected on task {task.task_id} v{old_version}: {reason}",
                payload={"reason": reason, "timestamp": t_interrupt}
            )
        )

        # 2. Halt Rime audio playback & clear queues immediately
        stop_latency_ms = await playback_manager.stop(reason=reason)
        rime_service.cancel(task.task_id, old_version)

        # 3. Cancel active in-flight tool token
        token_key = f"{task.task_id}_v{old_version}"
        if token_key in self.active_cancellation_tokens:
            self.active_cancellation_tokens[token_key].set()
            logger.info(f"Cancellation token set for {token_key}")

        # 4. Emit AUDIO_STOPPED event
        await state_store.append_event(
            SentinelEvent(
                session_id=session_id,
                task_id=task.task_id,
                task_version=old_version,
                event_type=EventType.AUDIO_STOPPED,
                description=f"Audio playback purged in {stop_latency_ms:.1f}ms",
                payload={"stop_latency_ms": stop_latency_ms}
            )
        )

        # 5. Set session orb state to INTERRUPTED
        await state_store.update_orb_state(session_id, OrbState.INTERRUPTED)

        # 6. Increment task version & invalidate previous version
        effective_intent = new_intent or f"Updated from: {task.intent}"
        updated_task = await TaskManager.increment_task_version(
            task_id=task.task_id,
            new_intent=effective_intent,
            additional_constraints=additional_constraints,
            cancellation_reason=reason,
        )

        # 7. Update evaluation metrics
        await state_store.update_metrics(
            session_id,
            total_interruptions=1,
            successful_recoveries=1,
            interruption_stop_latencies_ms=stop_latency_ms,
        )

        # Transition state to RECOVERING
        await state_store.update_orb_state(session_id, OrbState.RECOVERING)

        logger.info(
            f"Interruption cycle complete for {session_id}. Task {task.task_id} v{old_version} -> "
            f"v{updated_task.current_version}. Stop latency: {stop_latency_ms:.2f}ms"
        )

        return {
            "status": "success",
            "task_id": task.task_id,
            "old_version": old_version,
            "new_version": updated_task.current_version,
            "stop_latency_ms": stop_latency_ms,
        }


interrupt_manager = InterruptManager()
