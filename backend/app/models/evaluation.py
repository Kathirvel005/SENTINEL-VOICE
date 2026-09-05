from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
import time


class EvaluationMetrics(BaseModel):
    session_id: str
    total_turns: int = 0
    total_tasks: int = 0
    total_interruptions: int = 0
    successful_recoveries: int = 0
    failed_recoveries: int = 0
    stale_results_generated: int = 0
    stale_results_spoken: int = 0  # CRITICAL TARGET: ALWAYS 0
    stale_results_prevented: int = 0
    
    # Latencies in milliseconds
    first_audio_latencies_ms: List[float] = Field(default_factory=list)
    interruption_stop_latencies_ms: List[float] = Field(default_factory=list)
    tool_execution_latencies_ms: List[float] = Field(default_factory=list)
    
    avg_first_audio_latency_ms: float = 0.0
    avg_interruption_stop_latency_ms: float = 0.0
    recovery_rate: float = 100.0
    stale_prevention_rate: float = 100.0
    task_success_rate: float = 100.0
    updated_at: float = Field(default_factory=time.time)

    def recompute(self):
        if self.first_audio_latencies_ms:
            self.avg_first_audio_latency_ms = round(sum(self.first_audio_latencies_ms) / len(self.first_audio_latencies_ms), 1)
        if self.interruption_stop_latencies_ms:
            self.avg_interruption_stop_latency_ms = round(sum(self.interruption_stop_latencies_ms) / len(self.interruption_stop_latencies_ms), 1)
        
        if self.total_interruptions > 0:
            self.recovery_rate = round((self.successful_recoveries / self.total_interruptions) * 100.0, 1)
        else:
            self.recovery_rate = 100.0
            
        total_stale = self.stale_results_generated
        if total_stale > 0:
            self.stale_prevention_rate = round(((total_stale - self.stale_results_spoken) / total_stale) * 100.0, 1)
        else:
            self.stale_prevention_rate = 100.0
            
        if self.total_tasks > 0:
            self.task_success_rate = round(((self.total_tasks - self.failed_recoveries) / self.total_tasks) * 100.0, 1)
        else:
            self.task_success_rate = 100.0
        self.updated_at = time.time()
