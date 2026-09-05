import os
import json
import base64
import time
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, session, task, events, evaluation, config
from app.state.in_memory import state_store
from app.audio.vad import ConfidenceAwareVAD
from app.orchestration.conversation_manager import conversation_manager
from app.orchestration.interrupt_manager import interrupt_manager
from app.models.session import OrbState

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sentinel.main")

app = FastAPI(
    title="SENTINEL VOICE — Real-time Conversational Reliability Engine",
    description="Full-duplex voice intelligence with Task Versioning, Stale Result Guard, and Rime TTS streaming.",
    version="1.0.0",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST Routers
app.include_router(health.router)
app.include_router(session.router)
app.include_router(task.router)
app.include_router(events.router)
app.include_router(evaluation.router)
app.include_router(config.router)


@app.websocket("/ws/voice/{session_id}")
async def voice_websocket(websocket: WebSocket, session_id: str):
    """Full-duplex bidirectional voice transport for real-time audio and events."""
    await websocket.accept()
    session = await state_store.get_or_create_session(session_id)
    playback = conversation_manager.get_playback_manager(session_id)
    vad = ConfidenceAwareVAD(threshold=session.interruption_threshold)

    logger.info(f"WebSocket client connected for session: {session_id}")

    # Broadcaster function passed into ConversationManager
    async def broadcast(msg_type: str, payload: Dict[str, Any]):
        try:
            msg = {
                "type": msg_type,
                "session_id": session_id,
                "payload": payload,
                "timestamp": time.time(),
            }
            await websocket.send_text(json.dumps(msg))
        except Exception as e:
            logger.debug(f"Error broadcasting to WS: {e}")

    try:
        # Send initial connected greeting & state
        await broadcast("state_change", {
            "orb_state": session.orb_state,
            "session_id": session_id,
            "current_language": session.current_language,
        })

        while True:
            raw_data = await websocket.receive_text()
            try:
                msg = json.loads(raw_data)
            except json.JSONDecodeError:
                continue

            msg_type = msg.get("type")
            payload = msg.get("payload", {})

            # 1. User Utterance (Voice Transcription from browser or testing script)
            if msg_type == "user_utterance":
                text = payload.get("text", "").strip()
                if text:
                    logger.info(f"Received user utterance: '{text}'")
                    await conversation_manager.process_user_turn(
                        session_id=session_id,
                        user_text=text,
                        broadcast_fn=broadcast,
                    )
                    # Push latest metrics & events
                    metrics = await state_store.get_metrics(session_id)
                    await broadcast("metrics_update", metrics.model_dump())

            # 2. Audio Chunk from Microphone (Streaming VAD & Interruption Detection)
            elif msg_type == "audio_chunk":
                audio_b64 = payload.get("audio_b64", "")
                if audio_b64:
                    chunk_bytes = base64.b64decode(audio_b64)
                    is_asst_speaking = (playback.state == OrbState.SPEAKING)
                    is_active, confidence, is_interrupt_confirmed = vad.process_frame(
                        chunk_bytes, is_assistant_speaking=is_asst_speaking
                    )

                    if is_interrupt_confirmed:
                        logger.warning(f"Voice VAD confirmed user interruption on {session_id} (conf={confidence:.2f})")
                        await interrupt_manager.handle_interruption(
                            session_id=session_id,
                            playback_manager=playback,
                            reason=f"Voice VAD confirmed interruption (confidence={confidence:.2f})"
                        )
                        await broadcast("state_change", {"orb_state": OrbState.INTERRUPTED})

            # 3. Explicit Interrupt Signal (e.g., Push to Talk or Instant Interruption Button)
            elif msg_type == "interrupt":
                reason = payload.get("reason", "Interrupted via user command")
                new_intent = payload.get("new_intent")
                logger.info(f"Explicit interruption triggered: {reason}")
                res = await interrupt_manager.handle_interruption(
                    session_id=session_id,
                    playback_manager=playback,
                    new_intent=new_intent,
                    reason=reason,
                )
                await broadcast("state_change", {"orb_state": OrbState.INTERRUPTED, "details": res})
                metrics = await state_store.get_metrics(session_id)
                await broadcast("metrics_update", metrics.model_dump())

            # 4. Stress Mode & Settings Toggle
            elif msg_type == "set_mode":
                stress = payload.get("is_stress_mode", False)
                session.is_stress_mode = stress
                session.tool_delay_ms = 7500 if stress else 3500
                logger.info(f"Session {session_id} stress mode set to: {stress} (delay={session.tool_delay_ms}ms)")
                await broadcast("state_change", {
                    "is_stress_mode": session.is_stress_mode,
                    "tool_delay_ms": session.tool_delay_ms,
                })

            # 5. Voice Persona & Speech Modulation Toggle
            elif msg_type == "set_voice_config":
                persona = payload.get("persona")
                rate = payload.get("rate")
                pitch = payload.get("pitch")
                if persona:
                    session.speaker_persona = persona
                if rate:
                    session.speech_rate = rate
                if pitch:
                    session.speech_pitch = pitch
                logger.info(f"Session {session_id} voice updated: persona={session.speaker_persona}, rate={session.speech_rate}")
                await broadcast("state_change", {
                    "speaker_persona": session.speaker_persona,
                    "speech_rate": session.speech_rate,
                    "speech_pitch": session.speech_pitch,
                })

            # 6. Ping
            elif msg_type == "ping":
                await broadcast("pong", {"client_time": payload.get("time")})

    except WebSocketDisconnect:
        logger.info(f"WebSocket client disconnected for session: {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
