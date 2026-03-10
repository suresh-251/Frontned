import { useState, useEffect, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { setSession, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const canvasRef = useRef(null);

  // Spider Web Animation (Theme.js style)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 80;
    const maxDistance = 150;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${1 - distance / maxDistance})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });
      
      connectParticles();
      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
  if (e) e.preventDefault();
  if (loading) return;

  setError(null);
  setLoading(true);

  try {
    const data = await login({
      email: email.trim(),
      password,
    });

    if (!data?.accessToken) {
      throw new Error("Invalid credentials");
    }

    setSession(data.accessToken);

    // Only navigate after successful login
    navigate("/", { replace: true });

  } catch (err) {
    setError("Invalid email or password");
    // DO NOT navigate
    // DO NOT reload
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 animate-gradient-shift"></div>
      
      {/* Spider Web Canvas Animation */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Animated Particles/Circles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -top-48 -left-48 animate-float"></div>
        <div className="absolute w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -bottom-48 -right-48 animate-float-delayed"></div>
        <div className="absolute w-64 h-64 bg-pink-500/20 rounded-full blur-2xl top-1/2 left-1/4 animate-pulse-slow"></div>
        <div className="absolute w-80 h-80 bg-indigo-500/20 rounded-full blur-2xl bottom-1/4 right-1/3 animate-pulse-slower"></div>
        
        {/* Additional Luxury Effects */}
        <div className="absolute w-72 h-72 bg-cyan-400/10 rounded-full blur-3xl top-1/4 right-1/4 animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-56 h-56 bg-violet-400/15 rounded-full blur-2xl bottom-1/3 left-1/3 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Shimmer Effect Lines */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-white to-transparent top-1/4 animate-shimmer"></div>
        <div className="absolute h-px w-full bg-gradient-to-r from-transparent via-white to-transparent top-2/3 animate-shimmer" style={{ animationDelay: '2s' }}></div>
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-white to-transparent left-1/4 animate-shimmer-vertical"></div>
        <div className="absolute w-px h-full bg-gradient-to-b from-transparent via-white to-transparent right-1/3 animate-shimmer-vertical" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slideUp">
        {/* Glow Effect Behind Card */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-3xl blur-2xl animate-pulse-slow"></div>
        
        <div className="relative bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Top Shine Effect */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
          
          {/* Header with Icon */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-white opacity-10"></div>
            {/* Animated Shine Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            
            <div className="relative">
              <div className="w-20 h-20 mx-auto mb-4 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-110 hover:rotate-3 transition-all duration-300 border border-white/50">
                <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Welcome Back!</h2>
              <p className="text-blue-100 drop-shadow-md">Sign in to access your CRM dashboard</p>
            </div>
          </div>

          {/* Form Container */}
          <div className="p-8 bg-gradient-to-b from-white/95 to-white/90 backdrop-blur-xl">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 animate-shake">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="text-sm font-semibold text-red-800">Login Failed</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form
  onSubmit={(e) => {
    e.preventDefault();
    handleSubmit(e);
  }}
  noValidate
  className="space-y-5"
>
              {/* Email Input */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    autoComplete="username"
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-3 text-2xl hover:scale-110 transition-transform duration-200"
                    tabIndex={-1}
                  >
                    {showPwd ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 overflow-hidden group"
              >
                {/* Shimmer Effect on Button */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account? 
                <a href="/register" className="ml-1 font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  Sign up
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Version Badge */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secured by CRM v2.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;



