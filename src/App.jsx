import { useState, useMemo, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";

// ─── FIREBASE CONFIG ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: "AIzaSyB22Jcrd7FVjaDAXvBF40s5TtGIrCDtuCk",
  authDomain: "smrhc-stats.firebaseapp.com",
  projectId: "smrhc-stats",
  storageBucket: "smrhc-stats.firebasestorage.app",
  messagingSenderId: "3330947459",
  appId: "1:3330947459:web:512c978ad867586e4fdeb6",
  measurementId: "G-5TJHH6ETHS"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

// ─── DATA CONFIG ─────────────────────────────────────────────────────────────

const ACCIONES = {
  Tackle:           { icon: "💪", resultados: ["Efectivo", "Fallido"] },
  Line:             { icon: "✋", resultados: ["Ganado", "Perdido"] },
  Scrum:            { icon: "🔄", resultados: ["Ganado", "Perdido"] },
  Error_de_manejo:  { icon: "❌", resultados: ["Error"] },
  Penal:            { icon: "⚡", resultados: ["Cometido"] },
  Quiebre:          { icon: "💥", resultados: ["Hecho"] },
  Ruck:             { icon: "🏉", resultados: ["Menos 3", "Mas 3"] },
  Salidas:          { icon: "📤", resultados: ["Dentro de las 22", "Fuera de las 22", "Cortas", "Largas"] },
};

const POSICIONES = [
  "1 - Pilier izq.","2 - Hooker","3 - Pilier der.",
  "4 - Lock","5 - Lock","6 - Ala","7 - Ala","8 - Octavo",
  "9 - Medio scrum","10 - Apertura","11 - Ala izq.",
  "12 - Centro","13 - Centro","14 - Ala der.","15 - Full back",
  "16 - Suplente","17 - Suplente","18 - Suplente","19 - Suplente",
  "20 - Suplente","21 - Suplente","22 - Suplente","23 - Suplente",
];

const STATS_JUGADOR = [
  { key:"tries",       label:"Tries",           icon:"🏉", pts:5 },
  { key:"conversions", label:"Conversiones",     icon:"🎯", pts:2 },
  { key:"penalties",   label:"Penales",          icon:"⚡", pts:3 },
  { key:"dropGoals",   label:"Drop Goals",       icon:"💫", pts:3 },
  { key:"tackles",     label:"Tackles",          icon:"💪", pts:0 },
  { key:"carries",     label:"Cargas",           icon:"🏃", pts:0 },
  { key:"yellowCards", label:"Tarjeta Amarilla", icon:"🟡", pts:0 },
  { key:"redCards",    label:"Tarjeta Roja",     icon:"🔴", pts:0 },
];

const initPlayer = (n) => ({
  id: n, name: "", position: POSICIONES[n-1] || `Jugador ${n}`,
  tries:0, conversions:0, penalties:0, dropGoals:0,
  tackles:0, carries:0, yellowCards:0, redCards:0, minutesPlayed:80,
});

const initMatch = () => ({
  date: new Date().toISOString().split("T")[0],
  rival: "", location: "Local", competition: "", notes: "",
  score: { us:0, them:0 },
  players: Array.from({length:23}, (_,i) => initPlayer(i+1)),
  log: [],
});

const calcPts = (p) => p.tries*5 + p.conversions*2 + p.penalties*3 + p.dropGoals*3;

function buildSummary(log, tiempo = null) {
  const rows = tiempo ? log.filter(e => e.tiempo === tiempo) : log;
  const count = (equipo, accion, resultado) =>
    rows.filter(e => e.equipo===equipo && e.accion===accion && (resultado ? e.resultado===resultado : true)).length;
  const pct = (a, b) => { const t = a + b; return t === 0 ? null : Math.round((a/t)*100); };
  return [
    { label:"Line Ganados",      propio: count("Propio","Line","Ganado"),           rival: count("Rival","Line","Ganado"),           type:"pos" },
    { label:"Line Perdidos",     propio: count("Propio","Line","Perdido"),          rival: count("Rival","Line","Perdido"),          type:"neg" },
    { label:"Scrum Ganados",     propio: count("Propio","Scrum","Ganado"),          rival: count("Rival","Scrum","Ganado"),          type:"pos" },
    { label:"Scrum Perdidos",    propio: count("Propio","Scrum","Perdido"),         rival: count("Rival","Scrum","Perdido"),         type:"neg" },
    { label:"Tackles Efectivos", propio: count("Propio","Tackle","Efectivo"),       rival: count("Rival","Tackle","Efectivo"),       type:"pos" },
    { label:"Tackles Fallidos",  propio: count("Propio","Tackle","Fallido"),        rival: count("Rival","Tackle","Fallido"),        type:"neg" },
    { label:"Penales Cometidos", propio: count("Propio","Penal","Cometido"),        rival: count("Rival","Penal","Cometido"),        type:"neg" },
    { label:"Errores de Manejo", propio: count("Propio","Error_de_manejo","Error"), rival: count("Rival","Error_de_manejo","Error"), type:"neg" },
    { label:"Quiebres",          propio: count("Propio","Quiebre","Hecho"),         rival: count("Rival","Quiebre","Hecho"),         type:"pos" },
    { label:"Rucks < 3s",        propio: count("Propio","Ruck","Menos 3"),          rival: count("Rival","Ruck","Menos 3"),          type:"pos" },
    { label:"Rucks > 3s",        propio: count("Propio","Ruck","Mas 3"),            rival: count("Rival","Ruck","Mas 3"),            type:"neg" },
    { label:"Salidas ≤22",       propio: count("Propio","Salidas","Dentro de las 22"), rival: count("Rival","Salidas","Dentro de las 22"), type:"neg" },
    { label:"Salidas >22",       propio: count("Propio","Salidas","Fuera de las 22"),  rival: count("Rival","Salidas","Fuera de las 22"),  type:"pos" },
    { label:"Salidas Cortas",    propio: count("Propio","Salidas","Cortas"),        rival: count("Rival","Salidas","Cortas"),        type:"neu" },
    { label:"Salidas Largas",    propio: count("Propio","Salidas","Largas"),        rival: count("Rival","Salidas","Largas"),        type:"neu" },
  ].map(r => ({ ...r, pct: r.type==="pos" ? pct(r.propio, r.propio+r.rival) : r.type==="neg" ? pct(r.rival, r.propio+r.rival) : null }));
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError("Completá todos los campos."); return; }
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch(e) {
      setError("Email o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.loginRoot}>
      <div style={S.loginCard}>
        <div style={S.loginLogo}>
          <span style={{fontSize:40}}>🏉</span>
          <div style={S.loginTitle}>RUGBY<span style={S.loginAccent}>STATS</span></div>
          <div style={S.loginSubtitle}>SMRHC — Staff Técnico</div>
        </div>
        <div style={S.loginForm}>
          <label style={S.loginLabel}>Email
            <input style={S.loginInput} type="email" placeholder="tu@email.com" value={email} onChange={e=>setEmail(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </label>
          <label style={S.loginLabel}>Contraseña
            <input style={S.loginInput} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          </label>
          {error && <div style={S.loginError}>{error}</div>}
          <button style={{...S.loginBtn, opacity: loading?0.7:1}} onClick={handleLogin} disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

const SECTIONS = ["Partido","Registro","Jugadores","Resumen"];

export default function App() {
  const [user, setUser]                 = useState(null);
  const [authLoading, setAuthLoading]   = useState(true);
  const [match, setMatch]               = useState(initMatch());
  const [section, setSection]           = useState(0);
  const [matches, setMatches]           = useState([]);
  const [historyOpen, setHistoryOpen]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [editingId, setEditingId]       = useState(null);
  const [logForm, setLogForm]           = useState({ minuto:"", tiempo:"1T", equipo:"Propio", accion:"Tackle", resultado:"Efectivo", jugador:"", penalizacion:"", tarjeta:"", obs:"" });
  const [selPlayer, setSelPlayer]       = useState(null);
  const [resTab, setResTab]             = useState("total");
  const [toast, setToast]               = useState(null);

  const showToast = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),2500); };

  // ── Auth listener ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  // ── Cargar partidos ──
  useEffect(() => {
    if (!user) return;
    const fetchMatches = async () => {
      try {
        const snapshot = await getDocs(collection(db, "partidos"));
        const data = snapshot.docs.map(d => ({ ...d.data(), firebaseId: d.id }));
        data.sort((a,b) => new Date(b.date) - new Date(a.date));
        setMatches(data);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchMatches();
  }, [user]);

  const updateMatch  = (k,v) => setMatch(m => ({...m,[k]:v}));
  const updatePlayer = (id,k,v) => setMatch(m => ({...m, players: m.players.map(p => p.id===id ? {...p,[k]:v} : p)}));

  const ACCIONES_CON_JUGADOR = ["Tackle", "Error_de_manejo", "Penal"];
  const requiereJugador = ACCIONES_CON_JUGADOR.includes(logForm.accion) && logForm.equipo === "Propio";

  const addLog = () => {
    if (!logForm.accion) return;
    if (requiereJugador && !logForm.jugador) return;
    setMatch(m => ({...m, log: [...m.log, {...logForm, id: Date.now()}]}));
    setLogForm(f => ({...f, minuto:"", obs:"", penalizacion:"", tarjeta:"", jugador:""}));
  };
  const removeLog = (id) => setMatch(m => ({...m, log: m.log.filter(e => e.id!==id)}));

  const saveMatch = async () => {
    setSaving(true);
    try {
      const data = { ...match, savedAt: new Date().toLocaleString(), savedBy: user.email };
      if (editingId) {
        await updateDoc(doc(db, "partidos", editingId), data);
        setMatches(prev => prev.map(m => m.firebaseId === editingId ? { ...data, firebaseId: editingId } : m));
        setEditingId(null);
        showToast("✅ Partido actualizado");
      } else {
        const ref = await addDoc(collection(db, "partidos"), data);
        setMatches(prev => [{ ...data, firebaseId: ref.id }, ...prev]);
        showToast("✅ Partido guardado");
      }
      setMatch(initMatch());
      setSection(0);
    } catch(e) { showToast("❌ Error al guardar", "error"); }
    finally { setSaving(false); }
  };

  const deleteMatch = async (firebaseId) => {
    try {
      await deleteDoc(doc(db, "partidos", firebaseId));
      setMatches(prev => prev.filter(m => m.firebaseId !== firebaseId));
      setConfirmDelete(null);
      showToast("🗑 Partido borrado");
    } catch(e) { showToast("❌ Error al borrar", "error"); }
  };

  const editMatch = (m) => { setMatch(m); setEditingId(m.firebaseId); setHistoryOpen(false); setSection(0); setSelPlayer(null); };

  const summary       = useMemo(() => buildSummary(match.log),       [match.log]);
  const summary1T     = useMemo(() => buildSummary(match.log,"1T"),  [match.log]);
  const summary2T     = useMemo(() => buildSummary(match.log,"2T"),  [match.log]);
  const activeSummary = resTab==="1T" ? summary1T : resTab==="2T" ? summary2T : summary;
  const selPlayerData = match.players.find(p => p.id === selPlayer);

  if (authLoading) return <div style={{...S.root, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, color:"#4a6a4a"}}>Cargando...</div>;
  if (!user) return <LoginScreen />;

  if (historyOpen) return (
    <div style={S.root}>
      <Header user={user}>
        <button style={S.pill} onClick={() => { setHistoryOpen(false); setConfirmDelete(null); }}>← Volver</button>
      </Header>
      <div style={S.page}>
        <div style={S.pageTitle}>Historial ({matches.length} partidos)</div>
        {loading && <div style={S.empty}>Cargando partidos...</div>}
        {!loading && matches.length === 0 && <div style={S.empty}>No hay partidos guardados todavía.</div>}
        {matches.map((m,i) => (
          <div key={m.firebaseId||i} style={S.histCard}>
            <div style={S.histTop}>
              <span style={S.histRival}>vs {m.rival||"Rival"}</span>
              <span style={S.histDate}>{m.date}</span>
            </div>
            <div style={S.histScoreRow}>
              <span style={S.histScore}>{m.score?.us ?? 0}</span>
              <span style={S.histDash}>—</span>
              <span style={S.histScore}>{m.score?.them ?? 0}</span>
            </div>
            <div style={S.histMeta}>{m.location}{m.competition ? ` · ${m.competition}`:""} · {m.log?.length||0} acciones · {m.savedAt}</div>
            {m.savedBy && <div style={{fontSize:11, color:"#3a5a3a", marginTop:4}}>Guardado por: {m.savedBy}</div>}
            {confirmDelete === m.firebaseId ? (
              <div style={S.histConfirm}>
                <span style={S.histConfirmText}>¿Seguro que querés borrar este partido?</span>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  <button style={S.histBtnDanger} onClick={() => deleteMatch(m.firebaseId)}>Sí, borrar</button>
                  <button style={S.histBtnCancel} onClick={() => setConfirmDelete(null)}>Cancelar</button>
                </div>
              </div>
            ) : (
              <div style={S.histActions}>
                <button style={S.histBtnEdit} onClick={() => editMatch(m)}>✏️ Editar</button>
                <button style={S.histBtnDelete} onClick={() => setConfirmDelete(m.firebaseId)}>🗑 Borrar</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      {toast && <div style={{...S.toast, background: toast.type==="error"?"#4a1a1a":"#1a3a1a"}}>{toast.msg}</div>}
      <Header user={user}>
        <button style={S.pill} onClick={() => setHistoryOpen(true)}>Historial ({matches.length})</button>
        <button style={S.pillGreen} onClick={() => { setMatch(initMatch()); setSection(0); setSelPlayer(null); setEditingId(null); }}>+ Nuevo</button>
      </Header>

      <div style={S.scoreboard}>
        <div style={S.scoreTeam}>
          <div style={S.scoreLabel}>Nuestro equipo</div>
          <div style={S.scoreCtrl}>
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,us:Math.max(0,match.score.us-1)})}>−</button>
            <span style={S.scoreNum}>{match.score.us}</span>
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,us:match.score.us+1})}>+</button>
          </div>
        </div>
        <div style={S.scoreCenter}>
          <div style={S.scoreVS}>VS</div>
          <div style={S.scoreInfo}>{match.date}</div>
          {match.rival && <div style={S.scoreInfo2}>{match.rival}</div>}
        </div>
        <div style={S.scoreTeam}>
          <div style={S.scoreLabel}>{match.rival||"Rival"}</div>
          <div style={S.scoreCtrl}>
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,them:Math.max(0,match.score.them-1)})}>−</button>
            <span style={S.scoreNum}>{match.score.them}</span>
            <button style={S.scoreBtn} onClick={() => updateMatch("score",{...match.score,them:match.score.them+1})}>+</button>
          </div>
        </div>
      </div>

      {editingId && <div style={S.editingBanner}>✏️ Estás editando un partido guardado — recordá guardar los cambios en Resumen</div>}

      <div style={S.nav}>
        {SECTIONS.map((s,i) => (
          <button key={s} style={{...S.navBtn,...(section===i?S.navBtnActive:{})}} onClick={() => { setSection(i); setSelPlayer(null); }}>{s}</button>
        ))}
      </div>

      {section === 0 && (
        <div style={S.page}>
          <div style={S.pageTitle}>Datos del Partido</div>
          <div style={S.grid2}>
            <Field label="Fecha"><input style={S.input} type="date" value={match.date} onChange={e=>updateMatch("date",e.target.value)}/></Field>
            <Field label="Rival"><input style={S.input} placeholder="Nombre del rival" value={match.rival} onChange={e=>updateMatch("rival",e.target.value)}/></Field>
            <Field label="Sede">
              <select style={S.input} value={match.location} onChange={e=>updateMatch("location",e.target.value)}>
                <option>Local</option><option>Visitante</option><option>Cancha neutral</option>
              </select>
            </Field>
            <Field label="Competencia"><input style={S.input} placeholder="Ej: Liga provincial" value={match.competition} onChange={e=>updateMatch("competition",e.target.value)}/></Field>
          </div>
          <Field label="Notas del cuerpo técnico" style={{marginTop:12}}>
            <textarea style={{...S.input,minHeight:90,resize:"vertical"}} placeholder="Observaciones generales del partido..." value={match.notes} onChange={e=>updateMatch("notes",e.target.value)}/>
          </Field>
        </div>
      )}

      {section === 1 && (
        <div style={S.page}>
          <div style={S.pageTitle}>Registro de Acciones</div>
          <div style={S.logForm}>
            <div style={S.logFormRow}>
              <Field label="Min." style={{width:60}}>
                <input style={{...S.input,textAlign:"center"}} placeholder="—" value={logForm.minuto} onChange={e=>setLogForm(f=>({...f,minuto:e.target.value}))}/>
              </Field>
              <Field label="Tiempo">
                <div style={S.segCtrl}>
                  {["1T","2T"].map(t => <button key={t} style={{...S.segBtn,...(logForm.tiempo===t?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,tiempo:t}))}>{t}</button>)}
                </div>
              </Field>
              <Field label="Equipo">
                <div style={S.segCtrl}>
                  {["Propio","Rival"].map(eq => <button key={eq} style={{...S.segBtn,...(logForm.equipo===eq?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,equipo:eq,jugador:""}))}>{eq}</button>)}
                </div>
              </Field>
            </div>
            <Field label="Acción">
              <div style={S.accionGrid}>
                {Object.entries(ACCIONES).map(([key,{icon}]) => (
                  <button key={key} style={{...S.accionBtn,...(logForm.accion===key?S.accionBtnActive:{})}}
                    onClick={()=>setLogForm(f=>({...f,accion:key,resultado:ACCIONES[key].resultados[0],jugador:""}))}>
                    <span style={{fontSize:16}}>{icon}</span>
                    <span style={{fontSize:11,marginTop:2}}>{key.replace("_"," ")}</span>
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Resultado">
              <div style={S.segCtrl}>
                {(ACCIONES[logForm.accion]?.resultados||[]).map(r => <button key={r} style={{...S.segBtn,...(logForm.resultado===r?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,resultado:r}))}>{r}</button>)}
              </div>
            </Field>
            {requiereJugador && (
              <Field label={<span>Jugador <span style={{color:"#ff6b6b"}}>*</span></span>}>
                {match.players.filter(p => p.name).length === 0
                  ? <div style={S.jugadorWarning}>⚠️ Cargá los nombres en la pestaña Jugadores primero.</div>
                  : <select style={{...S.input, borderColor: !logForm.jugador ? "#ff6b6b88" : "#1e3a1e"}} value={logForm.jugador} onChange={e => setLogForm(f=>({...f, jugador: e.target.value}))}>
                      <option value="">— Seleccioná un jugador —</option>
                      {match.players.filter(p => p.name).map(p => <option key={p.id} value={`${p.id} - ${p.name}`}>#{p.id} {p.name} · {p.position}</option>)}
                    </select>
                }
              </Field>
            )}
            <div style={S.logFormRow}>
              <Field label="Penalización" style={{flex:1}}><input style={S.input} placeholder="Opcional" value={logForm.penalizacion} onChange={e=>setLogForm(f=>({...f,penalizacion:e.target.value}))}/></Field>
              <Field label="Tarjeta">
                <div style={S.segCtrl}>
                  {["—","Amarilla","Roja"].map(t => <button key={t} style={{...S.segBtn,...(logForm.tarjeta===(t==="—"?"":t)?S.segBtnActive:{})}} onClick={()=>setLogForm(f=>({...f,tarjeta:t==="—"?"":t}))}>{t}</button>)}
                </div>
              </Field>
            </div>
            <Field label="Observaciones"><input style={S.input} placeholder="Opcional" value={logForm.obs} onChange={e=>setLogForm(f=>({...f,obs:e.target.value}))}/></Field>
            <button style={{...S.addBtn, ...(requiereJugador && !logForm.jugador ? S.addBtnDisabled : {})}} onClick={addLog}>
              {requiereJugador && !logForm.jugador ? "Seleccioná un jugador para continuar" : "+ Agregar acción"}
            </button>
          </div>
          {match.log.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={S.logHeader}>
                <span style={{flex:.4}}>Min</span><span style={{flex:.4}}>T</span><span style={{flex:.8}}>Equipo</span>
                <span style={{flex:1.2}}>Acción</span><span style={{flex:1.8}}>Resultado / Jugador</span><span style={{flex:.3}}></span>
              </div>
              {[...match.log].reverse().map(e => (
                <div key={e.id} style={{...S.logRow, borderLeft:`3px solid ${e.equipo==="Propio"?"#00e5a0":"#ff6b6b"}`}}>
                  <span style={{flex:.4,color:"#888",fontSize:12}}>{e.minuto||"—"}</span>
                  <span style={{flex:.4}}><span style={S.badge}>{e.tiempo}</span></span>
                  <span style={{flex:.8,color:e.equipo==="Propio"?"#00e5a0":"#ff6b6b",fontSize:12,fontWeight:600}}>{e.equipo}</span>
                  <span style={{flex:1.2,fontSize:13}}>{ACCIONES[e.accion]?.icon} {e.accion.replace("_"," ")}</span>
                  <span style={{flex:1.8,fontSize:12,color:"#ccc"}}>
                    {e.resultado}
                    {e.jugador ? <span style={{color:"#f5c842"}}> · {e.jugador}</span> : ""}
                    {e.tarjeta ? ` · 🟡${e.tarjeta}` : ""}
                  </span>
                  <span style={{flex:.3,textAlign:"right"}}><button style={S.delBtn} onClick={()=>removeLog(e.id)}>✕</button></span>
                </div>
              ))}
            </div>
          )}
          {match.log.length === 0 && <div style={S.empty}>Todavía no hay acciones registradas.</div>}
        </div>
      )}

      {section === 2 && (
        <div style={S.page}>
          {selPlayer === null ? (
            <>
              <div style={S.pageTitle}>Plantel (23 jugadores)</div>
              <div style={S.playerList}>
                {match.players.map(p => (
                  <div key={p.id} style={S.playerRow} onClick={()=>setSelPlayer(p.id)}>
                    <div style={S.playerNumBadge}>{p.id}</div>
                    <div style={S.playerRowInfo}>
                      <input style={S.playerNameInput} placeholder="Nombre del jugador" value={p.name} onClick={e=>e.stopPropagation()} onChange={e=>updatePlayer(p.id,"name",e.target.value)}/>
                      <span style={S.playerPosLabel}>{p.position}</span>
                    </div>
                    {calcPts(p) > 0 && <div style={S.playerPtsBadge}>{calcPts(p)} pts</div>}
                    <div style={S.playerArrow}>›</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <PlayerEditor p={selPlayerData} update={(k,v)=>updatePlayer(selPlayerData.id,k,v)} onBack={()=>setSelPlayer(null)} onPrev={()=>setSelPlayer(v=>Math.max(1,v-1))} onNext={()=>setSelPlayer(v=>Math.min(23,v+1))}/>
          )}
        </div>
      )}

      {section === 3 && (
        <div style={S.page}>
          <div style={S.pageTitle}>Resumen del Partido</div>
          <div style={S.resScorebig}>
            <div style={S.resTeam}><div style={S.resTeamName}>Propio</div><div style={S.resScoreNum}>{match.score.us}</div></div>
            <div style={S.resMid}><div style={S.resDash}>—</div>{match.rival&&<div style={S.resRivalName}>{match.rival}</div>}</div>
            <div style={S.resTeam}><div style={S.resTeamName}>{match.rival||"Rival"}</div><div style={{...S.resScoreNum,color:"#fff"}}>{match.score.them}</div></div>
          </div>
          <div style={S.nav}>
            {[["total","Todo el partido"],["1T","Primer Tiempo"],["2T","Segundo Tiempo"]].map(([k,l])=>(
              <button key={k} style={{...S.navBtn,...(resTab===k?S.navBtnActive:{})}} onClick={()=>setResTab(k)}>{l}</button>
            ))}
          </div>
          <div style={{...S.summCard,marginTop:16}}>
            <div style={S.summCardTitle}>Análisis Táctico</div>
            <div style={S.summHead}>
              <span style={{flex:1.8}}>Estadística</span>
              <span style={{flex:.6,textAlign:"center",color:"#00e5a0"}}>Propio</span>
              <span style={{flex:1.6,textAlign:"center"}}>Efectividad</span>
              <span style={{flex:.6,textAlign:"center",color:"#ff6b6b"}}>Rival</span>
            </div>
            {activeSummary.map((row,i) => {
              const total = row.propio + row.rival;
              const propPct = total === 0 ? 0 : Math.round((row.propio/total)*100);
              return (
                <div key={i} style={{...S.summRow,...(i%2===0?S.summRowAlt:{})}}>
                  <span style={{flex:1.8,fontSize:13}}>{row.label}</span>
                  <span style={{flex:.6,textAlign:"center",fontWeight:700,color:"#00e5a0"}}>{row.propio}</span>
                  <span style={{flex:1.6}}>
                    {total > 0 ? (
                      <div style={S.barWrap}>
                        <div style={{...S.barFill, width:`${propPct}%`, background: row.type==="neg"?"#ff6b6b":row.type==="pos"?"#00e5a0":"#888"}}/>
                        <span style={S.barLabel}>{propPct}%</span>
                      </div>
                    ) : <span style={{color:"#444",fontSize:12,paddingLeft:8}}>Sin datos</span>}
                  </span>
                  <span style={{flex:.6,textAlign:"center",fontWeight:700,color:"#ff6b6b"}}>{row.rival}</span>
                </div>
              );
            })}
          </div>
          <div style={{...S.summCard,marginTop:16}}>
            <div style={S.summCardTitle}>Puntos por Jugador</div>
            <div style={S.summHead}>
              <span style={{flex:2}}>Jugador</span>
              <span style={{flex:.7,textAlign:"center"}}>T</span><span style={{flex:.7,textAlign:"center"}}>C</span>
              <span style={{flex:.7,textAlign:"center"}}>P</span><span style={{flex:.7,textAlign:"center"}}>D</span>
              <span style={{flex:.8,textAlign:"center",color:"#f5c842"}}>Pts</span>
              <span style={{flex:.7,textAlign:"center"}}>Min</span>
            </div>
            {match.players.filter(p=>p.name||calcPts(p)>0).map((p,i)=>(
              <div key={p.id} style={{...S.summRow,...(i%2===0?S.summRowAlt:{})}}>
                <span style={{flex:2,fontSize:13}}>#{p.id} {p.name||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.tries||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.conversions||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.penalties||"—"}</span>
                <span style={{flex:.7,textAlign:"center"}}>{p.dropGoals||"—"}</span>
                <span style={{flex:.8,textAlign:"center",fontWeight:700,color:"#f5c842"}}>{calcPts(p)||"—"}</span>
                <span style={{flex:.7,textAlign:"center",color:"#888",fontSize:12}}>{p.minutesPlayed}'</span>
              </div>
            ))}
            {match.players.filter(p=>p.name||calcPts(p)>0).length===0 && <div style={S.empty}>Cargá los jugadores en la pestaña Jugadores.</div>}
          </div>
          {match.notes && <div style={S.notesBox}><strong>Notas:</strong> {match.notes}</div>}
          <button style={{...S.saveBtn, opacity: saving?0.7:1}} onClick={saveMatch} disabled={saving}>
            {saving ? "Guardando..." : editingId ? "💾 Guardar cambios" : "💾 Guardar Partido"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function Header({ children, user }) {
  return (
    <header style={S.header}>
      <div style={S.headerInner}>
        <div style={S.logo}>
          <span style={{fontSize:22}}>🏉</span>
          <span style={S.logoTxt}>RUGBY<span style={S.logoAcc}>STATS</span></span>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {children}
          <button style={S.pillRed} onClick={() => signOut(auth)}>Salir</button>
        </div>
      </div>
    </header>
  );
}

function Field({ label, children, style }) {
  return (
    <label style={{display:"flex",flexDirection:"column",gap:6,fontSize:11,color:"#7a8a7a",textTransform:"uppercase",letterSpacing:1,...style}}>
      {label}{children}
    </label>
  );
}

function PlayerEditor({ p, update, onBack, onPrev, onNext }) {
  return (
    <div>
      <div style={S.pedHeader}>
        <button style={S.backBtn} onClick={onBack}>← Plantel</button>
        <div><div style={S.pedName}>#{p.id} {p.name||"Sin nombre"}</div><div style={S.pedPos}>{p.position}</div></div>
        <div style={S.pedPts}>{calcPts(p)}<span style={{fontSize:12,color:"#888"}}> pts</span></div>
      </div>
      <div style={S.statsGrid}>
        {STATS_JUGADOR.map(s=>(
          <div key={s.key} style={S.statCard}>
            <div style={S.statIcon}>{s.icon}</div>
            <div style={S.statLbl}>{s.label}{s.pts>0?<span style={S.statPtsHint}> +{s.pts}pts</span>:""}</div>
            <div style={S.statCtrl}>
              <button style={S.statBtn} onClick={()=>update(s.key,Math.max(0,p[s.key]-1))}>−</button>
              <span style={S.statVal}>{p[s.key]}</span>
              <button style={S.statBtn} onClick={()=>update(s.key,p[s.key]+1)}>+</button>
            </div>
          </div>
        ))}
        <div style={S.statCard}>
          <div style={S.statIcon}>⏱</div>
          <div style={S.statLbl}>Minutos jugados</div>
          <div style={S.statCtrl}>
            <button style={S.statBtn} onClick={()=>update("minutesPlayed",Math.max(0,p.minutesPlayed-5))}>−5</button>
            <span style={S.statVal}>{p.minutesPlayed}'</span>
            <button style={S.statBtn} onClick={()=>update("minutesPlayed",Math.min(80,p.minutesPlayed+5))}>+5</button>
          </div>
        </div>
      </div>
      <div style={S.pedNav}>
        <button style={S.pedNavBtn} disabled={p.id===1} onClick={onPrev}>← Anterior</button>
        <button style={S.pedNavBtn} disabled={p.id===23} onClick={onNext}>Siguiente →</button>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────

const S = {
  root: { minHeight:"100vh", background:"#0b0f0b", color:"#e8f0e8", fontFamily:"'Georgia', 'Times New Roman', serif" },
  loginRoot: { minHeight:"100vh", background:"#0b0f0b", display:"flex", alignItems:"center", justifyContent:"center", padding:16 },
  loginCard: { background:"#0f180f", border:"1px solid #1e3a1e", borderRadius:16, padding:"40px 32px", width:"100%", maxWidth:380 },
  loginLogo: { display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginBottom:32 },
  loginTitle: { fontSize:28, fontWeight:"bold", letterSpacing:4, color:"#e8f0e8" },
  loginAccent: { color:"#00e5a0" },
  loginSubtitle: { fontSize:12, color:"#4a6a4a", letterSpacing:2, textTransform:"uppercase" },
  loginForm: { display:"flex", flexDirection:"column", gap:16 },
  loginLabel: { display:"flex", flexDirection:"column", gap:6, fontSize:11, color:"#7a8a7a", textTransform:"uppercase", letterSpacing:1 },
  loginInput: { background:"#0d150d", border:"1px solid #1e3a1e", borderRadius:8, padding:"12px 14px", color:"#e8f0e8", fontSize:14, fontFamily:"inherit", outline:"none" },
  loginBtn: { background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:10, padding:"14px", fontSize:15, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginTop:8 },
  loginError: { background:"#2a1a1a", border:"1px solid #ff6b6b44", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#ff9a9a" },
  toast: { position:"fixed", top:16, left:"50%", transform:"translateX(-50%)", zIndex:999, padding:"12px 24px", borderRadius:10, fontSize:14, fontWeight:"bold", color:"#fff", boxShadow:"0 4px 20px rgba(0,0,0,0.5)" },
  header: { position:"fixed", top:0, left:0, right:0, zIndex:100, background:"rgba(11,15,11,0.97)", borderBottom:"1.5px solid #1e3a1e", backdropFilter:"blur(12px)" },
  headerInner: { maxWidth:860, margin:"0 auto", padding:"11px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" },
  logo: { display:"flex", alignItems:"center", gap:8 },
  logoTxt: { fontSize:19, fontWeight:"bold", letterSpacing:4, color:"#e8f0e8" },
  logoAcc: { color:"#00e5a0" },
  pill: { background:"transparent", border:"1px solid #2a4a2a", color:"#aaa", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  pillGreen: { background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontWeight:"bold", fontSize:12, fontFamily:"inherit" },
  pillRed: { background:"transparent", border:"1px solid #4a2a2a", color:"#ff6b6b", borderRadius:20, padding:"5px 14px", cursor:"pointer", fontSize:12, fontFamily:"inherit" },
  editingBanner: { maxWidth:860, margin:"8px auto 0", padding:"8px 16px", background:"#1a2a0a", border:"1px solid #4a7a1a", borderRadius:8, fontSize:12, color:"#aadd44", textAlign:"center" },
  scoreboard: { maxWidth:860, margin:"72px auto 0", padding:"20px 16px 0", display:"flex", alignItems:"center", gap:8 },
  scoreTeam: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:8 },
  scoreLabel: { fontSize:11, color:"#6a8a6a", textTransform:"uppercase", letterSpacing:1.5, textAlign:"center" },
  scoreCtrl: { display:"flex", alignItems:"center", gap:10 },
  scoreBtn: { background:"#111d11", border:"1px solid #00e5a0", color:"#00e5a0", borderRadius:8, width:34, height:34, cursor:"pointer", fontSize:20, lineHeight:1 },
  scoreNum: { fontSize:52, fontWeight:"bold", color:"#fff", minWidth:64, textAlign:"center", lineHeight:1 },
  scoreCenter: { display:"flex", flexDirection:"column", alignItems:"center", gap:2, paddingBottom:4 },
  scoreVS: { fontSize:13, color:"#00e5a0", fontWeight:"bold", letterSpacing:3 },
  scoreInfo: { fontSize:11, color:"#4a6a4a" },
  scoreInfo2: { fontSize:12, color:"#7aaa7a", fontWeight:"bold" },
  nav: { maxWidth:860, margin:"16px auto 0", padding:"4px", display:"flex", gap:4, background:"#111811", borderRadius:12 },
  navBtn: { flex:1, padding:"9px 4px", background:"transparent", border:"none", color:"#6a8a6a", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12, transition:"all .15s" },
  navBtnActive: { background:"#00e5a0", color:"#0b0f0b", fontWeight:"bold" },
  page: { maxWidth:860, margin:"16px auto 40px", padding:"0 16px" },
  pageTitle: { fontSize:13, color:"#00e5a0", textTransform:"uppercase", letterSpacing:3, marginBottom:16, fontWeight:"bold" },
  grid2: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 },
  input: { background:"#0d150d", border:"1px solid #1e3a1e", borderRadius:8, padding:"10px 12px", color:"#e8f0e8", fontSize:13, fontFamily:"inherit", outline:"none" },
  logForm: { background:"#0f180f", border:"1px solid #1e3a1e", borderRadius:14, padding:"16px" },
  logFormRow: { display:"flex", gap:10, alignItems:"flex-end", marginBottom:12 },
  segCtrl: { display:"flex", gap:3, flexWrap:"wrap" },
  segBtn: { background:"#111d11", border:"1px solid #1e3a1e", color:"#7a9a7a", borderRadius:6, padding:"8px 12px", cursor:"pointer", fontFamily:"inherit", fontSize:12, whiteSpace:"nowrap" },
  segBtnActive: { background:"#00e5a0", color:"#0b0f0b", border:"1px solid #00e5a0", fontWeight:"bold" },
  accionGrid: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6 },
  accionBtn: { background:"#111d11", border:"1px solid #1e3a1e", color:"#7a9a7a", borderRadius:8, padding:"10px 4px", cursor:"pointer", fontFamily:"inherit", fontSize:12, display:"flex", flexDirection:"column", alignItems:"center", gap:2 },
  accionBtnActive: { background:"#0d2a1d", border:"1px solid #00e5a0", color:"#00e5a0" },
  addBtn: { width:"100%", background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:10, padding:"13px", fontSize:14, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginTop:12 },
  addBtnDisabled: { background:"#1a2a1a", color:"#4a6a4a", cursor:"not-allowed" },
  jugadorWarning: { background:"#2a1a0e", border:"1px solid #ff6b6b55", borderRadius:8, padding:"10px 12px", fontSize:12, color:"#ff9a6b" },
  logHeader: { display:"flex", padding:"8px 12px", fontSize:11, color:"#4a6a4a", textTransform:"uppercase", letterSpacing:1, borderBottom:"1px solid #1e3a1e" },
  logRow: { display:"flex", alignItems:"center", padding:"10px 12px", borderBottom:"1px solid #131f13", fontSize:13 },
  badge: { background:"#1a2a1a", color:"#7aaa7a", fontSize:10, padding:"2px 6px", borderRadius:4, fontWeight:"bold" },
  delBtn: { background:"transparent", border:"none", color:"#4a3a3a", cursor:"pointer", fontSize:13, padding:4 },
  playerList: { display:"flex", flexDirection:"column", gap:6 },
  playerRow: { display:"flex", alignItems:"center", gap:10, background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:10, padding:"10px 14px", cursor:"pointer" },
  playerNumBadge: { width:28, height:28, background:"#1a2a1a", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:"bold", color:"#00e5a0", flexShrink:0 },
  playerRowInfo: { flex:1, display:"flex", flexDirection:"column", gap:3 },
  playerNameInput: { background:"transparent", border:"none", borderBottom:"1px solid #1e3a1e", color:"#e8f0e8", fontSize:13, fontFamily:"inherit", padding:"2px 0", outline:"none", width:"100%" },
  playerPosLabel: { fontSize:11, color:"#4a6a4a" },
  playerPtsBadge: { fontSize:12, color:"#f5c842", fontWeight:"bold" },
  playerArrow: { color:"#3a5a3a", fontSize:18, marginLeft:4 },
  pedHeader: { display:"flex", alignItems:"center", gap:12, background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:12, padding:"14px 16px", marginBottom:16 },
  backBtn: { background:"transparent", border:"none", color:"#00e5a0", cursor:"pointer", fontSize:13, fontFamily:"inherit", whiteSpace:"nowrap" },
  pedName: { fontSize:17, fontWeight:"bold" },
  pedPos: { fontSize:11, color:"#4a6a4a" },
  pedPts: { marginLeft:"auto", fontSize:30, fontWeight:"bold", color:"#f5c842" },
  statsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  statCard: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:10, padding:"12px" },
  statIcon: { fontSize:18, marginBottom:4 },
  statLbl: { fontSize:11, color:"#6a8a6a", marginBottom:8 },
  statPtsHint: { color:"#f5c842" },
  statCtrl: { display:"flex", alignItems:"center", gap:8, justifyContent:"center" },
  statBtn: { background:"#1a2a1a", border:"1px solid #2a4a2a", color:"#00e5a0", borderRadius:6, width:32, height:32, cursor:"pointer", fontSize:16 },
  statVal: { fontSize:22, fontWeight:"bold", minWidth:32, textAlign:"center" },
  pedNav: { display:"flex", justifyContent:"space-between", marginTop:14 },
  pedNavBtn: { background:"#0f180f", border:"1px solid #1e3a1e", color:"#00e5a0", borderRadius:8, padding:"9px 18px", cursor:"pointer", fontFamily:"inherit", fontSize:12 },
  resScorebig: { display:"flex", alignItems:"center", justifyContent:"center", gap:20, marginBottom:20, background:"#0f180f", borderRadius:14, padding:"20px" },
  resTeam: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 },
  resTeamName: { fontSize:11, color:"#6a8a6a", textTransform:"uppercase", letterSpacing:1 },
  resScoreNum: { fontSize:52, fontWeight:"bold", color:"#00e5a0" },
  resMid: { display:"flex", flexDirection:"column", alignItems:"center", gap:4 },
  resDash: { fontSize:32, color:"#2a4a2a" },
  resRivalName: { fontSize:12, color:"#6a8a6a" },
  summCard: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:12, overflow:"hidden" },
  summCardTitle: { padding:"12px 16px", fontSize:11, color:"#00e5a0", textTransform:"uppercase", letterSpacing:2, borderBottom:"1px solid #1a2a1a", fontWeight:"bold" },
  summHead: { display:"flex", padding:"8px 16px", fontSize:10, color:"#4a6a4a", textTransform:"uppercase", letterSpacing:.5, borderBottom:"1px solid #1a2a1a" },
  summRow: { display:"flex", alignItems:"center", padding:"9px 16px", fontSize:13, borderBottom:"1px solid #111811" },
  summRowAlt: { background:"#0d150d" },
  barWrap: { height:16, background:"#111811", borderRadius:8, overflow:"hidden", position:"relative", flex:1, margin:"0 4px" },
  barFill: { height:"100%", borderRadius:8, transition:"width .4s ease" },
  barLabel: { position:"absolute", right:6, top:0, bottom:0, display:"flex", alignItems:"center", fontSize:10, color:"#fff", fontWeight:"bold" },
  notesBox: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#aaa", margin:"12px 0" },
  saveBtn: { width:"100%", background:"#00e5a0", border:"none", color:"#0b0f0b", borderRadius:10, padding:"14px", fontSize:15, fontWeight:"bold", cursor:"pointer", fontFamily:"inherit", marginTop:8 },
  empty: { textAlign:"center", color:"#3a5a3a", padding:"32px 16px", fontSize:14 },
  histCard: { background:"#0f180f", border:"1px solid #1a2a1a", borderRadius:12, padding:"16px", marginBottom:10 },
  histTop: { display:"flex", justifyContent:"space-between", marginBottom:8 },
  histRival: { fontSize:15, fontWeight:"bold" },
  histDate: { fontSize:12, color:"#4a6a4a" },
  histScoreRow: { display:"flex", alignItems:"center", gap:12, marginBottom:6 },
  histScore: { fontSize:32, fontWeight:"bold", color:"#00e5a0" },
  histDash: { fontSize:20, color:"#2a4a2a" },
  histMeta: { fontSize:12, color:"#4a6a4a" },
  histActions: { display:"flex", gap:8, marginTop:12 },
  histBtnEdit: { flex:1, background:"#1a2a1a", border:"1px solid #2a4a2a", color:"#00e5a0", borderRadius:8, padding:"9px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" },
  histBtnDelete: { flex:1, background:"#2a1a1a", border:"1px solid #4a2a2a", color:"#ff6b6b", borderRadius:8, padding:"9px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" },
  histConfirm: { marginTop:12, background:"#1a0f0f", border:"1px solid #ff6b6b44", borderRadius:8, padding:"12px" },
  histConfirmText: { fontSize:13, color:"#ffaaaa" },
  histBtnDanger: { background:"#ff6b6b", border:"none", color:"#fff", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:"bold" },
  histBtnCancel: { background:"#1a2a1a", border:"1px solid #2a4a2a", color:"#aaa", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontFamily:"inherit", fontSize:13 },
};
