'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { PointMaterial, Stars, Sparkles, Environment } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { MessageSquare, X, Send, ExternalLink, Code2, Database, Layers, Play, Linkedin, Briefcase } from 'lucide-react';
import * as THREE from 'three';

// --- PROJECTS DATA (HARDCODED FOR INSTANT LOADING ⚡) ---
const MY_PROJECTS = [
    { 
        id: 1, 
        title: "SMOKIO", 
        desc: "Next.js & Three.js", 
        tech: "NEXT.JS / THREE.JS", 
        video: "/videos/smokio-3d-site.mp4", 
        link: "https://smokio-3d-experience.netlify.app/" 
    },
    { 
        id: 2, 
        title: "ERP SYSTEM", 
        desc: "Factory management system.", 
        tech: "LARAVEL / VUE.JS", 
        video: "/videos/erp.mp4", 
        link: "#" 
    },
    { 
        id: 3, 
        title: "EFRAME", 
        desc: "Photo framing service.", 
        tech: "PYTHON / REACT", 
        video: "/videos/eframe.mp4", 
        link: "https://eframe.store" 
    },
    { 
        id: 4, 
        title: "LIQUID CHROME", 
        desc: "Interactive 3D Liquid Metal Shader.", 
        tech: "R3F / WEBGL", 
        video: "/videos/blob.mp4", 
        link: "https://liquid-chrome-shader.netlify.app/" 
    }
];

// --- 1. ASTRA GALAXY (custom GLSL shader) ---
// Thousands of stars start scattered, then pull together into a spiral galaxy
// around the chrome core. Inner stars orbit faster than outer ones, the mouse
// pushes stars away like a gravity wave, and scrolling to the end stretches
// everything into the black hole.

const galaxyVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAssemble;    // 0 = scattered, 1 = galaxy formed
  uniform vec3  uPointer;     // mouse position on the z = 0 plane (world space)
  uniform float uPixelRatio;
  attribute vec3  aStart;     // random starting position
  attribute float aRandom;    // 0..1, different for every star
  attribute float aSize;
  varying vec3  vColor;
  varying float vAlpha;
  uniform vec3 uColorInner;
  uniform vec3 uColorOuter;

  void main() {
    // Spiral target (stored in "position"), rotated around Y.
    // Inner stars spin faster than outer stars, like a real galaxy.
    float radius = length(position.xz);
    float angle  = uTime * 0.25 / max(radius, 0.5);
    float s = sin(angle);
    float c = cos(angle);
    vec3 target = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c);

    // Each star arrives at a slightly different time (aRandom = delay)
    float t = clamp((uAssemble - aRandom * 0.35) / 0.65, 0.0, 1.0);
    float ease = 1.0 - pow(1.0 - t, 3.0);
    vec3 pos = mix(aStart, target, ease);

    // To world space, then the mouse pushes nearby stars away
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vec2 away = world.xy - uPointer.xy;
    float dist = length(away);
    world.xy += normalize(away + 0.0001) * smoothstep(2.0, 0.0, dist) * 0.9;

    vec4 viewPos = viewMatrix * world;
    gl_Position = projectionMatrix * viewPos;

    // Size: bigger when close to the camera, with a gentle twinkle
    float twinkle = 0.65 + 0.35 * sin(uTime * 3.0 + aRandom * 60.0);
    gl_PointSize = aSize * uPixelRatio * twinkle * (30.0 / -viewPos.z);

    // Colour: cyan near the centre, purple at the edge
    vColor = mix(uColorInner, uColorOuter, smoothstep(1.0, 5.0, radius));
    vAlpha = mix(0.35, 1.0, ease);
  }
`;

const galaxyFragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    // Soft round star with a bright centre
    float d = length(gl_PointCoord - 0.5);
    float glow = pow(smoothstep(0.5, 0.0, d), 1.6);
    float core = smoothstep(0.12, 0.0, d);
    // 0.7 keeps the arms bright but not blinding where many stars overlap
    vec3 color = (vColor * glow + vec3(1.0) * core * 0.5) * 0.7;
    gl_FragColor = vec4(color, glow * vAlpha);
  }
`;

