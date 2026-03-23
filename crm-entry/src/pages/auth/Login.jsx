import { useState, useEffect, useRef } from "react";

import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";
import crmDiagram from "../../assets/nafa.png";

const pageBackdropStyle = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background: "linear-gradient(270deg, #f5f7fb, #dfe8fb, #eef2ff, #f5f7fb)",
  backgroundSize: "600% 600%",
  animation: "loginGradientShift 14s ease infinite",
  zIndex: 0,
};

const particleCanvasStyle = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  pointerEvents: "none",
  opacity: 0.95,
  zIndex: 1,
};

const glowOrbStyle = {
  position: "absolute",
  borderRadius: "999px",
  filter: "blur(70px)",
  pointerEvents: "none",
  zIndex: 0,
};

const shellStyle = {
  position: "relative",
  zIndex: 2,
  display: "flex",
  width: "fit-content",
  overflow: "hidden",
  minHeight: "unset",
  borderRadius: "26px",
  border: "1px solid rgba(255, 255, 255, 0.6)",
  background: "linear-gradient(135deg, rgba(255,255,255,0.24), rgba(226,236,255,0.17))",
  backdropFilter: "blur(28px)",
  WebkitBackdropFilter: "blur(28px)",
  boxShadow: "0 26px 70px rgba(71, 85, 105, 0.14), inset 0 1px 0 rgba(255,255,255,0.55)",
};

const loginPaneStyle = {
  position: "relative",
  width: "294px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "18px 20px",
  background: "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(236,244,255,0.18))",
  borderLeft: "1px solid rgba(255,255,255,0.24)",
};

const loginPaneGlowStyle = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  background:
    "radial-gradient(circle at top right, rgba(125, 211, 252, 0.16), transparent 34%)," +
    "radial-gradient(circle at bottom left, rgba(148, 163, 184, 0.12), transparent 38%)",
};

const formInputStyle =
  "mt-1.5 w-full rounded-[14px] border border-[rgba(191,208,242,0.8)] bg-[rgba(255,255,255,0.42)] px-4 py-[8px] text-[13px] font-medium text-[#111827] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-[10px] outline-none transition-all focus:border-[#8aaef8] focus:bg-[rgba(255,255,255,0.62)] focus:shadow-[0_0_0_4px_rgba(96,165,250,0.12)]";

const sparkleAnimation = `
  @keyframes loginGradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
`;

