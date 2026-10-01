import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Theme = "black" | "slate" | "light";
type Screen = "home" | "hub" | "analysis" | "profile" | "game";
type Failure = { title: string; reason: string } | null;
type CognitiveScores = { memory: number; motor: number; divided: number; flexibility: number; speed: number };
type GameMetric = { completed: number; flawless: number; mistakes: number; highScore: number; played: number };
type UnifiedStats = { date: string; dailySeconds: number; npi: number; games: Record<number,GameMetric> };
type AggregateStats = { dailySeconds: number; totalStages: number; errors: number; flawless: number; bestNpi: number; bestGameScore: number; played: number };
type UserProfile = { name: string; role: string; targetNpi: number; avatar: string };
const DEFAULT_PROFILE: UserProfile = { name:"Şevval Sunar", role:"Nöro-Araştırmacı & Bilişsel Sporcu", targetNpi:920, avatar:"" };

const games = [
  { id: 0, code: "SM-01", title: "Gölge Matris", skill: "Uzamsal Bellek", desc: "Işık örüntüsünü karanlık fazdan sonra yeniden kur.", accent: "cyan", icon: "grid" },
  { id: 1, code: "BC-02", title: "Kör Kartlar", skill: "Çalışma Belleği", desc: "Kısa karanlık kesintilerinde eşleri zihninde sabitle.", accent: "violet", icon: "cards" },
  { id: 2, code: "HM-03", title: "İnce Motor Simülatörü", skill: "Motor Kontrol", desc: "Hareketli mikro hedeflere titremeden temas et.", accent: "lime", icon: "target" },
  { id: 3, code: "CC-04", title: "Kelime & Calculus Zinciri", skill: "Sıralı Hatırlama", desc: "Sözcük ve türev dizisini bozmadan sürdür.", accent: "amber", icon: "chain" },
  { id: 4, code: "PT-05", title: "Hassas Labirent Yolu", skill: "El–Göz Koordinasyonu", desc: "Lazer duvarlara değmeden sinir yolunu izle.", accent: "cyan", icon: "route" },
  { id: 5, code: "GI-06", title: "Şekil Dönüşümü", skill: "Tepki Baskılama", desc: "Şekillere dokun; yıldızda dürtünü tamamen durdur.", accent: "rose", icon: "shapes" },
  { id: 6, code: "DO-07", title: "Çift Yörünge", skill: "Bölünmüş Dikkat", desc: "İki döngüyü izlerken sinyal anını yakala.", accent: "violet", icon: "orbit" },
  { id: 7, code: "SI-08", title: "Çeldirici Odak", skill: "Bilişsel Esneklik", desc: "Sözcüğü değil, mürekkep rengini yüksek hızda seç.", accent: "lime", icon: "focus" },
  { id: 8, code: "EN-09", title: "Yankı Pusulası", skill: "N-Back Bellek", desc: "Konum ve tonun geçmişteki yankısını karşılaştır.", accent: "amber", icon: "sound" },
  { id: 9, code: "NS-10", title: "Nöro-Sudoku", skill: "Akışkan Zekâ", desc: "4×4 matrisi mantık ve hızla tamamla.", accent: "rose", icon: "sudoku" },
] as const;

const stageMeta = [
  { name: "Isınma", sub: "Öğrenme fazı", time: 45, goal: 3 },
  { name: "Zaman Baskısı", sub: "Keskin odak", time: 25, goal: 5 },
  { name: "Zirve", sub: "Duyusal yoksunluk", time: 18, goal: 7 },
];

const iconPaths: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  cards: <><rect x="3" y="5" width="11" height="15" rx="2"/><path d="m9 5 3-2h7a2 2 0 0 1 2 2v11l-7 4"/></>,
  target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/></>,
  chain: <><path d="M10 13a4 4 0 0 0 5.7.1l2.4-2.4A4 4 0 0 0 12.4 5L11 6.4"/><path d="M14 11a4 4 0 0 0-5.7-.1l-2.4 2.4A4 4 0 0 0 11.6 19l1.4-1.4"/></>,
  route: <><path d="M4 19V7a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v10a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V5"/><circle cx="4" cy="20" r="2"/><circle cx="20" cy="4" r="2"/></>,
  shapes: <><circle cx="6" cy="7" r="3"/><rect x="14" y="4" width="6" height="6" rx="1"/><path d="m7 20 4-7 4 7Z"/></>,
  orbit: <><circle cx="12" cy="12" r="3"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/></>,
  focus: <><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/></>,
  sound: <><path d="M5 15H3a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2l5-4v14Z"/><path d="M15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/></>,
  sudoku: <><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18M7 3v9m10 0v9M3 7h9m0 10h9"/></>,
  arrow: <><path d="m5 12 14 0m-5-5 5 5-5 5"/></>,
  brain: <><path d="M9.5 4A3.5 3.5 0 0 0 6 7.5v1A3.5 3.5 0 0 0 5 15v.5A3.5 3.5 0 0 0 8.5 19H10V5.5A1.5 1.5 0 0 0 8.5 4"/><path d="M14.5 4A3.5 3.5 0 0 1 18 7.5v1a3.5 3.5 0 0 1 1 6.5v.5a3.5 3.5 0 0 1-3.5 3.5H14V5.5A1.5 1.5 0 0 1 15.5 4"/></>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{iconPaths[name]}</svg>;
}

function useStored<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try { const saved = localStorage.getItem(key); return saved ? JSON.parse(saved) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing may reject storage. */ } }, [key, value]);
  return [value, setValue] as const;
}

function initials(name:string){return name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]?.toLocaleUpperCase("tr-TR")).join("")||"SS"}
function Avatar({ profile, className="" }: { profile?:UserProfile;className?:string }) {
  const safeProfile=profile??DEFAULT_PROFILE;
  return <span className={`user-avatar ${className}`}>{safeProfile.avatar?<img src={safeProfile.avatar} alt=""/>:<b>{initials(safeProfile.name)}</b>}</span>
}

