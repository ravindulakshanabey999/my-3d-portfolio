from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 

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

# --- SYSTEM INSTRUCTION ---
system_instruction = """
You are Ravindu's AI.
Rules:
1. Contact -> "Email: lakshanabey999@gmail.com | WhatsApp: +94762169837"
2. Nimna -> "Marketing Genius!"
3. Arjun -> "Eframe Boss!"
"""

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: API Key Missing in Render Environment."}

    # අපි මේ ලිස්ට් එකෙන් වැඩ කරන එකක් හොයමු
    # (gemini-1.5-flash තමයි ලාබම, gemini-pro තමයි ෂුවර්ම)
    models = ["gemini-1.5-flash", "gemini-pro"]
    
    last_error = ""

    for model in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            payload = {
                "contents": [{"parts": [{"text": f"{system_instruction}\nUser: {request.message}\nAI:"}]}]
            }
            
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
            data = response.json()

            # හරියට උත්තරේ ආවොත් යවන්න
            if "candidates" in data:
                return {"reply": data["candidates"][0]["content"]["parts"][0]["text"]}
            
            # Error එකක් ආවොත් Note කරගන්න
            if "error" in data:
                error_msg = data['error']['message']
                print(f"⚠️ {model} Error: {error_msg}")
                last_error = f"Model ({model}) Failed: {error_msg}"

        except Exception as e:
            last_error = f"Connection Error: {str(e)}"

    # ඔක්කොම ෆේල් නම් ඇත්තම ලෙඩේ යවන්න (Upgrading කියන්න එපා)
    return {"reply": f"GOOGLE ERROR: {last_error}"}