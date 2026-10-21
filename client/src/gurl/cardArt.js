// Two approved full-frame Regular City creature cards. Add new entries as artwork is approved.
// Keys are UNORDERED combinations; the same art works for all six arrangements.
import lighthouseAccountant from './cards/lighthouse-accountant.webp';
import ninjaDonkey from './cards/ninja-donkey.webp';
import { creatureKey } from './kaiser.js';

const CARDS = Object.freeze({
  'CANCER-CAPRICORN-PISCES': lighthouseAccountant,
  'ARIES-ARIES-PISCES': ninjaDonkey,
});

export function cardArtFor(signsOrKey) {
  if (!signsOrKey) return null;
  const key = Array.isArray(signsOrKey) ? creatureKey(signsOrKey) : signsOrKey;
  return CARDS[key] ?? null;
}

export const finishedCardCount = Object.keys(CARDS).length;
