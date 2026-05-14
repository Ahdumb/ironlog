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
  syncUserProfile,
  searchUsers,
  fetchUserProfileById,
  fetchUserProfiles,
  fetchFriendships,
  sendFriendRequest,
  acceptFriendRequest,
  deleteFriendship,
} from "./data";
Chart.register(...registerables);

// EXERCISES
const DEFAULT_EXERCISES = [
  // PUSH — Chest
  { id:"bench",          name:"Bench Press",                  muscle:"Chest",         type:"push" },
  { id:"incline_bb",     name:"Incline Barbell Press",        muscle:"Upper Chest",   type:"push" },
  { id:"incline",        name:"Incline Dumbbell Press",       muscle:"Upper Chest",   type:"push" },
  { id:"decline_bench",  name:"Decline Bench Press",          muscle:"Lower Chest",   type:"push" },
  { id:"db_bench",       name:"Flat Dumbbell Press",          muscle:"Chest",         type:"push" },
  { id:"cable_fly",      name:"Cable Fly",                    muscle:"Chest",         type:"push" },
  { id:"pec_deck",       name:"Pec Deck / Machine Fly",       muscle:"Chest",         type:"push" },
  { id:"dips",           name:"Weighted Dips",                muscle:"Chest/Triceps", type:"push" },
  { id:"machine_press",  name:"Machine Chest Press",          muscle:"Chest",         type:"push" },
  { id:"pushup",         name:"Push-ups",                     muscle:"Chest",         type:"push" },
  // PUSH — Shoulders
  { id:"ohp",            name:"Overhead Press",               muscle:"Shoulders",     type:"push" },
  { id:"db_ohp",         name:"Dumbbell Shoulder Press",      muscle:"Shoulders",     type:"push" },
  { id:"arnold",         name:"Arnold Press",                 muscle:"Shoulders",     type:"push" },
  { id:"machine_ohp",    name:"Machine Shoulder Press",       muscle:"Shoulders",     type:"push" },
  { id:"lateral",        name:"Lateral Raises",               muscle:"Side Delts",    type:"push" },
  { id:"cable_lateral",  name:"Cable Lateral Raises",         muscle:"Side Delts",    type:"push" },
  { id:"front_raise",    name:"Front Raises",                 muscle:"Front Delts",   type:"push" },
  // PUSH — Triceps
  { id:"tricep",         name:"Tricep Pushdown",              muscle:"Triceps",       type:"push" },
  { id:"skullcrusher",   name:"Skull Crushers",               muscle:"Triceps",       type:"push" },
  { id:"closegrip",      name:"Close Grip Bench Press",       muscle:"Triceps",       type:"push" },
  { id:"oh_tricep_ext",  name:"Overhead Tricep Extension",    muscle:"Triceps",       type:"push" },
  { id:"tricep_kick",    name:"Tricep Kickbacks",             muscle:"Triceps",       type:"push" },
  { id:"jm_press",       name:"JM Press",                     muscle:"Triceps",       type:"push" },
  // PULL — Back
  { id:"deadlift",       name:"Deadlift",                     muscle:"Back",          type:"pull" },
  { id:"rack_pull",      name:"Rack Pulls",                   muscle:"Back",          type:"pull" },
  { id:"row",            name:"Barbell Row",                  muscle:"Back",          type:"pull" },
  { id:"pendlay",        name:"Pendlay Row",                  muscle:"Back",          type:"pull" },
  { id:"tbar_row",       name:"T-Bar Row",                    muscle:"Back",          type:"pull" },
  { id:"db_row",         name:"Dumbbell Row",                 muscle:"Back",          type:"pull" },
  { id:"chest_row",      name:"Chest Supported Row",          muscle:"Mid Back",      type:"pull" },
  { id:"machine_row",    name:"Machine Row",                  muscle:"Mid Back",      type:"pull" },
  { id:"cable_row",      name:"Cable Row",                    muscle:"Mid Back",      type:"pull" },
  { id:"low_row",        name:"Low Cable Row",                muscle:"Mid Back",      type:"pull" },
  { id:"pullup",         name:"Pull-ups",                     muscle:"Lats",          type:"pull" },
  { id:"chinup",         name:"Chin-ups",                     muscle:"Lats/Biceps",   type:"pull" },
  { id:"lat_pulldown",   name:"Lat Pulldown",                 muscle:"Lats",          type:"pull" },
  { id:"straight_arm",   name:"Straight Arm Pulldown",        muscle:"Lats",          type:"pull" },
  // PULL — Biceps
  { id:"curl",           name:"Barbell Curl",                 muscle:"Biceps",        type:"pull" },
  { id:"hammer",         name:"Hammer Curls",                 muscle:"Brachialis",    type:"pull" },
  { id:"preacher",       name:"Preacher Curl",                muscle:"Biceps",        type:"pull" },
  { id:"incline_curl",   name:"Incline Dumbbell Curl",        muscle:"Biceps",        type:"pull" },
  { id:"spider_curl",    name:"Spider Curl",                  muscle:"Biceps",        type:"pull" },
  { id:"cable_curl",     name:"Cable Curl",                   muscle:"Biceps",        type:"pull" },
  { id:"reverse_curl",   name:"Reverse Curl",                 muscle:"Brachialis",    type:"pull" },
  { id:"concentration",  name:"Concentration Curl",           muscle:"Biceps",        type:"pull" },
  // PULL — Rear Delts / Upper Back
  { id:"face_pull",      name:"Face Pull",                    muscle:"Rear Delts",    type:"pull" },
  { id:"rear_fly",       name:"Rear Delt Fly",                muscle:"Rear Delts",    type:"pull" },
  { id:"shrug",          name:"Barbell Shrug",                muscle:"Traps",         type:"pull" },
  { id:"db_shrug",       name:"Dumbbell Shrug",               muscle:"Traps",         type:"pull" },
  // LEGS — Quads
  { id:"squat",          name:"Squat",                        muscle:"Quads",         type:"legs" },
  { id:"front_squat",    name:"Front Squat",                  muscle:"Quads",         type:"legs" },
  { id:"box_squat",      name:"Box Squat",                    muscle:"Quads",         type:"legs" },
  { id:"pause_squat",    name:"Pause Squat",                  muscle:"Quads",         type:"legs" },
  { id:"hack_squat",     name:"Hack Squat",                   muscle:"Quads",         type:"legs" },
  { id:"leg_press",      name:"Leg Press",                    muscle:"Quads",         type:"legs" },
  { id:"leg_ext",        name:"Leg Extension",                muscle:"Quads",         type:"legs" },
  { id:"goblet",         name:"Goblet Squat",                 muscle:"Quads",         type:"legs" },
  { id:"step_up",        name:"Step Ups",                     muscle:"Quads/Glutes",  type:"legs" },
  // LEGS — Hamstrings / Glutes
  { id:"rdl",            name:"Romanian Deadlift",            muscle:"Hamstrings",    type:"legs" },
  { id:"sumo_dl",        name:"Sumo Deadlift",                muscle:"Hamstrings",    type:"legs" },
  { id:"good_morning",   name:"Good Mornings",                muscle:"Hamstrings",    type:"legs" },
  { id:"leg_curl",       name:"Leg Curl",                     muscle:"Hamstrings",    type:"legs" },
  { id:"nordic",         name:"Nordic Hamstring Curl",        muscle:"Hamstrings",    type:"legs" },
  { id:"hip_thrust",     name:"Hip Thrust",                   muscle:"Glutes",        type:"legs" },
  { id:"glute_kick",     name:"Glute Kickback",               muscle:"Glutes",        type:"legs" },
  { id:"lunges",         name:"Walking Lunges",               muscle:"Quads/Glutes",  type:"legs" },
  { id:"bulgarian",      name:"Bulgarian Split Squat",        muscle:"Quads/Glutes",  type:"legs" },
  { id:"single_leg_press",name:"Single Leg Press",           muscle:"Quads/Glutes",  type:"legs" },
  { id:"rev_hyper",      name:"Reverse Hyperextension",       muscle:"Glutes/Hams",   type:"legs" },
  // LEGS — Calves
  { id:"calf",           name:"Calf Raises",                  muscle:"Calves",        type:"legs" },
  { id:"seated_calf",    name:"Seated Calf Raises",           muscle:"Calves",        type:"legs" },
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
function urlBase64ToUint8Array(b64) {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function fmtHour(h) {
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  return h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
}

const EX_ABBREVS = { db:"dumbbell", bb:"barbell", ohp:"overhead press", rdl:"romanian deadlift", cgb:"close grip", inc:"incline", dec:"decline", ez:"ez bar", lat:"lat", bw:"bodyweight" };

function matchesExSearch(ex, query) {
  if (!query.trim()) return true;
  let q = query.toLowerCase().trim();
  Object.entries(EX_ABBREVS).forEach(([abbr, full]) => {
    q = q.replace(new RegExp(`\\b${abbr}\\b`, "g"), full);
  });
  const haystack = `${ex.name} ${ex.muscle}`.toLowerCase();
  return q.split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
}

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
function hasCompleteProfile(user) {
  const meta = user?.user_metadata || {};
  return Boolean(meta.profile_name && meta.weight_lbs && meta.height_in && meta.split_id);
}
function fmtHeight(totalInches) {
  if (!totalInches) return "-";
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}"`;
}
function splitName(splitId) {
  if (splitId === "custom") return "Custom";
  return SPLIT_TEMPLATES.find(s => s.id === splitId)?.name || "Custom";
}
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== "undefined" ? window.innerWidth < 760 : false);
  useEffect(() => {
    function update() { setIsMobile(window.innerWidth < 760); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return isMobile;
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

function getTodayRoutineDay(activeRoutine) {
  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  return activeRoutine.find(d => d.day === dayName) || null;
}

function buildExercisesFromDay(day, prs, workouts) {
  if (!day || day.type === "rest" || !day.exercises?.length) return [];
  return day.exercises.map(exId => {
    const pr = prs[exId];
    const suggest = getOverloadSuggestion(exId, workouts);
    return { id: exId, sets: [{ weight: suggest || pr?.weight || 0, reps: pr?.reps || 0, rpe: "", note: suggest ? `Try ${suggest}lbs` : "" }] };
  });
}

function badgeStyle(type) {
  const meta = WORKOUT_TYPE_META[type];
  if (meta) return { background:meta.bg, color:meta.color };
  return { background:"#f4f4f2", color:"#9c9c97" };
}

// THEMES
const LIGHT = { bg:"#f8f7f4",surface:"#ffffff",surface2:"#f2f1ed",border:"#e4e2db",text:"#1a1a18",text2:"#5c5c58",text3:"#9c9c97",accent:"#2563EB",accentHover:"#1D4ED8",accentSoft:"#EFF6FF",accentGlow:"#60A5FA",accentText:"#ffffff",secondary:"#FB923C",secondaryHover:"#F97316",secondarySoft:"#FFF7ED",warning:"#D97706",warningBg:"#FFFBEB",danger:"#DC2626",dangerBg:"#FEF2F2",green:"#16A34A",greenBg:"#F0FDF4",gridLine:"rgba(0,0,0,.05)" };
const DARK  = { bg:"#0c0c0b",surface:"#161615",surface2:"#1e1e1c",border:"#2c2c2a",text:"#f0ede8",text2:"#a8a49e",text3:"#6b6b67",accent:"#3B82F6",accentHover:"#2563EB",accentSoft:"#0f1e3a",accentGlow:"#93C5FD",accentText:"#ffffff",secondary:"#FDBA74",secondaryHover:"#FB923C",secondarySoft:"#2c1a06",warning:"#FBBF24",warningBg:"#1c1400",danger:"#F87171",dangerBg:"#2d0b0b",green:"#4ADE80",greenBg:"#052e16",gridLine:"rgba(255,255,255,.04)" };

function hs(d) {
  return {
    h1:   { fontSize:28, fontWeight:800, letterSpacing:"-0.8px", marginBottom:4, color:d.text, lineHeight:1.15 },
    h3:   { fontSize:14, fontWeight:700, marginBottom:12, color:d.text },
    sub:  { color:d.text3, fontSize:13, marginBottom:24, lineHeight:1.5 },
    card: { background:d.surface, border:`1px solid ${d.border}`, borderRadius:16, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.05)" },
    btn:  { display:"inline-flex", alignItems:"center", gap:6, padding:"9px 18px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer", border:"none", transition:"opacity 0.15s, background 0.15s, transform 0.1s" },
    btnSm:{ display:"inline-flex", alignItems:"center", background:d.surface2, color:d.text2, border:`1px solid ${d.border}`, borderRadius:8, padding:"5px 11px", fontSize:12, cursor:"pointer", transition:"background 0.15s" },
    input:{ fontFamily:"inherit", fontSize:14, border:`1px solid ${d.border}`, borderRadius:10, padding:"10px 14px", background:d.surface, color:d.text, outline:"none", width:"100%", boxSizing:"border-box", transition:"border-color 0.15s" },
    label:{ fontSize:12, fontWeight:600, color:d.text2, display:"block", marginBottom:5, letterSpacing:"0.01em" },
    overlay:{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", backdropFilter:"blur(3px)" },
    modal:{ background:d.surface, borderRadius:20, padding:28, width:540, maxWidth:"95vw", maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 64px rgba(0,0,0,.2)" },
    th:   { textAlign:"left", padding:"9px 12px", fontSize:11, fontWeight:600, color:d.text3, textTransform:"uppercase", letterSpacing:".07em", borderBottom:`1px solid ${d.border}` },
    td:   { padding:"10px 12px", borderBottom:`1px solid ${d.border}25`, color:d.text },
  };
}

// ROOT APP
export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem("il_dark")==="true");
  const d = dark ? DARK : LIGHT;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.style.margin = "0";
    document.documentElement.style.background = d.bg;
    document.documentElement.style.minHeight = "100%";
    document.body.style.margin = "0";
    document.body.style.background = d.bg;
    document.body.style.minHeight = "100%";
    const root = document.getElementById("root");
    if (root) {
      root.style.minHeight = "100%";
      root.style.background = d.bg;
    }
  }, [d.bg]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100vh", background:d.bg, color:d.text, fontSize:15, fontFamily:"'Inter',-apple-system,sans-serif" }}>
      Loading...
    </div>
  );

  if (!session) return <AuthPage d={d} dark={dark} toggleDark={()=>{ const v=!dark; setDark(v); localStorage.setItem("il_dark",v); }} />;

  if (!hasCompleteProfile(session.user)) {
    return <ProfileSetup session={session} setSession={setSession} d={d} dark={dark} toggleDark={()=>{ const v=!dark; setDark(v); localStorage.setItem("il_dark",v); }} />;
  }

  return <MainApp session={session} d={d} dark={dark} toggleDark={()=>{ const v=!dark; setDark(v); localStorage.setItem("il_dark",v); }} />;
}

// AUTH PAGE
function parseProfile({ profileName, weight, heightFt, heightIn, splitId, experience, goal }) {
  const name = profileName.trim();
  const weightLbs = Number.parseFloat(weight);
  const feet = Number.parseInt(heightFt, 10);
  const inches = Number.parseInt(heightIn || "0", 10);

  if (!name) return { error:"Enter a profile name." };
  if (!Number.isFinite(weightLbs) || weightLbs <= 0) return { error:"Enter your weight." };
  if (!Number.isFinite(feet) || feet <= 0) return { error:"Enter your height in feet." };
  if (!Number.isFinite(inches) || inches < 0 || inches > 11) return { error:"Height inches must be 0 through 11." };
  if (!splitId) return { error:"Choose a workout split." };
  if (!experience) return { error:"Select your experience level." };
  if (!goal) return { error:"Select your goal." };

  return {
    data:{
      profile_name:name,
      weight_lbs:Math.round(weightLbs * 10) / 10,
      height_in:(feet * 12) + inches,
      split_id:splitId,
      experience,
      goal,
      onboarding_complete:true,
    },
  };
}

function AuthPage({ d, dark, toggleDark }) {
  const [mode, setMode]     = useState("login");
  const [email, setEmail]   = useState("");
  const [pass, setPass]     = useState("");
  const [profileName, setProfileName] = useState("");
  const [weight, setWeight] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [splitId, setSplitId]     = useState("ppl");
  const [experience, setExperience] = useState("");
  const [goal, setGoal]           = useState("");
  const [signupStep, setSignupStep] = useState(0);
  const [initialPRs, setInitialPRs] = useState({ bench:{w:"",r:5}, squat:{w:"",r:5}, deadlift:{w:"",r:5} });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setSignupStep(0);
  }

  function validateSignupStep() {
    if (signupStep === 0) {
      if (!email.trim()) return "Enter your email.";
      if (!pass) return "Enter a password.";
      if (pass.length < 6) return "Password must be at least 6 characters.";
    }
    if (signupStep === 1) {
      const profile = parseProfile({ profileName, weight, heightFt, heightIn, splitId, experience:"placeholder", goal:"placeholder" });
      if (profile.error && profile.error !== "Choose a workout split." && profile.error !== "Select your experience level." && profile.error !== "Select your goal.") return profile.error;
    }
    if (signupStep === 3) {
      if (!experience) return "Select your experience level.";
      if (!goal) return "Select your goal.";
    }
    return "";
  }

  function nextSignupStep() {
    const stepError = validateSignupStep();
    if (stepError) {
      setError(stepError);
      return;
    }
    setError("");
    setSignupStep(step => Math.min(step + 1, 4));
  }

  async function signInWithGoogle() {
    setError(""); setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { setError("Could not sign in with Google."); setLoading(false); }
  }

  async function handleSubmit() {
    setError(""); setLoading(true);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password:pass });
      if (error) setError("Invalid email or password.");
    } else {
      const profile = parseProfile({ profileName, weight, heightFt, heightIn, splitId, experience, goal });
      if (profile.error) {
        setError(profile.error);
        setLoading(false);
        return;
      }
      const prData = {};
      ["bench","squat","deadlift"].forEach(k => {
        const w = parseFloat(initialPRs[k].w); const r = initialPRs[k].r;
        if (w > 0) prData[k] = { w, r };
      });
      const { error } = await supabase.auth.signUp({
        email,
        password:pass,
        options:{ data:{ ...profile.data, initial_prs: Object.keys(prData).length ? prData : null } },
      });
      if (error) setError("Could not create account. Please try again.");
      else setSuccess("Account created! Check your email to confirm, then log in.");
    }
    setLoading(false);
  }

  function handlePrimary() {
    if (mode === "signup" && signupStep < 4) {
      nextSignupStep();
      return;
    }
    handleSubmit();
  }

  const SIGNUP_STEPS = [
    { num:1, icon:<UserIcon/>,     title:"About you",        sub:"Set up your profile so we can personalize everything." },
    { num:2, icon:<CalendarIcon/>, title:"Your split",        sub:"Pick the training schedule that fits your life." },
    { num:3, icon:<TargetIcon/>,   title:"Your goals",        sub:"We'll tailor your experience around these." },
    { num:4, icon:<DumbbellIcon/>, title:"Your starting PRs", sub:"Log your best lifts — or skip and add them later." },
  ];

  function setPR(lift, field, val) {
    setInitialPRs(prev => ({ ...prev, [lift]:{ ...prev[lift], [field]:val } }));
  }

  if (mode === "signup" && signupStep > 0) {
    const stepInfo = SIGNUP_STEPS[signupStep - 1];
    const totalSteps = 4;

    const onboardBg = "linear-gradient(135deg, #0d0d12 0%, #111827 50%, #0d1117 100%)";

    function PRCard({ lift, label }) {
      const pr = initialPRs[lift];
      const est = pr.w && parseFloat(pr.w) > 0
        ? Math.round(parseFloat(pr.w) * (1 + pr.r / 30))
        : null;
      return (
        <div style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:16, padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:"rgba(59,130,246,0.2)", color:"#93C5FD", display:"flex", alignItems:"center", justifyContent:"center" }}><DumbbellIcon size={16}/></div>
            <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{label}</div>
            {est && <div style={{ marginLeft:"auto", fontSize:12, fontWeight:700, color:d.accent, background:`${d.accent}22`, borderRadius:8, padding:"3px 10px" }}>~{est} lbs 1RM</div>}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.45)", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Weight (lbs)</div>
              <input
                type="number" min="1" placeholder="225"
                value={pr.w}
                onChange={e=>setPR(lift,"w",e.target.value)}
                style={{ fontFamily:"inherit", fontSize:20, fontWeight:800, border:"1px solid rgba(255,255,255,0.14)", borderRadius:10, padding:"10px 14px", background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none", width:"100%", boxSizing:"border-box" }}
              />
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:600, color:"rgba(255,255,255,0.45)", marginBottom:6, textTransform:"uppercase", letterSpacing:".06em" }}>Reps</div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                {[1,2,3,4,5,6,7,8,9,10].map(r=>(
                  <button key={r} onClick={()=>setPR(lift,"r",r)}
                    style={{ width:34, height:34, borderRadius:8, border:`1.5px solid ${pr.r===r?"#3B82F6":"rgba(255,255,255,0.14)"}`, background:pr.r===r?"#3B82F6":"rgba(255,255,255,0.05)", color:pr.r===r?"#fff":"rgba(255,255,255,0.6)", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100dvh", background:onboardBg, padding:"24px 16px", boxSizing:"border-box" }}>
        <div style={{ width:"100%", maxWidth:500 }}>

          {/* Header */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
              <img src="/logo-full.png" alt="PeakSet" style={{ height:22, width:"auto", opacity:0.55 }} />
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", fontWeight:500 }}>Step {signupStep} of {totalSteps}</div>
            </div>
            {/* Progress bar */}
            <div style={{ display:"flex", gap:5, marginBottom:28 }}>
              {Array.from({length:totalSteps},(_,i)=>(
                <div key={i} style={{ flex:1, height:3, borderRadius:99, background: i < signupStep ? d.accent : "rgba(255,255,255,0.12)", transition:"background 0.3s" }} />
              ))}
            </div>
            <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:48, height:48, borderRadius:14, background:"rgba(59,130,246,0.25)", color:"#93C5FD", marginBottom:14 }}>{stepInfo.icon}</div>
            <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-0.8px", color:"#fff", marginBottom:6 }}>{stepInfo.title}</div>
            <div style={{ fontSize:15, color:"rgba(255,255,255,0.45)", lineHeight:1.5 }}>{stepInfo.sub}</div>
          </div>

          {/* Card */}
          <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.10)", borderRadius:22, padding:28, backdropFilter:"blur(12px)", boxShadow:"0 24px 60px rgba(0,0,0,0.4)" }}>

            {signupStep===1&&(
              <>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Your Name</label>
                  <input style={{ fontFamily:"inherit", fontSize:16, border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, padding:"12px 16px", background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none", width:"100%", boxSizing:"border-box" }} type="text" placeholder="Adam" value={profileName} onChange={e=>setProfileName(e.target.value)} autoFocus />
                </div>
                <div style={{ marginBottom:16 }}>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Body Weight</label>
                  <div style={{ position:"relative" }}>
                    <input style={{ fontFamily:"inherit", fontSize:16, border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, padding:"12px 16px", paddingRight:44, background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none", width:"100%", boxSizing:"border-box" }} type="number" min="1" placeholder="185" value={weight} onChange={e=>setWeight(e.target.value)} />
                    <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"rgba(255,255,255,0.35)", fontWeight:600, pointerEvents:"none" }}>lbs</span>
                  </div>
                </div>
                <div>
                  <label style={{ display:"block", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:7, textTransform:"uppercase", letterSpacing:".06em" }}>Height</label>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    <div style={{ position:"relative" }}>
                      <input style={{ fontFamily:"inherit", fontSize:16, border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, padding:"12px 16px", paddingRight:36, background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none", width:"100%", boxSizing:"border-box" }} type="number" min="1" placeholder="5" value={heightFt} onChange={e=>setHeightFt(e.target.value)} />
                      <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"rgba(255,255,255,0.35)", fontWeight:600, pointerEvents:"none" }}>ft</span>
                    </div>
                    <div style={{ position:"relative" }}>
                      <input style={{ fontFamily:"inherit", fontSize:16, border:"1px solid rgba(255,255,255,0.14)", borderRadius:12, padding:"12px 16px", paddingRight:36, background:"rgba(255,255,255,0.06)", color:"#fff", outline:"none", width:"100%", boxSizing:"border-box" }} type="number" min="0" max="11" placeholder="10" value={heightIn} onChange={e=>setHeightIn(e.target.value)} />
                      <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", fontSize:13, color:"rgba(255,255,255,0.35)", fontWeight:600, pointerEvents:"none" }}>in</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {signupStep===2&&(
              <div style={{ display:"grid", gap:10 }}>
                {[...SPLIT_TEMPLATES, { id:"custom", name:"Custom", desc:"Start blank and build your own after signup." }].map(split=>(
                  <button key={split.id} onClick={()=>setSplitId(split.id)}
                    style={{ border:`2px solid ${splitId===split.id?"#3B82F6":"rgba(255,255,255,0.10)"}`, background:splitId===split.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)", color:"#fff", borderRadius:14, padding:"14px 18px", textAlign:"left", cursor:"pointer", transition:"all 0.15s" }}>
                    <div style={{ fontSize:15, fontWeight:800, color:splitId===split.id?"#60A5FA":"rgba(255,255,255,0.9)" }}>{split.name}</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:4 }}>{split.desc}</div>
                  </button>
                ))}
              </div>
            )}

            {signupStep===3&&(
              <>
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:10, textTransform:"uppercase", letterSpacing:".08em" }}>Experience Level</div>
                  <div style={{ display:"grid", gap:8 }}>
                    {[
                      { id:"beginner",     name:"New to the Gym",  desc:"Just getting started." },
                      { id:"intermediate", name:"Intermediate",    desc:"1–3 years of consistent training." },
                      { id:"expert",       name:"Expert",          desc:"3+ years, advanced programming." },
                    ].map(opt=>(
                      <button key={opt.id} onClick={()=>setExperience(opt.id)}
                        style={{ border:`2px solid ${experience===opt.id?"#3B82F6":"rgba(255,255,255,0.10)"}`, background:experience===opt.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)", color:"#fff", borderRadius:14, padding:"12px 18px", textAlign:"left", cursor:"pointer", transition:"all 0.15s" }}>
                        <div style={{ fontSize:15, fontWeight:800, color:experience===opt.id?"#60A5FA":"rgba(255,255,255,0.9)" }}>{opt.name}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.4)", marginBottom:10, textTransform:"uppercase", letterSpacing:".08em" }}>Your Goal</div>
                  <div style={{ display:"grid", gap:8 }}>
                    {[
                      { id:"muscle",      name:"Build Muscle",  desc:"Hypertrophy and strength gains." },
                      { id:"lose_weight", name:"Lose Weight",   desc:"Fat loss while keeping muscle." },
                      { id:"both",        name:"Both",          desc:"Body recomposition." },
                    ].map(opt=>(
                      <button key={opt.id} onClick={()=>setGoal(opt.id)}
                        style={{ border:`2px solid ${goal===opt.id?"#3B82F6":"rgba(255,255,255,0.10)"}`, background:goal===opt.id?"rgba(59,130,246,0.15)":"rgba(255,255,255,0.04)", color:"#fff", borderRadius:14, padding:"12px 18px", textAlign:"left", cursor:"pointer", transition:"all 0.15s" }}>
                        <div style={{ fontSize:15, fontWeight:800, color:goal===opt.id?"#60A5FA":"rgba(255,255,255,0.9)" }}>{opt.name}</div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:3 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {signupStep===4&&(
              <div style={{ display:"grid", gap:14 }}>
                <PRCard lift="bench"    label="Bench Press" />
                <PRCard lift="squat"    label="Squat"       />
                <PRCard lift="deadlift" label="Deadlift"    />
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)", textAlign:"center", marginTop:4 }}>All fields optional — skip to fill in later</div>
              </div>
            )}

            {error && <div style={{ background:"rgba(239,68,68,0.15)", color:"#FCA5A5", borderRadius:10, padding:"10px 14px", fontSize:13, marginTop:16, border:"1px solid rgba(239,68,68,0.25)" }}>{error}</div>}

            <div style={{ display:"flex", gap:10, marginTop:24 }}>
              <button onClick={()=>{setError("");setSignupStep(s=>s-1);}}
                style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"12px 20px", borderRadius:12, fontSize:14, fontWeight:600, cursor:"pointer", border:"1px solid rgba(255,255,255,0.14)", background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.7)" }}>
                Back
              </button>
              <button onClick={handlePrimary} disabled={loading}
                style={{ flex:1, display:"inline-flex", alignItems:"center", justifyContent:"center", gap:6, padding:"13px 20px", borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer", border:"none", background: signupStep===4 ? "linear-gradient(135deg,#2563EB,#1D4ED8)" : "linear-gradient(135deg,#3B82F6,#2563EB)", color:"#fff", boxShadow:"0 4px 20px rgba(59,130,246,0.35)", opacity:loading?0.6:1, letterSpacing:"-0.3px" }}>
                {loading ? "Creating…" : signupStep < 4 ? "Continue →" : "Create Account"}
              </button>
            </div>
          </div>

          <button onClick={toggleDark} style={{ display:"block", margin:"18px auto 0", background:"none", border:"none", color:"rgba(255,255,255,0.2)", fontSize:12, cursor:"pointer" }}>
            {dark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100dvh", background:d.bg, fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif", padding:24, boxSizing:"border-box" }}>
      <div style={{ width:mode==="signup"?820:400, maxWidth:"100%", display:"grid", gridTemplateColumns:mode==="signup"?"repeat(auto-fit,minmax(320px,1fr))":"1fr", overflow:"hidden", background:d.surface, border:`1px solid ${d.border}`, borderRadius:22, boxShadow:"0 24px 80px rgba(0,0,0,.14)" }}>
        {mode==="signup"&&(
          <div style={{ padding:34, background:`linear-gradient(145deg, ${d.accentHover}, ${d.accent})`, color:"#fff", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:520 }}>
            <div>
              <img src="/logo-full.png" alt="PeakSet" style={{ height:26, width:"auto", marginBottom:18 }} />
              <h1 style={{ fontSize:34, lineHeight:1.02, margin:"0 0 14px", letterSpacing:"-1px" }}>Start with your actual plan.</h1>
              <p style={{ margin:0, fontSize:15, lineHeight:1.5, opacity:.88 }}>Build around your body, your split, and the numbers you want to move.</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {["Private log","PR tracking","Flexible splits","Progress charts"].map(item=>(
                <div key={item} style={{ border:"1px solid rgba(255,255,255,.26)", borderRadius:10, padding:"10px 12px", fontSize:12, fontWeight:700, background:"rgba(255,255,255,.10)" }}>{item}</div>
              ))}
            </div>
          </div>
        )}
        <div style={{ padding:36 }}>
        <div style={{ marginBottom:28, textAlign:mode==="signup"?"left":"center" }}>
          <img src="/logo-full.png" alt="PeakSet" style={{ height:36, width:"auto", display:"block" }} />
          <div style={{ fontSize:13, color:d.text3, marginTop:4 }}>{mode==="signup"?"Create your training profile":"Train. Track. Progress."}</div>
        </div>

        <div style={{ display:"flex", background:d.surface2, borderRadius:10, padding:3, marginBottom:18 }}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>switchMode(m)} style={{ flex:1, padding:"8px 0", borderRadius:8, border:"none", fontSize:13, fontWeight:600, cursor:"pointer", background:mode===m?d.surface:"none", color:mode===m?d.text:d.text2, boxShadow:mode===m?"0 1px 3px rgba(0,0,0,.1)":"none" }}>
              {m==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        <button onClick={signInWithGoogle} disabled={loading} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"11px 0", borderRadius:10, border:`1px solid ${d.border}`, background:d.surface, color:d.text, fontSize:14, fontWeight:600, cursor:"pointer", marginBottom:18, opacity:loading?.6:1 }}>
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.35-8.16 2.35-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          Continue with Google
        </button>

        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <div style={{ flex:1, height:1, background:d.border }} />
          <span style={{ fontSize:12, color:d.text3, whiteSpace:"nowrap" }}>or continue with email</span>
          <div style={{ flex:1, height:1, background:d.border }} />
        </div>

        {success ? (
          <div style={{ background:d.accentSoft, color:d.accentHover, borderRadius:10, padding:"12px 16px", fontSize:13, marginBottom:16 }}>{success}</div>
        ) : (
          <>
            <div style={{ marginBottom:12 }}>
              <label style={hs(d).label}>Email</label>
              <input style={hs(d).input} type="email" placeholder="you@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handlePrimary()} autoFocus />
            </div>
            <div style={{ marginBottom:mode==="signup"?8:20 }}>
              <label style={hs(d).label}>Password</label>
              <input style={hs(d).input} type="password" placeholder="********" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handlePrimary()} />
            </div>
            {mode==="signup"&&<p style={{ color:d.text3, fontSize:12, lineHeight:1.45, margin:"0 0 18px" }}>Use an email you can access. Supabase may ask you to confirm it before signing in.</p>}
            {error && <div style={{ background:d.dangerBg, color:d.danger, borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 }}>{error}</div>}
            <button onClick={handlePrimary} disabled={loading} style={{ ...hs(d).btn, background:d.accent, color:d.accentText, width:"100%", justifyContent:"center", padding:12, fontSize:14, opacity:loading?.6:1 }}>
              {loading ? "..." : mode==="login" ? "Sign In" : "Continue"}
            </button>
          </>
        )}

        <button onClick={toggleDark} style={{ display:"block", margin:"20px auto 0", background:"none", border:"none", color:d.text3, fontSize:12, cursor:"pointer" }}>
          {dark ? "Light mode" : "Dark mode"}
        </button>
        </div>
      </div>
    </div>
  );
}

function ProfileSetup({ session, setSession, d, dark, toggleDark }) {
  const meta = session.user.user_metadata || {};
  const [profileName, setProfileName] = useState(meta.profile_name || meta.full_name || meta.name || "");
  const [weight, setWeight] = useState(meta.weight_lbs || "");
  const [heightFt, setHeightFt] = useState(meta.height_in ? Math.floor(meta.height_in / 12) : "");
  const [heightIn, setHeightIn] = useState(meta.height_in ? meta.height_in % 12 : "");
  const [splitId, setSplitId]       = useState(meta.split_id || "ppl");
  const [experience, setExperience] = useState(meta.experience || "");
  const [goal, setGoal]             = useState(meta.goal || "");
  const [error, setError]           = useState("");
  const [saving, setSaving]         = useState(false);

  async function saveProfile() {
    setError("");
    const profile = parseProfile({ profileName, weight, heightFt, heightIn, splitId, experience, goal });
    if (profile.error) {
      setError(profile.error);
      return;
    }

    setSaving(true);
    const { data, error } = await supabase.auth.updateUser({ data:profile.data });
    setSaving(false);
    if (error) {
      setError("Failed to save profile. Please try again.");
      return;
    }

    localStorage.setItem("il_split", splitId);
    setSession({ ...session, user:data.user });
  }

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:d.bg, color:d.text, fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif", padding:24, boxSizing:"border-box" }}>
      <div style={{ width:720, background:d.surface, border:`1px solid ${d.border}`, borderRadius:22, padding:34, boxShadow:"0 24px 80px rgba(0,0,0,.14)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", gap:16, alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:28, fontWeight:800, letterSpacing:"-1px" }}>Finish Your Profile</div>
            <div style={{ color:d.text3, fontSize:14, marginTop:4 }}>A few details help PeakSet start on the right split.</div>
          </div>
          <button onClick={toggleDark} style={hs(d).btnSm}>{dark ? "Light" : "Dark"}</button>
        </div>

        <div style={{ marginBottom:12 }}>
          <label style={hs(d).label}>Profile Name</label>
          <input style={hs(d).input} type="text" value={profileName} placeholder="Adam" onChange={e=>setProfileName(e.target.value)} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
          <div><label style={hs(d).label}>Weight</label><input style={hs(d).input} type="number" value={weight} placeholder="185" onChange={e=>setWeight(e.target.value)} /></div>
          <div><label style={hs(d).label}>Height ft</label><input style={hs(d).input} type="number" value={heightFt} placeholder="5" onChange={e=>setHeightFt(e.target.value)} /></div>
          <div><label style={hs(d).label}>Height in</label><input style={hs(d).input} type="number" value={heightIn} placeholder="10" onChange={e=>setHeightIn(e.target.value)} /></div>
        </div>

        <label style={hs(d).label}>Workout Split</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:16 }}>
          {[...SPLIT_TEMPLATES, { id:"custom", name:"Custom", desc:"Start blank and build your own." }].map(split=>(
            <button key={split.id} onClick={()=>setSplitId(split.id)} style={{ border:`1px solid ${splitId===split.id?d.accent:d.border}`, background:splitId===split.id?d.accentSoft:d.surface, color:d.text, borderRadius:10, padding:"12px 14px", textAlign:"left", cursor:"pointer" }}>
              <div style={{ fontWeight:800, color:splitId===split.id?d.accentHover:d.text }}>{split.name}</div>
              <div style={{ fontSize:12, color:d.text3, marginTop:3, lineHeight:1.35 }}>{split.desc}</div>
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
          <div>
            <label style={hs(d).label}>Experience Level</label>
            <div style={{ display:"grid", gap:8 }}>
              {[
                { id:"beginner",     name:"New to the Gym",  desc:"Just getting started." },
                { id:"intermediate", name:"Intermediate",    desc:"1–3 years training." },
                { id:"expert",       name:"Expert",          desc:"3+ years, advanced." },
              ].map(opt=>(
                <button key={opt.id} onClick={()=>setExperience(opt.id)} style={{ border:`1px solid ${experience===opt.id?d.accent:d.border}`, background:experience===opt.id?d.accentSoft:d.surface, color:d.text, borderRadius:10, padding:"10px 12px", textAlign:"left", cursor:"pointer" }}>
                  <div style={{ fontWeight:800, fontSize:13, color:experience===opt.id?d.accentHover:d.text }}>{opt.name}</div>
                  <div style={{ fontSize:11, color:d.text3, marginTop:2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={hs(d).label}>Your Goal</label>
            <div style={{ display:"grid", gap:8 }}>
              {[
                { id:"muscle",      name:"Build Muscle",  desc:"Hypertrophy and strength." },
                { id:"lose_weight", name:"Lose Weight",   desc:"Fat loss, keep muscle." },
                { id:"both",        name:"Both",          desc:"Body recomposition." },
              ].map(opt=>(
                <button key={opt.id} onClick={()=>setGoal(opt.id)} style={{ border:`1px solid ${goal===opt.id?d.accent:d.border}`, background:goal===opt.id?d.accentSoft:d.surface, color:d.text, borderRadius:10, padding:"10px 12px", textAlign:"left", cursor:"pointer" }}>
                  <div style={{ fontWeight:800, fontSize:13, color:goal===opt.id?d.accentHover:d.text }}>{opt.name}</div>
                  <div style={{ fontSize:11, color:d.text3, marginTop:2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div style={{ background:d.dangerBg, color:d.danger, borderRadius:8, padding:"10px 14px", fontSize:13, marginBottom:14 }}>{error}</div>}
        <button onClick={saveProfile} disabled={saving} style={{ ...hs(d).btn, background:d.accent, color:d.accentText, width:"100%", justifyContent:"center", padding:13, fontSize:14, opacity:saving?.6:1 }}>
          {saving ? "Saving..." : "Enter PeakSet"}
        </button>
        <button onClick={()=>supabase.auth.signOut()} style={{ display:"block", margin:"16px auto 0", background:"none", border:"none", color:d.text3, fontSize:12, cursor:"pointer" }}>Sign out</button>
      </div>
    </div>
  );
}

// MAIN APP
function MainApp({ session, d, dark, toggleDark }) {
  const isMobile = useIsMobile();
  const userId = session.user.id;
  const profile = session.user.user_metadata || {};
  const profileSplit = profile.split_id;
  const profileWeight = profile.weight_lbs;
  const [workouts, setWorkouts]     = useState([]);
  const [bwLog, setBwLog]           = useState([]);
  const [customEx, setCustomEx]     = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [friendAddTarget, setFriendAddTarget] = useState(null);
  const [selectedSplitId, setSelectedSplitId] = useState(() => profileSplit || localStorage.getItem("il_split") || "ppl");
  const [customRoutine, setCustomRoutine] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("il_custom_routine")) || defaultCustomRoutine();
    } catch {
      return defaultCustomRoutine();
    }
  });
  const [page, setPage]           = useState("dashboard");
  const [progressTab, setProgressTab] = useState("history");
  const [logState, setLogState]   = useState({ type:"push", exercises:[], notes:"", date:new Date().toISOString().slice(0,10) });
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [toast, setToast]         = useState(null);
  const toastRef = useRef(null);

  const allEx    = useMemo(() => [...DEFAULT_EXERCISES, ...customEx], [customEx]);
  const prs      = useMemo(() => calcPRs(workouts), [workouts]);
  const streak   = useMemo(() => calcStreak(workouts), [workouts]);
  const selectedTemplate = SPLIT_TEMPLATES.find(s => s.id === selectedSplitId) || SPLIT_TEMPLATES[0];
  const activeRoutine = selectedSplitId === "custom" ? customRoutine : selectedTemplate.days;
  const todayDay = useMemo(() => getTodayRoutineDay(activeRoutine), [activeRoutine]);
  const typeLabels = useMemo(() => {
    const entries = [...SPLIT_TEMPLATES.flatMap(s => s.days), ...customRoutine]
      .filter(day => day.type !== "rest")
      .map(day => [day.type, day.label]);
    return Object.fromEntries(entries);
  }, [customRoutine]);
  const workoutTypes = useMemo(() => uniq(
    activeRoutine.filter(day => day.type !== "rest").map(day => day.type)
  ), [activeRoutine]);

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
        const [w, bw, ce, fs] = await Promise.all([fetchWorkouts(userId), fetchBodyWeight(userId), fetchCustomExercises(userId), fetchFriendships(userId)]);
        let bodyWeight = bw;
        if (!bodyWeight.length && profileWeight) {
          const today = new Date(new Date().toISOString().slice(0,10)+"T12:00:00").getTime();
          const row = await saveBodyWeight(userId, today, Number(profileWeight));
          bodyWeight = [{ id:row.id, date:today, weight:row.weight }];
        }
        setWorkouts(w); setBwLog(bodyWeight); setCustomEx(ce); setFriendships(fs);

        // Sync public profile so others can find this user
        syncUserProfile(userId, { profile_name: profile.profile_name, email: session.user.email, weight_lbs: profile.weight_lbs, height_in: profile.height_in, split_id: profile.split_id || profileSplit }).catch(() => {});

        // Handle ?friend= share link
        const params = new URLSearchParams(window.location.search);
        const friendParam = params.get("friend");
        if (friendParam && friendParam !== userId) {
          window.history.replaceState({}, "", window.location.pathname);
          const targetProfile = await fetchUserProfileById(friendParam);
          if (targetProfile) setFriendAddTarget({ userId: friendParam, profile: targetProfile });
        }
      } catch (error) {
        showToast("Failed to load your data. Please refresh.");
      } finally {
        setDataLoading(false);
      }
    }
    loadAll();
  }, [userId, profileWeight, showToast]);

  useEffect(() => {
    localStorage.setItem("il_split", selectedSplitId);
  }, [selectedSplitId]);

  useEffect(() => {
    localStorage.setItem("il_custom_routine", JSON.stringify(customRoutine));
  }, [customRoutine]);

  function navigate(p, newLog, tab) {
    setPage(p);
    if (newLog) { setLogState(newLog); setWorkoutStarted(true); }
    if (tab) setProgressTab(tab);
  }

  function buildTodayLogState() {
    const day = getTodayRoutineDay(activeRoutine);
    const isWorkoutDay = day && day.type !== "rest";
    return {
      type: isWorkoutDay ? day.type : (workoutTypes[0] || "push"),
      exercises: isWorkoutDay ? buildExercisesFromDay(day, prs, workouts) : [],
      notes: "",
      date: new Date().toISOString().slice(0, 10),
    };
  }

  function handleNavigateToLog() {
    if (!workoutStarted) setLogState(buildTodayLogState());
    setPage("log");
  }

  function handleCancelWorkout() {
    setLogState(buildTodayLogState());
    setWorkoutStarted(false);
  }

  async function handleDeleteWorkout(id) {
    const removed = workouts.find(w => w.id === id);
    setWorkouts(prev => prev.filter(w => w.id !== id));
    try {
      await deleteWorkoutFromDb(id);
      showToast("Workout deleted");
    } catch (error) {
      if (removed) setWorkouts(prev => [...prev, removed].sort((a, b) => b.date - a.date));
      showToast("Failed to delete workout. Please try again.");
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
      setWorkoutStarted(false);
      showToast("Workout saved");
      navigate("progress", null, "history");
    } catch (error) {
      showToast("Failed to save workout. Please try again.");
    }
  }

  async function handleSaveBw(date, weight) {
    try {
      const row = await saveBodyWeight(userId, date, weight);
      const ts = typeof row.date === "number" ? row.date : new Date(row.date).getTime();
      setBwLog(prev => [...prev.filter(b => b.date !== date), { id:row.id, date:ts, weight:row.weight }].sort((a,b) => a.date - b.date));
      return true;
    } catch (error) {
      showToast("Failed to save weight. Please try again.");
      return false;
    }
  }

  async function handleDeleteBw(id) {
    const removed = bwLog.find(b => b.id === id);
    setBwLog(prev => prev.filter(b => b.id !== id));
    try {
      await deleteBodyWeight(id);
    } catch (error) {
      if (removed) setBwLog(prev => [...prev, removed].sort((a, b) => a.date - b.date));
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

  const pendingRequestCount = friendships.filter(f => f.status === "pending" && f.addressee_id === userId).length;
  const sideNavItems = [
    { id:"dashboard", label:"Dashboard", icon:<GridIcon /> },
    { id:"progress",  label:"Progress",  icon:<TrendIcon /> },
    { id:"routines",  label:"Routines",  icon:<ListIcon /> },
  ];
  const mobileNavItems = [
    { id:"dashboard", label:"Home",     icon:<GridIcon /> },
    { id:"log",       label:"Workout",  icon:<PlusIcon /> },
    { id:"progress",  label:"Progress", icon:<TrendIcon /> },
    { id:"routines",  label:"Routines", icon:<ListIcon /> },
    { id:"profile",   label:"Profile",  icon:<UserIcon /> },
  ];

  const sideNavBtn = (n) => {
    const active = page === n.id;
    return (
      <button key={n.id} onClick={()=>n.id==="log"?handleNavigateToLog():navigate(n.id)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", margin:"1px 8px", borderRadius:10, cursor:"pointer", fontSize:13, fontWeight:active?600:500, border:"none", background:active?d.accentSoft:"transparent", color:active?d.accent:d.text2, width:"calc(100% - 16px)", textAlign:"left", transition:"background 0.15s, color 0.15s" }}>
        {n.icon}
        <span>{n.label}</span>
        {n.badge ? <span style={{ background:d.danger, color:"#fff", borderRadius:20, fontSize:10, fontWeight:700, padding:"1px 5px", marginLeft:"auto" }}>{n.badge}</span> : null}
      </button>
    );
  };

  return (
    <div style={{ display:"flex", flexDirection:"row", height:"100dvh", overflow:"hidden", fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif", fontSize:15, color:d.text, background:d.bg }}>

      {/* Desktop sidebar */}
      {!isMobile && (
        <aside style={{ width:220, minWidth:220, background:d.surface, borderRight:`1px solid ${d.border}`, display:"flex", flexDirection:"column" }}>
          <div style={{ padding:"20px 16px 16px" }}>
            <img src="/logo.png" alt="PeakSet" style={{ height:36, width:"auto", maxWidth:"100%", display:"block", marginBottom:4 }} />
            <div style={{ fontSize:11, color:d.text3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{profile.profile_name || session.user.email}</div>
          </div>

          {/* Start Workout CTA */}
          <div style={{ padding:"0 12px 16px" }}>
            <button onClick={handleNavigateToLog} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:8, padding:"11px 0", borderRadius:12, border:"none", background:`linear-gradient(135deg,${d.accent},${d.accentHover})`, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", boxShadow:`0 4px 16px ${d.accent}44`, letterSpacing:"-0.2px" }}>
              <DumbbellIcon size={16}/> Start Workout
            </button>
          </div>

          {/* Main nav */}
          <div style={{ padding:"0 0 4px", fontSize:10, fontWeight:700, color:d.text3, letterSpacing:".1em", textTransform:"uppercase", paddingLeft:20 }}>Main</div>
          {sideNavItems.map(sideNavBtn)}

          <div style={{ padding:"12px 0 4px", fontSize:10, fontWeight:700, color:d.text3, letterSpacing:".1em", textTransform:"uppercase", paddingLeft:20 }}>Community</div>
          {sideNavBtn({ id:"social", label:"Social", icon:<UsersIcon />, badge: pendingRequestCount||null })}

          <div style={{ padding:"12px 0 4px", fontSize:10, fontWeight:700, color:d.text3, letterSpacing:".1em", textTransform:"uppercase", paddingLeft:20 }}>Account</div>
          {sideNavBtn({ id:"profile", label:"Profile", icon:<UserIcon /> })}

          <div style={{ marginTop:"auto", padding:10, borderTop:`1px solid ${d.border}`, display:"flex", flexDirection:"column", gap:6 }}>
            {streak > 0 && <div style={{ background:d.secondarySoft, color:d.secondary, fontSize:12, fontWeight:700, padding:"8px 12px", borderRadius:10, display:"flex", alignItems:"center", gap:6 }}><FireIcon size={13}/> <strong>{streak}</strong> day streak</div>}
            <button onClick={toggleDark} style={{ background:d.surface2, border:`1px solid ${d.border}`, borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:d.text2, display:"flex", alignItems:"center", gap:6 }}>{dark ? <><SunIcon/> Light Mode</> : <><MoonIcon/> Dark Mode</>}</button>
            <button onClick={handleSignOut} style={{ background:"none", border:`1px solid ${d.border}`, borderRadius:8, padding:"7px 12px", fontSize:12, fontWeight:600, cursor:"pointer", color:d.text3 }}>Sign Out</button>
          </div>
        </aside>
      )}

      <main style={{ flex:1, overflowY:"auto", padding:isMobile?"0 0 90px":32 }}>
      {/* Mobile top logo bar — scrolls with content */}
      {isMobile && (
        <div style={{ height:56, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", marginBottom:4 }}>
          <img src="/logo-full.png" alt="PeakSet" style={{ height:34, width:"auto" }} />
          <button onClick={toggleDark} style={{ position:"absolute", right:16, background:"none", border:`1px solid ${d.border}`, borderRadius:8, padding:"6px 10px", cursor:"pointer", color:d.text2, display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:600 }}>
            {dark ? <><SunIcon/> Light</> : <><MoonIcon/> Dark</>}
          </button>
        </div>
      )}
        {dataLoading ? (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:d.text3 }}>
            <div style={{ textAlign:"center" }}>
              <div style={{ width:36, height:36, border:`3px solid ${d.border}`, borderTopColor:d.accent, borderRadius:"50%", margin:"0 auto 14px" }}/>
              <div style={{ fontSize:13, fontWeight:500 }}>Loading your data...</div>
            </div>
          </div>
        ) : (
          <div style={{ padding:isMobile?"0 16px":0 }}>
            {page==="dashboard" && <Dashboard workouts={workouts} prs={prs} bwLog={bwLog} allEx={allEx} navigate={navigate} deleteWorkout={handleDeleteWorkout} typeLabels={typeLabels} profile={profile} isMobile={isMobile} d={d} />}
            {page==="log"       && <LogWorkout logState={logState} setLogState={setLogState} workoutStarted={workoutStarted} setWorkoutStarted={setWorkoutStarted} prs={prs} workouts={workouts} allEx={allEx} workoutTypes={workoutTypes} typeLabels={typeLabels} saveCustomEx={handleSaveCustomEx} submit={handleSubmitWorkout} onCancel={handleCancelWorkout} todayDay={todayDay} showToast={showToast} isMobile={isMobile} d={d} />}
            {page==="progress"  && <ProgressHub tab={progressTab} setTab={setProgressTab} workouts={workouts} prs={prs} bwLog={bwLog} allEx={allEx} deleteWorkout={handleDeleteWorkout} saveBw={handleSaveBw} deleteBw={handleDeleteBw} showToast={showToast} typeLabels={typeLabels} isMobile={isMobile} d={d} />}
            {page==="routines"  && <Routines splitTemplates={SPLIT_TEMPLATES} selectedSplitId={selectedSplitId} setSelectedSplitId={setSelectedSplitId} customRoutine={customRoutine} setCustomRoutine={setCustomRoutine} routine={activeRoutine} prs={prs} allEx={allEx} navigate={navigate} showToast={showToast} typeLabels={typeLabels} isMobile={isMobile} d={d} />}
            {page==="social"    && <Social userId={userId} profile={profile} friendships={friendships} setFriendships={setFriendships} showToast={showToast} isMobile={isMobile} d={d} />}
            {page==="profile"   && <Profile profile={profile} email={session.user.email} prs={prs} bwLog={bwLog} allEx={allEx} selectedSplitId={selectedSplitId} userId={userId} isMobile={isMobile} d={d} />}
          </div>
        )}
      </main>

      {toast && <div style={{ position:"fixed", bottom:isMobile?80:28, right:isMobile?16:28, left:isMobile?16:"auto", background:d.text, color:d.bg, padding:"11px 20px", borderRadius:12, fontSize:13, fontWeight:500, zIndex:999, boxShadow:"0 8px 32px rgba(0,0,0,.22)", textAlign:isMobile?"center":"left", maxWidth:320, letterSpacing:"0.01em" }}>{toast}</div>}

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav style={{ position:"fixed", bottom:0, left:0, right:0, background:d.surface, borderTop:`1px solid ${d.border}`, display:"flex", zIndex:50, paddingBottom:"env(safe-area-inset-bottom)" }}>
          {mobileNavItems.map(n => {
            const active = page === n.id || (n.id==="progress" && ["history","prs","musclemap","bodyweight","calculator"].includes(page));
            return (
              <button key={n.id} onClick={()=>n.id==="log"?handleNavigateToLog():navigate(n.id)}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:2, padding:"8px 4px 6px", border:"none", background:"none", cursor:"pointer", color:active?d.accent:d.text3, fontSize:10, fontWeight:active?700:500, transition:"color 0.15s" }}>
                <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:44, height:28, borderRadius:14, background:active?d.accentSoft:"transparent", transition:"background 0.2s", fontSize:18 }}>{n.icon}</span>
                {n.label}
              </button>
            );
          })}
        </nav>
      )}

      {friendAddTarget && (
        <div style={hs(d).overlay} onClick={()=>setFriendAddTarget(null)}>
          <div style={{...hs(d).modal, maxWidth:340}} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}><div style={{ width:52, height:52, borderRadius:16, background:d.accentSoft, color:d.accent, display:"flex", alignItems:"center", justifyContent:"center" }}><UsersIcon/></div></div>
            <h3 style={{ fontSize:18, fontWeight:700, color:d.text, textAlign:"center", marginBottom:6 }}>Add Friend?</h3>
            <p style={{ fontSize:14, color:d.text2, textAlign:"center", margin:"0 0 20px" }}>Send a friend request to <strong>{friendAddTarget.profile.profile_name}</strong>?</p>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{...hs(d).btn, background:d.accent, color:d.accentText, flex:1, justifyContent:"center"}} onClick={async()=>{
                const already = friendships.find(f=>(f.requester_id===userId&&f.addressee_id===friendAddTarget.userId)||(f.addressee_id===userId&&f.requester_id===friendAddTarget.userId));
                if (already) { showToast("Already connected."); }
                else {
                  try {
                    await sendFriendRequest(userId, friendAddTarget.userId);
                    setFriendships(prev=>[...prev,{id:String(Date.now()),requester_id:userId,addressee_id:friendAddTarget.userId,status:"pending",created_at:new Date().toISOString()}]);
                    showToast("Friend request sent!");
                  } catch { showToast("Could not send friend request."); }
                }
                setFriendAddTarget(null);
              }}>Send Request</button>
              <button style={{...hs(d).btnSm, flex:1, justifyContent:"center"}} onClick={()=>setFriendAddTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// PROGRESS HUB — groups History, PRs, Body Weight, Muscle Map, 1RM Calculator
function ProgressHub({ tab, setTab, workouts, prs, bwLog, allEx, deleteWorkout, saveBw, deleteBw, showToast, typeLabels, isMobile, d }) {
  const tabs = [
    { id:"history",    label:"History" },
    { id:"prs",        label:"PRs" },
    { id:"bodyweight", label:"Body Weight" },
    { id:"musclemap",  label:"Muscle Map" },
    { id:"calculator", label:"1RM Calc" },
  ];
  return (
    <div>
      <h1 style={hs(d).h1}>Progress</h1>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"repeat(3, 1fr)":"repeat(5, auto)", gap:6, marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:isMobile?"7px 4px":"7px 16px", borderRadius:20, border:`1px solid ${tab===t.id?d.accent:d.border}`, background:tab===t.id?d.accentSoft:"transparent", color:tab===t.id?d.accent:d.text2, fontSize:13, fontWeight:tab===t.id?700:500, cursor:"pointer", whiteSpace:"nowrap", transition:"all 0.15s", textAlign:"center" }}>
            {t.label}
          </button>
        ))}
      </div>
      {tab==="history"    && <History workouts={workouts} prs={prs} allEx={allEx} deleteWorkout={deleteWorkout} typeLabels={typeLabels} isMobile={isMobile} d={d} />}
      {tab==="prs"        && <PRs prs={prs} workouts={workouts} allEx={allEx} d={d} />}
      {tab==="bodyweight" && <BodyWeight bwLog={bwLog} saveBw={saveBw} deleteBw={deleteBw} showToast={showToast} isMobile={isMobile} d={d} />}
      {tab==="musclemap"  && <MuscleHeatmap prs={prs} allEx={allEx} bwLog={bwLog} d={d} />}
      {tab==="calculator" && <OneRepMax d={d} />}
    </div>
  );
}

// DASHBOARD
function Dashboard({ workouts, prs, bwLog, allEx, navigate, deleteWorkout, typeLabels, profile, isMobile, d }) {
  const recent   = useMemo(() => [...workouts].sort((a,b)=>b.date-a.date).slice(0,3), [workouts]);
  const latestBW = useMemo(() => bwLog.length ? [...bwLog].sort((a,b)=>b.date-a.date)[0] : null, [bwLog]);
  const thisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7*24*60*60*1000;
    return workouts.filter(w=>w.date>=weekAgo).length;
  }, [workouts]);
  const name = profile?.profile_name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const hasBenchData = workouts.some(w=>w.exercises?.some(e=>e.id==="bench"));
  const hasSquatData = workouts.some(w=>w.exercises?.some(e=>e.id==="squat"));

  const actionCards = [
    { icon:<DumbbellIcon size={isMobile?18:20}/>, title:"Start Workout", desc:"Log today's lift.",        action:()=>navigate("log"),                          accent:true },
    { icon:<CalendarIcon size={isMobile?18:20}/>, title:"Use a Routine", desc:"Follow a saved plan.",     action:()=>navigate("routines") },
    { icon:<WeightScaleIcon size={isMobile?18:20}/>, title:"Track Weight", desc:"Log today's body weight.", action:()=>navigate("progress",null,"bodyweight") },
  ];

  return (
    <div style={{ maxWidth:760 }}>
      {/* Hero */}
      <div style={{ marginBottom:28 }}>
        <div style={{ fontSize:isMobile?24:32, fontWeight:900, letterSpacing:"-1px", color:d.text, lineHeight:1.1, marginBottom:6 }}>
          {greeting}, {name}.
        </div>
        <div style={{ fontSize:14, color:d.text3, lineHeight:1.5 }}>
          {workouts.length === 0 ? "Welcome to PeakSet — start your first workout below." : `${thisWeek} workout${thisWeek!==1?"s":""} this week. Keep it up.`}
        </div>
      </div>

      {/* Action cards */}
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr 1fr":"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        {actionCards.map(c=>(
          <button key={c.title} onClick={c.action} style={{ ...hs(d).card, border:"none", background:c.accent?d.accentSoft:d.surface, cursor:"pointer", textAlign:"left", padding:isMobile?14:18, transition:"box-shadow 0.15s, transform 0.15s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 6px 20px rgba(0,0,0,.12)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.08)";}}>
            <div style={{ width:isMobile?34:38, height:isMobile?34:38, borderRadius:10, background:c.accent?d.accent:d.surface2, color:c.accent?"#fff":d.text2, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10 }}>{c.icon}</div>
            <div style={{ fontSize:isMobile?12:14, fontWeight:700, color:c.accent?d.accent:d.text, marginBottom:3 }}>{c.title}</div>
            {!isMobile && <div style={{ fontSize:12, color:d.text3 }}>{c.desc}</div>}
          </button>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:24 }}>
        <StatCard val={workouts.length} label="Total Workouts" d={d}/>
        <StatCard val={Object.keys(prs).length} label="PRs Tracked" d={d}/>
        <StatCard val={latestBW?latestBW.weight+"lbs":"-"} label="Body Weight" d={d}/>
      </div>

      {/* Charts — only show if data exists */}
      {(hasBenchData || hasSquatData) && (
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:14, marginBottom:20 }}>
          {hasBenchData && <div style={hs(d).card}><h3 style={hs(d).h3}>Bench Press</h3><ProgressChart workouts={workouts} exId="bench" d={d}/></div>}
          {hasSquatData && <div style={hs(d).card}><h3 style={hs(d).h3}>Squat</h3><ProgressChart workouts={workouts} exId="squat" d={d}/></div>}
        </div>
      )}

      {/* Recent workouts */}
      <div style={hs(d).card}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <h3 style={{...hs(d).h3,marginBottom:0}}>Recent Workouts</h3>
          {recent.length>0 && <button style={hs(d).btnSm} onClick={()=>navigate("progress",null,"history")}>View all</button>}
        </div>
        {recent.length
          ? recent.map(w=><WorkoutEntry key={w.id} w={w} prs={prs} allEx={allEx} onDelete={deleteWorkout} typeLabels={typeLabels} isMobile={isMobile} d={d}/>)
          : (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:56, height:56, borderRadius:16, background:d.surface2, color:d.text3, marginBottom:16 }}><DumbbellIcon size={24}/></div>
              <div style={{ fontSize:15, fontWeight:700, color:d.text, marginBottom:6 }}>No workouts yet</div>
              <div style={{ fontSize:13, color:d.text3, marginBottom:20, lineHeight:1.5 }}>Log your first session to start tracking your progress.</div>
              <button onClick={()=>navigate("log")} style={{ ...hs(d).btn, background:d.accent, color:d.accentText }}>Start Workout</button>
            </div>
          )
        }
      </div>
    </div>
  );
}

