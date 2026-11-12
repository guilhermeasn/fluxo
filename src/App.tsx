import { useEffect, useMemo, useRef, useState } from 'react'
import { levels } from './levels';

const repetitions = 5

function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [phaseIndex, setPhaseIndex] = useState(0)
  const [value, setValue] = useState('')
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const level = levels[levelIndex]
  const item = level.items[phaseIndex]
  const target = level.repeatItems ? Array.from({ length: repetitions }, () => item).join(' ') : item
  const complete = value === target
  const lastPhase = phaseIndex === level.items.length - 1
  const lastLevel = levelIndex === levels.length - 1

  useEffect(() => {
    if (!startedAt || complete) return
    const interval = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(interval)
  }, [startedAt, complete])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Enter' || !complete || (lastPhase && lastLevel)) return
      event.preventDefault()
      goToNextExercise()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [complete, lastLevel, lastPhase, levelIndex, phaseIndex])

  const stats = useMemo(() => {
    const elapsedMinutes = startedAt ? Math.max((now - startedAt) / 60000, 1 / 60) : 0
    const correct = value.split('').filter((char, index) => char === target[index]).length
    const accuracy = value.length ? Math.round((correct / value.length) * 100) : 100
    const wpm = elapsedMinutes ? Math.round((value.length / 5) / elapsedMinutes) : 0
    return { accuracy, wpm, elapsed: startedAt ? Math.floor((now - startedAt) / 1000) : 0 }
  }, [now, startedAt, target, value])

  function reset(nextLevel = levelIndex, nextPhase = phaseIndex) {
    setLevelIndex(nextLevel)
    setPhaseIndex(nextPhase)
    setValue('')
    setStartedAt(null)
    setNow(Date.now())
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function goToNextExercise() {
    if (!lastPhase) {
      reset(levelIndex, phaseIndex + 1)
      return
    }

    if (!lastLevel) reset(levelIndex + 1, 0)
  }

  function handleChange(nextValue: string) {
    if (!startedAt && nextValue) setStartedAt(Date.now())
    if (nextValue.length <= target.length) setValue(nextValue)
  }

  const elapsedText = `${String(Math.floor(stats.elapsed / 60)).padStart(2, '0')}:${String(stats.elapsed % 60).padStart(2, '0')}`

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">fluxo<span>.</span></a>
        <div className="streak">🔥 3 dias de ritmo</div>
      </header>

      <section className="hero">
        <p className="eyebrow">NÍVEL {String(levelIndex + 1).padStart(2, '0')} · {level.name.toUpperCase()}</p>
        <h1>Encontre o seu ritmo.</h1>
        <p className="subtitle">{level.description}</p>
      </section>

      <section className="practice-card" aria-label="Exercício de digitação">
        <div className="level-progress" aria-label={`Fase ${phaseIndex + 1} de ${level.items.length}`}>
          <div>
            <span>FASE {String(phaseIndex + 1).padStart(2, '0')}</span>
            <b>{level.itemLabel}: {item}</b>
          </div>
          <span>{phaseIndex + 1}/{level.items.length}</span>
        </div>
        <div className="progress-track" aria-hidden="true"><i style={{ width: `${((phaseIndex + 1) / level.items.length) * 100}%` }} /></div>
        <div className="lesson-navigation">
          <label>
            nível
            <select value={levelIndex} onChange={(event) => reset(Number(event.target.value), 0)}>
              {levels.map((option, index) => <option key={option.name} value={index}>nível {index + 1} · {option.name}</option>)}
            </select>
          </label>
          <label>
            fase
            <select value={phaseIndex} onChange={(event) => reset(levelIndex, Number(event.target.value))}>
              {level.items.map((option, index) => <option key={option} value={index}>fase {String(index + 1).padStart(2, '0')} · {option}</option>)}
            </select>
          </label>
        </div>
        <div className="metrics">
          <div><span>VELOCIDADE</span><strong>{stats.wpm}<small> ppm</small></strong></div>
          <div><span>PRECISÃO</span><strong>{stats.accuracy}<small>%</small></strong></div>
          <div><span>TEMPO</span><strong>{elapsedText}</strong></div>
        </div>

        <div className="lesson-text" onClick={() => inputRef.current?.focus()}>
          {target.split('').map((char, index) => {
            const typed = value[index]
            const state = typed === undefined ? (index === value.length ? 'current' : '') : typed === char ? 'correct' : 'incorrect'
            return <span className={state} key={`${char}-${index}`}>{char}</span>
          })}
        </div>

        <label className="input-label" htmlFor="typing-input">Digite o texto acima</label>
        <input
          ref={inputRef}
          id="typing-input"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          disabled={complete}
          placeholder="Comece quando estiver pronto…"
        />

        {complete ? (
          <div className="complete"><span>✓</span><div><b>{lastPhase ? 'Nível concluído!' : 'Fase concluída!'}</b><p>{lastPhase ? `Você praticou todos os exercícios do nível ${levelIndex + 1}.` : `A próxima ${level.itemLabel} vai treinar novas combinações.`} Precisão: {stats.accuracy}%.</p></div></div>
        ) : <p className="hint">Use todos os dedos e mantenha os olhos no texto.</p>}

        <div className="actions">
          <button className="secondary" type="button" onClick={() => reset()}>Recomeçar</button>
          {complete && !lastPhase && <button className="primary" type="button" onClick={goToNextExercise}>Próxima {level.itemLabel} <kbd>Enter</kbd> →</button>}
          {complete && lastPhase && !lastLevel && <button className="primary" type="button" onClick={goToNextExercise}>Ir para o nível {levelIndex + 2} <kbd>Enter</kbd> →</button>}
          {complete && lastPhase && lastLevel && <button className="primary" type="button" onClick={() => reset(levelIndex, 0)}>Refazer nível →</button>}
        </div>
      </section>
    </main>
  )
}

export default App
