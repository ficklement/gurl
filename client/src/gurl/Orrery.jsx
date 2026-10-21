import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { createOrrery, makeTicker } from './orrery-engine.js';
import { FACES } from './kaiser.js';

/**
 * Imperative wrapper: parent calls ref.current.spinTo('sun', lon, 'full') etc.
 * Spins are events (a ring lands *because* an input changed), so they stay imperative
 * rather than being derived from props.
 */
const Orrery = forwardRef(function Orrery({ mood = 'idle', sound = false, label = 'Zodiac orrery: Sun, Moon and Rising rings' }, ref) {
  const host = useRef(null);
  const engine = useRef(null);
  const soundRef = useRef(sound);
  soundRef.current = sound;

  useEffect(() => {
    const tick = makeTicker();
    engine.current = createOrrery(host.current, { faceSrc: FACES.idle, onTick: (p) => soundRef.current && tick(p) });
    return () => engine.current?.destroy();
  }, []);

  useEffect(() => { engine.current?.setFace(FACES[mood]); }, [mood]);

  useImperativeHandle(ref, () => ({
    spinTo: (...a) => engine.current.spinTo(...a),
    unsettle: (...a) => engine.current.unsettle(...a),
    setAligned: (on) => engine.current.setAligned(on),
    isSettled: (k) => engine.current.isSettled(k),
  }), []);

  return <div ref={host} role="img" aria-label={label} />;
});
export default Orrery;
