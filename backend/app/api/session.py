from fastapi import APIRouter, HTTPException
from app.schemas.api import CreateSessionRequest, CreateSessionResponse
from app.state.in_memory import state_store

router = APIRouter(prefix="/api/session", tags=["Session"])


@router.post("", response_model=CreateSessionResponse)
async def create_session(req: CreateSessionRequest):
    session = await state_store.get_or_create_session(
        is_stress_mode=req.is_stress_mode,
        tool_delay_ms=req.tool_delay_ms,
        interruption_threshold=req.interruption_threshold,
    )
    return CreateSessionResponse(session=session)


@router.get("/{session_id}", response_model=CreateSessionResponse)
async def get_session(session_id: str):
    session = await state_store.get_or_create_session(session_id)
    return CreateSessionResponse(session=session)
