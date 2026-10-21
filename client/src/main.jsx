import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, ArrowUpRight, BookOpenText, CalendarDays, Check, ChevronRight,
  Clock3, Heart, Info, LayoutGrid, LoaderCircle, LogOut, MapPin, Menu, Moon,
  Orbit, Plus, Search, Settings2, ShieldCheck, Sparkles, Sun, Trash2, UserRound, X
} from 'lucide-react';
import { api } from './api';
import { authClient } from './auth-client';
import GurlPage from './gurl/GurlPage.jsx';
import './styles.css';

const navItems = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'kaiser', label: 'Kaiser Experience', icon: Sparkles },
  { id: 'my-chart', label: 'My birth chart', icon: Orbit },
  { id: 'new-reading', label: 'New reading', icon: Plus },
  { id: 'history', label: 'Reading history', icon: BookOpenText },
  { id: 'account', label: 'Account', icon: Settings2 },
];
const SIGN_ICONS = { sun: Sun, moon: Moon, rising: ArrowUpRight };
function Logo() { return <span className="logo">gurl<span className="logo-dot">.</span></span>; }
function IconCircle({ children, subtle = false }) { return <span className={'icon-circle ' + (subtle ? 'subtle' : '')}>{children}</span>; }
function SectionHeading({ kicker, title, description, action }) { return <div className="section-heading"><div><div className="eyebrow">{kicker}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>; }
function TextField({ label, hint, ...props }) { return <label className="field"><span className="field-label">{label}</span><input {...props}/>{hint && <small className="hint">{hint}</small>}</label>; }
function Notice({ children, kind = 'error', onClose }) { return <div className={`notice ${kind}`} role="status"><span>{children}</span>{onClose && <button type="button" className="icon-btn" onClick={onClose} aria-label="Dismiss"><X size={16}/></button>}</div>; }
function PageLoading() { return <div className="page-loading"><LoaderCircle className="spin" size={26}/><span>Checking the stars...</span></div>; }
function formatDate(date) { if (!date) return '—'; const d = new Date(`${date.slice(0,10)}T12:00:00`); return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }
function dateTime(value) { return value ? new Date(value).toLocaleDateString('en-US', { month:'short',day:'numeric',year:'numeric' }) : ''; }

function AuthScreen() {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const result = mode === 'signup' ? await authClient.signUp.email({ name, email, password }) : await authClient.signIn.email({ email, password });
      if (result.error) throw new Error(result.error.message || 'Authentication failed.');
      window.location.reload();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <div className="auth-page">
    <header className="auth-header"><Logo/><span className="auth-header-tag">A LITTLE COSMIC PERSPECTIVE</span></header>
    <div className="auth-columns">
      <div className="auth-intro"><div className="pill"><Sparkles size={14}/> YOUR COSMIC LITTLE BLACK BOOK</div><h1>The stars have <em>opinions.</em></h1><p>Save your birth chart, investigate your compatibility, and keep the receipts. One chart. As many questionable crushes as you like.</p><div className="auth-quote"><span className="mini-stars">✳ &nbsp; ✳ &nbsp; ✳</span><strong>gurl. guurl. guuurl.<br/>guuuurl. guuuuurl.</strong><small>Five levels of cosmic side-eye.</small></div></div>
      <div className="auth-card"><div className="eyebrow">WELCOME TO GURL</div><h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p>{mode === 'signup' ? 'Your chart and every reading, all in one place.' : 'Your readings are right where you left them.'}</p>
        <form onSubmit={submit} className="stack-gap">
          {mode === 'signup' && <TextField label="Display name" placeholder="How should we call you?" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" maxLength={80} required/>}
          <TextField label="Email address" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" required/>
          <TextField label="Password" type="password" minLength={8} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} required/>
          {error && <Notice>{error}</Notice>}
          <button type="submit" className="button primary wide" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17}/> : null}{mode === 'signup' ? 'Create account' : 'Sign in'}<ArrowRight size={17}/></button>
        </form><div className="auth-switch">{mode === 'signup' ? 'Already have an account?' : 'New to gurl?'} <button className="text-button" onClick={()=>{setMode(mode==='signup'?'signin':'signup');setError('');}}>{mode === 'signup' ? 'Sign in' : 'Create one'}</button></div>
        <div className="privacy-note"><ShieldCheck size={17}/> Your birth details and readings stay private to your account.</div>
      </div>
    </div>
    <footer className="auth-footer">© gurl. · A playful astrology project · For entertainment, not science</footer>
  </div>;
}

