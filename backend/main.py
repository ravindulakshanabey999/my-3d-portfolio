from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

@app.get("/")
def read_root():
    return {"message": "Ravindu's AI Brain is Active! 🧠"}

@app.get("/projects")
def get_projects():
    # Dan api VIDEO path ekath methaninma yawanawa
    return [
        {
            "id": 1,
            "title": "eFrame Store",
            "tech": "React + Three.js",
            "desc": "Real-time 3D Product Customizer for E-Commerce. Customers can design mugs & t-shirts in 3D.",
            "link": "https://eframe.store/",
            "video": "/videos/eframe.mp4"
        },
        {
            "id": 2,
            "title": "Smokio 3D",
            "tech": "WebGL + GSAP",
            "desc": "Immersive 3D storytelling experience for Rap Artist Smokio. Features interactive scrolling and character animations.",
            "link": "https://taupe-axolotl-9a3639.netlify.app/",
            "video": "/videos/smokio-3d-site.mp4"
        },
        {
            "id": 3,
            "title": "ERP Suite",
            "tech": "Laravel + Livewire",
            "desc": "Massive Enterprise System with 26 Modules including Stock, HR, and Logistics.",
            "link": "#",
            "video": "/videos/erp.mp4"
        }
    ]

@app.post("/chat")
def chat_with_ai(request: ChatRequest):
    user_msg = request.message.lower()
    
    if "hello" in user_msg or "hi" in user_msg:
        return {"reply": "Hello! I am Ravindu's AI Assistant. How can I help you today?"}
    
    elif "who" in user_msg and "ravindu" in user_msg:
        return {"reply": "Ravindu Lakshan is an Expert Full Stack Developer specializing in Laravel, React, and 3D Web Technologies."}
    
    elif "contact" in user_msg or "number" in user_msg or "whatsapp" in user_msg:
        return {"reply": "You can reach Ravindu at 076 216 9837. Or click here to WhatsApp: https://wa.me/94762169837"}
    
    elif "smokio" in user_msg:
        return {"reply": "The Smokio 3D site is a masterpiece! You can view it here: https://taupe-axolotl-9a3639.netlify.app/"}

    else:
        return {"reply": "I'm focusing on Ravindu's professional work. Ask about his projects or contact details!"}