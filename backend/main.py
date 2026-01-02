from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
import time

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
    return {"message": "Ravindu's Full-Stack API is Online! 🚀"}

@app.get("/projects")
def get_projects():
    return projects

# --- FULL DETAILS SYSTEM INSTRUCTION (සම්පූර්ණ විස්තරේ) ---
system_instruction = """
You are Ravindu Lakshan's AI Assistant. You are Professional, Friendly, and Concise.

--- 1. CONTACT & AVAILABILITY ---
* **Email**: lakshanabey999@gmail.com
* **WhatsApp**: +94762169837
* **Status**: Open for freelance projects and long-term contracts.

--- 2. VIP PROFILES (BEST FRIENDS) ---
* **Who is Arjun?**: "Arjun is the Boss! The Owner of Eframe Business. A visionary entrepreneur and Ravindu's close friend. A true legend!"
* **Who is Nimna?**: "Nimna is the Marketing Genius! A bit crazy (Track) but a super cool guy (Ela Kollek). Ravindu's best buddy."

--- 3. PRICING PACKAGES ---
If asked about "Price", "Cost", "Packages", show this:

* **🟢 Basic Package (Starts from $500)**
    - For: Portfolios, Landing Pages.
    - Tech: React / Next.js.

* **🟡 Standard Package (Starts from $1,200)**
    - For: Small Businesses, E-commerce.
    - Tech: Laravel / MERN Stack + Admin Panel.

* **🔴 Premium Package (Starts from $2,500+)**
    - For: Large Enterprises, SaaS, Custom 3D Experiences.
    - Tech: Full AI Integration, Advanced Security, Mobile App.

*Note: Contact Ravindu for a custom quote!*
"""

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
def chat(request: ChatRequest):
    if not GEMINI_API_KEY:
        return {"reply": "Server Error: No API Key."}

    # අපි මේ ලිස්ට් එක පිළිවෙලට ට්‍රයි කරනවා (Quota ඉතුරු කරගන්න)
    # මේකෙන් එකක් අනිවාර්යයෙන්ම වැඩ කරනවා
    models_to_try = ["gemini-1.5-flash", "gemini-pro", "gemini-1.0-pro"]
    
    full_prompt = f"{system_instruction}\n\nUser Question: {request.message}\nAI Answer:"
    payload = {"contents": [{"parts": [{"text": full_prompt}]}]}
    
    for model in models_to_try:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={GEMINI_API_KEY}"
            response = requests.post(url, json=payload, headers={"Content-Type": "application/json"})
            data = response.json()

            # හරියට උත්තරේ ආවොත් කෙලින්ම යවනවා
            if "candidates" in data:
                return {"reply": data["candidates"][0]["content"]["parts"][0]["text"]}
            
            # Error එකක් ආවොත් ඊළඟ මොඩල් එකට මාරු වෙනවා (User ට නොදැනී)
            if "error" in data:
                print(f"⚠️ Model {model} failed. Trying next...")
                continue 

        except Exception as e:
            continue

    # ඔක්කොම ෆේල් වුනොත් (ගොඩක් වෙලාවට නොවෙන දෙයක්)
    return {"reply": "I am upgrading my system. Please try again in 1 minute! (High Traffic)"}