function Shell({ page, setPage, user, children }) {
  const [menu, setMenu] = useState(false);
  const go = (id) => { setPage(id); setMenu(false); window.scrollTo({ top:0, behavior:'smooth' }); };
  return <div className="app-layout">
    <aside className={'sidebar ' + (menu ? 'is-open' : '')}>
      <div className="sidebar-top"><Logo/><span className="sidebar-tag">YOUR COSMIC SPACE</span></div>
      <nav aria-label="Main navigation" className="nav-list">{navItems.map(item=>{const Icon=item.icon; return <button key={item.id} type="button" className={'nav-item ' + (page===item.id ? 'active' : '')} onClick={()=>go(item.id)}><Icon size={19} strokeWidth={1.8}/>{item.label}{item.id==='new-reading' && <span className="nav-plus">+</span>}</button>;})}</nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={17}/><strong>A note from the stars</strong><p>Take the magic seriously. The math? Not so much.</p></div><div className="nav-profile"><span className="avatar">{(user.name || 'G').charAt(0).toUpperCase()}</span><div className="profile-name"><strong>{user.name}</strong><span>{user.email}</span></div></div></div>
    </aside>
    <div className="main-region"><div className="topbar"><button className="mobile-menu icon-btn" onClick={()=>setMenu(!menu)} aria-label="Toggle navigation"><Menu size={20}/></button><span className="topbar-path">gurl <ChevronRight size={14}/> {navItems.find(n=>n.id===page)?.label}</span><span className="topbar-right"><span className="tiny-status-dot"/> YOUR PRIVATE UNIVERSE</span></div><main className="page-content">{children}</main><footer className="app-footer"><span>gurl. v0.1</span><span>Birthplace data: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · For entertainment only.</span></footer></div>
    {menu && <button type="button" className="mobile-overlay" aria-label="Close menu" onClick={()=>setMenu(false)}/>}
  </div>;
}

function Placement({ label, value, icon: Icon, desc }) { return <div className="placement"><div className="placement-icon"><Icon size={20} strokeWidth={1.8}/></div><div className="placement-meta"><small>{label}</small><strong>{value || 'Unknown'}</strong><span>{desc}</span></div></div>; }
function ChartSummary({ chart }) { const p=chart?.placements; return <div className="chart-summary"><Placement label="SUN SIGN" value={p?.sun} icon={Sun} desc={p?.sunUncertain ? 'Needs exact time' : 'The self'}/><Placement label="MOON SIGN" value={p?.moon} icon={Moon} desc={p?.moonUncertain ? 'Needs exact time' : 'The inner world'}/><Placement label="RISING SIGN" value={p?.rising} icon={ArrowUpRight} desc={p?.rising ? 'First impressions' : 'Needs birth time'}/></div>; }
function ReadingRow({ item, onOpen, best }) { return <button className="reading-row" onClick={()=>onOpen(item)}><span className="reading-initial">{item.nickname.slice(0,1).toUpperCase()}</span><span className="reading-person"><strong>{item.nickname}{best && <span className="small-tag">BEST MATCH</span>}</strong><small>{dateTime(item.createdAt)} · {item.placements.sun} sun</small></span><span className="reading-score"><strong>{item.rating}</strong><small>{item.score}% compatibility</small></span><ChevronRight size={17} className="reading-chevron"/></button>; }

