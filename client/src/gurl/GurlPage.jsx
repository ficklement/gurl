import { useEffect, useState } from 'react';
import { authClient } from '../auth-client.js';
import { api } from '../api.js';
import ChartStudio from './ChartStudio.jsx';
import AccountDialog from './AccountDialog.jsx';
import ResetPassword from './ResetPassword.jsx';
import CreatureCard from './CreatureCard.jsx';
import GurlOMeter, { levelFromScore } from './GurlOMeter.jsx';
import HistoricalConnections from './HistoricalConnections.jsx';
import Menagerie from './Menagerie.jsx';
import { SIGNS } from './astro.js';
import './gurl-theme.css';

const signIndex = (name) => SIGNS.indexOf(name);

function signsFromPlacements(placements) {
  if (!placements?.sun || !placements?.moon || !placements?.rising) return null;
  const signs = [
    signIndex(placements.sun),
    signIndex(placements.moon),
    signIndex(placements.rising),
  ];
  return signs.every(s => s >= 0) ? signs : null;
}

/** Authenticated redesign with the user's saved comparisons. */
export default function GurlPage({ initial, comparisons = [] }) {
  const [studio, setStudio] = useState({ signs: null, chart: null, input: {} });
  const [sound, setSound] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const { data: session } = authClient.useSession();
  const [savedChart, setSavedChart] = useState(null);
  const [savedReadings, setSavedReadings] = useState([]);
  const [accountError, setAccountError] = useState('');

  useEffect(() => {
    if (!session?.user) {
      setSavedChart(null);
      setSavedReadings([]);
      return;
    }

    let active = true;

    Promise.all([api('/chart'), api('/comparisons')])
      .then(([chart, readings]) => {
        if (!active) return;
        setSavedChart(chart);
        setSavedReadings(readings);
      })
      .catch(err => {
        if (active) setAccountError(err.message);
      });

    return () => { active = false; };
  }, [session?.user?.id]);
  const [partner, setPartner] = useState(0);

  const readings = session?.user ? savedReadings : [];
  const selected = readings[partner] || readings[0] || null;

  const initialChart = savedChart ? {
    date: savedChart.birthDate?.slice(0, 10) || '',
    time: savedChart.birthTime || '',
    timeUnknown: !savedChart.birthTimeKnown,
    place: {
      name: savedChart.place?.label || '',
      label: savedChart.place?.label || '',
      latitude: savedChart.place?.lat,
      longitude: savedChart.place?.lng,
      timezone: savedChart.zone
    }
  } : undefined;
  const selectedSigns = signsFromPlacements(selected?.placements);
  const selectedLevel = selected ? levelFromScore(selected.score) : 2;

  async function saveChart(payload) {
    if (!session?.user) {
      setShowAccount(true);
      throw new Error('Sign in to save your chart.');
    }

    if (!payload.place) {
      throw new Error('Select a birthplace before saving.');
    }

    const result = await api('/chart', {
      method: 'PUT',
      body: {
        birthDate: payload.date,
        birthTime: payload.time || '',
        birthTimeKnown: !payload.timeUnknown,
        place: {
          label: payload.place.label || payload.place.name,
          lat: payload.place.latitude,
          lng: payload.place.longitude,
        },
      },
    });

    setSavedChart(result);
    return result;
  }

  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="brand" href="#chart"><span className="wordmark">gurl.</span><small>Kaiser's cosmic compatibility journal</small></a>
          <nav className="links" aria-label="Sections">
            <a href="#chart">Your chart</a>
            <a href="#creature">Your creature</a>
            <a href="#compare">Compare</a>
            <a href="#departed">The Departed</a>
            <a href="#menagerie">Menagerie</a>
            {session?.user ? (
              <>
                <span className="gurl-account-name">
                  {session.user.name || session.user.email}
                </span>
                <button
                  className="chip-btn"
                  type="button"
                  onClick={async () => {
                    await authClient.signOut();
                    window.location.reload();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                className="chip-btn"
                type="button"
                onClick={() => setShowAccount(true)}
              >
                Sign in / Join
              </button>
            )}
            <button className="chip-btn" type="button" aria-pressed={sound} onClick={() => setSound(s => !s)}>{sound ? 'Sound on' : 'Sound off'}</button>
          </nav>
        </div>
      </header>
      <main>
        <ChartStudio
          key={savedChart?.updatedAt || 'new-chart'}
          initial={initialChart}
          onSave={saveChart}
          sound={sound}
          onChange={setStudio}
        />

        <section className="block" id="creature">
          <div className="wrap">
            <div className="eyebrow">Kaiser's Cosmic Bestiary · 364 incarnations</div>
            <h2 className="title">Your creature</h2>
            <p className="lede">Every unordered Big Three gets one creature. The order still matters for the reading: Sun is the core drive, Moon the emotional needs, Rising the outfit everyone sees first.</p>
            <CreatureCard signs={studio.signs} moonApprox={studio.chart?.moon?.approx} timeUnknown={studio.input?.timeUnknown} />
          </div>
        </section>

        <HistoricalConnections signs={studio.signs} chart={studio.chart} />

        <section className="block" id="compare">
          <div className="wrap">
            <div className="eyebrow">The gurl-o-meter</div>
            <h2 className="title">From gurl to guuuuurl</h2>
            <p className="lede">One u means Kaiser approves. Five means he's already left the room.</p>
            {selected ? (
              <GurlOMeter
                you={studio.signs}
                them={selectedSigns}
                themName={selected.nickname}
                level={selectedLevel}
                partnerPicker={
                  <select
                    aria-label="Choose a saved reading"
                    value={selected.id}
                    onChange={e => {
                      const index = readings.findIndex(r => r.id === e.target.value);
                      setPartner(index >= 0 ? index : 0);
                    }}
                  >
                    {readings.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.nickname} · {r.score}%
                      </option>
                    ))}
                  </select>
                }
              />
            ) : (
              <p className="lede">
                No saved compatibility readings yet. Save your birth chart,
                then create your first reading to see Kaiser's verdict.
              </p>
            )}
          </div>
        </section>

        <section className="block" id="menagerie">
          <div className="wrap">
            <div className="eyebrow">Concept pass 01 · awaiting edits</div>
            <h2 className="title">The menagerie</h2>
            <p className="lede">All 364 creatures from the bestiary sheet. Filter by sign to find every creature a sign appears in.</p>
            <Menagerie activeSigns={studio.signs} />
          </div>
        </section>
      </main>
      {window.location.pathname === '/reset-password'
        && <ResetPassword onClose={() => {
          window.history.replaceState({}, '', '/');
          setShowAccount(true);
        }} />}
      {showAccount && <AccountDialog onClose={() => setShowAccount(false)} />}
      <footer><div className="wrap"><span>gurl. Readings are comedy, not science. Kaiser is not licensed in any state.</span><span className="mono">Ecliptic of date · tropical zodiac</span></div></footer>
    </>
  );
}
