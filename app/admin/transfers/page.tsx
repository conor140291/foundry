"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TransfersPage() {
  const [operators, setOperators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("operators").select("*");
      if (data) setOperators(data);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#090909", display: "flex", alignItems: "center", justifyContent: "center", color: "#e2e0db", fontFamily: "monospace" }}>
      Loading...
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#090909", color: "#e2e0db", fontFamily: "'DM Sans', sans-serif", padding: 40 }}>
      <div style={{ fontFamily: "monospace", fontSize: 15, letterSpacing: "0.2em", marginBottom: 40 }}>FOUNDRY ADMIN</div>
      <h1 style={{ fontSize: 28, fontWeight: 300, marginBottom: 32 }}>Operators</h1>
      {operators.length === 0 ? (
        <div style={{ color: "#555" }}>No operators yet. Applications will appear here once submitted.</div>
      ) : (
        operators.map(op => (
          <div key={op.id} style={{ background: "#111", border: "1px solid #1e1e1e", padding: 20, marginBottom: 2 }}>
            <div style={{ fontWeight: 500 }}>{op.full_name}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>@{op.handle} · {op.tier} · {op.status}</div>
          </div>
        ))
      )}
    </div>
  );
}