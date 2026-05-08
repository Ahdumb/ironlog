import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import { supabase } from "./supabase";
import {
  deleteBodyWeight,
  deleteWorkoutFromDb,
  fetchBodyWeight,
  fetchCustomExercises,
  fetchWorkouts,
  saveBodyWeight,
  saveCustomExercise,
  saveWorkoutToDb,
} from "./data";
Chart.register(...registerables);

// EXERCISES
const DEFAULT_EXERCISES = [
  { id:"bench",     name:"Bench Press",           muscle:"Chest",        type:"push" },
  { id:"incline",   name:"Incline Dumbbell Press",muscle:"Upper Chest",  type:"push" },
  { id:"ohp",       name:"Overhead Press",        muscle:"Shoulders",    type:"push" },
  { id:"lateral",   name:"Lateral Raises",        muscle:"Side Delts",   type:"push" },
  { id:"tricep",    name:"Tricep Pushdown",        muscle:"Triceps",      type:"push" },
  { id:"dips",      name:"Weighted Dips",          muscle:"Chest/Triceps",type:"push" },
  { id:"cable_fly", name:"Cable Fly",              muscle:"Chest",        type:"push" },
  { id:"deadlift",  name:"Deadlift",               muscle:"Back",         type:"pull" },
  { id:"row",       name:"Barbell Row",            muscle:"Back",         type:"pull" },
  { id:"pullup",    name:"Pull-ups",               muscle:"Lats",         type:"pull" },
  { id:"cable_row", name:"Cable Row",              muscle:"Mid Back",     type:"pull" },
  { id:"curl",      name:"Barbell Curl",           muscle:"Biceps",       type:"pull" },
  { id:"hammer",    name:"Hammer Curls",           muscle:"Brachialis",   type:"pull" },
  { id:"face_pull", name:"Face Pull",              muscle:"Rear Delts",   type:"pull" },
  { id:"squat",     name:"Squat",                  muscle:"Quads",        type:"legs" },
  { id:"rdl",       name:"Romanian Deadlift",      muscle:"Hamstrings",   type:"legs" },
  { id:"leg_press", name:"Leg Press",              muscle:"Quads",        type:"legs" },
  { id:"lunges",    name:"Walking Lunges",         muscle:"Quads/Glutes", type:"legs" },
  { id:"leg_curl",  name:"Leg Curl",               muscle:"Hamstrings",   type:"legs" },
  { id:"calf",      name:"Calf Raises",            muscle:"Calves",       type:"legs" },
  { id:"hip_thrust",name:"Hip Thrust",             muscle:"Glutes",       type:"legs" },
];

const EXERCISE_GROUPS = ["push","pull","legs"];

const WEEK_DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

const WORKOUT_TYPE_META = {
  push: { label:"Push", color:"#c0392b", bg:"#fff0ee" },
  pull: { label:"Pull", color:"#1a5fa8", bg:"#eef3fb" },
  legs: { label:"Legs", color:"#2d7d46", bg:"#eef7f1" },
  upper: { label:"Upper", color:"#7b4ea0", bg:"#f4eefb" },
  lower: { label:"Lower", color:"#2d7d46", bg:"#eef7f1" },
  full_body: { label:"Full Body", color:"#1a7a8a", bg:"#eaf7f8" },
  chest: { label:"Chest", color:"#c0392b", bg:"#fff0ee" },
  back: { label:"Back", color:"#1a5fa8", bg:"#eef3fb" },
  shoulders: { label:"Shoulders", color:"#b05f0a", bg:"#fdf4e7" },
  arms: { label:"Arms", color:"#7b4ea0", bg:"#f4eefb" },
};

const SPLIT_TEMPLATES = [
  {
    id:"ppl",
    name:"Push / Pull / Legs",
    desc:"Six-day strength split with two rest days available.",
    days:[
      { day:"Monday",    type:"push", label:"Push", exercises:["bench","ohp","incline","lateral","tricep"] },
      { day:"Tuesday",   type:"pull", label:"Pull", exercises:["deadlift","row","pullup","curl","hammer"] },
      { day:"Wednesday", type:"rest", label:"Rest", exercises:[] },
      { day:"Thursday",  type:"legs", label:"Legs", exercises:["squat","rdl","leg_press","leg_curl","calf"] },
      { day:"Friday",    type:"push", label:"Push", exercises:["incline","ohp","lateral","dips","cable_fly"] },
      { day:"Saturday",  type:"pull", label:"Pull", exercises:["row","pullup","cable_row","curl","face_pull"] },
      { day:"Sunday",    type:"rest", label:"Rest", exercises:[] },
    ],
  },
  {
    id:"upper_lower",
    name:"Upper / Lower",
    desc:"Four training days with simple recovery spacing.",
    days:[
      { day:"Monday",    type:"upper", label:"Upper", exercises:["bench","row","ohp","pullup","curl"] },
      { day:"Tuesday",   type:"lower", label:"Lower", exercises:["squat","rdl","leg_press","calf"] },
      { day:"Wednesday", type:"rest", label:"Rest", exercises:[] },
      { day:"Thursday",  type:"upper", label:"Upper", exercises:["incline","cable_row","lateral","tricep","face_pull"] },
      { day:"Friday",    type:"lower", label:"Lower", exercises:["deadlift","lunges","leg_curl","hip_thrust","calf"] },
      { day:"Saturday",  type:"rest", label:"Rest", exercises:[] },
      { day:"Sunday",    type:"rest", label:"Rest", exercises:[] },
    ],
  },
  {
    id:"full_body",
    name:"Full Body",
    desc:"Three broad sessions for a lower-frequency week.",
    days:[
      { day:"Monday",    type:"full_body", label:"Full Body", exercises:["squat","bench","row","curl"] },
      { day:"Tuesday",   type:"rest", label:"Rest", exercises:[] },
      { day:"Wednesday", type:"full_body", label:"Full Body", exercises:["deadlift","ohp","pullup","tricep"] },
      { day:"Thursday",  type:"rest", label:"Rest", exercises:[] },
      { day:"Friday",    type:"full_body", label:"Full Body", exercises:["leg_press","incline","cable_row","lateral","calf"] },
      { day:"Saturday",  type:"rest", label:"Rest", exercises:[] },
      { day:"Sunday",    type:"rest", label:"Rest", exercises:[] },
    ],
  },
  {
    id:"body_part",
    name:"Body Part Split",
    desc:"Classic focused days for chest, back, legs, shoulders, and arms.",
    days:[
      { day:"Monday",    type:"chest", label:"Chest", exercises:["bench","incline","cable_fly","dips"] },
      { day:"Tuesday",   type:"back", label:"Back", exercises:["deadlift","row","pullup","cable_row"] },
      { day:"Wednesday", type:"legs", label:"Legs", exercises:["squat","rdl","leg_press","calf"] },
      { day:"Thursday",  type:"shoulders", label:"Shoulders", exercises:["ohp","lateral","face_pull"] },
      { day:"Friday",    type:"arms", label:"Arms", exercises:["curl","hammer","tricep","dips"] },
      { day:"Saturday",  type:"rest", label:"Rest", exercises:[] },
      { day:"Sunday",    type:"rest", label:"Rest", exercises:[] },
    ],
  },
];

// HELPERS
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""; }
function fmtDate(ts) { return new Date(ts).toLocaleDateString("en-US",{month:"short",day:"numeric"}); }
function fmtDateFull(ts) { return new Date(ts).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}); }
function uniq(arr) { return [...new Set(arr.filter(Boolean))]; }
function toTypeId(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "custom";
}
function typeLabel(type, labels = {}) {
  return labels[type] || WORKOUT_TYPE_META[type]?.label || cap(String(type || "rest").replace(/_/g, " "));
}
function defaultCustomRoutine() {
  return WEEK_DAYS.map(day => ({ day, type:"rest", label:"Rest", exercises:[] }));
}

