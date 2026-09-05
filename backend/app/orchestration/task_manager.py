import time
import logging
from typing import Dict, Any, Optional
from app.models.task import Task, TaskVersion, TaskStatus
from app.models.event import SentinelEvent, EventType
from app.state.in_memory import state_store

logger = logging.getLogger("sentinel.task_manager")


class TaskManager:
    """Manages the full lifecycle and versioning of conversational tasks."""

    @staticmethod
    async def create_task(
        session_id: str,
        intent: str,
        constraints: Optional[Dict[str, Any]] = None,
        tool_name: Optional[str] = None,
    ) -> Task:
        constraints = constraints or {}
        task = Task(
            session_id=session_id,
            current_version=1,
            intent=intent,
            constraints=constraints,
            status=TaskStatus.CREATED,
            tool_name=tool_name,
        )
        
        initial_version = TaskVersion(
            session_id=session_id,
            task_id=task.task_id,
            version_number=1,
            intent=intent,
            constraints=dict(constraints),
            status=TaskStatus.CREATED,
        )
        task.version_history.append(initial_version)
        
        await state_store.save_task(task)
        await state_store.set_active_task(session_id, task.task_id)
        await state_store.update_metrics(session_id, total_tasks=1)
        
        event = SentinelEvent(
            session_id=session_id,
            task_id=task.task_id,
            task_version=1,
            event_type=EventType.TASK_CREATED,
            description=f"Task {task.task_id} v1 created: '{intent}'",
            payload={
                "intent": intent,
                "constraints": constraints,
                "tool_name": tool_name,
                "version": 1,
            }
        )
        await state_store.append_event(event)
        logger.info(f"Created task {task.task_id} v1 for session {session_id}")
        return task

    @staticmethod
    async def increment_task_version(
        task_id: str,
        new_intent: str,
        additional_constraints: Optional[Dict[str, Any]] = None,
        cancellation_reason: str = "User interrupted",
    ) -> Task:
        task = await state_store.get_task(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        old_version_num = task.current_version
        
        # Mark previous version as INTERRUPTED / CANCELLED
        for v in task.version_history:
            if v.version_number == old_version_num:
                v.status = TaskStatus.INTERRUPTED
                v.cancellation_reason = cancellation_reason
                v.updated_at = time.time()
                break

        # Increment version number
        new_version_num = old_version_num + 1
        task.current_version = new_version_num
        task.status = TaskStatus.RUNNING
        task.intent = new_intent
        
        # Merge constraints (preserves context while overriding changed keys)
        if additional_constraints:
            task.constraints.update(additional_constraints)
            
        task.updated_at = time.time()
        
        new_version = TaskVersion(
            session_id=task.session_id,
            task_id=task.task_id,
            version_number=new_version_num,
            intent=new_intent,
            constraints=dict(task.constraints),
            status=TaskStatus.RUNNING,
        )
        task.version_history.append(new_version)
        
        await state_store.save_task(task)
        
        # Invalidate old task event
        inv_event = SentinelEvent(
            session_id=task.session_id,
            task_id=task.task_id,
            task_version=old_version_num,
            event_type=EventType.TASK_INVALIDATED,
            description=f"Task {task.task_id} v{old_version_num} invalidated due to interruption",
            payload={
                "invalidated_version": old_version_num,
                "reason": cancellation_reason,
            }
        )
        await state_store.append_event(inv_event)

        # Version incremented event
        inc_event = SentinelEvent(
            session_id=task.session_id,
            task_id=task.task_id,
            task_version=new_version_num,
            event_type=EventType.TASK_VERSION_INCREMENTED,
            description=f"Task {task.task_id} transitioned to v{new_version_num}: '{new_intent}'",
            payload={
                "version": new_version_num,
                "intent": new_intent,
                "merged_constraints": task.constraints,
            }
        )
        await state_store.append_event(inc_event)
        
        logger.info(f"Task {task_id} incremented from v{old_version_num} to v{new_version_num}")
        return task

    @staticmethod
    async def complete_task_version(
        task_id: str,
        version_num: int,
        result: Dict[str, Any],
        spoken_response: Optional[str] = None
    ) -> Optional[Task]:
        task = await state_store.get_task(task_id)
        if not task:
            return None

        # Verify version
        if task.current_version != version_num:
            logger.warning(
                f"Attempted to complete version {version_num} of task {task_id}, "
                f"but active version is {task.current_version}. Fenced."
            )
            return task

        task.status = TaskStatus.COMPLETED
        task.active_result = result
        task.updated_at = time.time()
        
        for v in task.version_history:
            if v.version_number == version_num:
                v.status = TaskStatus.COMPLETED
                v.result = result
                v.spoken_response = spoken_response
                v.updated_at = time.time()
                break

        await state_store.save_task(task)
        return task
