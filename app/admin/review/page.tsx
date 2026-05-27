"use client";

/**
 * FILE: app/admin/review/page.tsx
 *
 * AI Application Reviewer
 * Paste in application answers and get an instant AI assessment
 * Uses Claude via the Anthropic API
 */

import { useState } from "react";

interface ApplicationData {
  name: string;
  age: string;
  location: string;
  q1: string; // €500 plan
  q2: string; // inefficiency
  q3: string; // value story
  q4: string; // best at
  q5: string; // €10k plan
  q6: string; // edge
}

interface Assessment {
  score: number;
  recommendation: "approve" | "reject" | "maybe";
  summary: string;
  strengths: string[];
  concerns: string[];
  q_scores: { question: string; score: number; comment: string }[];
  suggested_allocation: string;
  suggested_play: string;
}

const EMPTY: ApplicationData = {
  name: "", age: "", location: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "",
};

const s = {
  page: { minHeight: "100vh", background: "#090909", color: "#e2e0db", fontFamily: "'DM Sans', sans-serif", padding: 32 },
  card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 2, padding: 20, marginBottom: 8 },
  label: { fontSize: 11, letterSpacing: "0.12em", color: "#555", textTransform: "uppercase" as const, display: "block", marginBottom: 6 },
  input: { background: "#0e0e0e", border: "1px solid #222", color: "#e2e0db", padding: "10px 14px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", borderRadius: 2, width: "100%", resize: "vertical" as const },
  btnGreen: { background: "#10b981", color: "#fff", border: "none", padding: "12px 28px", fontSize: 13, fontWeight: 600 as const, cursor: "pointer", borderRadius: 2 },
  btnGhost: { background: "transparent", color: "#e2e0db", border: "1px solid #2a2a2a", padding: "10px 20px", fontSize: 12, cursor: "pointer", borderRadius: 2 },
  tag: (color: string) => ({ fontSize: 11, padding: "4px 12px", border: `1px solid ${color}44`, color, borderRadius: 2, display: "inline-block" }),
};

function ScoreBar({ score, color = "#10b981" }: { score: number; color?: string }) {
  return (
    <div style={{ height: 4, background: "#1e1e1e", borderRadius: 2, marginTop: 6 }}>
      <div style={{ height: 4, width: `${score}%`, background: color, borderRadius: 2, transition: "width 1s ease" }} />
    </div>
  );
}

