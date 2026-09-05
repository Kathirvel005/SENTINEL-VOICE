from fastapi import APIRouter
from app.providers.rime.client import rime_service
import time

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    rime_health = await rime_service.health_check()
    return {
        "status": "online",
        "service": "SENTINEL VOICE ENGINE",
        "version": "1.0.0",
        "timestamp": time.time(),
        "rime": rime_health,
        "features": {
            "full_duplex": True,
            "task_versioning": True,
            "stale_result_guard": True,
            "confidence_aware_vad": True,
            "multilingual_code_switching": True,
        }
    }