function BrainNetwork() {
  const nodes = [[188,69],[145,91],[228,93],[109,123],[170,127],[263,128],[86,164],[133,172],[210,166],[287,166],[107,209],[165,211],[244,210],[278,236],[145,249],[207,253],[113,283],[177,291],[231,286]];
  const edges = [[0,1],[0,2],[1,2],[1,3],[1,4],[2,4],[2,5],[3,4],[3,6],[3,7],[4,7],[4,8],[4,9],[5,8],[5,9],[6,7],[6,10],[7,8],[7,10],[7,11],[8,9],[8,11],[8,12],[9,12],[9,13],[10,11],[10,14],[11,12],[11,14],[11,15],[12,13],[12,15],[12,16],[13,15],[14,15],[14,16],[14,17],[15,17],[15,18],[16,17],[17,18]];
  return (
    <div className="brain-wrap" aria-label="Etkileşimli nöral ağ görselleştirmesi">
      <div className="brain-aura" />
      <svg className="brain-svg" viewBox="50 35 275 290" role="img">
        <defs>
          <radialGradient id="nodeGlow"><stop offset="0" stopColor="#fff"/><stop offset=".25" stopColor="#bffcff"/><stop offset="1" stopColor="#22d3ee"/></radialGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <clipPath id="brainClip"><path d="M184 55c-35-29-86 2-83 43-35 6-45 49-20 70-25 28-7 69 23 74-3 36 41 66 73 42 15 25 52 19 59-8 37 5 63-31 49-60 29-19 24-65-6-80 19-31-3-69-36-70 2-41-48-62-78-35-16-13-38-10-51 3Z"/></clipPath>
        </defs>
        <g clipPath="url(#brainClip)">
          {edges.map(([a,b], i) => <line key={i} className={`synapse edge-${i%4}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} />)}
          {nodes.map(([x,y],i) => <g key={i}><circle className="node-halo" cx={x} cy={y} r={i%4===0?11:7}/><circle className="brain-node" cx={x} cy={y} r={i%4===0?4:2.7}/></g>)}
        </g>
        <path className="brain-outline" d="M184 55c-35-29-86 2-83 43-35 6-45 49-20 70-25 28-7 69 23 74-3 36 41 66 73 42 15 25 52 19 59-8 37 5 63-31 49-60 29-19 24-65-6-80 19-31-3-69-36-70 2-41-48-62-78-35-16-13-38-10-51 3Z"/>
        <path className="brain-mid" d="M184 57c-17 20-10 42 2 51-17 15-13 37 0 48-17 18-13 43 0 55-17 15-16 46-9 72"/>
      </svg>
      <div className="brain-label label-a"><i /> Prefrontal korteks <b>89%</b></div>
      <div className="brain-label label-b"><i /> Motor korteks <b>76%</b></div>
      <div className="brain-label label-c"><i /> Hipokampus <b>92%</b></div>
    </div>
  );
}

function Header({ screen, setScreen, theme, setTheme, profile }: { screen: Screen; setScreen: (s: Screen)=>void; theme: Theme; setTheme:(t:Theme)=>void;profile?:UserProfile }) {
  const themes: Theme[] = ["black","slate","light"];
  const safeProfile=profile??DEFAULT_PROFILE;
  return (
    <header className="topbar">
      <button className="brand" onClick={() => setScreen("home")} aria-label="SYNAPSE ana sayfa">
        <span className="brand-mark"><Icon name="brain" size={22}/></span><span>SYNAPSE</span><small>NEURO LAB</small>
      </button>
      <nav className="main-nav" aria-label="Ana navigasyon">
        <button className={screen==="home"?"active":""} onClick={()=>setScreen("home")}>Ana Sayfa</button>
        <button className={screen==="hub"?"active":""} onClick={()=>setScreen("hub")}>Oyun Kütüphanesi</button>
        <button className={screen==="analysis"?"active":""} onClick={()=>setScreen("analysis")}>Nöro-Analiz</button>
        <button className={screen==="profile"?"active":""} onClick={()=>setScreen("profile")}>Profil</button>
      </nav>
      <div className="theme-switch" role="group" aria-label="Tema seçimi">
        {themes.map((t)=><button key={t} className={theme===t?"selected":""} onClick={()=>setTheme(t)} aria-label={`${t} tema`}><span /></button>)}
      </div>
      <button className="header-user" onClick={()=>setScreen("profile")}><Avatar profile={safeProfile}/><span><b>{safeProfile.name}</b><small>{safeProfile.role}</small></span></button>
    </header>
  );
}

function Landing({ begin }: { begin:()=>void }) {
  return (
    <main className="landing">
      <div className="ambient-grid" />
      <section className="hero-copy">
        <div className="eyebrow"><span className="pulse-dot"/> SİSTEM HAZIR · NPI 847</div>
        <p className="hero-kicker">BİLİŞSEL PERFORMANS PROTOKOLÜ</p>
        <h1>Zihninin sınırını<br/><em>yeniden tanımla.</em></h1>
        <p className="hero-desc">Nörobilim temelli egzersizlerle hafıza, dikkat ve motor kontrolünü tek bir adaptif protokolde geliştir.</p>
        <div className="hero-actions">
          <button className="primary-cta" onClick={begin}><span>Günlük Egzersizi Başlat</span><Icon name="arrow"/></button>
          <div className="daily-meta"><strong>12 DK</strong><span>Bugünkü protokol<br/>4 bilişsel parkur</span></div>
        </div>
        <div className="signal-row">
          <div><strong>24</strong><span>Günlük seri</span></div><i/>
          <div><strong>+18%</strong><span>Odak artışı</span></div><i/>
          <div><strong>847</strong><span>NPI skoru</span></div>
        </div>
      </section>
      <section className="brain-stage"><BrainNetwork/><div className="scan-status"><span>CANLI TARAMA</span><b>Sinaptik ağ stabil</b><div className="wave">⌁⌁⌁⌁⌁⌁</div></div></section>
      <div className="scroll-hint"><span/> KEŞFET</div>
    </main>
  );
}

const lobes = [
  { id:"all", name:"Tüm Ağ", detail:"10 protokol", games:games.map(g=>g.id) },
  { id:"prefrontal", name:"Prefrontal Korteks", detail:"Karar & Esneklik", games:[5,7,8] },
  { id:"motor", name:"Motor Korteks", detail:"Hareketsel Hassasiyet", games:[2,4] },
  { id:"parietal", name:"Parietal Lob", detail:"Mekânsal Algı", games:[0,6] },
  { id:"temporal", name:"Temporal Lob", detail:"Sözel & Dizisel Hafıza", games:[3] },
  { id:"occipital", name:"Oksipital Lob", detail:"Görsel İşleme", games:[1,9] },
];

function Dashboard({ startGame, streak, metrics, npi, profile }: { startGame:(id:number)=>void; streak:number; metrics:Record<number,GameMetric>;npi:number;profile:UserProfile }) {
  const [activeLobe,setActiveLobe]=useState("all");const lobe=lobes.find(item=>item.id===activeLobe)??lobes[0];const visible=games.filter(g=>lobe.games.includes(g.id));
  const [hour,setHour]=useState(()=>new Date().getHours());
  useEffect(()=>{const timer=setInterval(()=>setHour(new Date().getHours()),60_000);return()=>clearInterval(timer)},[]);
  const dayMessage=hour>=5&&hour<12
    ? { greeting:"Günaydın", advice:"Prefrontal korteks sabah saatlerinde plastisiteye daha açık. Güne karar ve inhibisyon protokolüyle başla." }
    : hour>=12&&hour<17
      ? { greeting:"Tünaydın", advice:"Gün ortası uyanıklığını işlem hızı ve bölünmüş dikkat çalışmasıyla keskinleştir." }
      : hour>=17&&hour<22
        ? { greeting:"İyi Akşamlar", advice:"Akşam nöro-plastisitesini kısa bir değerlendirme ve esneklik protokolüyle destekle." }
        : { greeting:"İyi Geceler", advice:"Hafıza konsolidasyonu için yükü azalt; kısa bir hatırlama turundan sonra dinlenmeye geç." };
  return (
    <main className="dashboard">
      <section className="dash-head">
        <div><div className="eyebrow"><span className="pulse-dot"/> NÖRAL MERKEZ ÇEVRİMİÇİ · {String(hour).padStart(2,"0")}:00</div><h1>{dayMessage.greeting}, <em>{profile.name.split(" ")[0]}!</em></h1><p>{dayMessage.advice}</p></div>
        <div className="readiness"><div className="ring"><strong>87</strong><span>HAZIRLIK</span></div><div><span>BUGÜNKÜ DURUM</span><b>Optimal performans</b><small>Uyku ve reaksiyon verilerine göre</small></div></div>
      </section>
      <section className="stat-strip">
        <div><span>NÖRAL PERFORMANS İNDEKSİ</span><strong>{npi}</strong><small>+12 bu hafta</small></div>
        <div><span>GÜNLÜK SERİ</span><strong>{streak}<small> gün</small></strong><small>Kişisel rekor: 31</small></div>
        <div><span>BUGÜNÜN ODAĞI</span><strong>Kontrol</strong><small>Motor + inhibisyon</small></div>
        <div className="mini-chart"><span>7 GÜNLÜK RİTİM</span><svg viewBox="0 0 180 55"><path d="M2 43 28 38 52 42 77 21 103 28 129 12 154 20 178 7"/><path className="fill" d="M2 43 28 38 52 42 77 21 103 28 129 12 154 20 178 7V55H2Z"/></svg></div>
      </section>
      <div className="library-title"><div><span>10 NÖRAL PROTOKOL</span><h2>Oyun Kütüphanesi</h2></div><div className="difficulty-key"><i/> Adaptif zorluk <b>AKTİF</b></div></div>
      <section className="lobe-engine">
        <div className="library-brain"><BrainNetwork/><div className="brain-rotation-ring"/><span>3D NÖRAL HARİTA · CANLI</span></div>
        <div className="lobe-controls"><div className="panel-label"><span>NÖRO-ANATOMİK FİLTRE</span><b>{visible.length} PROTOKOL</b></div>{lobes.map(item=><button className={activeLobe===item.id?"active":""} key={item.id} onClick={()=>setActiveLobe(item.id)}><i/><span><b>{item.name}</b><small>{item.detail}</small></span><em>{item.games.length}</em></button>)}</div>
      </section>
      <div className="active-filter"><span>AKTİF BÖLGE</span><b>{lobe.name}</b><small>{lobe.detail}</small></div>
      <section className="game-grid">
        {visible.map(g=>{const metric=metrics[g.id]??{completed:0,flawless:0,mistakes:0,highScore:0,played:0};return <article className={`game-card accent-${g.accent}`} key={g.id}>
          <div className="card-top"><span>{g.code}</span>{metric.highScore>0&&<b>EN İYİ {metric.highScore}</b>}</div>
          <div className="game-icon"><Icon name={g.icon} size={26}/><span className="orbit-dot"/></div>
          <div className="game-copy"><small>{g.skill}</small><h3>{g.title}</h3><p>{g.desc}</p></div>
          <div className="card-metrics"><span>{metric.completed} parkur</span><span>{metric.flawless} hatasız</span><span>{metric.played} oyun</span></div>
          <button onClick={()=>startGame(g.id)} aria-label={`${g.title} oyununu başlat`}><span>Protokolü aç</span><Icon name="arrow"/></button>
        </article>})}
      </section>
    </main>
  );
}

const domainMeta: { key: keyof CognitiveScores; label: string; note: string }[] = [
  { key:"memory", label:"Hafıza", note:"Hipokampal kodlama ve geri çağırma" },
  { key:"motor", label:"İnce Motor", note:"Serebellar hassasiyet ve tremor kontrolü" },
  { key:"divided", label:"Bölünmüş Dikkat", note:"Paralel uyaran izleme kapasitesi" },
  { key:"flexibility", label:"Bilişsel Esneklik", note:"Kural değişimi ve dürtü baskılama" },
  { key:"speed", label:"İşlem Hızı", note:"Uyaran–tepki sinyal gecikmesi" },
];

function getTier(npi:number) {
  if(npi<500)return {code:"T1",name:"Erken Sinaptik Aktivasyon",sub:"Synaptic Initiation",next:500,base:0};
  if(npi<=750)return {code:"T2",name:"Nöro-Plastisite Adaptasyonu",sub:"Neural Plasticity Optimization",next:751,base:500};
  return {code:"T3",name:"Hiper-Sinaptik Konsolidasyon",sub:"Advanced Neuro-Resilience",next:1000,base:751};
}

function NeuroAnalysis({ domains, npi }: { domains:CognitiveScores;npi:number }) {
  const tier=getTier(npi);const cx=150,cy=143,r=102;
  const axes=domainMeta.map((_,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;return [cx+Math.cos(a)*r,cy+Math.sin(a)*r]});
  const points=domainMeta.map((d,i)=>{const a=-Math.PI/2+i*Math.PI*2/5;const rr=r*domains[d.key]/100;return `${cx+Math.cos(a)*rr},${cy+Math.sin(a)*rr}`}).join(" ");
  const level=Math.max(1,Math.floor((npi-300)/90)+1);
  return <main className="insight-page">
    <section className="insight-head"><div><div className="eyebrow"><span className="pulse-dot"/> CANLI NÖRO-METRİK MODEL</div><h1>Nöro-<em>Analiz</em></h1><p>Beş bilişsel alanın adaptif protokollerden elde edilen sinyal haritası.</p></div><div className="npi-hero"><span>NÖRAL PERFORMANS İNDEKSİ</span><strong>{npi}</strong><small>{tier.code} · SEVİYE {level}</small></div></section>
    <section className="analysis-grid">
      <article className="radar-panel"><div className="panel-label"><span>BİLİŞSEL RADAR</span><b>SON 30 GÜN</b></div><svg className="radar" viewBox="0 0 300 286" role="img" aria-label="Beş bilişsel alan radar grafiği">
        {[.25,.5,.75,1].map(scale=><polygon key={scale} points={axes.map(([x,y])=>`${cx+(x-cx)*scale},${cy+(y-cy)*scale}`).join(" ")}/>)}
        {axes.map(([x,y],i)=><line key={i} x1={cx} y1={cy} x2={x} y2={y}/>)}
        <polygon className="radar-value" points={points}/>{domainMeta.map((d,i)=><text key={d.key} x={axes[i][0]} y={axes[i][1]+(i===0?-10:16)} textAnchor={i===1||i===2?"start":i===3||i===4?"end":"middle"}>{d.label.toUpperCase()}</text>)}
      </svg><div className="radar-foot"><span><i/> SENİN PROFİLİN</span><span>POPÜLASYON ORT. 68</span></div></article>
      <article className="domain-panel"><div className="panel-label"><span>ALAN DAĞILIMI</span><b>ADAPTİF</b></div>{domainMeta.map(d=><div className="domain-row" key={d.key}><div><strong>{d.label}</strong><small>{d.note}</small></div><b>{domains[d.key]}</b><span><i style={{width:`${domains[d.key]}%`}}/></span></div>)}</article>
    </section>
    <section className="tier-section"><div className="tier-current"><span className="tier-code">{tier.code}</span><div><small>AKTİF NÖROBİLİM SEVİYESİ</small><h2>{tier.name}</h2><p>{tier.sub}</p></div><div className="tier-progress"><span>{npi} / {tier.next} NPI</span><i><b style={{width:`${Math.min(100,((npi-tier.base)/(tier.next-tier.base))*100)}%`}}/></i></div></div>
      <div className="tier-cards">
        <div className={tier.code==="T1"?"active":""}><span>T1</span><b>Erken Sinaptik Aktivasyon</b><p>Bazal sinaptik yollar ve motor hazırlama.</p></div>
        <div className={tier.code==="T2"?"active":""}><span>T2</span><b>Nöro-Plastisite Adaptasyonu</b><p>Aksonal miyelinasyon ve bilişsel esneklik.</p></div>
        <div className={tier.code==="T3"?"active":""}><span>T3</span><b>Hiper-Sinaptik Konsolidasyon</b><p>Ekstrem yükte prefrontal kontrol, Calculus I & II.</p></div>
      </div>
    </section>
  </main>
}

function formatTime(seconds:number){return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`}

function Profile({ stats, streak, profile, onEdit }: { stats:AggregateStats;streak:number;profile:UserProfile;onEdit:()=>void }) {
  const level=Math.max(1,Math.floor(stats.totalStages/8)+1);const stageInLevel=stats.totalStages%8;const tier=getTier(stats.bestNpi);
  const cards=[
    ["GÜNLÜK GEÇİRİLEN SÜRE",formatTime(stats.dailySeconds),"CANLI OTURUM","cyan"],
    ["TAMAMLANAN PARKUR",String(stats.totalStages),"TÜM ZAMANLAR","violet"],
    ["YAPILAN HATA",String(stats.errors),stats.errors===0?"TEMİZ SİNYAL":"GELİŞİM VERİSİ","rose"],
    ["HATASIZ PARKUR",String(stats.flawless),"SIFIR HATA","lime"],
    ["TOPLAM OYUN",String(stats.played),"BAŞLATILAN PROTOKOL","violet"],
    ["EN YÜKSEK OYUN SKORU",String(stats.bestGameScore),"TÜM PROTOKOLLER","lime"],
    ["EN YÜKSEK NPI",String(stats.bestNpi),tier.code+" PROTOKOLÜ","amber"],
    ["HEDEF NPI",String(profile.targetNpi),`${Math.max(0,profile.targetNpi-stats.bestNpi)} PUAN KALDI`,"cyan"],
  ];
  return <main className="insight-page profile-page">
    <section className="profile-identity"><div className="avatar"><Avatar profile={profile}/><i/></div><div><div className="eyebrow"><span className="pulse-dot"/> BİYOMETRİK PROFİL AKTİF</div><h1>{profile.name.split(" ")[0]} <em>{profile.name.split(" ").slice(1).join(" ")}</em></h1><p>{profile.role} · {streak} günlük sinaptik seri</p></div><button onClick={onEdit}>PROFİLİ DÜZENLE</button></section>
    <section className="level-card"><div className="level-badge"><span>{level}</span><small>SEVİYE</small></div><div className="level-copy"><span>{tier.code} OPERATÖR · {tier.name.toUpperCase()}</span><h2>Bir sonraki nöral seviyeye ilerleme</h2><div><i><b style={{width:`${(stageInLevel/8)*100}%`}}/></i><strong>{stageInLevel * 125} / 1000 XP</strong></div><p>{8-stageInLevel} parkur sonra yeni kalibrasyon protokolü açılacak.</p></div><div className="streak-seal"><strong>{streak}</strong><span>GÜN<br/>SERİ</span></div></section>
    <div className="section-kicker">PERFORMANS KAYDI · GERÇEK ZAMANLI</div>
    <section className="profile-stats">{cards.map(c=><article className={`profile-stat stat-${c[3]}`} key={c[0]}><span>{c[0]}</span><strong>{c[1]}</strong><small><i/>{c[2]}</small></article>)}</section>
    <section className="profile-bottom"><article><div className="panel-label"><span>SON BAŞARILAR</span><b>2 ROZET</b></div><div className="badge-list"><div><i><Icon name="brain"/></i><span><b>İlk Sinaps</b>İlk protokol tamamlandı</span></div><div><i><Icon name="target"/></i><span><b>Hassas Operatör</b>Hatasız parkur serisi</span></div></div></article><article><div className="panel-label"><span>GÜNLÜK RİTİM</span><b>AKTİF</b></div><div className="profile-rhythm"><strong>{formatTime(stats.dailySeconds)}</strong><span>BUGÜNKÜ AKTİF SÜRE</span><div>{Array.from({length:12},(_,i)=><i className={i<Math.min(12,Math.ceil(stats.dailySeconds/60))?"on":""} key={i}/>)}</div></div></article></section>
  </main>
}

function ProfileEditModal({ profile, update, close }: { profile:UserProfile;update:(p:UserProfile)=>void;close:()=>void }) {
  const [draft,setDraft]=useState(profile);const fileRef=useRef<HTMLInputElement>(null);const original=useRef(profile);
  const apply=(next:UserProfile)=>{setDraft(next);update(next)};
  const upload=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;if(file.size>2_000_000){alert("Avatar dosyası 2 MB altında olmalı.");return}const reader=new FileReader();reader.onload=()=>apply({...draft,avatar:String(reader.result)});reader.readAsDataURL(file)};
  const submit=(e:React.FormEvent)=>{e.preventDefault();const name=draft.name.trim();if(!name)return;apply({...draft,name,targetNpi:Math.max(300,Math.min(1200,Number(draft.targetNpi)||900))});close()};
  const cancel=()=>{update(original.current);close()};
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title"><form className="profile-modal" onSubmit={submit}><div className="modal-head"><div><span>KİMLİK KALİBRASYONU</span><h2 id="profile-modal-title">Profili Düzenle</h2></div><button type="button" onClick={close} aria-label="Kapat"><Icon name="close"/></button></div>
    <div className="avatar-editor"><Avatar profile={draft} className="avatar-preview"/><div><button type="button" onClick={()=>fileRef.current?.click()}>AVATAR YÜKLE</button>{draft.avatar&&<button type="button" onClick={()=>apply({...draft,avatar:""})}>KALDIR</button>}<input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={upload}/><small>PNG, JPG veya WEBP · En fazla 2 MB</small></div></div>
    <label><span>KULLANICI ADI</span><input value={draft.name} maxLength={40} onChange={e=>apply({...draft,name:e.target.value})}/></label>
    <label><span>ÜNVAN / ROL</span><input value={draft.role} maxLength={70} onChange={e=>apply({...draft,role:e.target.value})}/></label>
    <label><span>HEDEF NPI</span><input type="number" min="300" max="1200" value={draft.targetNpi} onChange={e=>apply({...draft,targetNpi:Number(e.target.value)})}/><small>Önerilen ileri seviye hedef: 900+</small></label>
    <div className="modal-actions"><button type="button" onClick={cancel}>VAZGEÇ</button><button type="submit">DEĞİŞİKLİKLERİ KAYDET <Icon name="arrow"/></button></div>
  </form></div>
}

function MatrixGame({ level, onWin, onFail }: GameProps) {
  const size = 3;
  const targets = useMemo(()=>Array.from({length:level+3},(_,i)=>(i*4+level*2)%(size*size)),[level]);
  const [show,setShow]=useState(true); const [picked,setPicked]=useState<number[]>([]);
  useEffect(()=>{const t=setTimeout(()=>setShow(false),level===0?2200:1400-level*250);return()=>clearTimeout(t)},[level]);
  const pick=(i:number)=>{if(show||picked.includes(i))return;if(!targets.includes(i)){onFail("Hatalı hücre seçildi. Nöral örüntü eşleşmedi.");return} const next=[...picked,i];setPicked(next);if(next.length===targets.length)setTimeout(onWin,180)};
  useEffect(()=>{const handle=(e:KeyboardEvent)=>{if(!show&&/^[1-9]$/.test(e.key))pick(Number(e.key)-1)};window.addEventListener("keydown",handle);return()=>window.removeEventListener("keydown",handle)},[show,picked,targets]);
  return <div className="matrix-zone"><p>{show?"Örüntüyü kodla":"Hücreye dokun veya klavye / numpad 1–9 kullan"}</p><div className={`matrix size-${size}`}>{Array.from({length:size*size},(_,i)=><button key={i} className={(show&&targets.includes(i))||picked.includes(i)?"lit":""} onClick={()=>pick(i)} aria-label={`Matris hücresi ${i+1}`}><span>{i+1}</span></button>)}</div>{!show&&<div className="matrix-key-readout"><span>KLAVYE / NUMPAD</span><div>{Array.from({length:9},(_,i)=><kbd className={picked.includes(i)?"active":""} key={i}>{i+1}</kbd>)}</div></div>}{!show&&level===2&&<div className="blackout-veil"/>}</div>
}

function CardsGame({ level, onWin, onFail }: GameProps) {
  const pairs=level+2; const deck=useMemo(()=>{const source=Array.from({length:pairs},(_,i)=>i).flatMap(i=>[i,i]);let shuffled=[...source],attempt=0;do{shuffled=[...source];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}attempt++}while(shuffled.some((v,i)=>i>0&&v===shuffled[i-1])&&attempt<100);if(shuffled.some((v,i)=>i>0&&v===shuffled[i-1]))shuffled=[...Array.from({length:pairs},(_,i)=>i),...Array.from({length:pairs},(_,i)=>i)];return shuffled},[pairs,level]);
  const [open,setOpen]=useState<number[]>([]); const [done,setDone]=useState<number[]>([]); const [black,setBlack]=useState(false);const timers=useRef<number[]>([]);
  useEffect(()=>()=>timers.current.forEach(timer=>window.clearTimeout(timer)),[]);
  const flip=(i:number)=>{if(open.includes(i)||done.includes(i)||black||open.length>=2)return;const n=[...open,i];setOpen(n);if(n.length!==2)return;
    if(deck[n[0]]!==deck[n[1]]){setBlack(true);timers.current.push(window.setTimeout(()=>{setBlack(false);onFail("Eşleşmeyen kart açıldı. 1,5 saniyelik OLED karartma sonrası görsel bellek zinciri kesildi.")},1500));return}
    timers.current.push(window.setTimeout(()=>{const d=[...done,...n];setDone(d);setOpen([]);if(d.length===deck.length)onWin()},220));
  };
  return <div className="cards-zone"><p>Eşleri bul · yanlış eşleşme 1,5 sn OLED karartma uygular</p><div className="card-deck">{deck.map((v,i)=><button key={i} className={open.includes(i)||done.includes(i)?"open":""} onClick={()=>flip(i)}><span>{String.fromCharCode(65+v)}</span></button>)}</div>{black&&<div className="blackout"><span>OLED KARARTMA · 1.5 SANİYE</span></div>}</div>
}

function MotorGame({ level, onWin, onFail }: GameProps) {
  const [hit,setHit]=useState(0); const area=useRef<HTMLDivElement>(null);
  const positions=[[22,26],[67,61],[43,76],[78,31],[18,68],[55,44],[82,75]];
  const target=positions[(hit+level)%positions.length];
  const click=(e:React.MouseEvent)=>{if((e.target as HTMLElement).dataset.target){const n=hit+1;setHit(n);if(n>=level+3)onWin()}else onFail("Hedef dışı temas algılandı. Hassasiyet toleransı aşıldı.")};
  return <div className="motor-zone"><p>Mikro hedefi kavra · hedef dışına temas etme</p><div ref={area} className="motor-field" onClick={click}><div className="motor-path"/><button data-target="true" className="micro-target" style={{left:`${target[0]}%`,top:`${target[1]}%`}}><span/></button><div className="tremor"><b>{(1.8-level*.3).toFixed(1)}%</b><span>TİTREME</span></div></div></div>
}

function ChainGame({ level, onWin, onFail }: GameProps) {
  const sets=[["Kuzey","∂x² = 2x","Liman"],["Sedir","∫2x dx = x²","Yörünge"],["Atom","d/dx sin x = cos x","Prizma"]];
  const seq=sets[level]; const [phase,setPhase]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setPhase(1),2200-level*350);return()=>clearTimeout(t)},[level]);
  const options=[seq[2],level===2?"∫x dx = x":"Vadi","Delta"];
  return <div className="chain-zone"><p>{phase===0?"Zinciri soldan sağa kodla":"Zincirin son halkasını seç"}</p>{phase===0?<div className="sequence">{seq.map((x,i)=><span key={x}><i>{i+1}</i>{x}</span>)}</div>:<div className="choice-list">{options.map(x=><button key={x} onClick={()=>x===seq[2]?onWin():onFail(`Yanlış halka seçildi: “${x}”. Beklenen sıra bozuldu.`)}>{x}</button>)}</div>}</div>
}

