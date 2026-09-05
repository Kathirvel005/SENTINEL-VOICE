from fastapi import APIRouter
from pydantic import BaseModel
from app.providers.rime.client import rime_service
from app.state.in_memory import state_store

router = APIRouter(prefix="/api/config", tags=["Configuration"])


class UpdateConfigRequest(BaseModel):
    session_id: str
    is_stress_mode: bool = False
    tool_delay_ms: int = 3500
    interruption_threshold: float = 0.65
    rime_speaker: str = "neerja"
    rime_model: str = "mist"
    speech_rate: str = "+0%"
    speech_pitch: str = "+0Hz"


@router.get("")
async def get_config():
    return {
        "rime": rime_service.get_configuration(),
        "default_tool_delay_ms": 3500,
        "default_interruption_threshold": 0.65,
    }


@router.post("")
async def update_config(req: UpdateConfigRequest):
    session = await state_store.get_session(req.session_id)
    if session:
        session.is_stress_mode = req.is_stress_mode
        session.tool_delay_ms = req.tool_delay_ms
        session.interruption_threshold = req.interruption_threshold
        session.speaker_persona = req.rime_speaker
        session.speech_rate = req.speech_rate
        session.speech_pitch = req.speech_pitch
        
    rime_service.speaker = req.rime_speaker
    rime_service.model = req.rime_model
    rime_service.speech_rate = req.speech_rate
    rime_service.speech_pitch = req.speech_pitch
    
    return {
        "status": "updated",
        "session_id": req.session_id,
        "is_stress_mode": req.is_stress_mode,
        "tool_delay_ms": req.tool_delay_ms,
        "interruption_threshold": req.interruption_threshold,
        "rime": rime_service.get_configuration(),
    }
