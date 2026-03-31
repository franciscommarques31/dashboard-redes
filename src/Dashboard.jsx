import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(2).replace(/\.?0+$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.?0+$/, "") + "K";
  return num.toLocaleString("pt-PT");
};

const fmtRaw = (n) => {
  if (n === null || n === undefined || n === "") return "—";
  const num = Number(n);
  if (isNaN(num)) return "—";
  return num.toLocaleString("pt-PT");
};

const pctLabel = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(v);
  if (isNaN(n)) return "";
  return (n >= 0 ? "+" : "") + n + "%";
};

const isPos = (v) => v.startsWith("+");

const today = () => new Date().toISOString().split("T")[0];

const monthKey = (dateStr) => dateStr.slice(0, 7);

const MONTH_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WD_LONG  = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
const WD_SHORT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

const PLATFORMS = [
  { id: "facebook",  label: "FACEBOOK",   bg: "#1877F2" },
  { id: "instagram", label: "INSTAGRAM",  bg: "#E1306C" },
  { id: "tiktok",    label: "TIK TOK",    bg: "#222222" },
  { id: "twitter",   label: "X(TWITTER)", bg: "#000000" },
];

const emptyP = () => ({
  views:"", viewsPct:"", reach:"", reachPct:"",
  inter:"", interPct:"", profileV:"", profilePct:"",
  clicks:"", clicksPct:"", followers:"", followersPct:"",
});

const emptyEntry = () => ({
  date: today(),
  facebook: emptyP(),
  instagram: emptyP(),
  tiktok: emptyP(),
  twitter: emptyP(),
  topPosts: {
    facebook: Array.from({ length: 10 }, () => ({ title: "", views: "" })),
    instagram: Array.from({ length: 10 }, () => ({ title: "", views: "" }))
  }
});

const SEED = [{
  date: "2026-03-22",
  facebook:  { views:"131045", viewsPct:"17", reach:"65919",   reachPct:"3",  inter:"1309",  interPct:"9",  profileV:"371",  profilePct:"13", clicks:"225", clicksPct:"", followers:"67", followersPct:"-23" },
  instagram: { views:"2747782",viewsPct:"13", reach:"1682831", reachPct:"20", inter:"57730", interPct:"4",  profileV:"2739", profilePct:"",   clicks:"237", clicksPct:"", followers:"",   followersPct:"" },
  tiktok:    emptyP(),
  twitter:   { views:"2217",   viewsPct:"-23",reach:"",        reachPct:"",   inter:"128",   interPct:"10", profileV:"2",    profilePct:"",   clicks:"",    clicksPct:"", followers:"",   followersPct:"" },
  note:"",
}];

const calcMonthTotals = (history, ym) => {
  const entries = history.filter(e => monthKey(e.date) === ym);
  const sum = (key) => entries.reduce((s, e) =>
    s + PLATFORMS.reduce((ps, p) => ps + (Number(e[p.id]?.[key]) || 0), 0), 0);
  return {
    views:     sum("views"),
    reach:     sum("reach"),
    inter:     sum("inter"),
    profileV:  sum("profileV"),
    clicks:    sum("clicks"),
    followers: sum("followers"),
    days:      entries.length,
  };
};

