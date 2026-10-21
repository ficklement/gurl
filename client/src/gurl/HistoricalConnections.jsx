import { useEffect, useState } from 'react';
import { drawHistorical, chartForHistorical } from './historicalMatcher.js';
import { SIGNS } from './astro.js';
import { creatureFor } from './kaiser.js';
import { cardArtFor } from './cardArt.js';

const CATS={twin:'♊',match:'♡',nemesis:'⚡'};
function useImageOf(person) {
  // A single Wikipedia thumbnail lookup per visible card, never a live person search.
  const [image,setImage]=useState(null);
  useEffect(()=>{
    if (!person) return;
    let active=true; setImage(null);
    const title=encodeURIComponent(person.wikiTitle||person.name);
    const api=`https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&piprop=thumbnail&pithumbsize=520&titles=${title}&format=json&origin=*`;
    fetch(api).then(r=>r.json()).then(j=>{
      const page=Object.values(j.query?.pages||{})[0];
      if(active)setImage(page?.thumbnail?.source||null);
    }).catch(()=>{});
    return ()=>{active=false;};
  },[person?.id]);
  return image;
}
function Portrait({person}) {
  const image=useImageOf(person);
  return <div className="dead-portrait">{image ? <img src={image} alt={`Portrait of ${person.name}`} loading="lazy" /> : <span aria-hidden="true">✧</span>}</div>;
}
function SignUncertainty({person}) {
  const chart=chartForHistorical(person);
  const toLabel=(v)=>v.map(x=>SIGNS[x]).join(' / ');
  return <small className="dead-signs">Sun {toLabel(chart.sun)} · Moon {toLabel(chart.moon)}{!chart.rising.length&&' · Rising ?'}</small>;
}
function HypotheticalCreature({person}) {
  const chart=chartForHistorical(person);
  const rising=SIGNS.indexOf(person.kaiserRisingGuess);
  if (rising < 0 || !chart.sun.length || !chart.moon.length) return null;
  const triples=chart.moon.slice(0,2).map(m=>[chart.sun[0],m,rising]);
  const possibilities=[...new Set(triples.map(t=>creatureFor(t)?.name).filter(Boolean))];
  const portraits=[...new Set(triples.map(cardArtFor).filter(Boolean))];
  return <div className="dead-hypothetical">
    <p className="dead-guess">KAISER'S UNDOCUMENTED RISING GUESS: <b>{person.kaiserRisingGuess}</b>.
      &nbsp;That would make you <strong>{possibilities.join('... or possibly ')}</strong>. Gurl, I wasn't there.</p>
    {portraits.map(src=><img key={src} className="dead-hypothetical-art" src={src} alt={`A fictional Kaiser creature card for ${person.name}`} loading="lazy" />)}
  </div>;
}
const defaultPreferences={mode:'romance',genders:[]};

export default function HistoricalConnections({signs,chart}) {
  // Even without a birth hour, the two known placements may produce a provisional deal.
  const chartSigns=signs || (chart?.sun && chart?.moon ? [chart.sun.sign,chart.moon.sign,null] : null);
  const [prefs,setPrefs]=useState(defaultPreferences);
  const [dealt,setDealt]=useState(null);
  const [started,setStarted]=useState(false);
  useEffect(()=>{setDealt(null);setStarted(false);},[chartSigns?.join('-')]);
  const deal=()=>{setDealt(drawHistorical(chartSigns,prefs));setStarted(true);};
  const toggle=(value)=>setPrefs(p=>({...p,genders:p.genders.includes(value)?p.genders.filter(x=>x!==value):[...p.genders,value]}));
  return <section className="block dead-section" id="departed">
    <div className="wrap">
      <div className="eyebrow">Kaiser's collection of historically questionable acquaintances</div>
      <h2 className="title">The dearly departed department</h2>
      <p className="lede">GURL, apparently your cosmic business started centuries before you were born.</p>
      <div className="dead-controls">
        <label>What kind of connection? <select value={prefs.mode} onChange={e=>setPrefs(p=>({...p,mode:e.target.value}))}>
          <option value="romance">Romantic</option><option value="platonic">Platonic</option>
        </select></label>
        {prefs.mode==='romance'&&<fieldset className="dead-preferences"><legend>Your romantic interests (optional)</legend>
          {['female','male','nonbinary','unknown'].map(value=><label key={value}><input type="checkbox" checked={prefs.genders.includes(value)} onChange={()=>toggle(value)}/>{value==='unknown'?'Unspecified':value[0].toUpperCase()+value.slice(1)}</label>)}
          <small>Leave all unchecked to include everyone.</small>
        </fieldset>}
        <button className="btn" type="button" disabled={!chartSigns} onClick={deal}>{started?'Deal three more':'Show me the dead, GURL'}</button>
      </div>
      {!chartSigns&&<p className="dead-wait">Give Kaiser a birth date to begin the historical gossip.</p>}
      {!signs&&chartSigns&&<p className="dead-footnote">Provisional matching from Sun and approximate Moon. The missing Rising stays a mystery, GURL.</p>}
      {dealt&&<>
        <p className="dead-kaiser">“GURL. I've consulted the ancestral guest list. These three managed to make it out of history and into YOUR business.”</p>
        <div className="dead-grid">{dealt.map(({kind,title,person})=><article className="dead-card" key={kind}>
          <span className="dead-type">{CATS[kind]} {title}</span>
          {person?<><Portrait person={person}/><h3>{person.name}</h3><SignUncertainty person={person}/>
            <p className="dead-line">“GURL. {person.kaiserLine}”</p>
            <HypotheticalCreature person={person}/>
            <small className="dead-disclaimer">Date-based match. Kaiser's Rising guess and resulting creature are fictional, not calculated historical facts.</small>
            <a className="dead-source" href={`https://www.wikidata.org/wiki/${person.id}`} target="_blank" rel="noopener noreferrer">Historical record ↗</a>
          </>:<p>No match in this small preview roster. Expand the collection to see more.</p>}
        </article>)}</div>
      </>}
      <p className="dead-footnote">Preview roster: 34 names pending source and portrait-license review. A birth date is not a documented birth hour. If Kaiser assigns an uncertain Rising later, it'll be plainly marked as his spectacular guess.</p>
    </div>
  </section>;
}
