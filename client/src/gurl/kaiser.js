// Kaiser's faces, lines and verdict scale. Edit copy here; components only read it.
import idle from './kaiser/idle.webp';
import talk from './kaiser/talk.webp';
import flattered from './kaiser/flattered.webp';
import unimpressed from './kaiser/unimpressed.webp';
import sideeye from './kaiser/sideeye.webp';
import delighted from './kaiser/delighted.webp';
import portrait from './kaiser/portrait.webp';
import hall from './kaiser/hall.webp';
import ING from './data/ingredients.json';
import BESTIARY from './data/bestiary.json';
import { SIGNS } from './astro.js';

export const FACES = { idle, talk, flattered, unimpressed, sideeye, delighted };
export const MOODS = { idle: 'holding court', talk: 'talking', flattered: 'flattered', unimpressed: 'unimpressed', sideeye: 'suspicious', delighted: 'delighted' };
export const PORTRAIT = portrait;
export const HALL = hall;
export { ING, BESTIARY };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const sh = (s) => cap(ING[SIGNS[s]].shorthand);

export const LINES = {
  intro: "Sit. Don't touch the mannequin. Give me a birth date and I'll find out what kind of creature I'm dressing tonight.",
  sun: (s) => `Sun in ${SIGNS[s]}. ${sh(s)}. Fine. I've dressed worse.`,
  sunCusp: (a, b) => `You were born the day the Sun changed outfits, ${SIGNS[a]} to ${SIGNS[b]}. Give me the hour and I'll settle it.`,
  askTime: 'Now the hour. Your Moon moves fast, and so do I.',
  moon: (s) => `Moon in ${SIGNS[s]}. Emotionally? ${sh(s)}. Noted, darling.`,
  moonApprox: (s) => `No birth time, so your Moon is a rumor. Probably ${SIGNS[s]}. I'll pencil it in.`,
  moonCusp: (a, b) => `Without the hour your Moon is either ${SIGNS[a]} or ${SIGNS[b]}. I'm pinning ${SIGNS[a]} until you find a birth certificate.`,
  askPlace: 'Where did this happen? I need your horizon to see what you walked in wearing.',
  rising: (s) => `${SIGNS[s]} Rising. That's the outfit everyone sees first. ${sh(s)}.`,
  noTimeRising: "No birth time, no Rising. I can't fit a silhouette I can't see. Find the hour and come back.",
  placeNeedsTime: 'Lovely city. Now give me the time, or your Rising stays behind the curtain.',
  placeFirst: "Gorgeous. Now the birth date, please. I can't dress a horizon.",
  noPlace: 'Never heard of it. Try the nearest big city.',
};

// Best (1 u) to worst (5 u). compatibility.js decides the level; this decides how it looks.
export const VERDICTS = [
  { word: 'gurl', face: 'delighted', col: '#ff2e9a', line: "Book the venue. I'll do the gowns." },
  { word: 'guurl', face: 'flattered', col: '#ff7fbf', line: 'This works if one of you learns to share a mirror.' },
  { word: 'guuurl', face: 'talk', col: '#2fe6ff', line: "It's giving situationship with excellent lighting." },
  { word: 'guuuurl', face: 'sideeye', col: '#ffb547', line: 'Somebody is going to cry in a parking garage.' },
  { word: 'guuuuurl', face: 'unimpressed', col: '#ff2443', line: 'No. Not in my atelier.' },
];

export const PALETTE = { coral: '#ff6b5a', moss: '#8fdc6e', citrus: '#ffd23f', pearl: '#e8e2ff', gold: '#ffc145', sage: '#9fe6b8', rose: '#ff7fbf', plum: '#c65cff', copper: '#ff8a3d', slate: '#8fa8ff', electric: '#2fe6ff', lavender: '#bca4ff' };

/** Lookup key is order-free: signs sorted in zodiac order, e.g. ARIES-TAURUS-LEO. Never change this format. */
export const creatureKey = (signs) => [...signs].sort((a, b) => a - b).map(s => SIGNS[s].toUpperCase()).join('-');
export const creatureFor = (signs) => BESTIARY[creatureKey(signs)];
