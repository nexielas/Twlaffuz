import { useState, useEffect, useRef } from 'react'

const LANG_DATA = {
  de: {
    name: 'Almanca', flag: '🇩🇪', voice_lang: 'de-DE',
    color: '#e8c547', colorBg: 'rgba(232,197,71,0.08)', colorBorder: 'rgba(232,197,71,0.3)',
    placeholder: 'Almanca metin yazın... z.B. Guten Morgen!',
    examples: ['Guten Morgen!', 'Wie heißen Sie?', 'Ich möchte Deutsch lernen.', 'Das Wetter ist schön heute.', 'Entschuldigung, wo ist der Bahnhof?', 'Die Straße ist sehr lang.'],
    tip: 'Almanca\'da <b>ä, ö, ü</b> (Umlaut) sesleri ve <b>ch, sch, ß</b> kombinasyonları en kritik noktalardır. Vurgu genellikle ilk hecededir.',
    rules: [
      { title: 'Ünlüler & Umlaute', items: [
        { key: 'ä', val: '"e" ile "a" arası geniş ses [ɛ] — Bär (ayı)' },
        { key: 'ö', val: 'Türkçe "ö" ile aynı [ø] — schön (güzel)' },
        { key: 'ü', val: 'Türkçe "ü" ile aynı [y] — über (üzerinde)' },
        { key: 'ie', val: 'Uzun "i" [iː] — Liebe (sevgi)' },
        { key: 'ei', val: '"ay" gibi [aɪ] — Stein (taş)' },
        { key: 'eu/äu', val: '"oy" gibi [ɔʏ] — Feuer (ateş)' },
      ]},
      { title: 'Ünsüzler', items: [
        { key: 'ch', val: 'a/o/u sonrası gırtlak [x]; i/e sonrası yumuşak [ç] — Bach / ich' },
        { key: 'sch', val: 'Türkçe "ş" [ʃ] — Schule (okul)' },
        { key: 'ß', val: 'Uzun "ss" — Straße (cadde)' },
        { key: 'sp/st', val: 'Kelime başında "şp/şt" — sprechen, Stadt' },
        { key: 'w', val: 'İngilizce "v" gibi [v] — Wasser (su)' },
        { key: 'z', val: '"ts" gibi [ts] — Zeit (zaman)' },
        { key: 'j', val: 'Türkçe "y" gibi [j] — Jahr (yıl)' },
      ]},
      { title: 'Vurgu & Kurallar', items: [
        { key: 'Vurgu', val: 'Alman kökenli kelimelerde genellikle ilk hece' },
        { key: 'Sertleşme', val: 'Kelime sonunda b→p, d→t, g→k' },
        { key: 'Uzunluk', val: 'Tek ünsüz öncesi uzun, çift ünsüz öncesi kısa ünlü' },
      ]},
    ],
  },
  ru: {
    name: 'Rusça', flag: '🇷🇺', voice_lang: 'ru-RU',
    color: '#c7473a', colorBg: 'rgba(199,71,58,0.08)', colorBorder: 'rgba(199,71,58,0.3)',
    placeholder: 'Rusça metin yazın... Например: Привет!',
    examples: ['Привет! Как дела?', 'Меня зовут...', 'Я хочу учить русский язык.', 'Где находится метро?', 'Спасибо большое!', 'Пожалуйста, говорите медленнее.'],
    tip: 'Rusçada <b>vurgu her şeyi değiştirir!</b> Vurgusuz "о" → "a", vurgusuz "е" → "i" gibi okunur. Yumuşak işaret <b>ь</b> ünsüzü palatalleştirir.',
    rules: [
      { title: 'Ünlüler & Redüksiyon', items: [
        { key: 'о', val: "Vurguluysa 'o'; vurgusuzsa 'a' — молоко [mɐlɐkó]" },
        { key: 'е', val: "Vurguluysa 'ye'; vurgusuzsa 'yi' — вечер" },
        { key: 'ё', val: "Her zaman vurgulu 'yo' [jo] — всё (her şey)" },
        { key: 'ы', val: 'Dil geri "ı" benzeri [ɨ] — рыба (balık)' },
        { key: 'я', val: "Vurguluysa 'ya'; vurgusuzsa 'yi' — язык" },
      ]},
      { title: 'Ünsüzler & Yumuşama', items: [
        { key: 'ь', val: 'Yumuşak işaret: ünsüzü palatalleştirir — день [dʲenʲ]' },
        { key: 'ъ', val: 'Sert işaret: yumuşamayı engeller — объект' },
        { key: 'щ', val: "Uzun yumuşak 'şç' [ɕː] — щи" },
        { key: 'ц', val: '"ts" [ts] — цвет (renk)' },
        { key: 'х', val: 'Gırtlaktan [x] — хлеб (ekmek)' },
        { key: 'ж/ш', val: 'Her zaman sert — жить, школа' },
      ]},
      { title: 'Vurgu & Kurallar', items: [
        { key: 'Vurgu', val: 'Sabit değil! Çekime göre değişir — ezberle' },
        { key: 'Sertleşme', val: 'Kelime sonunda б→п, д→т, г→к, з→с' },
        { key: '-ого', val: '"-ого/-его" eklerinde г → "v" okunur' },
      ]},
    ],
  },
}

