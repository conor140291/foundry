"use client";

/**
 * FILE: app/dashboard/page.tsx
 *
 * Operator dashboard — pulls real data from Supabase.
 * Features:
 * - Live stats (allocation, ROI, reliability, Foundry Score)
 * - Tier progress bar
 * - Play log with WhatsApp-style chat (realtime via Supabase)
 * - New play submission form
 * - Receipt upload per message
 *
 * Dependencies: @supabase/supabase-js, @supabase/ssr
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { calcFoundryScore, calcRoi, TIER_ALLOCATIONS, PROFIT_SPLITS } from "@/lib/scoring";
import type { Operator, Play, Message } from "@/lib/types";

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #090909; color: #e2e0db; font-family: 'DM Sans', sans-serif; }
  .mono { font-family: 'DM Mono', monospace; }
  input, textarea { background: #0e0e0e; border: 1px solid #222; color: #e2e0db; padding: 10px 14px; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border-color 0.2s; border-radius: 2px; }
  input:focus, textarea:focus { border-color: #555; }
  input::placeholder, textarea::placeholder { color: #444; }
  textarea { resize: none; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 2px; transition: all 0.15s; }
  .btn-primary { background: #e2e0db; color: #090909; border: none; padding: 10px 22px; font-size: 13px; font-weight: 600; }
  .btn-primary:hover:not(:disabled) { background: #fff; }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-ghost { background: transparent; color: #e2e0db; border: 1px solid #2a2a2a; padding: 8px 18px; font-size: 12px; }
  .btn-ghost:hover { border-color: #555; }
  .btn-green { background: #10b981; color: #fff; border: none; padding: 10px 22px; font-size: 13px; font-weight: 600; }
  .btn-green:hover:not(:disabled) { background: #0d9e6e; }
  .btn-green:disabled { opacity: 0.4; cursor: not-allowed; }
  .label { font-size: 11px; letter-spacing: 0.12em; color: #555; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .card { background: #111; border: 1px solid #1e1e1e; border-radius: 2px; }
  .card-hover { transition: all 0.15s; }
  .card-hover:hover { background: #141414; border-color: #2a2a2a; }
  .tag { font-size: 10px; padding: 3px 8px; border-radius: 2px; display: inline-block; letter-spacing: 0.05em; }
  .scrollbar::-webkit-scrollbar { width: 3px; }
  .scrollbar::-webkit-scrollbar-track { background: transparent; }
  .scrollbar::-webkit-scrollbar-thumb { background: #2a2a2a; border-radius: 2px; }
`;

// ── Constants ─────────────────────────────────────────────────────────────────

const TIER_COLORS: Record<string, string> = {
  scout: "#6b7280",
  operator: "#10b981",
  strategist: "#f59e0b",
  partner: "#8b5cf6",
  syndicate: "#ef4444",
};

const STATUS_COLORS: Record<string, string> = {
  proposed: "#6b7280",
  active: "#f59e0b",
  completed: "#10b981",
  loss: "#ef4444",
  abandoned: "#ef4444",
  disputed: "#f59e0b",
};

const TIER_ORDER = ["scout", "operator", "strategist", "partner", "syndicate"];
const TIER_VOLUME_TARGETS: Record<string, number> = {
  scout: 1000, operator: 5000, strategist: 15000, partner: 50000,
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#1a2a1a", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.35, fontWeight: 600, color: "#10b981",
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

function StatCard({ label, value, color, sub }: {
  label: string; value: string | number; color?: string; sub?: string;
}) {
  return (
    <div className="card" style={{ padding: "18px 22px" }}>
      <div className="label">{label}</div>
      <div className="mono" style={{ fontSize: 26, fontWeight: 500, color: color || "#e2e0db" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className="tag" style={{ border: `1px solid ${color}33`, color }}>
      {label}
    </span>
  );
}

function TierProgress({ operator }: { operator: Operator }) {
  const tierIdx = TIER_ORDER.indexOf(operator.tier);
  const nextTier = TIER_ORDER[tierIdx + 1];
  const target = TIER_VOLUME_TARGETS[operator.tier];
  const progress = target ? Math.min(Math.round((operator.total_capital_out / target) * 100), 100) : 100;

  return (
    <div className="card" style={{ padding: "20px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div className="label">Tier progress</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge label={operator.tier} color={TIER_COLORS[operator.tier]} />
            {nextTier && (
              <>
                <span style={{ color: "#333", fontSize: 12 }}>→</span>
                <Badge label={nextTier} color={TIER_COLORS[nextTier]} />
              </>
            )}
          </div>
        </div>
        <div className="mono" style={{ fontSize: 13, color: "#555" }}>{progress}%</div>
      </div>
      <div style={{ height: 3, background: "#1e1e1e", borderRadius: 2 }}>
        <div style={{
          height: 3, borderRadius: 2, transition: "width 1s ease",
          width: `${progress}%`, background: TIER_COLORS[operator.tier],
        }} />
      </div>
      {target && (
        <div style={{ fontSize: 11, color: "#444", marginTop: 8 }}>
          €{operator.total_capital_out.toLocaleString()} of €{target.toLocaleString()} volume target
        </div>
      )}
      <div style={{ marginTop: 16, display: "flex", gap: 24 }}>
        {Object.entries(PROFIT_SPLITS[operator.tier as keyof typeof PROFIT_SPLITS] || {}).map(([k, v]) => (
          v !== null && (
            <div key={k}>
              <div className="label">{k === "operator" ? "Your cut" : "Foundry cut"}</div>
              <div className="mono" style={{ fontSize: 18, color: k === "operator" ? "#10b981" : "#666" }}>
                {Math.round((v as number) * 100)}%
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

// ── Play Chat ─────────────────────────────────────────────────────────────────

function PlayChat({
  play, operator, onClose,
}: {
  play: Play; operator: Operator; onClose: () => void;
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load messages
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("play_id", play.id)
        .order("created_at", { ascending: true });
      if (data) setMessages(data);
    };
    load();

    // Subscribe to realtime new messages
    const channel = supabase
      .channel(`play-chat-${play.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `play_id=eq.${play.id}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [play.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadReceipt = async (file: File) => {
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "play-receipts", fileName: file.name, contentType: file.type }),
      });
      const { signedUrl, path } = await res.json();
      await fetch(signedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      setAttachmentPath(path);
      setAttachmentName(file.name);
    } catch {
      // handle silently — user can retry
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (!body.trim() && !attachmentPath) return;
    setSending(true);
    await supabase.from("messages").insert({
      play_id:         play.id,
      operator_id:     operator.id,
      from_role:       "operator",
      body:            body.trim() || "(receipt attached)",
      attachment_path: attachmentPath,
      attachment_type: attachmentPath ? "receipt" : null,
    });
    setBody("");
    setAttachmentPath(null);
    setAttachmentName(null);
    setSending(false);
  };

  const netProfit = play.capital_out ? play.capital_out - play.capital_in : null;
  const playRoi = play.capital_out ? calcRoi(play.capital_in, play.capital_out) : null;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="card" style={{ width: "100%", maxWidth: 620, height: "85vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 6 }}>{play.title}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Badge label={play.status} color={STATUS_COLORS[play.status]} />
                {play.play_number && (
                  <span className="mono" style={{ fontSize: 11, color: "#555" }}>{play.play_number}</span>
                )}
                {play.platform && (
                  <span style={{ fontSize: 11, color: "#555" }}>{play.platform}</span>
                )}
              </div>
            </div>
            <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: 11 }} onClick={onClose}>
              Close
            </button>
          </div>

          {/* Financial summary bar */}
          <div style={{
            display: "flex", gap: 24, marginTop: 14, paddingTop: 14,
            borderTop: "1px solid #1a1a1a",
          }}>
            <div>
              <div className="label" style={{ marginBottom: 2 }}>Capital in</div>
              <div className="mono" style={{ fontSize: 14, color: "#888" }}>€{play.capital_in}</div>
            </div>
            {play.capital_out && (
              <div>
                <div className="label" style={{ marginBottom: 2 }}>Capital out</div>
                <div className="mono" style={{ fontSize: 14, color: "#10b981" }}>€{play.capital_out}</div>
              </div>
            )}
            {netProfit !== null && (
              <div>
                <div className="label" style={{ marginBottom: 2 }}>Net profit</div>
                <div className="mono" style={{ fontSize: 14, color: netProfit >= 0 ? "#10b981" : "#ef4444" }}>
                  {netProfit >= 0 ? "+" : ""}€{netProfit.toFixed(2)}
                </div>
              </div>
            )}
            {playRoi !== null && (
              <div>
                <div className="label" style={{ marginBottom: 2 }}>ROI</div>
                <div className="mono" style={{ fontSize: 14, color: playRoi >= 0 ? "#10b981" : "#ef4444" }}>
                  {playRoi >= 0 ? "+" : ""}{playRoi}%
                </div>
              </div>
            )}
            {play.operator_cut !== null && (
              <div>
                <div className="label" style={{ marginBottom: 2 }}>Your earnings</div>
                <div className="mono" style={{ fontSize: 14, color: "#f59e0b" }}>€{play.operator_cut?.toFixed(2)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="scrollbar" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: "center", color: "#444", fontSize: 13, marginTop: 40 }}>
              No messages yet. Log your first update below.
            </div>
          )}
          {messages.map((msg, i) => {
            const isOp = msg.from_role === "operator";
            const prevMsg = messages[i - 1];
            const showDate = !prevMsg ||
              new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();
            const time = new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const date = new Date(msg.created_at).toLocaleDateString([], { month: "short", day: "numeric" });

            return (
              <div key={msg.id}>
                {showDate && (
                  <div style={{ textAlign: "center", margin: "16px 0 12px", fontSize: 11, color: "#333" }}>
                    {date}
                  </div>
                )}
                <div style={{
                  marginBottom: 12,
                  display: "flex", flexDirection: "column",
                  alignItems: isOp ? "flex-start" : "flex-end",
                }}>
                  <div className="mono" style={{ fontSize: 10, color: "#333", marginBottom: 4 }}>
                    {isOp ? `@${operator.handle}` : "FOUNDRY"} · {time}
                  </div>
                  <div style={{
                    background: isOp ? "#161616" : "#0e1e0e",
                    border: `1px solid ${isOp ? "#222" : "#1a3a1a"}`,
                    borderRadius: 2, padding: "10px 14px",
                    maxWidth: "80%", fontSize: 14, lineHeight: 1.6,
                    color: isOp ? "#e2e0db" : "#86efac",
                  }}>
                    {msg.body}
                    {msg.attachment_path && (
                      <div style={{
                        marginTop: 8, padding: "6px 10px",
                        background: "#0a1a0a", border: "1px solid #1a3a1a",
                        fontSize: 11, color: "#10b981",
                      }}>
                        📎 Receipt attached
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #1e1e1e" }}>
          {attachmentName && (
            <div style={{
              fontSize: 12, color: "#10b981", marginBottom: 8,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              📎 {attachmentName}
              <button
                style={{ background: "none", border: "none", color: "#555", fontSize: 11, padding: 0 }}
                onClick={() => { setAttachmentPath(null); setAttachmentName(null); }}
              >
                ✕
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-ghost"
              style={{ padding: "10px 12px", fontSize: 16, flexShrink: 0 }}
              onClick={() => fileRef.current?.click()}
              title="Attach receipt"
            >
              {uploading ? "⏳" : "📎"}
            </button>
            <input
              type="file" ref={fileRef} accept="image/*,application/pdf"
              style={{ display: "none" }}
              onChange={e => { if (e.target.files?.[0]) uploadReceipt(e.target.files[0]); }}
            />
            <textarea
              rows={1}
              style={{ flex: 1, padding: "10px 14px", fontSize: 14 }}
              placeholder="Log an update..."
              value={body}
              onChange={e => setBody(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            />
            <button
              className="btn-green"
              style={{ padding: "10px 16px", flexShrink: 0 }}
              disabled={(!body.trim() && !attachmentPath) || sending}
              onClick={send}
            >
              {sending ? "..." : "Send"}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "#333", marginTop: 6 }}>
            Enter to send · Shift+Enter for new line · 📎 to attach a receipt
          </div>
        </div>
      </div>
    </div>
  );
}

// ── New Play Form ─────────────────────────────────────────────────────────────

function NewPlayForm({
  operator, onSubmit, onClose,
}: {
  operator: Operator;
  onSubmit: (play: Partial<Play>) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: "", description: "", platform: "", category: "arbitrage", capitalIn: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const maxAlloc = operator.current_allocation;

  const submit = async () => {
    const capital = parseFloat(form.capitalIn);
    if (!form.title || !form.capitalIn || isNaN(capital)) {
      setError("Title and capital amount are required."); return;
    }
    if (capital > maxAlloc) {
      setError(`Capital cannot exceed your current allocation (€${maxAlloc}).`); return;
    }
    if (capital < 1) {
      setError("Minimum capital is €1."); return;
    }
    setLoading(true);
    setError(null);
    await onSubmit({
      title: form.title, description: form.description,
      platform: form.platform, category: form.category,
      capital_in: capital,
    });
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div className="card" style={{ width: "100%", maxWidth: 520 }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15 }}>Log a new play</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>
              Current allocation: <span className="mono" style={{ color: "#10b981" }}>€{maxAlloc}</span>
            </div>
          </div>
          <button className="btn-ghost" style={{ padding: "6px 12px", fontSize: 11 }} onClick={onClose}>Cancel</button>
        </div>

        <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label className="label">Play title</label>
            <input placeholder="e.g. Office chair flip, AI headshots, Festival ticket arb" value={form.title} onChange={e => set("title", e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Category</label>
              <select
                value={form.category}
                onChange={e => set("category", e.target.value)}
                style={{ background: "#0e0e0e", border: "1px solid #222", color: "#e2e0db", padding: "10px 14px", fontSize: 14, fontFamily: "DM Sans, sans-serif", width: "100%", outline: "none", borderRadius: 2 }}
              >
                <option value="arbitrage">Arbitrage</option>
                <option value="digital">Digital</option>
                <option value="service">Service</option>
                <option value="food">Food & Beverage</option>
                <option value="bulk">Bulk resale</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Capital in (€)</label>
              <input
                type="number" min="1" max={maxAlloc} step="1"
                placeholder={`Max €${maxAlloc}`}
                value={form.capitalIn} onChange={e => set("capitalIn", e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Platform / channel</label>
            <input placeholder="e.g. DoneDeal, Fiverr, Facebook, Local market" value={form.platform} onChange={e => set("platform", e.target.value)} />
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <textarea rows={3} placeholder="What are you doing and how? Brief is fine — you can add more in the chat." value={form.description} onChange={e => set("description", e.target.value)} />
          </div>

          <div className="card" style={{ padding: 14, borderColor: "#1a3a1a" }}>
            <div style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}>
              By logging this play you confirm it is a lawful commercial activity and you agree
              to return the full principal on completion. You will chat with the Foundry team
              throughout the play.
            </div>
          </div>

          {error && <div style={{ fontSize: 12, color: "#ef4444" }}>{error}</div>}

          <button className="btn-green" style={{ alignSelf: "flex-end" }} disabled={loading} onClick={submit}>
            {loading ? "Submitting..." : "Log play →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const supabase = createClient();
  const [operator, setOperator] = useState<Operator | null>(null);
  const [plays, setPlays] = useState<Play[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlay, setActivePlay] = useState<Play | null>(null);
  const [showNewPlay, setShowNewPlay] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "active" | "completed">("all");

  // ── Load operator + plays ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data: op } = await supabase
        .from("operators")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!op) { setLoading(false); return; }
      setOperator(op);

      const { data: ps } = await supabase
        .from("plays")
        .select("*")
        .eq("operator_id", op.id)
        .order("created_at", { ascending: false });

      if (ps) setPlays(ps);
      setLoading(false);
    };
    load();
  }, []);

  // ── Submit new play ──────────────────────────────────────────────────────
  const submitPlay = useCallback(async (playData: Partial<Play>) => {
    if (!operator) return;
    const { data, error } = await supabase
      .from("plays")
      .insert({ ...playData, operator_id: operator.id, status: "proposed" })
      .select()
      .single();
    if (data) {
      setPlays(prev => [data, ...prev]);
      setShowNewPlay(false);
      setActivePlay(data);
    }
  }, [operator]);

  // ── Sign out ─────────────────────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="mono" style={{ color: "#444", fontSize: 13 }}>Loading...</div>
      </div>
    );
  }

  if (!operator) {
    return (
      <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#666", fontSize: 14, marginBottom: 16 }}>No operator profile found.</div>
          <a href="/apply" style={{ color: "#10b981", fontSize: 13 }}>Apply for Foundry →</a>
        </div>
      </div>
    );
  }

  const score = calcFoundryScore(
    operator.total_capital_in, operator.total_capital_out,
    operator.reliability_score, operator.play_count
  );
  const opRoi = calcRoi(operator.total_capital_in, operator.total_capital_out);

  const filteredPlays = plays.filter(p => {
    if (activeTab === "active")    return ["proposed", "active"].includes(p.status);
    if (activeTab === "completed") return ["completed", "loss", "abandoned"].includes(p.status);
    return true;
  });

  return (
    <>
      <style>{css}</style>

      {/* Nav */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(9,9,9,0.95)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid #1a1a1a", padding: "0 32px",
        height: 52, display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span className="mono" style={{ fontSize: 15, fontWeight: 500, letterSpacing: "0.2em" }}>FOUNDRY</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Avatar name={operator.full_name} size={28} />
            <span style={{ fontSize: 13, color: "#888" }}>@{operator.handle}</span>
            <Badge label={operator.tier} color={TIER_COLORS[operator.tier]} />
          </div>
          <button className="btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={signOut}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 36 }}>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Dashboard</div>
            <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: "-0.02em" }}>
              Hey, {operator.full_name.split(" ")[0]}.
            </h1>
            {operator.status === "pending_review" && (
              <div style={{ fontSize: 13, color: "#f59e0b", marginTop: 8 }}>
                ⏳ Your application is under review. You'll be emailed when approved.
              </div>
            )}
          </div>
          {operator.status === "active" && (
            <button className="btn-green" onClick={() => setShowNewPlay(true)}>
              + Log a play
            </button>
          )}
        </div>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginBottom: 2 }}>
          <StatCard
            label="Current allocation"
            value={`€${operator.current_allocation.toLocaleString()}`}
            color="#10b981"
          />
          <StatCard
            label="Total ROI"
            value={`${opRoi >= 0 ? "+" : ""}${opRoi}%`}
            color={opRoi >= 0 ? "#10b981" : "#ef4444"}
            sub={`€${operator.total_capital_in} in · €${operator.total_capital_out} out`}
          />
          <StatCard
            label="Reliability"
            value={`${operator.reliability_score}%`}
            sub={`${operator.play_count} plays completed`}
          />
          <StatCard
            label="Foundry score"
            value={score}
            color="#f59e0b"
            sub="ROI + reliability + volume"
          />
        </div>

        {/* Tier progress */}
        <div style={{ marginBottom: 32 }}>
          <TierProgress operator={operator} />
        </div>

        {/* Plays section */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div className="label">Your plays</div>
            <div style={{ display: "flex", gap: 2 }}>
              {(["all", "active", "completed"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "none",
                    border: activeTab === tab ? "1px solid #2a2a2a" : "1px solid transparent",
                    color: activeTab === tab ? "#e2e0db" : "#555",
                    padding: "6px 14px", fontSize: 11,
                    letterSpacing: "0.08em", textTransform: "uppercase",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filteredPlays.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ color: "#444", fontSize: 14, marginBottom: 12 }}>
                {activeTab === "all"
                  ? "No plays yet. Log your first play to get started."
                  : `No ${activeTab} plays.`}
              </div>
              {operator.status === "active" && activeTab === "all" && (
                <button className="btn-green" style={{ fontSize: 12 }} onClick={() => setShowNewPlay(true)}>
                  + Log your first play
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filteredPlays.map(play => {
                const playRoi = play.capital_out ? calcRoi(play.capital_in, play.capital_out) : null;
                return (
                  <div
                    key={play.id}
                    className="card card-hover"
                    style={{ padding: "18px 22px", cursor: "pointer" }}
                    onClick={() => setActivePlay(play)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontWeight: 500, fontSize: 15 }}>{play.title}</span>
                          {play.play_number && (
                            <span className="mono" style={{ fontSize: 11, color: "#444" }}>{play.play_number}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                          <Badge label={play.status} color={STATUS_COLORS[play.status]} />
                          {play.platform && <span style={{ fontSize: 12, color: "#555" }}>{play.platform}</span>}
                          {play.category && <span style={{ fontSize: 12, color: "#555" }}>{play.category}</span>}
                          <span style={{ fontSize: 12, color: "#444" }}>
                            {new Date(play.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
                        <div style={{ textAlign: "right" }}>
                          <div className="mono" style={{ fontSize: 13, color: "#888" }}>€{play.capital_in} in</div>
                          {play.capital_out && (
                            <div className="mono" style={{ fontSize: 13, color: "#10b981" }}>€{play.capital_out} out</div>
                          )}
                        </div>
                        {playRoi !== null && (
                          <div className="mono" style={{
                            fontSize: 15, fontWeight: 500,
                            color: playRoi >= 0 ? "#10b981" : "#ef4444",
                            minWidth: 56, textAlign: "right",
                          }}>
                            {playRoi >= 0 ? "+" : ""}{playRoi}%
                          </div>
                        )}
                        <span style={{ fontSize: 12, color: "#333" }}>→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Modals */}
      {activePlay && (
        <PlayChat
          play={activePlay}
          operator={operator}
          onClose={() => setActivePlay(null)}
        />
      )}
      {showNewPlay && (
        <NewPlayForm
          operator={operator}
          onSubmit={submitPlay}
          onClose={() => setShowNewPlay(false)}
        />
      )}
    </>
  );
}
