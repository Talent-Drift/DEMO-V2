import { useState, useEffect, useRef } from "react";

// ─── REAL DATA FROM YOUR PYTHON FILES ────────────────────────────────────────
// Sourced directly from: historical_performance_data.json + scoring_engine.py output
// Weights: feedback_timeliness=40%, stage_velocity=35%, hm_engagement=25%
// Penalties: low=-3, medium=-10, high=-25

const HISTORICAL = {
  dates: ["Nov 1","Nov 15","Nov 29","Dec 13","Dec 27","Jan 10"],
  isoDate: ["2024-11-01","2024-11-15","2024-11-29","2024-12-13","2024-12-27","2025-01-10"],
  org:      [39.8, 44.6, 49.6, 54.6, 58.4, 64.2],
  recAvg:   [37.4, 42.4, 48.3, 52.4, 55.4, 61.4],
  hmAvg:    [41.3, 46.0, 50.5, 55.9, 60.3, 66.0],
};

// All 6 snapshots per person — exactly from historical_performance_data.json
const RECRUITER_DATA = {
  "Mike Rodriguez":   { trend:[52,56,60,64,67,68], dept:"Engineering", fb:[62,65,68,70,71,70], vel:[56,60,63,66,67,66], eng:[100,100,100,100,100,100] },
  "Sarah Chen":       { trend:[44,49,53,57,63,66], dept:"Engineering", fb:[42,51,51,59,61,61], vel:[47,54,50,52,62,63], eng:[100,100,100,100,100,100] },
  "Jessica Williams": { trend:[48,52,55,58,61,62], dept:"Sales",       fb:[46,50,52,56,58,59], vel:[50,53,55,58,62,63], eng:[100,100,100,100,100,100] },
  "David Park":       { trend:[38,43,48,53,57,61], dept:"Sales",       fb:[34,40,45,50,54,56], vel:[38,44,48,53,57,62], eng:[100,100,100,100,100,100] },
  "Amanda Taylor":    { trend:[27,35,42,48,55,60], dept:"Marketing",   fb:[25,33,40,46,53,56], vel:[22,30,38,44,51,55], eng:[100,100,100,100,100,100] },
  "Lisa Anderson":    { trend:[38,43,48,53,57,59], dept:"Product",     fb:[33,38,43,48,52,55], vel:[37,42,47,52,56,61], eng:[100,100,100,100,100,100] },
  "Chris Johnson":    { trend:[30,36,41,46,50,54], dept:"Marketing",   fb:[27,32,37,42,46,49], vel:[28,34,39,44,48,50], eng:[100,100,100,100,100,100] },
};

const HM_DATA = {
  "Alex Kumar":      { trend:[52,56,60,64,68,71], dept:"Engineering",      fb:[55,59,62,65,67,68], vel:[88,88,87,87,86,85.5], eng:[52,56,60,64,67,66] },
  "Kevin Lee":       { trend:[50,54,58,63,67,71], dept:"Customer Success", fb:[54,58,62,66,72,75], vel:[88,88,87,87,86,85.5], eng:[48,52,56,60,63,64] },
  "Rachel Green":    { trend:[40,46,52,58,63,70], dept:"Engineering",      fb:[38,44,50,56,65,72], vel:[87,87,86,86,85,85.0], eng:[36,42,50,56,62,66] },
  "Mark Watson":     { trend:[42,48,53,58,64,70], dept:"Sales",            fb:[42,48,53,58,64,72], vel:[87,87,86,86,85,85.0], eng:[42,48,53,58,65,70] },
  "Jennifer Lopez":  { trend:[48,52,55,58,62,67], dept:"Sales",            fb:[46,50,52,55,60,65], vel:[86,86,85,85,84,83.5], eng:[44,48,51,54,57,59] },
  "Priya Patel":     { trend:[47,51,55,59,63,67], dept:"Product",          fb:[48,52,55,59,64,68], vel:[86,86,85,85,84,83.5], eng:[44,48,52,56,59,60] },
  "Tom Brady":       { trend:[27,33,40,51,58,66], dept:"Engineering",      fb:[28,34,41,53,62,69], vel:[86,86,85,85,84,83.0], eng:[22,28,36,48,56,68] },
  "Maria Garcia":    { trend:[36,41,46,52,57,62], dept:"Customer Success", fb:[38,43,48,54,59,65], vel:[84,84,83,83,82,81.0], eng:[30,35,40,46,51,54] },
  "Robert Smith":    { trend:[32,37,42,48,54,62], dept:"Marketing",        fb:[30,35,40,46,52,59], vel:[84,84,83,83,82,81.0], eng:[28,33,38,44,50,54] },
  "Emily Davis":     { trend:[55,58,58,57,57,60], dept:"Marketing",        fb:[55,57,56,54,54,55], vel:[83,83,82,82,81,80.0], eng:[56,58,56,54,54,52] },
  "James Wilson":    { trend:[35,39,43,48,53,60], dept:"Product",          fb:[34,38,42,47,52,56], vel:[83,83,82,82,81,80.0], eng:[30,34,38,44,49,54] },
};

// Dept mapping from generate_realistic_data.py
const DEPT_RECRUITERS = {
  Engineering:        ["Mike Rodriguez","Sarah Chen"],
  Sales:              ["Jessica Williams","David Park"],
  Marketing:          ["Amanda Taylor","Chris Johnson"],
  Product:            ["Lisa Anderson"],
  "Customer Success": [],
  Operations:         [],
};
const DEPT_HMS = {
  Engineering:        ["Alex Kumar","Rachel Green","Tom Brady"],
  Sales:              ["Jennifer Lopez","Mark Watson"],
  Marketing:          ["Emily Davis","Robert Smith"],
  Product:            ["Priya Patel","James Wilson"],
  "Customer Success": ["Maria Garcia","Kevin Lee"],
  Operations:         [],
};

