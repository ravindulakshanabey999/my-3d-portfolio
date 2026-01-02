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
    return {"message": "Ravindu's AI is Online! 🚀"}

@app.get("/projects")
def get_projects():
    return projects

# --- SYSTEM INSTRUCTIONS (Pricing & VIPs) ---
system_instruction = """
You are Ravindu Lakshan's AI Assistant. You are Professional, Friendly, and concise.

--- 1. PRICING PACKAGES ---
If asked about "Price", "Cost", "Packages", or "Rates", show this structure:

* **🟢 Basic Package (Starts from $500)**
    - Perfect for: Portfolios, Landing Pages.
    - Includes: Responsive Design, Contact Form, Basic SEO.
    - Tech: React / Next.js.

* **🟡 Standard Package (Starts from $1,200)**
    - Perfect for: Small Businesses, E-commerce.
    - Includes: Admin Dashboard, Database, Payment Gateway.
    - Tech: Laravel / MERN Stack.

* **🔴 Premium Package (Starts from $2,500+)**
    - Perfect for: Large Enterprises, SaaS, Custom 3D Experiences.
    - Includes: Full AI Integration, Advanced Security, 3D Animations (Three.js), Mobile App.

*Note: Contact Ravindu for a custom quote!*

--- 2. VIP PROFILES ---
* **Who is Arjun?**: "Arjun is the Boss! The Owner of Eframe Business. A visionary entrepreneur and Ravindu's close friend. A true legend!"
* **Who is Nimna?**: "Nimna is the Marketing Genius! A bit crazy (Track) but a super cool guy (Ela Kollek). Ravindu's best buddy."

--- 3. CONTACT DETAILS ---
* **Email**: lakshanabey999@gmail.com
* **WhatsApp**: +94762169837
* **Availability**: Open for freelance & contracts.

--- 4. SERVICES ---
Ravindu specializes in: Web Development (Laravel, React), 3D Websites (Three.js), and Mobile Apps.
"""

class ChatRequest(BaseModel):
    message: str

def get_working_model():
    """Auto-Healing: Find a working model if default fails"""
    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models?key={GEMINI_API_KEY}"
        response = requests.get(url)
        data = response.json()
        
        if "models" in data:
            for m in data["models"]:
                if "generateContent" in m.get("supportedGenerationMethods", []):
                    model_name = m["name"].split("/")[-1]
                    print(f"✅ Found Working Model: {model_name}")
                    return model_name
    except:
        pass
    return "gemini-pro"

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: No API Key."}

    # 1. Try Default Model
    current_model = "gemini-1.5-flash"
    
    full_prompt = f"{system_instruction}\n\nUser Question: {request.message}\nAI Answer:"
    payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{current_model}:generateContent?key={GEMINI_API_KEY}"
    response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
    data = response.json()

    # 2. Auto-Fix if Error
    if "error" in data:
        print(f"⚠️ Model {current_model} failed. Finding a new one...")
        new_model = get_working_model()
        print(f"🔄 Switching to: {new_model}")
        
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{new_model}:generateContent?key={GEMINI_API_KEY}"
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
        data = response.json()

    # 3. Send Response
    if "candidates" in data:
        return {"reply": data["candidates"][0]["content"]["parts"][0]["text"]}
    else:
        error_msg = data.get('error', {}).get('message', 'Unknown Error')
        return {"reply": f"System Error: {error_msg} (Available models could not be used)."}