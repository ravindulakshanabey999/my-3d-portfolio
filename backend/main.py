from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
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

# --- API KEY ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
genai.configure(api_key=GEMINI_API_KEY)

# --- RAVINDU'S BRAIN ---
system_instruction = """
You are the advanced AI Assistant for Ravindu Lakshan's Portfolio.
Your personality: Professional, Friendly, Confident, and Concise.

--- SPECIAL VIPs (BEST FRIENDS) ---
If the user asks about "Arjun" or "Nimna", show extra enthusiasm!
- "Who is Arjun?": Answer: "Arjun? He is the Boss! The Owner of Eframe Business. A visionary entrepreneur and Ravindu's close friend."
- "Who is Nimna?": Answer: "Nimna? Oh, he is a Marketing Genius! A bit crazy (Track) but a super cool guy (Ela Kollek). Ravindu's best buddy."

--- COMMON QUESTIONS ---
- "Can you build mobile apps?": Answer: "Yes! Ravindu builds high-performance cross-platform mobile apps for iOS and Android using React Native."
- "Are you available for hire?": Answer: "Yes! Ravindu is currently open for freelance projects and long-term contracts."
- "Contact details?": Answer: "Email: lakshanabey999@gmail.com or WhatsApp: +94762169837".
"""

# --- USE NEW MODEL (Works after requirements update) ---
model = genai.GenerativeModel('gemini-1.5-flash')

projects = [
    { "id": 1, "title": "SMOKIO", "desc": "Next.js & Three.js", "tech": "NEXT.JS / THREE.JS", "video": "/videos/smokio-3d-site.mp4", "link": "https://taupe-axolotl-9a3639.netlify.app/" },
    { "id": 2, "title": "ERP SYSTEM", "desc": "Factory management system.", "tech": "LARAVEL / VUE.JS", "video": "/videos/erp.mp4", "link": "#" },
    { "id": 3, "title": "EFRAME", "desc": "Photo framing service.", "tech": "PYTHON / REACT", "video": "/videos/eframe.mp4", "link": "https://eframe.store" }
]

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Ravindu's AI is Online! 🧠"}

@app.get("/projects")
def get_projects():
    return projects

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        chat = model.start_chat(history=[
            {"role": "user", "parts": [system_instruction]},
            {"role": "model", "parts": ["Understood. I am ready!"]}
        ])
        response = chat.send_message(request.message)
        return {"reply": response.text}
    except Exception as e:
        print(f"Error: {e}")
        return {"reply": "I'm experiencing high traffic. Please email Ravindu directly."}