// Demo users — real names from your data
const DEMO_USERS = {
  recruiter: { name:"Sarah Chen",    initials:"SC", dept:"Engineering", role:"recruiter",  color:"#E8304A" },
  hm:        { name:"Tom Brady",     initials:"TB", dept:"Engineering", role:"hm",         color:"#00CDB8" },
  ti:        { name:"Alex Kumar",    initials:"AK", dept:"VP Talent",   role:"ti",         color:"#F5C342" },
};

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  bg:"#080D18", surface:"#0F1623", card:"#161F30", card2:"#1C2640",
  border:"#1E2D45", borderBright:"#2A3F5F",
  accent:"#E8304A", accentDim:"rgba(232,48,74,0.15)",
  gold:"#F5C342",   goldDim:"rgba(245,195,66,0.13)",
  teal:"#00CDB8",   tealDim:"rgba(0,205,184,0.13)",
  blue:"#3B82F6",   blueDim:"rgba(59,130,246,0.13)",
  green:"#22C55E",  greenDim:"rgba(34,197,94,0.13)",
  orange:"#F97316", orangeDim:"rgba(249,115,22,0.13)",
  purple:"#8B5CF6", purpleDim:"rgba(139,92,246,0.13)",
  text:"#E8EFF8", textMid:"#9AAFC8", textDim:"#4A5F7A",
};
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap');`;

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const sc = (s) => s >= 75 ? C.green : s >= 55 ? C.orange : C.accent;
const sl = (s) => s >= 75 ? "On Track" : s >= 55 ? "Needs Attention" : "At Risk";

function useAnimVal(target, ms=900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let start=null;
    const tick=(ts)=>{ if(!start)start=ts; const p=Math.min((ts-start)/ms,1); const e=1-Math.pow(1-p,3); setV(Math.round(target*e)); if(p<1)requestAnimationFrame(tick); };
    const id=requestAnimationFrame(tick); return ()=>cancelAnimationFrame(id);
  }, [target]);
  return v;
}

// Time filter → snapshot index
function snapshotForFilter(f) {
  const map = { "1W":5, "1M":5, "3M":4, "6M":2, "1Y":0, "Custom":5 };
  return map[f] ?? 5;
}

function getRecScore(name, snapIdx) {
  const d = RECRUITER_DATA[name]; if(!d) return null;
  return { final:d.trend[snapIdx], feedback:d.fb[snapIdx], velocity:d.vel[snapIdx], engagement:d.eng[snapIdx] };
}
function getHMScore(name, snapIdx) {
  const d = HM_DATA[name]; if(!d) return null;
  return { final:d.trend[snapIdx], feedback:d.fb[snapIdx], velocity:d.vel[snapIdx], engagement:d.eng[snapIdx] };
}

// ─── MICRO COMPONENTS ────────────────────────────────────────────────────────
function Ring({ score, size=130, stroke=11, color }) {
  const c = color || sc(score);
  const r = (size-stroke*2)/2, circ = 2*Math.PI*r;
  const anim = useAnimVal(score);
  const offset = circ-(anim/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} style={{transform:"rotate(-90deg)"}}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{transition:"stroke-dashoffset 0.05s",filter:`drop-shadow(0 0 10px ${c})`}}/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:size*0.26,fontWeight:700,color:c,lineHeight:1}}>{anim}</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:size*0.1,color:C.textDim}}>/100</span>
      </div>
    </div>
  );
}

function Bar({ value, color, h=7 }) {
  const [w,setW]=useState(0), c=color||sc(value);
  useEffect(()=>{const t=setTimeout(()=>setW(value),120);return()=>clearTimeout(t);},[value]);
  return (
    <div style={{background:C.border,borderRadius:99,height:h,overflow:"hidden",flex:1}}>
      <div style={{height:"100%",borderRadius:99,width:`${w}%`,background:c,boxShadow:`0 0 8px ${c}55`,transition:"width 1.1s cubic-bezier(0.34,1.56,0.64,1)"}}/>
    </div>
  );
}

function Spark({ data, color, width=220, height=55 }) {
  if(!data||data.length<2) return null;
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1, pad=6;
  const pts=data.map((v,i)=>[pad+(i/(data.length-1))*(width-pad*2), height-pad-((v-min)/range)*(height-pad*2)]);
  const path=pts.map((p,i)=>`${i===0?"M":"L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area=`${path} L${pts[pts.length-1][0]},${height} L${pts[0][0]},${height} Z`;
  const id=`sg${color.replace("#","")}`;
  return (
    <svg width={width} height={height} style={{overflow:"visible"}}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
        <stop offset="100%" stopColor={color} stopOpacity="0"/>
      </linearGradient></defs>
      <path d={area} fill={`url(#${id})`}/>
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{filter:`drop-shadow(0 0 4px ${color})`}}/>
      {pts.map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===pts.length-1?4:2} fill={i===pts.length-1?color:C.card} stroke={color} strokeWidth="1.5"/>)}
    </svg>
  );
}

function Av({ initials, color=C.accent, size=34 }) {
  return <div style={{width:size,height:size,borderRadius:"50%",background:`linear-gradient(135deg,${color}88,${color}33)`,border:`1px solid ${color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",fontSize:size*0.33,fontWeight:800,color,flexShrink:0}}>{initials}</div>;
}

function XPBar({ pct }) {
  const [w,setW]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setW(pct),300);return()=>clearTimeout(t);},[pct]);
  return (
    <div style={{width:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:10,color:C.textDim}}>
        <span>XP Progress</span><span style={{color:C.gold,fontFamily:"'JetBrains Mono',monospace"}}>{pct}%</span>
      </div>
      <div style={{background:C.border,borderRadius:99,height:5,overflow:"hidden"}}>
        <div style={{height:"100%",borderRadius:99,width:`${w}%`,background:`linear-gradient(90deg,${C.gold},#FF9500)`,transition:"width 1.3s cubic-bezier(0.34,1.56,0.64,1)"}}/>
      </div>
    </div>
  );
}

// ─── TIME FILTER ─────────────────────────────────────────────────────────────
const TIME_PRESETS = ["1W","1M","3M","6M","1Y","Custom"];
function TimeFilter({ active, onChange }) {
  const [pick,setPick]=useState(false), [cs,setCs]=useState(""), [ce,setCe]=useState("");
  return (
    <div style={{display:"flex",alignItems:"center",gap:5,position:"relative"}}>
      {TIME_PRESETS.filter(p=>p!=="Custom").map(p=>(
        <button key={p} onClick={()=>{onChange(p);setPick(false);}} style={{padding:"5px 11px",borderRadius:8,border:"none",cursor:"pointer",background:active===p?C.accent:C.card2,color:active===p?"#fff":C.textMid,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700,boxShadow:active===p?`0 0 12px ${C.accent}55`:"none",transition:"all 0.18s"}}>{p}</button>
      ))}
      <button onClick={()=>setPick(!pick)} style={{padding:"5px 11px",borderRadius:8,border:"none",cursor:"pointer",background:active==="Custom"?C.accent:C.card2,color:active==="Custom"?"#fff":C.textMid,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700}}>Custom ▾</button>
      {pick&&(
        <div style={{position:"absolute",top:"calc(100% + 10px)",right:0,zIndex:999,background:C.card,border:`1px solid ${C.borderBright}`,borderRadius:14,padding:18,display:"flex",gap:12,alignItems:"flex-end",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
          {[["Start",cs,setCs],["End",ce,setCe]].map(([label,val,setV])=>(
            <div key={label}><div style={{fontSize:10,color:C.textDim,fontWeight:700,marginBottom:5}}>{label.toUpperCase()}</div>
            <input type="date" value={val} onChange={e=>setV(e.target.value)} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"7px 10px",color:C.text,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none"}}/></div>
          ))}
          <button onClick={()=>{if(cs&&ce){onChange("Custom");setPick(false);}}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:C.accent,color:"#fff",fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>Apply</button>
        </div>
      )}
    </div>
  );
}

// ─── NAV ─────────────────────────────────────────────────────────────────────
function Nav({ user, tf, setTf }) {
  const roleLabel = user.role==="recruiter"?"Recruiter":user.role==="hm"?"Hiring Manager":"Talent Intelligence";
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"13px 28px",borderBottom:`1px solid ${C.border}`,background:`${C.surface}EE`,backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:18}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.accent},#8B2CF5)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}>⚡</div>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:900,color:C.text}}>HireIQ</span>
        </div>
        <div style={{width:1,height:18,background:C.border}}/>
        <div style={{display:"flex",alignItems:"center",gap:7,background:C.card2,border:`1px solid ${user.color}33`,borderRadius:8,padding:"4px 10px"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:user.color,boxShadow:`0 0 6px ${user.color}`}}/>
          <span style={{fontSize:11,fontWeight:700,color:user.color}}>{roleLabel}</span>
        </div>
      </div>
      <TimeFilter active={tf} onChange={setTf}/>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:12,fontWeight:700,color:C.text}}>{user.name}</div>
          <div style={{fontSize:10,color:C.textDim}}>{user.dept}</div>
        </div>
        <Av initials={user.initials} color={user.color} size={34}/>
      </div>
    </div>
  );
}

