import pytest
from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.orchestration.stale_result_guard import StaleResultGuard


@pytest.mark.asyncio
async def test_stale_result_guard_rejection():
    session_id = "test_sess_guard"
    session = await state_store.get_or_create_session(session_id)
    
    # Create task v1
    task = await TaskManager.create_task(
        session_id=session_id,
        intent="Find fastest route to Chennai",
        tool_name="RouteTool",
    )
    
    # Advance task to v2 (interruption happened)
    updated_task = await TaskManager.increment_task_version(
        task_id=task.task_id,
        new_intent="Avoid highways",
        additional_constraints={"highway_allowed": False},
    )
    assert updated_task.current_version == 2
    
    # Simulate obsolete v1 tool result arriving
    v1_result = {
        "route_name": "NH-544 Express Highway",
        "highway_used": True,
        "tolls": 580,
    }
    
    is_valid, reason = await StaleResultGuard.validate_result(
        session_id=session_id,
        task=updated_task,
        result_version=1,
        result_data=v1_result,
        origin_tool="RouteTool",
    )
    
    # MUST BE REJECTED
    assert is_valid is False
    assert "STALE_RESULT_REJECTED" in reason
    assert "v1" in reason or "version 1" in reason
    
    # Now simulate v2 tool result arriving
    v2_result = {
        "route_name": "SH-15 Non-Highway",
        "highway_used": False,
        "tolls": 0,
    }
    
    is_v2_valid, v2_reason = await StaleResultGuard.validate_result(
        session_id=session_id,
        task=updated_task,
        result_version=2,
        result_data=v2_result,
        origin_tool="RouteTool",
    )
    
    # MUST BE ACCEPTED
    assert is_v2_valid is True
    assert "RESULT_ACCEPTED" in v2_reason
    
    # Verify metrics: stale_results_spoken MUST be 0
    metrics = await state_store.get_metrics(session_id)
    assert metrics.stale_results_generated >= 1
    assert metrics.stale_results_prevented >= 1
    assert metrics.stale_results_spoken == 0
    assert metrics.stale_prevention_rate == 100.0