function AstraGalaxy({ scrollProgress }: { scrollProgress: number }) {
  const ref = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const hit = useMemo(() => new THREE.Vector3(), []);
  const startTime = useRef<number | null>(null);

  // Build the stars once. Fewer stars on phones.
  const geometry = useMemo(() => {
    const count = typeof window !== 'undefined' && window.innerWidth < 768 ? 9000 : 18000;
    const arms = 3;
    const target = new Float32Array(count * 3);
    const start = new Float32Array(count * 3);
    const rand = new Float32Array(count);
    const size = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spiral arm position: further out = more twist, plus some scatter
      const r = 1.1 + Math.pow(Math.random(), 1.4) * 4.2;
      const arm = (i % arms) * ((Math.PI * 2) / arms);
      const spin = r * 1.1;
      const scatter = 0.35 * (r / 5.3);
      target[i * 3 + 0] = Math.cos(arm + spin) * r + (Math.random() - 0.5) * scatter * 2;
      target[i * 3 + 1] = (Math.random() - 0.5) * 0.18;
      target[i * 3 + 2] = Math.sin(arm + spin) * r + (Math.random() - 0.5) * scatter * 2;

      // Start: random point inside a big sphere
      const u = Math.random() * Math.PI * 2;
      const v = Math.acos(2 * Math.random() - 1);
      const sr = 6 + Math.random() * 10;
      start[i * 3 + 0] = Math.sin(v) * Math.cos(u) * sr;
      start[i * 3 + 1] = Math.sin(v) * Math.sin(u) * sr;
      start[i * 3 + 2] = Math.cos(v) * sr;

      rand[i] = Math.random();
      size[i] = 0.6 + Math.random() * 1.6;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(target, 3));
    g.setAttribute('aStart', new THREE.BufferAttribute(start, 3));
    g.setAttribute('aRandom', new THREE.BufferAttribute(rand, 1));
    g.setAttribute('aSize', new THREE.BufferAttribute(size, 1));
    return g;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAssemble: { value: 0 },
    uPointer: { value: new THREE.Vector3(100, 100, 0) },
    uPixelRatio: { value: 1 },
    uColorInner: { value: new THREE.Color('#00f0ff') },
    uColorOuter: { value: new THREE.Color('#7000df') },
  }), []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const m = materialRef.current;
    if (!m || !ref.current) return;
    const t = state.clock.getElapsedTime();
    if (startTime.current === null) startTime.current = t;

    m.uniforms.uTime.value = t;
    m.uniforms.uPixelRatio.value = state.viewport.dpr;
    // Galaxy forms over ~3 seconds after load
    m.uniforms.uAssemble.value = Math.min((t - startTime.current) / 3, 1);

    // Mouse -> point on the z = 0 plane
    state.raycaster.setFromCamera(state.pointer, state.camera);
    if (state.raycaster.ray.intersectPlane(plane, hit)) {
      m.uniforms.uPointer.value.lerp(hit, 0.15);
    }

    // Black hole at the end of the page: stretch the galaxy into a tunnel
    const k = 1 - Math.pow(0.9, delta * 60);
    if (scrollProgress > 0.8) {
      ref.current.scale.lerp(new THREE.Vector3(0.5, 20, 0.5), k);
    } else {
      ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), k);
    }
  });

  return (
    // Tilted so the spiral reads as a disk around the core
    <points ref={ref} geometry={geometry} rotation={[1.15, 0, 0.35]} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={galaxyVertexShader}
        fragmentShader={galaxyFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// --- 2. BLACK HOLE CORE ---
// The centre of the galaxy: a black event horizon, a glowing halo around it,
// and a spinning accretion disk that sits in the same plane as the galaxy.

const haloVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const haloFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uHorizon;   // event horizon radius, as a fraction of the plane's half size
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;   // 0 at centre, 1 at the plane edge
    if (d < uHorizon) discard;           // the black sphere shows through here

    // Thin, very bright photon ring right at the horizon
    float ring = exp(-pow((d - uHorizon - 0.015) * 40.0, 2.0));
    // Soft glow that fades smoothly to nothing (no hard edge)
    float glow = pow(1.0 - smoothstep(uHorizon, 1.0, d), 3.0);
    float pulse = 0.9 + 0.1 * sin(uTime * 1.5);

    vec3 color = mix(vec3(0.44, 0.0, 0.87), vec3(0.0, 0.94, 1.0), glow);
    color = color * glow * 0.9 + vec3(0.85, 1.0, 1.0) * ring * 1.2;
    gl_FragColor = vec4(color * pulse, 1.0);
  }
`;

const diskVertexShader = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;   // ring lies in its local xy plane
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  varying vec2 vPos;
  void main() {
    float r = length(vPos);
    float angle = atan(vPos.y, vPos.x);
    float t = (r - uInner) / (uOuter - uInner);          // 0 at inner edge, 1 at outer edge

    // Bright hot inner edge, fading out
    float falloff = pow(1.0 - clamp(t, 0.0, 1.0), 2.2) * smoothstep(0.0, 0.04, t);
    // Swirling streaks: inner part spins faster
    float streaks = 0.6 + 0.4 * sin(angle * 6.0 + log(r) * 14.0 - uTime * (3.0 - t * 2.0));
    // Hot white-cyan near the hole, purple further out
    vec3 color = mix(vec3(0.85, 1.0, 1.0), vec3(0.0, 0.94, 1.0), smoothstep(0.0, 0.25, t));
    color = mix(color, vec3(0.44, 0.0, 0.87), smoothstep(0.3, 1.0, t));

    float a = falloff * streaks;
    gl_FragColor = vec4(color * a * 1.3, a);
  }
`;

function BlackHoleCore({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const diskRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloUniforms = useMemo(() => ({ uTime: { value: 0 }, uHorizon: { value: 0.55 / 1.6 } }), []);
  const diskUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uInner: { value: 0.62 },
    uOuter: { value: 1.6 },
  }), []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    haloUniforms.uTime.value = t;
    diskUniforms.uTime.value = t;

    // The halo is a flat glow, so it always turns to face the camera
    if (haloRef.current) haloRef.current.quaternion.copy(state.camera.quaternion);

    if (!groupRef.current) return;
    // Gentle tilt towards the mouse
    const { x, y } = state.pointer;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -y * 0.35, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * 0.35, 0.05);

    // End of the page: the black hole grows and swallows the screen
    const target = scrollProgress > 0.9 ? 1 + (scrollProgress - 0.9) * 20 : 1;
    const k = 1 - Math.pow(0.9, delta * 60);
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(groupRef.current.scale.x, target, k));
  });

  return (
    <group ref={groupRef}>
      {/* Event horizon: pure black, hides the stars behind it */}
      <mesh>
        <sphereGeometry args={[0.55, 64, 64]} />
        <meshBasicMaterial color="#000000" />
      </mesh>

      {/* Glowing halo + photon ring (camera-facing plane, 3.2 units wide) */}
      <mesh ref={haloRef}>
        <planeGeometry args={[3.2, 3.2]} />
        <shaderMaterial
          vertexShader={haloVertexShader}
          fragmentShader={haloFragmentShader}
          uniforms={haloUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Accretion disk, same tilt as the galaxy (galaxy plane is xz, ring is xy) */}
      <group rotation={[1.15, 0, 0.35]}>
        <mesh ref={diskRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.62, 1.6, 128, 1]} />
          <shaderMaterial
            vertexShader={diskVertexShader}
            fragmentShader={diskFragmentShader}
            uniforms={diskUniforms}
            transparent
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

