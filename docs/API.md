# SENTINEL VOICE — API Reference

Base URL: `http://localhost:8000`

---

## 1. REST Endpoints

### Health Check
* **`GET /health`**
  * Returns engine status, Rime TTS connectivity, and active features.

### Session Management
* **`POST /api/session`**
  * Body: `{"is_stress_mode": false, "tool_delay_ms": 3500, "interruption_threshold": 0.65}`
  * Response: Session object with `session_id`.
* **`GET /api/session/{session_id}`**
  * Returns active session state, accumulated constraints, turns, and orb status.

### Task Lifecycle
* **`POST /api/task`**
  * Body: `{"session_id": "...", "intent": "...", "constraints": {}, "tool_name": "RouteTool"}`
  * Response: Created `Task` with `current_version = 1`.
* **`GET /api/task/{task_id}`**
  * Returns full task object and its version history.
* **`POST /api/task/{task_id}/interrupt`**
  * Body: `{"session_id": "...", "new_intent": "...", "additional_constraints": {}, "reason": "..."}`
  * Halts playback, increments task version, sets old version to `INTERRUPTED`.

### Telemetry & Evaluation
* **`GET /api/events/{session_id}`**
  * Returns chronological list of `SentinelEvent` objects.
* **`GET /api/evaluation/{session_id}`**
  * Returns `EvaluationMetrics` (latencies, stale prevention rate, recovery rate).
* **`POST /api/evaluation/run`**
  * Executes automated in-engine benchmark test.

### Configuration
* **`GET /api/config`**
  * Returns active Rime model, speaker, format, and default thresholds.
* **`POST /api/config`**
  * Updates speaker, model, delay, or interruption threshold.

---

## 2. WebSocket Interface

* **`WS /ws/voice/{session_id}`**

### Client Messages
```json
// User Utterance
{
  "type": "user_utterance",
  "session_id": "sess_123",
  "payload": {"text": "Find the fastest route to Chennai"}
}

// Streaming Audio Chunk for VAD
{
  "type": "audio_chunk",
  "session_id": "sess_123",
  "payload": {"audio_b64": "<base64 PCM16 bytes>"}
}

// Explicit Interruption
{
  "type": "interrupt",
  "session_id": "sess_123",
  "payload": {"reason": "User interrupted", "new_intent": "Avoid highways"}
}

// Toggle Mode
{
  "type": "set_mode",
  "session_id": "sess_123",
  "payload": {"is_stress_mode": true}
}
```

### Server Messages
```json
// State Change
{
  "type": "state_change",
  "session_id": "sess_123",
  "payload": {"orb_state": "SPEAKING", "task_version": 2, "text": "..."}
}

// Audio Chunk
{
  "type": "audio_chunk",
  "session_id": "sess_123",
  "payload": {"audio_b64": "<base64 WAV bytes>", "task_version": 2, "is_last": false}
}

// Stale Result Rejected
{
  "type": "stale_rejected",
  "session_id": "sess_123",
  "payload": {"task_id": "...", "rejected_version": 1, "active_version": 2, "reason": "..."}
}
```
