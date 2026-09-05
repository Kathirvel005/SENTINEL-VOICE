import pytest
from app.providers.llm.smart_intent_engine import SmartIntentEngine


@pytest.mark.asyncio
async def test_smart_intent_engine_code_switching_and_constraints():
    engine = SmartIntentEngine()
    
    # 1. Monolingual English Test
    res1 = await engine.parse_intent_and_constraints(
        "Find the fastest route from Coimbatore to Chennai.",
        conversation_context=[],
        existing_constraints={},
    )
    assert res1["intent"] == "find_route"
    assert res1["tool_name"] == "RouteTool"
    assert res1["params"]["origin"] == "Coimbatore"
    assert res1["params"]["destination"] == "Chennai"
    assert res1["params"]["highway_allowed"] is True
    assert res1["params"]["route_preference"] == "fastest"
    assert res1["language_info"]["is_code_switching"] is False
    
    # 2. Multilingual Code-Switching Test (Tamil + English)
    tanglish_text = "Chennai-ku fastest route find pannu, but highway avoid pannanum."
    res2 = await engine.parse_intent_and_constraints(
        tanglish_text,
        conversation_context=[],
        existing_constraints={},
    )
    assert res2["intent"] == "find_route"
    assert res2["params"]["destination"] == "Chennai"
    assert res2["params"]["highway_allowed"] is False
    assert res2["language_info"]["is_code_switching"] is True
    assert "Tamil" in res2["language_info"]["primary"]
    
    # 3. Constraint Update & Preservation Test (Turn 2 interruption)
    interruption_text = "Wait! Don't use highways. I want the cheapest route."
    res3 = await engine.parse_intent_and_constraints(
        interruption_text,
        conversation_context=[],
        existing_constraints={"origin": "Coimbatore", "destination": "Chennai"},
    )
    assert res3["params"]["origin"] == "Coimbatore"  # Preserved
    assert res3["params"]["destination"] == "Chennai"  # Preserved
    assert res3["params"]["highway_allowed"] is False   # Updated
    assert res3["params"]["route_preference"] == "cheapest"  # Updated
    assert res3["is_interruption_candidate"] is True
