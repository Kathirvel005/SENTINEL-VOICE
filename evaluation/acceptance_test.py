import sys
import os
import time
import asyncio

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.orchestration.interrupt_manager import interrupt_manager
from app.orchestration.stale_result_guard import StaleResultGuard
from app.audio.playback_manager import AudioPlaybackManager, PlaybackState
from app.providers.rime.client import rime_service
from app.providers.llm.smart_intent_engine import SmartIntentEngine
from app.models.task import TaskStatus


async def run_acceptance_test():
    session_id = f"acceptance_session_{int(time.time())}"
    session = await state_store.get_or_create_session(session_id)
    playback = AudioPlaybackManager(session_id)
    intent_engine = SmartIntentEngine()

    checks = {
        "interrupt_detected": False,
        "audio_stopped": False,
        "old_task_invalidated": False,
        "stale_result_rejected": False,
        "new_task_created": False,
        "context_preserved": False,
        "final_response_current": False,
    }

    # 1. Start task v1
    v1_intent = "Find the fastest route from Coimbatore to Chennai"
    task = await TaskManager.create_task(
        session_id=session_id,
        intent=v1_intent,
        constraints={"origin": "Coimbatore", "destination": "Chennai", "highway_allowed": True},
        tool_name="RouteTool",
    )
    assert task.current_version == 1

    # 2. Introduce fixed tool delay & 3. Start Rime response
    playback.start_session(task.task_id, 1)
    v1_speech_text = "I'm checking the available routes from Coimbatore to Chennai..."
    await playback.enqueue_chunk(b"\x00\x01\x00\x02" * 50, task_version=1)

    # Simulate in-flight tool execution
    tool_token_v1 = asyncio.Event()
    interrupt_manager.register_tool_token(task.task_id, 1, tool_token_v1)

    # 4. User interrupts with new constraint
    # "Wait! Don't use highways. I want the cheapest route."
    interruption_text = "Wait! Don't use highways. I want the cheapest route."
    parsed_v2 = await intent_engine.parse_intent_and_constraints(
        interruption_text,
        conversation_context=[{"role": "user", "content": v1_intent}],
        existing_constraints=task.constraints,
    )

    # 5. Stop audio & trigger interruption
    int_result = await interrupt_manager.handle_interruption(
        session_id=session_id,
        playback_manager=playback,
        new_intent=interruption_text,
        additional_constraints=parsed_v2["updated_constraints"],
        reason="User voice interrupt during playback",
    )

    if int_result["status"] == "success":
        checks["interrupt_detected"] = True

    if playback.state == PlaybackState.STOPPED and playback.audio_queue.empty():
        checks["audio_stopped"] = True

    # 6. Verify old task invalidated and task v2 created
    updated_task = await state_store.get_task(task.task_id)
    v1_record = updated_task.get_version(1)
    if v1_record and v1_record.status == TaskStatus.INTERRUPTED:
        checks["old_task_invalidated"] = True

    if updated_task.current_version == 2:
        checks["new_task_created"] = True

    # Context preservation check: origin & destination must be preserved, highway_allowed updated
    if (
        updated_task.constraints.get("origin") == "Coimbatore"
        and updated_task.constraints.get("destination") == "Chennai"
        and updated_task.constraints.get("highway_allowed") is False
        and updated_task.constraints.get("route_preference") == "cheapest"
    ):
        checks["context_preserved"] = True

    # 7. Allow v1 result to arrive (simulated delayed arrival)
    v1_stale_result = {
        "origin": "Coimbatore",
        "destination": "Chennai",
        "route_name": "NH-544 / NH-44 Express Highway",
        "highway_used": True,
        "tolls": 580,
    }

    # 8. Verify v1 is rejected by StaleResultGuard
    is_v1_valid, v1_reason = await StaleResultGuard.validate_result(
        session_id=session_id,
        task=updated_task,
        result_version=1,
        result_data=v1_stale_result,
        origin_tool="RouteTool",
    )
    if not is_v1_valid and "STALE_RESULT_REJECTED" in v1_reason:
        checks["stale_result_rejected"] = True

    # 9. Allow v2 result to arrive
    v2_fresh_result = {
        "origin": "Coimbatore",
        "destination": "Chennai",
        "route_name": "State Highway SH-15 via Tiruvannamalai",
        "highway_used": False,
        "cheapest": True,
        "tolls": 0,
        "estimated_duration": "9 hours 30 mins",
    }

    # 10. Verify v2 is accepted
    is_v2_valid, v2_reason = await StaleResultGuard.validate_result(
        session_id=session_id,
        task=updated_task,
        result_version=2,
        result_data=v2_fresh_result,
        origin_tool="RouteTool",
    )
    assert is_v2_valid is True

    # 11. Verify final spoken response belongs to v2
    v2_response = await intent_engine.generate_response(
        user_utterance=interruption_text,
        tool_result=v2_fresh_result,
        task_version=2,
        conversation_context=[],
    )

    if (
        "Avoiding highways" in v2_response
        or "cheapest route" in v2_response
        or "SH-15" in v2_response
        or "State Highway 15" in v2_response
    ) and "NH-544" not in v2_response:
        checks["final_response_current"] = True

    # Output formatted report
    all_passed = all(checks.values())

    print("====================================")
    print("SENTINEL ACCEPTANCE TEST")
    print("====================================\n")
    print(f"Interrupt detected: {'PASS' if checks['interrupt_detected'] else 'FAIL'}")
    print(f"Audio stopped: {'PASS' if checks['audio_stopped'] else 'FAIL'}")
    print(f"Old task invalidated: {'PASS' if checks['old_task_invalidated'] else 'FAIL'}")
    print(f"Stale result rejected: {'PASS' if checks['stale_result_rejected'] else 'FAIL'}")
    print(f"New task created: {'PASS' if checks['new_task_created'] else 'FAIL'}")
    print(f"Context preserved: {'PASS' if checks['context_preserved'] else 'FAIL'}")
    print(f"Final response current: {'PASS' if checks['final_response_current'] else 'FAIL'}\n")
    print(f"RESULT: {'PASS' if all_passed else 'FAIL'}")
    print("====================================")

    return all_passed


if __name__ == "__main__":
    success = asyncio.run(run_acceptance_test())
    sys.exit(0 if success else 1)