// --- 2b. SPACE REFLECTIONS ---
// A soft cyan / purple gradient (drawn on a canvas) that the chrome core reflects.
// No photo, no extra file to download.
function SpaceEnvironment() {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Base: cyan sky, deep navy middle, purple floor
    const base = ctx.createLinearGradient(0, 0, 0, 512);
    base.addColorStop(0.0, '#00f0ff');
    base.addColorStop(0.3, '#0b2a6b');
    base.addColorStop(0.5, '#05040d');
    base.addColorStop(0.7, '#3b0a7a');
    base.addColorStop(1.0, '#a855f7');
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 1024, 512);

    // Soft white bands: the liquid chrome highlights
    const band = (y: number, h: number, alpha: number) => {
      const g = ctx.createLinearGradient(0, y - h, 0, y + h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - h, 1024, h * 2);
    };
    band(150, 18, 0.9);
    band(205, 8, 0.6);
    band(330, 10, 0.4);

    // Colour glows on the sides
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x: number, y: number, r: number, color: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 1024, 512);
    };
    glow(256, 260, 220, 'rgba(112,0,223,0.8)');
    glow(768, 240, 200, 'rgba(0,240,255,0.5)');

    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    setTexture(tex);
    return () => tex.dispose();
  }, []);

  return texture ? <Environment map={texture} /> : null;
}

