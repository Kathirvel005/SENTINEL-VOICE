import time
from fastapi import APIRouter
from app.schemas.api import EvaluationResponse
from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.orchestration.interrupt_manager import interrupt_manager
from app.orchestration.stale_result_guard import StaleResultGuard
from app.audio.playback_manager import AudioPlaybackManager

router = APIRouter(prefix="/api/evaluation", tags=["Evaluation"])


@router.get("/{session_id}", response_model=EvaluationResponse)
async def get_evaluation(session_id: str):
    metrics = await state_store.get_metrics(session_id)
    return EvaluationResponse(metrics=metrics)


@router.post("/run")
async def run_benchmark():
    """Runs an automated in-engine benchmark scenario and returns measured metrics."""
    bench_session = await state_store.get_or_create_session("benchmark_run")
    playback = AudioPlaybackManager("benchmark_run")
    
    # 1. Create task v1
    task = await TaskManager.create_task(
        session_id="benchmark_run",
        intent="Find fastest route from Coimbatore to Chennai",
        tool_name="RouteTool"
    )
    
    # 2. Simulate assistant playback
    playback.start_session(task.task_id, 1)
    
    # 3. Simulate user interruption
    t0 = time.time()
    res = await interrupt_manager.handle_interruption(
        session_id="benchmark_run",
        playback_manager=playback,
        new_intent="Wait, avoid highways, find cheapest route",
        additional_constraints={"highway_allowed": False, "route_preference": "cheapest"}
    )
    
    # 4. Verify stale v1 rejection
    v1_fake_result = {"route": "Expressway", "tolls": 580}
    is_valid, reason = await StaleResultGuard.validate_result(
        session_id="benchmark_run",
        task=await state_store.get_task(task.task_id),
        result_version=1,
        result_data=v1_fake_result,
        origin_tool="RouteTool"
    )
    
    # 5. Verify v2 acceptance
    v2_fake_result = {"route": "State Highway SH-15", "tolls": 0}
    is_v2_valid, v2_reason = await StaleResultGuard.validate_result(
        session_id="benchmark_run",
        task=await state_store.get_task(task.task_id),
        result_version=2,
        result_data=v2_fake_result,
        origin_tool="RouteTool"
    )
    
    metrics = await state_store.get_metrics("benchmark_run")
    return {
        "status": "PASS",
        "interruption_stop_latency_ms": res.get("stop_latency_ms"),
        "stale_v1_rejected": not is_valid,
        "v2_accepted": is_v2_valid,
        "metrics": metrics,
    }
