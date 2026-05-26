"use client";

/**
 * FILE: app/admin/transfers/page.tsx
 *
 * Revolut transfer tracker — your capital command centre.
 *
 * Shows:
 * - Capital pool stats (total, deployed, pending out, profit earned)
 * - Pocket per operator (what's live in Revolut)
 * - Pending transfers queue — exactly what to action in Revolut right now
 * - Full ledger with CSV export
 * - Log any manual movement (allocation, principal return, profit split)
 *
 * Every action auto-generates a FRY-XXXX reference to paste as the
 * Revolut payment note — keeps your ledger and Revolut in sync.
 */

import { useState, useEffect, useCallback } from "react";
import { adminSupabase } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/client";
import { PROFIT_SPLITS } from "@/lib/scoring";
import type { Operator } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

type TransferType =
  | "allocation"       // you → operator: send capital
  | "top_up"           // you → operator: increase allocation
  | "principal_return" // operator → you: they return capital
  | "profit_split"     // you → operator: their earnings
  | "withdrawal";      // move profit to your personal account

type TransferStatus = "pending" | "done" | "overdue";

interface Transfer {
  id: string;
  operator_id: string;
  operator_name: string;
  operator_handle: string;
  type: TransferType;
  amount: number;
  note: string;
  revolut_ref: string;
  status: TransferStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  play_id: string | null;
  play_number: string | null;
}

