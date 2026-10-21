import { useEffect, useState } from 'react';
import { MOODS } from './kaiser.js';

const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Comic-lettered speech bubble with a quick typewriter reveal. */
export default function KaiserBubble({ line, mood = 'talk', children }) {
  const [shown, setShown] = useState(reduced ? line : '');
  useEffect(() => {
    if (reduced) { setShown(line); return; }
    let i = 0; setShown('');
    const t = setInterval(() => { i += 2; setShown(line.slice(0, i)); if (i >= line.length) clearInterval(t); }, 16);
    return () => clearInterval(t);
  }, [line]);
  const done = shown.length >= line.length;
  return (
    <div>
      <div className="speaker"><span>Kaiser · Haute Chaos, est. ???</span><span>{MOODS[mood]}</span></div>
      <div className="bubble" aria-live="polite">
        <p>{shown}</p>
        {done && children}
      </div>
    </div>
  );
}