// --- 3. CAMERA RIG ---
function CameraRig({ startJourney, hasArrived, onArrival, setScrollProgress }: { startJourney: boolean, hasArrived: boolean, onArrival: () => void, setScrollProgress: (v: number) => void }) {
    const { camera } = useThree();
    const vec = new THREE.Vector3();

    useFrame((state, delta) => {
        // Frame-rate independent smoothing (same feel as 0.04 per frame at 60fps)
        const k = 1 - Math.pow(1 - 0.04, Math.min(delta, 0.1) * 60);
        const scrollY = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const progress = Math.min(scrollY / (maxScroll || 1), 1);
        setScrollProgress(progress);

        if (!startJourney) {
            camera.position.lerp(vec.set(state.pointer.x, state.pointer.y, 40), 0.05);
            camera.lookAt(0, 0, 0);
        } else if (!hasArrived) {
            camera.position.z = THREE.MathUtils.lerp(camera.position.z, 5, k);
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, 0, k);
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 0, k);

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

// --- 4. AI ROBOT AVATAR ---
function AIAvatar({ isSpeaking }: { isSpeaking: boolean }) {
  const group = useRef<any>(null);
  const ringRef = useRef<any>(null);
  const eyesRef = useRef<any>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    // 1. Floating Animation
    if (group.current) {
      group.current.position.y = Math.sin(t * 1.5) * 0.15; 
      group.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    }

    // 2. Ring Rotation
    if (ringRef.current) {
      ringRef.current.rotation.x = t * 0.5;
      ringRef.current.rotation.y = t * 0.3;
    }

    // 3. Speaking Animation
    if (eyesRef.current) {
      if (isSpeaking) {
        const scale = 1 + Math.sin(t * 20) * 0.2;
        eyesRef.current.scale.set(scale, scale, scale);
        eyesRef.current.position.z = 0.35 + Math.sin(t * 20) * 0.02;
      } else {
        eyesRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        eyesRef.current.position.z = 0.35;
      }
    }
  });

return (
    <group ref={group} position={[0, -0.2, 3]} rotation={[0, 0, 0]}> 
      
      {/* --- HEAD --- */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.6, 64, 64]} /> 
        <meshPhysicalMaterial 
            color="#111" 
            metalness={0.9} 
            roughness={0.1} 
            clearcoat={1} 
            clearcoatRoughness={0.1}
        />
      </mesh>

      {/* --- GLOWING EYES --- */}
      <group ref={eyesRef} position={[0, 0.1, 0.35]}>
          <mesh position={[-0.15, 0, 0.15]} rotation={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} /> 
            <meshBasicMaterial color={isSpeaking ? "#00ff00" : "#00f0ff"} /> 
          </mesh>
          <mesh position={[0.15, 0, 0.15]} rotation={[0, 0.2, 0]}>
            <capsuleGeometry args={[0.08, 0.2, 4, 8]} />
            <meshBasicMaterial color={isSpeaking ? "#00ff00" : "#00f0ff"} />
          </mesh>
      </group>

      {/* --- HALO RINGS --- */}
      <group ref={ringRef}>
          <mesh rotation={[1.5, 0, 0]}>
            <torusGeometry args={[0.9, 0.02, 16, 100]} />
            <meshBasicMaterial color="cyan" transparent opacity={0.3} />
          </mesh>
          <mesh rotation={[0, 0, 1]}>
            <torusGeometry args={[0.75, 0.01, 16, 100]} />
            <meshBasicMaterial color="purple" transparent opacity={0.5} />
          </mesh>
      </group>

      {/* --- ANTENNA --- */}
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
  const [hasStarted] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // 👇 Projects දැන් එන්නේ කෙලින්ම file එකෙන්. Load වෙන්න වෙලා යන්නේ නෑ!
  const [projects, setProjects] = useState<any[]>(MY_PROJECTS);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [messages, setMessages] = useState<{sender: 'user' | 'bot', text: string}[]>([{ sender: 'bot', text: 'Hi! I am Ravindu\'s AI Assistant.' }]);
  const [inputMsg, setInputMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // AI Speaking State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // The page content sits on top of the 3D canvas, so the canvas never gets mouse
  // events. Listening on this root div lets the 3D scene see the mouse everywhere.
  const rootRef = useRef<HTMLDivElement>(null!);

  // Fallback: always show the content within 2.5s, even on slow devices or if WebGL fails
  useEffect(() => {
    const t = setTimeout(() => setHasArrived(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // NOTE: Server fetch එක අයින් කළා Projects වලට.
  // Chat එකට විතරක් backend එක පාවිච්චි වෙනවා.

  // --- CHAT MESSAGE FUNCTION (WITH VOICE) ---
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
        
        // Find a cool English voice if available
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
    <div ref={rootRef} className={`bg-black min-h-screen text-white selection:bg-cyan-500 selection:text-black font-sans overflow-x-hidden ${!hasArrived ? 'overflow-y-hidden h-screen' : ''}`}>
      
      {/* 3D SCENE */}
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 40], fov: 60 }} eventSource={rootRef} eventPrefix="client">
          <Suspense fallback={null}>
            <CameraRig startJourney={hasStarted} hasArrived={hasArrived} onArrival={() => setHasArrived(true)} setScrollProgress={setScrollProgress} />
            
            <Stars radius={50} count={6000} factor={4} fade speed={1 + scrollProgress * 10} />
            <Sparkles count={100} scale={scrollProgress > 0.8 ? [5,5,50] : [10,10,10]} size={6} speed={scrollProgress > 0.8 ? 5 : 0.4} opacity={0.8} color="#00f0ff" />
            
            <AstraGalaxy scrollProgress={scrollProgress} />
            <BlackHoleCore scrollProgress={scrollProgress} />
            
            {/* ROBOT AVATAR (Visible only when chat is open) */}
            {isChatOpen && <AIAvatar isSpeaking={isSpeaking} />}
            
            {/* Space-themed reflections for the chrome core: no photo, just light shapes in the site colours */}
            <SpaceEnvironment />
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} color="#00f0ff" />
          </Suspense>
        </Canvas>
      </div>

      {/* MAIN CONTENT */}
      <AnimatePresence>
        {hasArrived && (
            <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5 }} className="relative z-10">
                
                {/* HERO */}
                <section className="min-h-screen flex flex-col justify-center px-8 md:px-24 pt-20 pb-32">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.5 }} className="flex-1 z-20">
                            <p className="text-cyan-400 font-mono tracking-[0.3em] mb-4">/// 3D WEBGL DEVELOPER</p>
                            <h1 className="text-6xl md:text-9xl font-black leading-none mix-blend-overlay">
                            RAVINDU <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">LAKSHAN</span>
                            </h1>
                            <p className="mt-8 text-gray-300 md:text-gray-400 text-xl max-w-xl backdrop-blur-md bg-black/70 md:bg-white/5 p-6 rounded-xl border-l-4 border-cyan-500">
                            Interactive 3D web apps with <span className="text-white font-bold">Three.js</span> & <span className="text-white font-bold">React Three Fiber</span>:
                            <br/>product configurators, 3D visualization and WebGL experiences.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-4">
                                <a href="#work" className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-black font-black tracking-widest rounded-xl transition">VIEW MY WORK</a>
                                <a href="https://www.upwork.com/freelancers/~01031ae12d25d4eae5?mp_source=share" target="_blank" rel="noopener noreferrer" className="px-8 py-4 border border-white/20 hover:border-green-500 text-white font-bold tracking-widest rounded-xl transition">HIRE ME ON UPWORK</a>
                            </div>
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
                <section id="work" className="py-32 px-8 md:px-24 scroll-mt-8">
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