function Overview({ user, chart, comparisons, go, onOpen }) {
  const best=comparisons[0], recent=[...comparisons].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,4);
  return <>
    <SectionHeading kicker="YOUR DASHBOARD" title={`Hello, ${user.name?.split(' ')[0] || 'darling'}.`} description="Your cosmic compatibility journal, all in one place." action={<button className="button primary desktop-action" onClick={()=>go(chart?'new-reading':'my-chart')}><Plus size={17}/>{chart?'New reading':'Create my chart'}</button>}/>
    <div className="hero-banner"><div className="hero-content"><div className="hero-kicker"><Sparkles size={15}/> YOUR NEXT COSMIC REVELATION</div><h2>The universe is talking.<br/>We keep the receipts.</h2><p>{chart ? 'A little celestial insight goes a long way. Ready to investigate another connection?' : 'Start with the three placements that define your astrological profile.'}</p><button className="button hero-button" onClick={()=>go(chart?'new-reading':'my-chart')}>{chart?'Check compatibility':'Enter my birth details'}<ArrowRight size={17}/></button></div><div className="orbit-decor" aria-hidden="true"><span/><span/><span/><i>✦</i></div></div>
    <div className="stats-grid"><div className="stat-card"><span>TOTAL READINGS</span><strong>{comparisons.length.toString().padStart(2,'0')}</strong><small>Saved to your journal</small></div><div className="stat-card"><span>BEST COMPATIBILITY</span><strong>{best ? best.score+'%' : '—'}</strong><small>{best ? `With ${best.nickname}` : 'Your stars await'}</small></div><div className="stat-card"><span>BEST GURL RATING</span><strong className="rating-stat">{best?.rating || '—'}</strong><small>{best ? 'The least dramatic reaction' : 'Nothing to judge yet'}</small></div></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-head"><div><h3>My big three</h3><p>Your natal essentials</p></div><button className="icon-btn" onClick={()=>go('my-chart')} aria-label="Edit my chart"><ArrowUpRight size={18}/></button></div>{chart ? <><ChartSummary chart={chart}/><div className="panel-footer"><MapPin size={15}/>{chart.place.label}</div></> : <div className="empty-inside"><Orbit size={25}/><p>You haven't added your birth chart yet.</p><button className="button light" onClick={()=>go('my-chart')}>Set up chart <ArrowRight size={15}/></button></div>}</section>
    <section className="panel"><div className="panel-head"><div><h3>Recent readings</h3><p>Your latest cosmic investigations</p></div><button className="link-arrow" onClick={()=>go('history')}>View all <ArrowRight size={15}/></button></div>{recent.length ? <div className="reading-list">{recent.map((r)=> <ReadingRow item={r} key={r.id} best={best?.id===r.id} onOpen={onOpen}/>)}</div> : <div className="empty-inside"><Heart size={25}/><p>Your compatibility history will show up here.</p><button className="button light" onClick={()=>go(chart?'new-reading':'my-chart')}>Start a reading <ArrowRight size={15}/></button></div>}</section></div>
  </>;
}