function MazeGame({ level, onWin, onFail }: GameProps) {
  const canvas=useRef<HTMLCanvasElement>(null);const pathRef=useRef<Path2D|null>(null);const active=useRef(false);const moved=useRef(false);const finished=useRef(false);const laserA=useRef<HTMLDivElement>(null);const laserB=useRef<HTMLDivElement>(null);
  useEffect(()=>{const c=canvas.current;if(!c)return;const ctx=c.getContext("2d");if(!ctx)return;c.width=c.clientWidth;c.height=c.clientHeight;ctx.setTransform(1,0,0,1,0,0);const w=c.width,h=c.height;ctx.clearRect(0,0,w,h);const path=new Path2D();path.moveTo(35,h-38);path.bezierCurveTo(w*.24,h*.82,w*.18,h*.25,w*.43,h*.32);path.bezierCurveTo(w*.67,h*.4,w*.62,h*.82,w-38,40);pathRef.current=path;ctx.lineCap="round";ctx.strokeStyle="rgba(125,145,160,.2)";ctx.lineWidth=64-level*5;ctx.stroke(path);ctx.strokeStyle="#56e6e6";ctx.lineWidth=2;ctx.setLineDash([7,9]);ctx.stroke(path);ctx.setLineDash([]);ctx.beginPath();ctx.arc(35,h-38,12,0,Math.PI*2);ctx.fillStyle="#a3e635";ctx.shadowColor="#a3e635";ctx.shadowBlur=15;ctx.fill();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(w-38,40,8,0,Math.PI*2);ctx.strokeStyle="#56e6e6";ctx.stroke();},[level]);
  const move=(e:React.PointerEvent<HTMLCanvasElement>)=>{if(!active.current||!pathRef.current)return;const c=e.currentTarget,rect=c.getBoundingClientRect(),ctx=c.getContext("2d");if(!ctx)return;const x=(e.clientX-rect.left)*(c.width/rect.width),y=(e.clientY-rect.top)*(c.height/rect.height);if(Math.hypot(x-35,y-(c.height-38))>10)moved.current=true;ctx.lineWidth=64-level*5;const laserHit=moved.current&&[laserA.current,laserB.current].some(el=>{if(!el)return false;const lr=el.getBoundingClientRect();return e.clientX>=lr.left-7&&e.clientX<=lr.right+7&&e.clientY>=lr.top-7&&e.clientY<=lr.bottom+7});if(laserHit){active.current=false;onFail("Hareketli lazer distraktörüne temas edildi.");return}if(!ctx.isPointInStroke(pathRef.current,x,y)){active.current=false;onFail("İmleç sinir yolunun duvarına temas etti.");return}if(x>c.width-72&&y<88){active.current=false;finished.current=true;onWin()}};
  const begin=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();const x=(e.clientX-r.left)*(e.currentTarget.width/r.width),y=(e.clientY-r.top)*(e.currentTarget.height/r.height);if(Math.hypot(x-35,y-(e.currentTarget.height-38))>24)return;finished.current=false;moved.current=false;active.current=true;e.currentTarget.setPointerCapture(e.pointerId)};
  return <div className="maze-zone"><p>Başlangıç noktasına basılı tut · duvar ve hareketli lazerlerden kaçın</p><div className="maze-canvas-wrap"><canvas ref={canvas} onPointerDown={begin} onPointerMove={move} onPointerUp={()=>{if(active.current){active.current=false;if(moved.current&&!finished.current)onFail("Parkur tamamlanmadan temas kesildi.")}}}/>{level>0&&<div ref={laserA} className="maze-laser laser-a"/>}{level===2&&<div ref={laserB} className="maze-laser laser-b"/>}</div><span className="maze-start">BAŞLA</span><span className="maze-end">SON</span></div>
}