const buildWA = (entry, monthTotals) => {
  const d = new Date(entry.date + "T12:00:00");
  const dateStr = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} · ${WD_LONG[d.getDay()]}`;
  const sum = (k) => PLATFORMS.reduce((s, p) => s + (Number(entry[p.id]?.[k]) || 0), 0);
  const r = (v, pct) => { const p = pctLabel(pct); return `*${fmtRaw(v)}*${p ? `  (${p})` : ""}`; };

  let t = `📊 *RELATÓRIO DIÁRIO · 24H*\n📅 *${dateStr}*\n\n`;
  const icons = { facebook:"🔵", instagram:"🔴", tiktok:"⚫", twitter:"🔷" };

  PLATFORMS.forEach(p => {
    const pd = entry[p.id];
    if (!pd?.views && !pd?.inter && !pd?.reach) return;
    t += `${icons[p.id]} *${p.label}*\n`;
    if (pd.views)     t += `  👁 Visualizações: ${r(pd.views, pd.viewsPct)}\n`;
    if (pd.reach)     t += `  📡 Alcance: ${r(pd.reach, pd.reachPct)}\n`;
    if (pd.inter)     t += `  💬 Interacções: ${r(pd.inter, pd.interPct)}\n`;
    if (pd.profileV)  t += `  👤 Visitas ao Perfil: ${r(pd.profileV, pd.profilePct)}\n`;
    if (pd.clicks)    t += `  🔗 Cliques em Ligações: ${r(pd.clicks, pd.clicksPct)}\n`;
    if (pd.followers) t += `  ➕ Novos Seguidores: ${r(pd.followers, pd.followersPct)}\n`;
    t += "\n";
  });

  t += `━━━━━━━━━━━━━\n📈 *TOTAL DIÁRIO*\n`;
  t += `  👁 Visualizações: *${fmtRaw(sum("views"))}*\n`;
  t += `  📡 Alcance: *${fmtRaw(sum("reach"))}*\n`;
  t += `  💬 Interacções: *${fmtRaw(sum("inter"))}*\n`;
  t += `  👤 Visitas ao Perfil: *${fmtRaw(sum("profileV"))}*\n`;
  t += `  🔗 Cliques em Ligações: *${fmtRaw(sum("clicks"))}*\n`;
  t += `  ➕ Novos Seguidores: *${fmtRaw(sum("followers"))}*\n`;

  if (monthTotals && monthTotals.days > 0) {
    const mn = d.getMonth();
    const yr = d.getFullYear();
    t += `\n━━━━━━━━━━━━━\n🗓 *TOTAL MENSAL · ${MONTH_PT[mn].toUpperCase()} ${yr}* _(${monthTotals.days} dias)_\n`;
    t += `  👁 Visualizações: *${fmtRaw(monthTotals.views)}*\n`;
    t += `  📡 Alcance: *${fmtRaw(monthTotals.reach)}*\n`;
    t += `  💬 Interacções: *${fmtRaw(monthTotals.inter)}*\n`;
    t += `  👤 Visitas ao Perfil: *${fmtRaw(monthTotals.profileV)}*\n`;
    t += `  🔗 Cliques: *${fmtRaw(monthTotals.clicks)}*\n`;
    t += `  ➕ Seguidores: *${fmtRaw(monthTotals.followers)}*\n`;
  }

  if (entry.note) t += `\n💡 _${entry.note}_`;
  return t;
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  app:    { fontFamily:"'DM Sans',sans-serif", minHeight:"100vh", background:"#FFFFFF", color:"#1A1A1A" },
  topbar: { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", borderBottom:"0.5px solid rgba(0,0,0,0.1)", position:"sticky", top:0, background:"#FFFFFF", zIndex:100 },
  logoCircle: { width:34, height:34, borderRadius:"50%", background:"#C9A000", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:10, color:"#FFFFFF" },
  logoName: { fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:13, color:"#1A1A1A", letterSpacing:"-0.3px" },
  nav:    { display:"flex", borderBottom:"0.5px solid rgba(0,0,0,0.1)", padding:"0 18px" },
  navBtn: (a) => ({ padding:"10px 14px", fontSize:12, fontWeight:500, background:"none", border:"none", color: a ? "#C9A000" : "#444444", borderBottom: a ? "2px solid #C9A000" : "2px solid transparent", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }),
  body:   { padding:"16px 16px 80px" },
  lbl:    { fontSize:10, fontWeight:500, letterSpacing:"0.1em", textTransform:"uppercase", color:"#555555", marginBottom:8, marginTop:20, display:"block" },
  card:   { background:"#F7F7F7", border:"0.5px solid rgba(0,0,0,0.08)", borderRadius:12, padding:"14px 16px", marginBottom:10 },
  tbl:    { background:"#F7F7F7", border:"0.5px solid rgba(0,0,0,0.08)", borderRadius:12, marginBottom:10, overflow:"hidden" },
  tblHead:{ display:"grid", background:"rgba(0,0,0,0.05)", borderBottom:"0.5px solid rgba(0,0,0,0.07)", padding:"7px 12px", gap:4, alignItems:"center" },
  tblRow: (last) => ({ display:"grid", padding:"9px 12px", gap:4, alignItems:"center", borderBottom: last ? "none" : "0.5px solid rgba(0,0,0,0.05)" }),
  tblFoot:{ display:"grid", padding:"9px 12px", gap:4, alignItems:"center", background:"rgba(201,160,0,0.08)", borderTop:"0.5px solid rgba(201,160,0,0.3)" },
  tblFootMonth: { display:"grid", padding:"9px 12px", gap:4, alignItems:"center", background:"rgba(18,160,80,0.07)", borderTop:"0.5px solid rgba(18,160,80,0.25)" },
  thCell: { fontSize:9, color:"#444444", fontWeight:600, letterSpacing:"0.07em", textTransform:"uppercase", textAlign:"right" },
  numCell:  { fontSize:12, fontFamily:"'Space Mono',monospace", color:"#333333", textAlign:"right" },
  numCellB: { fontSize:13, fontFamily:"'Space Mono',monospace", fontWeight:700, color:"#111111", textAlign:"right" },
  pctCell: (v) => ({ fontSize:10, textAlign:"right", color: !v ? "#999999" : isPos(v) ? "#1A8C4E" : "#CC3333" }),
  totalCell:      { fontSize:13, fontFamily:"'Space Mono',monospace", fontWeight:700, color:"#C9A000", textAlign:"right" },
  totalCellMonth: { fontSize:13, fontFamily:"'Space Mono',monospace", fontWeight:700, color:"#12A050", textAlign:"right" },
  btn: (v) => ({
    padding:"11px 16px", borderRadius:10, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:13, border:"none", transition:"all .15s",
    ...(v==="primary" ? { background:"#C9A000", color:"#FFFFFF" }
      : v==="green"   ? { background:"rgba(18,160,80,0.1)", color:"#12A050", border:"0.5px solid rgba(18,160,80,0.3)" }
      : v==="ghost"   ? { background:"rgba(0,0,0,0.05)", color:"#333333", border:"0.5px solid rgba(0,0,0,0.12)" }
      : v==="danger"  ? { background:"rgba(200,50,50,0.08)", color:"#CC3333", border:"0.5px solid rgba(200,50,50,0.2)" }
      :                 { background:"rgba(201,160,0,0.1)", color:"#C9A000", border:"0.5px solid rgba(201,160,0,0.3)" })
  }),
  input:   { width:"100%", background:"#FFFFFF", border:"0.5px solid rgba(0,0,0,0.15)", borderRadius:8, color:"#1A1A1A", fontSize:14, padding:"9px 11px", fontFamily:"'DM Sans',sans-serif", outline:"none", boxSizing:"border-box" },
  fldLbl:  { fontSize:10, color:"#555555", marginBottom:4, display:"block", letterSpacing:"0.05em" },
};

// ─── FORM VIEW ────────────────────────────────────────────────────────────────
// IMPORTANTE: Este componente está FORA do App propositadamente.
// Se estivesse dentro (const FormView = () => ... dentro do App), o React
// recriava-o do zero a cada render, fazendo os inputs perderem o foco.
function FormView({ editing, history, onSave, onCancel }) {
  const [entry, setEntry] = useState(() =>
    editing ? JSON.parse(JSON.stringify(editing)) : emptyEntry()
  );
  const [showPreview, setShowPreview] = useState(false);

  const setP = (pid, k, v) =>
    setEntry(p => ({ ...p, [pid]: { ...p[pid], [k]: v } }));

  const setTopPost = (platform, index, field, value) =>
    setEntry(prev => {
      const tp = prev.topPosts[platform].map((p, i) =>
        i === index ? { ...p, [field]: value } : p
      );
      return { ...prev, topPosts: { ...prev.topPosts, [platform]: tp } };
    });

  const previewHistory = (() => {
    const idx = history.findIndex(e => e.date === entry.date);
    if (idx >= 0) { const n = [...history]; n[idx] = entry; return n; }
    return [...history, entry];
  })();
  const previewMT = calcMonthTotals(previewHistory, monthKey(entry.date));

  return (
    <div style={S.body}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button style={{ ...S.btn("ghost"), padding:"8px 14px" }} onClick={onCancel}>← Voltar</button>
        <div>
          <div style={{ fontSize:15, fontWeight:600, color:"#1A1A1A" }}>{editing ? "Editar registo" : "Novo registo"}</div>
          <div style={{ fontSize:11, color:"#666666" }}>Preenche os dados do dia</div>
        </div>
      </div>

      <label style={S.fldLbl}>DATA</label>
      <input
        type="date"
        value={entry.date}
        onChange={e => setEntry(p => ({ ...p, date: e.target.value }))}
        style={{ ...S.input, maxWidth:200, marginBottom:22 }}
      />

      {PLATFORMS.map(p => (
        <div key={p.id} style={{ marginBottom:22 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12, paddingBottom:8, borderBottom:"0.5px solid rgba(0,0,0,0.1)" }}>
            <div style={{ width:9, height:9, borderRadius:"50%", background:p.bg }} />
            <span style={{ fontSize:12, fontWeight:600, color:"#1A1A1A", fontFamily:"'Space Mono',monospace" }}>{p.label}</span>
          </div>
          {[
            { mainKey:"views",     pctKey:"viewsPct",     label:"VISUALIZAÇÕES",       ph:"ex: 131045" },
            { mainKey:"reach",     pctKey:"reachPct",     label:"ALCANCE",             ph:"ex: 65919"  },
            { mainKey:"inter",     pctKey:"interPct",     label:"INTERACÇÕES",         ph:"ex: 1309"   },
            { mainKey:"profileV",  pctKey:"profilePct",   label:"VISITAS AO PERFIL",   ph:"ex: 371"    },
            { mainKey:"clicks",    pctKey:"clicksPct",    label:"CLIQUES EM LIGAÇÕES", ph:"ex: 225"    },
            { mainKey:"followers", pctKey:"followersPct", label:"NOVOS SEGUIDORES",    ph:"ex: 67"     },
          ].map(({ mainKey, pctKey, label, ph }) => (
            <div key={mainKey} style={{ display:"grid", gridTemplateColumns:"1fr 80px", gap:8, marginBottom:8 }}>
              <div>
                <label style={S.fldLbl}>{label}</label>
                <input
                  style={S.input}
                  type="number"
                  value={entry[p.id][mainKey]}
                  onChange={e => setP(p.id, mainKey, e.target.value)}
                  placeholder={ph}
                />
              </div>
              <div>
                <label style={S.fldLbl}>%</label>
                <input
                  style={S.input}
                  type="number"
                  value={entry[p.id][pctKey]}
                  onChange={e => setP(p.id, pctKey, e.target.value)}
                  placeholder="%"
                />
              </div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginBottom:22 }}>
        <label style={S.fldLbl}>TOP POSTS FACEBOOK</label>
        {entry.topPosts?.facebook?.map((post, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 100px", gap:8, marginBottom:6 }}>
            <input style={S.input} placeholder={`Post ${i+1} título`} value={post.title}
              onChange={e => setTopPost("facebook", i, "title", e.target.value)} />
            <input style={S.input} type="number" placeholder="views" value={post.views}
              onChange={e => setTopPost("facebook", i, "views", e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom:22 }}>
        <label style={S.fldLbl}>TOP POSTS INSTAGRAM</label>
        {entry.topPosts?.instagram?.map((post, i) => (
          <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 100px", gap:8, marginBottom:6 }}>
            <input style={S.input} placeholder={`Post ${i+1} título`} value={post.title}
              onChange={e => setTopPost("instagram", i, "title", e.target.value)} />
            <input style={S.input} type="number" placeholder="views" value={post.views}
              onChange={e => setTopPost("instagram", i, "views", e.target.value)} />
          </div>
        ))}
      </div>

      <div style={{ marginBottom:16, padding:"12px 14px", background:"rgba(18,160,80,0.05)", border:"0.5px solid rgba(18,160,80,0.2)", borderRadius:10 }}>
        <div style={{ fontSize:10, color:"#12A050", fontWeight:600, letterSpacing:"0.08em", marginBottom:8 }}>
          TOTAL MENSAL AUTOMÁTICO · {MONTH_PT[new Date(entry.date+"T12:00:00").getMonth()].toUpperCase()} {new Date(entry.date+"T12:00:00").getFullYear()} ({previewMT.days} dias)
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
          {[
            {l:"Visualizações",v:previewMT.views},{l:"Alcance",v:previewMT.reach},
            {l:"Interacções",v:previewMT.inter},{l:"Vis. Perfil",v:previewMT.profileV},
            {l:"Cliques",v:previewMT.clicks},{l:"Seguidores",v:previewMT.followers},
          ].map(m => (
            <div key={m.l}>
              <div style={{ fontSize:12, fontFamily:"'Space Mono',monospace", fontWeight:700, color:"#12A050" }}>
                {fmtRaw(m.v) === "—" ? "0" : fmtRaw(m.v)}
              </div>
              <div style={{ fontSize:9, color:"#888888" }}>{m.l}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize:10, color:"rgba(18,160,80,0.6)", marginTop:8 }}>
          Calculado automaticamente a partir dos dias registados neste mês.
        </div>
      </div>

      <button style={{ ...S.btn("ghost"), width:"100%", marginBottom:10, fontSize:12 }} onClick={() => setShowPreview(v => !v)}>
        {showPreview ? "▲ Ocultar" : "▼ Pré-visualizar"} mensagem WhatsApp
      </button>
      {showPreview && (
        <div style={{ ...S.card, background:"rgba(18,160,80,0.04)", border:"0.5px solid rgba(18,160,80,0.15)", marginBottom:14 }}>
          <pre style={{ fontSize:11, color:"#444444", whiteSpace:"pre-wrap", fontFamily:"'DM Sans',sans-serif", lineHeight:1.6, margin:0 }}>
            {buildWA(entry, previewMT)}
          </pre>
        </div>
      )}

      <button style={{ ...S.btn("primary"), width:"100%", padding:14 }} onClick={() => onSave(entry)}>
        Guardar registo
      </button>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [history, setHistory] = useState(() => {
    try { const s = localStorage.getItem("24h_v5"); return s ? JSON.parse(s) : SEED; } catch { return SEED; }
  });
  const [view, setView]       = useState("dashboard");
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    localStorage.setItem("24h_v5", JSON.stringify(history));
  }, [history]);

  const latest = history[history.length - 1];

  const saveEntry = (entry) => {
    setHistory(prev => {
      const idx = prev.findIndex(e => e.date === entry.date);
      if (idx >= 0) { const n = [...prev]; n[idx] = entry; return n; }
      return [...prev, entry].sort((a, b) => a.date.localeCompare(b.date));
    });
    setEditing(null);
    setView("dashboard");
  };

  const deleteEntry = (date) => {
    if (!window.confirm("Eliminar este registo?")) return;
    setHistory(prev => prev.filter(e => e.date !== date));
  };

  const openWA = (entry) => {
    const mt = calcMonthTotals(history, monthKey(entry.date));
    window.open(`https://wa.me/?text=${encodeURIComponent(buildWA(entry, mt))}`, "_blank");
  };

  const copyWA = async (entry) => {
    const mt = calcMonthTotals(history, monthKey(entry.date));
    try { await navigator.clipboard.writeText(buildWA(entry, mt)); alert("✅ Texto copiado! Cola no WhatsApp."); }
    catch { alert("Não foi possível copiar automaticamente."); }
  };

  const totals = (e) => ({
    views:     PLATFORMS.reduce((s, p) => s + (Number(e[p.id]?.views)     || 0), 0),
    reach:     PLATFORMS.reduce((s, p) => s + (Number(e[p.id]?.reach)     || 0), 0),
    inter:     PLATFORMS.reduce((s, p) => s + (Number(e[p.id]?.inter)     || 0), 0),
    profileV:  PLATFORMS.reduce((s, p) => s + (Number(e[p.id]?.profileV)  || 0), 0),
    clicks:    PLATFORMS.reduce((s, p) => s + (Number(e[p.id]?.clicks)    || 0), 0),
    followers: PLATFORMS.reduce((s, p) => s + (Number(e[p.id]?.followers) || 0), 0),
  });

  // ── DASHBOARD ──────────────────────────────────────────────────────────────
  const DashboardView = () => {
    if (!latest) return (
      <div style={{ ...S.body, textAlign:"center", paddingTop:60 }}>
        <div style={{ fontSize:36, marginBottom:12 }}>📊</div>
        <div style={{ fontSize:14, color:"#888888", marginBottom:24, lineHeight:1.7 }}>
          Sem dados ainda.<br />Começa por adicionar o primeiro registo.
        </div>
        <button style={{ ...S.btn("primary"), padding:"12px 28px" }} onClick={() => setView("form")}>+ Novo registo</button>
      </div>
    );

    const t  = totals(latest);
    const d  = new Date(latest.date + "T12:00:00");
    const ym = monthKey(latest.date);
    const mt = calcMonthTotals(history, ym);

    const fbPosts = (latest.topPosts?.facebook  || []).filter(p => p.title && p.views).sort((a,b) => Number(b.views)-Number(a.views));
    const igPosts = (latest.topPosts?.instagram || []).filter(p => p.title && p.views).sort((a,b) => Number(b.views)-Number(a.views));

    const dateStr    = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()} · ${WD_LONG[d.getDay()]}`;
    const monthLabel = `${MONTH_PT[d.getMonth()]} ${d.getFullYear()}`;
    const COL = "90px 1fr 34px 1fr 34px 1fr 34px 1fr 34px 1fr 1fr 34px";

    const PlatLabel = ({ p }) => (
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <div style={{ width:7, height:7, borderRadius:"50%", background:p.bg, flexShrink:0 }} />
        <span style={{ fontSize:10, fontWeight:600, color:"#1A1A1A" }}>{p.label}</span>
      </div>
    );

    return (
      <div style={S.body}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'Space Mono',monospace", fontSize:16, fontWeight:700, color:"#C9A000" }}>Último registo</div>
            <div style={{ fontSize:12, color:"#666666", marginTop:2 }}>{dateStr}</div>
          </div>
          <button style={{ ...S.btn("primary"), padding:"8px 14px", fontSize:12 }} onClick={() => { setEditing(null); setView("form"); }}>+ Novo dia</button>
        </div>

        <span style={S.lbl}>Resumo completo</span>
        <div style={{ ...S.tbl, overflowX:"auto" }}>
          <div style={{ minWidth:620 }}>
            <div style={{ ...S.tblHead, gridTemplateColumns:COL }}>
              <div />
              <div style={S.thCell}>Visualizações</div><div style={S.thCell}>%</div>
              <div style={S.thCell}>Alcance</div><div style={S.thCell}>%</div>
              <div style={S.thCell}>Interacções</div><div style={S.thCell}>%</div>
              <div style={S.thCell}>Perfil</div><div style={S.thCell}>%</div>
              <div style={S.thCell}>Cliques</div>
              <div style={S.thCell}>Seguidores</div><div style={S.thCell}>%</div>
            </div>
            {PLATFORMS.map(p => {
              const pd = latest[p.id];
              const vp = pctLabel(pd?.viewsPct), rp = pctLabel(pd?.reachPct);
              const ip = pctLabel(pd?.interPct),  pp = pctLabel(pd?.profilePct);
              const fp = pctLabel(pd?.followersPct);
              return (
                <div key={p.id} style={{ ...S.tblRow(false), gridTemplateColumns:COL }}>
                  <PlatLabel p={p} />
                  <div style={S.numCellB}>{pd?.views    ? fmtRaw(pd.views)    : "—"}</div><div style={S.pctCell(vp)}>{vp||"—"}</div>
                  <div style={S.numCell}> {pd?.reach    ? fmtRaw(pd.reach)    : "—"}</div><div style={S.pctCell(rp)}>{rp||"—"}</div>
                  <div style={S.numCell}> {pd?.inter    ? fmtRaw(pd.inter)    : "—"}</div><div style={S.pctCell(ip)}>{ip||"—"}</div>
                  <div style={S.numCell}> {pd?.profileV ? fmtRaw(pd.profileV) : "—"}</div><div style={S.pctCell(pp)}>{pp||"—"}</div>
                  <div style={S.numCell}> {pd?.clicks   ? fmtRaw(pd.clicks)   : "—"}</div>
                  <div style={S.numCell}> {pd?.followers || "—"}</div><div style={S.pctCell(fp)}>{fp||"—"}</div>
                </div>
              );
            })}
            <div style={{ ...S.tblFoot, gridTemplateColumns:COL }}>
              <div style={{ fontSize:10, fontWeight:700, color:"#C9A000" }}>TOTAL DIÁRIO</div>
              <div style={S.totalCell}>{fmtRaw(t.views)}</div><div />
              <div style={S.totalCell}>{fmtRaw(t.reach)}</div><div />
              <div style={S.totalCell}>{fmtRaw(t.inter)}</div><div />
              <div style={S.totalCell}>{fmtRaw(t.profileV)}</div><div />
              <div style={S.totalCell}>{fmtRaw(t.clicks)}</div>
              <div style={S.totalCell}>{fmtRaw(t.followers)}</div><div />
            </div>
            <div style={{ ...S.tblFootMonth, gridTemplateColumns:COL }}>
              <div>
                <div style={{ fontSize:9, fontWeight:700, color:"#12A050", letterSpacing:"0.05em" }}>MENSAL</div>
                <div style={{ fontSize:8, color:"rgba(18,160,80,0.6)", marginTop:1 }}>{monthLabel}</div>
                <div style={{ fontSize:8, color:"rgba(18,160,80,0.5)" }}>{mt.days} dias</div>
              </div>
              <div style={S.totalCellMonth}>{fmtRaw(mt.views)}</div><div />
              <div style={S.totalCellMonth}>{fmtRaw(mt.reach)}</div><div />
              <div style={S.totalCellMonth}>{fmtRaw(mt.inter)}</div><div />
              <div style={S.totalCellMonth}>{fmtRaw(mt.profileV)}</div><div />
              <div style={S.totalCellMonth}>{fmtRaw(mt.clicks)}</div>
              <div style={S.totalCellMonth}>{fmtRaw(mt.followers)}</div><div />
            </div>
          </div>
        </div>

        <span style={S.lbl}>Top 10 Posts</span>
        <div style={S.card}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontWeight:700, marginBottom:10, color:"#1877F2" }}>Facebook</div>
            {fbPosts.map((post, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12, color:"#1A1A1A" }}>
                <span>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`} {post.title||"-"}</span>
                <span style={{ fontFamily:"monospace", color:"#333333" }}>{post.views ? fmtRaw(post.views) : "-"}</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontWeight:700, marginBottom:10, color:"#E1306C" }}>Instagram</div>
            {igPosts.map((post, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:6, fontSize:12, color:"#1A1A1A" }}>
                <span>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`${i+1}.`} {post.title||"-"}</span>
                <span style={{ fontFamily:"monospace", color:"#333333" }}>{post.views ? fmtRaw(post.views) : "-"}</span>
              </div>
            ))}
          </div>
        </div>

        <span style={S.lbl}>Visualizações por plataforma</span>
        <div style={S.card}>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={PLATFORMS.map(p => ({ name:p.label.split(" ")[0], v:Number(latest[p.id]?.views)||0, fill:p.bg }))} barCategoryGap="35%">
              <XAxis dataKey="name" tick={{ fill:"#444444", fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#444444", fontSize:10 }} axisLine={false} tickLine={false}
                tickFormatter={v => v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?Math.round(v/1000)+"K":v} width={36} />
              <Tooltip contentStyle={{ background:"#FFFFFF", border:"0.5px solid rgba(0,0,0,0.12)", borderRadius:8, color:"#1A1A1A", fontSize:12 }}
                formatter={v => [fmtRaw(v),"Visualizações"]} cursor={{ fill:"rgba(0,0,0,0.03)" }} />
              <Bar dataKey="v" radius={[4,4,0,0]}>
                {PLATFORMS.map((p,i) => <rect key={i} fill={p.bg} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <span style={S.lbl}>Partilhar por WhatsApp</span>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:10 }}>
          <button style={{ ...S.btn("green"), display:"flex", alignItems:"center", justifyContent:"center", gap:6 }} onClick={() => openWA(latest)}>📱 Abrir WhatsApp</button>
          <button style={{ ...S.btn("ghost"), display:"flex", alignItems:"center", justifyContent:"center", gap:6 }} onClick={() => copyWA(latest)}>📋 Copiar texto</button>
        </div>
        <button style={{ ...S.btn("ghost"), width:"100%", fontSize:12 }} onClick={() => { setEditing(latest); setView("form"); }}>✏️ Editar este registo</button>
      </div>
    );
  };

  // ── HISTORY ────────────────────────────────────────────────────────────────
  const HistoryView = () => {
    const trendData = history.map(e => { const t=totals(e); return { date:e.date.slice(5), views:t.views, inter:t.inter }; });
    const months = {};
    history.forEach(e => { const ym=monthKey(e.date); if(!months[ym]) months[ym]=[]; months[ym].push(e); });

    return (
      <div style={S.body}>
        {history.length > 1 && (
          <>
            <span style={S.lbl}>Evolução temporal</span>
            <div style={S.card}>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="date" tick={{ fill:"#888888", fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#444444", fontSize:10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?Math.round(v/1000)+"K":v} width={36} />
                  <Tooltip contentStyle={{ background:"#FFFFFF", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:8, color:"#1A1A1A", fontSize:12 }} />
                  <Line type="monotone" dataKey="views" stroke="#C9A000" strokeWidth={2} dot={{ r:3, fill:"#C9A000" }} name="Visualizações" />
                  <Line type="monotone" dataKey="inter" stroke="#E1306C" strokeWidth={2} dot={{ r:3, fill:"#E1306C" }} name="Interacções" />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display:"flex", gap:16, marginTop:8 }}>
                {[["#C9A000","Visualizações"],["#E1306C","Interacções"]].map(([c,l]) => (
                  <div key={l} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#555555" }}>
                    <div style={{ width:10, height:3, borderRadius:2, background:c }} />{l}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        {Object.keys(months).sort().reverse().map(ym => {
          const mt = calcMonthTotals(history, ym);
          const [yr, mo] = ym.split("-");
          const mLabel = `${MONTH_PT[parseInt(mo)-1]} ${yr}`;
          const entries = months[ym];
          return (
            <div key={ym}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:20, marginBottom:8 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:700, color:"#12A050" }}>{mLabel}</span>
                  <span style={{ fontSize:10, color:"#888888" }}>{mt.days} dias</span>
                </div>
              </div>
              <div style={{ ...S.card, background:"#F0FBF5", border:"0.5px solid rgba(18,160,80,0.2)", marginBottom:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {[
                    {l:"Visualizações",v:mt.views},{l:"Alcance",v:mt.reach},{l:"Interacções",v:mt.inter},
                    {l:"Vis. Perfil",v:mt.profileV},{l:"Cliques",v:mt.clicks},{l:"Seguidores",v:mt.followers},
                  ].map(m => (
                    <div key={m.l} style={{ textAlign:"center" }}>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:700, color:"#12A050", lineHeight:1, marginBottom:3 }}>{m.v ? fmtRaw(m.v) : "0"}</div>
                      <div style={{ fontSize:9, color:"#666666" }}>{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
              {[...entries].reverse().map(entry => {
                const t = totals(entry);
                const d = new Date(entry.date + "T12:00:00");
                return (
                  <div key={entry.date} style={{ ...S.card, marginLeft:12, borderLeft:"2px solid rgba(0,0,0,0.15)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <span style={{ fontFamily:"'Space Mono',monospace", fontSize:12, fontWeight:700, color:"#C9A000" }}>
                        {String(d.getDate()).padStart(2,"0")}/{String(d.getMonth()+1).padStart(2,"0")}
                      </span>
                      <span style={{ fontSize:10, color:"#AAAAAA" }}>{WD_SHORT[d.getDay()]}</span>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
                      {[{l:"Viz",v:t.views},{l:"Alcance",v:t.reach},{l:"Int.",v:t.inter}].map(m => (
                        <div key={m.l}>
                          <div style={{ fontSize:12, fontFamily:"'Space Mono',monospace", fontWeight:700, color:"#1A1A1A" }}>{fmt(m.v)}</div>
                          <div style={{ fontSize:9, color:"#888888" }}>{m.l}</div>
                        </div>
                      ))}
                    </div>
                    {entry.note && <div style={{ fontSize:11, color:"#555555", marginBottom:8, fontStyle:"italic" }}>💡 {entry.note}</div>}
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{ ...S.btn("ghost"), flex:1, padding:"7px", fontSize:11 }} onClick={() => { setEditing(entry); setView("form"); }}>✏️ Editar</button>
                      <button style={{ ...S.btn("green"), flex:1, padding:"7px", fontSize:11 }} onClick={() => openWA(entry)}>📱 Partilhar</button>
                      <button style={{ ...S.btn("danger"), padding:"7px 11px", fontSize:11 }} onClick={() => deleteEntry(entry.date)}>🗑</button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  // ── MENSAL ────────────────────────────────────────────────────────────────
  const MensalView = () => {
    const monthMap = {};
    history.forEach(e => { const ym=monthKey(e.date); if(!monthMap[ym]) monthMap[ym]=[]; monthMap[ym].push(e); });
    const sortedMonths = Object.keys(monthMap).sort().reverse();

    if (sortedMonths.length === 0) return (
      <div style={{ ...S.body, textAlign:"center", paddingTop:60 }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🗓</div>
        <div style={{ fontSize:14, color:"#888888", lineHeight:1.7 }}>Sem dados mensais ainda.</div>
      </div>
    );

    const chartData = [...sortedMonths].reverse().map(ym => {
      const mt = calcMonthTotals(history, ym);
      const [yr, mo] = ym.split("-");
      return { label:`${MONTH_PT[parseInt(mo)-1].slice(0,3)} ${yr.slice(2)}`, views:mt.views };
    });

    const METRICS = [
      { key:"views",     label:"Visualizações", color:"#C9A000" },
      { key:"reach",     label:"Alcance",       color:"#1877F2" },
      { key:"inter",     label:"Interacções",   color:"#E1306C" },
      { key:"profileV",  label:"Vis. Perfil",   color:"#9B59B6" },
      { key:"clicks",    label:"Cliques",       color:"#12A050" },
      { key:"followers", label:"Seguidores",    color:"#E67E22" },
    ];

    return (
      <div style={S.body}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:15, fontWeight:700, color:"#C9A000", marginBottom:4 }}>Totais Mensais</div>
        <div style={{ fontSize:12, color:"#888888", marginBottom:18 }}>
          {sortedMonths.length} {sortedMonths.length===1 ? "mês registado" : "meses registados"}
        </div>

        {sortedMonths.length > 1 && (
          <>
            <span style={S.lbl}>Evolução mensal · Visualizações</span>
            <div style={S.card}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill:"#666666", fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:"#666666", fontSize:10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v>=1e6?(v/1e6).toFixed(1)+"M":v>=1000?Math.round(v/1000)+"K":v} width={38} />
                  <Tooltip contentStyle={{ background:"#FFFFFF", border:"0.5px solid rgba(0,0,0,0.1)", borderRadius:8, color:"#1A1A1A", fontSize:12 }}
                    formatter={v => [fmtRaw(v),"Visualizações"]} cursor={{ fill:"rgba(201,160,0,0.06)" }} />
                  <Bar dataKey="views" fill="#C9A000" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {sortedMonths.map((ym, idx) => {
          const mt = calcMonthTotals(history, ym);
          const [yr, mo] = ym.split("-");
          const mLabel = `${MONTH_PT[parseInt(mo)-1]} ${yr}`;
          const isLatest = idx === 0;
          return (
            <div key={ym} style={{
              background: isLatest ? "#FFFBEA" : "#F7F7F7",
              border: `0.5px solid ${isLatest ? "rgba(201,160,0,0.35)" : "rgba(0,0,0,0.08)"}`,
              borderRadius:14, padding:"16px", marginBottom:12,
            }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:14, fontWeight:700, color:isLatest?"#C9A000":"#1A1A1A" }}>{mLabel}</div>
                  <div style={{ fontSize:10, color:"#888888", marginTop:2 }}>{mt.days} dias com dados</div>
                </div>
                {isLatest && (
                  <div style={{ fontSize:9, fontWeight:700, color:"#C9A000", background:"rgba(201,160,0,0.1)", border:"0.5px solid rgba(201,160,0,0.25)", borderRadius:20, padding:"3px 10px", letterSpacing:"0.06em" }}>
                    MÊS ATUAL
                  </div>
                )}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 }}>
                {METRICS.map(m => (
                  <div key={m.key} style={{ background:"#FFFFFF", borderRadius:10, padding:"10px 12px", border:"0.5px solid rgba(0,0,0,0.06)" }}>
                    <div style={{ fontSize:9, color:"#888888", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5 }}>{m.label}</div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:13, fontWeight:700, color:m.color }}>
                      {mt[m.key] ? fmt(mt[m.key]) : "—"}
                    </div>
                    {mt[m.key] > 0 && <div style={{ fontSize:9, color:"#AAAAAA", marginTop:2 }}>{fmtRaw(mt[m.key])}</div>}
                  </div>
                ))}
              </div>
              <div style={{ marginTop:12, paddingTop:12, borderTop:"0.5px solid rgba(0,0,0,0.07)" }}>
                <div style={{ fontSize:9, color:"#AAAAAA", fontWeight:600, letterSpacing:"0.07em", marginBottom:8 }}>POR PLATAFORMA · VISUALIZAÇÕES</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {PLATFORMS.map(p => {
                    const total = (monthMap[ym]||[]).reduce((s,e) => s+(Number(e[p.id]?.views)||0), 0);
                    if (!total) return null;
                    return (
                      <div key={p.id} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11 }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:p.bg }} />
                        <span style={{ color:"#555555", fontWeight:500 }}>{p.label.split("(")[0].trim()}</span>
                        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"#333333", fontWeight:700 }}>{fmt(total)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />
      <div style={S.app}>
        <div style={S.topbar}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={S.logoCircle}>24H</div>
            <span style={S.logoName}>Social Dashboard</span>
          </div>
          {view !== "form" && (
            <button style={{ ...S.btn("primary"), padding:"8px 14px", fontSize:12 }} onClick={() => { setEditing(null); setView("form"); }}>+ Novo dia</button>
          )}
        </div>

        {view !== "form" && (
          <div style={S.nav}>
            {[
              { id:"dashboard", label:"Hoje" },
              { id:"history",   label:`Histórico (${history.length})` },
              { id:"mensal",    label:"Meses" },
            ].map(n => (
              <button key={n.id} style={S.navBtn(view === n.id)} onClick={() => setView(n.id)}>{n.label}</button>
            ))}
          </div>
        )}

        {view === "dashboard" && <DashboardView />}
        {view === "history"   && <HistoryView />}
        {view === "mensal"    && <MensalView />}
        {view === "form" && (
          <FormView
            editing={editing}
            history={history}
            onSave={saveEntry}
            onCancel={() => { setEditing(null); setView("dashboard"); }}
          />
        )}
      </div>
    </>
  );
}