const getSynth = () => (typeof window !== 'undefined' && 'speechSynthesis' in window) ? window.speechSynthesis : null
const getVoices = () => getSynth()?.getVoices() ?? []

export default function App() {
  const [lang, setLang] = useState('de')
  const [text, setText] = useState('')
  const [speed, setSpeed] = useState(0.8)
  const [speaking, setSpeaking] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [waveHeights, setWaveHeights] = useState(Array(48).fill(4))
  const [speechSupported, setSpeechSupported] = useState(false)
  const [speechError, setSpeechError] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const waveRef = useRef(null)
  const data = LANG_DATA[lang]

  useEffect(() => {
    const s = getSynth()
    if (!s) return
    setSpeechSupported(true)
    const onChanged = () => { s.getVoices() }
    s.addEventListener('voiceschanged', onChanged)
    s.getVoices()
    return () => {
      s.removeEventListener('voiceschanged', onChanged)
      s.cancel()
      clearInterval(waveRef.current)
    }
  }, [])

  useEffect(() => {
    getSynth()?.cancel()
    setSpeaking(false)
    setSpeechError(null)
    stopWave()
    setAnalysis(null)
  }, [lang])

  const startWave = () => {
    clearInterval(waveRef.current)
    waveRef.current = setInterval(() => {
      setWaveHeights(Array(48).fill(0).map(() => Math.random() * 28 + 4))
    }, 90)
  }

  const stopWave = () => {
    clearInterval(waveRef.current)
    waveRef.current = null
    setWaveHeights(Array(48).fill(4))
  }

  const speak = () => {
    const s = getSynth()
    if (!s || !text.trim()) return
    setSpeechError(null)
    s.cancel()
    setTimeout(() => {
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = data.voice_lang
      utt.rate = speed
      utt.pitch = 1.0
      utt.volume = 1.0
      const voices = getVoices()
      const chosen = voices.find(v => v.lang === data.voice_lang)
        || voices.find(v => v.lang.startsWith(lang === 'de' ? 'de' : 'ru'))
        || null
      if (chosen) utt.voice = chosen
      utt.onstart = () => { setSpeaking(true); startWave() }
      utt.onend = () => { setSpeaking(false); stopWave() }
      utt.onerror = (e) => {
        setSpeaking(false)
        stopWave()
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          setSpeechError(`Ses hatası: ${e.error}`)
        }
      }
      s.speak(utt)
    }, 150)
  }

  const stop = () => {
    getSynth()?.cancel()
    setSpeaking(false)
    stopWave()
  }

  const analyze = async () => {
    if (!text.trim()) return
    if (!apiKey.trim()) { setShowApiKey(true); return }
    setAnalyzing(true)
    setAnalysis(null)
    setShowApiKey(false)
    const langName = lang === 'de' ? 'Almanca (Deutsch)' : 'Rusça (Русский)'
    const prompt = `Aşağıdaki ${langName} metnini Türkçe konuşan birine kelime kelime açıkla.\n\nMetin: "${text}"\n\nHer kelime için:\n- IPA fonetik yazılışı\n- Türkçe harflerle yaklaşık okunuşu (köşeli parantez içinde)\n- Dikkat edilmesi gereken özel ses varsa belirt\n- Vurgu yerini büyük harf ile göster\n\nKısa, pratik ve net yaz. Emoji kullanabilirsin.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({ model: 'claude-opus-4-6', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
      })
      const json = await res.json()
      if (json.error) setAnalysis(`⚠️ API Hatası: ${json.error.message}`)
      else setAnalysis(json.content?.[0]?.text || 'Sonuç alınamadı.')
    } catch {
      setAnalysis('⚠️ Bağlantı hatası. API anahtarınızı kontrol edin.')
    }
    setAnalyzing(false)
  }

  const ac = data.color

  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', color: '#e8e4d9', fontFamily: 'Georgia, serif', paddingBottom: 60 }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '56px 56px' }} />
      <div style={{ position: 'relative', maxWidth: 860, margin: '0 auto', padding: '36px 20px' }}>

        {/* Başlık */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 5, color: '#4a4a5a', marginBottom: 14, textTransform: 'uppercase' }}>◈ Dil Akademisi</div>
          <h1 style={{ fontSize: 'clamp(32px,6vw,58px)', fontWeight: 900, letterSpacing: -1, margin: '0 0 10px', lineHeight: 1 }}>Telaffuz Ustası</h1>
          <p style={{ color: '#7a7a8c', fontSize: 17, fontStyle: 'italic' }}>Almanca & Rusça için doğru sesletim rehberi</p>
        </div>

        {/* Dil sekmeleri */}
        <div style={{ display: 'flex', border: '1px solid #2a2a3a', marginBottom: 28, overflow: 'hidden' }}>
          {['de', 'ru'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{ flex: 1, padding: '15px 10px', background: lang === l ? LANG_DATA[l].colorBg : 'transparent', border: 'none', borderBottom: lang === l ? `2px solid ${LANG_DATA[l].color}` : '2px solid transparent', color: lang === l ? LANG_DATA[l].color : '#5a5a6a', fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}>
              {LANG_DATA[l].flag} &nbsp; {LANG_DATA[l].name}
            </button>
          ))}
        </div>

        {/* Ses desteği yok uyarısı */}
        {!speechSupported && (
          <div style={{ background: 'rgba(232,197,71,0.08)', border: '1px solid rgba(232,197,71,0.3)', padding: '12px 18px', marginBottom: 20, fontSize: 13, color: '#e8c547', fontFamily: 'monospace' }}>
            ⚠️ Tarayıcınız seslendirmeyi desteklemiyor. Chrome veya Edge kullanın.
          </div>
        )}

        {/* Telaffuz Kuralları */}
        <div style={{ border: '1px solid #2a2a3a', marginBottom: 22, background: '#111118' }}>
          <div onClick={() => setRulesOpen(o => !o)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', cursor: 'pointer', borderBottom: rulesOpen ? '1px solid #2a2a3a' : 'none' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, color: '#6a6a7a', textTransform: 'uppercase' }}>📖 &nbsp; Telaffuz Kuralları</span>
            <span style={{ color: ac, fontSize: 20, display: 'inline-block', transform: rulesOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s' }}>+</span>
          </div>
          {rulesOpen && (
            <div style={{ padding: '20px 22px' }}>
              {data.rules.map((group, gi) => (
                <div key={gi} style={{ marginBottom: gi < data.rules.length - 1 ? 22 : 0 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: ac, borderBottom: '1px solid #2a2a3a', paddingBottom: 7, marginBottom: 12 }}>{group.title}</div>
                  {group.items.map((item, ii) => (
                    <div key={ii} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 9 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, minWidth: 64, padding: '2px 8px', border: `1px solid ${data.colorBorder}`, color: ac, textAlign: 'center', flexShrink: 0 }}>{item.key}</span>
                      <span style={{ color: '#8a8a9a', fontSize: 14, lineHeight: 1.55 }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Örnek cümleler */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 4, color: '#4a4a5a', textTransform: 'uppercase', marginBottom: 10 }}>Örnek Cümleler</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.examples.map((ex, i) => (
              <button key={i} onClick={() => setText(ex)} style={{ padding: '6px 14px', border: '1px solid #2a2a3a', background: 'transparent', color: '#8a8a9a', fontFamily: 'Georgia, serif', fontSize: 14, cursor: 'pointer', fontStyle: 'italic', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = ac; e.currentTarget.style.color = ac }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a3a'; e.currentTarget.style.color = '#8a8a9a' }}
              >{ex}</button>
            ))}
          </div>
        </div>

        {/* Metin alanı */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 4, color: '#4a4a5a', textTransform: 'uppercase', marginBottom: 9 }}>Metin Girin</div>
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder={data.placeholder} rows={4}
            style={{ width: '100%', background: '#111118', border: `1px solid ${text ? data.colorBorder : '#2a2a3a'}`, color: '#e8e4d9', fontFamily: 'Georgia, serif', fontSize: 22, lineHeight: 1.6, padding: '20px 22px', resize: 'vertical', outline: 'none', transition: 'border-color 0.3s', letterSpacing: 0.5, boxSizing: 'border-box' }} />
          <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#3a3a4a', textAlign: 'right', marginTop: 5 }}>{text.length} karakter</div>
        </div>

        {speechError && (
          <div style={{ background: 'rgba(199,71,58,0.1)', border: '1px solid rgba(199,71,58,0.3)', padding: '10px 16px', marginBottom: 14, fontSize: 13, color: '#e8a09a', fontFamily: 'monospace' }}>
            ⚠️ {speechError}
          </div>
        )}

        {/* Kontroller */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          <button onClick={speak} disabled={speaking || !text.trim() || !speechSupported} style={{ padding: '13px 22px', border: `1px solid ${ac}`, background: 'transparent', color: ac, fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', opacity: !text.trim() || !speechSupported ? 0.35 : 1, transition: 'all 0.25s' }}>▶ &nbsp; Seslendir</button>
          <button onClick={stop} disabled={!speaking} style={{ padding: '13px 22px', border: '1px solid #2a2a3a', background: 'transparent', color: speaking ? '#e8e4d9' : '#3a3a4a', fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.25s' }}>■ &nbsp; Durdur</button>
          <button onClick={analyze} disabled={analyzing || !text.trim()} style={{ padding: '13px 22px', border: '1px solid #2a2a3a', background: 'transparent', color: analyzing ? ac : '#8a8a9a', fontFamily: 'monospace', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer', opacity: !text.trim() ? 0.35 : 1, transition: 'all 0.25s' }}>
            {analyzing ? '⋯ Analiz...' : '◈ AI Analiz'}
          </button>
          {speaking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', border: `1px solid ${ac}`, color: ac, fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ac, animation: 'pulse 0.6s infinite' }} />
              Seslendiriliyor
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: '#4a4a5a', letterSpacing: 3, textTransform: 'uppercase' }}>Hız</span>
            <input type="range" min={0.4} max={1.2} step={0.1} value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} style={{ width: 90 }} />
            <span style={{ fontFamily: 'monospace', fontSize: 9, color: ac }}>{speed.toFixed(1)}×</span>
          </div>
        </div>

        {/* Dalga */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 40, marginBottom: 20 }}>
          {waveHeights.map((h, i) => (
            <div key={i} style={{ width: 3, height: h, flexShrink: 0, background: speaking ? ac : '#2a2a3a', transition: speaking ? 'height 0.09s' : 'height 0.4s, background 0.3s', opacity: speaking ? 0.85 : 0.4 }} />
          ))}
        </div>

        {/* API Key */}
        {showApiKey && (
          <div style={{ border: '1px solid #2a2a3a', background: '#111118', marginBottom: 20, padding: '20px 22px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 4, color: '#5a5a6a', textTransform: 'uppercase', marginBottom: 12 }}>🔑 &nbsp; Anthropic API Anahtarı</div>
            <p style={{ color: '#7a7a8c', fontSize: 14, marginBottom: 14, lineHeight: 1.6 }}>
              AI Analiz için API anahtarınızı girin.{' '}
              <a href="https://console.anthropic.com" target="_blank" rel="noreferrer" style={{ color: ac }}>console.anthropic.com</a>
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." onKeyDown={e => e.key === 'Enter' && analyze()}
                style={{ flex: 1, background: '#0a0a0f', border: '1px solid #3a3a4a', color: '#e8e4d9', fontFamily: 'monospace', fontSize: 13, padding: '10px 14px', outline: 'none' }} />
              <button onClick={analyze} style={{ padding: '10px 20px', border: `1px solid ${ac}`, background: 'transparent', color: ac, fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}>Analiz Et</button>
            </div>
          </div>
        )}

        {/* Analiz */}
        {(analysis || analyzing) && (
          <div style={{ border: '1px solid #2a2a3a', background: '#111118', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 20px', borderBottom: '1px solid #2a2a3a' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 4, color: '#5a5a6a', textTransform: 'uppercase' }}>◈ &nbsp; AI Telaffuz Analizi</span>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: analyzing ? ac : '#3a3a4a', animation: analyzing ? 'pulse 0.9s infinite' : 'none' }} />
            </div>
            <div style={{ padding: '22px', fontSize: 15, lineHeight: 1.85, color: '#c8c4b9', whiteSpace: 'pre-wrap' }}>
              {analyzing ? 'Analiz ediliyor...' : analysis}
            </div>
          </div>
        )}

        {/* İpucu */}
        <div style={{ background: '#1a1a24', border: '1px solid #2a2a3a', padding: '18px 22px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 9, letterSpacing: 4, color: ac, textTransform: 'uppercase', marginBottom: 10 }}>💡 {data.name} İpucu</div>
          <div style={{ fontSize: 15, lineHeight: 1.75, color: '#8a8a9a' }} dangerouslySetInnerHTML={{ __html: data.tip }} />
        </div>

        <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 9, letterSpacing: 3, color: '#3a3a4a', textTransform: 'uppercase', marginTop: 28 }}>
          Telaffuz Ustası · Web Speech API · Claude AI
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#2a2a3a}`}</style>
    </div>
  )
}