function InhibitGame({ level, onWin, onFail }: GameProps) {
  const shapes=["●","■","▲","★"]; const order=[0,1,3,2,0,3,1,2]; const [round,setRound]=useState(0); const shape=shapes[order[(round+level)%order.length]]; const acted=useRef(false); const goal=level+4;
  useEffect(()=>{acted.current=false;const t=setTimeout(()=>{if(shape!=="★"&&!acted.current)onFail("Normal şekle zamanında tepki verilmedi.");else if(round+1>=goal)onWin();else setRound(r=>r+1)},1100-level*220);return()=>clearTimeout(t)},[round,level,shape,goal]);
  const tap=()=>{if(shape==="★"){onFail("Yıldız sinyalinde dürtü baskılanamadı.")}else if(!acted.current){acted.current=true}};
  return <div className="inhibit-zone"><p>Şekle dokun · yıldızda hiçbir şey yapma</p><button className={shape==="★"?"star":""} onClick={tap}>{shape}</button><div className="round-dots">{Array.from({length:goal},(_,i)=><i className={i<round?"done":""} key={i}/>)}</div></div>
}

function OrbitGame({ level, onWin, onFail }: GameProps) {
  const [round,setRound]=useState(0);const signal=round%3===2;const goal=level+4;const acted=useRef(false);
  useEffect(()=>{acted.current=false;const t=setTimeout(()=>{if(signal&&!acted.current)onFail("Yörünge sinyali kaçırıldı.");else if(!signal&&acted.current)onFail("Sinyal olmayan anda tepki verildi.");else if(round+1>=goal)onWin();else setRound(r=>r+1)},1000-level*160);return()=>clearTimeout(t)},[round,signal,goal,level]);
  return <div className="orbit-zone"><p>Çekirdek parladığında sinyali yakala</p><div className={`orbit-system ${signal?"signal":""}`}><i/><i/><span/></div><button onClick={()=>{if(acted.current)return;acted.current=true;if(!signal)onFail("Erken tepki: çekirdek sinyali aktif değildi.")}}>SİNYALİ YAKALA</button></div>
}