function Profile({ profile, email, prs, bwLog, allEx, selectedSplitId, userId, isMobile, d }) {
  const sortedWeight = [...bwLog].sort((a,b)=>b.date-a.date);
  const latestWeight = sortedWeight[0];
  const oldestWeight = sortedWeight[sortedWeight.length-1];
  const weightChange = latestWeight && oldestWeight && sortedWeight.length > 1
    ? (latestWeight.weight - oldestWeight.weight).toFixed(1)
    : null;
  const prRows = Object.entries(prs)
    .map(([id, pr]) => ({ id, pr, ex:allEx.find(e=>e.id===id) }))
    .filter(row => row.ex)
    .sort((a,b)=>b.pr.date-a.pr.date);

  const supportsNotif = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const [notifSub, setNotifSub] = useState(null);
  const [notifHour, setNotifHour] = useState(8);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifPermission, setNotifPermission] = useState(() => typeof Notification !== "undefined" ? Notification.permission : "default");
  const [notifMsg, setNotifMsg] = useState("");
  const [customMessages, setCustomMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");

  useEffect(() => {
    if (!supportsNotif) return;
    supabase.from("push_subscriptions").select("*").eq("user_id", userId).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNotifSub(data);
          setCustomMessages(data.custom_messages || []);
          const localH = ((data.reminder_hour - new Date().getTimezoneOffset() / 60) % 24 + 24) % 24;
          setNotifHour(Math.round(localH));
        }
      });
  }, [userId, supportsNotif]);

  async function enableReminder() {
    setNotifLoading(true);
    setNotifMsg("");
    try {
      const perm = await Notification.requestPermission();
      setNotifPermission(perm);
      if (perm !== "granted") { setNotifMsg("Permission denied — enable notifications in your browser settings."); return; }
      const sw = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY) });
      const utcHour = Math.round((notifHour + new Date().getTimezoneOffset() / 60 + 24) % 24);
      const { data, error } = await supabase.from("push_subscriptions")
        .upsert({ user_id: userId, subscription: JSON.stringify(sub.toJSON()), reminder_hour: utcHour, custom_messages: customMessages }, { onConflict: "user_id" })
        .select().single();
      if (error) { setNotifMsg("Failed to save reminder."); return; }
      setNotifSub(data);
      setNotifMsg("Reminder set! You'll get a daily nudge at " + fmtHour(notifHour) + ".");
    } catch (err) {
      setNotifMsg("Something went wrong: " + err.message);
    } finally {
      setNotifLoading(false);
    }
  }

  async function updateReminderTime() {
    if (!notifSub) return;
    setNotifLoading(true);
    setNotifMsg("");
    const utcHour = Math.round((notifHour + new Date().getTimezoneOffset() / 60 + 24) % 24);
    const { error } = await supabase.from("push_subscriptions").update({ reminder_hour: utcHour }).eq("id", notifSub.id);
    if (!error) { setNotifSub(s => ({ ...s, reminder_hour: utcHour })); setNotifMsg("Reminder updated to " + fmtHour(notifHour) + "."); }
    setNotifLoading(false);
  }

  async function disableReminder() {
    setNotifLoading(true);
    setNotifMsg("");
    try {
      if (notifSub) await supabase.from("push_subscriptions").delete().eq("id", notifSub.id);
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      if (reg) { const ps = await reg.pushManager.getSubscription(); if (ps) await ps.unsubscribe(); }
      setNotifSub(null);
      setCustomMessages([]);
      setNotifMsg("Reminders disabled.");
    } finally {
      setNotifLoading(false);
    }
  }

  async function addCustomMsg() {
    const msg = newMsg.trim();
    if (!msg) return;
    const updated = [...customMessages, msg];
    setCustomMessages(updated);
    setNewMsg("");
    if (notifSub) await supabase.from("push_subscriptions").update({ custom_messages: updated }).eq("id", notifSub.id);
  }

  async function removeCustomMsg(idx) {
    const updated = customMessages.filter((_, i) => i !== idx);
    setCustomMessages(updated);
    if (notifSub) await supabase.from("push_subscriptions").update({ custom_messages: updated }).eq("id", notifSub.id);
  }

  return (
    <div>
      <h1 style={hs(d).h1}>Profile</h1>
      <p style={hs(d).sub}>Your account, body stats, and strongest lifts</p>

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1.3fr", gap:16, marginBottom:16 }}>
        <div style={hs(d).card}>
          <div style={{ width:58, height:58, borderRadius:"50%", background:d.accentSoft, color:d.accentHover, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, fontWeight:800, marginBottom:14 }}>
            {(profile.profile_name || email || "U").charAt(0).toUpperCase()}
          </div>
          <h2 style={{ fontSize:22, margin:"0 0 4px", color:d.text }}>{profile.profile_name}</h2>
          <div style={{ fontSize:13, color:d.text3, marginBottom:16 }}>{email}</div>
          <div style={{ display:"grid", gap:9, fontSize:13 }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:d.text3 }}>Height</span><strong>{fmtHeight(profile.height_in)}</strong></div>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:d.text3 }}>Starting Weight</span><strong>{profile.weight_lbs ? `${profile.weight_lbs} lbs` : "-"}</strong></div>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span style={{ color:d.text3 }}>Workout Split</span><strong>{splitName(selectedSplitId || profile.split_id)}</strong></div>
          </div>
        </div>

        <div style={hs(d).card}>
          <h3 style={hs(d).h3}>Weight</h3>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:10 }}>
            {[
              { label:"Current", val:latestWeight?latestWeight.weight+"lbs":"-" },
              { label:"Change", val:weightChange!==null?(weightChange>0?"+":"")+weightChange+"lbs":"-" },
              { label:"Entries", val:bwLog.length },
            ].map(item=>(
              <div key={item.label} style={{ background:d.surface2, border:`1px solid ${d.border}`, borderRadius:8, padding:14 }}>
                <div style={{ fontSize:22, fontWeight:800, color:d.text }}>{item.val}</div>
                <div style={{ fontSize:11, color:d.text3, marginTop:3, fontWeight:700, textTransform:"uppercase", letterSpacing:".06em" }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={hs(d).card}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
          <h3 style={{...hs(d).h3,marginBottom:0}}>Personal Records</h3>
          <span style={{ fontSize:12, color:d.text3 }}>{prRows.length} tracked</span>
        </div>
        {prRows.length ? (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", minWidth:isMobile?520:"auto", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr>{["Exercise","Best","Est. 1RM","Date"].map(h=><th key={h} style={hs(d).th}>{h}</th>)}</tr></thead>
              <tbody>
                {prRows.map(({ id, pr, ex })=>(
                  <tr key={id}>
                    <td style={{...hs(d).td,fontWeight:600}}>{ex.name}</td>
                    <td style={hs(d).td}>{pr.weight} lbs x {pr.reps}</td>
                    <td style={{...hs(d).td,color:d.text2}}>{Math.round(pr.weight*(1+pr.reps/30))} lbs</td>
                    <td style={{...hs(d).td,color:d.text3}}>{fmtDate(pr.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty icon="" title="No PRs yet" desc="Log workouts to start filling this in" d={d}/>
        )}
      </div>

      <div style={hs(d).card}>
        <h3 style={{...hs(d).h3,marginBottom:4}}>Workout Reminder</h3>
        <p style={{ fontSize:13, color:d.text3, margin:"0 0 14px" }}>
          Get a daily push notification to help you stay consistent.
        </p>
        {!supportsNotif ? (
          <div style={{ fontSize:13, color:d.text3 }}>Push notifications aren't supported in this browser. Try adding the app to your home screen on iOS 16.4+ or use Chrome/Edge on Android.</div>
        ) : notifPermission === "denied" ? (
          <div style={{ fontSize:13, color:d.text3 }}>Notifications are blocked. Enable them in your browser/system settings, then reload.</div>
        ) : (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, flexWrap:"wrap" }}>
              <label style={{ fontSize:13, color:d.text2, fontWeight:600 }}>Reminder time</label>
              <select
                value={notifHour}
                onChange={e => setNotifHour(Number(e.target.value))}
                style={{ background:d.surface2, color:d.text, border:`1px solid ${d.border}`, borderRadius:8, padding:"6px 10px", fontSize:13 }}
              >
                {Array.from({length:24},(_,i)=>i).map(h=>(
                  <option key={h} value={h}>{fmtHour(h)}</option>
                ))}
              </select>
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {!notifSub ? (
                <button onClick={enableReminder} disabled={notifLoading} style={{ ...hs(d).btn, background:d.accent, color:d.accentText, padding:"8px 18px" }}>
                  {notifLoading ? "Enabling…" : "Enable Reminder"}
                </button>
              ) : (
                <>
                  <div style={{ fontSize:13, color:"#22c55e", fontWeight:600, display:"flex", alignItems:"center", gap:6, marginRight:4 }}>
                    <span>●</span> Active — daily at {fmtHour(notifHour)}
                  </div>
                  <button onClick={updateReminderTime} disabled={notifLoading} style={{ ...hs(d).btn, background:d.surface2, border:`1px solid ${d.border}`, padding:"8px 14px" }}>
                    {notifLoading ? "Saving…" : "Update Time"}
                  </button>
                  <button onClick={disableReminder} disabled={notifLoading} style={{ ...hs(d).btn, background:"transparent", color:d.text3, border:`1px solid ${d.border}`, padding:"8px 14px" }}>
                    Disable
                  </button>
                </>
              )}
            </div>
            {notifMsg && <div style={{ fontSize:12, color:d.text3, marginTop:10 }}>{notifMsg}</div>}

            {(notifSub || !notifSub) && (
              <div style={{ marginTop:18, borderTop:`1px solid ${d.border}`, paddingTop:16 }}>
                <div style={{ fontSize:13, fontWeight:600, color:d.text2, marginBottom:6 }}>Notification Messages</div>
                <div style={{ fontSize:12, color:d.text3, marginBottom:12 }}>
                  {customMessages.length ? "Picks randomly from your list below." : "Using defaults — add your own messages to replace them."}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:12 }}>
                  {customMessages.map((msg, i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:d.surface2, border:`1px solid ${d.border}`, borderRadius:8, padding:"7px 10px" }}>
                      <span style={{ flex:1, fontSize:13, color:d.text }}>{msg}</span>
                      <button onClick={() => removeCustomMsg(i)} style={{ background:"none", border:"none", cursor:"pointer", color:d.text3, fontSize:16, lineHeight:1, padding:"0 2px" }}>×</button>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && addCustomMsg()}
                    placeholder='e.g. "Hit the gym yet? 🏋️"'
                    maxLength={120}
                    style={{ flex:1, background:d.surface2, color:d.text, border:`1px solid ${d.border}`, borderRadius:8, padding:"7px 10px", fontSize:13 }}
                  />
                  <button onClick={addCustomMsg} disabled={!newMsg.trim()} style={{ ...hs(d).btn, background:d.accent, color:d.accentText, padding:"7px 16px", opacity:newMsg.trim()?1:.5 }}>Add</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ val, label, d }) {
  return (
    <div style={{ background:d.surface, border:`1px solid ${d.border}`, borderRadius:16, padding:"18px 12px", textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,.06)" }}>
      <div style={{ fontSize:28, fontWeight:900, letterSpacing:"-1.5px", color:d.secondary, lineHeight:1 }}>{val}</div>
      <div style={{ fontSize:10, color:d.text3, marginTop:6, fontWeight:700, textTransform:"uppercase", letterSpacing:".1em" }}>{label}</div>
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
function WorkoutEntry({ w, prs, allEx, onDelete, typeLabels, isMobile, d }) {
  const [open, setOpen] = useState(false);
  const borderColor = WORKOUT_TYPE_META[w.type]?.color || d.border;
  return (
    <div style={{ border:`1px solid ${d.border}`, borderLeft:`3px solid ${borderColor}`, borderRadius:10, marginBottom:10, overflow:"hidden" }}>
      <div style={{ padding:"12px 16px", background:d.surface, display:"flex", alignItems:isMobile?"flex-start":"center", justifyContent:"space-between", gap:10, cursor:"pointer" }} onClick={()=>setOpen(!open)}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{...badgeStyle(w.type),display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:13,fontWeight:700}}>{typeLabel(w.type, typeLabels)}</span>
          </div>
          <div style={{ fontSize:12, color:d.text3, marginTop:2 }}>{fmtDateFull(w.date)} / {w.exercises.length} exercises</div>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {onDelete && <button style={{ background:d.dangerBg, color:d.danger, border:"none", borderRadius:6, padding:"4px 10px", fontSize:12, fontWeight:600, cursor:"pointer" }} onClick={e=>{e.stopPropagation();onDelete(w.id)}}>Delete</button>}
          <span style={{ color:d.text3 }}>{open ? <ChevronUpIcon/> : <ChevronDownIcon/>}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:"0 16px 12px", borderTop:`1px solid ${d.border}`, background:d.surface }}>
          {w.notes && <p style={{ fontStyle:"italic", fontSize:13, color:d.text2, margin:"10px 0" }}>"{w.notes}"</p>}
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", minWidth:isMobile?620:"auto", borderCollapse:"collapse", fontSize:13 }}>
              <thead><tr>{["Exercise","Sets","Best Set","RPE"].map(h=><th key={h} style={hs(d).th}>{h}</th>)}</tr></thead>
              <tbody>
                {w.exercises.map(ex=>{
                  const exData=allEx.find(e=>e.id===ex.id);
                  const best=ex.sets.reduce((b,s)=>s.weight>b.weight?s:b,ex.sets[0]);
                  const isPR=prs[ex.id]&&prs[ex.id].weight===best.weight&&new Date(prs[ex.id].date).toDateString()===new Date(w.date).toDateString();
                  const rpes=ex.sets.filter(s=>s.rpe).map(s=>s.rpe);
                  return (
                    <tr key={ex.id}>
                      <td style={hs(d).td}>{exData?.name||ex.id}{isPR&&<span style={{ background:d.warningBg,color:d.warning,fontSize:10,fontWeight:700,padding:"2px 5px",borderRadius:4,marginLeft:6 }}>PR</span>}</td>
                      <td style={{...hs(d).td,color:d.text2}}>{ex.sets.length}</td>
                      <td style={{...hs(d).td,color:d.text2}}>{best.weight}lbs x {best.reps}</td>
                      <td style={{...hs(d).td,color:d.text3}}>{rpes.length?rpes.join(", "):"-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
          new Notification("PeakSet", { body:"Rest time up" });
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

// START WORKOUT
function LogWorkout({ logState, setLogState, workoutStarted, setWorkoutStarted, prs, workouts, allEx, workoutTypes, typeLabels, saveCustomEx, submit, onCancel, todayDay, showToast, isMobile, d }) {
  const [showExModal, setShowExModal]   = useState(false);
  const [showCustModal, setShowCustModal] = useState(false);
  const [showTimer, setShowTimer] = useState(() => localStorage.getItem("il_show_timer") === "true");
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
    if (newEx.name.length > 100) { showToast("Name must be 100 characters or less"); return; }
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
  const filtered=allEx.filter(e=>!existing.includes(e.id)&&(exFilter==="all"||e.type===exFilter)&&matchesExSearch(e,exSearch));

  function toggleTimer() {
    const next = !showTimer;
    setShowTimer(next);
    localStorage.setItem("il_show_timer", String(next));
  }

  function startWorkout() {
    setWorkoutStarted(true);
    showToast("Workout started");
  }

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:12, marginBottom:showTimer?12:20 }}>
        <div>
          <h1 style={hs(d).h1}>Start Workout</h1>
          <p style={{...hs(d).sub,marginBottom:0}}>{workoutStarted ? "Add exercises as you go" : "Set up the session, then start lifting"}</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {workoutStarted&&<button style={{...hs(d).btnSm, background:d.surface2, color:d.text2}} onClick={onCancel}>Cancel</button>}
          <button style={{...hs(d).btnSm, background:showTimer?d.accentSoft:d.surface2, color:showTimer?d.accentHover:d.text2}} onClick={toggleTimer}>{showTimer ? "Hide Timer" : "Timer"}</button>
        </div>
      </div>
      {showTimer&&<RestTimer d={d}/>}
      <div style={{...hs(d).card,marginBottom:16}}>
        <h3 style={hs(d).h3}>{workoutStarted ? "Current Workout" : "Workout Setup"}</h3>
        <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
          {workoutTypes.map(t=>(
            <button key={t} onClick={()=>setLogState({...logState,type:t})} style={{...hs(d).btn,...(logState.type===t?{background:d.accent,color:d.accentText}:{background:d.surface2,color:d.text,border:`1px solid ${d.border}`})}}>{typeLabel(t, typeLabels)}</button>
          ))}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:12 }}>
          <div><label style={hs(d).label}>Date</label><input style={hs(d).input} type="date" value={logState.date} onChange={e=>setLogState({...logState,date:e.target.value})}/></div>
          <div><label style={hs(d).label}>Session Notes</label><input style={hs(d).input} type="text" placeholder="How did it feel?" value={logState.notes} onChange={e=>setLogState({...logState,notes:e.target.value})}/></div>
        </div>
        {!workoutStarted&&todayDay&&todayDay.type!=="rest"&&(
          <div style={{ display:"flex", alignItems:"center", gap:10, background:d.accentSoft, border:`1px solid ${d.accent}44`, borderRadius:8, padding:"10px 14px", marginTop:14, fontSize:13 }}>
            <span style={{ color:d.accent }}><CalendarIcon size={16}/></span>
            <div>
              <span style={{ fontWeight:700, color:d.accentHover }}>{todayDay.day}: {typeLabel(todayDay.type, typeLabels)} Day</span>
              <span style={{ color:d.text2, marginLeft:6 }}>{logState.exercises.length > 0 ? `${logState.exercises.length} exercises pre-loaded from your split` : "Rest day — no exercises scheduled"}</span>
            </div>
          </div>
        )}
        {!workoutStarted&&(
          <button style={{...hs(d).btn,background:d.accent,color:d.accentText,width:"100%",justifyContent:"center",padding:14,fontSize:15,marginTop:16}} onClick={startWorkout}>
            Start Workout
          </button>
        )}
      </div>
      {workoutStarted&&(
        <>
          <div style={{...hs(d).card,marginBottom:16}}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
              <h3 style={{...hs(d).h3,marginBottom:0}}>Exercises</h3>
              <button style={{...hs(d).btn,background:d.accent,color:d.accentText,padding:"6px 12px",fontSize:13}} onClick={()=>setShowExModal(true)}>+ Add Exercise</button>
            </div>
            {logState.exercises.length===0
              ? <Empty icon="" title="No exercises yet" desc="Add your first exercise when you begin it" d={d}/>
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
                    <div style={{ display:"grid", gridTemplateColumns:isMobile?"28px 1fr 1fr 64px 24px":"28px 1fr 1fr 72px 1fr 24px", gap:6, marginBottom:4 }}>
                      {(isMobile?["#","lbs","Reps","RPE",""]:["#","lbs","Reps","RPE","Note",""]).map((h,i)=><div key={i} style={{ fontSize:10, color:d.text3, fontWeight:600 }}>{h}</div>)}
                    </div>
                    {ex.sets.map((set,si)=>(
                      <div key={si} style={{ display:"grid", gridTemplateColumns:isMobile?"28px 1fr 1fr 64px 24px":"28px 1fr 1fr 72px 1fr 24px", gap:6, marginBottom:isMobile?9:5, alignItems:"center" }}>
                        <div style={{ fontSize:11, fontWeight:700, color:d.text3, textAlign:"center", background:d.border, borderRadius:5, padding:"4px 0" }}>{si+1}</div>
                        <input style={hs(d).input} type="number" min="0" max="2000" value={set.weight||""} placeholder="lbs" onChange={e=>updateSet(i,si,"weight",e.target.value)}/>
                        <input style={hs(d).input} type="number" min="0" max="999" value={set.reps||""} placeholder="reps" onChange={e=>updateSet(i,si,"reps",e.target.value)}/>
                        <select style={hs(d).input} value={set.rpe} onChange={e=>updateSet(i,si,"rpe",e.target.value)}>
                          <option value="">-</option>
                          {[1,2,3,4,5,6,6.5,7,7.5,8,8.5,9,9.5,10].map(r=><option key={r} value={r}>{r}</option>)}
                        </select>
                        {!isMobile&&<input style={hs(d).input} type="text" value={set.note} placeholder="note..." onChange={e=>updateSet(i,si,"note",e.target.value)}/>}
                        <button style={{ background:"none", border:"none", color:d.text3, cursor:"pointer" }} onClick={()=>removeSet(i,si)}>x</button>
                        {isMobile&&<input style={{...hs(d).input,gridColumn:"2 / -1"}} type="text" value={set.note} placeholder="note..." onChange={e=>updateSet(i,si,"note",e.target.value)}/>}
                      </div>
                    ))}
                  </div>
                );
              })
            }
          </div>
          {logState.exercises.length>0&&(
            <button style={{...hs(d).btn,background:d.accent,color:d.accentText,width:"100%",justifyContent:"center",padding:14,fontSize:15}} onClick={submit}>Finish Workout</button>
          )}
        </>
      )}

      {showExModal&&(
        <div style={hs(d).overlay} onClick={()=>setShowExModal(false)}>
          <div style={hs(d).modal} onClick={e=>e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
              <h2 style={{ fontSize:18, fontWeight:600, color:d.text }}>Add Exercise</h2>
              <button style={{ background:"none", border:"none", color:d.text3, cursor:"pointer", fontSize:18 }} onClick={()=>setShowExModal(false)}>x</button>
            </div>
            <input style={{...hs(d).input,marginBottom:10}} placeholder='Search — try "db press", "ohp", "lat"...' value={exSearch} onChange={e=>setExSearch(e.target.value)} autoFocus/>
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
              <div><label style={hs(d).label}>Name</label><input style={hs(d).input} placeholder="e.g. Cable Lateral Raise" maxLength={100} value={newEx.name} onChange={e=>setNewEx({...newEx,name:e.target.value})}/></div>
              <div><label style={hs(d).label}>Muscle Group</label><input style={hs(d).input} placeholder="e.g. Side Delts" maxLength={50} value={newEx.muscle} onChange={e=>setNewEx({...newEx,muscle:e.target.value})}/></div>
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
function History({ workouts, prs, allEx, deleteWorkout, typeLabels, isMobile, d }) {
  const sorted=[...workouts].sort((a,b)=>b.date-a.date);
  return (
    <div>
      <h1 style={hs(d).h1}>History</h1>
      <p style={hs(d).sub}>{sorted.length} sessions logged</p>
      {sorted.length===0?<Empty icon="" title="No workouts yet" desc="Start a workout to get moving" d={d}/>:sorted.map(w=><WorkoutEntry key={w.id} w={w} prs={prs} allEx={allEx} onDelete={deleteWorkout} typeLabels={typeLabels} isMobile={isMobile} d={d}/>)}
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
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", minWidth:680, borderCollapse:"collapse", fontSize:13 }}>
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
        </div>
      ))}
    </div>
  );
}

// BODY WEIGHT
function BodyWeight({ bwLog, saveBw, deleteBw, showToast, isMobile, d }) {
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
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(3,1fr)", gap:12, marginBottom:20 }}>
        <StatCard val={latest?latest.weight+"lbs":"-"} label="Current" d={d}/>
        <StatCard val={change!==null?(change>0?"+":"")+change+"lbs":"-"} label="Total Change" d={d}/>
        <StatCard val={sorted.length} label="Entries" d={d}/>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:16, marginBottom:16 }}>
        <div style={hs(d).card}>
          <h3 style={hs(d).h3}>Log Weight</h3>
          <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:10, marginBottom:12 }}>
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
function Routines({ splitTemplates, selectedSplitId, setSelectedSplitId, customRoutine, setCustomRoutine, routine, prs, allEx, navigate, showToast, typeLabels, isMobile, d }) {
  const selectedTemplate = splitTemplates.find(s => s.id === selectedSplitId);
  function startDay(di) {
    const day=routine[di];
    if (day.type === "rest") return;
    const nextLog = { type:day.type, notes:"", date:new Date().toISOString().slice(0,10), exercises:day.exercises.map(id=>{ const pr=prs[id]; return {id,sets:[{weight:pr?.weight||0,reps:pr?.reps||0,rpe:"",note:""}]}; }) };
    navigate("log", nextLog);
    showToast(`${day.day} ${day.label || typeLabel(day.type, typeLabels)} started`);
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

      <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"repeat(auto-fit,minmax(180px,1fr))", gap:10, marginBottom:16 }}>
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
        <CustomSplitEditor routine={customRoutine} setRoutine={setCustomRoutine} allEx={allEx} isMobile={isMobile} d={d} />
      ) : (
        <div style={{ marginBottom:16, display:"flex", flexDirection:isMobile?"column":"row", justifyContent:"space-between", alignItems:isMobile?"stretch":"center", gap:12 }}>
          <div>
            <h2 style={{ fontSize:18, color:d.text, margin:"0 0 3px" }}>{selectedTemplate?.name}</h2>
            <div style={{ fontSize:13, color:d.text3 }}>{selectedTemplate?.desc}</div>
          </div>
          <button style={{...hs(d).btn,background:d.surface2,color:d.text2,border:`1px solid ${d.border}`}} onClick={copyCurrentToCustom}>Customize This</button>
        </div>
      )}

      <div style={hs(d).card}>
        <h3 style={{...hs(d).h3,marginBottom:16}}>Weekly Schedule</h3>
        {routine.map((day,di)=><RoutineDay key={`${day.day}-${di}`} day={day} prs={prs} allEx={allEx} onStart={()=>startDay(di)} typeLabels={typeLabels} isMobile={isMobile} d={d}/>)}
      </div>
    </div>
  );
}

function CustomSplitEditor({ routine, setRoutine, allEx, isMobile, d }) {
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
              <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"110px 1fr auto", gap:10, alignItems:"center", marginBottom:10 }}>
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

