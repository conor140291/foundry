"use client";

import { useState, useEffect, useRef } from "react";

const plays = [
  { id: "0182", type: "Marketplace Arbitrage", desc: "Bought office chairs from liquidation auction", capital: 240, exit: "Resold to coworking space", duration: "48h", returnAmt: 410, operator: "Mason", category: "arbitrage" },
  { id: "0221", type: "AI Lead Generation", desc: "Built local dentist lead funnel", capital: 80, exit: "Lead package sold", duration: "6d", returnAmt: 620, operator: "Ava", category: "digital" },
  { id: "0318", type: "Event Arbitrage", desc: "Secured underpriced festival passes", capital: 300, exit: "Resold via classifieds", duration: "72h", returnAmt: 190, operator: "Lewis", category: "arbitrage" },
  { id: "0401", type: "Print-on-Demand", desc: "Seasonal merch drop via Printful", capital: 60, exit: "Shopify store", duration: "5d", returnAmt: 290, operator: "Priya", category: "digital" },
  { id: "0455", type: "Bulk Resale", desc: "Pallet of returned electronics", capital: 500, exit: "Individual eBay listings", duration: "9d", returnAmt: 740, operator: "Rory", category: "arbitrage" },
  { id: "0501", type: "Service Arbitrage", desc: "Hired cleaner, flipped AirBnB booking margin", capital: 120, exit: "3 bookings cleared", duration: "4d", returnAmt: 210, operator: "Niamh", category: "service" },
];

const leaderboard = [
  { handle: "alexm", tier: "Strategist", roi: 214, reliability: 96, plays: 18, score: 94 },
  { handle: "ava", tier: "Operator", roi: 188, reliability: 93, plays: 12, score: 89 },
  { handle: "mason", tier: "Strategist", roi: 172, reliability: 91, plays: 15, score: 87 },
  { handle: "priya", tier: "Operator", roi: 143, reliability: 88, plays: 9, score: 81 },
  { handle: "lewis", tier: "Scout", roi: 127, reliability: 85, plays: 6, score: 76 },
  { handle: "rory", tier: "Operator", roi: 148, reliability: 79, plays: 11, score: 74 },
];

const tiers = [
  { name: "Scout", alloc: "€100", color: "#6b7280", desc: "Entry level. Prove your instincts.", perks: ["Base profit split", "Community access"] },
  { name: "Operator", alloc: "€500", color: "#10b981", desc: "Consistent. Creative. Reliable.", perks: ["Improved split", "Priority review", "Play analytics"] },
  { name: "Strategist", alloc: "€2,500", color: "#f59e0b", desc: "You have a system. We fund it.", perks: ["Top-tier split", "Private channels", "Exclusive deals"] },
  { name: "Partner", alloc: "€10,000", color: "#8b5cf6", desc: "Proven track record.", perks: ["Custom terms", "Direct line to team", "Co-investment"] },
  { name: "Syndicate", alloc: "Custom", color: "#ef4444", desc: "You are the strategy.", perks: ["Full negotiation", "Fund-level access", "Joint ventures"] },
];

const categoryColors = { arbitrage: "#10b981", digital: "#6366f1", service: "#f59e0b" };

