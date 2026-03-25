import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import google.generativeai as genai
from app.config import settings
import json, re

genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel("gemini-2.5-flash")

prompt = (
    "Create a 3-question multiple choice quiz on Python Basics. "
    "Return ONLY a JSON array. Each element must have: text, option_a, option_b, option_c, option_d, correct_answer (one of a/b/c/d). "
    "No prose, no code fences, no markdown."
)

try:
    response = model.generate_content(prompt)
    raw = (response.text or "").strip()
    print("RAW:", repr(raw[:300]))

    # Try direct parse
    try:
        parsed = json.loads(raw)
    except Exception:
        m = re.search(r"(\[\s*\{[\s\S]*?\}\s*\])", raw)
        parsed = json.loads(m.group(1)) if m else None

    if isinstance(parsed, list) and len(parsed) > 0:
        print(f"\nSUCCESS: {len(parsed)} questions generated")
        for i, q in enumerate(parsed, 1):
            print(f"  Q{i}: {q.get('text','?')[:60]}")
            print(f"       A={q.get('option_a','?')[:30]} | Correct={q.get('correct_answer','?')}")
    else:
        print("FAILED: not a valid list")
except Exception as e:
    print("ERROR:", type(e).__name__, str(e)[:200])
