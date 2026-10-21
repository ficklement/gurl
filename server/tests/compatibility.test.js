import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { zodiac, normalize, gurlFor, scoreCharts, alignment } from '../src/compatibility.js';

test('zodiac wraps longitudes and handles cusps', () => {
  assert.equal(zodiac(0), 'Aries');
  assert.equal(zodiac(29.999), 'Aries');
  assert.equal(zodiac(30), 'Taurus');
  assert.equal(zodiac(359.99), 'Pisces');
  assert.equal(zodiac(-10), 'Pisces');
  assert.equal(normalize(361), 1);
});
test('gurl rating has five tiers', () => {
  assert.deepEqual([99,80,79,60,59,40,39,20,19,0].map(gurlFor),
    ['gurl','gurl','guurl','guurl','guuurl','guuurl','guuuurl','guuuurl','guuuuurl','guuuuurl']);
});
test('comparison can omit a rising sign', () => {
  const a = { sun:'Leo', moon:'Aries', rising:null };
  const b = { sun:'Sagittarius', moon:'Leo', rising:'Gemini' };
  const result = scoreCharts(a,b);
  assert.equal(result.provisional, true);
  assert.equal(result.breakdown.length, 2);
  assert.ok(result.score >= 0 && result.score <= 100);
});

test('a hard square can trigger the strongest gurl reaction', () => {
  assert.equal(alignment('Aries','Cancer'),9);
  const result = scoreCharts({sun:'Aries',moon:'Aries',rising:'Aries'}, {sun:'Cancer',moon:'Cancer',rising:'Cancer'});
  assert.equal(result.rating,'guuuuurl');
});