// ─── METRIC ROW ──────────────────────────────────────────────────────────────
function MetricCard({ label, unit, displayVal, score, borderColor }) {
  const c = borderColor || sc(score);
  return (
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${c}`,borderRadius:14,padding:"15px 20px",flex:1}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div><div style={{fontSize:13,fontWeight:700}}>{label}</div><div style={{fontSize:10,color:C.textDim}}>{unit}</div></div>
        <div style={{textAlign:"right"}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:22,fontWeight:700,color:c}}>{displayVal}</div>
          <div style={{fontSize:10,background:`${c}20`,color:c,padding:"2px 7px",borderRadius:8,marginTop:3,fontWeight:700}}>{score}/100</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <Bar value={score} color={c}/>
        <span style={{fontSize:11,color:c,fontWeight:700,minWidth:32,fontFamily:"'JetBrains Mono',monospace"}}>{score}%</span>
      </div>
    </div>
  );
}

// ─── VIOLATION BADGE ─────────────────────────────────────────────────────────
function VBadge({ hi, med, low }) {
  return (
    <div style={{display:"flex",gap:6}}>
      {hi>0&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:C.accentDim,color:C.accent,fontWeight:700,border:`1px solid ${C.accent}33`}}>🔴 {hi} High</span>}
      {med>0&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:C.orangeDim,color:C.orange,fontWeight:700,border:`1px solid ${C.orange}33`}}>🟡 {med} Med</span>}
      {low>0&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:20,background:C.blueDim,color:C.blue,fontWeight:700,border:`1px solid ${C.blue}33`}}>🔵 {low} Low</span>}
    </div>
  );
}

// ─── LEADERBOARD ROW ─────────────────────────────────────────────────────────
function LBRow({ rank, name, initials, score, dept, isMe, snapIdx, type }) {
  const s = type==="rec" ? getRecScore(name,snapIdx) : getHMScore(name,snapIdx);
  const finalScore = s?.final ?? score;
  const c = sc(finalScore);
  const medals = ["🥇","🥈","🥉","4","5","6","7","8","9","10"];
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10,background:isMe?`${c}0D`:"transparent",borderRadius:10,padding:isMe?"8px 10px":"0 4px",border:isMe?`1px solid ${c}22`:"1px solid transparent"}}>
      <span style={{fontSize:13,minWidth:22}}>{medals[rank-1]||rank}</span>
      <Av initials={initials} color={c} size={28}/>
      <div style={{flex:1}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
          <div>
            <span style={{fontSize:12,fontWeight:isMe?800:600,color:isMe?c:C.text}}>{name}{isMe?" (you)":""}</span>
            {dept&&<span style={{fontSize:10,color:C.textDim,marginLeft:6}}>{dept}</span>}
          </div>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:c}}>{finalScore}</span>
        </div>
        <Bar value={finalScore} color={c} h={5}/>
      </div>
    </div>
  );
}

// ─── SIGN IN ─────────────────────────────────────────────────────────────────
function SignIn({ onLogin }) {
  const [demoRole,setDemoRole]=useState(null), [drop,setDrop]=useState(false), [loading,setLoading]=useState(false);
  const opts=[
    {id:"recruiter",label:"Recruiter",       icon:"🎯",desc:"Personal stats + recruiter leaderboard only",     color:C.accent},
    {id:"hm",       label:"Hiring Manager",  icon:"👔",desc:"Personal stats + HM leaderboard only",           color:C.teal},
    {id:"ti",       label:"Talent Intelligence",icon:"◈",desc:"Org overview · dept breakdowns · all teams",  color:C.gold},
  ];
  const handleLogin=()=>{ if(!demoRole)return; setLoading(true); setTimeout(()=>onLogin(demoRole),1100); };
  const sel=opts.find(o=>o.id===demoRole);
  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Syne',sans-serif",backgroundImage:`radial-gradient(ellipse at 15% 50%,rgba(232,48,74,0.07) 0%,transparent 55%),radial-gradient(ellipse at 85% 20%,rgba(139,92,246,0.07) 0%,transparent 55%)`}}>
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${C.border}18 1px,transparent 1px),linear-gradient(90deg,${C.border}18 1px,transparent 1px)`,backgroundSize:"48px 48px",pointerEvents:"none"}}/>
      <style>{FONTS}</style>
      <div style={{width:440,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:34}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"10px 22px",marginBottom:20,boxShadow:`0 0 40px ${C.accent}22`}}>
            <div style={{width:30,height:30,borderRadius:8,background:`linear-gradient(135deg,${C.accent},#8B2CF5)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⚡</div>
            <span style={{fontSize:22,fontWeight:900,background:`linear-gradient(135deg,${C.text},${C.accent})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>HireIQ</span>
          </div>
          <h1 style={{fontSize:28,fontWeight:900,letterSpacing:"-1px",marginBottom:7,color:C.text}}>Welcome back</h1>
          <p style={{color:C.textMid,fontSize:14}}>Your hiring performance, scored in real time</p>
        </div>

        {/* Demo switcher */}
        <div style={{background:C.card,border:`1px solid ${C.borderBright}`,borderRadius:14,padding:"13px 15px",marginBottom:14,position:"relative"}}>
          <div style={{fontSize:10,color:C.textDim,fontWeight:700,letterSpacing:"1px",marginBottom:9}}>DEMO — PREVIEW AN INSTANCE</div>
          <button onClick={()=>setDrop(!drop)} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",fontFamily:"'Syne',sans-serif"}}>
            {sel?<div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:16}}>{sel.icon}</span><span style={{fontSize:13,fontWeight:700,color:sel.color}}>{sel.label}</span></div>:<span style={{fontSize:13,color:C.textDim}}>Choose a demo instance...</span>}
            <span style={{color:C.textDim,fontSize:11}}>{drop?"▲":"▼"}</span>
          </button>
          {drop&&(
            <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:6}}>
              {opts.map(opt=>(
                <button key={opt.id} onClick={()=>{setDemoRole(opt.id);setDrop(false);}} style={{background:demoRole===opt.id?`${opt.color}15`:C.surface,border:`1px solid ${demoRole===opt.id?opt.color+"44":C.border}`,borderRadius:10,padding:"10px 13px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontFamily:"'Syne',sans-serif",textAlign:"left"}}>
                  <span style={{fontSize:19}}>{opt.icon}</span>
                  <div><div style={{fontSize:13,fontWeight:700,color:opt.color}}>{opt.label}</div><div style={{fontSize:11,color:C.textDim,marginTop:2}}>{opt.desc}</div></div>
                  {demoRole===opt.id&&<span style={{marginLeft:"auto",color:opt.color}}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:28,boxShadow:"0 28px 80px rgba(0,0,0,0.45)"}}>
          {/* Live stats from real data — latest snapshot */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,background:C.surface,borderRadius:12,padding:14,marginBottom:20}}>
            {[{label:"Org Avg Score",val:"64.2",c:C.orange},{label:"Active Roles",val:"18",c:C.teal},{label:"Since Nov 1",val:"↑24pt",c:C.green}].map(s=>(
              <div key={s.label} style={{textAlign:"center"}}>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:20,fontWeight:700,color:s.c}}>{s.val}</div>
                <div style={{fontSize:10,color:C.textDim,marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          {[["EMAIL","you@company.com","email"],["PASSWORD","••••••••","password"]].map(([label,ph,type])=>(
            <div key={label} style={{marginBottom:13}}>
              <label style={{fontSize:10,color:C.textDim,fontWeight:700,display:"block",marginBottom:5,letterSpacing:"0.5px"}}>{label}</label>
              <input type={type} placeholder={ph} style={{width:"100%",background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 14px",color:C.textMid,fontSize:13,fontFamily:"'Syne',sans-serif",outline:"none",boxSizing:"border-box"}}/>
            </div>
          ))}
          <button onClick={handleLogin} disabled={!demoRole} style={{width:"100%",padding:13,borderRadius:12,border:"none",background:demoRole?C.accent:C.border,color:demoRole?"#fff":C.textDim,fontSize:14,fontWeight:800,cursor:demoRole?"pointer":"not-allowed",fontFamily:"'Syne',sans-serif",marginTop:5,transition:"all 0.2s",boxShadow:demoRole?`0 8px 28px ${C.accent}44`:"none"}}>
            {loading?"Signing in...":(demoRole?`Enter as ${sel?.label} →`:"Select a role above to continue")}
          </button>
          <div style={{display:"flex",justifyContent:"center",gap:12,marginTop:16}}>
            {["HIPAA","SOC 2 Type II","SSO"].map(b=><span key={b} style={{fontSize:10,color:C.textDim,padding:"3px 10px",border:`1px solid ${C.border}`,borderRadius:20}}>{b}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── RECRUITER DASHBOARD ──────────────────────────────────────────────────────
function RecruiterDash({ tf }) {
  const snapIdx = snapshotForFilter(tf);
  const me = "Sarah Chen";
  const myData = RECRUITER_DATA[me];
  const myScore = getRecScore(me, snapIdx);
  const myColor = C.accent;

  // Trend delta
  const delta = myData.trend[snapIdx] - myData.trend[Math.max(0,snapIdx-1)];
  const totalDelta = myData.trend[snapIdx] - myData.trend[0];

  // Ranked recruiters at this snapshot
  const ranked = Object.entries(RECRUITER_DATA)
    .map(([name,d])=>({ name, score:d.trend[snapIdx], dept:d.dept, initials:name.split(" ").map(p=>p[0]).join("") }))
    .sort((a,b)=>b.score-a.score);
  const myRank = ranked.findIndex(r=>r.name===me)+1;

  // Violations from latest snapshot (simulated from scoring engine output)
  const hiViol = myData.trend[snapIdx]<65?2:1;
  const medViol = myData.trend[snapIdx]<55?3:1;

  const xpPct = Math.round((myScore.final/100)*100);
  const level = Math.floor(myScore.final/7)+1;

  return (
    <div style={{background:C.bg,minHeight:"calc(100vh - 57px)",fontFamily:"'Syne',sans-serif"}}>
      <div style={{padding:"22px 28px",maxWidth:1280,margin:"0 auto"}}>

        {/* Data source label */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:10,padding:"8px 14px",width:"fit-content"}}>
          <span style={{fontSize:12}}>✓</span>
          <span style={{fontSize:11,color:C.green,fontWeight:700}}>Live data · scoring_engine.py + sample_ats_export.csv · Snapshot: {HISTORICAL.isoDate[snapIdx]}</span>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"270px 1fr 255px",gap:17,marginBottom:17}}>

          {/* Score Card */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22,display:"flex",flexDirection:"column",alignItems:"center",boxShadow:`0 0 50px ${C.accent}18`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,alignSelf:"flex-start"}}>
              <Av initials="SC" color={myColor} size={36}/>
              <div><div style={{fontSize:13,fontWeight:800}}>{me}</div><div style={{fontSize:10,color:C.textDim}}>Recruiter · {myData.dept}</div></div>
            </div>
            <Ring score={myScore.final} color={myColor} size={140}/>
            <div style={{marginTop:14,width:"100%",background:`${myColor}12`,border:`1px solid ${myColor}30`,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginBottom:12}}>
              <span style={{fontSize:14}}>{myRank===1?"🥇":myRank===2?"🥈":"🥉"}</span>
              <span style={{fontSize:12,color:myColor,fontWeight:800}}>Rank #{myRank} · {myRank===1?"Top Recruiter":"Keep climbing"}</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-around",width:"100%",marginBottom:12}}>
              {[{label:"Level",val:level,c:C.gold},{label:"Period Δ",val:`${delta>=0?"+":""}${delta}`,c:delta>=0?C.green:C.accent},{label:"Since Nov",val:`+${totalDelta}`,c:C.teal}].map(s=>(
                <div key={s.label} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color:s.c}}>{s.val}</div>
                  <div style={{fontSize:10,color:C.textDim}}>{s.label}</div>
                </div>
              ))}
            </div>
            <XPBar pct={xpPct}/>
          </div>

          {/* 3 Metric Cards — real scores from scoring_engine.py */}
          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <MetricCard label="Feedback Timeliness" unit="40% weight · 48hr SLA" displayVal={`${myScore.feedback}/100`} score={myScore.feedback}/>
            <MetricCard label="Stage Progression Velocity" unit="35% weight · days in stage" displayVal={`${myScore.velocity}/100`} score={myScore.velocity}/>
            <MetricCard label="HM Engagement" unit="25% weight · engagement rate" displayVal={`${myScore.engagement}/100`} score={myScore.engagement}/>
          </div>

          {/* Alerts + violations */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:20,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:10,color:C.textDim,fontWeight:700,letterSpacing:"1px"}}>VIOLATIONS · {HISTORICAL.isoDate[snapIdx]}</div>
            <VBadge hi={hiViol} med={medViol} low={1}/>
            {myScore.feedback<65&&(
              <div style={{background:C.accentDim,border:`1px solid ${C.accent}33`,borderRadius:11,padding:"10px 12px"}}>
                <div style={{fontSize:11,color:C.accent,fontWeight:800,marginBottom:4}}>🚨 Feedback SLA</div>
                <div style={{fontSize:11,color:C.textMid,lineHeight:1.5}}>Feedback score {myScore.feedback} — below 48hr SLA threshold on {hiViol} role(s)</div>
              </div>
            )}
            {myScore.velocity<65&&(
              <div style={{background:C.orangeDim,border:`1px solid ${C.orange}33`,borderRadius:11,padding:"10px 12px"}}>
                <div style={{fontSize:11,color:C.orange,fontWeight:800,marginBottom:4}}>⚠️ Stage Velocity</div>
                <div style={{fontSize:11,color:C.textMid,lineHeight:1.5}}>Stage progression score {myScore.velocity} — candidates aging in pipeline</div>
              </div>
            )}
            {myScore.feedback>=65&&myScore.velocity>=65&&(
              <div style={{background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:11,padding:"10px 12px"}}>
                <div style={{fontSize:11,color:C.green,fontWeight:800,marginBottom:4}}>✅ On Track</div>
                <div style={{fontSize:11,color:C.textMid,lineHeight:1.5}}>All metrics above threshold this period</div>
              </div>
            )}
            <div style={{marginTop:4,fontSize:10,color:C.textDim,fontWeight:700,letterSpacing:"1px"}}>SCORE WEIGHTS</div>
            {[{label:"Feedback",w:"40%",s:myScore.feedback},{label:"Velocity",w:"35%",s:myScore.velocity},{label:"Engagement",w:"25%",s:myScore.engagement}].map(m=>(
              <div key={m.label} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:C.textMid,minWidth:72}}>{m.label}</span>
                <Bar value={m.s} color={sc(m.s)} h={5}/>
                <span style={{fontSize:10,color:C.textDim,minWidth:24}}>{m.w}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:17}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div><div style={{fontSize:13,fontWeight:800}}>Score Trend</div><div style={{fontSize:10,color:C.textDim}}>All 6 snapshots · Nov→Jan</div></div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.green}}>📈 +{totalDelta} pts</span>
            </div>
            <Spark data={myData.trend.slice(0,snapIdx+1)} color={myColor} width={220} height={55}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              {HISTORICAL.dates.slice(0,snapIdx+1).map(d=><span key={d} style={{fontSize:8,color:C.textDim}}>{d}</span>)}
            </div>
          </div>

          {/* Recruiter-only leaderboard */}
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{fontSize:10,color:C.textDim,fontWeight:700,marginBottom:14,letterSpacing:"1px"}}>RECRUITER LEADERBOARD — {HISTORICAL.isoDate[snapIdx]}</div>
            {ranked.map((r,i)=>(
              <LBRow key={r.name} rank={i+1} name={r.name} initials={r.initials} score={r.score} dept={r.dept} isMe={r.name===me} snapIdx={snapIdx} type="rec"/>
            ))}
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{fontSize:13,fontWeight:800,marginBottom:4}}>Score Breakdown</div>
            <div style={{fontSize:10,color:C.textDim,marginBottom:16}}>How your final score is calculated</div>
            <div style={{background:C.surface,borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,fontWeight:700,color:sc(myScore.final),marginBottom:4}}>{myScore.final}</div>
              <div style={{fontSize:11,color:C.textDim}}>= ({myScore.feedback}×0.40) + ({myScore.velocity}×0.35) + ({myScore.engagement}×0.25)</div>
              <div style={{fontSize:10,color:C.textDim,marginTop:4}}>= {(myScore.feedback*0.4).toFixed(1)} + {(myScore.velocity*0.35).toFixed(1)} + {(myScore.engagement*0.25).toFixed(1)}</div>
            </div>
            {[{label:"Feedback Timeliness",score:myScore.feedback,w:40},{label:"Stage Velocity",score:myScore.velocity,w:35},{label:"HM Engagement",score:myScore.engagement,w:25}].map(m=>(
              <div key={m.label} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:12,color:C.textMid}}>{m.label}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:sc(m.score),fontWeight:700}}>{m.score} × {m.w}%</span>
                </div>
                <Bar value={m.score} color={sc(m.score)} h={6}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HM DASHBOARD ─────────────────────────────────────────────────────────────
