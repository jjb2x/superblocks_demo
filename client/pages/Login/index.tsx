import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Icon } from "@/components/ui/icon";
import nashvilleSkyline from "@/assets/nashville-skyline.jpg";

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [environment, setEnvironment] = useState("development");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setTimeout(() => {
        navigate("/app");
      }, 600);
    },
    [navigate]
  );

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            `url(${nashvilleSkyline})`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-800/80 to-amber-900/40" />

      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Gold accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600" />

          <div className="p-8">
            {/* Logo and branding */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <img
                  src="https://www.vanderbilthealth.com/img/vh_logo.png"
                  alt="Vanderbilt Health"
                  className="h-10"
                />
              </div>
              <div className="mt-3 space-y-1">
                <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                  Vanderbilt Health Bridge
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Enterprise Operations Platform
                </p>
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSignIn} className="space-y-4">
              {/* Organization */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-2.5 flex items-center gap-3">
                <Icon icon="building-2" className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Organization</p>
                  <p className="text-sm font-medium text-slate-700">Vanderbilt Health — VUMC Pharmacies</p>
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <Icon icon="user" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your network ID"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Icon icon="lock" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>

              {/* Environment Selector */}
              <div className="space-y-1.5">
                <label htmlFor="environment" className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Environment
                </label>
                <div className="relative">
                  <Icon icon="server" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    id="environment"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="development">Development</option>
                    <option value="test">Test</option>
                    <option value="production">Production</option>
                  </select>
                  <Icon icon="chevron-down" className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Icon icon="loader" className="w-4 h-4 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Icon icon="log-in" className="w-4 h-4" />
                    Sign In
                  </>
                )}
              </button>
            </form>

            {/* Help links */}
            <div className="mt-5 flex items-center justify-between text-[11px] text-slate-400">
              <span className="hover:text-amber-600 cursor-pointer transition-colors">Forgot password?</span>
              <span className="hover:text-amber-600 cursor-pointer transition-colors">Request access</span>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-8 py-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Icon icon="shield-check" className="w-3 h-3" />
              <span>Secured by Okta SSO + MFA</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Icon icon="lock" className="w-3 h-3" />
              <span>TLS 1.3 Encrypted</span>
            </div>
          </div>
        </div>

        {/* Below card disclaimer */}
        <div className="text-center mt-4">
          <p className="text-[10px] text-white/50">
            Demonstration Environment — Synthetic Data Only
          </p>
          <p className="text-[10px] text-white/40 mt-0.5">
            © 2025 Vanderbilt University Medical Center. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
