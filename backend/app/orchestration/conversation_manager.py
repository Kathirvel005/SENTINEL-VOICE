import time
import asyncio
import logging
from typing import Dict, Any, Optional, Callable, Awaitable, List

from app.models.task import Task, TaskStatus
from app.models.session import Session, OrbState, ConversationTurn
from app.models.event import SentinelEvent, EventType
from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.orchestration.interrupt_manager import interrupt_manager
from app.orchestration.stale_result_guard import StaleResultGuard
from app.audio.playback_manager import AudioPlaybackManager
from app.providers.rime.client import rime_service
from app.providers.llm.smart_intent_engine import SmartIntentEngine
from app.tools.route_tool import RouteTool
from app.tools.weather_tool import WeatherTool
from app.tools.activity_tool import ActivityTool
from app.tools.search_tool import SearchTool

logger = logging.getLogger("sentinel.conversation_manager")


class ConversationManager:
    """Core orchestrator managing conversation turns, intent routing, tool execution, and voice delivery."""

    def __init__(self):
        self.intent_engine = SmartIntentEngine()
        self.route_tool = RouteTool()
        self.weather_tool = WeatherTool()
        self.activity_tool = ActivityTool()
        self.search_tool = SearchTool()
        self.playback_managers: Dict[str, AudioPlaybackManager] = {}

    def get_playback_manager(self, session_id: str) -> AudioPlaybackManager:
        if session_id not in self.playback_managers:
            self.playback_managers[session_id] = AudioPlaybackManager(session_id)
        return self.playback_managers[session_id]

    async def process_user_turn(
        self,
        session_id: str,
        user_text: str,
        broadcast_fn: Optional[Callable[[str, Dict[str, Any]], Awaitable[None]]] = None,
    ) -> Dict[str, Any]:
        """Main entrypoint when user speaks or inputs an instruction."""
        t_user_turn_start = time.time()
        session = await state_store.get_or_create_session(session_id)
        playback = self.get_playback_manager(session_id)

        # 1. Check if user is interrupting an active task
        active_task = None
        if session.active_task_id:
            active_task = await state_store.get_task(session.active_task_id)

        is_interrupting = False
        if active_task and active_task.status in [TaskStatus.RUNNING, TaskStatus.CREATED]:
            if playback.state == OrbState.SPEAKING or playback.active_task_version == active_task.current_version:
                is_interrupting = True

        # Parse intent, constraints, language
        context = [{"role": t.role, "content": t.content} for t in session.turns]
        parsed = await self.intent_engine.parse_intent_and_constraints(
            user_text, context, session.accumulated_constraints
        )

        lang_info = parsed["language_info"]
        session.current_language = lang_info["primary"]
        session.code_switching_detected = lang_info["is_code_switching"]
        session.accumulated_constraints.update(parsed["updated_constraints"])

        # Record user turn
        user_turn = ConversationTurn(
            role="user",
            content=user_text,
            task_id=active_task.task_id if active_task else None,
            task_version=active_task.current_version if active_task else 1,
            interrupted=is_interrupting,
            language_detected=lang_info["primary"],
        )
        session.turns.append(user_turn)

        # Record USER_SPEECH event
        await state_store.append_event(
            SentinelEvent(
                session_id=session_id,
                task_id=active_task.task_id if active_task else None,
                task_version=active_task.current_version if active_task else 1,
                event_type=EventType.USER_SPEECH,
                description=f"User: '{user_text}'",
                payload={"text": user_text, "lang": lang_info, "is_interrupting": is_interrupting}
            )
        )

        # 2. If interrupting, trigger interrupt manager
        if is_interrupting and active_task:
            logger.info(f"User interrupted active task {active_task.task_id} v{active_task.current_version}")
            int_res = await interrupt_manager.handle_interruption(
                session_id=session_id,
                playback_manager=playback,
                new_intent=user_text,
                additional_constraints=parsed["updated_constraints"],
                reason=f"User spoke new request: '{user_text}'",
            )
            # Re-fetch task with incremented version
            active_task = await state_store.get_task(active_task.task_id)
            current_version = active_task.current_version
        else:
            # Create a brand new task
            active_task = await TaskManager.create_task(
                session_id=session_id,
                intent=parsed["intent"],
                constraints=parsed["updated_constraints"],
                tool_name=parsed["tool_name"],
            )
            current_version = active_task.current_version

        # 3. Set Orb State to THINKING / TOOL_WORKING
        await state_store.update_orb_state(session_id, OrbState.TOOL_WORKING)
        if broadcast_fn:
            await broadcast_fn("state_change", {"orb_state": OrbState.TOOL_WORKING, "task_version": current_version})

        # 4. Spoken acknowledge intermediate phrase via Rime if slow tool
        initial_utterance = ""
        tool_name = parsed["tool_name"]
        if tool_name == "RouteTool":
            origin = parsed["params"].get("origin", "Coimbatore")
            dest = parsed["params"].get("destination", "Chennai")
            if current_version == 1:
                initial_utterance = f"I'm checking the available routes from {origin} to {dest}..."
            else:
                initial_utterance = f"Recalculating route without highways..."

        # Asynchronously run tool with cancellation token
        asyncio.create_task(
            self._execute_tool_and_respond(
                session_id=session_id,
                task_id=active_task.task_id,
                task_version=current_version,
                tool_name=tool_name,
                params=parsed["params"],
                initial_utterance=initial_utterance,
                user_text=user_text,
                t_user_turn_start=t_user_turn_start,
                broadcast_fn=broadcast_fn,
            )
        )

        return {
            "status": "processing",
            "session_id": session_id,
            "task_id": active_task.task_id,
            "task_version": current_version,
            "language": lang_info,
        }

    async def _execute_tool_and_respond(
        self,
        session_id: str,
        task_id: str,
        task_version: int,
        tool_name: Optional[str],
        params: Dict[str, Any],
        initial_utterance: str,
        user_text: str,
        t_user_turn_start: float,
        broadcast_fn: Optional[Callable[[str, Dict[str, Any]], Awaitable[None]]],
    ):
        session = await state_store.get_session(session_id)
        playback = self.get_playback_manager(session_id)
        cancellation_token = asyncio.Event()
        interrupt_manager.register_tool_token(task_id, task_version, cancellation_token)

        tool_delay_ms = session.tool_delay_ms if session else 3500

        # Speak initial status if provided
        if initial_utterance:
            asyncio.create_task(
                self._stream_speech(
                    session_id=session_id,
                    task_id=task_id,
                    task_version=task_version,
                    text=initial_utterance,
                    broadcast_fn=broadcast_fn,
                )
            )

        tool_result = None
        tool_start_time = time.time()
        try:
            # Select tool
            if tool_name == "RouteTool":
                tool_result = await self.route_tool.execute(
                    session_id, task_id, task_version, params, cancellation_token,
                    artificial_delay_ms=tool_delay_ms
                )
            elif tool_name == "WeatherTool":
                tool_result = await self.weather_tool.execute(
                    session_id, task_id, task_version, params, cancellation_token,
                    artificial_delay_ms=max(1500, tool_delay_ms // 2)
                )
            elif tool_name == "ActivityTool":
                tool_result = await self.activity_tool.execute(
                    session_id, task_id, task_version, params, cancellation_token,
                    artificial_delay_ms=tool_delay_ms
                )
            else:
                tool_result = await self.search_tool.execute(
                    session_id, task_id, task_version, params, cancellation_token,
                    artificial_delay_ms=1500
                )
            tool_elapsed_ms = (time.time() - tool_start_time) * 1000.0
            await state_store.update_metrics(session_id, tool_execution_latencies_ms=tool_elapsed_ms)

        except asyncio.CancelledError:
            logger.info(f"Tool {tool_name} for task {task_id} v{task_version} caught CancelledError.")
            return
        except Exception as e:
            logger.error(f"Tool {tool_name} failed: {e}")
            return
        finally:
            interrupt_manager.unregister_tool_token(task_id, task_version)

        # 5. CRITICAL: Pass result through StaleResultGuard
        task = await state_store.get_task(task_id)
        if not task:
            return

        is_valid, reason = await StaleResultGuard.validate_result(
            session_id=session_id,
            task=task,
            result_version=task_version,
            result_data=tool_result or {},
            origin_tool=tool_name or "unknown",
        )

        if not is_valid:
            logger.warning(f"Result blocked from speech: {reason}")
            if broadcast_fn:
                await broadcast_fn("stale_rejected", {
                    "task_id": task_id,
                    "rejected_version": task_version,
                    "active_version": task.current_version,
                    "reason": reason,
                })
            return

        # 6. Result is accepted! Generate final Rime response
        context = [{"role": t.role, "content": t.content} for t in session.turns]
        spoken_response = await self.intent_engine.generate_response(
            user_utterance=user_text,
            tool_result=tool_result,
            task_version=task_version,
            conversation_context=context,
        )

        # Complete task version in state
        await TaskManager.complete_task_version(
            task_id=task_id,
            version_num=task_version,
            result=tool_result,
            spoken_response=spoken_response,
        )

        # Record assistant turn
        asst_turn = ConversationTurn(
            role="assistant",
            content=spoken_response,
            task_id=task_id,
            task_version=task_version,
            interrupted=False,
        )
        session.turns.append(asst_turn)

        # Calculate perceived first audio latency
        latency_ms = (time.time() - t_user_turn_start) * 1000.0
        await state_store.update_metrics(session_id, first_audio_latencies_ms=latency_ms)

        # 7. Stream audio through Rime
        await self._stream_speech(
            session_id=session_id,
            task_id=task_id,
            task_version=task_version,
            text=spoken_response,
            broadcast_fn=broadcast_fn,
        )

    async def _stream_speech(
        self,
        session_id: str,
        task_id: str,
        task_version: int,
        text: str,
        broadcast_fn: Optional[Callable[[str, Dict[str, Any]], Awaitable[None]]],
    ):
        playback = self.get_playback_manager(session_id)
        cancellation_token = asyncio.Event()
        
        # Verify task is still active before speaking
        task = await state_store.get_task(task_id)
        if not task or task.current_version != task_version:
            logger.info(f"Skipping speech for stale v{task_version} (current is v{task.current_version if task else 'None'})")
            return

        playback.start_session(task_id, task_version)
        await state_store.update_orb_state(session_id, OrbState.SPEAKING)
        
        if broadcast_fn:
            await broadcast_fn("state_change", {
                "orb_state": OrbState.SPEAKING,
                "task_version": task_version,
                "text": text,
            })

        await state_store.append_event(
            SentinelEvent(
                session_id=session_id,
                task_id=task_id,
                task_version=task_version,
                event_type=EventType.RIME_STREAM_STARTED,
                description=f"Rime streaming speech v{task_version}: '{text[:45]}...'",
                payload={"text": text, "version": task_version}
            )
        )

        async def on_audio_chunk(chunk: bytes, v: int, is_last: bool):
            if playback.is_cancelled or v != playback.active_task_version:
                return
            await playback.enqueue_chunk(chunk, v)
            if broadcast_fn:
                import base64
                b64 = base64.b64encode(chunk).decode('ascii')
                await broadcast_fn("audio_chunk", {
                    "audio_b64": b64,
                    "task_version": v,
                    "is_last": is_last,
                })

        session = await state_store.get_session(session_id)
        speaker = session.speaker_persona if session else None
        speech_rate = session.speech_rate if session else None
        speech_pitch = session.speech_pitch if session else None

        completed = await rime_service.stream(
            text=text,
            task_id=task_id,
            task_version=task_version,
            cancellation_token=cancellation_token,
            chunk_callback=on_audio_chunk,
            speaker=speaker,
            rate=speech_rate,
            pitch=speech_pitch,
        )

        if completed and not playback.is_cancelled:
            await state_store.update_orb_state(session_id, OrbState.IDLE)
            await state_store.append_event(
                SentinelEvent(
                    session_id=session_id,
                    task_id=task_id,
                    task_version=task_version,
                    event_type=EventType.RIME_RESPONSE_PLAYED,
                    description=f"Rime speech v{task_version} completed successfully",
                    payload={"text": text, "version": task_version}
                )
            )
            if broadcast_fn:
                await broadcast_fn("state_change", {"orb_state": OrbState.IDLE, "task_version": task_version})


conversation_manager = ConversationManager()
