import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { connectFacebook } from "../api/auth.api";
import { loadCapabilities } from "../store/capabilities.store";
import * as THREE from "three";
import { HiChartBar, HiChatBubbleLeftRight, HiUser } from "react-icons/hi2";

// Animated 3D Sphere
function AnimatedSphere() {
  const meshRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.sin(t / 4) / 8;
    meshRef.current.rotation.y = Math.sin(t / 2) / 4;
    meshRef.current.position.y = Math.sin(t / 1.5) / 10;
  });

  return (
    <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial
        color="#4267B2"
        attach="material"
        distort={0.5}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  );
}

// Floating particles
function Particles({ count = 100 }) {
  const mesh = useRef();
  const light = useRef();
  
  const particles = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    particles[i * 3] = (Math.random() - 0.5) * 10;
    particles[i * 3 + 1] = (Math.random() - 0.5) * 10;
    particles[i * 3 + 2] = (Math.random() - 0.5) * 10;
  }
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    mesh.current.rotation.x = t * 0.05;
    mesh.current.rotation.y = t * 0.075;
  });
  
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length / 3}
          array={particles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#8b9dc3"
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  );
}

// Network Lines
function NetworkLines() {
  const meshRef = useRef();
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.y = t * 0.1;
  });
  
  return (
    <group ref={meshRef}>
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh key={i} position={[
          Math.cos(i * 0.5) * 3,
          Math.sin(i * 0.3) * 2,
          Math.sin(i * 0.5) * 3
        ]}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#4267B2" emissive="#4267B2" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

export default function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    loadCapabilities()
      .then(caps => {
        if (caps.connected) {
          navigate("/dashboard");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Three.js Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          <AnimatedSphere />
          <Particles count={150} />
          <NetworkLines />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-16 px-8 max-w-7xl mx-auto">
          
          {/* Left Side - Hero Content */}
          <div className="flex-1 text-center lg:text-left animate-slide-up">
            <div className="backdrop-blur-md bg-white/10 p-12 rounded-3xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all duration-300">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-float">
                SocialMediaCRM
              </h1>
              <p className="text-2xl md:text-3xl text-gray-200 mb-8 font-light animate-fade-in">
                Manage Facebook like <span className="text-blue-400 font-semibold">NAFA</span>
              </p>
              <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto lg:mx-0 animate-fade-in">
                Streamline your social media management with powerful automation, 
                analytics, and engagement tools. Connect your Facebook account to get started.
              </p>
              
              <button 
                onClick={connectFacebook}
                className="group relative px-10 py-5 text-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-800 rounded-full shadow-lg hover:shadow-blue-500/50 transform hover:scale-105 transition-all duration-300 overflow-hidden animate-glow"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Connect Facebook
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>

              <div className="mt-10 flex items-center justify-center lg:justify-start gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Secure Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span>Real-time Sync</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Demo Image */}
          <div className="flex-1 max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="backdrop-blur-md bg-white/5 p-8 rounded-3xl shadow-2xl border border-white/20 transform hover:scale-105 transition-all duration-500">
              <div className="relative">
                {/* Demo Dashboard Preview */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 flex items-center gap-4 relative overflow-hidden">
                    {/* Animated background waves */}
                    <div 
                      className="absolute inset-0 opacity-20"
                      style={{
                        background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
                        animation: 'wave 3s ease-in-out infinite'
                      }}
                    ></div>
                    
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-pulse relative z-10">
                      <svg 
                        className="w-7 h-7 text-white" 
                        fill="currentColor" 
                        viewBox="0 0 24 24"
                        style={{
                          animation: 'iconRotate 10s linear infinite'
                        }}
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-white font-semibold text-lg">Dashboard Preview</h3>
                      <p className="text-blue-200 text-sm flex items-center gap-2">
                        <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Real-time Analytics
                      </p>
                    </div>
                    
                    <style jsx>{`
                      @keyframes wave {
                        0% {
                          transform: translateX(-100%) skewX(-15deg);
                        }
                        100% {
                          transform: translateX(100%) skewX(-15deg);
                        }
                      }
                      
                      @keyframes iconRotate {
                        0%, 90%, 100% {
                          transform: rotate(0deg);
                        }
                        95% {
                          transform: rotate(360deg);
                        }
                      }
                    `}</style>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: "2.5K", label: "Followers", color: "blue", gradient: "from-blue-500/20 to-blue-600/20", border: "border-blue-500/30" },
                        { value: "1.2K", label: "Engagement", color: "purple", gradient: "from-purple-500/20 to-purple-600/20", border: "border-purple-500/30" },
                        { value: "856", label: "Leads", color: "pink", gradient: "from-pink-500/20 to-pink-600/20", border: "border-pink-500/30" }
                      ].map((stat, i) => (
                        <div 
                          key={i}
                          className={`bg-gradient-to-br ${stat.gradient} p-4 rounded-xl border ${stat.border} hover:scale-105 transition-all duration-300 cursor-pointer group relative overflow-hidden`}
                          style={{
                            animation: `fadeInUp 0.6s ease-out ${i * 0.15}s backwards`
                          }}
                        >
                          {/* Animated background shine */}
                          <div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity"
                            style={{
                              animation: `slideShine 2s ease-in-out infinite`,
                              animationDelay: `${i * 0.5}s`
                            }}
                          ></div>
                          
                          <div 
                            className={`text-3xl font-bold text-${stat.color}-400 relative z-10`}
                            style={{
                              animation: `numberPulse 2s ease-in-out ${i * 0.3}s infinite`
                            }}
                          >
                            {stat.value}
                          </div>
                          <div className="text-xs text-gray-400 mt-1 relative z-10 group-hover:text-gray-300 transition-colors">
                            {stat.label}
                          </div>
                          
                          {/* Corner decoration */}
                          <div className={`absolute top-1 right-1 w-2 h-2 bg-${stat.color}-400 rounded-full animate-ping`}></div>
                        </div>
                      ))}
                    </div>

                    <style jsx>{`
                      @keyframes fadeInUp {
                        from {
                          transform: translateY(20px);
                          opacity: 0;
                        }
                        to {
                          transform: translateY(0);
                          opacity: 1;
                        }
                      }
                      
                      @keyframes slideShine {
                        0% {
                          transform: translateX(-100%);
                        }
                        100% {
                          transform: translateX(100%);
                        }
                      }
                      
                      @keyframes numberPulse {
                        0%, 100% {
                          transform: scale(1);
                        }
                        50% {
                          transform: scale(1.05);
                        }
                      }
                    `}</style>

                    {/* Graph Placeholder */}
                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                      <div className="flex items-end justify-between h-32 gap-2">
                        {[40, 70, 45, 80, 60, 90, 55].map((height, i) => (
                          <div 
                            key={i} 
                            className="flex-1 bg-gradient-to-t from-blue-600 via-purple-500 to-blue-400 rounded-t-lg opacity-75 hover:opacity-100 transition-all duration-300 relative overflow-hidden group cursor-pointer" 
                            style={{
                              height: `${height}%`,
                              animation: `barGrow 1.5s ease-out ${i * 0.1}s backwards, barPulse 3s ease-in-out ${i * 0.2}s infinite`
                            }}
                          >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" 
                              style={{
                                animation: `shine 2s ease-in-out infinite`,
                                animationDelay: `${i * 0.3}s`
                              }}
                            ></div>
                            {/* Tooltip on hover */}
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {height * 10} views
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-center text-gray-400 text-sm mt-4 flex items-center justify-center gap-2">
                        <span className="inline-block w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
                        Weekly Performance
                        <span className="inline-block w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></span>
                      </div>
                    </div>

                    <style jsx>{`
                      @keyframes barGrow {
                        from {
                          height: 0%;
                          opacity: 0;
                        }
                        to {
                          height: var(--bar-height);
                          opacity: 0.75;
                        }
                      }
                      
                      @keyframes barPulse {
                        0%, 100% {
                          transform: scaleY(1);
                          opacity: 0.75;
                        }
                        50% {
                          transform: scaleY(1.05);
                          opacity: 0.9;
                        }
                      }
                      
                      @keyframes shine {
                        0% {
                          transform: translateY(100%);
                        }
                        100% {
                          transform: translateY(-100%);
                        }
                      }
                    `}</style>

                    {/* Recent Activity */}
                    <div className="space-y-2">
                      {[
                        { icon: HiChartBar, text: "New post published", time: "2m ago", color: "blue", bgColor: "bg-blue-500/20" },
                        { icon: HiChatBubbleLeftRight, text: "5 new comments", time: "15m ago", color: "purple", bgColor: "bg-purple-500/20" },
                        { icon: HiUser, text: "New lead captured", time: "1h ago", color: "pink", bgColor: "bg-pink-500/20" }
                      ].map((activity, i) => {
                        const IconComponent = activity.icon;
                        return (
                          <div 
                            key={i} 
                            className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 group cursor-pointer"
                            style={{
                              animation: `slideInRight 0.5s ease-out ${i * 0.1 + 0.5}s backwards`
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className={`${activity.bgColor} p-2 rounded-lg transform group-hover:scale-110 transition-transform duration-300`}
                                style={{
                                  animation: `iconBounce 2s ease-in-out ${i * 0.5}s infinite`
                                }}
                              >
                                <IconComponent className={`w-5 h-5 text-${activity.color}-400`} />
                              </div>
                              <span className="text-gray-300 text-sm group-hover:text-white transition-colors">
                                {activity.text}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 bg-${activity.color}-400 rounded-full animate-pulse`}></span>
                              <span className="text-gray-500 text-xs group-hover:text-gray-400 transition-colors">
                                {activity.time}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <style jsx>{`
                      @keyframes slideInRight {
                        from {
                          transform: translateX(-30px);
                          opacity: 0;
                        }
                        to {
                          transform: translateX(0);
                          opacity: 1;
                        }
                      }
                      
                      @keyframes iconBounce {
                        0%, 100% {
                          transform: translateY(0) rotate(0deg);
                        }
                        25% {
                          transform: translateY(-5px) rotate(-5deg);
                        }
                        75% {
                          transform: translateY(-3px) rotate(5deg);
                        }
                      }
                    `}</style>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-bounce">
                  Live
                </div>
                <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                  ⚡ Fast Setup
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 to-transparent pointer-events-none"></div>
    </div>
  );
}