function StroopGame({ level, onWin, onFail }: GameProps) {
  const colors=[{n:"MAVİ",c:"blue"},{n:"YEŞİL",c:"green"},{n:"KIRMIZI",c:"red"},{n:"SARI",c:"yellow"}];const [round,setRound]=useState(0);const ink=(round*3+level)%4;const word=(round+1)%4;
  const choose=(i:number)=>{const correct=level===2?word:ink;if(i!==correct)onFail(level===2?"Ters mantık kuralı ihlal edildi: sözcük seçilmeliydi.":"Mürekkep rengi yerine sözcük okundu.");else if(round>=level+2)onWin();else setRound(r=>r+1)};
  return <div className="stroop-zone"><p>{level===2?"TERS KURAL: Bu kez sözcüğü seç":"Sözcüğü değil mürekkep rengini seç"}</p><strong className={`ink-${colors[ink].c}`}>{colors[word].n}</strong><div>{colors.map((c,i)=><button key={c.n} onClick={()=>choose(i)}>{c.n}</button>)}</div></div>
}

function NBackGame({ level, onWin, onFail }: GameProps) {
  const n=level===0?1:2;const sequence=[{p:0,t:0},{p:2,t:1},{p:0,t:0},{p:2,t:0},{p:1,t:1},{p:2,t:1},{p:1,t:0},{p:3,t:1},{p:1,t:1}];const [idx,setIdx]=useState(n);const current=sequence[idx],past=sequence[idx-n];const pos=current.p===past.p,tone=current.t===past.t;
  const answer=(choice:"pos"|"tone"|"both"|"none")=>{const correct=pos&&tone?"both":pos?"pos":tone?"tone":"none";if(choice!==correct){onFail(`${n}-Back uzamsal/tonal eşleşmesi hatalı. Beklenen: ${correct==="both"?"iki sinyal":correct==="pos"?"konum":correct==="tone"?"ton":"hiçbiri"}.`);return}if(idx>=n+level+3)onWin();else setIdx(i=>i+1)};
  return <div className="nback-zone"><p>{n}-BACK · Konum ve tonu {n} adım önceki sinyalle karşılaştır</p><div className="tone-readout"><i className={current.t===0?"low":"high"}/><span>{current.t===0?"DÜŞÜK TON · 220 Hz":"YÜKSEK TON · 440 Hz"}</span></div><div className="compass">{[0,1,2,3].map(i=><i key={i} className={i===current.p?"active":""}/>)}</div><div className="nback-actions"><button onClick={()=>answer("pos")}>KONUM AYNI</button><button onClick={()=>answer("tone")}>TON AYNI</button><button onClick={()=>answer("both")}>İKİSİ DE</button><button onClick={()=>answer("none")}>HİÇBİRİ</button></div></div>
}

