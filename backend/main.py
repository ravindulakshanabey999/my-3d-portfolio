from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os

app = FastAPI()

# --- CORS SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 

# --- වැදගත්ම කොටස: අපි ඉස්සෙල්ලාම බලමු මොන මොඩල් ද වැඩ කරන්නේ කියලා ---
@app.on_event("startup")
async def check_models():
    try:
        if not GEMINI_API_KEY:
            print("❌ Error: API Key is missing!")
            return
            
        # Google එකෙන් අහනවා "උඹ ළඟ තියෙන මොඩල් මොනවද?" කියලා
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        print("\n--- AVAILABLE GOOGLE MODELS (CHECK THIS LIST) ---")
        if "models" in data:
            for m in data["models"]:
                print(f"✅ Model Found: {m['name']}")
        else:
            print(f"⚠️ Could not list models. Error: {data}")
        print("-------------------------------------------------\n")
            
    except Exception as e:
        print(f"Startup Error: {e}")

# --- CHAT SETUP ---
# අපි දැනට 'gemini-1.5-flash' පාවිච්චි කරමු. ඒක හරියන්න ඕනේ.
# නැත්නම් අර උඩ Log එකේ එන නමක් පස්සේ දාගන්න පුළුවන්.
MODEL_NAME = "gemini-1.5-flash" 
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"

system_instruction = """
You are Ravindu's AI. Answer simply and shortly.
- "Who is Arjun?": "Arjun is the Boss! Eframe Owner."
- "Who is Nimna?": "Nimna is the Marketing Genius!"
"""

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: No API Key."}

    payload = {
        "contents": [{"parts": [{"text": f"{system_instruction}\nUser: {request.message}\nAI:"}]}]
    }

    try:
        response = requests.post(API_URL, json=payload, headers={"Content-Type": "application/json"})
        data = response.json()
        
        if "candidates" in data:
            return {"reply": data["candidates"][0]["content"]["parts"][0]["text"]}
        else:
            # මෙන්න මෙතන Error එක ආවොත් අපි Log එකට දානවා
            print(f"API Request Failed: {data}")
            return {"reply": f"Model Error: {data.get('error', {}).get('message', 'Unknown error')}"}
            
    except Exception as e:
        return {"reply": "Connection Error."}