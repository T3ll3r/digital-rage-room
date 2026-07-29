import { useEffect, useMemo, useRef, useState } from 'react'
import { ACTIONS, MEMES, PRESETS, TARGETS } from './data'
import { searchTopicImage } from './imageSearch'
import './App.css'

function playImpact(kind) {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return

  const context = new AudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = kind === 'zap' ? 'square' : 'sawtooth'
  oscillator.frequency.setValueAtTime(kind === 'smash' ? 90 : 180, context.currentTime)
  oscillator.frequency.exponentialRampToValueAtTime(42, context.currentTime + 0.18)
  gain.gain.setValueAtTime(0.08, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.2)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.2)
}

function App({ searchImage = searchTopicImage }) {
  const [draftTopic, setDraftTopic] = useState('printer errors')
  const [topic, setTopic] = useState('printer errors')
  const [targetIndex, setTargetIndex] = useState(0)
  const [internetTarget, setInternetTarget] = useState(null)
  const [memeIndex, setMemeIndex] = useState(0)
  const [imageLoading, setImageLoading] = useState(false)
  const [rage, setRage] = useState(12)
  const [effect, setEffect] = useState('idle')
  const [effectRun, setEffectRun] = useState(0)
  const [status, setStatus] = useState('TARGET ACQUIRED. TAKE A DEEP BREATH—OR DON’T.')
  const [soundOn, setSoundOn] = useState(true)
  const [reducedMotion, setReducedMotion] = useState(false)
  const resetTimer = useRef(null)

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const target = internetTarget ?? TARGETS[targetIndex]
  const meme = MEMES[memeIndex]
  const rootCause = draftTopic.trim() || topic
  const shards = useMemo(() => Array.from({ length: 16 }, (_, index) => index), [])

  async function acquireInternetTarget(subject) {
    setImageLoading(true)
    setStatus(`SCANNING THE INTERNET FOR SAFE ${subject.toUpperCase()} HUMOR...`)
    try {
      const result = await searchImage(subject)
      if (!result) throw new Error('No image result returned.')
      setInternetTarget(result)
      setMemeIndex(Math.floor(Math.random() * MEMES.length))
      setStatus(`INTERNET TARGET ACQUIRED: ${subject.toUpperCase()}.`)
    } catch (error) {
      setInternetTarget(null)
      setTargetIndex((index) => (index + 1) % TARGETS.length)
      setMemeIndex(Math.floor(Math.random() * MEMES.length))
      const reason = error instanceof Error ? error.message : 'Internet search failed.'
      setStatus(`SEARCH FAILED: ${reason.toUpperCase()} CURATED RESERVE TARGET DEPLOYED.`)
    } finally {
      setImageLoading(false)
    }
  }

  function loadTopic(event) {
    event.preventDefault()
    const nextTopic = draftTopic.trim() || 'that one mysterious production issue'
    setTopic(nextTopic)
    setEffect('idle')
    void acquireInternetTarget(nextTopic)
  }

  function choosePreset(nextTopic) {
    setDraftTopic(nextTopic)
    setTopic(nextTopic)
    setEffect('idle')
    void acquireInternetTarget(nextTopic)
  }

  function react(action) {
    setEffectRun((run) => run + 1)

    if (rage + action.points >= 100) {
      clearTimeout(resetTimer.current)
      setRage(100)
      setEffect('nuke')
      setStatus('MAXIMUM RAGE REACHED. INITIATING NUCLEAR PIXEL RESET.')
      if (soundOn) playImpact('nuke')
      resetTimer.current = setTimeout(() => {
        setRage(0)
        setInternetTarget(null)
        setTargetIndex(Math.floor(Math.random() * TARGETS.length))
        setMemeIndex(Math.floor(Math.random() * MEMES.length))
        setEffect('idle')
        setStatus('BLAST COMPLETE. RAGE RESET. FRESH TARGET ACQUIRED.')
        void acquireInternetTarget(topic)
      }, 1800)
      return
    }

    setEffect(action.id)
    setRage((value) => value + action.points)
    setStatus(action.message)
    if (soundOn) playImpact(action.id)
  }

  function nextTarget() {
    setEffect('idle')
    void acquireInternetTarget(topic)
  }

  function resetRoom() {
    clearTimeout(resetTimer.current)
    setEffect('idle')
    setRage(12)
    setStatus('ROOM RESET. THE SERVERS REMAIN AFRAID.')
  }

  return (
    <div
      className={`app-shell${reducedMotion ? ' reduce-motion' : ''}`}
      data-testid="app-shell"
    >
      <header className="topbar">
        <a className="brand" href="#main" aria-label="Digital Rage Room home">
          <span className="brand-mark" aria-hidden="true">★</span>
          <span>DIGITAL RAGE ROOM <small>ARMY FIELD EDITION</small></span>
        </a>
        <div className="utility-controls" aria-label="Experience controls">
          <button
            className="utility-button"
            type="button"
            aria-label="Sound effects"
            aria-pressed={soundOn}
            onClick={() => setSoundOn((value) => !value)}
          >
            SOUND {soundOn ? 'ON' : 'OFF'}
          </button>
          <button
            className="utility-button"
            type="button"
            aria-label="Reduced motion"
            aria-pressed={reducedMotion}
            onClick={() => setReducedMotion((value) => !value)}
          >
            MOTION {reducedMotion ? 'LOW' : 'FULL'}
          </button>
        </div>
      </header>

      <main id="main" className="workspace">
        <aside className="control-panel" aria-labelledby="control-heading">
          <div className="eyebrow">FIELD OPERATIONS CONSOLE / MWR-01</div>
          <h1 id="control-heading">Identify the threat to morale.</h1>
          <p className="intro">No paperwork. No formation. Acquire the problem and apply excessive digital force.</p>

          <form onSubmit={loadTopic} className="topic-form">
            <label htmlFor="topic">What broke your spirit?</label>
            <div className="input-row">
              <input
                id="topic"
                value={draftTopic}
                onChange={(event) => setDraftTopic(event.target.value)}
                maxLength={54}
                autoComplete="off"
              />
              <button className="load-button" type="submit" disabled={imageLoading}>
                {imageLoading ? 'SCANNING...' : 'ACQUIRE TARGET'}
              </button>
            </div>
          </form>

          <div className="preset-block">
            <span className="micro-label">KNOWN HOSTILES</span>
            <div className="preset-list">
              {PRESETS.map((preset) => (
                <button
                  type="button"
                  className={topic === preset ? 'preset active' : 'preset'}
                  key={preset}
                  onClick={() => choosePreset(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="rage-readout">
            <div className="rage-label">
              <span>RAGE CAPACITY</span>
              <strong>{rage}%</strong>
            </div>
            <div
              className="rage-track"
              role="progressbar"
              aria-label="Rage capacity"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={rage}
            >
              <div className="rage-fill" style={{ width: `${rage}%` }} />
            </div>
            <p>{rage >= 90 ? 'Critical. Consider stepping away from the keyboard.' : 'Within acceptable operational limits.'}</p>
          </div>

          <button className="reset-button" type="button" onClick={resetRoom}>↺ RESET FIELD CONSOLE</button>
        </aside>

        <section className="rage-room" aria-labelledby="target-label">
          <div className="stage-toolbar">
            <div>
              <span className="live-dot" aria-hidden="true" />
              <span id="target-label">
                ACTIVE OBJECTIVE: <strong>{topic}</strong> · {internetTarget ? 'INTERNET SEARCH' : `RESERVE ${targetIndex + 1}/${TARGETS.length}`}
              </span>
            </div>
            <button type="button" className="next-button" onClick={nextTarget} disabled={imageLoading}>
              {imageLoading ? 'SCANNING...' : 'NEXT INTERNET TARGET →'}
            </button>
          </div>

          <div
            className="target-stage"
            data-testid="target-stage"
            data-effect={effect}
            key={`${target.src}-${effectRun}`}
          >
            <div className="warning-tape warning-top" aria-hidden="true">CAUTION // EMOTIONAL PACKETS IN TRANSIT //</div>
            <div className="image-wrap">
              <img
                src={target.src}
                alt={`A ${target.kind} representing ${topic}`}
                onError={() => {
                  if (internetTarget) {
                    setInternetTarget(null)
                    setTargetIndex((index) => (index + 1) % TARGETS.length)
                    setStatus('INTERNET IMAGE FAILED TO LOAD. CURATED RESERVE DEPLOYED.')
                  }
                }}
              />
              <div className="target-caption">
                <small>ROOT CAUSE ANALYSIS</small>
                <strong data-testid="root-cause">{rootCause.toUpperCase()}</strong>
              </div>
              <div className="meme-stamp">
                <small>FIELD MEME #{memeIndex + 1} / {MEMES.length}</small>
                <strong data-testid="army-meme">{meme}</strong>
              </div>
              <div className="heat" aria-hidden="true" />
              <div className="fire" aria-hidden="true">
                {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
              </div>
              <div className="zap-flash" aria-hidden="true">ϟ</div>
              <div className="nuke-blast" aria-hidden="true">
                <i className="nuke-flash" />
                <i className="shockwave shockwave-one" />
                <i className="shockwave shockwave-two" />
                <div className="mushroom-cloud">
                  <b />
                  <span />
                  <em />
                </div>
              </div>
              <div className="debug-swarm" aria-hidden="true">
                {['BUG', '404', 'NULL', 'SEGFAULT', 'WHY'].map((bug) => <b key={bug}>{bug}</b>)}
              </div>
              <div className="shards" aria-hidden="true">
                {shards.map((shard) => (
                  <i
                    key={shard}
                    style={{ '--x': shard % 4, '--y': Math.floor(shard / 4), backgroundImage: `url(${target.src})` }}
                  />
                ))}
              </div>
            </div>
            <p className="credit">
              {target.pageUrl ? (
                <a href={target.pageUrl} target="_blank" rel="noreferrer">{target.credit}</a>
              ) : target.credit}
            </p>
          </div>

          <div className="status-line" role="status" aria-live="polite">
            <span>ROOM_LOG&gt;</span> {status}
          </div>

          <div className="action-grid" aria-label="Rage reactions">
            {ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                className={`action action-${action.id}`}
                onClick={() => react(action)}
              >
                <span className="action-icon" aria-hidden="true">{action.icon}</span>
                <span>{action.label}</span>
                <small>+{action.points} RAGE</small>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer>
        <span>UNOFFICIAL MORALE TOOL · NOT AFFILIATED WITH THE DEPARTMENT OF DEFENSE.</span>
        <span>NO PERSONNEL, EQUIPMENT, OR PIXELS WERE ACTUALLY HARMED.</span>
      </footer>
    </div>
  )
}

export default App
