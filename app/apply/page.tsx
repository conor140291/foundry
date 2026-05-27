"use client";

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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #090909; color: #e2e0db; font-family: 'DM Sans', sans-serif; }
  .mono { font-family: 'DM Mono', monospace; }
  input, textarea { background: #0e0e0e; border: 1px solid #222; color: #e2e0db; padding: 12px 16px; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border-color 0.2s; border-radius: 2px; }
  input:focus, textarea:focus { border-color: #555; }
  input::placeholder, textarea::placeholder { color: #444; }
  textarea { resize: vertical; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 2px; transition: all 0.15s; }
  .btn-primary { background: #e2e0db; color: #090909; border: none; padding: 12px 28px; font-size: 13px; font-weight: 600; letter-spacing: 0.03em; }
  .btn-primary:hover:not(:disabled) { background: #fff; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-secondary { background: transparent; color: #e2e0db; border: 1px solid #2a2a2a; padding: 12px 28px; font-size: 13px; }
  .btn-secondary:hover { border-color: #555; }
  .btn-green { background: #10b981; color: #fff; border: none; padding: 12px 28px; font-size: 13px; font-weight: 600; }
  .btn-green:hover:not(:disabled) { background: #0d9e6e; }
  .btn-green:disabled { opacity: 0.4; cursor: not-allowed; }
  .label { font-size: 11px; letter-spacing: 0.12em; color: #555; text-transform: uppercase; display: block; margin-bottom: 8px; }
  .card { background: #111; border: 1px solid #1e1e1e; border-radius: 2px; }
  .error-msg { font-size: 12px; color: #ef4444; margin-top: 6px; }
  .upload-zone { border: 1px dashed #2a2a2a; padding: 28px; text-align: center; cursor: pointer; border-radius: 2px; transition: all 0.2s; }
  .upload-zone:hover { border-color: #444; }
  .upload-zone.success { border-color: #10b981; background: #0a1a12; }
  .upload-zone.uploading { border-color: #f59e0b; background: #0e0e08; }
`;

function Field({ label, name, value, onChange, type = "text", placeholder = "", rows, hint }: {
  label: string; name: string; value: string;
  onChange: (name: string, value: string) => void;
  type?: string; placeholder?: string; rows?: number; hint?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <label className="label" htmlFor={name}>{label}</label>
      {rows ? (
        <textarea id={name} rows={rows} placeholder={placeholder} value={value} onChange={e => onChange(name, e.target.value)} />
      ) : (
        <input id={name} type={type} placeholder={placeholder} value={value} onChange={e => onChange(name, e.target.value)} />
      )}
      {hint && <p style={{ fontSize: 12, color: "#444", marginTop: 6, lineHeight: 1.6 }}>{hint}</p>}
    </div>
  );
}

function UploadZone({ label, icon, uploaded, uploading, error, fileName, onFileSelect }: {
  label: string; icon: string; uploaded: boolean; uploading: boolean;
  error: string | null; fileName: string | null; onFileSelect: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const className = `upload-zone${uploaded ? " success" : uploading ? " uploading" : ""}`;
  return (
    <div>
      <label className="label">{label}</label>
      <div className={className} onClick={() => ref.current?.click()}>
        {uploading ? (
          <div><div style={{ fontSize: 20, marginBottom: 8 }}>⏳</div><div style={{ fontSize: 13, color: "#f59e0b" }}>Uploading securely...</div></div>
        ) : uploaded ? (
          <div><div style={{ fontSize: 20, marginBottom: 8 }}>✓</div><div style={{ fontSize: 13, color: "#10b981" }}>{fileName}</div><div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Click to replace</div></div>
        ) : (
          <div><div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div><div style={{ fontSize: 13, color: "#666" }}>{label}</div><div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>JPG or PNG · max 10MB</div></div>
        )}
      </div>
      {error && <p className="error-msg">{error}</p>}
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) onFileSelect(e.target.files[0]); }} />
    </div>
  );
}

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
      <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div className="mono" style={{ fontSize: 48, color: "#10b981", marginBottom: 32 }}>✓</div>
          <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: "-0.02em", color: "#e2e0db", marginBottom: 16 }}>We've got it.</h1>
          <p style={{ color: "#666", lineHeight: 1.9, fontSize: 14, marginBottom: 40 }}>
            We read every application ourselves. If we think you've got what it takes, you'll hear from us within 48 hours.
          </p>
          <div className="card" style={{ padding: 24, textAlign: "left" }}>
            <div className="label" style={{ marginBottom: 16 }}>What happens next</div>
            {["ID verification reviewed", "Application scored by team", "Decision within 48h", "Approved operators receive first allocation"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "11px 0", borderBottom: i < 3 ? "1px solid #1a1a1a" : "none", fontSize: 13, color: "#888", alignItems: "center" }}>
                <span className="mono" style={{ color: "#333", minWidth: 24, fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</span>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(9,9,9,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a", padding: "0 40px", height: 52, display: "flex", alignItems: "center" }}>
        <a href="/" style={{ textDecoration: "none" }}>
          <span className="mono" style={{ fontSize: 15, fontWeight: 500, letterSpacing: "0.2em", color: "#e2e0db" }}>FOUNDRY</span>
        </a>
      </nav>

      <div style={{ minHeight: "100vh", paddingTop: 100, paddingBottom: 80, display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 640, padding: "0 24px" }}>

          <div style={{ marginBottom: 48 }}>
            <div className="label" style={{ marginBottom: 12 }}>Application</div>
            <h1 style={{ fontSize: 38, fontWeight: 300, letterSpacing: "-0.02em", color: "#e2e0db", marginBottom: 8 }}>
              Think you can make money grow? Show us.
            </h1>
            <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7 }}>
              We read every single application ourselves. We're not looking for the smartest person. We're looking for someone who actually does things.
            </p>
          </div>

          {/* Progress bar */}
          <div style={{ display: "flex", gap: 3, marginBottom: 40 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ flex: 1, height: 2, background: i < step ? "#10b981" : i === step ? "#555" : "#1e1e1e", transition: "background 0.3s", borderRadius: 1 }} />
            ))}
          </div>

          {/* Step header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span className="mono" style={{ fontSize: 11, color: "#555" }}>{String(step + 1).padStart(2, "0")}/{String(STEPS.length).padStart(2, "0")}</span>
              <span style={{ fontSize: 11, color: "#333" }}>—</span>
              <span style={{ fontSize: 12, color: "#666" }}>{STEPS[step].subtitle}</span>
            </div>
            <h2 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.02em", color: "#e2e0db" }}>{STEPS[step].title}</h2>
          </div>

          {/* STEP 0 — Account */}
          {step === 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Field label="Email address" name="email" value={form.email} onChange={setField} type="email" placeholder="your@email.com" hint="We'll send a magic link to verify your email. No password needed." />
              {!magicLinkSent ? (
                <button className="btn-primary" style={{ alignSelf: "flex-start" }} disabled={!form.email || loading} onClick={sendMagicLink}>
                  {loading ? "Sending..." : "Send magic link →"}
                </button>
              ) : (
                <div className="card" style={{ padding: 20, borderColor: "#1a3a1a" }}>
                  <div style={{ color: "#10b981", fontSize: 13, marginBottom: 8 }}>✓ Magic link sent</div>
                  <div style={{ fontSize: 13, color: "#666", lineHeight: 1.7 }}>
                    Check your inbox at <strong style={{ color: "#888" }}>{form.email}</strong>. Click the link to verify, then return here to continue.
                  </div>
                  <button style={{ background: "none", border: "none", color: "#555", fontSize: 12, marginTop: 12, padding: 0, cursor: "pointer" }} onClick={() => { setMagicLinkSent(false); setForm(p => ({ ...p, email: "" })); }}>
                    Use a different email
                  </button>
                </div>
              )}
              {error && <p className="error-msg">{error}</p>}
            </div>
          )}

          {/* STEP 1 — Basics */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Field label="Full legal name" name="fullName" value={form.fullName} onChange={setField} placeholder="As it appears on your ID" />
              <Field label="Email address" name="email" value={form.email} onChange={setField} type="email" placeholder="your@email.com" />
              <Field label="Phone number" name="phone" value={form.phone} onChange={setField} type="tel" placeholder="+353 87 123 4567" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Field label="Age" name="age" value={form.age} onChange={setField} type="number" placeholder="24" />
                <Field label="Location" name="location" value={form.location} onChange={setField} placeholder="City, Country" />
              </div>
              <Field label="LinkedIn / X (optional)" name="socialHandle" value={form.socialHandle} onChange={setField} placeholder="@handle or URL" hint="Optional but helpful — gives us context on your background." />
            </div>
          )}

          {/* STEP 2 — Identity */}
          {step === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div className="card" style={{ padding: 20, borderColor: "#1a3a1a" }}>
                <div style={{ fontSize: 13, color: "#888", lineHeight: 1.9 }}>
                  We verify every operator before allocating capital. Your documents are stored in an encrypted private bucket and are never shared publicly or with third parties.
                </div>
              </div>
              <UploadZone label="Photo ID — passport or driving licence" icon="🪪" uploaded={!!uploads.idPhotoPath} uploading={uploads.idUploading} error={uploads.idError} fileName={uploads.idPhotoName} onFileSelect={file => uploadFile(file, "operator-ids", "id")} />
              <UploadZone label="Selfie holding your ID — face and ID must both be clearly visible" icon="🤳" uploaded={!!uploads.selfiePath} uploading={uploads.selfieUploading} error={uploads.selfieError} fileName={uploads.selfiePhotoName} onFileSelect={file => uploadFile(file, "operator-ids", "selfie")} />
            </div>
          )}

          {/* STEP 3 — Thinking */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Field label="You receive €500 today. How do you turn it into more within 7 days?" name="q1" value={form.q1} onChange={setField} rows={6} placeholder="Be specific. Name the platforms, the products, the buyers. Walk us through your actual plan..." />
              <Field label="What inefficiency in the world do most people ignore?" name="q2" value={form.q2} onChange={setField} rows={5} placeholder="Something you've noticed that others haven't — in markets, in local areas, in online platforms..." />
            </div>
          )}

          {/* STEP 4 — Operating */}
          {step === 4 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Field label="Tell us about a time you created value from almost nothing." name="q3" value={form.q3} onChange={setField} rows={6} placeholder="A deal, a side hustle, a fix, a trade. Anything real. Be specific about the numbers." />
              <Field label="What kinds of opportunities are you naturally best at spotting?" name="q4" value={form.q4} onChange={setField} rows={5} placeholder="Arbitrage? Digital services? Local markets? Specific platforms? Be honest about where your instincts are strongest." />
            </div>
          )}

          {/* STEP 5 — Edge */}
          {step === 5 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <Field label="If we allocated you €10,000 tomorrow, how would you deploy it?" name="q5" value={form.q5} onChange={setField} rows={6} placeholder="Be concrete. What's the exact play? What would you buy, where, from whom, and how would you exit?" />
              <Field label="What's your unfair advantage?" name="q6" value={form.q6} onChange={setField} rows={5} placeholder="Access to certain markets? An existing platform following? Specialist knowledge? A network? Be direct." hint="This is the question most people answer too vaguely. The best answers name something specific." />
              <div className="card" style={{ padding: 16, borderColor: "#222" }}>
                <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
                  By submitting, you confirm all information is accurate and you agree to Foundry's operator terms including the principal return obligation.
                </div>
              </div>
            </div>
          )}

          {error && <p className="error-msg" style={{ marginTop: 24 }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
            {step > 0 ? (
              <button className="btn-secondary" onClick={() => setStep(s => s - 1)}>← Back</button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" disabled={!canAdvance()} onClick={() => setStep(s => s + 1)}>Continue →</button>
            ) : (
              <button className="btn-green" disabled={!canAdvance() || loading} onClick={submit}>{loading ? "Submitting..." : "Submit application"}</button>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