function calcPRs(workouts) {
  const prs = {};
  workouts.forEach(w => w.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      const cur = prs[ex.id];
      if (!cur || s.weight > cur.weight || (s.weight === cur.weight && s.reps > cur.reps))
        prs[ex.id] = { weight:s.weight, reps:s.reps, date:w.date };
    });
  }));
  return prs;
}

function calcStreak(workouts) {
  if (!workouts.length) return 0;
  const today = new Date(); today.setHours(0,0,0,0);
  const dates = [...new Set(workouts.map(w => { const d = new Date(w.date); d.setHours(0,0,0,0); return d.getTime(); }))].sort((a,b) => b-a);
  let streak = 0, cur = today.getTime();
  for (const d of dates) {
    if (d === cur || d === cur-86400000) { streak++; cur = d-86400000; } else break;
  }
  return streak;
}

function getOverloadSuggestion(exId, workouts) {
  const sessions = workouts.filter(w=>w.exercises.find(e=>e.id===exId)).sort((a,b)=>b.date-a.date).slice(0,2);
  if (sessions.length < 2) return null;
  const allHit = sessions.every(w=>w.exercises.find(e=>e.id===exId).sets.every(s=>s.reps>=5));
  if (!allHit) return null;
  const maxW = Math.max(...sessions[0].exercises.find(e=>e.id===exId).sets.map(s=>s.weight));
  return Math.round((maxW+5)*10)/10;
}

function badgeStyle(type) {
  const meta = WORKOUT_TYPE_META[type];
  if (meta) return { background:meta.bg, color:meta.color };
  return { background:"#f4f4f2", color:"#9c9c97" };
}

// THEMES
const LIGHT = { bg:"#fafaf9",surface:"#ffffff",surface2:"#f4f4f2",border:"#e8e6e0",text:"#1a1a18",text2:"#6b6b67",text3:"#9c9c97",accent:"#00AEEF",accentHover:"#0077B6",accentSoft:"#E6F7FF",accentGlow:"#38D9FF",accentText:"#ffffff",warning:"#FFB020",warningBg:"#fff6df",danger:"#c0392b",dangerBg:"#fdf0ee",green:"#0077B6",greenBg:"#E6F7FF",gridLine:"rgba(0,0,0,.04)" };
const DARK  = { bg:"#0f0f0e",surface:"#1a1a18",surface2:"#252523",border:"#333330",text:"#f0ede8",text2:"#a8a49e",text3:"#6b6b67",accent:"#38D9FF",accentHover:"#00AEEF",accentSoft:"#102f3a",accentGlow:"#38D9FF",accentText:"#061015",warning:"#FFB020",warningBg:"#332713",danger:"#ff7f73",dangerBg:"#351b19",green:"#38D9FF",greenBg:"#102f3a",gridLine:"rgba(255,255,255,.04)" };

function hs(d) {
  return {
    h1:   { fontSize:26, fontWeight:700, letterSpacing:"-0.5px", marginBottom:4, color:d.text },
    h3:   { fontSize:15, fontWeight:600, marginBottom:12, color:d.text },
    sub:  { color:d.text3, fontSize:14, marginBottom:24 },
    card: { background:d.surface, border:`1px solid ${d.border}`, borderRadius:12, padding:20 },
    btn:  { display:"inline-flex", alignItems:"center", gap:6, padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", border:"none" },
    btnSm:{ display:"inline-flex", alignItems:"center", background:d.surface2, color:d.text2, border:`1px solid ${d.border}`, borderRadius:6, padding:"5px 10px", fontSize:12, cursor:"pointer" },
    input:{ fontFamily:"inherit", fontSize:14, border:`1px solid ${d.border}`, borderRadius:8, padding:"8px 12px", background:d.surface, color:d.text, outline:"none", width:"100%", boxSizing:"border-box" },
    label:{ fontSize:12, fontWeight:600, color:d.text2, display:"block", marginBottom:4 },
    overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center" },
    modal:{ background:d.surface, borderRadius:16, padding:28, width:540, maxWidth:"95vw", maxHeight:"88vh", overflowY:"auto" },
    th:   { textAlign:"left", padding:"7px 10px", fontSize:11, fontWeight:600, color:d.text3, textTransform:"uppercase", letterSpacing:".06em", borderBottom:`1px solid ${d.border}` },
    td:   { padding:"8px 10px", borderBottom:`1px solid ${d.border}20`, color:d.text },
  };
}

// ROOT APP
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem("il_dark")==="true");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const d = dark ? DARK : LIGHT;

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:d.bg, color:d.text, fontSize:15, fontFamily:"-apple-system,sans-serif" }}>
      Loading...
    </div>
  );

  if (!session) return <AuthPage d={d} dark={dark} toggleDark={()=>{ const v=!dark; setDark(v); localStorage.setItem("il_dark",v); }} />;

  return <MainApp session={session} d={d} dark={dark} toggleDark={()=>{ const v=!dark; setDark(v); localStorage.setItem("il_dark",v); }} />;
}

// AUTH PAGE
function AuthPage({ d, dark, toggleDark }) {
  const [mode, setMode]     = useState("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password:pass });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password:pass });
      if (error) setError(error.message);
      else setSuccess("Account created! Check your email to confirm, then log in.");
    }
    setLoading(false);
  }

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:d.bg, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ width:380, padding:36, background:d.surface, border:`1px solid ${d.border}`, borderRadius:20 }}>
        <div style={{ marginBottom:28, textAlign:"center" }}>
          <div style={{ fontSize:28, fontWeight:700, letterSpacing:"-1px", color:d.text }}>IronLog</div>
          <div style={{ fontSize:13, color:d.text3, marginTop:4 }}>Train. Track. Progress.</div>
        </div>

        <div style={{ display:"flex", background:d.surface2, borderRadius:10, padding:3, marginBottom:24 }}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");setSuccess("");}} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", background:mode===m?d.surface:"none", color:mode===m?d.text:d.text2, boxShadow:mode===m?"0 1px 3px rgba(0,0,0,.1)":"none" }}>
              {m==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        {success ? (
          <div style={{ background:d.accentSoft, color:d.accentHover, borderRadius:10, padding:"12px 16px", fontSize:13, marginBottom:16 }}>{success}</div>
        ) : (
          <>
            <div style={{ marginBottom:12 }}>
              <label style={hs(d).label}>Email</label>
              <input style={hs(d).input} type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} autoFocus />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={hs(d).label}>Password</label>
              <input style={hs(d).input} type="password" placeholder="********" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            </div>
            {error && <div style={{ background:d.dangerBg, color:d.danger, borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 }}>{error}</div>}
            <button onClick={handleSubmit} disabled={loading} style={{ ...hs(d).btn, background:d.accent, color:d.accentText, width:"100%", justifyContent:"center", padding:12, fontSize:14, opacity:loading?.6:1 }}>
              {loading ? "..." : mode==="login" ? "Sign In" : "Create Account"}
            </button>
          </>
        )}

        <button onClick={toggleDark} style={{ display:"block", margin:"20px auto 0", background:"none", border:"none", color:d.text3, fontSize:12, cursor:"pointer" }}>
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </div>
    </div>
  );
}

