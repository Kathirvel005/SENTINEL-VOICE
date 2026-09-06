export type OrbState = 
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "TOOL_WORKING"
  | "SPEAKING"
  | "INTERRUPTED"
  | "RECOVERING";

export type TaskStatus = 
  | "CREATED"
  | "RUNNING"
  | "INTERRUPTED"
  | "CANCEL_REQUESTED"
  | "CANCELLED"
  | "COMPLETED"
  | "STALE"
  | "FAILED";

export interface TaskVersion {
  session_id: string;
  task_id: string;
  version_number: number;
  intent: string;
  constraints: Record<string, unknown>;
  status: TaskStatus;
  created_at: number;
  cancellation_reason?: string;
  result?: Record<string, unknown>;
  spoken_response?: string;
}

export type TaskVersionRecord = TaskVersion;

export interface Task {
  task_id: string;
  session_id: string;
  current_version: number;
  intent: string;
  constraints: Record<string, unknown>;
  status: TaskStatus;
  tool_name?: string;
  created_at: number;
  updated_at: number;
  version_history: TaskVersion[];
  active_result?: Record<string, unknown>;
}

export interface ConversationTurn {
  turn_id: string;
  timestamp: number;
  role: "user" | "assistant";
  content: string;
  task_id?: string;
  task_version?: number;
  interrupted?: boolean;
  language_detected?: string;
}

export interface SentinelEvent {
  event_id: string;
  timestamp: number;
  formatted_time: string;
  session_id: string;
  task_id?: string;
  task_version?: number;
  event_type: string;
  description: string;
  payload: Record<string, unknown>;
}

export interface EvaluationMetrics {
  session_id: string;
  total_turns: number;
  total_tasks: number;
  total_interruptions: number;
  successful_recoveries: number;
  failed_recoveries: number;
  stale_results_generated: number;
  stale_results_spoken: number;
  stale_results_prevented: number;
  avg_first_audio_latency_ms: number;
  avg_interruption_stop_latency_ms: number;
  recovery_rate: number;
  stale_prevention_rate: number;
  task_success_rate: number;
  first_audio_latencies_ms: number[];
  interruption_stop_latencies_ms: number[];
  tool_execution_latencies_ms: number[];
}

export interface RimeConfig {
  provider: string;
  model: string;
  speaker: string;
  language: string;
  endpoint: string;
  audio_format: string;
  sample_rate: number;
  transport: string;
  is_live_connected: boolean;
  mode: string;
}