function RoutineDay({ day, prs, allEx, onStart, typeLabels, isMobile, d }) {
  const [open, setOpen] = useState(false);
  const borderColor=WORKOUT_TYPE_META[day.type]?.color || d.border;
  const label = day.label || typeLabel(day.type, typeLabels);
  return (
    <div style={{ border:`1px solid ${d.border}`, borderLeft:`3px solid ${borderColor}`, borderRadius:8, marginBottom:6, overflow:"hidden" }}>
      <div style={{ padding:"10px 14px", display:"flex", justifyContent:"space-between", alignItems:isMobile?"flex-start":"center", gap:10, cursor:"pointer", background:d.surface }} onClick={()=>setOpen(!open)}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontWeight:600, fontSize:13, color:d.text }}>{day.day}</span>
          <span style={{...badgeStyle(day.type),display:"inline-flex",padding:"2px 8px",borderRadius:20,fontSize:11,fontWeight:600}}>{label}</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          {day.type!=="rest"&&day.exercises.length>0&&<button style={{...hs(d).btn,background:d.accent,color:d.accentText,padding:"5px 12px",fontSize:12}} onClick={e=>{e.stopPropagation();onStart()}}>Start</button>}
          <span style={{ color:d.text3 }}>{open ? <ChevronUpIcon/> : <ChevronDownIcon/>}</span>
        </div>
      </div>
      {open&&(
        <div style={{ padding:"0 14px 12px", borderTop:`1px solid ${d.border}`, background:d.surface }}>
          {day.exercises.length>0?(
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", minWidth:isMobile?460:"auto", borderCollapse:"collapse", fontSize:13, marginTop:10 }}>
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
            </div>
          ):<p style={{ color:d.text3, fontSize:13, paddingTop:10 }}>Rest day</p>}
        </div>
      )}
    </div>
  );
}

