import pytest
import asyncio
from app.providers.rime.client import rime_service


@pytest.mark.asyncio
async def test_rime_service_configuration_and_synthesis():
    # 1. Config check
    cfg = rime_service.get_configuration()
    assert "model" in cfg
    assert "speaker" in cfg
    assert "audio_format" in cfg
    assert "mode" in cfg
    
    # 2. Health check
    health = await rime_service.health_check()
    assert health["status"] == "online"
    
    # 3. Audio synthesis check
    audio_bytes = await rime_service.synthesize("Sentinel Voice testing audio synthesis.")
    assert len(audio_bytes) > 100
    # Valid audio header: either WAV (RIFF) or MP3 (MPEG sync frame / ID3)
    assert audio_bytes[:4] == b"RIFF" or audio_bytes[:2] in [b"\xff\xf3", b"\xff\xfb", b"\xff\xfa", b"\xff\xf2"] or audio_bytes[:3] == b"ID3"
    
    # 4. Audio streaming with cancellation check
    chunks_received = []
    cancel_token = asyncio.Event()

    async def on_chunk(chunk: bytes, version: int, is_last: bool):
        chunks_received.append(chunk)
        if len(chunks_received) >= 2:
            cancel_token.set()  # Cancel mid-stream!

    completed = await rime_service.stream(
        text="This is a longer test sentence meant to test whether audio streaming properly responds to cancellation events.",
        task_id="test_stream_task",
        task_version=1,
        cancellation_token=cancel_token,
        chunk_callback=on_chunk,
        chunk_size_ms=50,
    )
    
    # Should report incomplete due to early cancel
    assert completed is False
    assert len(chunks_received) >= 2