// MAIN APP
function MainApp({ session, d, dark, toggleDark }) {
  const userId = session.user.id;
  const [workouts, setWorkouts]   = useState([]);
  const [bwLog, setBwLog]         = useState([]);
  const [customEx, setCustomEx]   = useState([]);
  const [selectedSplitId, setSelectedSplitId] = useState(() => localStorage.getItem("il_split") || "ppl");
  const [customRoutine, setCustomRoutine] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("il_custom_routine")) || defaultCustomRoutine();
    } catch {
      return defaultCustomRoutine();
    }
  });
  const [page, setPage]           = useState("dashboard");
  const [logState, setLogState]   = useState({ type:"push", exercises:[], notes:"", date:new Date().toISOString().slice(0,10) });
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast]         = useState(null);
  const toastRef = useRef(null);

  const allEx  = useMemo(() => [...DEFAULT_EXERCISES, ...customEx], [customEx]);
  const prs    = useMemo(() => calcPRs(workouts), [workouts]);
  const streak = useMemo(() => calcStreak(workouts), [workouts]);
  const selectedTemplate = SPLIT_TEMPLATES.find(s => s.id === selectedSplitId) || SPLIT_TEMPLATES[0];
  const activeRoutine = selectedSplitId === "custom" ? customRoutine : selectedTemplate.days;
  const typeLabels = useMemo(() => {
    const entries = [...SPLIT_TEMPLATES.flatMap(s => s.days), ...customRoutine]
      .filter(day => day.type !== "rest")
      .map(day => [day.type, day.label]);
    return Object.fromEntries(entries);
  }, [customRoutine]);
  const workoutTypes = useMemo(() => uniq([
    ...Object.keys(WORKOUT_TYPE_META),
    ...activeRoutine.filter(day => day.type !== "rest").map(day => day.type),
    ...workouts.map(w => w.type),
  ]), [activeRoutine, workouts]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(()=>setToast(null), 2400);
  }, []);

  // Load all data on mount
  useEffect(() => {
    async function loadAll() {
      setDataLoading(true);
      try {
        const [w, bw, ce] = await Promise.all([fetchWorkouts(userId), fetchBodyWeight(userId), fetchCustomExercises(userId)]);
        setWorkouts(w); setBwLog(bw); setCustomEx(ce);
      } catch (error) {
        showToast(error.message || "Error loading data");
      } finally {
        setDataLoading(false);
      }
    }
    loadAll();
  }, [userId, showToast]);

  useEffect(() => {
    localStorage.setItem("il_split", selectedSplitId);
  }, [selectedSplitId]);

  useEffect(() => {
    localStorage.setItem("il_custom_routine", JSON.stringify(customRoutine));
  }, [customRoutine]);

  function navigate(p, newLog) { setPage(p); if (newLog) setLogState(newLog); }

  async function handleDeleteWorkout(id) {
    try {
      await deleteWorkoutFromDb(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
      showToast("Workout deleted");
    } catch (error) {
      showToast(error.message || "Error deleting workout");
    }
  }

  async function handleSubmitWorkout() {
    if (!logState.exercises.length) { showToast("Add at least one exercise"); return; }
    const ts = new Date(logState.date+"T12:00:00").getTime();
    const workout = { date:ts, type:logState.type, notes:logState.notes, exercises:JSON.parse(JSON.stringify(logState.exercises)) };
    showToast("Saving...");
    try {
      const newId = await saveWorkoutToDb(userId, workout);
      setWorkouts(prev => [{ ...workout, id:newId }, ...prev]);
      setLogState({ type:workoutTypes[0] || "push", exercises:[], notes:"", date:new Date().toISOString().slice(0,10) });
      showToast("Workout saved");
      navigate("history");
    } catch (error) {
      showToast(error.message || "Error saving workout");
    }
  }

  async function handleSaveBw(date, weight) {
    try {
      const row = await saveBodyWeight(userId, date, weight);
      const ts = typeof row.date === "number" ? row.date : new Date(row.date).getTime();
      setBwLog(prev => [...prev.filter(b => b.date !== date), { id:row.id, date:ts, weight:row.weight }].sort((a,b) => a.date - b.date));
      return true;
    } catch (error) {
      showToast(error.message || "Error saving weight");
      return false;
    }
  }

  async function handleDeleteBw(id) {
    try {
      await deleteBodyWeight(id);
      setBwLog(prev => prev.filter(b=>b.id!==id));
    } catch (error) {
      showToast(error.message || "Error deleting weight");
    }
  }

  async function handleSaveCustomEx(ex) {
    try {
      const row = await saveCustomExercise(userId, ex);
      setCustomEx(prev => [...prev, { id:"c_"+row.id, dbId:row.id, name:row.name, muscle:row.muscle||"", type:row.type||"push", custom:true }]);
      return true;
    } catch (error) {
      showToast(error.message || "Error saving exercise");
      return false;
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  const navItems = [
    { id:"dashboard",  label:"Dashboard",        icon:<GridIcon /> },
    { id:"log",        label:"Log Workout",      icon:<PlusIcon /> },
    { id:"history",    label:"History",          icon:<ClockIcon /> },
    { id:"prs",        label:"Personal Records", icon:<TrendIcon /> },
    { id:"bodyweight", label:"Body Weight",      icon:<ScaleIcon /> },
    { id:"routines",   label:"Routines",         icon:<ListIcon /> },
  ];

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", fontSize:15, color:d.text, background:d.bg }}>
      <aside style={{ width:220, minWidth:220, background:d.surface, borderRight:`1px solid ${d.border}`, display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"22px 20px 14px" }}>
          <div style={{ fontSize:20, fontWeight:700, letterSpacing:"-0.5px", color:d.text }}>IronLog</div>
          <div style={{ fontSize:11, color:d.text3, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{session.user.email}</div>
        </div>
        <div style={{ padding:"4px 12px 6px", fontSize:11, fontWeight:600, color:d.text3, letterSpacing:".08em", textTransform:"uppercase" }}>Menu</div>
        {navItems.map(n => (
          <button key={n.id} onClick={()=>navigate(n.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", margin:"1px 8px", borderRadius:8, cursor:"pointer", fontSize:14, border:"none", background:page===n.id?d.accentSoft:"none", color:page===n.id?d.accentHover:d.text2, width:"calc(100% - 16px)", textAlign:"left", boxShadow:page===n.id?`inset 3px 0 0 ${d.accent}`:"none" }}>
            {n.icon}{n.label}
          </button>
        ))}
        <div style={{ marginTop:"auto", padding:12, borderTop:`1px solid ${d.border}`, display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ background:d.greenBg, color:d.green, fontSize:12, fontWeight:600, padding:"8px 12px", borderRadius:8, display:"flex", alignItems:"center", gap:6 }}><strong>{streak}</strong> day streak</div>
          <button onClick={toggleDark} style={{ background:d.surface2, border:`1px solid ${d.border}`, borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:d.text2 }}>
            {dark ? "Light Mode" : "Dark Mode"}
          </button>
          <button onClick={handleSignOut} style={{ background:"none", border:`1px solid ${d.border}`, borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:d.text3 }}>
            Sign Out
          </button>
        </div>
      </aside>

      <main style={{ flex:1, overflowY:"auto", padding:32 }}>
        {dataLoading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:d.text3 }}>
            <div>
              <div style={{ fontSize:32, textAlign:"center", marginBottom:12 }}>...</div>
              <div style={{ fontSize:14 }}>Loading your data...</div>
            </div>
          </div>
        ) : (
          <>
            {page==="dashboard"  && <Dashboard workouts={workouts} prs={prs} bwLog={bwLog} allEx={allEx} navigate={navigate} deleteWorkout={handleDeleteWorkout} typeLabels={typeLabels} d={d} />}
            {page==="log"        && <LogWorkout logState={logState} setLogState={setLogState} prs={prs} workouts={workouts} allEx={allEx} workoutTypes={workoutTypes} typeLabels={typeLabels} saveCustomEx={handleSaveCustomEx} submit={handleSubmitWorkout} showToast={showToast} d={d} />}
            {page==="history"    && <History workouts={workouts} prs={prs} allEx={allEx} deleteWorkout={handleDeleteWorkout} typeLabels={typeLabels} d={d} />}
            {page==="prs"        && <PRs prs={prs} workouts={workouts} allEx={allEx} d={d} />}
            {page==="bodyweight" && <BodyWeight bwLog={bwLog} saveBw={handleSaveBw} deleteBw={handleDeleteBw} showToast={showToast} d={d} />}
            {page==="routines"   && <Routines splitTemplates={SPLIT_TEMPLATES} selectedSplitId={selectedSplitId} setSelectedSplitId={setSelectedSplitId} customRoutine={customRoutine} setCustomRoutine={setCustomRoutine} routine={activeRoutine} prs={prs} allEx={allEx} navigate={navigate} setLogState={setLogState} showToast={showToast} typeLabels={typeLabels} d={d} />}
          </>
        )}
      </main>

      {toast && <div style={{ position:"fixed", bottom:24, right:24, background:d.accentHover, color:"#ffffff", padding:"10px 18px", borderRadius:8, fontSize:13, fontWeight:500, zIndex:999, boxShadow:`0 10px 30px ${d.accent}55` }}>{toast}</div>}
    </div>
  );
}

// DASHBOARD
function Dashboard({ workouts, prs, bwLog, allEx, navigate, deleteWorkout, typeLabels, d }) {
  const totalVol = workouts.reduce((a,w)=>a+w.exercises.reduce((b,e)=>b+e.sets.reduce((c,s)=>c+s.reps*s.weight,0),0),0);
  const recent = [...workouts].sort((a,b)=>b.date-a.date).slice(0,3);
  const latestBW = bwLog.length ? [...bwLog].sort((a,b)=>b.date-a.date)[0] : null;
  return (
    <div>
      <h1 style={hs(d).h1}>Dashboard</h1>
      <p style={hs(d).sub}>Your training overview</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:20 }}>
        <StatCard val={workouts.length} label="Workouts" d={d}/>
        <StatCard val={(totalVol/1000).toFixed(0)+"k"} label="Volume lbs" d={d}/>
        <StatCard val={Object.keys(prs).length} label="PRs" d={d}/>
        <StatCard val={latestBW?latestBW.weight+"lbs":"-"} label="Body Weight" d={d}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={hs(d).card}><h3 style={hs(d).h3}>Volume by Type</h3><VolChart workouts={workouts} typeLabels={typeLabels} d={d}/></div>
        <div style={hs(d).card}><h3 style={hs(d).h3}>Volume by Muscle</h3><MuscleChart workouts={workouts} allEx={allEx} d={d}/></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={hs(d).card}><h3 style={hs(d).h3}>Bench Press Progress</h3><ProgressChart workouts={workouts} exId="bench" d={d}/></div>
        <div style={hs(d).card}><h3 style={hs(d).h3}>Squat Progress</h3><ProgressChart workouts={workouts} exId="squat" d={d}/></div>
      </div>
      <div style={hs(d).card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <h3 style={{...hs(d).h3,marginBottom:0}}>Recent Workouts</h3>
          <button style={hs(d).btnSm} onClick={()=>navigate("history")}>View all</button>
        </div>
        {recent.length ? recent.map(w=><WorkoutEntry key={w.id} w={w} prs={prs} allEx={allEx} onDelete={deleteWorkout} typeLabels={typeLabels} d={d}/>) : <Empty icon="" title="No workouts yet" desc="Head to Log Workout to get started" d={d}/>}
      </div>
    </div>
  );
}

function StatCard({ val, label, d }) {
  return (
    <div style={hs(d).card}>
      <div style={{ fontSize:24, fontWeight:700, letterSpacing:"-1px", color:d.text }}>{val}</div>
      <div style={{ fontSize:11, color:d.text3, marginTop:3, fontWeight:600, textTransform:"uppercase", letterSpacing:".06em" }}>{label}</div>
    </div>
  );
}

// CHARTS
function useChart(ref, config) {
  useEffect(()=>{
    if (!ref.current || !config) return undefined;
    const chart = new Chart(ref.current, config);
    return ()=>chart.destroy();
  }, [ref, config]);
}

function VolChart({ workouts, typeLabels, d }) {
  const ref = useRef();
  const config = useMemo(() => {
    const types=uniq(workouts.map(w=>w.type)).length ? uniq(workouts.map(w=>w.type)) : ["push","pull","legs"];
    const vols=types.map(t=>workouts.filter(w=>w.type===t).reduce((a,w)=>a+w.exercises.reduce((b,e)=>b+e.sets.reduce((c,s)=>c+s.reps*s.weight,0),0),0));
    const colors=types.map(t=>WORKOUT_TYPE_META[t]?.color || "#6b6b67");
    return { type:"bar", data:{ labels:types.map(t=>typeLabel(t, typeLabels)), datasets:[{ data:vols, backgroundColor:colors.map(c=>c+"33"), borderColor:colors, borderWidth:2, borderRadius:5 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ grid:{color:d.gridLine}, ticks:{color:d.text3,callback:v=>(v/1000).toFixed(0)+"k"} }, x:{ grid:{display:false}, ticks:{color:d.text3} } } } };
  }, [workouts, typeLabels, d]);
  useChart(ref, config);
  return <div style={{height:180}}><canvas ref={ref}/></div>;
}

function MuscleChart({ workouts, allEx, d }) {
  const ref = useRef();
  const config = useMemo(() => {
    const vol={};
    workouts.forEach(w=>w.exercises.forEach(ex=>{ const e=allEx.find(x=>x.id===ex.id); if(!e)return; const m=e.muscle.split("/")[0]; vol[m]=(vol[m]||0)+ex.sets.reduce((a,s)=>a+s.reps*s.weight,0); }));
    const sorted=Object.entries(vol).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const colors=["#c0392b","#1a5fa8","#2d7d46","#b05f0a","#7b4ea0","#1a7a8a"];
    return { type:"bar", data:{ labels:sorted.map(s=>s[0]), datasets:[{ data:sorted.map(s=>s[1]), backgroundColor:colors.map(c=>c+"33"), borderColor:colors, borderWidth:2, borderRadius:4 }] }, options:{ indexAxis:"y", responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{ grid:{color:d.gridLine}, ticks:{color:d.text3,callback:v=>(v/1000).toFixed(0)+"k"} }, y:{ grid:{display:false}, ticks:{color:d.text3,font:{size:11}} } } } };
  }, [workouts, allEx, d]);
  useChart(ref, config);
  return <div style={{height:180}}><canvas ref={ref}/></div>;
}