export default function ReviewPage() {
  const [form, setForm] = useState<ApplicationData>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState("");

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const analyse = async () => {
    setLoading(true);
    setError(null);
    setAssessment(null);
    setStreaming("");

    try {
      const prompt = `You are an expert evaluator for Foundry, a capital allocation platform that gives real money (starting at €500) to resourceful people to go and hustle with. You assess applicants based on their commercial instincts, creativity, execution ability, and trustworthiness.

Applicant details:
Name: ${form.name}
Age: ${form.age}
Location: ${form.location}

Application answers:

Q1 — "You receive €500 today. How do you turn it into more within 7 days?"
${form.q1}

Q2 — "What inefficiency in the world do most people ignore?"
${form.q2}

Q3 — "Tell us about a time you created value from almost nothing."
${form.q3}

Q4 — "What kinds of opportunities are you naturally best at spotting?"
${form.q4}

Q5 — "If we allocated you €10,000 tomorrow, how would you deploy it?"
${form.q5}

Q6 — "What's your unfair advantage?"
${form.q6}

Assess this applicant and respond ONLY with a JSON object in this exact format:
{
  "score": <overall score 0-100>,
  "recommendation": <"approve" | "reject" | "maybe">,
  "summary": "<2-3 sentence plain English summary of this applicant>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "concerns": ["<concern 1>", "<concern 2>"],
  "q_scores": [
    { "question": "€500 plan", "score": <0-100>, "comment": "<brief comment>" },
    { "question": "Inefficiency spotted", "score": <0-100>, "comment": "<brief comment>" },
    { "question": "Value story", "score": <0-100>, "comment": "<brief comment>" },
    { "question": "Opportunity spotting", "score": <0-100>, "comment": "<brief comment>" },
    { "question": "€10k deployment", "score": <0-100>, "comment": "<brief comment>" },
    { "question": "Unfair advantage", "score": <0-100>, "comment": "<brief comment>" }
  ],
  "suggested_allocation": "<€100 / €250 / €500 / reject>",
  "suggested_play": "<one specific play you'd suggest for this person based on their answers>"
}

Be honest and direct. High scores mean genuinely impressive thinking — specific, actionable, creative. Low scores mean vague, generic, or risky. Approve means you'd back them today. Maybe means worth a conversation. Reject means not ready.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text || "";

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse assessment");

      const parsed: Assessment = JSON.parse(jsonMatch[0]);
      setAssessment(parsed);
    } catch (err: any) {
      setError(err.message || "Assessment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const recColor = assessment?.recommendation === "approve" ? "#10b981"
    : assessment?.recommendation === "maybe" ? "#f59e0b"
    : "#ef4444";

  const scoreColor = (score: number) =>
    score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div style={s.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: "0.2em", color: "#555", marginBottom: 4 }}>FOUNDRY</div>
          <h1 style={{ fontSize: 26, fontWeight: 300 }}>AI Application Review</h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>Paste in an applicant's answers and get an instant assessment.</p>
        </div>
        <a href="/admin" style={{ color: "#555", fontSize: 12, textDecoration: "none" }}>← Admin panel</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: assessment ? "1fr 1fr" : "1fr", gap: 16 }}>

        {/* Input form */}
        <div>
          <div style={s.card}>
            <div style={s.label}>Applicant details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
              {[
                { k: "name", label: "Name", ph: "Full name" },
                { k: "age", label: "Age", ph: "24" },
                { k: "location", label: "Location", ph: "Dublin" },
              ].map(f => (
                <div key={f.k}>
                  <label style={s.label}>{f.label}</label>
                  <input placeholder={f.ph} value={form[f.k as keyof ApplicationData]} onChange={e => set(f.k, e.target.value)} style={{ ...s.input, resize: undefined }} />
                </div>
              ))}
            </div>
          </div>

          {[
            { k: "q1", label: "Q1 — €500 in 7 days", ph: "Paste their answer..." },
            { k: "q2", label: "Q2 — Inefficiency most ignore", ph: "Paste their answer..." },
            { k: "q3", label: "Q3 — Created value from nothing", ph: "Paste their answer..." },
            { k: "q4", label: "Q4 — Best at spotting", ph: "Paste their answer..." },
            { k: "q5", label: "Q5 — €10k deployment", ph: "Paste their answer..." },
            { k: "q6", label: "Q6 — Unfair advantage", ph: "Paste their answer..." },
          ].map(f => (
            <div key={f.k} style={s.card}>
              <label style={s.label}>{f.label}</label>
              <textarea rows={4} placeholder={f.ph} value={form[f.k as keyof ApplicationData]} onChange={e => set(f.k, e.target.value)} style={s.input} />
            </div>
          ))}

          {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 16 }}>{error}</div>}

          <button
            style={{ ...s.btnGreen, width: "100%", padding: "14px", fontSize: 14, opacity: loading ? 0.6 : 1 }}
            disabled={loading || !form.q1 || !form.q6}
            onClick={analyse}
          >
            {loading ? "Analysing application..." : "Analyse with AI →"}
          </button>
        </div>

        {/* Assessment results */}
        {assessment && (
          <div>
            {/* Score + recommendation */}
            <div style={{ ...s.card, borderColor: recColor + "44" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={s.label}>Overall score</div>
                  <div style={{ fontFamily: "monospace", fontSize: 52, fontWeight: 500, color: scoreColor(assessment.score), lineHeight: 1 }}>
                    {assessment.score}
                  </div>
                  <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>out of 100</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={s.label}>Recommendation</div>
                  <span style={{ ...s.tag(recColor), fontSize: 14, padding: "8px 16px", fontWeight: 600 }}>
                    {assessment.recommendation.toUpperCase()}
                  </span>
                  <div style={{ marginTop: 12 }}>
                    <div style={s.label}>Suggested allocation</div>
                    <div style={{ fontFamily: "monospace", fontSize: 18, color: "#e2e0db" }}>{assessment.suggested_allocation}</div>
                  </div>
                </div>
              </div>
              <ScoreBar score={assessment.score} color={scoreColor(assessment.score)} />
            </div>

            {/* Summary */}
            <div style={s.card}>
              <div style={s.label}>Summary</div>
              <p style={{ fontSize: 14, color: "#888", lineHeight: 1.8 }}>{assessment.summary}</p>
            </div>

            {/* Suggested play */}
            <div style={{ ...s.card, borderColor: "#10b98144" }}>
              <div style={s.label}>Suggested first play</div>
              <p style={{ fontSize: 14, color: "#10b981", lineHeight: 1.8 }}>{assessment.suggested_play}</p>
            </div>

            {/* Strengths + concerns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div style={s.card}>
                <div style={s.label}>Strengths</div>
                {assessment.strengths.map((s2, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #1a1a1a", fontSize: 13, color: "#888" }}>
                    <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span> {s2}
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <div style={s.label}>Watch out for</div>
                {assessment.concerns.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, padding: "8px 0", borderBottom: "1px solid #1a1a1a", fontSize: 13, color: "#888" }}>
                    <span style={{ color: "#f59e0b", flexShrink: 0 }}>⚠</span> {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Per-question scores */}
            <div style={s.card}>
              <div style={s.label}>Question breakdown</div>
              {assessment.q_scores.map((q, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#888" }}>{q.question}</span>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: scoreColor(q.score) }}>{q.score}/100</span>
                  </div>
                  <ScoreBar score={q.score} color={scoreColor(q.score)} />
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{q.comment}</div>
                </div>
              ))}
            </div>

            <button style={{ ...s.btnGhost, width: "100%" }} onClick={() => { setAssessment(null); setForm(EMPTY); }}>
              Review another application
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
