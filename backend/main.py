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

# --- 1. DIAGNOSTIC: මොන මොඩල් ද වැඩ කරන්නේ කියලා Log එකේ බලාගන්න ---
@app.on_event("startup")
async def check_models():
    try:
        print("\n--- CHECKING GOOGLE MODELS ---")
        if not GEMINI_API_KEY:
            print("❌ API Key is missing!")
            return
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if "models" in data:
            for m in data["models"]:
                print(f"✅ Available: {m['name']}")
        else:
            print(f"⚠️ Error listing models: {data}")
        print("------------------------------\n")
            
    except Exception as e:
        print(f"Startup Error: {e}")

# --- 2. PROJECTS DATA (මේක තමයි කලින් මිස් වුනේ - දැන් හරි!) ---
projects = [
    { "id": 1, "title": "SMOKIO", "desc": "Next.js & Three.js", "tech": "NEXT.JS / THREE.JS", "video": "/videos/smokio-3d-site.mp4", "link": "https://taupe-axolotl-9a3639.netlify.app/" },
    { "id": 2, "title": "ERP SYSTEM", "desc": "Factory management system.", "tech": "LARAVEL / VUE.JS", "video": "/videos/erp.mp4", "link": "#" },
    { "id": 3, "title": "EFRAME", "desc": "Photo framing service.", "tech": "PYTHON / REACT", "video": "/videos/eframe.mp4", "link": "https://eframe.store" }
]

@app.get("/")
def read_root():
    return {"message": "Ravindu's API is Online! 🚀"}

@app.get("/projects")
def get_projects():
    return projects

# --- 3. CHAT FUNCTION ---
# අපි 'gemini-1.5-flash' දාලා බලමු. Log එකේ වෙන නමක් තිබ්බොත් පස්සේ මාරු කරමු.
MODEL_NAME = "gemini-1.5-flash" 
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent?key={GEMINI_API_KEY}"

system_instruction = """
You are Ravindu's AI. Answer simply and shortly.
- "Who is Arjun?": "Arjun is the Boss! Eframe Owner."
- "Who is Nimna?": "Nimna is the Marketing Genius! (Track Ela Kollek)."
"""

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: No API Key."}

    full_prompt = f"{system_instruction}\nUser: {request.message}\nAI:"
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}]
    }

    try:
        response = requests.post(API_URL, json=payload, headers={"Content-Type": "application/json"})
        data = response.json()
        
        if "candidates" in data:
            return {"reply": data["candidates"][0]["content"]["parts"][0]["text"]}
        else:
            print(f"API Request Failed: {data}")
            return {"reply": f"Thinking... (Error: {data.get('error', {}).get('message', 'Check Logs')})"}
            
    except Exception as e:
        return {"reply": "Connection Error."}