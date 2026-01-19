'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect, Suspense } from 'react';
import { Points, PointMaterial, Float, Stars, Sphere, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { MessageSquare, X, Send, ExternalLink, Code2, Database, Layers, Play, Linkedin, Briefcase, ChevronRight } from 'lucide-react';
// @ts-ignore
import * as random from 'maath/random';
import * as THREE from 'three';

// --- 1. BLACK HOLE PARTICLES ---
function GalaxyParticles({ scrollProgress, hasStarted, hasArrived }: { scrollProgress: number, hasStarted: boolean, hasArrived: boolean }) {
  const ref = useRef<any>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(21000), { radius: 4 }) as any);

  useFrame((state, delta) => {
    if (ref.current) {
      const isIntroWarping = hasStarted && !hasArrived;
      const isBlackHoleWarping = scrollProgress > 0.8;

      ref.current.rotation.y += delta * 0.1 + (scrollProgress * 0.5);
      
      if (isIntroWarping) {
           ref.current.rotation.x += delta * 2;
           ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, 15, 0.05);
      } else if (isBlackHoleWarping) {
           ref.current.scale.z = THREE.MathUtils.lerp(ref.current.scale.z, 20, 0.1); 
           ref.current.scale.x = THREE.MathUtils.lerp(ref.current.scale.x, 0.5, 0.1);
           ref.current.scale.y = THREE.MathUtils.lerp(ref.current.scale.y, 0.5, 0.1);
      } else {
           ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
      }
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
            transparent
            color={scrollProgress > 0.8 ? "#ffffff" : "#00f0ff"}
            size={scrollProgress > 0.8 ? 0.005 : 0.002}
            sizeAttenuation={true}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

// --- 2. BLACK HOLE CORE ---
function BlackHoleCore({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<any>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if(meshRef.current) {
        meshRef.current.rotation.x = t * 0.2;
        meshRef.current.rotation.y = t * 0.5;

        if (scrollProgress > 0.9) {
            const scale = 1 + (scrollProgress - 0.9) * 20; 
            meshRef.current.scale.set(scale, scale, scale);
            meshRef.current.material.color.set("#000000");
            meshRef.current.material.emissive.set("#000000");
        } else {
            meshRef.current.scale.set(0.8, 0.8, 0.8);
            meshRef.current.material.emissive.set("#7000df");
        }
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Sphere args={[1, 128, 128]} scale={0.8} ref={meshRef}>
            <MeshDistortMaterial
                color="#000000"
                emissive="#7000df"
                emissiveIntensity={2}
                roughness={0.1}
                metalness={1}
                distort={0.6}
                speed={2}
            />
        </Sphere>
    </Float>
  );
}

// --- 3. CAMERA RIG ---
function CameraRig({ startJourney, hasArrived, onArrival, setScrollProgress }: { startJourney: boolean, hasArrived: boolean, onArrival: () => void, setScrollProgress: (v: number) => void }) {
    const { camera } = useThree();
    const vec = new THREE.Vector3();

    useFrame((state) => {
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(scrollY / (maxScroll || 1), 1);
        setScrollProgress(progress);

        if (!startJourney) {
            camera.position.lerp(vec.set(state.pointer.x, state.pointer.y, 40), 0.05);
            camera.lookAt(0, 0, 0);
        } else if (!hasArrived) {
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5, 0.04);
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, 0.04);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, 0.04);

            if (camera.position.z < 6) {
                onArrival();
            }
        } else {
            let targetZ = 5; 
            if (progress < 0.8) {
                 targetZ = 5; 
            } else {
                targetZ = 5 - ((progress - 0.8) * 100); 
            }
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
        }
    });
    return null;
}

// --- 4. AI ROBOT AVATAR (NEW! 🔥) ---
function AIAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  const group = useRef<any>(null);
  const ringRef = useRef<any>(null);
  const eyesRef = useRef<any>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // 1. Floating Animation (මුළු රොබෝම උඩ පහල යනවා)
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.5) * 0.15; // Smooth Floating
      group.current.rotation.y = Math.sin(t * 0.5) * 0.1;  // පොඩ්ඩක් වමට දකුණට බලනවා
    }

    // 2. Ring Rotation (ඔළුව වටේ රින්ග් එක කැරකෙනවා)
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.5;
      ringRef.current.rotation.y = t * 0.3;
    }

    // 3. Speaking Animation (කතා කරනකොට ඇස් ලොකු වෙනවා & ගැස්සෙනවා)
    if (eyesRef.current) {
      if (isSpeaking) {
        // කතා කරනකොට ඇස් වල එළිය (Scale) අඩු වැඩි වෙනවා
        const scale = 1 + Math.sin(t * 20) * 0.2;
        eyesRef.current.scale.set(scale, scale, scale);
        eyesRef.current.position.z = 0.35 + Math.sin(t * 20) * 0.02;
      } else {
        // කතා නොකරනකොට නෝමල් ඉන්නවා
        eyesRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        eyesRef.current.position.z = 0.35;
      }
    }
  });

