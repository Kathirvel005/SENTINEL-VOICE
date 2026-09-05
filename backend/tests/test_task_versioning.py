import pytest
from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.models.task import TaskStatus


@pytest.mark.asyncio
async def test_task_creation_and_versioning():
    session = await state_store.get_or_create_session("test_sess_version")
    
    # 1. Create Task v1
    task = await TaskManager.create_task(
        session_id="test_sess_version",
        intent="Find fastest route to Chennai",
        constraints={"highway_allowed": True, "route_preference": "fastest"},
        tool_name="RouteTool",
    )
    
    assert task.current_version == 1
    assert task.intent == "Find fastest route to Chennai"
    assert task.constraints["highway_allowed"] is True
    assert len(task.version_history) == 1
    assert task.version_history[0].version_number == 1
    
    # 2. Increment version upon interruption
    updated_task = await TaskManager.increment_task_version(
        task_id=task.task_id,
        new_intent="Avoid highways and find cheapest route",
        additional_constraints={"highway_allowed": False, "route_preference": "cheapest"},
        cancellation_reason="User voice interrupt",
    )
    
    assert updated_task.current_version == 2
    assert updated_task.intent == "Avoid highways and find cheapest route"
    assert updated_task.constraints["highway_allowed"] is False
    assert updated_task.constraints["route_preference"] == "cheapest"
    assert len(updated_task.version_history) == 2
    
    # Check that v1 was marked INTERRUPTED
    v1 = updated_task.get_version(1)
    assert v1 is not None
    assert v1.status == TaskStatus.INTERRUPTED
    assert v1.cancellation_reason == "User voice interrupt"
    
    # Check that v2 is active
    v2 = updated_task.get_version(2)
    assert v2 is not None
    assert v2.status == TaskStatus.RUNNING
