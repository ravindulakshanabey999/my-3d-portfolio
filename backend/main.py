from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# --- CORS ERROR FIX (මේකෙන් තමයි Vercel එකට දොර අරින්නේ) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ඕනෑම තැනක ඉඳන් එන request වලට ඉඩ දෙන්න
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE (Simple List) ---
projects = [
    {
        "id": 1,
        "title": "SMOKIO",
        "desc": "A futuristic e-commerce platform built with Next.js & Three.js",
        "tech": "NEXT.JS / THREE.JS",
        "video": "/videos/smokio-3d-site.mp4",
        "link": "https://smokio.lk"
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
    return {"message": "Ravindu's AI Brain is Active! 🧠"}

@app.get("/projects")
def get_projects():
    return projects

@app.post("/chat")
def chat(request: ChatRequest):
    user_msg = request.message.lower()
    
    if "price" in user_msg or "cost" in user_msg:
        return {"reply": "My rates depend on the project scope. Usually, I start from $500 for basic sites. Let's discuss!"}
    elif "contact" in user_msg or "email" in user_msg:
        return {"reply": "You can email me at lakshanabey999@gmail.com or WhatsApp me!"}
    elif "skill" in user_msg or "stack" in user_msg:
        return {"reply": "I am an expert in Next.js, React, Three.js, Python, and Laravel."}
    elif "hello" in user_msg or "hi" in user_msg:
        return {"reply": "Hello! I am Ravindu's AI Assistant. How can I help you today?"}
    else:
        return {"reply": "That's interesting! Tell me more about your project idea."}