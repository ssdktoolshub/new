from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Any
from app.db.session import get_db

router = APIRouter()

async def process_ai_task_background(task_id: str, prompt: str, service: str):
    """
    Background worker simulating generative AI response to prevent event loop blocking.
    """
    import asyncio
    await asyncio.sleep(2) # Simulate processing
    print(f"Completed AI task {task_id} for {service}")
    # TODO: Save response and token usage to AIRequestLog table

@router.post("/process/{service_type}")
async def trigger_ai_service(
    service_type: str,
    prompt_data: dict,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers an asynchronous AI processing task (OCR, Translation, Summarization).
    """
    # In production, use Celery instead of BackgroundTasks for heavy LLM calls
    task_id = "temp-task-uuid"
    
    background_tasks.add_task(
        process_ai_task_background,
        task_id=task_id,
        prompt=prompt_data.get("text", ""),
        service=service_type
    )
    
    return {
        "status": "processing",
        "task_id": task_id,
        "message": "AI task queued asynchronously."
    }

@router.get("/status/{task_id}")
async def check_ai_status(task_id: str, db: AsyncSession = Depends(get_db)):
    """
    Long-polling or status check for background AI tasks.
    """
    return {"status": "completed", "result": "Dummy AI Response Data"}
