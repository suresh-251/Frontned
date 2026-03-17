import { useState, useEffect, useRef } from "react";

import { Navigate, useNavigate } from "react-router-dom";
import { login } from "../../api/auth.api";
import { useAuth } from "../../auth/AuthContext";
import crmDiagram from "../../assets/nafa.png";

const Login = () => {
  const navigate = useNavigate();
  const { setSession, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const justLoggedIn = useRef(false);

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
      setSession(data.accessToken);
      // Navigation happens in the useEffect above once isAuthenticated is true
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3f4f6] px-6 py-10 font-['Manrope'] text-[16.5px]">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
        <div className="relative flex w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-[#32406d] via-[#3b4a7a] to-[#465689] px-10 py-12 text-white">
          <div className="pointer-events-none absolute -left-16 -top-24 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-64 w-64 rounded-full bg-[#a5b4fc]/25 blur-3xl" />

          <div>
            <div className="mb-8 flex items-center gap-4">
              <img src={crmDiagram} alt="CRM diagram" className="h-16 w-16 rounded-2xl bg-white/10 p-2" />
              <div>
                <p className="text-[13.5px] font-semibold text-white/90">Customer Relationship Management</p>
                <p className="text-[12.5px] text-white/70">Unified data, smarter decisions, faster follow-ups.</p>
              </div>
            </div>

            <h2 className="text-3xl font-semibold leading-tight text-center">
              A calmer way to manage customers.
            </h2>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-white/85 text-center">
              Everything stays connected, and progress feels effortless.
            </p>
          </div>

          <div className="mt-8">
            <div className="rounded-2xl bg-white/12 px-4 py-3 text-[13px]">
              <div className="flex items-center justify-between text-white/85">
                <span className="font-semibold">Quick glance</span>
                <span className="text-[11px] uppercase tracking-wide text-white/70">Live</span>
              </div>
              <div className="mt-2 text-white/85">
                Sales · HR · Social
              </div>
              <div className="mt-1 text-[11.5px] text-white/70">All in one view</div>
            </div>
          </div>

          
        </div>

        <div className="flex w-1/2 flex-col items-center justify-center px-12 py-12">
          <p className="text-3xl font-semibold text-\[#111827\]">Login to CRM</p>

          {error && (
            <p className="mt-4 text-base font-medium text-rose-500">{error}</p>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(e);
            }}
            noValidate
            className="mt-10 w-full max-w-xs"
          >
            <label className="block text-sm font-semibold uppercase tracking-wide text-[#6b7280]">Email</label>
            <input
              type="text"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full border-b border-[#e5e7eb] pb-2 text-lg font-medium text-[#111827] outline-none"
              disabled={loading}
            />

            <label className="mt-6 block text-sm font-semibold uppercase tracking-wide text-[#6b7280]">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full border-b border-[#e5e7eb] pb-2 pr-8 text-lg font-medium text-[#111827] outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                aria-label={showPwd ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 3 18 18" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.88 5.09A9.77 9.77 0 0 1 12 4.91c5 0 9.27 3.11 11 7.5a11.83 11.83 0 0 1-4.08 5.14M6.61 6.61A11.84 11.84 0 0 0 1 12.41c1.73 4.39 6 7.5 11 7.5a9.8 9.8 0 0 0 5.39-1.61" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.46 12C3.73 7.94 7.52 5 12 5s8.27 2.94 9.54 7c-1.27 4.06-5.06 7-9.54 7s-8.27-2.94-9.54-7Z" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  </svg>
                )}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-end">
              <a href="/forgot-password" className="text-sm font-semibold text-[#6b7280] hover:text-[#4b5563]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full cursor-pointer rounded-full bg-gradient-to-r from-[#4b5aa0] via-[#5969b4] to-[#6a7bc9] py-3 text-lg font-semibold text-white shadow-[0_12px_26px_rgba(75,90,160,0.32)] transition-colors hover:from-[#425199] hover:to-[#5a6dbd] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm font-semibold text-[#6b7280]">
            New to CRM?
            <a href="/register" className="ml-1 text-[#4f46e5] underline">
              Create Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;



