import { useState } from "react";
import { Building2, Lock, Mail, Eye, EyeOff, ShieldCheck, KeyRound, RefreshCw } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const startResendCooldown = () => {
    setResendCooldown(30);
    const iv = setInterval(() => {
      setResendCooldown(prev => { if (prev <= 1) { clearInterval(iv); return 0; } return prev - 1; });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json() as { email?: string; requiresOtp?: boolean; error?: string };
      if (!r.ok) { setError(data.error ?? "Invalid credentials"); return; }
      if (data.requiresOtp) { setStep("otp"); startResendCooldown(); }
      else { window.location.href = "/"; }
    } catch { setError("Network error. Please try again."); }
    finally { setIsLoading(false); }
  };

  const handleResend = async () => {
    setResendLoading(true); setOtpError("");
    try {
      await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });
      startResendCooldown();
    }
    finally { setResendLoading(false); }
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault(); setOtpError(""); setOtpLoading(true);
    try {
      const r = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: otp, email }),
      });
      const data = await r.json() as { email?: string; error?: string };
      if (!r.ok) { setOtpError(data.error ?? "Invalid code. Please try again."); return; }
      window.location.href = "/";
    } catch { setOtpError("Network error. Please try again."); }
    finally { setOtpLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0F3522] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 border border-white/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Heritage Bank</h1>
          <p className="text-white/60 text-sm mt-1 tracking-wide uppercase">South Carolina's Trusted Bank</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === "credentials" ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Member Sign In</h2>
                <p className="text-gray-500 text-sm mt-1">Access your account securely</p>
              </div>
              {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5" data-testid="error-login">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Enter your email" required autoComplete="email" data-testid="input-email"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38] focus:border-transparent transition-all placeholder:text-gray-400" />
                  </div>
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input id="password" type={showPassword ? "text" : "password"} value={password}
                      onChange={e => setPassword(e.target.value)} placeholder="Enter your password"
                      required autoComplete="current-password" data-testid="input-password"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A5C38] focus:border-transparent transition-all placeholder:text-gray-400" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} data-testid="button-sign-in"
                  className="w-full bg-[#1A5C38] hover:bg-[#155A2F] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>This is a private member portal. Unauthorized access is prohibited.</span>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-50 rounded-2xl mb-4">
                  <KeyRound className="w-7 h-7 text-[#1A5C38]" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Verify Your Identity</h2>
                <p className="text-gray-500 text-sm mt-1">
                  A 6-digit code was sent to <span className="font-medium text-gray-700">{email}</span>
                </p>
              </div>
              {otpError && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <p className="text-red-700 text-sm">{otpError}</p>
                </div>
              )}
              <form onSubmit={handleOtpVerify} className="space-y-4">
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1.5">Verification Code</label>
                  <input id="otp" type="text" inputMode="numeric" value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000" maxLength={6} autoFocus
                    className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A5C38] focus:border-transparent transition-all placeholder:text-gray-300" />
                </div>
                <button type="submit" disabled={otpLoading || otp.length < 6}
                  className="w-full bg-[#1A5C38] hover:bg-[#155A2F] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {otpLoading ? "Verifying..." : "Verify & Sign In"}
                </button>
              </form>
              <div className="mt-4 flex flex-col items-center gap-3">
                <button onClick={handleResend} disabled={resendLoading || resendCooldown > 0}
                  className="flex items-center gap-1.5 text-sm text-[#1A5C38] hover:underline disabled:opacity-50 disabled:no-underline">
                  <RefreshCw className="w-3.5 h-3.5" />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : resendLoading ? "Sending..." : "Resend code"}
                </button>
                <button onClick={() => { setStep("credentials"); setOtp(""); setOtpError(""); }} className="text-xs text-gray-400 hover:text-gray-600">
                  ← Back to sign in
                </button>
              </div>
              <div className="mt-6 pt-5 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Two-factor authentication helps protect your account from unauthorized access.</span>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-white/40 text-xs mt-6">
          Member FDIC &nbsp;|&nbsp; Equal Housing Lender &nbsp;|&nbsp; &copy; {new Date().getFullYear()} Heritage Bank
        </p>
      </div>
    </div>
  );
}
