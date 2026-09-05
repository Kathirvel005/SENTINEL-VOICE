import pytest
import asyncio
from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.orchestration.interrupt_manager import interrupt_manager
from app.audio.playback_manager import AudioPlaybackManager, PlaybackState
from app.models.session import OrbState


@pytest.mark.asyncio
async def test_audio_and_task_interruption():
    session_id = "test_sess_interrupt"
    session = await state_store.get_or_create_session(session_id)
    playback = AudioPlaybackManager(session_id)
    
    # 1. Create task v1
    task = await TaskManager.create_task(
        session_id=session_id,
        intent="Check weather and outdoor activity",
        tool_name="ActivityTool",
    )
    
    # 2. Simulate audio playback active
    playback.start_session(task.task_id, 1)
    await playback.enqueue_chunk(b"\x00\x01\x00\x02" * 100, task_version=1)
    assert playback.state == PlaybackState.PLAYING
    assert not playback.audio_queue.empty()
    
    # Register dummy tool token
    tool_token = asyncio.Event()
    interrupt_manager.register_tool_token(task.task_id, 1, tool_token)
    
    # 3. Trigger interruption
    res = await interrupt_manager.handle_interruption(
        session_id=session_id,
        playback_manager=playback,
        new_intent="Forget outdoor, find indoor activity",
        additional_constraints={"activity_type": "indoor"},
        reason="Voice activity test",
    )
    
    # Check playback immediately stopped & queue cleared
    assert playback.state == PlaybackState.STOPPED
    assert playback.audio_queue.empty()
    assert playback.is_cancelled is True
    
    # Check tool token was cancelled
    assert tool_token.is_set() is True
    
    # Check task version incremented
    assert res["status"] == "success"
    assert res["old_version"] == 1
    assert res["new_version"] == 2
    assert res["stop_latency_ms"] >= 0
    
    # Check metrics
    metrics = await state_store.get_metrics(session_id)
    assert metrics.total_interruptions == 1
    assert metrics.successful_recoveries == 1
    assert metrics.recovery_rate == 100.0
