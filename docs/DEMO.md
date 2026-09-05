# SENTINEL VOICE — Hackathon Demo Guide

> **"When the conversation changes, the AI changes with it."**
> A 4 to 5-minute judge demonstration script showing real-time interruption, task versioning, and zero stale responses.

---

## 1. Demo Scenarios Summary

| # | Scenario Name | Primary Voice Feature Demonstrated | Expected Spoken Outcome |
|---|---|---|---|
| **1** | **Route Rescue** | Mid-speech user interruption, tool delay, task version bump ($v1 \to v2$), stale result rejection | Only $v2$ (non-highway, cheapest) spoken via Rime |
| **2** | **Multilingual Code-Switching** | Natural Tanglish (`Chennai-ku fastest route find pannu, but highway avoid pannanum`), entity & negation extraction | Concise route output adhering to avoided highway constraint |
| **3** | **Tool Continuity** | Mid-execution domain pivot (outdoor $\to$ indoor activity) | Outdoor recommendation dropped, indoor activity spoken |

---

## 2. Step-by-Step Presentation Script

### Act 1: The Problem (0:00 – 1:00)
1. **Open the Console**: Navigate to `http://localhost:3000/console`.
2. **Explain the Voice Dilemma**:
   > *"In voice AI, when a user asks for something complex, the AI starts thinking, runs slow tools, and starts speaking. But if the human changes their mind mid-sentence, traditional agents finish their old task and blurt out obsolete answers. In high-stakes situations like navigation, that’s unacceptable."*
3. **Turn on Stress Mode**: Click the **"NORMAL MODE / STRESS MODE"** switch. Tool delay is set to 7500ms.

---

### Act 2: Scenario 1 — "Route Rescue" (1:00 – 2:30)
1. **Step 1**: Click the Microphone or click the **"Find fastest route to Chennai"** scenario trigger.
2. **AI Action**:
   - Status updates to `TOOL_WORKING`.
   - Rime starts speaking: *"I'm checking the available routes from Coimbatore to Chennai..."*
   - Real-time Web Audio waveform animates.
3. **Step 2 (The Interruption)**:
   - Click **"INTERRUPT"** or speak: *"Wait! Don't use highways. I want the cheapest route."*
4. **Observe the Instant Reaction**:
   - **Audio Halts**: Rime speech stops instantly (measured latency $< 50\text{ms}$).
   - **Task Version Bump**: The `TaskVersionVisualizer` shows:
     - `TASK v1 (Fastest Route)` $\to$ `❌ INTERRUPTED / INVALIDATED`.
     - `TASK v2 (Cheapest, No Highways)` $\to$ `RUNNING`.
   - **Stale Result Rejection**: As the old $v1$ highway calculation finishes in the background, the **Stale Result Guard** visibly intercepts it:
     ```text
     STALE_RESULT_REJECTED: Result version 1 does not match active version 2.
     ```
   - **New Speech**: AI speaks only the $v2$ route:
     > *"Understood. Avoiding highways. The cheapest route from Coimbatore to Chennai is via State Highway 15 through Tiruvannamalai..."*

---

### Act 3: Scenario 2 — Multilingual Code-Switching (2:30 – 3:30)
1. Switch to `/demo` or click the **"Code-Switching"** preset.
2. Utterance:
   > *"Chennai-ku fastest route find pannu, but highway avoid pannanum."*
3. **Engine Highlights**:
   - Detected Language badge: **Tamil + English (Code-Switching)**.
   - Entity extracted: `Destination: Chennai`, `Avoid: Highway`.
   - AI speaks clean, unambiguous route via Rime.

---

### Act 4: Telemetry & Evaluation Evidence (3:30 – 4:30)
1. Navigate to `/evaluation`.
2. Review live measured metrics:
   - **Stale Responses Spoken**: Exactly **0** (100% Prevention Rate).
   - **Interrupt Stop Latency**: Typically $< 20\text{ms}$.
   - **Recovery Rate**: $100\%$.
3. Run the live acceptance suite button to show real-time verification passes.
