import os, json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("OPENAI_MODEL", "gpt-5.2")

def suggest_estimate(payload: dict, historical_jobs: list[dict]) -> dict:
    """
    Returns: { suggested_price, scope, hazards, equipment, rationale }
    """
    prompt = {
        "role": "system",
        "content": (
            "You are an estimator for a small tree service. "
            "Give realistic scope/hazards/equipment and a price suggestion. "
            "Output STRICT JSON with keys: suggested_price, scope, hazards, equipment, rationale."
        ),
    }

    user = {
        "role": "user",
        "content": (
            "NEW JOB DETAILS:\n"
            f"{json.dumps(payload, indent=2)}\n\n"
            "HISTORICAL JOBS (for pricing context):\n"
            f"{json.dumps(historical_jobs[:25], indent=2)}\n\n"
            "Return STRICT JSON only."
        ),
    }

    resp = client.responses.create(
        model=MODEL,
        input=[prompt, user],
    )

    text = getattr(resp, "output_text", "") or ""
    # naive JSON parse fallback
    try:
        return json.loads(text)
    except Exception:
        return {
            "suggested_price": 0,
            "scope": "",
            "hazards": "",
            "equipment": "",
            "rationale": f"Failed to parse model output. Raw:\n{text[:1000]}",
        }

def structure_notes(raw_notes: str) -> dict:
    prompt = {
        "role": "system",
        "content": (
            "Turn arborist job notes into structured fields. "
            "Output STRICT JSON with keys: scope, hazards, equipment, questions_to_confirm."
        ),
    }
    user = {"role": "user", "content": raw_notes}
    resp = client.responses.create(model=MODEL, input=[prompt, user])
    text = getattr(resp, "output_text", "") or ""
    try:
        return json.loads(text)
    except Exception:
        return {"scope": "", "hazards": "", "equipment": "", "questions_to_confirm": [], "raw": text}

def suggest_schedule(estimate: dict, preferred_window: str, crew_options: list[str]) -> dict:
    prompt = {
        "role": "system",
        "content": (
            "You are a dispatcher for a tree service. Suggest a schedule date and crew. "
            "Output STRICT JSON with keys: suggested_date, suggested_crew, reasoning."
        ),
    }
    user = {
        "role": "user",
        "content": json.dumps({
            "estimate": estimate,
            "preferred_window": preferred_window,
            "crew_options": crew_options,
        }, indent=2),
    }
    resp = client.responses.create(model=MODEL, input=[prompt, user])
    text = getattr(resp, "output_text", "") or ""
    try:
        return json.loads(text)
    except Exception:
        return {"suggested_date": "", "suggested_crew": "", "reasoning": text}
