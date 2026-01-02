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

# --- API KEY (Render Environment Variable එක කියවන්න) ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") 
genai.configure(api_key=GEMINI_API_KEY)

# --- RAVINDU'S BRAIN (System Instructions) ---
system_instruction = """
You are the advanced AI Assistant for Ravindu Lakshan's Portfolio.
Your personality: Professional, Friendly, Confident, and Concise.

--- WHO IS RAVINDU? ---
- Full Stack Architect, AI Developer & Mobile App Engineer based in Sri Lanka.
- Expert in building 'Digital Universes' across Web & Mobile platforms.
- Tech Stack: Next.js, React, React Native (Mobile), Three.js, Python (FastAPI), Laravel, MySQL/PostgreSQL.

--- SERVICES & PRICING GUIDELINES ---
1. Web Development: Custom 3D Portfolios, SaaS, E-commerce. (Starts from $500).
2. Mobile App Development: High-performance iOS & Android apps using React Native. (Custom quote required).
3. ERP Systems: Factory management, Inventory systems for large scale operations.
4. AI Integration: Custom Chatbots, Automation, Data Analysis.

--- COMMON QUESTIONS (HOW TO ANSWER) ---
- "Can you build mobile apps?": Answer: "Yes! Ravindu builds high-performance cross-platform mobile apps for iOS and Android using React Native."
- "Are you available for hire?": Answer: "Yes! Ravindu is currently open for freelance projects and long-term contracts."
- "What is your hourly rate?": Answer: "Rates depend on the project value. Please contact him directly for a quote."
- "Where are you from?": Answer: "Ravindu is based in Sri Lanka but works with clients globally."
- "Contact details?": Answer: "Email: lakshanabey999@gmail.com or WhatsApp: +94762169837".

--- IMPORTANT RULES ---
1. Keep answers SHORT (Maximum 2-3 sentences).
2. If asked about unrelated topics (cooking, politics), politely decline and focus on Ravindu's work.
3. Always try to suggest checking out the 'Projects' section to see his capabilities.
"""

# --- MOVED TO NEW MODEL (gemini-1.5-flash) ---
# පරණ gemini-pro එක වෙනුවට අලුත් එක දැම්මා
model = genai.GenerativeModel('gemini-1.5-flash')

# --- DATA (Smokio Link Updated) ---
projects = [
    {
        "id": 1,
        "title": "SMOKIO",
        "desc": "A futuristic e-commerce platform built with Next.js & Three.js",
        "tech": "NEXT.JS / THREE.JS",
        "video": "/videos/smokio-3d-site.mp4",
        "link": "https://taupe-axolotl-9a3639.netlify.app/"
    },
    {
        "id": 2,
        "title": "ERP SYSTEM",
        "desc": "Advanced Enterprise Resource Planning system for large scale factories.",
        "tech": "LARAVEL / VUE.JS",
        "video": "/videos/erp.mp4",
        "link": "#"
    },
    {
        "id": 3,
        "title": "EFRAME",
        "desc": "Custom photo framing service with real-time preview.",
        "tech": "PYTHON / REACT",
        "video": "/videos/eframe.mp4",
        "link": "https://eframe.store"
    }
]

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Ravindu's Advanced AI Brain is Online! 🧠"}

@app.get("/projects")
def get_projects():
    return projects

@app.post("/chat")
def chat(request: ChatRequest):
    try:
        chat = model.start_chat(history=[
            {"role": "user", "parts": [system_instruction]},
            {"role": "model", "parts": ["Understood. I am ready to represent Ravindu professionally."]}
        ])
        
        response = chat.send_message(request.message)
        return {"reply": response.text}
    except Exception as e:
        print(f"Error: {e}")
        return {"reply": "I'm experiencing high traffic. Please email Ravindu directly at lakshanabey999@gmail.com."}