function Counter({ end, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = end / 60;
        const t = setInterval(() => {
          start += step;
          if (start >= end) { setVal(end); clearInterval(t); } else setVal(Math.floor(start));
        }, 16);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("home");
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [hoveredPlay, setHoveredPlay] = useState(null);
  const [filterCat, setFilterCat] = useState("all");

  const sections = ["home", "how", "plays", "leaderboard", "tiers", "apply"];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setActiveSection(id);
  };

  const handleFormChange = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const formSteps = [
    {
      title: "The basics",
      fields: [
        { key: "name", label: "Full name", type: "text", placeholder: "Your name" },
        { key: "age", label: "Age", type: "number", placeholder: "e.g. 24" },
        { key: "location", label: "Location", type: "text", placeholder: "City, Country" },
        { key: "social", label: "LinkedIn / X (optional)", type: "text", placeholder: "@handle or URL" },
      ]
    },
    {
      title: "How you think",
      fields: [
        { key: "q1", label: "You receive €100 today. How do you turn it into more within 7 days?", type: "textarea", placeholder: "Be specific. Walk us through your actual thinking..." },
        { key: "q2", label: "What inefficiency in the world do most people ignore?", type: "textarea", placeholder: "Something you've noticed that others haven't..." },
      ]
    },
    {
      title: "How you operate",
      fields: [
        { key: "q3", label: "Tell us about a time you created value from almost nothing.", type: "textarea", placeholder: "Could be a side hustle, a deal, a fix — anything real." },
        { key: "q4", label: "What kinds of opportunities are you naturally best at spotting?", type: "textarea", placeholder: "Arbitrage? Networks? Information gaps? Something else?" },
      ]
    },
    {
      title: "Your edge",
      fields: [
        { key: "q5", label: "If we allocated you €10,000 tomorrow, how would you deploy it?", type: "textarea", placeholder: "Be concrete. What's the play?" },
        { key: "q6", label: "What's your unfair advantage?", type: "textarea", placeholder: "What do you have access to that others don't?" },
      ]
    }
  ];

  const filteredPlays = filterCat === "all" ? plays : plays.filter(p => p.category === filterCat);

  return (
    <div style={{ background: "#0a0a0a", color: "#e8e6e0", minHeight: "100vh", fontFamily: "'DM Mono', 'Geist Mono', 'Fira Code', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; }
        .nav-link { color: #666; font-size: 13px; letter-spacing: 0.05em; cursor: pointer; transition: color 0.2s; text-decoration: none; font-family: 'DM Sans', sans-serif; }
        .nav-link:hover, .nav-link.active { color: #e8e6e0; }
        .btn-primary { background: #e8e6e0; color: #0a0a0a; border: none; padding: 12px 28px; font-size: 13px; font-weight: 500; cursor: pointer; letter-spacing: 0.05em; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .btn-primary:hover { background: #fff; }
        .btn-secondary { background: transparent; color: #e8e6e0; border: 1px solid #333; padding: 12px 28px; font-size: 13px; cursor: pointer; letter-spacing: 0.05em; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .btn-secondary:hover { border-color: #666; }
        .btn-sm { padding: 8px 20px; font-size: 12px; }
        .play-card { background: #111; border: 1px solid #1e1e1e; padding: 20px; transition: all 0.2s; cursor: default; }
        .play-card:hover { border-color: #333; background: #141414; }
        .stat-pill { background: #111; border: 1px solid #1e1e1e; padding: 6px 14px; font-size: 12px; color: #666; letter-spacing: 0.05em; font-family: 'DM Sans', sans-serif; display: inline-block; }
        .tier-card { background: #111; border: 1px solid #1e1e1e; padding: 24px; transition: border-color 0.2s; }
        .tier-card:hover { border-color: #333; }
        .input-field { background: #111; border: 1px solid #222; color: #e8e6e0; padding: 12px 16px; font-size: 14px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border-color 0.2s; resize: none; }
        .input-field:focus { border-color: #555; }
        .input-field::placeholder { color: #444; }
        .section-label { font-size: 11px; letter-spacing: 0.15em; color: #555; text-transform: uppercase; font-family: 'DM Sans', sans-serif; margin-bottom: 12px; }
        .green { color: #10b981; }
        .amber { color: #f59e0b; }
        .muted { color: #666; }
        .leaderboard-row { border-bottom: 1px solid #1a1a1a; padding: 14px 0; display: grid; grid-template-columns: 32px 1fr 80px 80px 60px 60px; gap: 8px; align-items: center; font-size: 13px; font-family: 'DM Sans', sans-serif; transition: background 0.15s; }
        .leaderboard-row:hover { background: #111; }
        .progress-bar { height: 2px; background: #1e1e1e; margin-top: 8px; }
        .progress-fill { height: 2px; transition: width 1s ease; }
        .filter-btn { background: transparent; border: 1px solid #222; color: #666; padding: 6px 16px; font-size: 11px; letter-spacing: 0.08em; cursor: pointer; font-family: 'DM Sans', sans-serif; text-transform: uppercase; transition: all 0.15s; }
        .filter-btn.active { border-color: #10b981; color: #10b981; }
        .filter-btn:hover { border-color: #444; color: #999; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor { animation: blink 1.1s infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,10,10,0.92)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a", padding: "0 40px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 500, letterSpacing: "0.2em", color: "#e8e6e0" }}>FOUNDRY</span>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {[["how", "How it works"], ["plays", "Live plays"], ["leaderboard", "Leaderboard"], ["apply", "Apply"]].map(([id, label]) => (
            <span key={id} className={`nav-link ${activeSection === id ? "active" : ""}`} onClick={() => scrollTo(id)}>{label}</span>
          ))}
          <button className="btn-primary btn-sm" onClick={() => scrollTo("apply")}>Apply for capital</button>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "120px 80px 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 70% 30%, rgba(16,185,129,0.04) 0%, transparent 60%), radial-gradient(circle at 20% 80%, rgba(245,158,11,0.03) 0%, transparent 50%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900 }}>
          <div className="section-label" style={{ marginBottom: 32 }}>
            <span style={{ color: "#10b981" }}>●</span> Platform open — 48 active operators
          </div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(52px, 7vw, 88px)", fontWeight: 300, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 32, color: "#e8e6e0" }}>
            Capital for<br />
            <span style={{ color: "#10b981" }}>high-agency</span><br />
            people<span className="cursor" style={{ color: "#10b981" }}>_</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#888", lineHeight: 1.7, maxWidth: 520, marginBottom: 48 }}>
            Foundry allocates real capital to operators who can create value from opportunity. Start small. Build reputation. Unlock larger allocations.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 80 }}>
            <button className="btn-primary" onClick={() => scrollTo("apply")}>Apply for capital</button>
            <button className="btn-secondary" onClick={() => scrollTo("plays")}>View live operators</button>
          </div>

          {/* Stats strip */}
          <div style={{ display: "flex", gap: 0, borderTop: "1px solid #1e1e1e", paddingTop: 40 }}>
            {[
              { label: "Allocated this month", value: 12430, prefix: "€" },
              { label: "Active operators", value: 48 },
              { label: "Profitable operators", value: 71, suffix: "%" },
              { label: "Plays executed", value: 214 },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, paddingRight: 40, borderRight: i < 3 ? "1px solid #1a1a1a" : "none", paddingLeft: i > 0 ? 40 : 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 500, color: "#e8e6e0", marginBottom: 6 }}>
                  <Counter end={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555", letterSpacing: "0.05em" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "100px 80px", borderTop: "1px solid #1a1a1a" }}>
        <div className="section-label">How it works</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 42, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 64, color: "#e8e6e0" }}>Three steps to funded.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {[
            { num: "01", title: "Apply", body: "Tell us how you think, what opportunities you spot, and how you'd deploy capital. No CV. No credentials. Pure judgment." },
            { num: "02", title: "Get allocated", body: "Approved operators receive €100–€1,000 based on experience, creativity, and reliability. Deploy it. Return the principal. Keep your cut." },
            { num: "03", title: "Compound", body: "Grow capital, build reputation, unlock larger allocations. The system rewards execution — not promises." },
          ].map((c, i) => (
            <div key={i} className="play-card" style={{ padding: "40px" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#333", letterSpacing: "0.1em", marginBottom: 24 }}>{c.num}</div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 400, color: "#e8e6e0", marginBottom: 16 }}>{c.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#666", lineHeight: 1.8 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE PLAYS */}
      <section id="plays" style={{ padding: "100px 80px", borderTop: "1px solid #1a1a1a" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48 }}>
          <div>
            <div className="section-label">Live plays</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 42, fontWeight: 300, letterSpacing: "-0.02em", color: "#e8e6e0" }}>Real operators. Real returns.</h2>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[["all", "All"], ["arbitrage", "Arbitrage"], ["digital", "Digital"], ["service", "Service"]].map(([cat, label]) => (
              <button key={cat} className={`filter-btn ${filterCat === cat ? "active" : ""}`} onClick={() => setFilterCat(cat)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {filteredPlays.map((p) => {
            const roi = Math.round((p.returnAmt / p.capital) * 100);
            return (
              <div key={p.id} className="play-card" onMouseEnter={() => setHoveredPlay(p.id)} onMouseLeave={() => setHoveredPlay(null)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#444" }}>#{p.id}</span>
                  <span style={{ fontSize: 11, letterSpacing: "0.08em", padding: "3px 10px", border: `1px solid ${categoryColors[p.category]}33`, color: categoryColors[p.category], fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase" }}>{p.category}</span>
                </div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 500, color: "#e8e6e0", marginBottom: 8 }}>{p.type}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#555", marginBottom: 24, lineHeight: 1.6 }}>{p.desc}</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", marginBottom: 4, letterSpacing: "0.05em" }}>CAPITAL IN</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "#e8e6e0" }}>€{p.capital}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", marginBottom: 4, letterSpacing: "0.05em" }}>RETURN</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: "#10b981" }}>+€{p.returnAmt}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", marginBottom: 4, letterSpacing: "0.05em" }}>DURATION</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#888" }}>{p.duration}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", marginBottom: 4, letterSpacing: "0.05em" }}>ROI</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color: "#10b981" }}>{roi}%</div>
                  </div>
                </div>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: hoveredPlay === p.id ? `${Math.min(roi, 100)}%` : "0%", background: "#10b981" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555" }}>@{p.operator.toLowerCase()}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#444" }}>{p.exit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section id="leaderboard" style={{ padding: "100px 80px", borderTop: "1px solid #1a1a1a" }}>
        <div className="section-label">Leaderboard</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 42, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 16, color: "#e8e6e0" }}>Ranked by judgment, not just profit.</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", marginBottom: 48, maxWidth: 540 }}>
          Foundry Score weights ROI, consistency, reliability, risk efficiency, and capital preservation. Gamblers don't make the board.
        </p>

        <div style={{ border: "1px solid #1a1a1a" }}>
          <div className="leaderboard-row" style={{ borderBottom: "1px solid #222", padding: "10px 20px" }}>
            {["#", "Operator", "ROI", "Reliability", "Plays", "Score"].map((h, i) => (
              <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444", letterSpacing: "0.1em", textTransform: "uppercase" }}>{h}</div>
            ))}
          </div>
          {leaderboard.map((op, i) => (
            <div key={op.handle} className="leaderboard-row" style={{ padding: "14px 20px" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#444" }}>{i + 1}</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, color: i === 0 ? "#f59e0b" : "#e8e6e0" }}>@{op.handle}</span>
              <span className="green" style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}>+{op.roi}%</span>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#888" }}>{op.reliability}</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${op.reliability}%`, background: "#10b981" }} /></div>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, color: "#666" }}>{op.plays}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, color: i === 0 ? "#f59e0b" : "#e8e6e0" }}>{op.score}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, padding: "2px 8px", border: `1px solid ${i === 0 ? "#f59e0b44" : "#1e1e1e"}`, color: i === 0 ? "#f59e0b" : "#555" }}>{op.tier}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section id="tiers" style={{ padding: "100px 80px", borderTop: "1px solid #1a1a1a" }}>
        <div className="section-label">Tiers</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 42, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 64, color: "#e8e6e0" }}>The more you prove, the more we fund.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 2 }}>
          {tiers.map((t) => (
            <div key={t.name} className="tier-card" style={{ position: "relative", overflow: "hidden" }}>
              <div style={{ width: 3, height: "100%", position: "absolute", left: 0, top: 0, background: t.color, opacity: 0.6 }} />
              <div style={{ paddingLeft: 16 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: t.color, letterSpacing: "0.1em", marginBottom: 12 }}>{t.name.toUpperCase()}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 24, fontWeight: 500, color: "#e8e6e0", marginBottom: 8 }}>{t.alloc}</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555", lineHeight: 1.6, marginBottom: 20 }}>{t.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {t.perks.map((perk, i) => (
                    <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#666", display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: t.color, fontSize: 10 }}>→</span> {perk}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CULTURE */}
      <section style={{ padding: "100px 80px", borderTop: "1px solid #1a1a1a", background: "#0d0d0d" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
          <div>
            <div className="section-label">Who this is for</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 42, fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 32, color: "#e8e6e0" }}>
              Resourceful people.<br />Full stop.
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.9, marginBottom: 24 }}>
              Foundry is built for builders, arbitrage thinkers, and operators. People who notice inefficiencies. People who act on them.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.9 }}>
              We care more about execution than credentials. More about judgment than polish.
            </p>
          </div>
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#10b981", letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>We fund</div>
              {["Arbitrage thinkers", "Builders with hustle", "Operators with instinct", "People who make things happen"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #1a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888" }}>
                  <span className="green">✓</span> {item}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#666", letterSpacing: "0.1em", marginBottom: 16, textTransform: "uppercase" }}>We don't fund</div>
              {["Gamblers", "Fake gurus", "People looking for a salary", "Reckless speculators"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #1a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555" }}>
                  <span style={{ color: "#555" }}>✕</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* APPLICATION */}
      <section id="apply" style={{ padding: "100px 80px", borderTop: "1px solid #1a1a1a" }}>
        {submitted ? (
          <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }} className="fade-up">
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 40, color: "#10b981", marginBottom: 32 }}>✓</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 42, fontWeight: 300, letterSpacing: "-0.02em", color: "#e8e6e0", marginBottom: 16 }}>Application received.</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.8, marginBottom: 48 }}>
              Foundry reviews applications continuously. Strong operators may receive immediate trial allocations. You'll hear from us.
            </p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button className="btn-secondary btn-sm" onClick={() => scrollTo("plays")}>View live plays</button>
              <button className="btn-secondary btn-sm" onClick={() => scrollTo("leaderboard")}>See leaderboard</button>
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <div className="section-label">Application</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 42, fontWeight: 300, letterSpacing: "-0.02em", color: "#e8e6e0", marginBottom: 12 }}>Apply for capital access</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", marginBottom: 48, lineHeight: 1.7 }}>
              Every application is reviewed manually. We look for resourcefulness, judgment, creativity, and execution ability.
            </p>

            {/* Progress */}
            <div style={{ display: "flex", gap: 4, marginBottom: 48 }}>
              {formSteps.map((s, i) => (
                <div key={i} style={{ flex: 1, height: 2, background: i <= formStep ? "#10b981" : "#1e1e1e", transition: "background 0.3s" }} />
              ))}
            </div>

            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#555", letterSpacing: "0.1em", marginBottom: 24 }}>
              {String(formStep + 1).padStart(2, "0")} / {String(formSteps.length).padStart(2, "0")} — {formSteps[formStep].title}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 24, marginBottom: 40 }}>
              {formSteps[formStep].fields.map((f) => (
                <div key={f.key}>
                  <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888", display: "block", marginBottom: 10, lineHeight: 1.6 }}>{f.label}</label>
                  {f.type === "textarea" ? (
                    <textarea className="input-field" rows={5} placeholder={f.placeholder} value={formData[f.key] || ""} onChange={e => handleFormChange(f.key, e.target.value)} />
                  ) : (
                    <input className="input-field" type={f.type} placeholder={f.placeholder} value={formData[f.key] || ""} onChange={e => handleFormChange(f.key, e.target.value)} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {formStep > 0 ? (
                <button className="btn-secondary btn-sm" onClick={() => setFormStep(p => p - 1)}>← Back</button>
              ) : <div />}
              <button
                className="btn-primary btn-sm"
                onClick={() => formStep < formSteps.length - 1 ? setFormStep(p => p + 1) : setSubmitted(true)}
              >
                {formStep < formSteps.length - 1 ? "Continue →" : "Submit application"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "40px 80px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.15em", color: "#444" }}>FOUNDRY</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#444" }}>Capital allocation for high-agency operators.</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#333" }}>© 2025</span>
      </footer>
    </div>
  );
}
