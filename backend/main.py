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

# --- PROJECTS DATA ---
projects = [
    { "id": 1, "title": "SMOKIO", "desc": "Next.js & Three.js", "tech": "NEXT.JS / THREE.JS", "video": "/videos/smokio-3d-site.mp4", "link": "https://taupe-axolotl-9a3639.netlify.app/" },
    { "id": 2, "title": "ERP SYSTEM", "desc": "Factory management system.", "tech": "LARAVEL / VUE.JS", "video": "/videos/erp.mp4", "link": "#" },
    { "id": 3, "title": "EFRAME", "desc": "Photo framing service.", "tech": "PYTHON / REACT", "video": "/videos/eframe.mp4", "link": "https://eframe.store" }
]

@app.get("/")
def read_root():
    return {"message": "Ravindu's Auto-Healing API is Online! 🛠️"}

@app.get("/projects")
def get_projects():
    return projects

# --- SMART CHAT LOGIC ---
system_instruction = """
You are Ravindu's AI. Answer simply and shortly.
- "Who is Arjun?": "Arjun is the Boss! Eframe Owner."
- "Who is Nimna?": "Nimna is the Marketing Genius! (Track Ela Kollek)."
"""

class ChatRequest(BaseModel):
    message: str

def get_working_model():
    """Google එකෙන් වැඩ කරන මොඩල් එකක් ඉල්ලගන්නවා"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if "models" in data:
            for m in data["models"]:
                # 'generateContent' පුළුවන් මොඩල් එකක් හොයමු
                if "generateContent" in m.get("supportedGenerationMethods", []):
                    model_name = m["name"].split("/")[-1] # "models/gemini-pro" -> "gemini-pro"
                    print(f"✅ Found Working Model: {model_name}")
                    return model_name
    except:
        pass
    return "gemini-pro" # බැරිම වුනොත් මේක දානවා

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: No API Key."}

    # 1. මුලින්ම Default එක ට්‍රයි කරමු
    current_model = "gemini-1.5-flash"
    
    full_prompt = f"{system_instruction}\nUser: {request.message}\nAI:"
    payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
    
    # පළවෙනි උත්සාහය
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={GEMINI_API_KEY}"
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    data = response.json()

    # 2. Error එකක් ආවොත්, Auto-Fix පටන් ගන්නවා
    if "error" in data:
        print(f"⚠️ Model {current_model} failed. Finding a new one...")
        
        # අලුත් වැඩ කරන මොඩල් එකක් හොයාගන්නවා
        new_model = get_working_model()
        print(f"🔄 Switching to: {new_model}")
        
        # අලුත් මොඩල් එකෙන් ආයේ ට්‍රයි කරනවා
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{new_model}:generateContent?key={GEMINI_API_KEY}"
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        data = response.json()

    # 3. ප්‍රතිඵලය යවනවා
    if "candidates" in data:
        return {"reply": data["candidates"][0]["content"]["parts"][0]["text"]}
    else:
        # තාම Error නම්, ඒක කෙලින්ම යවනවා (එතකොට අපිට පේනවා මොකක්ද අවුල කියලා)
        error_msg = data.get('error', {}).get('message', 'Unknown Error')
        return {"reply": f"System Error: {error_msg} (Available models could not be used)."}