function PlacePicker({ value, onChange }) {
  const [text,setText]=useState(value?.label || ''); const [results,setResults]=useState([]); const [loading,setLoading]=useState(false); const [error,setError]=useState('');
  useEffect(()=>{if(value?.label)setText(value.label);},[value?.label]);
  async function search() { setError(''); setResults([]); if(text.trim().length<3){setError('Type at least 3 letters.');return;} setLoading(true);try{const places=await api('/places?q='+encodeURIComponent(text.trim()));setResults(places);if(!places.length)setError('No matching towns found. Try a more specific location.');}catch(e){setError(e.message);}finally{setLoading(false);} }
  return <div className="field"><span className="field-label">Birthplace</span><div className="place-search"><MapPin size={18}/><input aria-label="Birthplace city" placeholder="City, state, country" value={text} onChange={e=>{setText(e.target.value);onChange(null);setResults([]);setError('');}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search();}}}/><button className="place-btn" type="button" onClick={search} disabled={loading}>{loading?<LoaderCircle size={17} className="spin"/>:<Search size={17}/>}<span>Find</span></button></div>{results.length>0 && <div className="place-results" role="listbox" aria-label="Birthplace results">{results.map((place,i)=><button key={place.id||i} type="button" onClick={()=>{onChange(place);setText(place.label);setResults([]);}}><MapPin size={15}/>{place.label}</button>)}</div>}{value && <small className="field-success"><Check size={13}/> Selected: {value.label}</small>}{error && <small className="field-error">{error}</small>}<small className="hint">Search for a city and select the correct result.</small></div>;
}
function BirthFields({ data, setData }) {
  const update=(key,val)=>setData(p=>({...p,[key]:val}));
  return <div className="birth-form-grid"><TextField label="Date of birth" type="date" max={new Date().toISOString().slice(0,10)} value={data.birthDate} onChange={e=>update('birthDate',e.target.value)} required/><TextField label="Time of birth" type="time" value={data.birthTime} onChange={e=>update('birthTime',e.target.value)} disabled={!data.birthTimeKnown} required={data.birthTimeKnown}/><div className="grid-full"><label className="check-line"><input type="checkbox" checked={!data.birthTimeKnown} onChange={e=>update('birthTimeKnown',!e.target.checked)}/> I don't know the exact birth time</label></div><div className="grid-full"><PlacePicker value={data.place} onChange={val=>update('place',val)}/></div>{!data.birthTimeKnown && <div className="grid-full"><div className="inline-note"><Info size={17}/> Without an exact birth time, Rising cannot be calculated and the Moon may be uncertain.</div></div>}</div>;
}
const freshBirth=()=>({birthDate:'',birthTime:'',birthTimeKnown:true,place:null});
function ChartEditor({ chart, onSave }) {
  const [data,setData]=useState(chart?{birthDate:chart.birthDate?.slice(0,10)||'',birthTime:chart.birthTime||'',birthTimeKnown:chart.birthTimeKnown,place:chart.place}:freshBirth());
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false);
  useEffect(()=>{if(chart) setData({birthDate:chart.birthDate?.slice(0,10)||'',birthTime:chart.birthTime||'',birthTimeKnown:chart.birthTimeKnown,place:chart.place});},[chart]);
  async function submit(e){e.preventDefault();setError('');setSaved(false);if(!data.place){setError('Please select a birthplace from the city results.');return;}setLoading(true);try{const result=await api('/chart',{method:'PUT',body:data});onSave(result);setSaved(true);}catch(e){setError(e.message);}finally{setLoading(false);}}
  return <><SectionHeading kicker="MY BIRTH CHART" title="Your big three." description="Tell us when and where you arrived. We'll take it from there."/><div className="two-column"><section className="panel form-panel"><div className="panel-head"><div><h3>Birth information</h3><p>This information is visible only to you.</p></div><CalendarDays size={20} color="var(--muted)"/></div><form onSubmit={submit} className="form-stack"><BirthFields data={data} setData={setData}/>{error && <Notice>{error}</Notice>}{saved&&<Notice kind="success"><Check size={16}/> Chart saved successfully.</Notice>}<button className="button primary" type="submit" disabled={loading}>{loading?<LoaderCircle size={17} className="spin"/>:<Orbit size={17}/>} {chart?'Update my chart':'Calculate my chart'} <ArrowRight size={16}/></button></form></section><section className="panel chart-result-panel"><div className="panel-head"><div><h3>Your natal snapshot</h3><p>{chart ? 'Based on your saved birth information' : 'Available after you save your chart'}</p></div><Sparkles size={20} color="var(--accent)"/></div>{chart ? <><ChartSummary chart={chart}/>{chart.placements.note && <div className="inline-note"><Info size={17}/>{chart.placements.note}</div>}<div className="panel-footer"><Clock3 size={15}/>{chart.birthTimeKnown?`${formatDate(chart.birthDate)} at ${chart.birthTime}`:formatDate(chart.birthDate)} · {chart.zone}</div></> : <div className="empty-chart"><Orbit size={45} strokeWidth={1.2}/><strong>Your chart is waiting</strong><p>Your Sun, Moon, and Rising signs will appear right here.</p></div>}</section></div></>;
}