// SOCIAL
function Social({ userId, profile, friendships, setFriendships, showToast, isMobile, d }) {
  const [tab, setTab]           = useState("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [viewFriend, setViewFriend] = useState(null);
  const [qrUrl, setQrUrl]       = useState(null);

  const shareUrl = `${window.location.origin}/?friend=${userId}`;

  const accepted        = friendships.filter(f=>f.status==="accepted");
  const pendingReceived = friendships.filter(f=>f.status==="pending"&&f.addressee_id===userId);
  const pendingSent     = friendships.filter(f=>f.status==="pending"&&f.requester_id===userId);

  useEffect(()=>{
    const ids = friendships.map(f=>f.requester_id===userId?f.addressee_id:f.requester_id);
    if (!ids.length) return;
    fetchUserProfiles(ids).then(rows=>{
      const map={};
      rows.forEach(r=>{map[r.user_id]=r;});
      setProfiles(map);
    }).catch(()=>{});
  }, [friendships, userId]);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(searchQuery, userId);
      setSearchResults(results);
    } catch { showToast("Search failed. Try again."); }
    setSearching(false);
  }

  async function handleAdd(targetId) {
    try {
      await sendFriendRequest(userId, targetId);
      setFriendships(prev=>[...prev,{id:String(Date.now()),requester_id:userId,addressee_id:targetId,status:"pending",created_at:new Date().toISOString()}]);
      showToast("Friend request sent!");
    } catch { showToast("Could not send request."); }
  }

  async function handleAccept(f) {
    try {
      await acceptFriendRequest(f.id);
      setFriendships(prev=>prev.map(x=>x.id===f.id?{...x,status:"accepted"}:x));
      showToast("Friend added!");
    } catch { showToast("Could not accept request."); }
  }

  async function handleDecline(f) {
    try {
      await deleteFriendship(f.id);
      setFriendships(prev=>prev.filter(x=>x.id!==f.id));
    } catch { showToast("Could not decline request."); }
  }

  async function handleRemove(f) {
    try {
      await deleteFriendship(f.id);
      setFriendships(prev=>prev.filter(x=>x.id!==f.id));
      if (viewFriend) setViewFriend(null);
      showToast("Friend removed.");
    } catch { showToast("Could not remove friend."); }
  }

  async function generateQr() {
    try {
      const QRCode = (await import("qrcode")).default;
      const url = await QRCode.toDataURL(shareUrl, { width:200, margin:2, color:{dark:"#000000",light:"#ffffff"} });
      setQrUrl(url);
    } catch { showToast("Could not generate QR code."); }
  }

  function friendId(f) { return f.requester_id===userId?f.addressee_id:f.requester_id; }

  function AvatarCircle({ name, size=40, fontSize=16 }) {
    return <div style={{ width:size, height:size, borderRadius:"50%", background:d.accentSoft, color:d.accentHover, display:"flex", alignItems:"center", justifyContent:"center", fontSize, fontWeight:700, flexShrink:0 }}>{(name||"?").charAt(0).toUpperCase()}</div>;
  }

  if (viewFriend) {
    const f = accepted.find(x=>friendId(x)===viewFriend);
    return <FriendProfile userId={viewFriend} profile={profiles[viewFriend]} onBack={()=>setViewFriend(null)} onRemove={f?()=>handleRemove(f):null} isMobile={isMobile} d={d} />;
  }

  const tabs = [
    ["friends", `Friends${accepted.length?` (${accepted.length})`:""}` ],
    ["requests", `Requests${pendingReceived.length?` (${pendingReceived.length})`:""}` ],
    ["search", "Find Friends"],
  ];

  return (
    <div>
      <h1 style={hs(d).h1}>Social</h1>
      <p style={hs(d).sub}>Connect with friends and see their progress</p>

      {/* Share card */}
      <div style={{...hs(d).card, marginBottom:16}}>
        <h3 style={hs(d).h3}>Your Profile Link</h3>
        <div style={{ display:"flex", gap:8, marginBottom: qrUrl?12:0 }}>
          <input readOnly value={shareUrl} style={{...hs(d).input, flex:1, fontSize:12, color:d.text3}} />
          <button style={{...hs(d).btn, background:d.accent, color:d.accentText}} onClick={()=>{navigator.clipboard.writeText(shareUrl);showToast("Link copied!");}}>Copy</button>
          <button style={hs(d).btnSm} onClick={generateQr}>QR Code</button>
        </div>
        {qrUrl && <div style={{ marginTop:8 }}><img src={qrUrl} alt="QR Code" style={{ width:160, height:160, borderRadius:8, display:"block" }} /><div style={{ fontSize:12, color:d.text3, marginTop:6 }}>Share this to let friends add you instantly</div></div>}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
        {tabs.map(([id, label])=>(
          <button key={id} onClick={()=>setTab(id)} style={{...hs(d).btn, background:tab===id?d.accent:d.surface2, color:tab===id?d.accentText:d.text2, border:`1px solid ${tab===id?d.accent:d.border}`, padding:"7px 14px"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Friends */}
      {tab==="friends" && (
        accepted.length===0
          ? <Empty icon="" title="No friends yet" desc="Search for people or share your profile link to connect" d={d}/>
          : accepted.map(f=>{
              const fid=friendId(f); const p=profiles[fid];
              return (
                <div key={f.id} style={{...hs(d).card, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, gap:12}}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <AvatarCircle name={p?.profile_name} />
                    <div>
                      <div style={{ fontWeight:600, color:d.text }}>{p?.profile_name||"Loading..."}</div>
                      <div style={{ fontSize:12, color:d.text3 }}>{splitName(p?.split_id||"")}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                    <button style={{...hs(d).btn, background:d.accentSoft, color:d.accentHover, padding:"6px 12px"}} onClick={()=>setViewFriend(fid)}>View</button>
                    <button style={{...hs(d).btnSm, color:d.danger}} onClick={()=>handleRemove(f)}>Remove</button>
                  </div>
                </div>
              );
            })
      )}

      {/* Requests */}
      {tab==="requests" && (
        <>
          {pendingReceived.length>0 && (
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:d.text3, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Received</div>
              {pendingReceived.map(f=>{
                const p=profiles[f.requester_id];
                return (
                  <div key={f.id} style={{...hs(d).card, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, gap:12}}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <AvatarCircle name={p?.profile_name} size={36} fontSize={14}/>
                      <span style={{ fontWeight:600, color:d.text }}>{p?.profile_name||"Someone"}</span>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button style={{...hs(d).btn, background:d.accent, color:d.accentText, padding:"6px 12px"}} onClick={()=>handleAccept(f)}>Accept</button>
                      <button style={hs(d).btnSm} onClick={()=>handleDecline(f)}>Decline</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {pendingSent.length>0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:d.text3, textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>Sent</div>
              {pendingSent.map(f=>{
                const p=profiles[f.addressee_id];
                return (
                  <div key={f.id} style={{...hs(d).card, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8}}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <AvatarCircle name={p?.profile_name} size={36} fontSize={14}/>
                      <span style={{ fontWeight:600, color:d.text }}>{p?.profile_name||"Loading..."}</span>
                    </div>
                    <span style={{ fontSize:12, color:d.text3, background:d.surface2, border:`1px solid ${d.border}`, padding:"3px 10px", borderRadius:20 }}>Pending</span>
                  </div>
                );
              })}
            </div>
          )}
          {!pendingReceived.length&&!pendingSent.length&&<Empty icon="" title="No pending requests" desc="Search for friends or share your link" d={d}/>}
        </>
      )}

      {/* Search */}
      {tab==="search" && (
        <>
          <div style={{ display:"flex", gap:8, marginBottom:16 }}>
            <input style={{...hs(d).input, flex:1}} placeholder="Search by name or email..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSearch()} />
            <button style={{...hs(d).btn, background:d.accent, color:d.accentText}} onClick={handleSearch} disabled={searching}>{searching?"...":"Search"}</button>
          </div>
          {searchResults.length===0&&searchQuery&&!searching&&<Empty icon="" title="No results" desc="Try a different name or full email address" d={d}/>}
          {searchResults.map(r=>{
            const rel=friendships.find(f=>(f.requester_id===userId&&f.addressee_id===r.user_id)||(f.addressee_id===userId&&f.requester_id===r.user_id));
            const statusLabel=rel?(rel.status==="accepted"?"Friends":"Pending"):null;
            return (
              <div key={r.user_id} style={{...hs(d).card, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8, gap:12}}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:"50%", background:d.accentSoft, color:d.accentHover, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, flexShrink:0 }}>{r.profile_name.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight:600, color:d.text }}>{r.profile_name}</div>
                    <div style={{ fontSize:12, color:d.text3 }}>{splitName(r.split_id||"")}</div>
                  </div>
                </div>
                {statusLabel
                  ? <span style={{ fontSize:12, color:d.text3 }}>{statusLabel}</span>
                  : <button style={{...hs(d).btn, background:d.accent, color:d.accentText, padding:"6px 12px"}} onClick={()=>handleAdd(r.user_id)}>Add</button>
                }
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}

function FriendProfile({ userId, profile, onBack, onRemove, isMobile, d }) {
  const [workouts, setWorkouts] = useState(null);
  const [bwLog, setBwLog]       = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(()=>{
    async function load() {
      try {
        const [w, bw] = await Promise.all([fetchWorkouts(userId), fetchBodyWeight(userId)]);
        setWorkouts(w); setBwLog(bw);
      } catch { setWorkouts([]); setBwLog([]); }
      setLoading(false);
    }
    load();
  }, [userId]);

  const prs     = useMemo(()=>workouts?calcPRs(workouts):{}, [workouts]);
  const streak  = useMemo(()=>workouts?calcStreak(workouts):0, [workouts]);
  const latestBW= useMemo(()=>bwLog?.length?[...bwLog].sort((a,b)=>b.date-a.date)[0]:null, [bwLog]);
  const recentWorkouts = useMemo(()=>workouts?[...workouts].sort((a,b)=>b.date-a.date).slice(0,5):[], [workouts]);
  const prRows  = Object.entries(prs).map(([id,pr])=>({id,pr,ex:DEFAULT_EXERCISES.find(e=>e.id===id)})).filter(r=>r.ex).sort((a,b)=>b.pr.date-a.pr.date).slice(0,8);

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
        <button onClick={onBack} style={hs(d).btnSm}>← Back</button>
        {onRemove && <button onClick={onRemove} style={{...hs(d).btnSm, color:d.danger}}>Remove Friend</button>}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20 }}>
        <div style={{ width:64, height:64, borderRadius:"50%", background:d.accentSoft, color:d.accentHover, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, fontWeight:800 }}>
          {(profile?.profile_name||"?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 style={{...hs(d).h1, marginBottom:6}}>{profile?.profile_name||"Friend"}</h1>
          <div style={{ display:"flex", gap:14, fontSize:13, color:d.text3, flexWrap:"wrap" }}>
            {streak>0 && <span style={{ color:d.green, fontWeight:700 }}>🔥 {streak} day streak</span>}
            {profile?.height_in && <span>{fmtHeight(profile.height_in)}</span>}
            {latestBW && <span>{latestBW.weight} lbs</span>}
            {profile?.split_id && <span>{splitName(profile.split_id)}</span>}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color:d.text3, fontSize:14, padding:"40px 0", textAlign:"center" }}>Loading...</div>
      ) : (
        <>
          <div style={{...hs(d).card, marginBottom:16}}>
            <h3 style={hs(d).h3}>Recent Workouts</h3>
            {recentWorkouts.length
              ? recentWorkouts.map(w=><WorkoutEntry key={w.id} w={w} prs={prs} allEx={DEFAULT_EXERCISES} onDelete={null} typeLabels={{}} isMobile={isMobile} d={d}/>)
              : <Empty icon="" title="No workouts yet" d={d}/>
            }
          </div>
          {prRows.length>0 && (
            <div style={hs(d).card}>
              <h3 style={hs(d).h3}>Top Lifts</h3>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%", minWidth:isMobile?400:"auto", borderCollapse:"collapse", fontSize:13 }}>
                  <thead><tr>{["Exercise","Best","Est. 1RM"].map(h=><th key={h} style={hs(d).th}>{h}</th>)}</tr></thead>
                  <tbody>
                    {prRows.map(({id,pr,ex})=>(
                      <tr key={id}>
                        <td style={{...hs(d).td,fontWeight:600}}>{ex.name}</td>
                        <td style={hs(d).td}>{pr.weight} lbs × {pr.reps}</td>
                        <td style={{...hs(d).td,color:d.text2}}>{Math.round(pr.weight*(1+pr.reps/30))} lbs</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// EMPTY / ICONS
function Empty({ icon, title, desc, d }) {
  return (
    <div style={{ textAlign:"center", padding:"40px 24px", color:d?.text3||"#9c9c97" }}>
      <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:52, height:52, borderRadius:14, background:d?.surface2||"#f2f1ed", color:d?.text3||"#9c9c97", marginBottom:14 }}>{icon || <TargetIcon size={22}/>}</div>
      <div style={{ fontSize:15, fontWeight:600, color:d?.text2||"#6b6b67", marginBottom:4 }}>{title}</div>
      {desc&&<div style={{ fontSize:13 }}>{desc}</div>}
    </div>
  );
}

// MUSCLE HEATMAP
const MUSCLE_MAP = {
  chest:      { label:"Chest",       muscles:["Chest","Upper Chest","Lower Chest","Chest/Triceps"] },
  shoulders:  { label:"Shoulders",   muscles:["Shoulders","Front Delts","Side Delts"] },
  triceps:    { label:"Triceps",     muscles:["Triceps"] },
  biceps:     { label:"Biceps",      muscles:["Biceps","Brachialis","Lats/Biceps"] },
  lats:       { label:"Lats",        muscles:["Lats"] },
  back:       { label:"Mid Back",    muscles:["Back","Mid Back"] },
  traps:      { label:"Traps",       muscles:["Traps"] },
  reardelts:  { label:"Rear Delts",  muscles:["Rear Delts"] },
  quads:      { label:"Quads",       muscles:["Quads","Glutes/Quads"] },
  hamstrings: { label:"Hamstrings",  muscles:["Hamstrings","Glutes/Hams","Glutes/Hamstrings"] },
  glutes:     { label:"Glutes",      muscles:["Glutes"] },
  calves:     { label:"Calves",      muscles:["Calves"] },
  abs:        { label:"Abs",         muscles:["Abs","Core"] },
};

function computeMuscleScores(prs, allEx, bwLog) {
  const bw = bwLog.length ? bwLog[bwLog.length - 1].weight : null;
  const scores = {};
  for (const [key, grp] of Object.entries(MUSCLE_MAP)) {
    let bestOrm = 0, bestEx = null;
    for (const ex of allEx) {
      if (!grp.muscles.includes(ex.muscle)) continue;
      const pr = prs[ex.id];
      if (!pr) continue;
      const orm = Math.round(pr.weight * (1 + pr.reps / 30));
      if (orm > bestOrm) { bestOrm = orm; bestEx = ex; }
    }
    if (bestOrm > 0) scores[key] = { orm: bestOrm, ratio: bw ? bestOrm / bw : bestOrm, bestEx, bw };
  }
  const sorted = Object.entries(scores).sort((a, b) => a[1].ratio - b[1].ratio);
  sorted.forEach(([k], i) => { scores[k].rank = i; scores[k].total = sorted.length; });
  return scores;
}

function heatColor(rank, total) {
  const t = total <= 1 ? 0.5 : rank / (total - 1);
  const hue = Math.round(240 - t * 220);
  const sat = Math.round(55 + t * 35);
  const lit = Math.round(52 - t * 12);
  return `hsl(${hue},${sat}%,${lit}%)`;
}

function MuscleHeatmap({ prs, allEx, bwLog, d }) {
  const [selected, setSelected] = useState(null);
  const [hovered, setHovered]   = useState(null);
  const scores = useMemo(() => computeMuscleScores(prs, allEx, bwLog), [prs, allEx, bwLog]);
  const bw = bwLog.length ? bwLog[bwLog.length - 1].weight : null;
  const sel = selected ? scores[selected] : null;
  const ranked = Object.entries(scores).sort((a, b) => b[1].rank - a[1].rank);

  const G = "#c4c9d4";
  const outline = { stroke:"rgba(255,255,255,0.9)", strokeWidth:1.2, strokeLinecap:"round", strokeLinejoin:"round" };

  // Always-visible white stroke; fill=G (invisible) when no data, heat color when active
  function mp(key) {
    const s = scores[key];
    const on = selected === key || hovered === key;
    const color = s ? heatColor(s.rank, s.total) : null;
    return {
      fill: s ? color : G,
      fillOpacity: s ? (on ? 1 : 0.86) : 1,
      cursor: s ? "pointer" : "default",
      ...outline,
      style: { transition:"fill 0.2s", filter: on && s ? "brightness(1.18)" : "none" },
      onClick: s ? () => setSelected(selected === key ? null : key) : undefined,
      onMouseEnter: s ? () => setHovered(key) : undefined,
      onMouseLeave: () => setHovered(null),
    };
  }

  const bf = { fill: G, ...outline };
  // white internal separator lines (sternum, quad heads, etc.)
  const WL = { fill:"none", ...outline, pointerEvents:"none" };

  // Seamless human body: torso+shoulders ONE path, arms ONE path each, legs ONE path each.
  // ViewBox 200×455, center x=100. All parts overlap slightly → no seams.
  const silhouette = (
    <>
      {/* HEAD */}
      <ellipse cx="100" cy="26" rx="17" ry="21" {...bf}/>
      {/* TORSO + SHOULDERS (one continuous path, deltoid caps built in) */}
      <path d="M88,44 C91,54 109,54 112,44 L116,66 L84,66 Z" {...bf}/>
      <path d="M84,63 C71,67 58,73 49,84 C41,94 37,108 39,122 C41,133 49,143 61,145 C69,146 74,142 78,137 C76,154 73,172 71,190 C69,210 69,230 74,244 C79,257 89,265 100,266 C111,265 121,257 126,244 C131,230 131,210 129,190 C127,172 124,154 122,137 C126,142 131,146 139,145 C151,143 159,133 161,122 C163,108 159,94 151,84 C142,73 129,67 116,63 C111,70 106,74 100,74 C94,74 89,70 84,63 Z" {...bf}/>
      {/* LEFT ARM — upper arm + forearm + hand, one closed path overlapping shoulder */}
      <path d="M47,116 C40,131 36,150 37,170 C38,190 43,211 49,230 C52,242 54,252 53,263 C52,273 48,281 48,288 C48,294 52,298 58,296 C64,294 67,285 68,271 C70,253 69,235 70,219 C72,196 78,169 78,137 C72,126 61,117 47,116 Z" {...bf}/>
      {/* RIGHT ARM */}
      <path d="M153,116 C160,131 164,150 163,170 C162,190 157,211 151,230 C148,242 146,252 147,263 C148,273 152,281 152,288 C152,294 148,298 142,296 C136,294 133,285 132,271 C130,253 131,235 130,219 C128,196 122,169 122,137 C128,126 139,117 153,116 Z" {...bf}/>
      {/* LEFT LEG — thigh + knee + calf + foot */}
      <path d="M75,244 C69,263 67,291 70,319 C72,344 80,360 86,374 C91,389 91,414 87,437 C83,441 75,444 66,449 L96,449 C100,430 103,405 102,378 C101,346 99,310 100,266 C90,265 81,258 75,244 Z" {...bf}/>
      {/* RIGHT LEG */}
      <path d="M125,244 C131,263 133,291 130,319 C128,344 120,360 114,374 C109,389 109,414 113,437 C117,441 125,444 134,449 L104,449 C100,430 97,405 98,378 C99,346 101,310 100,266 C110,265 119,258 125,244 Z" {...bf}/>
      {/* inner thigh gap + knee caps */}
      <path d="M100,266 C96,296 96,326 98,354" {...WL}/>
    </>
  );

  const svgStyle = { width:"100%", maxWidth:168, display:"block" };

  const frontSvg = (
    <svg viewBox="0 0 200 455" style={svgStyle}>
      {silhouette}
      {/* CHEST left pec */}
      <path d="M100,82 C84,78 68,81 60,91 C54,99 55,111 62,120 C69,128 84,129 95,123 C99,121 100,116 100,108 Z" {...mp("chest")}/>
      {/* CHEST right pec */}
      <path d="M100,82 C116,78 132,81 140,91 C146,99 145,111 138,120 C131,128 116,129 105,123 C101,121 100,116 100,108 Z" {...mp("chest")}/>
      <path d="M100,83 L100,127" {...WL}/>
      <path d="M63,103 C75,110 88,112 100,111 C112,112 125,110 137,103" {...WL}/>
      {/* SHOULDERS left anterior delt */}
      <path d="M42,94 C45,84 56,77 70,73 C81,79 84,91 78,105 C73,118 61,126 50,122 C42,119 38,108 42,94 Z" {...mp("shoulders")}/>
      {/* SHOULDERS right */}
      <path d="M158,94 C155,84 144,77 130,73 C119,79 116,91 122,105 C127,118 139,126 150,122 C158,119 162,108 158,94 Z" {...mp("shoulders")}/>
      <path d="M45,112 C53,116 63,115 74,108" {...WL}/>
      <path d="M155,112 C147,116 137,115 126,108" {...WL}/>
      {/* BICEPS left */}
      <path d="M46,126 C38,147 39,173 48,189 C53,198 61,199 66,191 C71,182 70,160 65,145 C61,132 54,125 46,126 Z" {...mp("biceps")}/>
      {/* BICEPS right */}
      <path d="M154,126 C162,147 161,173 152,189 C147,198 139,199 134,191 C129,182 130,160 135,145 C139,132 146,125 154,126 Z" {...mp("biceps")}/>
      <path d="M44,153 C51,156 59,156 68,153" {...WL}/>
      <path d="M156,153 C149,156 141,156 132,153" {...WL}/>
      {/* ABS 6-pack */}
      <path d="M86,132 C95,128 105,128 114,132 C116,148 116,166 111,181 C108,190 104,195 100,195 C96,195 92,190 89,181 C84,166 84,148 86,132 Z" {...mp("abs")}/>
      <path d="M100,132 L100,194" {...WL}/>
      <path d="M88,148 L112,148" {...WL}/>
      <path d="M88,164 L112,164" {...WL}/>
      <path d="M91,180 L109,180" {...WL}/>
      {/* Obliques */}
      <path d="M73,128 C69,145 69,169 76,188 C80,197 86,203 93,204 L91,190 C85,174 84,149 88,130 Z" {...mp("abs")}/>
      <path d="M127,128 C131,145 131,169 124,188 C120,197 114,203 107,204 L109,190 C115,174 116,149 112,130 Z" {...mp("abs")}/>
      {/* QUADS left */}
      <path d="M74,265 C70,288 70,318 75,343 C79,362 87,372 96,370 C101,350 102,320 100,288 C99,273 94,264 86,260 C81,258 77,260 74,265 Z" {...mp("quads")}/>
      {/* QUADS right */}
      <path d="M126,265 C130,288 130,318 125,343 C121,362 113,372 104,370 C99,350 98,320 100,288 C101,273 106,264 114,260 C119,258 123,260 126,265 Z" {...mp("quads")}/>
      <path d="M84,268 C83,292 84,327 82,354" {...WL}/>
      <path d="M94,272 C95,299 95,331 94,360" {...WL}/>
      <path d="M106,272 C105,299 105,331 106,360" {...WL}/>
      <path d="M116,268 C117,292 116,327 118,354" {...WL}/>
      {/* CALVES left */}
      <path d="M76,376 C70,395 69,421 76,438 C80,448 91,449 95,438 C100,420 98,392 93,374 Z" {...mp("calves")}/>
      {/* CALVES right */}
      <path d="M124,376 C130,395 131,421 124,438 C120,448 109,449 105,438 C100,420 102,392 107,374 Z" {...mp("calves")}/>
      <path d="M85,379 C82,397 82,420 84,439" {...WL}/>
      <path d="M115,379 C118,397 118,420 116,439" {...WL}/>
    </svg>
  );

  const backSvg = (
    <svg viewBox="0 0 200 455" style={svgStyle}>
      {silhouette}
      {/* TRAPS */}
      <path d="M86,56 C76,63 67,72 63,84 C60,94 64,103 74,108 C83,112 93,109 100,103 C107,109 117,112 126,108 C136,103 140,94 137,84 C133,72 124,63 114,56 C109,65 105,70 100,71 C95,70 91,65 86,56 Z" {...mp("traps")}/>
      <path d="M100,53 L100,109" {...WL}/>
      <path d="M76,72 C84,78 92,80 100,80 C108,80 116,78 124,72" {...WL}/>
      {/* REAR DELTS left */}
      <path d="M42,94 C45,84 56,77 70,73 C80,80 82,93 76,106 C71,119 60,126 50,122 C42,119 38,108 42,94 Z" {...mp("reardelts")}/>
      {/* REAR DELTS right */}
      <path d="M158,94 C155,84 144,77 130,73 C120,80 118,93 124,106 C129,119 140,126 150,122 C158,119 162,108 158,94 Z" {...mp("reardelts")}/>
      {/* TRICEPS left */}
      <path d="M46,126 C40,146 40,173 49,191 C54,202 63,203 68,192 C73,180 70,151 63,137 C58,128 52,124 46,126 Z" {...mp("triceps")}/>
      {/* TRICEPS right */}
      <path d="M154,126 C160,146 160,173 151,191 C146,202 137,203 132,192 C127,180 130,151 137,137 C142,128 148,124 154,126 Z" {...mp("triceps")}/>
      <path d="M45,146 C52,149 61,149 68,145" {...WL}/>
      <path d="M155,146 C148,149 139,149 132,145" {...WL}/>
      {/* LATS left */}
      <path d="M68,92 C56,108 51,131 54,154 C57,176 68,193 80,199 C84,185 86,164 85,142 C84,120 81,101 77,88 C74,88 71,89 68,92 Z" {...mp("lats")}/>
      {/* LATS right */}
      <path d="M132,92 C144,108 149,131 146,154 C143,176 132,193 120,199 C116,185 114,164 115,142 C116,120 119,101 123,88 C126,88 129,89 132,92 Z" {...mp("lats")}/>
      <path d="M60,114 C68,122 76,127 84,129" {...WL}/>
      <path d="M57,139 C66,148 74,153 84,155" {...WL}/>
      <path d="M140,114 C132,122 124,127 116,129" {...WL}/>
      <path d="M143,139 C134,148 126,153 116,155" {...WL}/>
      {/* ERECTORS */}
      <path d="M92,106 C87,130 87,161 93,188 C96,200 99,206 100,206 C101,206 104,200 107,188 C113,161 113,130 108,106 C105,109 103,111 100,111 C97,111 95,109 92,106 Z" {...mp("back")}/>
      <path d="M100,108 L100,205" {...WL}/>
      {/* GLUTES left */}
      <path d="M76,236 C70,251 72,271 82,282 C90,291 98,292 100,286 C102,292 110,291 118,282 C128,271 130,251 124,236 C116,230 107,229 100,237 C93,229 84,230 76,236 Z" {...mp("glutes")}/>
      <path d="M100,236 L100,288" {...WL}/>
      <path d="M79,247 C87,241 94,240 100,245" {...WL}/>
      <path d="M121,247 C113,241 106,240 100,245" {...WL}/>
      {/* HAMSTRINGS left */}
      <path d="M76,265 C71,289 72,320 78,344 C83,363 91,373 98,369 C101,348 101,318 99,291 C98,276 91,263 84,260 C80,259 77,261 76,265 Z" {...mp("hamstrings")}/>
      {/* HAMSTRINGS right */}
      <path d="M124,265 C129,289 128,320 122,344 C117,363 109,373 102,369 C99,348 99,318 101,291 C102,276 109,263 116,260 C120,259 123,261 124,265 Z" {...mp("hamstrings")}/>
      <path d="M86,269 C84,294 85,326 84,355" {...WL}/>
      <path d="M114,269 C116,294 115,326 116,355" {...WL}/>
      {/* CALVES back */}
      <path d="M76,376 C70,395 69,421 76,438 C80,448 91,449 95,438 C100,420 98,392 93,374 Z" {...mp("calves")}/>
      <path d="M124,376 C130,395 131,421 124,438 C120,448 109,449 105,438 C100,420 102,392 107,374 Z" {...mp("calves")}/>
      <path d="M85,379 C82,397 82,420 84,439" {...WL}/>
      <path d="M115,379 C118,397 118,420 116,439" {...WL}/>
    </svg>
  );

  return (
    <div>
      <h1 style={hs(d).h1}>Muscle Map</h1>
      <p style={hs(d).sub}>{bw ? `Ranked by strength ÷ ${bw} lb bodyweight` : "Log bodyweight to see relative strength ratios"}</p>

      {Object.keys(scores).length === 0 ? (
        <Empty icon={<DumbbellIcon size={24}/>} title="No PR data yet" desc="Log workouts to build your muscle strength map." d={d}/>
      ) : (
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", alignItems:"flex-start" }}>

          <div style={{ flex:"0 0 auto", background:d.surface, borderRadius:20, padding:"20px 12px 14px", display:"flex", flexDirection:"column", alignItems:"center", border:`1px solid ${d.border}` }}>
            {/* Front + Back side by side */}
            <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:10, fontWeight:600, color:d.text3, textTransform:"uppercase", letterSpacing:"0.06em" }}>Front</span>
                {frontSvg}
              </div>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:10, fontWeight:600, color:d.text3, textTransform:"uppercase", letterSpacing:"0.06em" }}>Back</span>
                {backSvg}
              </div>
            </div>
            <div style={{ width:"100%", marginTop:14 }}>
              <div style={{ height:5, borderRadius:3, background:"linear-gradient(to right,hsl(240,85%,62%),hsl(195,80%,52%),hsl(140,65%,46%),hsl(65,85%,56%),hsl(28,90%,52%),hsl(0,88%,56%))" }}/>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:d.text3, marginTop:5 }}>
                <span>Weakest</span><span>Strongest</span>
              </div>
            </div>
          </div>

          <div style={{ flex:1, minWidth:180 }}>
            {sel && (
              <div style={{...hs(d).card, marginBottom:12, borderLeft:`3px solid ${heatColor(sel.rank,sel.total)}` }}>
                <div style={{ fontWeight:700, fontSize:15, marginBottom:8 }}>{MUSCLE_MAP[selected].label}</div>
                <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
                  <div style={{ fontSize:12, color:d.text2 }}>Best: <span style={{ color:d.text, fontWeight:600 }}>{sel.bestEx?.name}</span></div>
                  <div style={{ fontSize:12, color:d.text2 }}>Est. 1RM: <span style={{ color:d.text, fontWeight:600 }}>{sel.orm} lbs</span></div>
                  {bw && <div style={{ fontSize:12, color:d.text2 }}>BW Ratio: <span style={{ color:d.text, fontWeight:600 }}>{sel.ratio.toFixed(2)}×</span></div>}
                  <div style={{ fontSize:11, color:d.text3, marginTop:2 }}>Rank #{sel.total - sel.rank} of {sel.total} groups</div>
                </div>
              </div>
            )}

            <div style={hs(d).card}>
              <div style={{ fontWeight:600, fontSize:11, color:d.text3, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>Strength Ranking</div>
              {ranked.map(([key, s]) => {
                const color = heatColor(s.rank, s.total);
                const isActive = selected === key;
                return (
                  <div key={key} onClick={() => setSelected(selected===key ? null : key)}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, cursor:"pointer", marginBottom:2, transition:"all 0.15s",
                      background: isActive ? color + "18" : "transparent",
                      outline: isActive ? `1px solid ${color}44` : "1px solid transparent" }}>
                    <div style={{ width:8, height:8, borderRadius:"50%", background:color, flexShrink:0, boxShadow:`0 0 7px ${color}99` }}/>
                    <div style={{ flex:1, fontSize:13, fontWeight:isActive?600:400, color:isActive?d.text:d.text2 }}>{MUSCLE_MAP[key].label}</div>
                    <div style={{ fontSize:12, color:d.text3, fontVariantNumeric:"tabular-nums" }}>
                      {bw ? `${s.ratio.toFixed(2)}×` : `${s.orm}lb`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ONE REP MAX CALCULATOR
const ORM_FORMULAS = [
  { name: "Epley",    fn: (w, r) => r === 1 ? w : Math.round(w * (1 + r / 30)) },
  { name: "Brzycki",  fn: (w, r) => r === 1 ? w : Math.round(w * (36 / (37 - r))) },
  { name: "Lander",   fn: (w, r) => r === 1 ? w : Math.round((100 * w) / (101.3 - 2.67123 * r)) },
  { name: "Lombardi", fn: (w, r) => r === 1 ? w : Math.round(w * Math.pow(r, 0.10)) },
];

const PCT_ROWS = [
  { pct: 100, reps: "1"   },
  { pct: 95,  reps: "2"   },
  { pct: 90,  reps: "3"   },
  { pct: 85,  reps: "4–5" },
  { pct: 80,  reps: "6"   },
  { pct: 75,  reps: "8"   },
  { pct: 70,  reps: "10"  },
  { pct: 65,  reps: "12"  },
  { pct: 60,  reps: "15"  },
  { pct: 50,  reps: "20"  },
];

function OneRepMax({ d }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps]     = useState("");

  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  const valid = w > 0 && r >= 1 && r <= 30;
  const orm = valid ? Math.round(ORM_FORMULAS.reduce((sum, f) => sum + f.fn(w, r), 0) / ORM_FORMULAS.length) : null;

  return (
    <div>
      <h1 style={hs(d).h1}>1RM Calculator</h1>
      <p style={hs(d).sub}>Estimate your one-rep max from any set</p>

      <div style={{...hs(d).card, marginBottom: 20}}>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:120 }}>
            <label style={{ display:"block", fontSize:12, color:d.text2, marginBottom:4, fontWeight:600 }}>Weight (lbs)</label>
            <input
              type="number"
              min="1"
              placeholder="e.g. 225"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{...hs(d).input, width:"100%"}}
            />
          </div>
          <div style={{ flex:1, minWidth:120 }}>
            <label style={{ display:"block", fontSize:12, color:d.text2, marginBottom:4, fontWeight:600 }}>Reps completed</label>
            <input
              type="number"
              min="1"
              max="30"
              placeholder="e.g. 5"
              value={reps}
              onChange={e => setReps(e.target.value)}
              style={{...hs(d).input, width:"100%"}}
            />
          </div>
        </div>
      </div>

      {valid && (
        <>
          <div style={{...hs(d).card, marginBottom:20, textAlign:"center"}}>
            <div style={{ fontSize:13, color:d.text2, marginBottom:4 }}>Estimated 1RM</div>
            <div style={{ fontSize:48, fontWeight:800, color:d.accent, lineHeight:1 }}>{orm}</div>
            <div style={{ fontSize:14, color:d.text3, marginTop:4 }}>lbs</div>
          </div>

          <div style={{...hs(d).card, marginBottom:20}}>
            <h3 style={{...hs(d).h3, marginBottom:12}}>Formula Comparison</h3>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr>
                    {ORM_FORMULAS.map(f => <th key={f.name} style={hs(d).th}>{f.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {ORM_FORMULAS.map(f => (
                      <td key={f.name} style={{...hs(d).td, fontWeight:700, textAlign:"center"}}>
                        {f.fn(w, r)} lbs
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{...hs(d).card}}>
            <h3 style={{...hs(d).h3, marginBottom:12}}>Training Percentages</h3>
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr>
                    {["%","Weight","Rep range"].map(h => <th key={h} style={hs(d).th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {PCT_ROWS.map(({ pct, reps: repRange }) => {
                    const w2 = Math.round(orm * pct / 100);
                    const isMax = pct === 100;
                    return (
                      <tr key={pct} style={isMax ? { background: d.accent + "18" } : {}}>
                        <td style={{...hs(d).td, fontWeight: isMax ? 700 : 500, color: isMax ? d.accent : d.text}}>{pct}%</td>
                        <td style={{...hs(d).td, fontWeight:700}}>{w2} lbs</td>
                        <td style={{...hs(d).td, color:d.text2}}>{repRange}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function GridIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>; }
function PlusIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>; }
function ClockIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>; }
function TrendIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>; }
function ListIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>; }
function ScaleIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6l9-3 9 3"/><path d="M3 6v14a1 1 0 001 1h16a1 1 0 001-1V6"/><path d="M12 3v18"/></svg>; }
function UserIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0"/></svg>; }
function UsersIcon()    { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>; }
function CalcIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>; }
function BodyIcon()     { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="4" r="2"/><path d="M12 7v6"/><path d="M8 10h8"/><path d="M10 13l-2 7"/><path d="M14 13l2 7"/></svg>; }
function DumbbellIcon({ size=20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M3 9.5h18v5H3z" rx="1"/><rect x="1" y="8" width="4" height="8" rx="1"/><rect x="19" y="8" width="4" height="8" rx="1"/></svg>; }
function CalendarIcon({ size=20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>; }
function WeightScaleIcon({ size=20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8"/><path d="M12 8v4"/></svg>; }
function FireIcon({ size=14 })  { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-7 7 7 7 0 01-7-7c0-1.53.4-2.973 1-4.28.6 1 1.5 1.78 2.5 1.78z"/></svg>; }
function SunIcon()      { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>; }
function MoonIcon()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function ChevronDownIcon({ size=12 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>; }
function ChevronUpIcon({ size=12 })   { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>; }
function TargetIcon({ size=20 })      { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>; }