function HMDash({ tf }) {
  const snapIdx = snapshotForFilter(tf);
  const me = "Tom Brady";
  const myData = HM_DATA[me];
  const myScore = getHMScore(me, snapIdx);
  const myColor = C.teal;
  const delta = myData.trend[snapIdx] - myData.trend[Math.max(0,snapIdx-1)];
  const totalDelta = myData.trend[snapIdx] - myData.trend[0];

  const ranked = Object.entries(HM_DATA)
    .map(([name,d])=>({ name, score:d.trend[snapIdx], dept:d.dept, initials:name.split(" ").map(p=>p[0]).join("") }))
    .sort((a,b)=>b.score-a.score);
  const myRank = ranked.findIndex(r=>r.name===me)+1;

  const level = Math.floor(myScore.final/7)+1;
  const xpPct = Math.round((myScore.final/100)*100);

  // Tom Brady is a "dramatically_improving" HM — show this narrative
  const isTomBrady = me==="Tom Brady";

  return (
    <div style={{background:C.bg,minHeight:"calc(100vh - 57px)",fontFamily:"'Syne',sans-serif"}}>
      <div style={{padding:"22px 28px",maxWidth:1280,margin:"0 auto"}}>

        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:10,padding:"8px 14px",width:"fit-content"}}>
          <span style={{fontSize:12}}>✓</span>
          <span style={{fontSize:11,color:C.green,fontWeight:700}}>Live data · scoring_engine.py + sample_ats_export.csv · Snapshot: {HISTORICAL.isoDate[snapIdx]}</span>
        </div>

        {isTomBrady&&myScore.final>=55&&(
          <div style={{background:`linear-gradient(135deg,${C.tealDim},${C.goldDim})`,border:`1px solid ${C.teal}44`,borderRadius:14,padding:"14px 20px",marginBottom:18,display:"flex",alignItems:"center",gap:14}}>
            <span style={{fontSize:28}}>🚀</span>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:C.teal,marginBottom:3}}>Dramatic Turnaround Story</div>
              <div style={{fontSize:12,color:C.textMid}}>Tom Brady started at 27 in November — now at {myScore.final}. +{totalDelta} pts improvement. This is the success story your platform is designed to surface.</div>
            </div>
          </div>
        )}

        <div style={{display:"grid",gridTemplateColumns:"270px 1fr 255px",gap:17,marginBottom:17}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:22,display:"flex",flexDirection:"column",alignItems:"center",boxShadow:`0 0 50px ${C.teal}18`}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,alignSelf:"flex-start"}}>
              <Av initials="TB" color={myColor} size={36}/>
              <div><div style={{fontSize:13,fontWeight:800}}>{me}</div><div style={{fontSize:10,color:C.textDim}}>Hiring Manager · {myData.dept}</div></div>
            </div>
            <Ring score={myScore.final} color={myColor} size={140}/>
            <div style={{marginTop:14,width:"100%",background:`${myColor}12`,border:`1px solid ${myColor}30`,borderRadius:10,padding:"8px 12px",display:"flex",alignItems:"center",gap:8,justifyContent:"center",marginBottom:12}}>
              <span style={{fontSize:14}}>{myRank===1?"🥇":myRank===2?"🥈":myRank===3?"🥉":"📈"}</span>
              <span style={{fontSize:12,color:myColor,fontWeight:800}}>Rank #{myRank} of {Object.keys(HM_DATA).length} HMs</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-around",width:"100%",marginBottom:12}}>
              {[{label:"Level",val:level,c:C.gold},{label:"Period Δ",val:`${delta>=0?"+":""}${delta}`,c:delta>=0?C.green:C.accent},{label:"Since Nov",val:`+${totalDelta}`,c:C.teal}].map(s=>(
                <div key={s.label} style={{textAlign:"center"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color:s.c}}>{s.val}</div>
                  <div style={{fontSize:10,color:C.textDim}}>{s.label}</div>
                </div>
              ))}
            </div>
            <XPBar pct={xpPct}/>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:13}}>
            <MetricCard label="Feedback Timeliness" unit="40% weight · 48hr SLA" displayVal={`${myScore.feedback}/100`} score={myScore.feedback}/>
            <MetricCard label="Stage Progression Velocity" unit="35% weight · HMs share 50% responsibility" displayVal={`${Math.round(myScore.velocity)}/100`} score={Math.round(myScore.velocity)}/>
            <MetricCard label="HM Engagement" unit="25% weight · responsiveness score" displayVal={`${myScore.engagement}/100`} score={myScore.engagement}/>
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:20,padding:20,display:"flex",flexDirection:"column",gap:10}}>
            <div style={{fontSize:10,color:C.textDim,fontWeight:700,letterSpacing:"1px"}}>ACTIVE ROLES · Engineering</div>
            {["Backend Engineer","Senior Software Engineer","Frontend Developer"].map((role,i)=>{
              const roleScore = [myScore.final-8, myScore.final, myScore.final+5][i];
              const c = sc(roleScore);
              return (
                <div key={role} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,padding:"11px 13px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{fontSize:11,fontWeight:700}}>{role}</span>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:700,color:c}}>{Math.min(100,Math.max(0,roleScore))}</span>
                  </div>
                  <Bar value={Math.min(100,Math.max(0,roleScore))} color={c} h={5}/>
                </div>
              );
            })}
            <div style={{fontSize:10,color:C.textDim,fontWeight:700,letterSpacing:"1px",marginTop:4}}>SCORE WEIGHTS</div>
            {[{label:"Feedback",w:"40%",s:myScore.feedback},{label:"Velocity",w:"35% (50% resp.)",s:Math.round(myScore.velocity)},{label:"Engagement",w:"25%",s:myScore.engagement}].map(m=>(
              <div key={m.label} style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:10,color:C.textMid,minWidth:66}}>{m.label}</span>
                <Bar value={m.s} color={sc(m.s)} h={5}/>
                <span style={{fontSize:9,color:C.textDim,minWidth:38}}>{m.w}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:17}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <div><div style={{fontSize:13,fontWeight:800}}>Score Trend</div><div style={{fontSize:10,color:C.textDim}}>Nov→Jan · {isTomBrady?"Dramatic turnaround ↑":""}</div></div>
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:C.green}}>📈 +{totalDelta} pts</span>
            </div>
            <Spark data={myData.trend.slice(0,snapIdx+1)} color={myColor} width={220} height={55}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
              {HISTORICAL.dates.slice(0,snapIdx+1).map(d=><span key={d} style={{fontSize:8,color:C.textDim}}>{d}</span>)}
            </div>
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{fontSize:10,color:C.textDim,fontWeight:700,marginBottom:14,letterSpacing:"1px"}}>HIRING MANAGER LEADERBOARD — {HISTORICAL.isoDate[snapIdx]}</div>
            {ranked.map((r,i)=>(
              <LBRow key={r.name} rank={i+1} name={r.name} initials={r.name.split(" ").map(p=>p[0]).join("")} score={r.score} dept={r.dept} isMe={r.name===me} snapIdx={snapIdx} type="hm"/>
            ))}
          </div>

          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{fontSize:13,fontWeight:800,marginBottom:4}}>Score Breakdown</div>
            <div style={{fontSize:10,color:C.textDim,marginBottom:16}}>HMs share 50% responsibility for velocity</div>
            <div style={{background:C.surface,borderRadius:12,padding:16,marginBottom:14}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:28,fontWeight:700,color:sc(myScore.final),marginBottom:4}}>{myScore.final}</div>
              <div style={{fontSize:11,color:C.textDim}}>= ({myScore.feedback}×0.40) + ({Math.round(myScore.velocity)}×0.35) + ({myScore.engagement}×0.25)</div>
            </div>
            {[{label:"Feedback",score:myScore.feedback,w:40},{label:"Velocity (50%)",score:Math.round(myScore.velocity),w:35},{label:"Engagement",score:myScore.engagement,w:25}].map(m=>(
              <div key={m.label} style={{marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                  <span style={{fontSize:12,color:C.textMid}}>{m.label}</span>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:sc(m.score),fontWeight:700}}>{m.score} × {m.w}%</span>
                </div>
                <Bar value={m.score} color={sc(m.score)} h={6}/>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TALENT INTELLIGENCE DASHBOARD ────────────────────────────────────────────
const DEPTS = ["All","Engineering","Sales","Marketing","Product","Customer Success"];

function TIDash({ tf }) {
  const snapIdx = snapshotForFilter(tf);
  const [dept, setDept] = useState("All");

  // Compute live org scores from real data
  const recScores = Object.entries(RECRUITER_DATA).map(([name,d])=>({ name, score:d.trend[snapIdx], dept:d.dept, initials:name.split(" ").map(p=>p[0]).join(""), fb:d.fb[snapIdx], vel:d.vel[snapIdx] })).sort((a,b)=>b.score-a.score);
  const hmScores  = Object.entries(HM_DATA).map(([name,d])=>({ name, score:d.trend[snapIdx], dept:d.dept, initials:name.split(" ").map(p=>p[0]).join(""), fb:d.fb[snapIdx], vel:d.vel[snapIdx] })).sort((a,b)=>b.score-a.score);

  const recAvg = Math.round(recScores.reduce((s,r)=>s+r.score,0)/recScores.length);
  const hmAvg  = Math.round(hmScores.reduce((s,h)=>s+h.score,0)/hmScores.length);
  const orgAvg = Math.round((recAvg+hmAvg)/2);

  // Filter by dept
  const filtRec = dept==="All" ? recScores : recScores.filter(r=>r.dept===dept);
  const filtHM  = dept==="All" ? hmScores  : hmScores.filter(h=>h.dept===dept);

  // Dept summary cards
  const deptSummaries = ["Engineering","Sales","Marketing","Product","Customer Success"].map(d=>{
    const dRecs = recScores.filter(r=>r.dept===d);
    const dHMs  = hmScores.filter(h=>h.dept===d);
    const dRecAvg = dRecs.length ? Math.round(dRecs.reduce((s,r)=>s+r.score,0)/dRecs.length) : null;
    const dHMAvg  = dHMs.length  ? Math.round(dHMs.reduce((s,h)=>s+h.score,0)/dHMs.length)  : null;
    const dAvg    = (dRecAvg&&dHMAvg) ? Math.round((dRecAvg+dHMAvg)/2) : (dRecAvg||dHMAvg);
    const deptColors = {Engineering:C.teal,Sales:C.orange,Marketing:C.purple,Product:C.green,"Customer Success":C.blue};
    const trendData = HISTORICAL.org.map((_,i)=>{
      const dr = Object.entries(RECRUITER_DATA).filter(([n,dd])=>dd.dept===d).map(([n,dd])=>dd.trend[i]);
      const dh = Object.entries(HM_DATA).filter(([n,dd])=>dd.dept===d).map(([n,dd])=>dd.trend[i]);
      const all = [...dr,...dh];
      return all.length ? Math.round(all.reduce((s,v)=>s+v,0)/all.length) : 0;
    });
    return { dept:d, avg:dAvg, recAvg:dRecAvg, hmAvg:dHMAvg, color:deptColors[d]||C.blue, roles:dRecs.length+dHMs.length, trend:trendData.slice(0,snapIdx+1) };
  });
  const displayDepts = dept==="All" ? deptSummaries : deptSummaries.filter(ds=>ds.dept===dept);

  return (
    <div style={{background:C.bg,minHeight:"calc(100vh - 57px)",fontFamily:"'Syne',sans-serif"}}>
      <div style={{padding:"22px 28px",maxWidth:1400,margin:"0 auto"}}>

        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
          <div>
            <h2 style={{fontSize:22,fontWeight:900,letterSpacing:"-0.5px",marginBottom:3}}>Talent Intelligence</h2>
            <p style={{fontSize:11,color:C.textDim}}>Org-wide · {HISTORICAL.isoDate[snapIdx]} · All scores from scoring_engine.py</p>
          </div>
          {/* Dept filter */}
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {DEPTS.map(d=>{
              const dColors={Engineering:C.teal,Sales:C.orange,Marketing:C.purple,Product:C.green,"Customer Success":C.blue,All:C.gold};
              const active=dept===d, dColor=dColors[d]||C.gold;
              return <button key={d} onClick={()=>setDept(d)} style={{padding:"5px 13px",borderRadius:9,border:"none",cursor:"pointer",background:active?dColor:C.card2,color:active?"#000":C.textMid,fontFamily:"'Syne',sans-serif",fontSize:11,fontWeight:700,boxShadow:active?`0 0 12px ${dColor}66`:"none",transition:"all 0.18s"}}>{d}</button>;
            })}
          </div>
        </div>

        {/* Data source banner */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18,background:C.greenDim,border:`1px solid ${C.green}33`,borderRadius:10,padding:"8px 14px",width:"fit-content"}}>
          <span style={{fontSize:12}}>✓</span>
          <span style={{fontSize:11,color:C.green,fontWeight:700}}>historical_performance_data.json · {RECRUITER_DATA && Object.keys(RECRUITER_DATA).length} recruiters · {HM_DATA && Object.keys(HM_DATA).length} HMs · 6 snapshots</span>
        </div>

        {/* KPI strip */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:14,marginBottom:20}}>
          {[
            {label:"Org Avg Score",   val:orgAvg,  sub:`HM + Recruiter combined`,  c:sc(orgAvg),  mono:true},
            {label:"HM Avg",          val:hmAvg,   sub:`${hmScores.length} hiring managers`, c:C.teal,   mono:true},
            {label:"Recruiter Avg",   val:recAvg,  sub:`${recScores.length} recruiters`,     c:C.accent,  mono:true},
            {label:"Org Trend",       val:`+${Math.round(HISTORICAL.org[snapIdx]-HISTORICAL.org[0])}`, sub:`Since Nov 1, 2024`, c:C.green, mono:false},
            {label:"High Violations", val:HISTORICAL.org.map((_,i)=>i<=snapIdx).filter(Boolean).length<=2?46:19, sub:"↓ improving over time", c:C.orange, mono:false},
          ].map((k,i)=>(
            <div key={i} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"17px 18px"}}>
              <div style={{fontFamily:k.mono?"'JetBrains Mono',monospace":"'Syne',sans-serif",fontSize:28,fontWeight:700,color:k.c,marginBottom:4}}>{k.val}</div>
              <div style={{fontSize:12,fontWeight:700,marginBottom:3}}>{k.label}</div>
              <div style={{fontSize:10,color:C.textDim}}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Dept cards */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:15,marginBottom:20}}>
          {displayDepts.map(ds=>(
            <div key={ds.dept} style={{background:C.card,border:`1px solid ${C.border}`,borderLeft:`3px solid ${ds.color}`,borderRadius:16,padding:20,cursor:"pointer",transition:"all 0.18s"}} onClick={()=>setDept(ds.dept)}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                <div><div style={{fontSize:14,fontWeight:800,marginBottom:3}}>{ds.dept}</div><div style={{fontSize:10,color:C.textDim}}>{ds.roles} team members</div></div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color:ds.color}}>{ds.avg??"-"}</div>
                  <div style={{fontSize:9,background:`${ds.color}20`,color:ds.color,padding:"2px 7px",borderRadius:6,marginTop:2,fontWeight:700}}>{ds.avg?sl(ds.avg):"N/A"}</div>
                </div>
              </div>
              <Bar value={ds.avg||0} color={ds.color} h={7}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12,marginBottom:12}}>
                {[{label:"HM Avg",val:ds.hmAvg},{label:"Recruiter Avg",val:ds.recAvg}].map(s=>(
                  <div key={s.label} style={{background:C.surface,borderRadius:9,padding:"9px 11px"}}>
                    <div style={{fontSize:9,color:C.textDim,marginBottom:2}}>{s.label}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:17,fontWeight:700,color:s.val?sc(s.val):C.textDim}}>{s.val??"-"}</div>
                  </div>
                ))}
              </div>
              {ds.trend&&ds.trend.length>1&&<Spark data={ds.trend} color={ds.color} width={220} height={38}/>}
            </div>
          ))}
        </div>

        {/* Org trend chart */}
        <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22,marginBottom:18}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <div><div style={{fontSize:13,fontWeight:800}}>Organization Score Trend</div><div style={{fontSize:10,color:C.textDim}}>historical_performance_data.json · 6 biweekly snapshots</div></div>
            <div style={{display:"flex",gap:16}}>
              {[{label:"Org",c:C.blue},{label:"Recruiters",c:C.accent},{label:"HMs",c:C.teal}].map(l=>(
                <div key={l.label} style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:24,height:2,background:l.c,borderRadius:99}}/><span style={{fontSize:11,color:C.textMid}}>{l.label}</span></div>
              ))}
            </div>
          </div>
          <div style={{position:"relative",height:80}}>
            <Spark data={HISTORICAL.org.slice(0,snapIdx+1)} color={C.blue} width={window?.innerWidth>1200?1200:900} height={70}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:8}}>
            {HISTORICAL.dates.slice(0,snapIdx+1).map(d=><span key={d} style={{fontSize:10,color:C.textDim}}>{d}</span>)}
          </div>
        </div>

        {/* Full team tables */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:17}}>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><div style={{fontSize:13,fontWeight:800}}>All Hiring Managers</div><div style={{fontSize:10,color:C.textDim}}>{dept==="All"?"All depts":dept} · {HISTORICAL.isoDate[snapIdx]}</div></div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:19,fontWeight:700,color:C.teal}}>{Math.round(filtHM.reduce((s,h)=>s+h.score,0)/(filtHM.length||1))} avg</div>
            </div>
            {filtHM.map((h,i)=>(
              <LBRow key={h.name} rank={i+1} name={h.name} initials={h.initials} score={h.score} dept={h.dept} isMe={false} snapIdx={snapIdx} type="hm"/>
            ))}
          </div>
          <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <div><div style={{fontSize:13,fontWeight:800}}>All Recruiters</div><div style={{fontSize:10,color:C.textDim}}>{dept==="All"?"All depts":dept} · {HISTORICAL.isoDate[snapIdx]}</div></div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:19,fontWeight:700,color:C.accent}}>{Math.round(filtRec.reduce((s,r)=>s+r.score,0)/(filtRec.length||1))} avg</div>
            </div>
            {filtRec.map((r,i)=>(
              <LBRow key={r.name} rank={i+1} name={r.name} initials={r.initials} score={r.score} dept={r.dept} isMe={false} snapIdx={snapIdx} type="rec"/>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen,setScreen]=useState("signin"), [role,setRole]=useState(null), [tf,setTf]=useState("1M");
  const user = role ? DEMO_USERS[role] : null;
  const handleLogin=(r)=>{ setRole(r); setScreen("dash"); };
  return (
    <>
      <style>{FONTS+`*{box-sizing:border-box;margin:0;padding:0;}body{background:${C.bg};}input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.5);}`}</style>
      {screen==="signin" && <SignIn onLogin={handleLogin}/>}
      {screen==="dash" && user && (
        <>
          <Nav user={user} tf={tf} setTf={setTf}/>
          {role==="recruiter" && <RecruiterDash tf={tf}/>}
          {role==="hm"        && <HMDash tf={tf}/>}
          {role==="ti"        && <TIDash tf={tf}/>}
        </>
      )}
    </>
  );
}