function RatingDisplay({ item, showDetails=true }) { return <div className="rating-result"><div className="rating-label">KAISER'S VERDICT</div><div className="rating-word">{item.rating}<span>.</span></div><div className="rating-score"><strong>{item.score}%</strong><span>playful compatibility score</span></div><p>{item.interpretation}</p>{item.provisional && <div className="inline-note"><Info size={16}/> Provisional: a missing or uncertain placement was excluded.</div>}{showDetails && <div className="breakdown">{item.breakdown.map(f=><div className="breakdown-row" key={f.placement}><span>{f.placement}</span><div className="bar-track"><span style={{width:`${f.score}%`}}/></div><strong>{f.score}%</strong></div>)}</div>}</div>; }
function NewReading({ chart, onCreated, go }) {
  const [data,setData]=useState(freshBirth());const [nickname,setNickname]=useState('');const [created,setCreated]=useState(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  async function submit(e){e.preventDefault();setError('');if(!data.place){setError('Please select their birthplace from the city results.');return;}setBusy(true);try{const r=await api('/comparisons',{method:'POST',body:{...data,nickname}});onCreated(r);setCreated(r);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <><SectionHeading kicker="NEW READING" title="Who's the mystery person?" description="Add their birth details and Kaiser will have something to say."/>{!chart ? <div className="panel setup-gate"><Orbit size={34}/><h3>First, we need your chart.</h3><p>Save your own birth details once. Then compare as many people as you like.</p><button className="button primary" onClick={()=>go('my-chart')}>Create my chart <ArrowRight size={17}/></button></div> : <div className="two-column"><section className="panel form-panel"><div className="panel-head"><div><h3>New compatibility check</h3><p>Only you can see this person in your history.</p></div><Heart size={20} color="var(--muted)"/></div><form className="form-stack" onSubmit={submit}><TextField label="Name or nickname" placeholder="That person you've been thinking about" value={nickname} maxLength={80} onChange={e=>setNickname(e.target.value)} required/><BirthFields key={created?.id || 'new'} data={data} setData={setData}/>{error&&<Notice>{error}</Notice>}<button type="submit" className="button primary" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:<Sparkles size={17}/>} Reveal compatibility <ArrowRight size={17}/></button></form></section><section className="panel"><div className="panel-head"><div><h3>Compatibility reading</h3><p>{created?`Your reading with ${created.nickname}`:'Your result will appear here'}</p></div><Orbit color="var(--accent)" size={20}/></div>{created?<><RatingDisplay item={created}/><div className="panel-actions"><button className="button light" onClick={()=>{setCreated(null);setData(freshBirth());setNickname('');}}>Another reading <Plus size={16}/></button><button className="text-button" onClick={()=>go('history')}>View history <ArrowRight size={16}/></button></div></>:<div className="empty-chart"><Heart size={42} strokeWidth={1.2}/><strong>The jury is still out.</strong><p>Enter their birth information to see the cosmic verdict.</p></div>}</section></div>}</>;
}
function History({ comparisons, onOpen, go, chart }) {
  const [query,setQuery]=useState(''); const [sort,setSort]=useState('best');
  const list=useMemo(()=>{const filtered=comparisons.filter(r=>r.nickname.toLowerCase().includes(query.toLowerCase()));return filtered.sort((a,b)=>sort==='best'?b.score-a.score:new Date(b.createdAt)-new Date(a.createdAt));},[comparisons,query,sort]);
  return <><SectionHeading kicker="YOUR LITTLE BLACK BOOK" title="Reading history." description="Every cosmic connection, saved and sorted." action={<button className="button primary desktop-action" onClick={()=>go(chart?'new-reading':'my-chart')}><Plus size={16}/> New reading</button>}/><section className="panel history-panel"><div className="history-top"><div className="search-field"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name" aria-label="Search reading history"/></div><select aria-label="Sort readings" value={sort} onChange={e=>setSort(e.target.value)}><option value="best">Highest match first</option><option value="recent">Newest first</option></select></div>{list.length?<div className="history-list">{list.map(r=><ReadingRow item={r} key={r.id} best={comparisons[0]?.id===r.id} onOpen={onOpen}/>)}</div>:<div className="empty-chart"><BookOpenText size={38} strokeWidth={1.2}/><strong>{comparisons.length?'No matching readings':'Nothing in the book yet'}</strong><p>{comparisons.length?'Try searching for another name.':'Your future compatibility readings will live here.'}</p><button className="button light" onClick={()=>go(chart?'new-reading':'my-chart')}>Start a reading <ArrowRight size={15}/></button></div>}</section></>;
}
function Account({ user }) { const [busy,setBusy]=useState(false);async function signOut(){setBusy(true);await authClient.signOut();window.location.reload();}return <><SectionHeading kicker="ACCOUNT SETTINGS" title="Your space." description="Just the essentials for now."/><section className="panel account-panel"><div className="account-identity"><span className="avatar big-avatar">{(user.name||'G').charAt(0).toUpperCase()}</span><div><h3>{user.name}</h3><p>{user.email}</p></div></div><div className="account-divider"/><div className="account-section"><ShieldCheck size={19}/><div><strong>Private by default</strong><p>Birth details and comparison histories can only be accessed while logged into your account.</p></div></div><div className="account-section"><Info size={19}/><div><strong>A note about astrology</strong><p>gurl scores are just for fun, not scientific predictions of successful relationships.</p></div></div><button className="button light" onClick={signOut} disabled={busy}><LogOut size={17}/> Sign out</button></section></>; }
function ReadingDetail({ item, onClose, onDeleted, onUpdated }) {
  const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
  async function rename(){const name=window.prompt('Change this nickname:', item.nickname);if(name===null||!name.trim()||name===item.nickname)return;setBusy(true);try{const updated=await api(`/comparisons/${item.id}`,{method:'PATCH',body:{nickname:name.trim()}});onUpdated(updated);}catch(e){setError(e.message);}finally{setBusy(false);}}
  async function remove(){if(!window.confirm(`Delete the reading for ${item.nickname}? This cannot be undone.`))return;setBusy(true);try{await api(`/comparisons/${item.id}`,{method:'DELETE'});onDeleted(item.id);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="detail-modal" role="dialog" aria-modal="true" aria-label={`Reading for ${item.nickname}`}><div className="modal-head"><div><div className="eyebrow">SAVED READING</div><h2>{item.nickname}</h2><p>{formatDate(item.birthDate)} · {item.place.label}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={21}/></button></div><RatingDisplay item={item}/><div className="modal-placements"><span><Sun size={16}/> {item.placements.sun} Sun</span><span><Moon size={16}/> {item.placements.moon||'Uncertain'} Moon</span><span><ArrowUpRight size={16}/> {item.placements.rising||'Unknown'} Rising</span></div>{error&&<Notice>{error}</Notice>}<div className="modal-actions"><button className="button light" onClick={rename} disabled={busy}>Rename</button><button className="button danger" onClick={remove} disabled={busy}><Trash2 size={16}/> Delete</button></div></section></div>;
}
function App(){
  const { data:session, isPending }=authClient.useSession();
  const [page,setPage]=useState('overview'); const [chart,setChart]=useState(null); const [comparisons,setComparisons]=useState([]);
  const [loading,setLoading]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState(null);
  useEffect(()=>{if(!session?.user){setLoading(false);return;}let alive=true;Promise.all([api('/chart'),api('/comparisons')]).then(([c,r])=>{if(alive){setChart(c);setComparisons(r);}}).catch(e=>{if(alive)setError(e.message);}).finally(()=>{if(alive)setLoading(false);});return()=>{alive=false;};},[session?.user?.id]);
  const addReading=(r)=>setComparisons(prev=>[...prev,r].sort((a,b)=>b.score-a.score));
  const updateReading=(partial)=>{setComparisons(prev=>prev.map(r=>r.id===partial.id?{...r,...partial}:r));setSelected(prev=>prev?.id===partial.id?{...prev,...partial}:prev);};
  const deleteReading=(id)=>{setComparisons(prev=>prev.filter(r=>r.id!==id));setSelected(null);};
  if(isPending) return <PageLoading/>;
  if(!session?.user) return <AuthScreen/>;
  return <Shell page={page} setPage={setPage} user={session.user}>
    {error&&<Notice onClose={()=>setError('')}>{error}</Notice>}
    {loading?<PageLoading/>:page==='kaiser'?<GurlPage
      key={chart?.updatedAt || 'new-chart'}
      initial={chart ? {
        date: chart.birthDate,
        time: chart.birthTime || '',
        timeUnknown: !chart.birthTimeKnown,
        place: {
          name: chart.place?.label || '',
          label: chart.place?.label || '',
          latitude: chart.place?.lat,
          longitude: chart.place?.lng,
          timezone: chart.zone
        }
      } : undefined}
      comparisons={comparisons}
    />:page==='overview'?<Overview user={session.user} chart={chart} comparisons={comparisons} go={setPage} onOpen={setSelected}/>:
      page==='my-chart'?<ChartEditor chart={chart} onSave={setChart}/>:
      page==='new-reading'?<NewReading chart={chart} onCreated={addReading} go={setPage}/>:
      page==='history'?<History comparisons={comparisons} onOpen={setSelected} go={setPage} chart={chart}/>:
      <Account user={session.user}/>}
    {selected&&<ReadingDetail item={selected} onClose={()=>setSelected(null)} onUpdated={updateReading} onDeleted={deleteReading}/>}
  </Shell>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