function SudokuGame({ level, onWin, onFail }: GameProps) {
  const solution=[1,2,3,4,3,4,1,2,2,1,4,3,4,3,2,1];const blanks=level===0?[1,6,11]:level===1?[0,3,5,8,14]:[0,2,5,7,8,11,13];
  const [values,setValues]=useState<(number|null)[]>(solution.map((v,i)=>blanks.includes(i)?null:v));const [selected,setSelected]=useState(blanks[0]);
  const set=(n:number)=>{if(solution[selected]!==n){onFail(`${n} değeri bu satır/sütun kısıtını ihlal ediyor.`);return}const v=[...values];v[selected]=n;setValues(v);const next=blanks.find(i=>v[i]===null);if(next===undefined)onWin();else setSelected(next)};
  return <div className="sudoku-zone"><p>Seçili hücreyi 1–4 mantığıyla tamamla</p><div className="sudoku">{values.map((v,i)=><button key={i} className={selected===i?"selected":""} disabled={!blanks.includes(i)||v!==null} onClick={()=>setSelected(i)}>{v}</button>)}</div><div className="num-pad">{[1,2,3,4].map(n=><button key={n} onClick={()=>set(n)}>{n}</button>)}</div></div>
}

type GameProps={level:number;onWin:()=>void;onFail:(reason:string)=>void};
const gameComponents=[MatrixGame,CardsGame,MotorGame,ChainGame,MazeGame,InhibitGame,OrbitGame,StroopGame,NBackGame,SudokuGame];

