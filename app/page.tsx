"use client";

import { useState, useEffect, useRef } from "react";

const plays = [
  { id: "0182", type: "Furniture Flip", desc: "Bought office chairs from liquidation auction", capital: 240, exit: "Resold to coworking space", duration: "48h", returnAmt: 410, operator: "Mason", category: "arbitrage" },
  { id: "0221", type: "Lead Generation", desc: "Built a lead funnel for local dentists", capital: 80, exit: "Sold lead package", duration: "6d", returnAmt: 620, operator: "Ava", category: "digital" },
  { id: "0318", type: "Ticket Flip", desc: "Bought underpriced festival passes at presale", capital: 300, exit: "Resold via classifieds", duration: "72h", returnAmt: 190, operator: "Lewis", category: "arbitrage" },
  { id: "0401", type: "Print on Demand", desc: "Seasonal merch drop via Printful", capital: 60, exit: "Shopify store", duration: "5d", returnAmt: 290, operator: "Priya", category: "digital" },
  { id: "0455", type: "Pallet Resale", desc: "Bought returned electronics pallet, listed individually", capital: 500, exit: "eBay listings", duration: "9d", returnAmt: 740, operator: "Rory", category: "arbitrage" },
  { id: "0501", type: "Job Brokering", desc: "Booked cleaning jobs, managed the margin", capital: 120, exit: "3 jobs completed", duration: "4d", returnAmt: 210, operator: "Niamh", category: "service" },
];

const leaderboard = [
  { handle: "alexm", tier: "Strategist", roi: 214, reliability: 96, plays: 18, score: 94 },
  { handle: "ava", tier: "Operator", roi: 188, reliability: 93, plays: 12, score: 89 },
  { handle: "mason", tier: "Strategist", roi: 172, reliability: 91, plays: 15, score: 87 },
  { handle: "priya", tier: "Operator", roi: 143, reliability: 88, plays: 9, score: 81 },
  { handle: "lewis", tier: "Scout", roi: 127, reliability: 85, plays: 6, score: 76 },
];

const tiers = [
  { name: "Scout", alloc: "€500", color: "#6b7280", desc: "Your first play." },
  { name: "Operator", alloc: "€1,250", color: "#10b981", desc: "Consistent. Creative." },
  { name: "Strategist", alloc: "€2,500", color: "#f59e0b", desc: "You have a system." },
  { name: "Partner", alloc: "€10,000", color: "#8b5cf6", desc: "Proven track record." },
  { name: "Syndicate", alloc: "Custom", color: "#ef4444", desc: "You are the strategy." },
];

const categoryColors: Record<string, string> = { arbitrage: "#10b981", digital: "#6366f1", service: "#f59e0b" };

