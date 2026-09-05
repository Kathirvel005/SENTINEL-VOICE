import os
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.providers.llm.base import BaseLLMProvider
from app.providers.llm.smart_intent_engine import SmartIntentEngine

logger = logging.getLogger("sentinel.llm.openai")


class OpenAILLMProvider(BaseLLMProvider):
    """Remote OpenAI/Compatible LLM provider with fallback to SmartIntentEngine."""

    def __init__(self):
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "gpt-4o-mini")
        self.endpoint = os.getenv("LLM_ENDPOINT", "https://api.openai.com/v1/chat/completions")
        self.fallback = SmartIntentEngine()
        self.is_configured = bool(self.api_key and len(self.api_key) > 5)

    async def parse_intent_and_constraints(
        self,
        user_utterance: str,
        conversation_context: List[Dict[str, str]],
        existing_constraints: Dict[str, Any],
    ) -> Dict[str, Any]:
        if not self.is_configured:
            return await self.fallback.parse_intent_and_constraints(
                user_utterance, conversation_context, existing_constraints
            )

        try:
            system_prompt = (
                "You are an intent and constraint parsing engine for a voice navigation assistant. "
                "Output JSON with keys: intent, tool_name, params (dict), updated_constraints (dict), "
                "language_info (dict with primary and is_code_switching)."
            )
            messages = [{"role": "system", "content": system_prompt}]
            for turn in conversation_context[-4:]:
                messages.append(turn)
            messages.append({"role": "user", "content": f"Extract intent: {user_utterance}. Existing constraints: {existing_constraints}"})

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.post(
                    self.endpoint,
                    headers=headers,
                    json={
                        "model": self.model,
                        "messages": messages,
                        "response_format": {"type": "json_object"},
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                content = data["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as e:
            logger.warning(f"Remote LLM call failed: {e}. Using deterministic engine.")
            return await self.fallback.parse_intent_and_constraints(
                user_utterance, conversation_context, existing_constraints
            )

    async def generate_response(
        self,
        user_utterance: str,
        tool_result: Optional[Dict[str, Any]],
        task_version: int,
        conversation_context: List[Dict[str, str]],
    ) -> str:
        if not self.is_configured:
            return await self.fallback.generate_response(
                user_utterance, tool_result, task_version, conversation_context
            )

        try:
            system_prompt = (
                "You are SENTINEL, a concise, conversational voice AI. Provide a natural spoken response "
                "of at most 2 sentences based on the tool result. Never output markdown or emojis."
            )
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"User asked: {user_utterance}\nTool result: {tool_result}\nTask version: {task_version}"}
            ]
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            async with httpx.AsyncClient(timeout=6.0) as client:
                resp = await client.post(
                    self.endpoint,
                    headers=headers,
                    json={"model": self.model, "messages": messages, "max_tokens": 120}
                )
                resp.raise_for_status()
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            logger.warning(f"Remote LLM generation failed: {e}. Using deterministic response.")
            return await self.fallback.generate_response(
                user_utterance, tool_result, task_version, conversation_context
            )