const Login = () => {
  const navigate = useNavigate();
  const { setSession, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const justLoggedIn = useRef(false);
  const particlesRef = useRef(null);

  useEffect(() => {
    const canvas = particlesRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    let animationFrameId = 0;
    let particles = [];

    const createParticles = (width, height) => Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.4 + 0.9,
      dx: (Math.random() - 0.5) * 0.28,
      dy: (Math.random() - 0.5) * 0.28,
      hue: Math.random() > 0.5 ? "99, 102, 241" : "59, 130, 246",
      alpha: Math.random() * 0.38 + 0.36,
    }));

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particles = createParticles(width, height);
    };

    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        context.beginPath();
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fillStyle = `rgba(${particle.hue}, ${particle.alpha})`;
        context.shadowBlur = 18;
        context.shadowColor = `rgba(${particle.hue}, 0.95)`;
        context.fill();

        particle.x += particle.dx;
        particle.y += particle.dy;

        if (particle.x < 0 || particle.x > canvas.width) particle.dx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.dy *= -1;
      });

      animationFrameId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Navigate AFTER React state has committed (isAuthenticated becomes true)
  useEffect(() => {
    if (justLoggedIn.current && isAuthenticated) {
      justLoggedIn.current = false;
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated && !justLoggedIn.current) {
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

      justLoggedIn.current = true;
      setSession(data.accessToken, { persist: rememberMe });
      // Navigation happens in the useEffect above once isAuthenticated is true
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div
        className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-4 py-6 font-['Manrope'] text-[14px]"
        style={{ position: "relative", overflow: "hidden" }}
      >
        <div style={pageBackdropStyle} aria-hidden="true" />
        <div aria-hidden="true" style={{ ...glowOrbStyle, top: "8%", left: "10%", width: 240, height: 240, background: "rgba(99, 102, 241, 0.16)" }} />
        <div aria-hidden="true" style={{ ...glowOrbStyle, right: "8%", top: "20%", width: 280, height: 280, background: "rgba(14, 165, 233, 0.14)" }} />
        <div aria-hidden="true" style={{ ...glowOrbStyle, left: "28%", bottom: "10%", width: 300, height: 300, background: "rgba(129, 140, 248, 0.14)" }} />
        <canvas ref={particlesRef} style={particleCanvasStyle} aria-hidden="true" />
        <div style={shellStyle}>
          <div
            className="relative flex w-[318px] flex-col justify-between overflow-hidden px-5 py-5 text-white"
            style={{
              background: "linear-gradient(160deg, rgba(20, 48, 97, 0.88), rgba(38, 93, 163, 0.72) 44%, rgba(126, 185, 242, 0.34))",
              borderRight: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
            }}
          >
            <div className="pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full bg-white/18 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-8 h-56 w-56 rounded-full bg-[rgba(96,165,250,0.26)] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_28%)]" />
            <div className="pointer-events-none absolute inset-y-0 left-[-18%] w-[62%] rotate-[18deg] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),transparent_24%,rgba(8,15,33,0.14))]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/36" />

          <div className="mt-3">
            <div className="mb-5 flex items-center gap-3">
              <img src={crmDiagram} alt="CRM diagram" className="h-11 w-11 rounded-[16px] bg-white/18 p-1.5 shadow-[0_10px_22px_rgba(15,23,42,0.18)]" />
              <div>
                <p className="text-[12px] font-semibold text-white/92">Customer Relationship Management</p>
                <p className="text-[11px] font-medium leading-relaxed text-white/78">Unified data, smarter decisions, faster follow-ups.</p>
              </div>
            </div>

            <div className="text-center">
              <h2
                className="bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(232,243,255,0.92))] bg-clip-text text-[1.7rem] font-semibold leading-[0.94] tracking-[-0.028em] text-transparent drop-shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
                style={{ fontFamily: "\"Cormorant Garamond\", serif" }}
              >
                A calmer way to manage
                <br />
                customers.
              </h2>
              <p className="mx-auto mt-2.5 max-w-[236px] text-[12px] font-medium leading-relaxed text-white/84">
                Everything stays connected, and progress feels effortless.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="rounded-[18px] border border-white/14 bg-[rgba(255,255,255,0.1)] px-3.5 py-2.5 text-[12px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[12px]">
              <div className="flex items-center justify-between text-white/85">
                <span className="font-semibold">Quick glance</span>
                <span className="text-[10.5px] uppercase tracking-wide text-white/74">Live</span>
              </div>
              <div className="mt-2 text-white/85">
                Sales · HR · Social
              </div>
              <div className="mt-1 text-[11px] text-white/72">All in one view</div>
            </div>
          </div>

          
        </div>

          <div style={loginPaneStyle}>
            <div style={loginPaneGlowStyle} aria-hidden="true" />
            <div className="relative z-[1] w-full max-w-[246px]">
            <p
              className="inline-block w-full bg-[linear-gradient(180deg,#172033,#31415f)] bg-clip-text pb-[0.14em] text-center text-[1.7rem] font-semibold leading-[1.12] tracking-[-0.028em] text-transparent"
              style={{ fontFamily: "\"Cormorant Garamond\", serif" }}
            >
              Login to CRM
            </p>
            <p className="mt-1 text-center text-[12px] font-medium leading-relaxed text-[#60708d]">Secure access inside a unified glass card.</p>

            {error && (
              <p className="mt-3 text-center text-[12px] font-medium text-rose-500">{error}</p>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
              noValidate
              className="mt-4 w-full"
            >
              <label className="block text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Email</label>
              <input
                type="text"
                value={email}
                autoComplete="username"
                onChange={(e) => setEmail(e.target.value)}
                className={formInputStyle}
                disabled={loading}
              />

              <label className="mt-4 block text-[13px] font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${formInputStyle} pr-11`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 mt-[1px] -translate-y-1/2 text-[#8b98b2] hover:text-[#5f6f8f]"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPwd ? (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 3 18 18" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.88 5.09A9.77 9.77 0 0 1 12 4.91c5 0 9.27 3.11 11 7.5a11.83 11.83 0 0 1-4.08 5.14M6.61 6.61A11.84 11.84 0 0 0 1 12.41c1.73 4.39 6 7.5 11 7.5a9.8 9.8 0 0 0 5.39-1.61" />
                    </svg>
                  ) : (
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7Z" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-[12px] font-medium text-[#6b7280]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3 w-3 accent-[#5969b4]"
                    disabled={loading}
                  />
                  Keep me logged in
                </label>
                <a href="/forgot-password" className="text-[12px] font-semibold text-[#6b7280] hover:text-[#4b5563]">
                  Forgot password?
                </a>
              </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-3.5 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#5065b8] via-[#6782d9] to-[#7ba6ee] py-[10px] text-[14px] font-semibold text-white shadow-[0_16px_28px_rgba(88,110,189,0.28)] transition-all hover:-translate-y-[1px] hover:shadow-[0_20px_34px_rgba(88,110,189,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            </form>

            <p className="mt-3 text-center text-[12px] font-semibold text-[#6b7280]">
              New to CRM?
              <a href="/register" className="ml-1 text-[#4f46e5] underline">
                Create Account
              </a>
            </p>
            </div>
          </div>
        </div>
      </div>
      <style>{sparkleAnimation}</style>
    </>
  );
};

export default Login;

