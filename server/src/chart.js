import * as Astronomy from 'astronomy-engine';
import geoTz from 'geo-tz/all';
import { DateTime } from 'luxon';
import { normalize, zodiac } from './compatibility.js';

const { find } = geoTz;
const toRad = Math.PI / 180;

export function parseBirth(body) {
  const birthDate = String(body?.birthDate || '');
  const birthTime = String(body?.birthTime || '');
  const known = Boolean(body?.birthTimeKnown);
  const place = body?.place;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error('Enter a valid birth date.');
  if (known && !/^\d{2}:\d{2}$/.test(birthTime)) throw new Error('Enter the exact birth time or mark it unknown.');
  if (!place || typeof place.label !== 'string' || place.label.length > 180 || !Number.isFinite(Number(place.lat)) || !Number.isFinite(Number(place.lng))) throw new Error('Select a birthplace from the results.');
  const lat = Number(place.lat), lng = Number(place.lng);
  if (Math.abs(lat) > 89 || Math.abs(lng) > 180) throw new Error('Birthplace coordinates are invalid.');
  // geo-tz's comprehensive data is more appropriate than /now for historic birth dates.
  const zone = find(lat, lng)[0];
  if (!zone) throw new Error('Could not resolve the birth time zone.');
  const localDateTime = DateTime.fromISO(`${birthDate}T${known ? birthTime : '12:00'}`, { zone });
  if (!localDateTime.isValid || localDateTime.toFormat('yyyy-MM-dd') !== birthDate || (known && localDateTime.toFormat('HH:mm') !== birthTime)) {
    throw new Error('This birth time is invalid or falls into a daylight-saving gap.');
  }
  // Ambiguous fall-back hours have two possible UTC instants; do not guess one.
  if (known && typeof localDateTime.getPossibleOffsets === 'function' && localDateTime.getPossibleOffsets().length > 1) {
    throw new Error('This birth time occurs twice during a daylight-saving change. Please use a different verified time or contact the site owner.');
  }
  const utcDate = localDateTime.toUTC().toJSDate();
  if (utcDate.getTime() > Date.now()) throw new Error('Birth date cannot be in the future.');
  return { birthDate, birthTime: known ? birthTime : null, birthTimeKnown: known,
    place: { label: place.label.trim(), lat, lng }, zone, utcDate, localDateTime };
}

export function computeChart(birth) {
  const { utcDate, place, birthTimeKnown, localDateTime } = birth;
  const sunLongitude = normalize(Astronomy.SunPosition(utcDate).elon);
  const moonLongitude = normalize(Astronomy.EclipticGeoMoon(utcDate).lon);
  let risingLongitude = null;
  if (birthTimeKnown) {
    const t = new Astronomy.AstroTime(utcDate);
    const theta = normalize(Astronomy.SiderealTime(t) * 15 + place.lng) * toRad;
    // True obliquity via Astronomy Engine's true-ecliptic tilt.
    // Fallback polynomial avoids relying on the undocumented e_tilt symbol.
    const T = t.tt / 36525;
    const meanObliquity = (84381.406 - 46.836769*T - 0.0001831*T*T + 0.00200340*T*T*T) / 3600;
    const obliquity = meanObliquity * toRad;
    const latitude = place.lat * toRad;
    const x = Math.cos(theta);
    const y = -(Math.sin(theta) * Math.cos(obliquity) + Math.tan(latitude) * Math.sin(obliquity));
    risingLongitude = normalize(Math.atan2(x, y) / toRad);
  }
  const firstMoment = localDateTime.startOf('day').toUTC().toJSDate();
  const lastMoment = localDateTime.endOf('day').toUTC().toJSDate();
  const sunUncertain = !birthTimeKnown && zodiac(Astronomy.SunPosition(firstMoment).elon) !== zodiac(Astronomy.SunPosition(lastMoment).elon);
  const moonFirst = Astronomy.EclipticGeoMoon(firstMoment).lon;
  const moonLast = Astronomy.EclipticGeoMoon(lastMoment).lon;
  const moonUncertain = !birthTimeKnown && zodiac(moonFirst) !== zodiac(moonLast);
  return { sun: sunUncertain ? null : zodiac(sunLongitude), moon: moonUncertain ? null : zodiac(moonLongitude),
    rising: risingLongitude === null ? null : zodiac(risingLongitude),
    moonUncertain, sunUncertain, sunLongitude, moonLongitude, risingLongitude,
    note: !birthTimeKnown ? (sunUncertain || moonUncertain ? 'Sun or Moon may change signs during this date. An exact birth time is needed for an accurate chart.' : 'Sun and Moon calculated at local noon; Rising unavailable without birth time.') : null };
}
