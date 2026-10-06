"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IconEye, IconEyeOff } from "@/components/icons";
import { useRegisterMutation } from "@/lib/services/authApi";
import { setCredentials } from "@/lib/slices/authSlice";
import { useAppDispatch } from "@/lib/hooks";
import { ReleaseBadge } from "@/components/release";

const LOGO_URL = "https://res.cloudinary.com/drh4ma3hj/image/upload/v1779473509/SabiNote_Purple_SVG_tlzlqm.svg";

const STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River",
  "Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe","Imo","Jigawa","Kaduna","Kano",
  "Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo",
  "Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
];

function PasswordStrength({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const colors = ["#EF4444", "#F59E0B", "#059669", "#059669"];
  const labels = ["Weak", "Fair", "Good", "Strong"];

  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="h-0.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: n <= score ? colors[score - 1] : "var(--color-border)" }}
          />
        ))}
      </div>
      <p className="text-xs" style={{ color: score > 0 ? colors[score - 1] : "var(--color-text-muted)" }}>
        {labels[score - 1] ?? ""}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [showPass, setShowPass] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await register({ firstName, lastName, email, password, state: selectedState }).unwrap();
      dispatch(setCredentials({
        user: res.data.user,
        wallet: res.data.wallet,
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
      }));
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { data?: { message?: string } })?.data?.message ?? "Registration failed. Please try again.";
      setError(msg);
    }
  }

  const inputBase = { borderColor: "var(--color-border)" };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "oklch(40% 0.22 290)";
    e.target.style.boxShadow = "0 0 0 3px oklch(40% 0.22 290 / 0.1)";
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "var(--color-border)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(98.5% 0.002 290)" }}>

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[52%] p-14 relative overflow-hidden"
        style={{ background: "#0A0512" }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 25% 55%, oklch(40% 0.22 290 / 0.4) 0%, transparent 60%)" }} />

        <div className="relative flex items-center gap-2">
          <img src={LOGO_URL} alt="SabiNote" className="h-8 w-auto object-contain" />
          <span style={{ fontSize: "9px", color: "#6B7280", letterSpacing: "0.04em", lineHeight: 1, marginTop: "1px" }}>by Parakletus</span>
        </div>

        <div className="relative">
          <div className="rounded-2xl p-8 mb-8" style={{ background: "#140D2B", border: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="font-display font-bold text-white text-2xl mb-3 leading-tight" style={{ letterSpacing: "-0.02em" }}>
              Join 4,000+ Nigerian educators
            </p>
            <p className="text-white/60 text-sm leading-relaxed">
              Generate curriculum-aligned lesson notes in seconds. Reclaim your weekends. Teach better.
            </p>
          </div>
        </div>

        <div className="relative flex flex-wrap gap-2">
          {["Curriculum-aligned", "AI-powered", "Built for Nigeria"].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full text-xs font-medium text-white/50" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-start justify-center p-6 overflow-y-auto">
        <div className="w-full max-w-sm py-8">

          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img src={LOGO_URL} alt="SabiNote" className="h-7 w-auto object-contain" />
            <span style={{ fontSize: "9px", color: "#9CA3AF", letterSpacing: "0.04em" }}>by Parakletus</span>
          </div>

          <h1 className="font-display font-bold text-gray-900 mb-1" style={{ fontSize: "1.9rem", letterSpacing: "-0.03em" }}>
            Create your account.
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--color-text-muted)" }}>
            Already have one?{" "}
            <Link href="/auth/login" className="font-semibold" style={{ color: "oklch(40% 0.22 290)" }}>Log in →</Link>
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Amaka"
                  className="w-full px-3 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white transition-shadow"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Okonkwo"
                  className="w-full px-3 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white transition-shadow"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="amaka@school.edu.ng"
                className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white transition-shadow"
                style={inputBase} onFocus={onFocus} onBlur={onBlur} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} required placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white pr-11 transition-shadow"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                State <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select required value={selectedState} onChange={e => setSelectedState(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-gray-900 border outline-none bg-white appearance-none transition-shadow"
                  style={inputBase} onFocus={onFocus} onBlur={onBlur}>
                  <option value="">Select your state...</option>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                </div>
              </div>
              {selectedState && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: "#059669" }}>{selectedState} curriculum selected</p>
              )}
              <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>Your state determines your curriculum. Choose carefully.</p>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white disabled:opacity-60 mt-1"
              style={{ background: "oklch(40% 0.22 290)" }}>
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          </div>

          <button className="w-full py-3 rounded-xl border text-sm font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--color-border)" }}>
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs mt-6" style={{ color: "var(--color-text-muted)" }}>
            By signing up you agree to our{" "}
            <a href="#" className="underline underline-offset-2">Terms</a> and{" "}
            <a href="#" className="underline underline-offset-2">Privacy Policy</a>
          </p>

          <div className="mt-8 pt-4 border-t border-gray-200/60 flex items-center justify-center">
            <ReleaseBadge variant="light" className="text-[11px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
