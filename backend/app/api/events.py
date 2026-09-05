from fastapi import APIRouter
from app.schemas.api import EventsResponse
from app.state.in_memory import state_store

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("/{session_id}", response_model=EventsResponse)
async def get_events(session_id: str, limit: int = 100):
    events = await state_store.get_events(session_id, limit=limit)
    return EventsResponse(session_id=session_id, events=events)
