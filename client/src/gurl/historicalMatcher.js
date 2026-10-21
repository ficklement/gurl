import { sunLon, moonLon, signOf, SIGNS } from './astro.js';
import HISTORICAL from './data/historical-figures.seed.json';

const ELEMENT = [0,1,2,3,0,1,2,3,0,1,2,3]; // Fire Earth Air Water
const opposite = (a,b) => (a-b+12)%12===6;
const neighbor = (a,b) => Math.min((a-b+12)%12,(b-a+12)%12);

// Birth dates are civil-calendar dates, not verified instants. We model a broad
// interval so unrecorded birth times cannot masquerade as precise Moon signs.
function possibleSigns(birthDate, fn) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const center = Date.UTC(year,month-1,day,12);
  // Local civil dates can differ widely from UTC; 2-day window deliberately conservative.
  const out = new Set();
  for (const hours of [-24,-12,0,12,24]) out.add(signOf(fn(new Date(center+hours*3600000))));
  return [...out];
}

export function chartForHistorical(person) {
  return {sun: possibleSigns(person.birthDate,sunLon),
          moon: possibleSigns(person.birthDate,moonLon),
          rising: person.risingSign && person.birthTimeQuality==='recorded'
            ? [SIGNS.indexOf(person.risingSign)] : []};
}

function affinity(a,b) {
  if (a===b) return 4;
  const ea=ELEMENT[a],eb=ELEMENT[b];
  if ((ea+2)%4===eb || (eb+2)%4===ea) return 2.5; // Fire+Air, Earth+Water
  if (ea===eb) return 3;
  if (opposite(a,b)) return 1.5;
  return neighbor(a,b)===1 ? .5 : 0;
}
const best=(n,possible,fn)=>possible.length?Math.max(...possible.map(x=>fn(n,x))):0;

export function scoreHistorical(user,person,kind) {
  const h=chartForHistorical(person);
  const [us,um,ur]=user;
  if (kind==='twin') {
    return 6*best(us,h.sun,(a,b)=>a===b?1:0)+4*best(um,h.moon,(a,b)=>a===b?1:0)
      +2*best(ur,h.rising,(a,b)=>a===b?1:0)+Math.random()*.01;
  }
  if (kind==='nemesis') {
    return best(us,h.sun,(a,b)=>opposite(a,b)?5:4-affinity(a,b))
      +best(um,h.moon,(a,b)=>opposite(a,b)?5:4-affinity(a,b))
      +Math.random()*.01;
  }
  return 2*best(us,h.sun,affinity)+2*best(um,h.moon,affinity)
    +best(um,h.sun,affinity)+best(us,h.moon,affinity)+Math.random()*.01;
}

function draw(pool, user, kind, excluded, eligible) {
  const sorted=pool.filter(p=>!excluded.has(p.id) && eligible(p))
    .map(person=>({person,score:scoreHistorical(user,person,kind)}))
    .sort((a,b)=>b.score-a.score);
  const nearTop=sorted.filter(row=>row.score >= (sorted[0]?.score||0)-2).slice(0,15);
  // Random among genuinely close contenders, never among completely unrelated people.
  return (nearTop.length ? nearTop[Math.floor(Math.random()*nearTop.length)] : null)?.person || null;
}
export function drawHistorical(user,{mode='romance',genders=[]}={}) {
  if (!Array.isArray(user)||user.length!==3) return null;
  const pool=HISTORICAL.filter(p=>p.birthDate && p.isDeceased===true && p.id);
  const picked=new Set();
  const allowed=(p)=>!genders.length||genders.includes(p.gender);
  const twin=draw(pool,user,'twin',picked,allowed); if(twin)picked.add(twin.id);
  const match=draw(pool,user,'match',picked,allowed);if(match)picked.add(match.id);
  const nemesis=draw(pool,user,'nemesis',picked,allowed);
  return [
    {kind:'twin',title:'Your cosmic double',person:twin},
    {kind:'match',title:mode==='platonic'?'Your historical ride-or-die':'Your dearly departed type',person:match},
    {kind:'nemesis',title:'Your historical catastrophe',person:nemesis}
  ];
}