return (
    // කැමරා එකට ගොඩක් ලඟින් (z=3) පෙන්නනවා
    <group ref={group} position={[0, -0.2, 3]} rotation={[0, 0, 0]}> 
      
      {/* --- HEAD (Sleek Sphere) --- */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 64, 64]} /> {/* Smooth Sphere */}
        <meshPhysicalMaterial 
            color="#111" 
            metalness={0.9} 
            roughness={0.1} 
            clearcoat={1} 
            clearcoatRoughness={0.1}
        />
      </mesh>

      {/* --- GLOWING EYES (Group) --- */}
      <group ref={eyesRef} position={[0, 0.1, 0.35]}>
          {/* Left Eye */}
          <mesh position={[-0.15, 0, 0.15]} rotation={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} /> {/* Oval Shape Eyes */}
            <meshBasicMaterial color={isSpeaking ? "#00ff00" : "#00f0ff"} /> {/* කතා කරනකොට කොළ, නැත්තම් නිල් */}
          </mesh>
          {/* Right Eye */}
          <mesh position={[0.15, 0, 0.15]} rotation={[0, 0.2, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
            <meshBasicMaterial color={isSpeaking ? "#00ff00" : "#00f0ff"} />
          </mesh>
      </group>

      {/* --- HALO RINGS (Sci-Fi Look) --- */}
      <group ref={ringRef}>
          {/* Outer Ring */}
          <mesh rotation={[1.5, 0, 0]}>
            <torusGeometry args={[0.9, 0.02, 16, 100]} />
            <meshBasicMaterial color="cyan" transparent opacity={0.3} />
          </mesh>
          {/* Inner Ring */}
          <mesh rotation={[0, 0, 1]}>
            <torusGeometry args={[0.75, 0.01, 16, 100]} />
            <meshBasicMaterial color="purple" transparent opacity={0.5} />
          </mesh>
      </group>

      {/* --- ANTENNA (Optional) --- */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.4]} />
        <meshStandardMaterial color="gray" />
      </mesh>
      <PointMaterial color="red" size={0.15} position={[0, 0.8, 0]} />

    </group>
  );
}





  

// --- LINKS ---
const socialLinks = [
    { name: "Upwork", icon: Briefcase, color: "text-green-400", hover: "hover:border-green-500", link: "https://www.upwork.com/freelancers/~01031ae12d25d4eae5?mp_source=share" },
    { name: "Fiverr", icon: Briefcase, color: "text-green-500", hover: "hover:border-green-600", link: "https://www.fiverr.com/s/ak2Rakp" },
    { name: "LinkedIn", icon: Linkedin, color: "text-blue-400", hover: "hover:border-blue-500", link: "https://www.linkedin.com/in/rav-lakshan-050a64397" },
    { name: "WhatsApp", icon: MessageSquare, color: "text-green-400", hover: "hover:border-green-400", link: "https://wa.me/94762169837" }
];

const renderMessageText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, index) => {
        if (part.match(urlRegex)) return <a key={index} href={part} target="_blank" rel="noopener noreferrer" className="text-cyan-300 font-bold underline break-all hover:text-cyan-100">Link ↗</a>;
        return part;
    });
};

