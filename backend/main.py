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
    return {"message": "Ravindu's API Online"}

@app.get("/projects")
def get_projects():
    return projects

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: API Key Missing."}

    # කෙලින්ම Google එකෙන් අහනවා "උඹ ළඟ තියෙන මොඩල් මොනවද?" කියලා
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if "models" in data:
            # අපිට පාවිච්චි කරන්න පුළුවන් (generateContent තියෙන) මොඩල් ටික තෝරගන්නවා
            valid_models = []
            for m in data["models"]:
                if "generateContent" in m.get("supportedGenerationMethods", []):
                    valid_models.append(m["name"])
            
            # ඒ ලිස්ට් එක කෙලින්ම ඔයාගේ චැට් එකට එවනවා
            list_text = "\n".join(valid_models)
            return {"reply": f"✅ SUCCESS! Found these models:\n\n{list_text}\n\n(Please copy and send this list to me!)"}
        else:
            return {"reply": f"❌ Error: Google didn't send models. Response: {data}"}
            
    except Exception as e:
        return {"reply": f"Connection Error: {str(e)}"}