interface PocketSummary {
  operator: Operator;
  deployed: number;
  pending_return: number;
  total_profit_paid: number;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #090909; color: #e2e0db; font-family: 'DM Sans', sans-serif; }
  .mono { font-family: 'DM Mono', monospace; }
  input, select, textarea {
    background: #0e0e0e; border: 1px solid #222; color: #e2e0db;
    padding: 9px 12px; font-size: 13px; font-family: 'DM Sans', sans-serif;
    outline: none; transition: border-color 0.2s; border-radius: 2px; width: 100%;
  }
  input:focus, select:focus { border-color: #555; }
  input::placeholder { color: #444; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; border-radius: 2px; transition: all 0.15s; }
  .btn { background: transparent; color: #e2e0db; border: 1px solid #2a2a2a; padding: 8px 16px; font-size: 12px; }
  .btn:hover { border-color: #555; }
  .btn-green { background: #10b981; color: #fff; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; }
  .btn-green:hover:not(:disabled) { background: #0d9e6e; }
  .btn-green:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-sm { padding: 5px 10px; font-size: 11px; }
  .label { font-size: 11px; letter-spacing: 0.12em; color: #555; text-transform: uppercase; display: block; margin-bottom: 6px; }
  .card { background: #111; border: 1px solid #1e1e1e; border-radius: 2px; }
  .stat { background: #0e0e0e; border: 1px solid #1a1a1a; border-radius: 2px; padding: 16px 20px; }
  .row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #1a1a1a; }
  .row:last-child { border-bottom: none; }
  .tag { font-size: 10px; padding: 3px 8px; border-radius: 2px; display: inline-block; letter-spacing: 0.05em; }
  .tag-pending { border: 1px solid #f59e0b44; color: #f59e0b; }
  .tag-done    { border: 1px solid #10b98144; color: #10b981; }
  .tag-overdue { border: 1px solid #ef444444; color: #ef4444; }
  .tag-alloc   { border: 1px solid #6366f144; color: #6366f1; }
  .revolut-ref {
    font-family: 'DM Mono', monospace; font-size: 11px; color: #888;
    background: #1a1a1a; padding: 3px 8px; border-radius: 2px;
    cursor: pointer; user-select: all; transition: background 0.15s;
    display: inline-block;
  }
  .revolut-ref:hover { background: #222; color: #e2e0db; }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<TransferType, string> = {
  allocation:       "Allocation issued",
  top_up:           "Top-up",
  principal_return: "Principal returned",
  profit_split:     "Profit split sent",
  withdrawal:       "Profit withdrawal",
};

const TYPE_DIRECTION: Record<TransferType, "out" | "in"> = {
  allocation:       "out",
  top_up:           "out",
  principal_return: "in",
  profit_split:     "out",
  withdrawal:       "in",
};

// Auto-generate Revolut reference note
function buildRevolutNote(type: TransferType, operatorHandle: string, playNumber?: string): string {
  const base = `FOUNDRY ${TYPE_LABELS[type].toUpperCase()} @${operatorHandle}`;
  return playNumber ? `${base} ${playNumber}` : base;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TransfersPage() {
  const supabase = createClient();

  const [operators, setOperators] = useState<Operator[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [pockets, setPockets] = useState<PocketSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "ledger" | "pockets">("pending");

  // New transfer form state
  const [form, setForm] = useState({
    operatorId: "",
    type: "allocation" as TransferType,
    amount: "",
    note: "",
    playId: "",
    dueDate: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    const [{ data: ops }, { data: txns }] = await Promise.all([
      adminSupabase.from("operators").select("*").eq("status", "active").order("full_name"),
      adminSupabase
        .from("allocations")
        .select(`*, operators(id, full_name, handle), plays(play_number)`)
        .order("created_at", { ascending: false }),
    ]);

    if (ops) setOperators(ops);

    if (txns) {
      const mapped: Transfer[] = txns.map((t: any) => ({
        id:               t.id,
        operator_id:      t.operator_id,
        operator_name:    t.operators?.full_name || "Unknown",
        operator_handle:  t.operators?.handle || "unknown",
        type:             t.direction as TransferType,
        amount:           parseFloat(t.amount),
        note:             t.notes || TYPE_LABELS[t.direction as TransferType],
        revolut_ref:      t.revolut_ref || generateRef(t.id),
        status:           t.returned_at ? "done" : isOverdue(t.due_at) ? "overdue" : "issued" === t.status ? "pending" : "done",
        due_date:         t.due_at,
        completed_at:     t.returned_at,
        created_at:       t.created_at,
        play_id:          t.play_id,
        play_number:      t.plays?.play_number || null,
      }));
      setTransfers(mapped);
    }

    if (ops) {
      // Build pocket summaries
      const pocketData: PocketSummary[] = ops.map((op: Operator) => {
        const opTxns = txns?.filter((t: any) => t.operator_id === op.id) || [];
        const deployed = opTxns
          .filter((t: any) => ["issued", "returned"].includes(t.direction) && !t.returned_at)
          .reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
        const pending_return = opTxns
          .filter((t: any) => t.direction === "issued" && !t.returned_at)
          .reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
        const total_profit_paid = opTxns
          .filter((t: any) => t.direction === "profit_split" && t.returned_at)
          .reduce((s: number, t: any) => s + parseFloat(t.amount), 0);
        return { operator: op, deployed, pending_return, total_profit_paid };
      });
      setPockets(pocketData);
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Log a transfer ─────────────────────────────────────────────────────────
  const logTransfer = async () => {
    if (!form.operatorId || !form.amount) {
      setFormError("Operator and amount are required."); return;
    }
    setFormLoading(true);
    setFormError(null);

    const operator = operators.find(o => o.id === form.operatorId);
    if (!operator) { setFormError("Operator not found."); setFormLoading(false); return; }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setFormError("Amount must be a positive number."); setFormLoading(false); return;
    }

    const ref = `FRY-${Date.now().toString().slice(-6)}`;
    const revolutNote = buildRevolutNote(form.type, operator.handle);

    const { error } = await adminSupabase.from("allocations").insert({
      operator_id: form.operatorId,
      play_id:     form.playId || null,
      amount,
      direction:   form.type,
      notes:       form.note || revolutNote,
      revolut_ref: ref,
      issued_by:   (await supabase.auth.getUser()).data.user?.id,
      due_at:      form.dueDate || null,
      returned_at: form.type === "principal_return" ? new Date().toISOString() : null,
    });

    if (error) { setFormError(error.message); setFormLoading(false); return; }

    // If it's a profit split, also update operator stats
    if (form.type === "profit_split") {
      await adminSupabase.from("operators").update({
        updated_at: new Date().toISOString(),
      }).eq("id", form.operatorId);
    }

    setForm({ operatorId: "", type: "allocation", amount: "", note: "", playId: "", dueDate: "" });
    await load();
    setFormLoading(false);
  };

  // ── Mark transfer done ─────────────────────────────────────────────────────
  const markDone = async (transferId: string) => {
    await adminSupabase.from("allocations").update({
      returned_at: new Date().toISOString(),
    }).eq("id", transferId);
    await load();
  };

  // ── Calculate capital pool stats ───────────────────────────────────────────
  const totalDeployed = operators.reduce((s, o) => s + o.current_allocation, 0);
  const pendingOut = transfers.filter(t =>
    t.status === "pending" && TYPE_DIRECTION[t.type] === "out"
  ).reduce((s, t) => s + t.amount, 0);
  const totalProfitEarned = transfers.filter(t =>
    t.type === "profit_split" && t.status === "done"
  ).reduce((s, t) => s + t.amount * (1 / (PROFIT_SPLITS[t.operator_id as any]?.operator || 0.5) - 1), 0);

  const pendingTransfers = transfers.filter(t => t.status === "pending" || t.status === "overdue");
  const completedTransfers = transfers.filter(t => t.status === "done");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="mono" style={{ color: "#444", fontSize: 13 }}>Loading transfers...</div>
      </div>
    );
  }

  return (
    <>
      <style>{css}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px" }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="label" style={{ marginBottom: 8 }}>Admin — Capital</div>
          <h1 style={{ fontSize: 28, fontWeight: 300, letterSpacing: "-0.02em" }}>
            Revolut tracker
          </h1>
          <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>
            Log every capital movement here. Each entry generates a reference to paste into Revolut.
            Pockets tab mirrors what you should have set up in Revolut.
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, marginBottom: 24 }}>
          {[
            { label: "Total deployed",    value: `€${totalDeployed.toLocaleString()}`,          color: "#f59e0b" },
            { label: "Pending out",       value: `€${pendingOut.toFixed(2)}`,                   color: pendingOut > 0 ? "#ef4444" : "#10b981" },
            { label: "Active operators",  value: operators.length,                              color: "#e2e0db" },
            { label: "Foundry profit",    value: `€${totalProfitEarned.toFixed(2)}`,            color: "#10b981" },
          ].map((s, i) => (
            <div key={i} className="stat">
              <div className="label">{s.label}</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 500, color: s.color, marginTop: 4 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 2, marginBottom: 24 }}>

          {/* Left: tabs */}
          <div>
            <div style={{ display: "flex", gap: 2, marginBottom: 0, borderBottom: "1px solid #1a1a1a" }}>
              {([
                ["pending", `Pending (${pendingTransfers.length})`],
                ["ledger",  `Ledger (${transfers.length})`],
                ["pockets", `Pockets (${pockets.length})`],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    background: "none",
                    border: "none",
                    borderBottom: tab === id ? "2px solid #10b981" : "2px solid transparent",
                    color: tab === id ? "#e2e0db" : "#555",
                    padding: "10px 18px",
                    fontSize: 12,
                    marginBottom: -1,
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Pending tab */}
            {tab === "pending" && (
              <div className="card" style={{ borderTop: "none", borderRadius: "0 0 2px 2px" }}>
                {pendingTransfers.length === 0 ? (
                  <div style={{ padding: "40px 24px", textAlign: "center", color: "#10b981", fontSize: 13 }}>
                    ✓ All clear — no pending transfers
                  </div>
                ) : (
                  <div style={{ padding: "0 20px" }}>
                    {pendingTransfers.map(t => (
                      <div key={t.id} className="row">
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ fontWeight: 500, fontSize: 14 }}>
                              {TYPE_LABELS[t.type]}
                            </span>
                            <span style={{ fontSize: 12, color: "#555" }}>→ @{t.operator_handle}</span>
                            {t.play_number && (
                              <span className="mono" style={{ fontSize: 11, color: "#444" }}>{t.play_number}</span>
                            )}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                            <span
                              className="revolut-ref"
                              title="Click to copy for Revolut note"
                              onClick={() => navigator.clipboard.writeText(t.revolut_ref)}
                            >
                              {t.revolut_ref}
                            </span>
                            <span style={{ fontSize: 11, color: "#444" }}>{t.note}</span>
                            {t.due_date && (
                              <span style={{ fontSize: 11, color: t.status === "overdue" ? "#ef4444" : "#555" }}>
                                due {t.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span className="mono" style={{
                            fontSize: 16, fontWeight: 500,
                            color: TYPE_DIRECTION[t.type] === "out" ? "#ef4444" : "#10b981",
                          }}>
                            {TYPE_DIRECTION[t.type] === "out" ? "-" : "+"}€{t.amount.toFixed(2)}
                          </span>
                          <span className={`tag ${t.status === "overdue" ? "tag-overdue" : "tag-pending"}`}>
                            {t.status}
                          </span>
                          <button className="btn-green btn-sm" onClick={() => markDone(t.id)}>
                            ✓ Done
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ledger tab */}
            {tab === "ledger" && (
              <div className="card" style={{ borderTop: "none", borderRadius: "0 0 2px 2px" }}>
                <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px", borderBottom: "1px solid #1a1a1a" }}>
                  <button
                    className="btn btn-sm"
                    onClick={() => {
                      const rows = [["Date","Operator","Type","Amount","Reference","Note","Status"]];
                      transfers.forEach(t => rows.push([
                        t.created_at.slice(0,10), t.operator_handle,
                        t.type, t.amount.toFixed(2), t.revolut_ref, t.note, t.status
                      ]));
                      const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
                      const a = document.createElement("a");
                      a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
                      a.download = `foundry-ledger-${new Date().toISOString().slice(0,10)}.csv`;
                      a.click();
                    }}
                  >
                    ↓ Export CSV
                  </button>
                </div>
                <div style={{ padding: "0 20px" }}>
                  {transfers.map(t => (
                    <div key={t.id} className="row">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
                          @{t.operator_handle} — {TYPE_LABELS[t.type]}
                        </div>
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          <span
                            className="revolut-ref"
                            onClick={() => navigator.clipboard.writeText(t.revolut_ref)}
                          >
                            {t.revolut_ref}
                          </span>
                          <span style={{ fontSize: 11, color: "#444" }}>{t.note}</span>
                          <span style={{ fontSize: 11, color: "#333" }}>{t.created_at.slice(0,10)}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span className="mono" style={{
                          fontSize: 14, fontWeight: 500,
                          color: TYPE_DIRECTION[t.type] === "out" ? "#888" : "#10b981",
                        }}>
                          {TYPE_DIRECTION[t.type] === "out" ? "-" : "+"}€{t.amount.toFixed(2)}
                        </span>
                        <span className={`tag ${t.status === "done" ? "tag-done" : t.status === "overdue" ? "tag-overdue" : "tag-pending"}`}>
                          {t.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pockets tab */}
            {tab === "pockets" && (
              <div className="card" style={{ borderTop: "none", borderRadius: "0 0 2px 2px", padding: "0 20px" }}>
                <div style={{ padding: "12px 0", borderBottom: "1px solid #1a1a1a", fontSize: 12, color: "#555" }}>
                  Create a Revolut pocket named exactly as shown below.
                  Keep each pocket balance matching the "deployed" column.
                </div>
                {pockets.map(({ operator: op, deployed, pending_return, total_profit_paid }) => (
                  <div key={op.id} className="row">
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "#1a2a1a", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 12, fontWeight: 600, color: "#10b981",
                      }}>
                        {op.full_name.split(" ").map((n: string) => n[0]).join("").slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>OP — {op.full_name}</div>
                        <div className="mono" style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                          Revolut pocket name: "OP — {op.full_name}"
                        </div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                      <div style={{ textAlign: "right" }}>
                        <div className="label" style={{ marginBottom: 2 }}>Pocket balance</div>
                        <div className="mono" style={{ fontSize: 15, fontWeight: 500, color: "#f59e0b" }}>
                          €{op.current_allocation.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="label" style={{ marginBottom: 2 }}>Awaiting return</div>
                        <div className="mono" style={{ fontSize: 14, color: pending_return > 0 ? "#ef4444" : "#555" }}>
                          €{pending_return.toFixed(2)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div className="label" style={{ marginBottom: 2 }}>Profit paid out</div>
                        <div className="mono" style={{ fontSize: 14, color: "#10b981" }}>
                          €{total_profit_paid.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: log movement form */}
          <div className="card" style={{ padding: 20, alignSelf: "start" }}>
            <div className="label" style={{ marginBottom: 16 }}>Log a movement</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="label" style={{ marginBottom: 4 }}>Operator</label>
                <select
                  value={form.operatorId}
                  onChange={e => setForm(p => ({ ...p, operatorId: e.target.value }))}
                >
                  <option value="">Select operator...</option>
                  {operators.map(op => (
                    <option key={op.id} value={op.id}>@{op.handle} — {op.full_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" style={{ marginBottom: 4 }}>Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value as TransferType }))}
                >
                  <option value="allocation">Allocation issued (you → them)</option>
                  <option value="top_up">Top-up / increase (you → them)</option>
                  <option value="principal_return">Principal returned (them → you)</option>
                  <option value="profit_split">Profit split sent (you → them)</option>
                </select>
              </div>

              <div>
                <label className="label" style={{ marginBottom: 4 }}>Amount (€)</label>
                <input
                  type="number" min="0" step="0.01"
                  placeholder="e.g. 250.00"
                  value={form.amount}
                  onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                />
              </div>

              <div>
                <label className="label" style={{ marginBottom: 4 }}>Note (optional)</label>
                <input
                  placeholder="e.g. Office chair play #0182"
                  value={form.note}
                  onChange={e => setForm(p => ({ ...p, note: e.target.value }))}
                />
              </div>

              <div>
                <label className="label" style={{ marginBottom: 4 }}>Due date (optional)</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}
                />
              </div>

              {/* Profit split calculator */}
              {form.type === "profit_split" && form.amount && form.operatorId && (() => {
                const op = operators.find(o => o.id === form.operatorId);
                if (!op) return null;
                const split = PROFIT_SPLITS[op.tier as keyof typeof PROFIT_SPLITS];
                if (!split.operator) return null;
                const netProfit = parseFloat(form.amount);
                const opCut = Math.round(netProfit * split.operator * 100) / 100;
                const fdryCut = Math.round(netProfit * (1 - split.operator) * 100) / 100;
                return (
                  <div style={{ background: "#0e1a0e", border: "1px solid #1a3a1a", borderRadius: 2, padding: 12 }}>
                    <div className="label" style={{ marginBottom: 8 }}>Split breakdown</div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#555" }}>@{op.handle} ({Math.round(split.operator * 100)}%)</span>
                      <span className="mono" style={{ color: "#10b981" }}>€{opCut}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                      <span style={{ color: "#555" }}>Foundry ({Math.round((1 - split.operator) * 100)}%)</span>
                      <span className="mono" style={{ color: "#888" }}>€{fdryCut} stays</span>
                    </div>
                  </div>
                );
              })()}

              {formError && <div style={{ fontSize: 12, color: "#ef4444" }}>{formError}</div>}

              <button
                className="btn-green"
                disabled={formLoading || !form.operatorId || !form.amount}
                onClick={logTransfer}
                style={{ width: "100%", padding: "10px" }}
              >
                {formLoading ? "Logging..." : "Log movement →"}
              </button>

              <div style={{ fontSize: 11, color: "#444", lineHeight: 1.7 }}>
                A FRY-XXXX reference is auto-generated. Copy it into the Revolut payment note
                to keep your records in sync.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Utils ─────────────────────────────────────────────────────────────────────

function generateRef(id: string): string {
  return "FRY-" + id.slice(-6).toUpperCase();
}

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}