export default function Home() {
  const [hasStarted, setHasStarted] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  const [projects, setProjects] = useState<any[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [messages, setMessages] = useState<{sender: 'user' | 'bot', text: string}[]>([{ sender: 'bot', text: 'Hi! I am Ravindu\'s AI Assistant.' }]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // NEW: State to check if AI is speaking
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
  // 👇 අනිවාර්යයෙන්ම මේ Online Link එක තියෙන්න ඕන Live යන්න!
  fetch('https://ravindu-api.onrender.com/projects') 
    .then((res) => res.json())
    .then((data) => setProjects(data))
    .catch((error) => console.error("Error connecting to Python Brain:", error));
}, []);

  // UPDATED SEND MESSAGE FUNCTION (WITH VOICE) 🎙️
  const sendMessage = async () => {
    if(!inputMsg.trim()) return;
    const userText = inputMsg;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg("");
    setIsTyping(true);

    try {
      const res = await fetch('https://ravindu-api.onrender.com/chat', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ message: userText }) 
      });
      const data = await res.json();
      const botReply = data.reply;
      
      setMessages(prev => [...prev, { sender: 'bot', text: botReply }]);

      // --- VOICE LOGIC START ---
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stop previous speech
        const utterance = new SpeechSynthesisUtterance(botReply);
        
        // Voice Customization
        utterance.pitch = 0.8; // Deep Robot Voice
        utterance.rate = 1.1;  // Fast Speed
        
        // Find a cool English voice if available (Optional)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Google')) || voices[0];
        if(preferredVoice) utterance.voice = preferredVoice;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        
        window.speechSynthesis.speak(utterance);
      }
      // --- VOICE LOGIC END ---

    } catch (error) {
      setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, my brain is offline right now." }]);
    }
    setIsTyping(false);
  };

  const colors = ["from-blue-500 to-cyan-500", "from-purple-500 to-pink-500", "from-green-500 to-emerald-500"];

  return (
    <div className={`bg-black min-h-screen text-white selection:bg-cyan-500 selection:text-black font-sans overflow-x-hidden ${!hasArrived ? 'overflow-y-hidden h-screen' : ''}`}>
      
      {/* 3D SCENE */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 40], fov: 60 }}>
          <Suspense fallback={null}>
            <CameraRig startJourney={hasStarted} hasArrived={hasArrived} onArrival={() => setHasArrived(true)} setScrollProgress={setScrollProgress} />
            
            <Stars radius={50} count={6000} factor={4} fade speed={1 + scrollProgress * 10} />
            <Sparkles count={100} scale={scrollProgress > 0.8 ? [5,5,50] : [10,10,10]} size={6} speed={scrollProgress > 0.8 ? 5 : 0.4} opacity={0.8} color="#00f0ff" />
            
            <GalaxyParticles scrollProgress={scrollProgress} hasStarted={hasStarted} hasArrived={hasArrived} />
            <BlackHoleCore scrollProgress={scrollProgress} />
            
            {/* NEW: ROBOT AVATAR (Only visible when chat is open) */}
            {isChatOpen && <AIAvatar isSpeaking={isSpeaking} />}
            
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#00f0ff" />
          </Suspense>
        </Canvas>
      </div>

      {/* START SCREEN */}
      <AnimatePresence>
        {!hasStarted && (
            <motion.div 
                exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }}
                transition={{ duration: 1 }}
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
            >
                <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600 mb-8 tracking-widest text-center">
                    BEYOND HORIZON
                </h1>
                <button 
                    onClick={() => setHasStarted(true)}
                    className="group relative px-10 py-5 bg-transparent border border-white/20 hover:border-cyan-500 text-white font-bold tracking-[0.5em] text-sm overflow-hidden transition-all duration-500 hover:scale-105"
                >
                    <span className="relative z-10 flex items-center gap-4">
                        ENTER UNIVERSE <ChevronRight className="animate-pulse" />
                    </span>
                    <div className="absolute inset-0 bg-cyan-600/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500"></div>
                </button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <AnimatePresence>
        {hasArrived && (
            <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="relative z-10">
                
                {/* HERO */}
                <section className="min-h-screen flex flex-col justify-center px-8 md:px-24 pt-20 pb-32">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.5 }} className="flex-1 z-20">
                            <p className="text-cyan-400 font-mono tracking-[0.3em] mb-4">/// FULL STACK ARCHITECT</p>
                            <h1 className="text-6xl md:text-9xl font-black leading-none mix-blend-overlay">
                            RAVINDU <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">LAKSHAN</span>
                            </h1>
                            <p className="mt-8 text-gray-400 text-xl max-w-xl backdrop-blur-md bg-white/5 p-6 rounded-xl border-l-4 border-cyan-500">
                            Building <span className="text-white font-bold">Digital Universes</span>. 
                            <br/>Powered by <span className="text-yellow-400 font-bold">Python AI</span> & Next.js.
                            </p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 1 }} className="relative w-64 h-64 md:w-80 md:h-80 z-10">
                            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/50 animate-pulse"></div>
                            <div className="absolute inset-2 rounded-full border border-purple-500/50"></div>
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white/10 relative z-10 shadow-2xl shadow-cyan-500/20">
                                <img src="/images/me.jpg" alt="Ravindu" className="w-full h-full object-cover hover:scale-110 transition duration-500" />
                            </div>
                        </motion.div>
                    </div>
                    <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gray-500 text-sm tracking-widest z-20">
                        SCROLL TO DIVE IN
                    </motion.div>
                </section>

                {/* SKILLS */}
                <section className="py-32 px-8 md:px-24 backdrop-blur-md bg-black/40 border-t border-b border-white/5">
                    <h2 className="text-4xl font-bold mb-16 text-center tracking-wider text-green-400 drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">MY ARSENAL</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="p-8 border border-white/10 rounded-3xl bg-white/5 hover:border-cyan-500 transition group hover:-translate-y-2">
                            <Code2 className="text-cyan-400 w-12 h-12 mb-6 group-hover:scale-110 transition" />
                            <h3 className="text-2xl font-bold mb-4">Frontend Magic</h3>
                            <p className="text-gray-400">Next.js, React, Three.js, GSAP. Immersive 3D experiences.</p>
                        </div>
                        <div className="p-8 border border-white/10 rounded-3xl bg-white/5 hover:border-purple-500 transition group hover:-translate-y-2">
                            <Layers className="text-purple-400 w-12 h-12 mb-6 group-hover:scale-110 transition" />
                            <h3 className="text-2xl font-bold mb-4">System Architecture</h3>
                            <p className="text-gray-400">Laravel & Python. Scalable ERP systems.</p>
                        </div>
                        <div className="p-8 border border-white/10 rounded-3xl bg-white/5 hover:border-green-500 transition group hover:-translate-y-2">
                            <Database className="text-green-400 w-12 h-12 mb-6 group-hover:scale-110 transition" />
                            <h3 className="text-2xl font-bold mb-4">AI Integration</h3>
                            <p className="text-gray-400">Python Chatbots & Automation.</p>
                        </div>
                    </div>
                </section>

                {/* PROJECTS */}
                <section className="py-32 px-8 md:px-24">
                    <h2 className="text-5xl md:text-7xl font-bold mb-24 text-center tracking-tighter text-orange-500 drop-shadow-[0_0_15px_rgba(255,165,0,0.5)]">SELECTED WORKS</h2>
                    <div className="grid grid-cols-1 gap-24 max-w-5xl mx-auto">
                        {projects.map((project, index) => (
                        <motion.div
                            key={project.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            viewport={{ once: true, margin: "-100px" }}
                            onClick={() => setSelectedProject(project)}
                            className="cursor-pointer group"
                        >
                            <Tilt tiltMaxAngleX={3} tiltMaxAngleY={3} scale={1.01} className="group">
                            <div className="relative p-[2px] rounded-[2rem] bg-gradient-to-r from-white/10 to-white/0 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 to-purple-500/30 opacity-0 group-hover:opacity-100 transition duration-700 blur-2xl"></div>
                                <div className="relative bg-[#0a0a0a] p-8 md:p-12 rounded-[2rem] border border-white/10 group-hover:border-white/30 transition duration-500">
                                <div className="flex flex-col md:flex-row gap-10 items-center">
                                    <div className="flex-1 space-y-6">
                                    <div className={`text-xs font-black tracking-widest px-4 py-2 rounded-full inline-block bg-gradient-to-r ${colors[index % colors.length]} text-black uppercase`}>{project.tech}</div>
                                    <h3 className="text-5xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-400 group-hover:to-purple-500 transition-all duration-500">{project.title}</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed font-light">{project.desc}</p>
                                    <div className="flex items-center gap-2 text-cyan-400 font-bold tracking-widest uppercase text-sm group/link">
                                        <Play size={16} className="group-hover/link:translate-x-1 transition" /> Watch Demo
                                    </div>
                                    </div>
                                    <div className="w-full md:w-2/5 aspect-video rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group-hover:border-cyan-500/50 transition duration-500 shadow-2xl">
                                        {project.video && (
                                            <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition duration-700 scale-105 group-hover:scale-100 grayscale group-hover:grayscale-0">
                                                <source src={project.video} type="video/mp4" />
                                            </video>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-16 h-16 bg-cyan-500/20 backdrop-blur-md rounded-full flex items-center justify-center border border-cyan-400/50 group-hover:bg-cyan-500 group-hover:scale-110 transition duration-500">
                                                <Play fill="white" size={24} className="ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </Tilt>
                        </motion.div>
                        ))}
                    </div>
                </section>

                {/* --- CONNECT --- */}
                <section className="min-h-screen py-32 px-8 md:px-24 flex flex-col justify-center items-center relative z-20">
                    <motion.div style={{ opacity: scrollProgress > 0.9 ? 1 : 0 }} className="absolute inset-0 bg-black/80 pointer-events-none transition-opacity duration-1000"></motion.div>
                    <h2 className="text-6xl md:text-8xl font-black mb-16 text-center tracking-wider uppercase text-white drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] relative z-30">Lets Talk</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto w-full relative z-30">
                        {socialLinks.map((social, index) => (
                            <a key={index} href={social.link} target="_blank" rel="noopener noreferrer" className={`p-8 border border-white/20 rounded-3xl bg-black/60 backdrop-blur-xl ${social.hover} transition flex flex-col items-center justify-center group hover:-translate-y-2 duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]`}>
                                <social.icon className={`${social.color} w-12 h-12 mb-4 group-hover:scale-110 transition`} />
                                <span className="font-bold text-xl">{social.name}</span>
                            </a>
                        ))}
                    </div>
                    <footer className="absolute bottom-8 text-center text-gray-500 text-sm relative z-30">
                        <p>© {new Date().getFullYear()} Ravindu Lakshan. All rights reserved.</p>
                    </footer>
                </section>
            </motion.main>
        )}
      </AnimatePresence>

      {/* MODAL */}
      <AnimatePresence>
        {selectedProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60" onClick={() => setSelectedProject(null)}>
            <motion.div initial={{ scale: 0.9, y: 50, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} className="bg-[#0a0a0a] w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 p-8 md:p-10 relative shadow-2xl scrollbar-hide" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedProject(null)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-red-500/20 hover:text-red-500 transition z-50"><X size={20} /></button>
              <h2 className="text-4xl md:text-5xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">{selectedProject.title}</h2>
              <p className="text-gray-400 font-mono text-sm mb-8 uppercase tracking-widest">{selectedProject.tech}</p>
              <div className="w-full aspect-video bg-black rounded-2xl mb-10 overflow-hidden border border-white/10 shadow-[0_0_50px_-15px_rgba(0,240,255,0.3)] relative">
                  {selectedProject.video ? (
                    <video key={selectedProject.video} controls autoPlay className="w-full h-full object-cover">
                        <source src={selectedProject.video} type="video/mp4" />
                    </video>
                  ) : <div className="flex items-center justify-center h-full text-gray-500 font-mono">[No Video Signal]</div>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="md:col-span-2">
                  <h3 className="text-xl font-bold mb-4 text-white uppercase tracking-wider">Project Brief</h3>
                  <p className="text-gray-300 leading-relaxed text-lg font-light">{selectedProject.desc}</p>
                </div>
                <div className="flex flex-col justify-end">
                    {selectedProject.link !== "#" ? (
                        <a href={selectedProject.link} target="_blank" className="group px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black tracking-widest rounded-xl flex items-center justify-center gap-3 transition w-full shadow-lg shadow-cyan-500/20">
                            LAUNCH LIVE SITE <ExternalLink size={20} className="group-hover:translate-x-1 transition" />
                        </a>
                    ) : (
                        <div className="px-8 py-4 bg-white/5 border border-white/10 text-gray-400 font-bold tracking-widest rounded-xl flex items-center justify-center gap-3 w-full opacity-50 cursor-not-allowed">INTERNAL SYSTEM (PRIVATE)</div>
                    )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CHATBOT */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsChatOpen(!isChatOpen)} className="bg-cyan-500 hover:bg-cyan-400 text-black p-4 rounded-full shadow-lg shadow-cyan-500/50 transition-colors">
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.button>
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.9 }} className="absolute bottom-16 right-0 w-80 md:w-96 bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="font-bold text-white">Ravindu's AI</h3>
              </div>
              <div className="h-80 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-white/10 text-gray-200 rounded-bl-none'}`}>{renderMessageText(msg.text)}</div>
                  </div>
                ))}
                {isTyping && <div className="text-gray-500 text-xs ml-2">AI is typing...</div>}
              </div>
              <div className="p-4 border-t border-white/10 flex gap-2">
                <input type="text" value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && sendMessage()} placeholder="Ask about Ravindu..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                <button onClick={sendMessage} className="p-2 bg-cyan-600 rounded-lg hover:bg-cyan-500 transition"><Send size={18} /></button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}