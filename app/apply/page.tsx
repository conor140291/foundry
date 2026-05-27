"use client";
export const dynamic = "force-dynamic";



import { useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface FormData {
  email: string;
  phone: string;
  fullName: string;
  age: string;
  location: string;
  socialHandle: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
}

interface UploadState {
  idPhotoPath: string | null;
  selfiePath: string | null;
  idPhotoName: string | null;
  selfiePhotoName: string | null;
  idUploading: boolean;
  selfieUploading: boolean;
  idError: string | null;
  selfieError: string | null;
}

const STEPS = [
  { id: "account",  title: "Create account",      subtitle: "We'll send you a magic link to sign in" },
  { id: "basics",   title: "Basic details",        subtitle: "Tell us who you are" },
  { id: "identity", title: "Verify your identity", subtitle: "Required before any capital is allocated" },
  { id: "think",    title: "How you think",        subtitle: "No right answers — we want your actual thinking" },
  { id: "operate",  title: "How you operate",      subtitle: "Show us your instincts and track record" },
  { id: "edge",     title: "Your edge",            subtitle: "The most important section" },
];

const EMPTY_FORM: FormData = {
  email: "", phone: "", fullName: "", age: "", location: "", socialHandle: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "",
};

export default function ApplyPage() {
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [uploads, setUploads] = useState<UploadState>({
    idPhotoPath: null, selfiePath: null, idPhotoName: null, selfiePhotoName: null,
    idUploading: false, selfieUploading: false, idError: null, selfieError: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const setField = useCallback((name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const sendMagicLink = async () => {
    if (!form.email) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/apply` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setMagicLinkSent(true);
  };

  const uploadFile = async (file: File, bucket: "operator-ids" | "play-receipts", type: "id" | "selfie") => {
    const isId = type === "id";
    setUploads(prev => ({ ...prev, [isId ? "idUploading" : "selfieUploading"]: true, [isId ? "idError" : "selfieError"]: null }));
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket, fileName: file.name, contentType: file.type }),
      });
      const { signedUrl, path, error: urlError } = await res.json();
      if (urlError) throw new Error(urlError);
      const uploadRes = await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!uploadRes.ok) throw new Error("Upload failed");
      setUploads(prev => ({
        ...prev,
        [isId ? "idPhotoPath" : "selfiePath"]: path,
        [isId ? "idPhotoName" : "selfiePhotoName"]: file.name,
        [isId ? "idUploading" : "selfieUploading"]: false,
      }));
    } catch (err: any) {
      setUploads(prev => ({ ...prev, [isId ? "idUploading" : "selfieUploading"]: false, [isId ? "idError" : "selfieError"]: err.message || "Upload failed." }));
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName, age: parseInt(form.age),
          location: form.location, socialHandle: form.socialHandle,
          email: form.email, phone: form.phone,
          q1: form.q1, q2: form.q2, q3: form.q3,
          q4: form.q4, q5: form.q5, q6: form.q6,
          idPhotoPath: uploads.idPhotoPath, selfiePath: uploads.selfiePath,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed");
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!form.email && magicLinkSent;
      case 1: return !!form.fullName && !!form.age && !!form.location && !!form.email && !!form.phone;
      case 2: return !!uploads.idPhotoPath && !!uploads.selfiePath;
      case 3: return !!form.q1 && !!form.q2;
      case 4: return !!form.q3 && !!form.q4;
      case 5: return !!form.q5 && !!form.q6;
      default: return true;
    }
  };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: "DM Sans, sans-serif", color: "#e2e0db" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontSize: 48, color: "#10b981", marginBottom: 32 }}>✓</div>
          <h1 style={{ fontSize: 36, fontWeight: 300, color: "#e2e0db", marginBottom: 16 }}>We've got it.</h1>
          <p style={{ color: "#666", lineHeight: 1.9, fontSize: 14 }}>We read every application ourselves. You'll hear from us within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e2e0db", fontFamily: "DM Sans, sans-serif", paddingTop: 80, paddingBottom: 80 }}>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(9,9,9,0.95)", borderBottom: "1px solid #1a1a1a", padding: "0 40px", height: 52, display: "flex", alignItems: "center" }}>
        <a href="/" style={{ textDecoration: "none", fontFamily: "monospace", fontSize: 15, fontWeight: 500, letterSpacing: "0.2em", color: "#e2e0db" }}>FOUNDRY</a>
      </nav>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 300, color: "#e2e0db", marginBottom: 8 }}>Think you can make money grow? Show us.</h1>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7 }}>We read every application ourselves. No CV needed.</p>
        </div>

        <div style={{ display: "flex", gap: 3, marginBottom: 40 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i < step ? "#10b981" : i === step ? "#555" : "#1e1e1e", borderRadius: 1 }} />
          ))}
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 8, fontFamily: "monospace" }}>{String(step + 1).padStart(2, "0")}/{String(STEPS.length).padStart(2, "0")} — {STEPS[step].subtitle}</div>
          <h2 style={{ fontSize: 26, fontWeight: 300, color: "#e2e0db" }}>{STEPS[step].title}</h2>
        </div>

        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>Email address</label>
              <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setField("email", e.target.value)} style={{ background: "#111", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2 }} />
              <p style={{ fontSize: 12, color: "#444", marginTop: 6 }}>We'll send a magic link to verify your email.</p>
            </div>
            {!magicLinkSent ? (
              <button disabled={!form.email || loading} onClick={sendMagicLink} style={{ background: "#e2e0db", color: "#090909", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, alignSelf: "flex-start", opacity: (!form.email || loading) ? 0.4 : 1 }}>
                {loading ? "Sending..." : "Send magic link →"}
              </button>
            ) : (
              <div style={{ background: "#111", border: "1px solid #1a3a1a", borderRadius: 2, padding: 20 }}>
                <div style={{ color: "#10b981", fontSize: 13, marginBottom: 8 }}>✓ Magic link sent</div>
                <div style={{ fontSize: 13, color: "#666" }}>Check your inbox at <strong style={{ color: "#888" }}>{form.email}</strong>. Click the link then come back here.</div>
              </div>
            )}
            {error && <p style={{ fontSize: 12, color: "#ef4444" }}>{error}</p>}
          </div>
        )}

        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {[
              { key: "fullName", label: "Full legal name", type: "text", placeholder: "As it appears on your ID" },
              { key: "email", label: "Email address", type: "email", placeholder: "your@email.com" },
              { key: "phone", label: "Phone number", type: "tel", placeholder: "+353 87 123 4567" },
              { key: "age", label: "Age", type: "number", placeholder: "24" },
              { key: "location", label: "Location", type: "text", placeholder: "City, Country" },
              { key: "socialHandle", label: "LinkedIn / X (optional)", type: "text", placeholder: "@handle or URL" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{f.label}</label>
                <input type={f.type} placeholder={f.placeholder} value={form[f.key as keyof FormData]} onChange={e => setField(f.key, e.target.value)} style={{ background: "#111", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2 }} />
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ background: "#111", border: "1px solid #1a3a1a", borderRadius: 2, padding: 20, fontSize: 13, color: "#888", lineHeight: 1.9 }}>
              We verify every operator before allocating capital. Your documents are stored securely and never shared.
            </div>
            {[
              { label: "Photo ID — passport or driving licence", icon: "🪪", type: "id" as const },
              { label: "Selfie holding your ID", icon: "🤳", type: "selfie" as const },
            ].map(u => (
              <div key={u.type}>
                <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{u.label}</label>
                <div
                  onClick={() => document.getElementById(`upload-${u.type}`)?.click()}
                  style={{ border: `1px dashed ${u.type === "id" ? (uploads.idPhotoPath ? "#10b981" : "#333") : (uploads.selfiePath ? "#10b981" : "#333")}`, padding: 28, textAlign: "center", cursor: "pointer", borderRadius: 2, background: (u.type === "id" ? uploads.idPhotoPath : uploads.selfiePath) ? "#0a1a12" : "#0e0e0e" }}
                >
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{(u.type === "id" ? uploads.idPhotoPath : uploads.selfiePath) ? "✓" : u.icon}</div>
                  <div style={{ fontSize: 13, color: (u.type === "id" ? uploads.idPhotoPath : uploads.selfiePath) ? "#10b981" : "#666" }}>
                    {(u.type === "id" ? uploads.idPhotoName : uploads.selfiePhotoName) || "Click to upload"}
                  </div>
                </div>
                <input id={`upload-${u.type}`} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0], "operator-ids", u.type); }} />
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { key: "q1", label: "You receive €500 today. How do you turn it into more within 7 days?", placeholder: "Be specific. Name the platforms, the products, the buyers..." },
              { key: "q2", label: "What inefficiency in the world do most people ignore?", placeholder: "Something you've noticed that others haven't..." },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{f.label}</label>
                <textarea rows={6} placeholder={f.placeholder} value={form[f.key as keyof FormData]} onChange={e => setField(f.key, e.target.value)} style={{ background: "#111", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2, resize: "vertical" }} />
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { key: "q3", label: "Tell us about a time you created value from almost nothing.", placeholder: "A deal, a side hustle, a fix. Anything real." },
              { key: "q4", label: "What kinds of opportunities are you naturally best at spotting?", placeholder: "Arbitrage? Digital? Services? Be specific." },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{f.label}</label>
                <textarea rows={6} placeholder={f.placeholder} value={form[f.key as keyof FormData]} onChange={e => setField(f.key, e.target.value)} style={{ background: "#111", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2, resize: "vertical" }} />
              </div>
            ))}
          </div>
        )}

        {step === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {[
              { key: "q5", label: "If we allocated you €10,000 tomorrow, how would you deploy it?", placeholder: "Be concrete. What's the exact play?" },
              { key: "q6", label: "What's your unfair advantage?", placeholder: "What do you have that others don't?" },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" }}>{f.label}</label>
                <textarea rows={6} placeholder={f.placeholder} value={form[f.key as keyof FormData]} onChange={e => setField(f.key, e.target.value)} style={{ background: "#111", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2, resize: "vertical" }} />
              </div>
            ))}
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 2, padding: 16, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
              By submitting you confirm all information is accurate and you agree to Foundry's operator terms including the principal return obligation.
            </div>
          </div>
        )}

        {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 24 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ background: "transparent", color: "#e2e0db", border: "1px solid #2a2a2a", padding: "12px 28px", fontSize: 13, cursor: "pointer", borderRadius: 2 }}>← Back</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button disabled={!canAdvance()} onClick={() => setStep(s => s + 1)} style={{ background: "#e2e0db", color: "#090909", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: !canAdvance() ? 0.4 : 1 }}>Continue →</button>
          ) : (
            <button disabled={!canAdvance() || loading} onClick={submit} style={{ background: "#10b981", color: "#fff", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: (!canAdvance() || loading) ? 0.4 : 1 }}>{loading ? "Submitting..." : "Submit application"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
