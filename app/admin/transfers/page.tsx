"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  operator_id: string;
  operator_name: string;
  operator_handle: string;
  type: string;
  amount: number;
  note: string;
  revolut_ref: string;
  status: string;
  created_at: string;
  play_number: string | null;
};

export default function AdminPage() {
  const supabase = createClient();
  const [operators, setOperators] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [tab, setTab] = useState<"operators" | "applications" | "transfers">("applications");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [moveForm, setMoveForm] = useState({ operatorId: "", type: "allocation", amount: "", note: "" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const [{ data: ops }, { data: apps }, { data: allocs }] = await Promise.all([
      supabase.from("operators").select("*").order("created_at", { ascending: false }),
      supabase.from("applications").select("*, operators(full_name, handle, email)").order("created_at", { ascending: false }),
      supabase.from("allocations").select("*, operators(full_name, handle)").order("created_at", { ascending: false }),
    ]);
    if (ops) setOperators(ops);
    if (apps) setApplications(apps);
    if (allocs) {
      setTransfers(allocs.map((a: any) => ({
        id: a.id,
        operator_id: a.operator_id,
        operator_name: a.operators?.full_name || "Unknown",
        operator_handle: a.operators?.handle || "unknown",
        type: a.direction,
        amount: parseFloat(a.amount),
        note: a.notes || a.direction,
        revolut_ref: a.revolut_ref || `FRY-${a.id.slice(-6).toUpperCase()}`,
        status: a.returned_at ? "done" : "pending",
        created_at: a.created_at,
        play_number: null,
      })));
    }
    setLoading(false);
  };

  const approveApp = async (app: any) => {
    await supabase.from("applications").update({ status: "approved", reviewed_at: new Date().toISOString() }).eq("id", app.id);
    await supabase.from("operators").update({ status: "active", current_allocation: 100, id_verified: true }).eq("id", app.operator_id);
    await supabase.from("allocations").insert({
      operator_id: app.operator_id,
      amount: 100,
      direction: "issued",
      notes: "Initial allocation on approval",
      revolut_ref: `FRY-${Date.now().toString().slice(-6)}`,
    });
    setSelectedApp(null);
    load();
  };

  const rejectApp = async (app: any) => {
    await supabase.from("applications").update({ status: "rejected", reviewed_at: new Date().toISOString() }).eq("id", app.id);
    await supabase.from("operators").update({ status: "rejected" }).eq("id", app.operator_id);
    setSelectedApp(null);
    load();
  };

  const updateAllocation = async (opId: string, amount: number) => {
    await supabase.from("operators").update({ current_allocation: amount }).eq("id", opId);
    load();
  };

  const logTransfer = async () => {
    if (!moveForm.operatorId || !moveForm.amount) return;
    await supabase.from("allocations").insert({
      operator_id: moveForm.operatorId,
      amount: parseFloat(moveForm.amount),
      direction: moveForm.type,
      notes: moveForm.note || moveForm.type,
      revolut_ref: `FRY-${Date.now().toString().slice(-6)}`,
      returned_at: moveForm.type === "principal_return" ? new Date().toISOString() : null,
    });
    setMoveForm({ operatorId: "", type: "allocation", amount: "", note: "" });
    load();
  };

  const markDone = async (id: string) => {
    await supabase.from("allocations").update({ returned_at: new Date().toISOString() }).eq("id", id);
    load();
  };

  const s = {
    page: { minHeight: "100vh", background: "#090909", color: "#e2e0db", fontFamily: "'DM Sans', sans-serif", padding: 32 },
    card: { background: "#111", border: "1px solid #1e1e1e", borderRadius: 2, padding: 20, marginBottom: 2 },
    label: { fontSize: 11, letterSpacing: "0.12em", color: "#555", textTransform: "uppercase" as const, display: "block", marginBottom: 6 },
    input: { background: "#0e0e0e", border: "1px solid #222", color: "#e2e0db", padding: "9px 12px", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", borderRadius: 2, width: "100%" },
    btnGreen: { background: "#10b981", color: "#fff", border: "none", padding: "8px 18px", fontSize: 12, fontWeight: 600 as const, cursor: "pointer", borderRadius: 2 },
    btnRed: { background: "transparent", color: "#ef4444", border: "1px solid #3a1a1a", padding: "8px 18px", fontSize: 12, cursor: "pointer", borderRadius: 2 },
    btnGhost: { background: "transparent", color: "#e2e0db", border: "1px solid #2a2a2a", padding: "8px 18px", fontSize: 12, cursor: "pointer", borderRadius: 2 },
    tag: (color: string) => ({ fontSize: 10, padding: "3px 8px", border: `1px solid ${color}44`, color, borderRadius: 2, display: "inline-block" }),
  };

  if (loading) return <div style={{ ...s.page, display: "flex", alignItems: "center", justifyContent: "center" }}>Loading...</div>;

  const pending = applications.filter(a => a.status === "pending");
  const pendingTransfers = transfers.filter(t => t.status === "pending");

  return (
    <div style={s.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: "0.2em", color: "#555", marginBottom: 4 }}>FOUNDRY</div>
          <h1 style={{ fontSize: 26, fontWeight: 300 }}>Admin panel</h1>
        </div>
        <a href="/dashboard" style={{ color: "#555", fontSize: 12, textDecoration: "none" }}>← Dashboard</a>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginBottom: 24 }}>
        {[
          ["Active operators", operators.filter(o => o.status === "active").length, "#10b981"],
          ["Pending applications", pending.length, "#f59e0b"],
          ["Pending transfers", pendingTransfers.length, "#ef4444"],
          ["Total deployed", `€${operators.reduce((s, o) => s + (o.current_allocation || 0), 0)}`, "#e2e0db"],
        ].map(([label, value, color], i) => (
          <div key={i} style={{ background: "#0e0e0e", border: "1px solid #1a1a1a", borderRadius: 2, padding: "16px 20px" }}>
            <div style={s.label}>{label}</div>
            <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 500, color: color as string }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 2, borderBottom: "1px solid #1a1a1a", marginBottom: 24 }}>
        {([["applications", `Applications (${pending.length})`], ["operators", "Operators"], ["transfers", "Transfers"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{ background: "none", border: "none", borderBottom: tab === id ? "2px solid #10b981" : "2px solid transparent", color: tab === id ? "#e2e0db" : "#555", padding: "10px 18px", fontSize: 12, cursor: "pointer", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Applications */}
      {tab === "applications" && !selectedApp && (
        <div>
          {applications.length === 0 && <div style={{ color: "#555", fontSize: 14 }}>No applications yet.</div>}
          {applications.map(app => (
            <div key={app.id} style={{ ...s.card, cursor: "pointer" }} onClick={() => setSelectedApp(app)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{app.operators?.full_name}</div>
                  <div style={{ fontSize: 12, color: "#555" }}>{app.operators?.email} · {new Date(app.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={s.tag(app.status === "pending" ? "#f59e0b" : app.status === "approved" ? "#10b981" : "#ef4444")}>{app.status}</span>
                  <span style={{ fontSize: 12, color: "#444" }}>Review →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Application detail */}
      {tab === "applications" && selectedApp && (
        <div>
          <button style={{ ...s.btnGhost, marginBottom: 24 }} onClick={() => setSelectedApp(null)}>← Back</button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={s.card}>
                <div style={s.label}>Applicant</div>
                {[["Name", selectedApp.operators?.full_name], ["Email", selectedApp.operators?.email], ["Applied", new Date(selectedApp.created_at).toLocaleDateString()]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #1a1a1a", fontSize: 13 }}>
                    <span style={{ color: "#555" }}>{k}</span><span>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...s.card, borderColor: "#1a2a1a" }}>
                <div style={s.label}>ID Verification</div>
                <div style={{ fontSize: 13, color: selectedApp.id_photo_path ? "#10b981" : "#555" }}>
                  {selectedApp.id_photo_path ? "✓ ID uploaded" : "No ID uploaded"}
                </div>
                <div style={{ fontSize: 13, color: selectedApp.selfie_path ? "#10b981" : "#555", marginTop: 8 }}>
                  {selectedApp.selfie_path ? "✓ Selfie uploaded" : "No selfie uploaded"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {[["€100 plan", selectedApp.q_100_plan], ["Inefficiency", selectedApp.q_inefficiency], ["Value story", selectedApp.q_value_story], ["Best at", selectedApp.q_best_at], ["€10k plan", selectedApp.q_10k_plan], ["Edge", selectedApp.q_edge]].map(([label, val]) => (
                <div key={label} style={s.card}>
                  <div style={s.label}>{label}</div>
                  <div style={{ fontSize: 13, color: "#888", lineHeight: 1.7 }}>{val || "—"}</div>
                </div>
              ))}
            </div>
          </div>
          {selectedApp.status === "pending" && (
            <div style={{ display: "flex", gap: 12, marginTop: 24, justifyContent: "flex-end" }}>
              <button style={s.btnRed} onClick={() => rejectApp(selectedApp)}>Reject</button>
              <button style={s.btnGreen} onClick={() => approveApp(selectedApp)}>Approve & allocate €100 →</button>
            </div>
          )}
        </div>
      )}

      {/* Operators */}
      {tab === "operators" && (
        <div>
          {operators.length === 0 && <div style={{ color: "#555", fontSize: 14 }}>No operators yet.</div>}
          {operators.map(op => (
            <div key={op.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>{op.full_name} <span style={{ fontFamily: "monospace", fontSize: 12, color: "#555" }}>@{op.handle}</span></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <span style={s.tag("#10b981")}>{op.tier}</span>
                    <span style={s.tag(op.status === "active" ? "#10b981" : "#f59e0b")}>{op.status}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>Allocation</div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <input
                        type="number"
                        defaultValue={op.current_allocation}
                        style={{ ...s.input, width: 80, padding: "6px 10px" }}
                        id={`alloc-${op.id}`}
                      />
                      <button style={{ ...s.btnGreen, padding: "6px 12px" }} onClick={() => {
                        const el = document.getElementById(`alloc-${op.id}`) as HTMLInputElement;
                        updateAllocation(op.id, parseFloat(el.value));
                      }}>Set</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transfers */}
      {tab === "transfers" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
              {pendingTransfers.length === 0
                ? <span style={{ color: "#10b981" }}>✓ No pending transfers</span>
                : `${pendingTransfers.length} pending — action these in Revolut`}
            </div>
            {transfers.map(t => (
              <div key={t.id} style={s.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 4 }}>@{t.operator_handle} — {t.type}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#888", background: "#1a1a1a", padding: "2px 6px", borderRadius: 2, cursor: "pointer" }} onClick={() => navigator.clipboard.writeText(t.revolut_ref)}>{t.revolut_ref}</span>
                      <span style={{ fontSize: 11, color: "#444" }}>{t.note}</span>
                      <span style={{ fontSize: 11, color: "#444" }}>{new Date(t.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 500, color: t.type === "principal_return" ? "#10b981" : "#e2e0db" }}>€{t.amount.toFixed(2)}</span>
                    <span style={s.tag(t.status === "done" ? "#10b981" : "#f59e0b")}>{t.status}</span>
                    {t.status === "pending" && <button style={{ ...s.btnGreen, padding: "5px 10px", fontSize: 11 }} onClick={() => markDone(t.id)}>✓ Done</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...s.card, alignSelf: "start" }}>
            <div style={{ ...s.label, marginBottom: 16 }}>Log a movement</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={s.label}>Operator</label>
                <select value={moveForm.operatorId} onChange={e => setMoveForm(p => ({ ...p, operatorId: e.target.value }))} style={s.input}>
                  <option value="">Select...</option>
                  {operators.filter(o => o.status === "active").map(op => (
                    <option key={op.id} value={op.id}>@{op.handle}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={s.label}>Type</label>
                <select value={moveForm.type} onChange={e => setMoveForm(p => ({ ...p, type: e.target.value }))} style={s.input}>
                  <option value="allocation">Allocation issued</option>
                  <option value="principal_return">Principal returned</option>
                  <option value="profit_split">Profit split sent</option>
                  <option value="top_up">Top-up</option>
                </select>
              </div>
              <div>
                <label style={s.label}>Amount (€)</label>
                <input type="number" placeholder="0.00" value={moveForm.amount} onChange={e => setMoveForm(p => ({ ...p, amount: e.target.value }))} style={s.input} />
              </div>
              <div>
                <label style={s.label}>Note</label>
                <input placeholder="e.g. Office chair play" value={moveForm.note} onChange={e => setMoveForm(p => ({ ...p, note: e.target.value }))} style={s.input} />
              </div>
              <button style={{ ...s.btnGreen, width: "100%", padding: 10 }} onClick={logTransfer}>Log movement →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}