function ProgressChart({ workouts, exId, d }) {
  const ref = useRef();
  const config = useMemo(() => {
    const sessions=workouts.filter(w=>w.exercises.find(e=>e.id===exId)).sort((a,b)=>a.date-b.date).slice(-8);
    if (!sessions.length) return null;
    return { type:"line", data:{ labels:sessions.map(w=>fmtDate(w.date)), datasets:[{ data:sessions.map(w=>Math.max(...w.exercises.find(e=>e.id===exId).sets.map(s=>s.weight))), borderColor:d.accent, backgroundColor:d.accent+"18", borderWidth:2, pointBackgroundColor:d.accentHover, pointRadius:4, fill:true, tension:.35 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ grid:{color:d.gridLine}, ticks:{color:d.text3,callback:v=>v+"lbs"} }, x:{ grid:{display:false}, ticks:{color:d.text3} } } } };
  }, [workouts, exId, d]);
  useChart(ref, config);
  return <div style={{height:180}}><canvas ref={ref}/></div>;
}

function BWChart({ data, d }) {
  const ref = useRef();
  const config = useMemo(() => {
    const sorted=[...data].sort((a,b)=>a.date-b.date);
    if (!sorted.length) return null;
    return { type:"line", data:{ labels:sorted.map(e=>fmtDate(e.date)), datasets:[{ data:sorted.map(e=>e.weight), borderColor:d.accentHover, backgroundColor:d.accent+"18", borderWidth:2, pointBackgroundColor:d.accent, pointRadius:4, fill:true, tension:.35 }] }, options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{ grid:{color:d.gridLine}, ticks:{color:d.text3,callback:v=>v+"lbs"} }, x:{ grid:{display:false}, ticks:{color:d.text3} } } } };
  }, [data, d]);
  useChart(ref, config);
  return <div style={{height:220}}><canvas ref={ref}/></div>;
}

