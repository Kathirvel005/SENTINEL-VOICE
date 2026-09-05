from fastapi import APIRouter, HTTPException
from app.schemas.api import CreateTaskRequest, InterruptTaskRequest, TaskResponse
from app.state.in_memory import state_store
from app.orchestration.task_manager import TaskManager
from app.orchestration.interrupt_manager import interrupt_manager
from app.orchestration.conversation_manager import conversation_manager

router = APIRouter(prefix="/api/task", tags=["Task"])


@router.post("", response_model=TaskResponse)
async def create_task(req: CreateTaskRequest):
    task = await TaskManager.create_task(
        session_id=req.session_id,
        intent=req.intent,
        constraints=req.constraints,
        tool_name=req.tool_name,
    )
    return TaskResponse(task=task)


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    task = await state_store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse(task=task)


@router.post("/{task_id}/interrupt")
async def interrupt_task(task_id: str, req: InterruptTaskRequest):
    task = await state_store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    playback = conversation_manager.get_playback_manager(req.session_id)
    result = await interrupt_manager.handle_interruption(
        session_id=req.session_id,
        playback_manager=playback,
        new_intent=req.new_intent,
        additional_constraints=req.additional_constraints,
        reason=req.reason,
    )
    return result
