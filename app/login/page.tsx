"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard` },
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#090909", display: "flex",
      alignItems: "center", justifyContent: "center", padding: 24,
      fontFamily: "'DM Sans', 'Inter', sans-serif", color: "#e2e0db",
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ fontFamily: "monospace", fontSize: 15, fontWeight: 500, letterSpacing: "0.2em", marginBottom: 40 }}>
          FOUNDRY
        </div>

        {sent ? (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 300, marginBottom: 16 }}>Check your inbox</h2>
            <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, marginBottom: 24 }}>
              We sent a magic link to <strong style={{ color: "#888" }}>{email}</strong>.
              Click it to sign in.
            </p>
            <button
              style={{ background: "none", border: "none", color: "#555", fontSize: 12, padding: 0, cursor: "pointer" }}
              onClick={() => { setSent(false); setEmail(""); }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 300, marginBottom: 8 }}>Sign in</h2>
            <p style={{ fontSize: 14, color: "#555", marginBottom: 32 }}>
              Enter your email and we'll send a magic link.
            </p>
            <label style={{ fontSize: 11, letterSpacing: "0.12em", color: "#555", textTransform: "uppercase", display: "block", marginBottom: 8 }}>
              Email address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              style={{ background: "#0e0e0e", border: "1px solid #222", color: "#e2e0db", padding: "12px 16px", fontSize: 14, width: "100%", outline: "none", borderRadius: 2, marginBottom: 16 }}
            />
            {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 12 }}>{error}</p>}
            <button
              disabled={!email || loading}
              onClick={send}
              style={{
                width: "100%", background: "#e2e0db", color: "#090909",
                border: "none", padding: "12px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", borderRadius: 2, opacity: (!email || loading) ? 0.4 : 1,
              }}
            >
              {loading ? "Sending..." : "Send magic link →"}
            </button>
            <div style={{ marginTop: 24, fontSize: 12, color: "#444", textAlign: "center" }}>
              Don't have an account?{" "}
              <a href="/apply" style={{ color: "#10b981" }}>Apply for Foundry</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}