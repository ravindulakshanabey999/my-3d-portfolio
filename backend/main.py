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
    return {"message": "Ravindu's AI is Online! 🚀"}

@app.get("/projects")
def get_projects():
    return projects

class ChatRequest(BaseModel):
    message: str

def get_available_models_text():
    """තියෙන මොඩල් ටික Text එකක් විදිහට ගන්න"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if "models" in data:
            model_names = [m["name"].replace("models/", "") for m in data["models"]]
            return ", ".join(model_names)
        else:
            return "No models found"
    except:
        return "Connection Failed"

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: No API Key."}

    # 1. වැඩ කරන මොඩල් එක තෝරාගැනීම (Auto-Select)
    available_models = get_available_models_text()
    working_model = "gemini-1.5-flash" # Default
    
    if "gemini-1.5-flash" not in available_models and "gemini-pro" in available_models:
        working_model = "gemini-pro"
    
    if "gemini" not in working_model:
         try:
             url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
             data = requests.get(url).json()
             for m in data.get("models", []):
                 if "generateContent" in m.get("supportedGenerationMethods", []):
                     working_model = m["name"].replace("models/", "")
                     break
         except:
             pass

    # 2. AI උපදෙස් (මෙන්න මෙතන තමයි අපි Contact Details දැම්මේ)
    system_instruction = """
    You are Ravindu Lakshan's AI Assistant.
    
    RULES FOR ANSWERING:
    1. If asked about "Contact" or "Email" or "Phone": 
       Answer: "You can contact Ravindu via Email: lakshanabey999@gmail.com or WhatsApp: +94762169837"
    
    2. If asked "Who is Arjun?": 
       Answer: "Arjun is the Boss! The Owner of Eframe Business. A true legend!"
    
    3. If asked "Who is Nimna?": 
       Answer: "Nimna is the Marketing Genius! A super cool guy (Track Ela Kollek)."
    
    4. For other questions: Keep answers short, professional, and friendly.
    """
    
    full_prompt = f"{system_instruction}\n\nUser Question: {request.message}\nAI Answer:"
    
    payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{working_model}:generateContent?key={GEMINI_API_KEY}"
    
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        data = response.json()

        if "candidates" in data:
            return {"reply": data["candidates"][0]["content"]["parts"][0]["text"]}
        else:
            return {"reply": f"I'm here, but I had a small error. Please try again! (Model: {working_model})"}

    except Exception as e:
        return {"reply": "I'm experiencing high traffic. Please email lakshanabey999@gmail.com"}