"use client";

import { useState } from "react";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
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

const STEPS = [
  { title: "Basic details",        subtitle: "Tell us who you are" },
  { title: "Verify your identity", subtitle: "Required before any capital is allocated" },
  { title: "How you think",        subtitle: "No right answers" },
  { title: "How you operate",      subtitle: "Show us your instincts" },
  { title: "Your edge",            subtitle: "The most important section" },
];

const EMPTY: FormData = {
  fullName: "", email: "", phone: "", age: "", location: "", socialHandle: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "",
};

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [idName, setIdName] = useState("");
  const [selfieName, setSelfieName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: parseInt(form.age) }),
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

  const canAdvance = () => {
    if (step === 0) return !!form.fullName && !!form.email && !!form.phone && !!form.age && !!form.location;
    if (step === 1) return idUploaded && selfieUploaded;
    if (step === 2) return !!form.q1 && !!form.q2;
    if (step === 3) return !!form.q3 && !!form.q4;
    if (step === 4) return !!form.q5 && !!form.q6;
    return true;
  };

  const inp = { background: "#111", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2, fontFamily: "DM Sans, sans-serif" } as React.CSSProperties;
  const lbl = { fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" as const };
  const ta = { ...inp, resize: "vertical" as const };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: "DM Sans, sans-serif", color: "#e2e0db" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontSize: 48, color: "#10b981", marginBottom: 24 }}>checkmark</div>
          <h1 style={{ fontSize: 32, fontWeight: 300, marginBottom: 16 }}>We have got it.</h1>
          <p style={{ color: "#666", lineHeight: 1.9, fontSize: 14 }}>We read every application ourselves. You will hear from us within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e2e0db", fontFamily: "DM Sans, sans-serif", paddingBottom: 80 }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(9,9,9,0.95)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 52, display: "flex", alignItems: "center" }}>
        <a href="/" style={{ textDecoration: "none", fontFamily: "monospace", fontSize: 15, fontWeight: 500, letterSpacing: "0.2em", color: "#e2e0db" }}>FOUNDRY</a>
      </nav>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 34, fontWeight: 300, color: "#e2e0db", marginBottom: 8 }}>Think you can make money grow? Show us.</h1>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7 }}>We read every application ourselves. No CV needed.</p>
        </div>
        <div style={{ display: "flex", gap: 3, marginBottom: 36 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i < step ? "#10b981" : i === step ? "#555" : "#1e1e1e", borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontFamily: "monospace" }}>{String(step + 1).padStart(2, "0")}/{String(STEPS.length).padStart(2, "0")} - {STEPS[step].subtitle}</div>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: "#e2e0db" }}>{STEPS[step].title}</h2>
        </div>
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { k: "fullName", label: "Full legal name", type: "text", ph: "As it appears on your ID" },
              { k: "email", label: "Email address", type: "email", ph: "your@email.com" },
              { k: "phone", label: "Phone number", type: "tel", ph: "+353 87 123 4567" },
              { k: "age", label: "Age", type: "number", ph: "24" },
              { k: "location", label: "Location", type: "text", ph: "City, Country" },
              { k: "socialHandle", label: "LinkedIn or X optional", type: "text", ph: "@handle or URL" },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={inp} />
              </div>
            ))}
          </div>
        )}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#111", border: "1px solid #1a3a1a", borderRadius: 2, padding: 18, fontSize: 13, color: "#888", lineHeight: 1.9 }}>
              We verify every operator before allocating capital. Your documents are stored securely and never shared.
            </div>
            {[
              { label: "Photo ID passport or driving licence", icon: "ID", uploaded: idUploaded, name: idName, idx: 0 },
              { label: "Selfie holding your ID face and ID clearly visible", icon: "SELFIE", uploaded: selfieUploaded, name: selfieName, idx: 1 },
            ].map((u) => (
              <div key={u.idx}>
                <label style={lbl}>{u.label}</label>
                <div onClick={() => document.getElementById("upload-" + u.idx)?.click()}
                  style={{ border: "1px dashed " + (u.uploaded ? "#10b981" : "#333"), padding: 28, textAlign: "center", cursor: "pointer", borderRadius: 2, background: u.uploaded ? "#0a1a12" : "#0e0e0e" }}>
                  <div style={{ fontSize: 13, color: u.uploaded ? "#10b981" : "#666" }}>{u.name || "Click to upload"}</div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>JPG or PNG max 10MB</div>
                </div>
                <input id={"upload-" + u.idx} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (u.idx === 0) { setIdUploaded(true); setIdName(file.name); }
                      else { setSelfieUploaded(true); setSelfieName(file.name); }
                    }
                  }} />
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              { k: "q1", label: "You receive 500 euro today. How do you turn it into more within 7 days?", ph: "Be specific. Name the platforms, the products, the buyers..." },
              { k: "q2", label: "What inefficiency in the world do most people ignore?", ph: "Something you have noticed that others have not..." },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <textarea rows={6} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={ta} />
              </div>
            ))}
          </div>
        )}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              { k: "q3", label: "Tell us about a time you created value from almost nothing.", ph: "A deal, a side hustle, a fix. Anything real." },
              { k: "q4", label: "What kinds of opportunities are you naturally best at spotting?", ph: "Arbitrage? Digital? Services? Be specific." },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <textarea rows={6} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={ta} />
              </div>
            ))}
          </div>
        )}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              { k: "q5", label: "If we allocated you 10000 euro tomorrow, how would you deploy it?", ph: "Be concrete. What is the exact play?" },
              { k: "q6", label: "What is your unfair advantage?", ph: "What do you have that others do not?" },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <textarea rows={6} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={ta} />
              </div>
            ))}
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 2, padding: 14, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
              By submitting you confirm all information is accurate and agree to Foundry operator terms.
            </div>
          </div>
        )}
        {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 20 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ background: "transparent", color: "#e2e0db", border: "1px solid #2a2a2a", padding: "12px 28px", fontSize: 13, cursor: "pointer", borderRadius: 2 }}>Back</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button disabled={!canAdvance()} onClick={() => setStep(s => s + 1)} style={{ background: "#e2e0db", color: "#090909", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: !canAdvance() ? 0.4 : 1 }}>Continue</button>
          ) : (
            <button disabled={!canAdvance() || loading} onClick={submit} style={{ background: "#10b981", color: "#fff", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: (!canAdvance() || loading) ? 0.4 : 1 }}>{loading ? "Submitting..." : "Submit application"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
DONEgit add .
git commit -m "simplified apply no magic link"
git push
cat > app/apply/v2/page.tsx << 'DONE'
"use client";

import { useState } from "react";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
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

const STEPS = [
  { title: "Basic details",        subtitle: "Tell us who you are" },
  { title: "Verify your identity", subtitle: "Required before any capital is allocated" },
  { title: "How you think",        subtitle: "No right answers" },
  { title: "How you operate",      subtitle: "Show us your instincts" },
  { title: "Your edge",            subtitle: "The most important section" },
];

const EMPTY: FormData = {
  fullName: "", email: "", phone: "", age: "", location: "", socialHandle: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "",
};

export default function ApplyPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [idUploaded, setIdUploaded] = useState(false);
  const [selfieUploaded, setSelfieUploaded] = useState(false);
  const [idName, setIdName] = useState("");
  const [selfieName, setSelfieName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: parseInt(form.age) }),
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

  const canAdvance = () => {
    if (step === 0) return !!form.fullName && !!form.email && !!form.phone && !!form.age && !!form.location;
    if (step === 1) return idUploaded && selfieUploaded;
    if (step === 2) return !!form.q1 && !!form.q2;
    if (step === 3) return !!form.q3 && !!form.q4;
    if (step === 4) return !!form.q5 && !!form.q6;
    return true;
  };

  const inp = { background: "#111", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2, fontFamily: "DM Sans, sans-serif" } as React.CSSProperties;
  const lbl = { fontSize: 11, color: "#555", display: "block", marginBottom: 8, letterSpacing: "0.1em", textTransform: "uppercase" as const };
  const ta = { ...inp, resize: "vertical" as const };

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center", padding: 40, fontFamily: "DM Sans, sans-serif", color: "#e2e0db" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <div style={{ fontSize: 48, color: "#10b981", marginBottom: 24 }}>checkmark</div>
          <h1 style={{ fontSize: 32, fontWeight: 300, marginBottom: 16 }}>We have got it.</h1>
          <p style={{ color: "#666", lineHeight: 1.9, fontSize: 14 }}>We read every application ourselves. You will hear from us within 48 hours.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e2e0db", fontFamily: "DM Sans, sans-serif", paddingBottom: 80 }}>
      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(9,9,9,0.95)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 52, display: "flex", alignItems: "center" }}>
        <a href="/" style={{ textDecoration: "none", fontFamily: "monospace", fontSize: 15, fontWeight: 500, letterSpacing: "0.2em", color: "#e2e0db" }}>FOUNDRY</a>
      </nav>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "48px 24px" }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 34, fontWeight: 300, color: "#e2e0db", marginBottom: 8 }}>Think you can make money grow? Show us.</h1>
          <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7 }}>We read every application ourselves. No CV needed.</p>
        </div>
        <div style={{ display: "flex", gap: 3, marginBottom: 36 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: i < step ? "#10b981" : i === step ? "#555" : "#1e1e1e", borderRadius: 1 }} />
          ))}
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 6, fontFamily: "monospace" }}>{String(step + 1).padStart(2, "0")}/{String(STEPS.length).padStart(2, "0")} - {STEPS[step].subtitle}</div>
          <h2 style={{ fontSize: 24, fontWeight: 300, color: "#e2e0db" }}>{STEPS[step].title}</h2>
        </div>
        {step === 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {[
              { k: "fullName", label: "Full legal name", type: "text", ph: "As it appears on your ID" },
              { k: "email", label: "Email address", type: "email", ph: "your@email.com" },
              { k: "phone", label: "Phone number", type: "tel", ph: "+353 87 123 4567" },
              { k: "age", label: "Age", type: "number", ph: "24" },
              { k: "location", label: "Location", type: "text", ph: "City, Country" },
              { k: "socialHandle", label: "LinkedIn or X optional", type: "text", ph: "@handle or URL" },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <input type={f.type} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={inp} />
              </div>
            ))}
          </div>
        )}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ background: "#111", border: "1px solid #1a3a1a", borderRadius: 2, padding: 18, fontSize: 13, color: "#888", lineHeight: 1.9 }}>
              We verify every operator before allocating capital. Your documents are stored securely and never shared.
            </div>
            {[
              { label: "Photo ID passport or driving licence", icon: "ID", uploaded: idUploaded, name: idName, idx: 0 },
              { label: "Selfie holding your ID face and ID clearly visible", icon: "SELFIE", uploaded: selfieUploaded, name: selfieName, idx: 1 },
            ].map((u) => (
              <div key={u.idx}>
                <label style={lbl}>{u.label}</label>
                <div onClick={() => document.getElementById("upload-" + u.idx)?.click()}
                  style={{ border: "1px dashed " + (u.uploaded ? "#10b981" : "#333"), padding: 28, textAlign: "center", cursor: "pointer", borderRadius: 2, background: u.uploaded ? "#0a1a12" : "#0e0e0e" }}>
                  <div style={{ fontSize: 13, color: u.uploaded ? "#10b981" : "#666" }}>{u.name || "Click to upload"}</div>
                  <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>JPG or PNG max 10MB</div>
                </div>
                <input id={"upload-" + u.idx} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (u.idx === 0) { setIdUploaded(true); setIdName(file.name); }
                      else { setSelfieUploaded(true); setSelfieName(file.name); }
                    }
                  }} />
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              { k: "q1", label: "You receive 500 euro today. How do you turn it into more within 7 days?", ph: "Be specific. Name the platforms, the products, the buyers..." },
              { k: "q2", label: "What inefficiency in the world do most people ignore?", ph: "Something you have noticed that others have not..." },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <textarea rows={6} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={ta} />
              </div>
            ))}
          </div>
        )}
        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              { k: "q3", label: "Tell us about a time you created value from almost nothing.", ph: "A deal, a side hustle, a fix. Anything real." },
              { k: "q4", label: "What kinds of opportunities are you naturally best at spotting?", ph: "Arbitrage? Digital? Services? Be specific." },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <textarea rows={6} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={ta} />
              </div>
            ))}
          </div>
        )}
        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {[
              { k: "q5", label: "If we allocated you 10000 euro tomorrow, how would you deploy it?", ph: "Be concrete. What is the exact play?" },
              { k: "q6", label: "What is your unfair advantage?", ph: "What do you have that others do not?" },
            ].map(f => (
              <div key={f.k}>
                <label style={lbl}>{f.label}</label>
                <textarea rows={6} placeholder={f.ph} value={form[f.k as keyof FormData]} onChange={e => set(f.k, e.target.value)} style={ta} />
              </div>
            ))}
            <div style={{ background: "#111", border: "1px solid #222", borderRadius: 2, padding: 14, fontSize: 12, color: "#555", lineHeight: 1.8 }}>
              By submitting you confirm all information is accurate and agree to Foundry operator terms.
            </div>
          </div>
        )}
        {error && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 20 }}>{error}</p>}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ background: "transparent", color: "#e2e0db", border: "1px solid #2a2a2a", padding: "12px 28px", fontSize: 13, cursor: "pointer", borderRadius: 2 }}>Back</button>
          ) : <div />}
          {step < STEPS.length - 1 ? (
            <button disabled={!canAdvance()} onClick={() => setStep(s => s + 1)} style={{ background: "#e2e0db", color: "#090909", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: !canAdvance() ? 0.4 : 1 }}>Continue</button>
          ) : (
            <button disabled={!canAdvance() || loading} onClick={submit} style={{ background: "#10b981", color: "#fff", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 2, opacity: (!canAdvance() || loading) ? 0.4 : 1 }}>{loading ? "Submitting..." : "Submit application"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