function Counter({ end, prefix = "", suffix = "" }: { end: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoveredPlay, setHoveredPlay] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const filteredPlays = filterCat === "all" ? plays : plays.filter(p => p.category === filterCat);

  return (
    <div style={{ background: "#0a0a0a", color: "#e8e6e0", minHeight: "100vh", fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #111; } ::-webkit-scrollbar-thumb { background: #333; }
        .btn-primary { background: #e8e6e0; color: #0a0a0a; border: none; padding: 12px 24px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; border-radius: 2px; }
        .btn-primary:hover { background: #fff; }
        .btn-secondary { background: transparent; color: #e8e6e0; border: 1px solid #333; padding: 12px 24px; font-size: 13px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; border-radius: 2px; }
        .btn-secondary:hover { border-color: #666; }
        .play-card { background: #111; border: 1px solid #1e1e1e; padding: 20px; transition: all 0.2s; }
        .play-card:hover { border-color: #333; background: #141414; }
        .section-label { font-size: 11px; letter-spacing: 0.15em; color: #555; text-transform: uppercase; font-family: 'DM Sans', sans-serif; margin-bottom: 12px; }
        .progress-bar { height: 2px; background: #1e1e1e; margin-top: 8px; }
        .progress-fill { height: 2px; transition: width 1s ease; }
        .filter-btn { background: transparent; border: 1px solid #222; color: #666; padding: 6px 14px; font-size: 11px; letter-spacing: 0.08em; cursor: pointer; font-family: 'DM Sans', sans-serif; text-transform: uppercase; transition: all 0.15s; border-radius: 2px; }
        .filter-btn.active { border-color: #10b981; color: #10b981; }
        .hamburger { background: none; border: 1px solid #333; color: #e8e6e0; width: 40px; height: 40px; cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; border-radius: 2px; }
        .mobile-menu { position: fixed; top: 56px; left: 0; right: 0; background: #0a0a0a; border-bottom: 1px solid #1a1a1a; padding: 8px 24px 16px; z-index: 99; }
        .nav-link-mob { color: #666; font-size: 14px; cursor: pointer; display: block; padding: 12px 0; border-bottom: 1px solid #1a1a1a; font-family: 'DM Sans', sans-serif; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; }
        .grid-5 { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px solid #1e1e1e; padding-top: 40px; }
        .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .section-pad { padding: 80px 80px; }
        .hero-pad { padding: 120px 80px 80px; }
        @media (max-width: 768px) {
          .grid-3 { grid-template-columns: 1fr; }
          .grid-5 { grid-template-columns: 1fr 1fr; }
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .two-col { grid-template-columns: 1fr; gap: 40px; }
          .section-pad { padding: 60px 24px; }
          .hero-pad { padding: 90px 24px 60px; }
          .desktop-nav { display: none !important; }
          .mobile-hamburger { display: flex !important; }
        }
        @media (min-width: 769px) {
          .mobile-hamburger { display: none !important; }
          .mobile-menu { display: none !important; }
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        .cursor { animation: blink 1.1s infinite; }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #1a1a1a", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 15, fontWeight: 500, letterSpacing: "0.2em", color: "#e8e6e0" }}>FOUNDRY</span>
        <div className="desktop-nav" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[["how", "How it works"], ["plays", "Real examples"], ["leaderboard", "Leaderboard"]].map(([id, label]) => (
            <span key={id} style={{ color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }} onClick={() => scrollTo(id)}>{label}</span>
          ))}
          <button className="btn-primary" style={{ padding: "8px 20px", fontSize: 12 }} onClick={() => window.location.href = "/apply/v2"}>Apply — it's free</button>
        </div>
        <button className="hamburger mobile-hamburger" onClick={() => setMenuOpen(o => !o)}>{menuOpen ? "✕" : "☰"}</button>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          {[["how", "How it works"], ["plays", "Real examples"], ["leaderboard", "Leaderboard"]].map(([id, label]) => (
            <span key={id} className="nav-link-mob" onClick={() => scrollTo(id)}>{label}</span>
          ))}
          <button className="btn-primary" style={{ width: "100%", marginTop: 16, padding: "12px" }} onClick={() => window.location.href = "/apply/v2"}>Apply now — it's free</button>
        </div>
      )}

      {/* HERO */}
      <section id="home" className="hero-pad" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 70% 30%, rgba(16,185,129,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 860 }}>
          <div className="section-label" style={{ marginBottom: 28 }}>
            <span style={{ color: "#10b981" }}>●</span> Platform open — 48 people currently hustling
          </div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(38px, 6vw, 72px)", fontWeight: 300, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 28, color: "#e8e6e0" }}>
            We give you money<br />
            to <span style={{ color: "#10b981" }}>make money</span><span className="cursor" style={{ color: "#10b981" }}>_</span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(15px, 2vw, 19px)", color: "#888", lineHeight: 1.9, maxWidth: 580, marginBottom: 16 }}>
            We give you <strong style={{ color: "#e8e6e0" }}>€500 a week.</strong> Buy something cheap and sell it for more. Do a job. Build something quick and sell it. Whatever your hustle is — go make it grow. Do well and we give you more.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(14px, 1.8vw, 17px)", color: "#666", lineHeight: 1.9, maxWidth: 540, marginBottom: 48 }}>
  Return the €500 when you're done. Keep your cut of whatever you made on top. Do it again with more next time. <span style={{ color: "#888" }}>This fits around a full time job, college, or anything else — a small allocation might just be a Saturday morning.</span>
</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 60 }}>
            <button className="btn-primary" style={{ fontSize: 14, padding: "13px 28px" }} onClick={() => window.location.href = "/apply/v2"}>Apply now — it's free</button>
            <button className="btn-secondary" onClick={() => scrollTo("plays")}>See what people are making →</button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            {[
              { label: "Given out this month", sub: "real money, not vouchers", value: 12430, prefix: "€" },
              { label: "People currently hustling", sub: "with our money right now", value: 48 },
              { label: "Making a profit", sub: "making more than they started with", value: 71, suffix: "%" },
              { label: "Quick flips completed", sub: "jobs done, money made", value: 214 },
            ].map((s, i) => (
              <div key={i} style={{ padding: "24px 24px 24px 0", borderRight: i < 3 ? "1px solid #1a1a1a" : "none", paddingLeft: i > 0 ? 24 : 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 500, color: "#e8e6e0", marginBottom: 4 }}>
                  <Counter end={s.value} prefix={s.prefix} suffix={s.suffix} />
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#555", marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#333" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="section-pad" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="section-label">How it works</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 16, color: "#e8e6e0" }}>
          Short, sharp, simple.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", marginBottom: 48, maxWidth: 560, lineHeight: 1.8 }}>
          This isn't long-term investment. It's not a job. It's a week-by-week hustle. You get money, you make it work, you return it and keep your profit. That's it.
        </p>
        <div className="grid-3">
          {[
            { num: "01", title: "Apply", body: "Tell us what you'd do with €500 in 7 days. Buy and flip something? Offer a service locally? Build something fast and sell it? Show us your thinking. No CV. No experience needed." },
            { num: "02", title: "Get the money", body: "We send €500 straight to your account. You've got 7 days. Go do your thing — whatever hustle you pitched us. We're here if you need to update us." },
            { num: "03", title: "Return and keep your cut", body: "Send back the €500 when you're done. Keep your cut of whatever profit you made on top. Do it again with more money next time. Simple as that." },
          ].map((c, i) => (
            <div key={i} className="play-card" style={{ padding: "32px" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#333", letterSpacing: "0.1em", marginBottom: 20 }}>{c.num}</div>
              <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 500, color: "#e8e6e0", marginBottom: 12 }}>{c.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#666", lineHeight: 1.8 }}>{c.body}</p>
            </div>
          ))}
        </div>

        {/* Example hustles */}
        <div style={{ marginTop: 32, background: "#111", border: "1px solid #1e1e1e", padding: "28px 32px" }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Example hustles people are running</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {[
              "Buy furniture cheap on DoneDeal, sell for more",
              "Book cleaning jobs, hire someone cheaper to do them",
              "Buy festival tickets at presale, resell at market price",
              "Build an AI service on Fiverr with a €20 tool subscription",
              "Buy a liquidation pallet, sell items individually on eBay",
              "Run Facebook ads for a local business, charge per lead",
              "Buy in bulk, split and sell at retail",
              "Find a broken appliance, fix it, flip it",
            ].map((item, i) => (
              <div key={i} style={{ background: "#0e0e0e", border: "1px solid #1e1e1e", padding: "8px 16px", fontSize: 13, color: "#666", borderRadius: 2 }}>
                → {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE PLAYS */}
      <section id="plays" className="section-pad" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="section-label">Real examples</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 12, color: "#e8e6e0" }}>
          Real people. Real flips. Real money made.
        </h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", marginBottom: 32, maxWidth: 500, lineHeight: 1.7 }}>
          Every one of these was done in under 10 days with money we gave them. This is what we're backing.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {[["all", "All"], ["arbitrage", "Flipping"], ["digital", "Digital"], ["service", "Services"]].map(([cat, label]) => (
            <button key={cat} className={`filter-btn ${filterCat === cat ? "active" : ""}`} onClick={() => setFilterCat(cat)}>{label}</button>
          ))}
        </div>
        <div className="grid-3">
          {filteredPlays.map((p) => {
            const roi = Math.round((p.returnAmt / p.capital) * 100);
            return (
              <div key={p.id} className="play-card" onMouseEnter={() => setHoveredPlay(p.id)} onMouseLeave={() => setHoveredPlay(null)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#444" }}>#{p.id}</span>
                  <span style={{ fontSize: 10, letterSpacing: "0.08em", padding: "3px 8px", border: `1px solid ${categoryColors[p.category]}33`, color: categoryColors[p.category], fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase", borderRadius: 2 }}>{p.category}</span>
                </div>
                <h3 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: "#e8e6e0", marginBottom: 6 }}>{p.type}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 }}>{p.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {[
                    ["STARTED WITH", `€${p.capital}`, "#e8e6e0"],
                    ["MADE BACK", `+€${p.returnAmt}`, "#10b981"],
                    ["TIME TAKEN", p.duration, "#888"],
                    ["PROFIT", `${roi}%`, "#10b981"],
                  ].map(([label, val, color]) => (
                    <div key={label}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#444", marginBottom: 3, letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, color }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: hoveredPlay === p.id ? `${Math.min(roi, 100)}%` : "0%", background: "#10b981" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#555" }}>@{p.operator.toLowerCase()}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#444" }}>{p.exit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LEADERBOARD */}
      <section id="leaderboard" className="section-pad" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="section-label">Leaderboard</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 12, color: "#e8e6e0" }}>The more you make, the more we back you.</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", marginBottom: 32, maxWidth: 500 }}>
          We don't just rank by profit. We reward people who are consistent and reliable. Gamblers don't make this board.
        </p>
        <div style={{ border: "1px solid #1a1a1a", overflowX: "auto" }}>
          <div style={{ minWidth: 400 }}>
            <div style={{ borderBottom: "1px solid #222", padding: "10px 16px", display: "grid", gridTemplateColumns: "24px 1fr 70px 70px 50px 60px", gap: 8, alignItems: "center" }}>
              {["#", "Operator", "Profit", "Reliability", "Plays", "Score"].map((h, i) => (
                <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#444", letterSpacing: "0.12em", textTransform: "uppercase" }}>{h}</div>
              ))}
            </div>
            {leaderboard.map((op, i) => (
              <div key={op.handle} style={{ borderBottom: "1px solid #141414", padding: "12px 16px", display: "grid", gridTemplateColumns: "24px 1fr 70px 70px 50px 60px", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#444" }}>{i + 1}</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 500, fontSize: 13, color: i === 0 ? "#f59e0b" : "#e8e6e0" }}>@{op.handle}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#10b981" }}>+{op.roi}%</span>
                <div><div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#888" }}>{op.reliability}%</div></div>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#666" }}>{op.plays}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: i === 0 ? "#f59e0b" : "#e8e6e0" }}>{op.score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIERS */}
      <section className="section-pad" style={{ borderTop: "1px solid #1a1a1a" }}>
        <div className="section-label">Levels</div>
        <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 12, color: "#e8e6e0" }}>Start with €500. Work your way up.</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555", marginBottom: 40, maxWidth: 480, lineHeight: 1.7 }}>
          Every time you complete a play and return the money, you build your track record. Do it consistently and we back you with more.
        </p>
        <div className="grid-5">
          {tiers.map((t) => (
            <div key={t.name} style={{ background: "#111", border: "1px solid #1e1e1e", padding: "20px 16px", position: "relative", overflow: "hidden" }}>
              <div style={{ width: 3, height: "100%", position: "absolute", left: 0, top: 0, background: t.color, opacity: 0.6 }} />
              <div style={{ paddingLeft: 12 }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: t.color, letterSpacing: "0.1em", marginBottom: 10 }}>{t.name.toUpperCase()}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 500, color: "#e8e6e0", marginBottom: 6 }}>{t.alloc}</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#555", lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CULTURE */}
      <section className="section-pad" style={{ borderTop: "1px solid #1a1a1a", background: "#0d0d0d" }}>
        <div className="two-col">
          <div>
            <div className="section-label">Who this is for</div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 24, color: "#e8e6e0" }}>
              If you're smart and hungry, we want to back you.
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.9, marginBottom: 16 }}>
              You don't need a degree. You don't need experience. You need an idea for what to do with €500 in the next 7 days.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.9, marginBottom: 16 }}>
              Buy furniture cheap and sell it for more. Book a cleaning job and manage the margin. Build an AI service and sell it on Fiverr. Whatever you're good at — we'll back it.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", lineHeight: 1.9 }}>
              19 or 60 — doesn't matter. If you can make money move in a week, we want to meet you.
            </p>
          </div>
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#10b981", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>We back</div>
              {["People who spot deals others walk past", "Anyone who can make €500 work harder in a week", "Part-time hustlers and full-time operators", "People who figure things out and get them done"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #1a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888" }}>
                  <span style={{ color: "#10b981", flexShrink: 0 }}>✓</span> {item}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#666", letterSpacing: "0.1em", marginBottom: 12, textTransform: "uppercase" }}>Not for</div>
              {["People who want easy money without doing anything", "Get-rich-quick merchants", "Anyone who talks more than they do"].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid #1a1a1a", fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#555" }}>
                  <span style={{ flexShrink: 0 }}>✕</span> {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad" style={{ borderTop: "1px solid #1a1a1a", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="section-label" style={{ marginBottom: 16 }}>Ready?</div>
          <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 300, letterSpacing: "-0.02em", color: "#e8e6e0", marginBottom: 16 }}>
            Back yourself. We'll back you too.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: "#666", marginBottom: 36, lineHeight: 1.8 }}>
            Apply in minutes. No CV. No experience needed. Just show us what you'd do with €500 in 7 days.
          </p>
          <button className="btn-primary" style={{ fontSize: 15, padding: "14px 36px" }} onClick={() => window.location.href = "/apply/v2"}>
            Apply now — it's free
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid #1a1a1a", padding: "32px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, letterSpacing: "0.15em", color: "#444" }}>FOUNDRY</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#444" }}>We give you money to make money.</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#333" }}>© 2026</span>
      </footer>
    </div>
  );
}