function GameRunner({ gameId, exit, complete, recordFailure, recordStage }: { gameId:number;exit:()=>void;complete:(score:number)=>void;recordFailure:()=>void;recordStage:(flawless:boolean)=>void }) {
  const [stage,setStage]=useState(0);const [runKey,setRunKey]=useState(0);const [time,setTime]=useState(stageMeta[0].time);const [failure,setFailure]=useState<Failure>(null);const [points,setPoints]=useState(0);
  const failureLock=useRef(false);const stageClean=useRef(true);
  const meta=stageMeta[stage]; const Game=gameComponents[gameId]; const game=games[gameId];
  const fail=useCallback((reason:string)=>{if(failureLock.current)return;failureLock.current=true;stageClean.current=false;recordFailure();setFailure({title:"GÖREV BAŞARISIZ!",reason})},[recordFailure]);
  useEffect(()=>{if(failure)return;const timer=setInterval(()=>setTime(t=>{if(t<=1){clearInterval(timer);fail("Süre doldu. Parkur zaman penceresi içinde tamamlanamadı.");return 0}return t-1}),1000);return()=>clearInterval(timer)},[stage,runKey,failure,fail]);
  const win=()=>{const earned=Math.round(300+(time/meta.time)*700+stage*250);recordStage(stageClean.current);setPoints(p=>p+earned);if(stage===2)complete(points+earned);else{stageClean.current=true;failureLock.current=false;setStage(s=>s+1);setTime(stageMeta[stage+1].time);setRunKey(k=>k+1)}};
  const restart=()=>{failureLock.current=false;setFailure(null);setTime(meta.time);setRunKey(k=>k+1)};
  return <main className={`runner ${stage===2?"extreme":""}`}>
    <div className="runner-head"><button className="icon-button" onClick={exit} aria-label="Oyundan çık"><Icon name="close"/></button><div><span>{game.code} · {game.skill}</span><h1>{game.title}</h1></div><div className="timer"><span>KALAN SÜRE</span><strong>00:{String(time).padStart(2,"0")}</strong></div></div>
    <div className="stage-rail">{stageMeta.map((s,i)=><div className={i<stage?"passed":i===stage?"current":""} key={s.name}><i>{i<stage?"✓":i+1}</i><span><b>PARKUR {i+1}</b>{s.name}</span></div>)}</div>
    <section className="game-shell"><div className="game-status"><span>PROTOKOL {stage+1}/3</span><b>{meta.name}</b><small>{meta.sub} · Hata toleransı: 0</small></div><div className="progress-line"><i style={{width:`${(time/meta.time)*100}%`}}/></div><Game key={`${stage}-${runKey}`} level={stage} onWin={win} onFail={fail}/></section>
    <div className="runner-foot"><span><i/> BİYOMETRİK TAKİP AKTİF</span><b>SKOR {points}</b><span>ESC · ÇIKIŞ</span></div>
    {failure&&<div className="modal-backdrop" role="dialog" aria-modal="true"><div className="fail-modal"><div className="fail-symbol">×</div><span>PROTOKOL KESİNTİSİ · P{stage+1}</span><h2>{failure.title}</h2><p>{failure.reason}</p><div className="failure-data"><div><span>PARKUR</span><b>{stage+1} · {meta.name}</b></div><div><span>KALAN SÜRE</span><b>00:{String(time).padStart(2,"0")}</b></div></div><button className="primary-cta" onClick={restart}>Parkuru Baştan Başlat <Icon name="arrow"/></button><button className="text-button" onClick={exit}><Icon name="home"/> Ana Menüye Dön</button></div></div>}
  </main>
}

