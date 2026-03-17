import { useState } from "react";
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
      navigate("/", { replace: true });
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#6f6f6f] px-6 py-10 font-sans text-[16.5px]">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-md bg-white shadow-[0_25px_70px_rgba(0,0,0,0.25)]">
        <div className="flex w-1/2 flex-col items-center justify-center bg-[#A8BBAA] px-10 py-12 text-center">
          <img src={crmDiagram} alt="CRM diagram" className="mb-8 h-56 w-56" />
          <p className="text-xl font-semibold text-white">Customer Relationship Management</p>
          <p className="mt-3 text-lg font-medium text-white/90">
            Manage leads, sales pipelines, HR, and social engagement in one place
          </p>
        </div>

        <div className="flex w-1/2 flex-col items-center justify-center px-12 py-12">
          <h1 className="text-4xl font-bold text-[#555]">CRM System</h1>
          <p className="mt-5 text-lg font-medium text-[#777]">Welcome to CRM</p>

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
            <label className="block text-sm font-semibold uppercase tracking-wide text-[#888]">Users name or Email</label>
            <input
              type="text"
              value={email}
              autoComplete="username"
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full border-b border-[#e2e2e2] pb-2 text-lg font-medium text-[#555] outline-none"
              disabled={loading}
            />

            <label className="mt-6 block text-sm font-semibold uppercase tracking-wide text-[#888]">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border-b border-[#e2e2e2] pb-2 pr-8 text-lg font-medium text-[#555] outline-none"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-[#9a9a9a] hover:text-[#6f6f6f]"
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
              <a href="/forgot-password" className="text-sm font-semibold text-[#777] hover:text-[#555]">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-full bg-[#6b6b6b] py-3 text-lg font-semibold text-white shadow-[0_6px_16px_rgba(0,0,0,0.2)] transition-colors hover:bg-[#5d5d5d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-sm font-semibold text-[#888]">
            New to CRM?
            <a href="/register" className="ml-1 text-[#666] underline">
              Create Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