// WORKOUT ENTRY
function WorkoutEntry({ w, prs, allEx, onDelete, typeLabels, d }) {
  const [open, setOpen] = useState(false);
  const borderColor = WORKOUT_TYPE_META[w.type]?.color || d.border;
  const totalVol = w.exercises.reduce((a,e)=>a+e.sets.reduce((b,s)=>b+s.reps*s.weight,0),0);
  return (
    <div style={{ border:`1px solid ${d.border}`, borderLeft:`3px solid ${borderColor}`, borderRadius:10, marginBottom:10, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", background:d.surface, display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer" }} onClick={()=>setOpen(!open)}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontWeight:600, fontSize:14, color:d.text }}>{typeLabel(w.type, typeLabels)}</span>
            <span style={{...badgeStyle(w.type),display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{typeLabel(w.type, typeLabels)}</span>
          </div>
          <div style={{ fontSize:12, color:d.text3, marginTop:2 }}>{fmtDateFull(w.date)} / {w.exercises.length} exercises / {totalVol.toLocaleString()} lbs</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {onDelete && <button style={{ background:d.dangerBg, color:d.danger, border:"none", borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer" }} onClick={e=>{e.stopPropagation();onDelete(w.id)}}>Delete</button>}
          <span style={{ color:d.text3, fontSize:12 }}>{open?"^":"v"}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:"0 16px 12px", borderTop:`1px solid ${d.border}`, background:d.surface }}>
          {w.notes && <p style={{ fontStyle:"italic", fontSize:13, color:d.text2, margin:"10px 0" }}>"{w.notes}"</p>}
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Exercise","Sets","Best Set","RPE","Volume"].map(h=><th key={h} style={hs(d).th}>{h}</th>)}</tr></thead>
            <tbody>
              {w.exercises.map(ex=>{
                const exData=allEx.find(e=>e.id===ex.id);
                const best=ex.sets.reduce((b,s)=>s.weight>b.weight?s:b,ex.sets[0]);
                const vol=ex.sets.reduce((a,s)=>a+s.reps*s.weight,0);
                const isPR=prs[ex.id]&&prs[ex.id].weight===best.weight&&new Date(prs[ex.id].date).toDateString()===new Date(w.date).toDateString();
                const rpes=ex.sets.filter(s=>s.rpe).map(s=>s.rpe);
                return (
                  <tr key={ex.id}>
                    <td style={hs(d).td}>{exData?.name||ex.id}{isPR&&<span style={{ background:d.warningBg,color:d.warning,fontSize:10,fontWeight:700,padding:"2px 5px",borderRadius:4,marginLeft:6 }}>PR</span>}</td>
                    <td style={{...hs(d).td,color:d.text2}}>{ex.sets.length}</td>
                    <td style={{...hs(d).td,color:d.text2}}>{best.weight}lbs x {best.reps}</td>
                    <td style={{...hs(d).td,color:d.text3}}>{rpes.length?rpes.join(", "):"-"}</td>
                    <td style={{...hs(d).td,color:d.text2}}>{vol.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// REST TIMER
function RestTimer({ d }) {
  const [duration, setDuration] = useState(90);
  const [timeLeft, setTimeLeft] = useState(null);
  const [running, setRunning]   = useState(false);
  const intRef = useRef(null);

  useEffect(()=>{
    if (!running || timeLeft === null) return undefined;
    if (timeLeft <= 0) return undefined;

    intRef.current = setInterval(()=>{
      setTimeLeft(t => Math.max((t || 0) - 1, 0));
    }, 1000);
    return ()=>clearInterval(intRef.current);
  }, [running, timeLeft]);

  useEffect(()=>{
    if (running && timeLeft === 0) {
      const timer = setTimeout(()=>{
        setRunning(false);
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("IronLog", { body:"Rest time up" });
        }
      }, 0);
      return ()=>clearTimeout(timer);
    }
    return undefined;
  }, [running, timeLeft]);

  const display = timeLeft!==null?timeLeft:duration;
  const pct = timeLeft!==null?(timeLeft/duration)*100:100;
  const mins = Math.floor(display/60), secs = display%60;

  return (
    <div style={{...hs(d).card,marginBottom:16}}>
      <h3 style={hs(d).h3}>Rest Timer</h3>
      <div style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", gap:6 }}>
          {[60,90,120,180].map(t=>(
            <button key={t} onClick={()=>{setDuration(t);if(!running)setTimeLeft(null);}} style={{ padding:"5px 10px", borderRadius:6, border:`1px solid ${d.border}`, background:duration===t?d.accent:"none", color:duration===t?d.accentText:d.text2, fontSize:12, fontWeight:600, cursor:"pointer" }}>{t}s</button>
          ))}
        </div>
        <div style={{ width:64,height:64,borderRadius:"50%",border:`3px solid ${d.border}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",flexShrink:0 }}>
          <svg style={{ position:"absolute",inset:0,transform:"rotate(-90deg)" }} width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="29" fill="none" stroke={d.accent} strokeWidth="3" strokeDasharray={`${pct*1.822} 182.2`} strokeLinecap="round"/>
          </svg>
          <span style={{ fontFamily:"monospace",fontSize:13,fontWeight:700,color:d.text,zIndex:1 }}>{String(mins).padStart(2,"0")}:{String(secs).padStart(2,"0")}</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {!running
            ? <button style={{...hs(d).btn,background:d.accent,color:d.accentText}} onClick={()=>{setTimeLeft(duration);setRunning(true);}}>Start</button>
            : <button style={{...hs(d).btn,background:d.dangerBg,color:d.danger}} onClick={()=>{setRunning(false);clearInterval(intRef.current);}}>Stop</button>}
          <button style={{...hs(d).btn,background:d.surface2,color:d.text2,border:`1px solid ${d.border}`}} onClick={()=>{setRunning(false);clearInterval(intRef.current);setTimeLeft(null);}}>Reset</button>
        </div>
      </div>
    </div>
  );
}

// LOG WORKOUT
function LogWorkout({ logState, setLogState, prs, workouts, allEx, workoutTypes, typeLabels, saveCustomEx, submit, showToast, d }) {
  const [showExModal, setShowExModal]   = useState(false);
  const [showCustModal, setShowCustModal] = useState(false);
  const [exSearch, setExSearch]         = useState("");
  const [exFilter, setExFilter]         = useState("all");
  const [newEx, setNewEx]               = useState({ name:"", muscle:"", type:"push" });
  const [savingEx, setSavingEx]         = useState(false);

  function addSet(i) { const exs=JSON.parse(JSON.stringify(logState.exercises)); const last=exs[i].sets[exs[i].sets.length-1]; exs[i].sets.push({weight:last?.weight||0,reps:last?.reps||0,rpe:"",note:""}); setLogState({...logState,exercises:exs}); }
  function removeSet(i,si) { const exs=JSON.parse(JSON.stringify(logState.exercises)); exs[i].sets.splice(si,1); setLogState({...logState,exercises:exs}); }
  function removeEx(i) { const exs=JSON.parse(JSON.stringify(logState.exercises)); exs.splice(i,1); setLogState({...logState,exercises:exs}); }
  function updateSet(i,si,field,val) { const exs=JSON.parse(JSON.stringify(logState.exercises)); exs[i].sets[si][field]=["rpe","note"].includes(field)?val:parseFloat(val)||0; setLogState({...logState,exercises:exs}); }

  function addExercise(id) {
    const pr=prs[id]; const suggest=getOverloadSuggestion(id,workouts);
    const weight=suggest||pr?.weight||0;
    const note=suggest?`Try ${suggest}lbs`:"";
    setLogState({...logState,exercises:[...logState.exercises,{id,sets:[{weight,reps:pr?.reps||0,rpe:"",note}]}]});
    setShowExModal(false);
    if(suggest) showToast(`Try ${suggest}lbs on ${allEx.find(e=>e.id===id)?.name}`);
  }

  async function handleSaveCustEx() {
    if (!newEx.name.trim()) { showToast("Enter a name"); return; }
    setSavingEx(true);
    const saved = await saveCustomEx(newEx);
    setSavingEx(false);
    if (saved) {
      setNewEx({name:"",muscle:"",type:"push"});
      setShowCustModal(false);
      showToast("Exercise created!");
    }
  }

  const existing=logState.exercises.map(e=>e.id);
  const filtered=allEx.filter(e=>!existing.includes(e.id)&&(exFilter==="all"||e.type===exFilter)&&(e.name.toLowerCase().includes(exSearch.toLowerCase())||e.muscle.toLowerCase().includes(exSearch.toLowerCase())));

  return (
    <div>
      <h1 style={hs(d).h1}>Log Workout</h1>
      <p style={hs(d).sub}>Record today's session</p>
      <RestTimer d={d}/>
      <div style={{...hs(d).card,marginBottom:16}}>
        <h3 style={hs(d).h3}>Workout Type</h3>
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {workoutTypes.map(t=>(
            <button key={t} onClick={()=>setLogState({...logState,type:t})} style={{...hs(d).btn,...(logState.type===t?{background:d.accent,color:d.accentText}:{background:d.surface2,color:d.text,border:`1px solid ${d.border}`})}}>{typeLabel(t, typeLabels)}</button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div><label style={hs(d).label}>Date</label><input style={hs(d).input} type="date" value={logState.date} onChange={e=>setLogState({...logState,date:e.target.value})}/></div>
          <div><label style={hs(d).label}>Session Notes</label><input style={hs(d).input} type="text" placeholder="How did it feel?" value={logState.notes} onChange={e=>setLogState({...logState,notes:e.target.value})}/></div>
        </div>
      </div>
      <div style={{...hs(d).card,marginBottom:16}}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
          <h3 style={{...hs(d).h3,marginBottom:0}}>Exercises</h3>
          <button style={{...hs(d).btn,background:d.accent,color:d.accentText,padding:"6px 12px",fontSize:13}} onClick={()=>setShowExModal(true)}>+ Add Exercise</button>
        </div>
        {logState.exercises.length===0
          ? <Empty icon="" title="No exercises added" desc='Click "+ Add Exercise" to start' d={d}/>
          : logState.exercises.map((ex,i)=>{
            const exData=allEx.find(e=>e.id===ex.id);
            const pr=prs[ex.id]; const suggest=getOverloadSuggestion(ex.id,workouts);
            return (
              <div key={ex.id} style={{...hs(d).card,marginBottom:10,background:d.surface2}}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", gap:6 }}>
                    <span style={{ fontWeight:600, fontSize:14, color:d.text }}>{exData?.name||ex.id}</span>
                    {exData&&<span style={{ fontSize:11, color:d.text3 }}>{exData.muscle}</span>}
                    {pr&&<span style={{ fontSize:11, color:d.text3 }}>PR: {pr.weight}x{pr.reps}</span>}
                    {suggest&&<span style={{ fontSize:11, color:d.warning, background:d.warningBg, borderRadius:4, padding:"1px 5px" }}>{suggest}lbs</span>}
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button style={{ background:"none", border:"none", color:d.text2, padding:"4px 8px", borderRadius:6, cursor:"pointer", fontSize:13 }} onClick={()=>addSet(i)}>+ Set</button>
                    <button style={{ background:"none", border:"none", color:d.danger, padding:"4px 8px", borderRadius:6, cursor:"pointer", fontSize:13 }} onClick={()=>removeEx(i)}>x</button>
                  </div>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 1fr 72px 1fr 24px", gap:6, marginBottom:4 }}>
                  {["#","lbs","Reps","RPE","Note",""].map((h,i)=><div key={i} style={{ fontSize:10, color:d.text3, fontWeight:600 }}>{h}</div>)}
                </div>
                {ex.sets.map((set,si)=>(
                  <div key={si} style={{ display:"grid", gridTemplateColumns:"28px 1fr 1fr 72px 1fr 24px", gap:6, marginBottom:5, alignItems:"center" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:d.text3, textAlign:"center", background:d.border, borderRadius:5, padding:"4px 0" }}>{si+1}</div>
                    <input style={hs(d).input} type="number" value={set.weight||""} placeholder="lbs" onChange={e=>updateSet(i,si,"weight",e.target.value)}/>
                    <input style={hs(d).input} type="number" value={set.reps||""} placeholder="reps" onChange={e=>updateSet(i,si,"reps",e.target.value)}/>
                    <select style={hs(d).input} value={set.rpe} onChange={e=>updateSet(i,si,"rpe",e.target.value)}>
                      <option value="">-</option>
                      {[6,6.5,7,7.5,8,8.5,9,9.5,10].map(r=><option key={r} value={r}>{r}</option>)}
                    </select>
                    <input style={hs(d).input} type="text" value={set.note} placeholder="note..." onChange={e=>updateSet(i,si,"note",e.target.value)}/>
                    <button style={{ background:"none", border:"none", color:d.text3, cursor:"pointer" }} onClick={()=>removeSet(i,si)}>x</button>
                  </div>
                ))}
              </div>
            );
          })
        }
      </div>
      {logState.exercises.length>0&&(
        <button style={{...hs(d).btn,background:d.accent,color:d.accentText,width:"100%",justifyContent:"center",padding:14,fontSize:15}} onClick={submit}>Save Workout</button>
      )}

      {showExModal&&(
        <div style={hs(d).overlay} onClick={()=>setShowExModal(false)}>
          <div style={hs(d).modal} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h2 style={{ fontSize:18, fontWeight:600, color:d.text }}>Add Exercise</h2>
              <button style={{ background:"none", border:"none", color:d.text3, cursor:"pointer", fontSize:18 }} onClick={()=>setShowExModal(false)}>x</button>
            </div>
            <input style={{...hs(d).input,marginBottom:10}} placeholder="Search by name or muscle..." value={exSearch} onChange={e=>setExSearch(e.target.value)} autoFocus/>
            <div style={{ display:"flex", gap:4, marginBottom:10 }}>
              {["all",...EXERCISE_GROUPS].map(t=>(
                <button key={t} onClick={()=>setExFilter(t)} style={{ padding:"4px 10px", borderRadius:6, border:`1px solid ${d.border}`, background:exFilter===t?d.accent:"none", color:exFilter===t?d.accentText:d.text2, fontSize:12, cursor:"pointer" }}>{cap(t)}</button>
              ))}
            </div>
            <div style={{ maxHeight:300, overflowY:"auto" }}>
              {filtered.length===0
                ? <p style={{ color:d.text3, fontSize:13 }}>No exercises found</p>
                : filtered.map(e=>(
                  <div key={e.id} onClick={()=>addExercise(e.id)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", borderRadius:8, border:`1px solid ${d.border}`, marginBottom:5, cursor:"pointer", background:d.surface }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:500, color:d.text }}>{e.name}{e.custom&&<span style={{ fontSize:10, color:d.text3, marginLeft:5 }}>custom</span>}</div>
                      <div style={{ fontSize:12, color:d.text3 }}>{e.muscle}</div>
                    </div>
                    <span style={{...badgeStyle(e.type),display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{cap(e.type)}</span>
                  </div>
                ))
              }
            </div>
            <button style={{...hs(d).btn,background:"none",border:`1px dashed ${d.border}`,color:d.text2,width:"100%",justifyContent:"center",marginTop:10}} onClick={()=>{setShowExModal(false);setShowCustModal(true);}}>+ Create Custom Exercise</button>
          </div>
        </div>
      )}

      {showCustModal&&(
        <div style={hs(d).overlay} onClick={()=>setShowCustModal(false)}>
          <div style={{...hs(d).modal,maxWidth:380}} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontSize:18, fontWeight:600, color:d.text }}>Custom Exercise</h2>
              <button style={{ background:"none", border:"none", color:d.text3, cursor:"pointer", fontSize:18 }} onClick={()=>setShowCustModal(false)}>x</button>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <div><label style={hs(d).label}>Name</label><input style={hs(d).input} placeholder="e.g. Cable Lateral Raise" value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})}/></div>
              <div><label style={hs(d).label}>Muscle Group</label><input style={hs(d).input} placeholder="e.g. Side Delts" value={newEx.muscle} onChange={e=>setNewEx({...newEx,muscle:e.target.value})}/></div>
              <div><label style={hs(d).label}>Exercise Group</label>
                <select style={hs(d).input} value={newEx.type} onChange={e=>setNewEx({...newEx,type:e.target.value})}>
                  <option value="push">Push</option><option value="pull">Pull</option><option value="legs">Legs</option>
                </select>
              </div>
              <button style={{...hs(d).btn,background:d.accent,color:d.accentText,justifyContent:"center",padding:12,opacity:savingEx?.6:1}} onClick={handleSaveCustEx} disabled={savingEx}>{savingEx?"Saving...":"Save Exercise"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// HISTORY
function History({ workouts, prs, allEx, deleteWorkout, typeLabels, d }) {
  const sorted=[...workouts].sort((a,b)=>b.date-a.date);
  return (
    <div>
      <h1 style={hs(d).h1}>History</h1>
      <p style={hs(d).sub}>{sorted.length} sessions logged</p>
      {sorted.length===0?<Empty icon="" title="No workouts yet" desc="Head to Log Workout to get started" d={d}/>:sorted.map(w=><WorkoutEntry key={w.id} w={w} prs={prs} allEx={allEx} onDelete={deleteWorkout} typeLabels={typeLabels} d={d}/>)}
    </div>
  );
}

// PRs
function PRs({ prs, workouts, allEx, d }) {
  return (
    <div>
      <h1 style={hs(d).h1}>Personal Records</h1>
      <p style={hs(d).sub}>{Object.keys(prs).length} PRs tracked</p>
      {EXERCISE_GROUPS.map(type=>(
        <div key={type} style={{...hs(d).card,marginBottom:16}}>
          <h3 style={{...hs(d).h3,display:"flex",alignItems:"center",gap:8}}>
            {cap(type)} Exercises <span style={{...badgeStyle(type),display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{cap(type)}</span>
          </h3>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Exercise","Best Weight","Reps","Est. 1RM","Overload Suggestion","Date"].map(h=><th key={h} style={hs(d).th}>{h}</th>)}</tr></thead>
            <tbody>
              {allEx.filter(e=>e.type===type).map(e=>{
                const pr=prs[e.id]; const suggest=getOverloadSuggestion(e.id,workouts);
                if(!pr) return <tr key={e.id}><td style={hs(d).td}>{e.name}</td><td style={{...hs(d).td,color:d.text3,fontStyle:"italic"}} colSpan={5}>Not logged yet</td></tr>;
                const orm=Math.round(pr.weight*(1+pr.reps/30));
                return (
                  <tr key={e.id}>
                    <td style={{...hs(d).td,fontWeight:500}}>{e.name}</td>
                    <td style={{...hs(d).td,fontWeight:700}}>{pr.weight} lbs</td>
                    <td style={{...hs(d).td,color:d.text2}}>{pr.reps}</td>
                    <td style={{...hs(d).td,color:d.text2}}>{orm} lbs</td>
                    <td style={hs(d).td}>{suggest?<span style={{ background:d.warningBg,color:d.warning,fontSize:11,fontWeight:600,padding:"2px 7px",borderRadius:4 }}>{suggest}lbs</span>:<span style={{ color:d.text3 }}>-</span>}</td>
                    <td style={{...hs(d).td,color:d.text3}}>{fmtDate(pr.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// BODY WEIGHT
function BodyWeight({ bwLog, saveBw, deleteBw, showToast, d }) {
  const [weight, setWeight] = useState("");
  const [date, setDate]     = useState(new Date().toISOString().slice(0,10));
  const [saving, setSaving] = useState(false);
  const sorted=[...bwLog].sort((a,b)=>b.date-a.date);
  const latest=sorted[0]; const oldest=sorted[sorted.length-1];
  const change=latest&&oldest&&sorted.length>1?(latest.weight-oldest.weight).toFixed(1):null;

  async function log() {
    if(!weight){showToast("Enter a weight");return;}
    setSaving(true);
    const ts=new Date(date+"T12:00:00").getTime();
    const saved = await saveBw(ts, parseFloat(weight));
    setSaving(false);
    if (saved) {
      setWeight("");
      showToast("Weight logged!");
    }
  }

  return (
    <div>
      <h1 style={hs(d).h1}>Body Weight</h1>
      <p style={hs(d).sub}>Track your weight over time</p>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        <StatCard val={latest?latest.weight+"lbs":"-"} label="Current" d={d}/>
        <StatCard val={change!==null?(change>0?"+":"")+change+"lbs":"-"} label="Total Change" d={d}/>
        <StatCard val={sorted.length} label="Entries" d={d}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={hs(d).card}>
          <h3 style={hs(d).h3}>Log Weight</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:12 }}>
            <div><label style={hs(d).label}>Date</label><input style={hs(d).input} type="date" value={date} onChange={e=>setDate(e.target.value)}/></div>
            <div><label style={hs(d).label}>Weight (lbs)</label><input style={hs(d).input} type="number" placeholder="180.5" value={weight} onChange={e=>setWeight(e.target.value)}/></div>
          </div>
          <button style={{...hs(d).btn,background:d.accent,color:d.accentText,width:"100%",justifyContent:"center",opacity:saving?.6:1}} onClick={log} disabled={saving}>{saving?"Saving...":"Log Weight"}</button>
        </div>
        <div style={hs(d).card}>
          <h3 style={hs(d).h3}>Recent Entries</h3>
          <div style={{ maxHeight:165, overflowY:"auto" }}>
            {sorted.slice(0,8).map((e)=>(
              <div key={e.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"6px 0", borderBottom:`1px solid ${d.border}20` }}>
                <span style={{ fontSize:13, color:d.text2 }}>{fmtDate(e.date)}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:14, fontWeight:600, color:d.text }}>{e.weight} lbs</span>
                  <button onClick={()=>deleteBw(e.id)} style={{ background:"none", border:"none", color:d.text3, cursor:"pointer" }}>x</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={hs(d).card}><h3 style={hs(d).h3}>Weight Over Time</h3><BWChart data={bwLog} d={d}/></div>
    </div>
  );
}

// ROUTINES
function Routines({ splitTemplates, selectedSplitId, setSelectedSplitId, customRoutine, setCustomRoutine, routine, prs, allEx, navigate, setLogState, showToast, typeLabels, d }) {
  const selectedTemplate = splitTemplates.find(s => s.id === selectedSplitId);
  function startDay(di) {
    const day=routine[di];
    if (day.type === "rest") return;
    setLogState({ type:day.type, notes:"", date:new Date().toISOString().slice(0,10), exercises:day.exercises.map(id=>{ const pr=prs[id]; return {id,sets:[{weight:pr?.weight||0,reps:pr?.reps||0,rpe:"",note:""}]}; }) });
    navigate("log");
    showToast(`${day.day} ${day.label || typeLabel(day.type, typeLabels)} loaded!`);
  }

  function copyCurrentToCustom() {
    setCustomRoutine(routine.map(day => ({ ...day, exercises:[...day.exercises] })));
    setSelectedSplitId("custom");
    showToast("Copied to custom split");
  }

  return (
    <div>
      <h1 style={hs(d).h1}>Routines</h1>
      <p style={hs(d).sub}>Choose a common split or build your own weekly plan</p>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:16 }}>
        {splitTemplates.map(split=>(
          <button key={split.id} onClick={()=>setSelectedSplitId(split.id)} style={{ ...hs(d).card, textAlign:"left", cursor:"pointer", padding:14, background:selectedSplitId===split.id?d.surface2:d.surface }}>
            <div style={{ fontWeight:700, color:d.text, marginBottom:4 }}>{split.name}</div>
            <div style={{ fontSize:12, color:d.text3, lineHeight:1.35 }}>{split.desc}</div>
          </button>
        ))}
        <button onClick={()=>setSelectedSplitId("custom")} style={{ ...hs(d).card, textAlign:"left", cursor:"pointer", padding:14, background:selectedSplitId==="custom"?d.surface2:d.surface }}>
          <div style={{ fontWeight:700, color:d.text, marginBottom:4 }}>Custom</div>
          <div style={{ fontSize:12, color:d.text3, lineHeight:1.35 }}>Make your own weekly split and save it locally.</div>
        </button>
      </div>

      {selectedSplitId === "custom" ? (
        <CustomSplitEditor routine={customRoutine} setRoutine={setCustomRoutine} allEx={allEx} d={d} />
      ) : (
        <div style={{ marginBottom:16, display:"flex", justifyContent:"space-between", alignItems:"center", gap:12 }}>
          <div>
            <h2 style={{ fontSize:18, color:d.text, margin:"0 0 3px" }}>{selectedTemplate?.name}</h2>
            <div style={{ fontSize:13, color:d.text3 }}>{selectedTemplate?.desc}</div>
          </div>
          <button style={{...hs(d).btn,background:d.surface2,color:d.text2,border:`1px solid ${d.border}`}} onClick={copyCurrentToCustom}>Customize This</button>
        </div>
      )}

      <div style={hs(d).card}>
        <h3 style={{...hs(d).h3,marginBottom:16}}>Weekly Schedule</h3>
        {routine.map((day,di)=><RoutineDay key={`${day.day}-${di}`} day={day} prs={prs} allEx={allEx} onStart={()=>startDay(di)} typeLabels={typeLabels} d={d}/>)}
      </div>
    </div>
  );
}

function CustomSplitEditor({ routine, setRoutine, allEx, d }) {
  function updateDay(index, updater) {
    setRoutine(prev => prev.map((day, i) => i === index ? updater(day) : day));
  }

  function setLabel(index, label) {
    updateDay(index, day => {
      const trimmed = label.trim();
      const isRest = !trimmed || trimmed.toLowerCase() === "rest";
      return {
        ...day,
        label,
        type: isRest ? "rest" : toTypeId(trimmed),
        exercises: isRest ? [] : day.exercises,
      };
    });
  }

  function addExercise(index, id) {
    if (!id) return;
    updateDay(index, day => day.exercises.includes(id) ? day : { ...day, exercises:[...day.exercises, id] });
  }

  function removeExercise(index, id) {
    updateDay(index, day => ({ ...day, exercises:day.exercises.filter(exId => exId !== id) }));
  }

  function markRest(index) {
    updateDay(index, day => ({ ...day, type:"rest", label:"Rest", exercises:[] }));
  }

  return (
    <div style={{...hs(d).card,marginBottom:16}}>
      <h3 style={hs(d).h3}>Custom Split</h3>
      <div style={{ display:"grid", gap:10 }}>
        {routine.map((day, index)=>{
          const isRest = day.type === "rest";
          const available = allEx.filter(ex => !day.exercises.includes(ex.id));
          return (
            <div key={day.day} style={{ border:`1px solid ${d.border}`, borderRadius:8, padding:12 }}>
              <div style={{ display:"grid", gridTemplateColumns:"110px 1fr auto", gap:10, alignItems:"center", marginBottom:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:d.text }}>{day.day}</div>
                <input style={hs(d).input} value={day.label} placeholder="Upper A, Full Body, Arms..." onChange={e=>setLabel(index, e.target.value)} />
                <button style={hs(d).btnSm} onClick={()=>markRest(index)}>Rest</button>
              </div>
              {!isRest && (
                <>
                  <select style={{...hs(d).input,marginBottom:8}} value="" onChange={e=>addExercise(index, e.target.value)}>
                    <option value="">Add exercise...</option>
                    {available.map(ex=><option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {day.exercises.map(id=>{
                      const ex = allEx.find(e=>e.id===id);
                      if (!ex) return null;
                      return (
                        <span key={id} style={{ display:"inline-flex", alignItems:"center", gap:6, background:d.surface2, color:d.text2, border:`1px solid ${d.border}`, borderRadius:20, padding:"3px 8px", fontSize:12 }}>
                          {ex.name}
                          <button onClick={()=>removeExercise(index, id)} style={{ background:"none", border:"none", color:d.text3, cursor:"pointer", padding:0 }}>x</button>
                        </span>
                      );
                    })}
                    {!day.exercises.length && <span style={{ color:d.text3, fontSize:12 }}>No exercises selected</span>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoutineDay({ day, prs, allEx, onStart, typeLabels, d }) {
  const [open, setOpen] = useState(false);
  const borderColor=WORKOUT_TYPE_META[day.type]?.color || d.border;
  const label = day.label || typeLabel(day.type, typeLabels);
  return (
    <div style={{ border:`1px solid ${d.border}`, borderLeft:`3px solid ${borderColor}`, borderRadius:8, marginBottom:6, overflow:"hidden" }}>
      <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", background:d.surface }} onClick={()=>setOpen(!open)}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontWeight:600, fontSize:13, color:d.text }}>{day.day}</span>
          <span style={{...badgeStyle(day.type),display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{label}</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {day.type!=="rest"&&day.exercises.length>0&&<button style={{...hs(d).btn,background:d.accent,color:d.accentText,padding:"5px 12px",fontSize:12}} onClick={e=>{e.stopPropagation();onStart()}}>Start</button>}
          <span style={{ color:d.text3, fontSize:12 }}>{open?"^":"v"}</span>
        </div>
      </div>
      {open&&(
        <div style={{ padding:"0 14px 12px", borderTop:`1px solid ${d.border}`, background:d.surface }}>
          {day.exercises.length>0?(
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13, marginTop:10 }}>
              <thead><tr>{["Exercise","Muscle","Your PR"].map(h=><th key={h} style={hs(d).th}>{h}</th>)}</tr></thead>
              <tbody>
                {day.exercises.map(id=>{ const ex=allEx.find(e=>e.id===id); const pr=prs[id];
                  return ex?(<tr key={id}>
                    <td style={hs(d).td}>{ex.name}</td>
                    <td style={{...hs(d).td,color:d.text3}}>{ex.muscle}</td>
                    <td style={hs(d).td}>{pr?<span style={{ background:d.warningBg,color:d.warning,fontSize:11,padding:"2px 6px",borderRadius:4 }}>{pr.weight}x{pr.reps}</span>:<span style={{ color:d.text3 }}>-</span>}</td>
                  </tr>):null;
                })}
              </tbody>
            </table>
          ):<p style={{ color:d.text3, fontSize:13, paddingTop:10 }}>Rest day</p>}
        </div>
      )}
    </div>
  );
}

// EMPTY / ICONS
function Empty({ icon, title, desc, d }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 24px", color:d?.text3||"#9c9c97" }}>
      <div style={{ fontSize:36, marginBottom:10, opacity:.4 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:600, color:d?.text2||"#6b6b67", marginBottom:4 }}>{title}</div>
      {desc&&<div style={{ fontSize:13 }}>{desc}</div>}
    </div>
  );
}

function GridIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>; }
function PlusIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>; }
function ClockIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>; }
function TrendIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function ListIcon()  { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>; }
function ScaleIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6l9-3 9 3"/><path d="M3 6v14a1 1 0 001 1h16a1 1 0 001-1V6"/><path d="M12 3v18"/></svg>; }