export default function App() {
  const [theme,setTheme]=useStored<Theme>("synapse-theme","black");const [screen,setScreen]=useState<Screen>("home");const [gameId,setGameId]=useState(0);const [warp,setWarp]=useState(false);const [editingProfile,setEditingProfile]=useState(false);
  const [streak,setStreak]=useStored("synapse-streak",24);const [domains,setDomains]=useStored<CognitiveScores>("synapse-npi-v2",{memory:82,motor:76,divided:74,flexibility:88,speed:81});const [,setBadges]=useStored<string[]>("synapse-badges",[]);
  const [storedProfile,setStoredProfile]=useStored<Partial<UserProfile>|null>("synapse-profile",DEFAULT_PROFILE);
  const profile=useMemo<UserProfile>(()=>({name:typeof storedProfile?.name==="string"&&storedProfile.name.trim()?storedProfile.name:DEFAULT_PROFILE.name,role:typeof storedProfile?.role==="string"&&storedProfile.role.trim()?storedProfile.role:DEFAULT_PROFILE.role,targetNpi:Number.isFinite(storedProfile?.targetNpi)?Number(storedProfile?.targetNpi):DEFAULT_PROFILE.targetNpi,avatar:typeof storedProfile?.avatar==="string"?storedProfile.avatar:""}),[storedProfile]);
  const today=new Date().toISOString().slice(0,10);const defaultGames=useMemo(()=>Object.fromEntries(games.map(g=>[g.id,{completed:0,flawless:0,mistakes:0,highScore:0,played:0}])) as Record<number,GameMetric>,[]);
  const [stats,setStats]=useStored<UnifiedStats>("synapse-unified-stats",{date:today,dailySeconds:0,npi:847,games:defaultGames});
  const aggregate=useMemo<AggregateStats>(()=>{const values=Object.values(stats.games);return {dailySeconds:stats.dailySeconds,totalStages:values.reduce((n,g)=>n+g.completed,0),errors:values.reduce((n,g)=>n+g.mistakes,0),flawless:values.reduce((n,g)=>n+g.flawless,0),played:values.reduce((n,g)=>n+g.played,0),bestGameScore:Math.max(0,...values.map(g=>g.highScore)),bestNpi:stats.npi}},[stats]);
  const goHub=()=>{setWarp(true);setTimeout(()=>{setScreen("hub");setWarp(false)},850)};
  const startGame=(id:number)=>{setStats(s=>{const metric=s.games[id]??defaultGames[id];return {...s,games:{...s.games,[id]:{...metric,played:metric.played+1}}}});setGameId(id);setScreen("game")};
  const recordFailure=useCallback(()=>setStats(s=>{const metric=s.games[gameId]??defaultGames[gameId];return {...s,games:{...s.games,[gameId]:{...metric,mistakes:metric.mistakes+1}}}}),[setStats,gameId,defaultGames]);
  const recordStage=useCallback((flawless:boolean)=>setStats(s=>{const metric=s.games[gameId]??defaultGames[gameId];return {...s,games:{...s.games,[gameId]:{...metric,completed:metric.completed+1,flawless:metric.flawless+(flawless?1:0)}}}}),[setStats,gameId,defaultGames]);
  const completed=(score:number)=>{const domainMap:(keyof CognitiveScores)[]=["memory","memory","motor","memory","motor","flexibility","divided","flexibility","memory","speed"];const key=domainMap[gameId];setDomains(r=>({...r,[key]:Math.min(100,r[key]+2),speed:Math.min(100,r.speed+1)}));setStats(s=>{const metric=s.games[gameId]??defaultGames[gameId];return {...s,npi:Math.min(999,s.npi+Math.max(2,Math.round(score/900))),games:{...s.games,[gameId]:{...metric,highScore:Math.max(metric.highScore,score)}}}});setBadges(b=>b.includes("first-protocol")?b:[...b,"first-protocol"]);setStreak(s=>Math.max(s,24));setScreen("hub")};
  useEffect(()=>{document.documentElement.dataset.theme=theme},[theme]);
  useEffect(()=>{if(stats.date!==today)setStats(s=>({...s,date:today,dailySeconds:0}))},[stats.date,today,setStats]);
  useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==="visible")setStats(s=>({...s,dailySeconds:s.dailySeconds+1}))},1000);return()=>clearInterval(timer)},[setStats]);
  useEffect(()=>{const fn=(e:KeyboardEvent)=>{if(e.key==="Escape"&&screen==="game")setScreen("hub")};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn)},[screen]);
  return <div className="app-shell">{screen!=="game"&&<Header screen={screen} setScreen={setScreen} theme={theme} setTheme={setTheme} profile={profile}/>} {screen==="home"?<Landing begin={goHub}/>:screen==="hub"?<Dashboard startGame={startGame} streak={streak} metrics={stats.games} npi={stats.npi} profile={profile}/>:screen==="analysis"?<NeuroAnalysis domains={domains} npi={stats.npi}/>:screen==="profile"?<Profile stats={aggregate} streak={streak} profile={profile} onEdit={()=>setEditingProfile(true)}/>:<GameRunner gameId={gameId} exit={()=>setScreen("hub")} complete={completed} recordFailure={recordFailure} recordStage={recordStage}/>} {warp&&<div className="brain-warp"><div/><span>SİNAPS BAĞLANTISI KURULUYOR</span></div>}{editingProfile&&<ProfileEditModal profile={profile} close={()=>setEditingProfile(false)} update={next=>setStoredProfile(next)}/>}</div>;
}
