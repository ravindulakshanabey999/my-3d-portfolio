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

# --- CONFIG ---
# ඔයා Render එකේ දාපු API Key එක මෙතනට ගන්නවා
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
# කෙලින්ම URL එකෙන් කතා කරමු (SDK ඕනේ නෑ)
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"

# --- RAVINDU'S BRAIN ---
system_instruction = """
You are the advanced AI Assistant for Ravindu Lakshan's Portfolio.
Your personality: Professional, Friendly, Confident, and Concise.

--- SPECIAL VIPs (BEST FRIENDS) ---
- "Who is Arjun?": Answer: "Arjun? He is the Boss! The Owner of Eframe Business. A visionary entrepreneur and Ravindu's close friend. A true legend!"
- "Who is Nimna?": Answer: "Nimna? Oh, he is a Marketing Genius! A bit crazy (Track) but a super cool guy (Ela Kollek). Ravindu's best buddy."

--- COMMON QUESTIONS ---
- "Can you build mobile apps?": Answer: "Yes! Ravindu builds high-performance cross-platform mobile apps for iOS and Android using React Native."
- "Are you available for hire?": Answer: "Yes! Ravindu is currently open for freelance projects and long-term contracts."
- "Contact details?": Answer: "Email: lakshanabey999@gmail.com or WhatsApp: +94762169837".
"""

# --- DATA ---
projects = [
    { "id": 1, "title": "SMOKIO", "desc": "Next.js & Three.js", "tech": "NEXT.JS / THREE.JS", "video": "/videos/smokio-3d-site.mp4", "link": "https://taupe-axolotl-9a3639.netlify.app/" },
    { "id": 2, "title": "ERP SYSTEM", "desc": "Factory management system.", "tech": "LARAVEL / VUE.JS", "video": "/videos/erp.mp4", "link": "#" },
    { "id": 3, "title": "EFRAME", "desc": "Photo framing service.", "tech": "PYTHON / REACT", "video": "/videos/eframe.mp4", "link": "https://eframe.store" }
]

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Ravindu's Direct AI is Online! 🚀"}

@app.get("/projects")
def get_projects():
    return projects

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: API Key not found."}

    # අපි System Instruction එකයි User ගේ ප්‍රශ්නයයි එකතු කරලා යවමු
    full_prompt = f"{system_instruction}\n\nUser Question: {request.message}\nAnswer:"

    payload = {
        "contents": [{
            "parts": [{"text": full_prompt}]
        }]
    }

    try:
        response = requests.post(API_URL, json=payload)
        data = response.json()
        
        # Google එකෙන් එන උත්තරේ සුද්ද කරලා ගමු
        if "candidates" in data:
            reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
            return {"reply": reply_text}
        else:
            print(f"API Error: {data}")
            return {"reply": "I am thinking... try asking again!"}
            
    except Exception as e:
        print(f"Error: {e}")
        return {"reply": "I'm experiencing high traffic. Please email Ravindu directly."}