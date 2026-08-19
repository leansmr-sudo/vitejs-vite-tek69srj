import { useState, useEffect } from "react";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB22Jcrd7FVjaDAXvBF40s5TtGIrCDtuCk",
  authDomain: "smrhc-stats.firebaseapp.com",
  projectId: "smrhc-stats",
  storageBucket: "smrhc-stats.firebasestorage.app",
  messagingSenderId: "3330947459",
  appId: "1:3330947459:web:512c978ad867586e4fdeb6",
};

const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const EQUIPOS = ["Superior", "Intermedia", "Pre-intermedia A"];
const ANIO_ACTUAL = new Date().getFullYear().toString();

export default function StatsPublicas() {
  const [matches, setMatches]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [equipo, setEquipo]     = useState("Superior");
  const [solapa, setSolapa]     = useState("acumulado"); // "acumulado" | "partidos"

  useEffect(() => {
    const fetch = async () => {
      try {
        const snapshot = await getDocs(collection(db, "partidos"));
        const data = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        data.sort((a,b) => new Date(b.date) - new Date(a.date));
        setMatches(data);
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const partidosEquipo = matches.filter(m =>
    m.equipo === equipo && m.date?.startsWith(ANIO_ACTUAL)
  );

  // Acumulado por jugador
  const acumulado = {};
  partidosEquipo.forEach(m => {
    (m.players || []).filter(p => p.name).forEach(p => {
      if (!acumulado[p.name]) {
        acumulado[p.name] = { nombre:p.name, tries:0, conversions:0, penalties:0, dropGoals:0, tackles:0, carries:0, minutesPlayed:0, partidos:0 };
      }
      acumulado[p.name].tries        += p.tries||0;
      acumulado[p.name].conversions  += p.conversions||0;
      acumulado[p.name].penalties    += p.penalties||0;
      acumulado[p.name].dropGoals    += p.dropGoals||0;
      acumulado[p.name].tackles      += p.tackles||0;
      acumulado[p.name].carries      += p.carries||0;
      acumulado[p.name].minutesPlayed+= p.minutesPlayed||0;
      acumulado[p.name].partidos     += 1;
    });
  });

  const jugadoresAcum = Object.values(acumulado).sort((a,b) =>
    (b.tries*5+b.conversions*2+b.penalties*3+b.dropGoals*3) -
    (a.tries*5+a.conversions*2+a.penalties*3+a.dropGoals*3)
  );

  const calcPts = j => j.tries*5 + j.conversions*2 + j.penalties*3 + j.dropGoals*3;

  return (
    <div style={S.root}>
      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}>
            <span style={{fontSize:22}}>🏉</span>
            <span style={S.logoTxt}>SMRHC<span style={S.logoAcc}> STATS</span></span>
          </div>
          <div style={S.badge}>Solo lectura · Temporada {ANIO_ACTUAL}</div>
        </div>
      </header>

      <div style={S.page}>
        {/* Filtro equipo */}
        <div style={{...S.nav, marginBottom:12}}>
          {EQUIPOS.map(eq=>(
            <button key={eq} style={{...S.navBtn,...(equipo===eq?S.navBtnActive:{})}}
              onClick={()=>setEquipo(eq)}>{eq}</button>
          ))}
        </div>

        {/* Solapas */}
        <div style={{...S.nav, marginBottom:16}}>
          <button style={{...S.navBtn,...(solapa==="acumulado"?S.navBtnActive:{})}}
            onClick={()=>setSolapa("acumulado")}>📊 Acumulado</button>
          <button style={{...S.navBtn,...(solapa==="partidos"?S.navBtnActive:{})}}
            onClick={()=>setSolapa("partidos")}>📋 Por partido</button>
        </div>

        {loading && <div style={S.empty}>Cargando estadísticas...</div>}

        {!loading && partidosEquipo.length === 0 && (
          <div style={S.empty}>No hay partidos registrados para {equipo} en {ANIO_ACTUAL}.</div>
        )}

        {/* SOLAPA ACUMULADO */}
        {!loading && solapa === "acumulado" && partidosEquipo.length > 0 && (
          <div style={S.card}>
            <div style={S.cardTitle}>Estadísticas acumuladas — {equipo} · {partidosEquipo.length} partidos</div>
            <div style={{overflowX:"auto"}}>
              <table style={S.table}>
                <thead>
                  <tr style={S.thead}>
                    <th style={{...S.th, textAlign:"left"}}>Jugador</th>
                    <th style={S.th}>PJ</th>
                    <th style={S.th}>T</th>
                    <th style={S.th}>C</th>
                    <th style={S.th}>P</th>
                    <th style={S.th}>D</th>
                    <th style={{...S.th,color:"#f5c842"}}>Pts</th>
                    <th style={S.th}>Tkl</th>
                    <th style={S.th}>Min</th>
                  </tr>
                </thead>
                <tbody>
                  {jugadoresAcum.map((j,i)=>(
                    <tr key={j.nombre} style={{background:i%2===0?"#0d1120":"#0c0f1a"}}>
                      <td style={{...S.td,textAlign:"left",fontWeight:"bold"}}>{j.nombre}</td>
                      <td style={S.td}>{j.partidos}</td>
                      <td style={S.td}>{j.tries||"—"}</td>
                      <td style={S.td}>{j.conversions||"—"}</td>
                      <td style={S.td}>{j.penalties||"—"}</td>
                      <td style={S.td}>{j.dropGoals||"—"}</td>
                      <td style={{...S.td,color:"#f5c842",fontWeight:"bold"}}>{calcPts(j)||"—"}</td>
                      <td style={S.td}>{j.tackles||"—"}</td>
                      <td style={{...S.td,color:"#4a6a9a"}}>{j.minutesPlayed}'</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={S.legend}>T: Tries · C: Conversiones · P: Penales · D: Drop Goals · Pts: Puntos · Tkl: Tackles · Min: Minutos</div>
          </div>
        )}

        {/* SOLAPA POR PARTIDO */}
        {!loading && solapa === "partidos" && partidosEquipo.length > 0 && (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {partidosEquipo.map((m,i)=>{
              const jugadores = (m.players||[]).filter(p=>p.name);
              return (
                <div key={m.id} style={S.card}>
                  <div style={S.cardTitle}>
                    {m.date} — vs {m.rival||"Rival"}
                    <span style={{marginLeft:12, fontWeight:"normal", fontSize:13,
                      color:(m.score?.us||0)>(m.score?.them||0)?"#2979d4":(m.score?.us||0)<(m.score?.them||0)?"#ff6b6b":"#f5c842"}}>
                      {m.score?.us||0} — {m.score?.them||0}
                    </span>
                    {m.competition && <span style={{marginLeft:8,fontSize:11,color:"#4a6a9a"}}>· {m.competition}</span>}
                  </div>
                  {jugadores.length > 0 ? (
                    <div style={{overflowX:"auto"}}>
                      <table style={S.table}>
                        <thead>
                          <tr style={S.thead}>
                            <th style={{...S.th,textAlign:"left"}}>Jugador</th>
                            <th style={S.th}>T</th>
                            <th style={S.th}>C</th>
                            <th style={S.th}>P</th>
                            <th style={S.th}>D</th>
                            <th style={{...S.th,color:"#f5c842"}}>Pts</th>
                            <th style={S.th}>Tkl</th>
                            <th style={S.th}>Min</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jugadores.map((p,j)=>(
                            <tr key={p.id} style={{background:j%2===0?"#0d1120":"#0c0f1a"}}>
                              <td style={{...S.td,textAlign:"left"}}>{p.name}</td>
                              <td style={S.td}>{p.tries||"—"}</td>
                              <td style={S.td}>{p.conversions||"—"}</td>
                              <td style={S.td}>{p.penalties||"—"}</td>
                              <td style={S.td}>{p.dropGoals||"—"}</td>
                              <td style={{...S.td,color:"#f5c842",fontWeight:"bold"}}>{(p.tries*5+p.conversions*2+p.penalties*3+p.dropGoals*3)||"—"}</td>
                              <td style={S.td}>{p.tackles||"—"}</td>
                              <td style={{...S.td,color:"#4a6a9a"}}>{p.minutesPlayed}'</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{...S.empty,padding:"12px"}}>Sin estadísticas de jugadores.</div>
                  )}
                  {(m.sustituciones||[]).length > 0 && (
                    <div style={{marginTop:10,fontSize:12,color:"#4a6a9a"}}>
                      🔄 Sustituciones: {m.sustituciones.map(s=>`${s.sale} → ${s.entra} (${s.minuto||"—"}')`).join(" · ")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const S = {
  root: { minHeight:"100vh", background:"#0a0c12", color:"#e8f0e8", fontFamily:"'Georgia','Times New Roman',serif" },
  header: { background:"rgba(10,12,18,0.97)", borderBottom:"1.5px solid #1a2244", padding:"11px 16px", position:"sticky", top:0, zIndex:100 },
  headerInner: { maxWidth:900, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between" },
  logo: { display:"flex", alignItems:"center", gap:8 },
  logoTxt: { fontSize:19, fontWeight:"bold", letterSpacing:4, color:"#e8f0e8" },
  logoAcc: { color:"#2979d4" },
  badge: { fontSize:11, color:"#4a6a9a", border:"1px solid #1a2244", borderRadius:20, padding:"4px 12px" },
  page: { maxWidth:900, margin:"20px auto 40px", padding:"0 16px" },
  nav: { display:"flex", gap:4, background:"#0d1120", borderRadius:12, padding:4 },
  navBtn: { flex:1, padding:"9px 4px", background:"transparent", border:"none", color:"#6a8aaa", borderRadius:9, cursor:"pointer", fontFamily:"inherit", fontSize:12 },
  navBtnActive: { background:"#2979d4", color:"#fff", fontWeight:"bold" },
  card: { background:"#0d1120", border:"1px solid #1a2244", borderRadius:12, overflow:"hidden", padding:0 },
  cardTitle: { padding:"12px 16px", fontSize:13, color:"#2979d4", fontWeight:"bold", textTransform:"uppercase", letterSpacing:1, borderBottom:"1px solid #1a2244" },
  table: { width:"100%", borderCollapse:"collapse", fontSize:13 },
  thead: { background:"#0a0c18" },
  th: { padding:"10px 12px", textAlign:"center", fontSize:10, color:"#4a6a9a", textTransform:"uppercase", letterSpacing:1, borderBottom:"1px solid #1a2244", fontWeight:"bold" },
  td: { padding:"9px 12px", textAlign:"center", borderBottom:"1px solid #0f1428" },
  legend: { padding:"10px 16px", fontSize:11, color:"#3a5a7a", borderTop:"1px solid #1a2244" },
  empty: { textAlign:"center", color:"#3a5a7a", padding:"40px 16px", fontSize:14 },
};