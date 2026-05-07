import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../hooks/useApi'
import { useStore } from '../store/useStore'
import { speak } from '../lib/tts'

const SUBJECTS = [
  { id: 'farsi', label: 'فارسی', emoji: '📖', color: '#FF6584' },
  { id: 'math', label: 'ریاضی', emoji: '🔢', color: '#6C63FF' },
  { id: 'science', label: 'علوم', emoji: '🌱', color: '#06D6A0' },
  { id: 'quran', label: 'قرآن', emoji: '📿', color: '#FFB703' },
  { id: 'writing', label: 'نگارش', emoji: '✏️', color: '#4ECDC4' },
]

// --- Farsi Learning ---
const FALLBACK_ALPHABET = [
  {letter:'آ',name:'آ',word:'آب',emoji:'💧'},{letter:'ا',name:'الف',word:'انار',emoji:'🌿'},
  {letter:'ب',name:'بِ',word:'بابا',emoji:'👨'},{letter:'پ',name:'پِ',word:'پرنده',emoji:'🐦'},
  {letter:'ت',name:'تِ',word:'تاب',emoji:'🎠'},{letter:'ث',name:'ثِ',word:'ثروت',emoji:'💰'},
  {letter:'ج',name:'جیم',word:'جنگل',emoji:'🌲'},{letter:'چ',name:'چِ',word:'چراغ',emoji:'💡'},
  {letter:'ح',name:'حِ',word:'حیوان',emoji:'🐾'},{letter:'خ',name:'خِ',word:'خرس',emoji:'🐻'},
  {letter:'د',name:'دال',word:'درخت',emoji:'🌳'},{letter:'ذ',name:'ذال',word:'ذرت',emoji:'🌽'},
  {letter:'ر',name:'رِ',word:'رنگ',emoji:'🎨'},{letter:'ز',name:'زِ',word:'زنبور',emoji:'🐝'},
  {letter:'ژ',name:'ژِ',word:'ژاله',emoji:'🌧️'},{letter:'س',name:'سین',word:'سیب',emoji:'🍎'},
  {letter:'ش',name:'شین',word:'شیر',emoji:'🦁'},{letter:'ص',name:'صاد',word:'صبح',emoji:'🌅'},
  {letter:'ض',name:'ضاد',word:'ضربه',emoji:'👊'},{letter:'ط',name:'طا',word:'طلا',emoji:'🥇'},
  {letter:'ظ',name:'ظا',word:'ظرف',emoji:'🍽️'},{letter:'ع',name:'عین',word:'عقاب',emoji:'🦅'},
  {letter:'غ',name:'غین',word:'غاز',emoji:'🦆'},{letter:'ف',name:'فِ',word:'فیل',emoji:'🐘'},
  {letter:'ق',name:'قاف',word:'قلم',emoji:'✏️'},{letter:'ک',name:'کاف',word:'کتاب',emoji:'📚'},
  {letter:'گ',name:'گاف',word:'گربه',emoji:'🐱'},{letter:'ل',name:'لام',word:'لاله',emoji:'🌷'},
  {letter:'م',name:'میم',word:'مامان',emoji:'👩'},{letter:'ن',name:'نون',word:'نان',emoji:'🍞'},
  {letter:'و',name:'واو',word:'ورزش',emoji:'⚽'},{letter:'ه',name:'هِ',word:'هدیه',emoji:'🎁'},
  {letter:'ی',name:'یِ',word:'یخ',emoji:'🧊'},
]

function speakText(text: string) {
  speak(text)
}

function FarsiLearn({ alphabet }: { alphabet: any[] }) {
  const [flipped, setFlipped] = useState<number | null>(null)
  const letters = alphabet.length > 0 ? alphabet : FALLBACK_ALPHABET

  return (
    <div>
      <p style={{ color: 'var(--text-light)', fontSize: 13, marginBottom: 14 }}>
        روی هر حرف بزن تا اسمش رو بشنوی 🔊
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {letters.map((item, i) => (
          <motion.div key={i} whileTap={{ scale: 0.92 }}
            onClick={() => { setFlipped(flipped === i ? null : i); speakText(item.name) }}
            style={{ borderRadius: 14, padding: '10px 6px', textAlign: 'center', cursor: 'pointer',
              background: flipped === i ? '#FF658420' : '#f7fafc',
              border: `2px solid ${flipped === i ? '#FF6584' : '#e2e8f0'}`,
              transition: 'all 0.2s' }}>
            <div style={{ fontSize: '1.6rem' }}>{item.emoji}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FF6584', lineHeight: 1.2 }}>{item.letter}</div>
            {flipped === i && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: '#FF6584', fontWeight: 600 }}>{item.word}</div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// --- Math Learning ---
const MATH_CONCEPTS = [
  { title: 'اعداد ۱ تا ۱۰', emoji: '🔢',
    items: ['۱ یک 🍎', '۲ دو 🍎🍎', '۳ سه 🍎🍎🍎', '۴ چهار 🍎🍎🍎🍎', '۵ پنج ✋',
            '۶ شش 🎲', '۷ هفت 🌈', '۸ هشت 🐙', '۹ نه 🎱', '۱۰ ده 🎯'] },
  { title: 'جمع ساده', emoji: '➕',
    items: ['۱ + ۱ = ۲', '۲ + ۳ = ۵', '۴ + ۱ = ۵', '۳ + ۳ = ۶', '۵ + ۲ = ۷',
            '۴ + ۴ = ۸', '۶ + ۳ = ۹', '۵ + ۵ = ۱۰'] },
  { title: 'تفریق ساده', emoji: '➖',
    items: ['۵ - ۱ = ۴', '۶ - ۲ = ۴', '۸ - ۳ = ۵', '۱۰ - ۴ = ۶', '۷ - ۳ = ۴',
            '۹ - ۵ = ۴', '۱۰ - ۶ = ۴', '۸ - ۸ = ۰'] },
  { title: 'اشکال هندسی', emoji: '🔷',
    items: ['مربع ⬛ ۴ ضلع مساوی', 'مستطیل ▬ ۴ ضلع', 'مثلث 🔺 ۳ ضلع',
            'دایره ⭕ بدون ضلع', 'لوزی 🔶 ۴ ضلع مورب', 'ذوزنقه ⏸️'] },
]

function MathLearn() {
  const [active, setActive] = useState(0)
  const concept = MATH_CONCEPTS[active]

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {MATH_CONCEPTS.map((c, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ padding: '8px 14px', borderRadius: 12, fontSize: 13, cursor: 'pointer', fontWeight: 600,
              background: active === i ? '#6C63FF' : '#f0eeff',
              color: active === i ? 'white' : '#6C63FF',
              border: `2px solid ${active === i ? '#6C63FF' : 'transparent'}` }}>
            {c.emoji} {c.title}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={active} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {concept.items.map((item, i) => (
              <motion.div key={i} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: i * 0.04 }}
                className="card" style={{ textAlign: 'center', padding: '14px 10px', fontSize: 15, fontWeight: 600, color: '#6C63FF' }}>
                {item}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// --- Science Learning ---
const FALLBACK_ANIMALS = [
  {name:'گربه',sound:'میو',type:'خانگی',image:'cat'},
  {name:'سگ',sound:'هاو',type:'خانگی',image:'dog'},
  {name:'مرغ',sound:'قدقد',type:'مزرعه',image:'chicken'},
  {name:'گاو',sound:'ماو',type:'مزرعه',image:'cow'},
  {name:'شیر',sound:'غرر',type:'وحشی',image:'lion'},
  {name:'ماهی',sound:'—',type:'آبزی',image:'fish'},
]
const FALLBACK_SEASONS = [
  {name:'بهار',emoji:'🌸',description:'گل‌ها شکوفه می‌زنند و هوا گرم می‌شود',facts:['ماه‌ها: فروردین، اردیبهشت، خرداد','طبیعت سبز می‌شود','مهاجرت پرندگان']},
  {name:'تابستان',emoji:'☀️',description:'گرم‌ترین فصل سال است',facts:['ماه‌ها: تیر، مرداد، شهریور','روزها بلند‌ترند','میوه‌های خوشمزه']},
  {name:'پاییز',emoji:'🍂',description:'برگ‌ها زرد و نارنجی می‌شوند',facts:['ماه‌ها: مهر، آبان، آذر','برگ‌ریزان درختان','شروع سال تحصیلی']},
  {name:'زمستان',emoji:'❄️',description:'سردترین فصل سال است',facts:['ماه‌ها: دی، بهمن، اسفند','برف می‌بارد','طبیعت استراحت می‌کند']},
]
const ANIMAL_EMOJIS: Record<string, string> = { cat:'🐱', dog:'🐶', chicken:'🐔', cow:'🐄', lion:'🦁', fish:'🐟' }

function ScienceLearn({ data }: { data: any }) {
  const [tab, setTab] = useState<'animals'|'seasons'|'plants'>('animals')
  const animals = data.animals?.length ? data.animals : FALLBACK_ANIMALS
  const seasons = data.seasons?.length ? data.seasons : FALLBACK_SEASONS

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['animals','🐾 حیوانات'],['seasons','🌸 فصل‌ها'],['plants','🌱 گیاهان']].map(([k,label]) => (
          <button key={k} onClick={() => setTab(k as any)}
            style={{ flex: 1, padding: '8px 4px', borderRadius: 12, fontSize: 12, cursor: 'pointer', fontWeight: 600,
              background: tab === k ? '#06D6A0' : '#f0fff9', color: tab === k ? 'white' : '#06D6A0',
              border: `2px solid ${tab === k ? '#06D6A0' : 'transparent'}` }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'animals' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {animals.map((a: any, i: number) => (
            <motion.div key={i} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
              className="card" style={{ textAlign: 'center', padding: '14px 10px' }}>
              <div style={{ fontSize: '2.5rem' }}>{ANIMAL_EMOJIS[a.image] || '🐾'}</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginTop: 6 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>صدا: {a.sound}</div>
              <div style={{ fontSize: 11, marginTop: 4, padding: '2px 8px', borderRadius: 8,
                background: '#f0fff9', color: '#06D6A0', display: 'inline-block' }}>{a.type}</div>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'seasons' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {seasons.map((s: any, i: number) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.08 }}
              className="card" style={{ padding: '14px 12px' }}>
              <div style={{ fontSize: '2rem', textAlign: 'center', marginBottom: 6 }}>{s.emoji || (i===0?'🌸':i===1?'☀️':i===2?'🍂':'❄️')}</div>
              <div style={{ fontWeight: 700, fontSize: 16, textAlign: 'center', marginBottom: 6 }}>{s.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-light)', marginBottom: 8 }}>{s.description}</div>
              {s.facts && s.facts.map((f: string, j: number) => (
                <div key={j} style={{ fontSize: 11, color: '#06D6A0', marginBottom: 2 }}>• {f}</div>
              ))}
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'plants' && (
        <div>
          <div className="card" style={{ textAlign: 'center', padding: 20, marginBottom: 12 }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>🌱</div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>مراحل رشد گیاه</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
              {['🌰 دانه','🌿 جوانه','🌱 نهال','🌳 درخت','🍎 میوه'].map((step, i, arr) => (
                <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#06D6A0' }}>{step}</span>
                  {i < arr.length - 1 && <span style={{ color: '#ccc' }}>←</span>}
                </span>
              ))}
            </div>
          </div>
          {[
            {emoji:'🌰',title:'دانه',desc:'درون خاک مرطوب قرار می‌گیرد و جوانه می‌زند'},
            {emoji:'🌿',title:'جوانه',desc:'ریشه‌های کوچک رشد می‌کنند'},
            {emoji:'🌱',title:'نهال',desc:'برگ‌های کوچک ظاهر می‌شوند'},
            {emoji:'🌳',title:'درخت بالغ',desc:'با آب و نور خورشید رشد می‌کند'},
            {emoji:'🍎',title:'میوه‌دهی',desc:'شکوفه‌ها تبدیل به میوه می‌شوند'},
          ].map((s, i) => (
            <div key={i} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: '2rem' }}>{s.emoji}</div>
              <div>
                <div style={{ fontWeight: 700, color: '#06D6A0' }}>{i + 1}. {s.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 2 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- Quran Learning ---
const FALLBACK_VERSES = [
  { surah: 'فاتحه', verse: 1, arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', persian: 'به نام خداوند بخشنده مهربان' },
  { surah: 'فاتحه', verse: 2, arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', persian: 'ستایش برای خداوند پروردگار جهانیان' },
  { surah: 'اخلاص', verse: 1, arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ', persian: 'بگو او الله یکتاست' },
  { surah: 'اخلاص', verse: 2, arabic: 'اللَّهُ الصَّمَدُ', persian: 'الله بی‌نیاز است' },
  { surah: 'ناس', verse: 1, arabic: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', persian: 'بگو پناه می‌برم به پروردگار مردم' },
]

function QuranLearn({ verses }: { verses: any[] }) {
  const [expanded, setExpanded] = useState<number | null>(null)
  const data = verses.length > 0 ? verses : FALLBACK_VERSES
  const bySurah = data.reduce((acc: any, v: any) => {
    if (!acc[v.surah]) acc[v.surah] = []
    acc[v.surah].push(v)
    return acc
  }, {})

  return (
    <div>
      <div className="card" style={{ background: 'linear-gradient(135deg,#fffbf0,#fff5d6)', marginBottom: 16, textAlign: 'center', padding: '14px' }}>
        <div style={{ fontSize: '2rem', marginBottom: 4 }}>📿</div>
        <div style={{ fontSize: 13, color: '#FFB703', fontWeight: 600 }}>آیات قرآن کریم</div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>روی هر آیه بزن تا معنی ببینی</div>
      </div>
      {Object.entries(bySurah).map(([surah, svs]: [string, any]) => (
        <div key={surah} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, color: '#FFB703', marginBottom: 8, fontSize: 14 }}>سوره {surah}</div>
          {svs.map((v: any, i: number) => (
            <motion.div key={i} whileTap={{ scale: 0.98 }}
              onClick={() => { setExpanded(expanded === i ? null : i); speakText(v.arabic) }}
              className="card" style={{ marginBottom: 8, cursor: 'pointer',
                background: expanded === i ? 'linear-gradient(135deg,#fffbf0,#fff5d6)' : 'white',
                border: `2px solid ${expanded === i ? '#FFB703' : '#e2e8f0'}` }}>
              <div style={{ fontSize: 16, fontWeight: 700, lineHeight: 2, direction: 'rtl',
                fontFamily: 'serif', color: expanded === i ? '#333' : '#555' }}>
                {v.arabic}
              </div>
              <AnimatePresence>
                {expanded === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-light)', marginTop: 6, fontStyle: 'italic' }}>
                      {v.persian}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      ))}
    </div>
  )
}

// --- Writing Learning ---
const LETTERS_GUIDE = [
  {letter:'الف',strokes:'از بالا به پایین یک خط مستقیم',tip:'مثل یک عدد ۱',emoji:'☝️'},
  {letter:'ب',strokes:'خط منحنی از راست به چپ، نقطه پایین',tip:'مثل یک قایق',emoji:'⛵'},
  {letter:'پ',strokes:'مثل ب، ۳ نقطه پایین',tip:'پایین‌تر از خط',emoji:'🔵'},
  {letter:'ت',strokes:'مثل ب، ۲ نقطه بالا',tip:'تاج دارد',emoji:'👑'},
  {letter:'ج',strokes:'قوس از راست، دم پایین',tip:'مثل ج بنویس',emoji:'🪝'},
  {letter:'د',strokes:'نیم‌دایره از بالا به پایین',tip:'ساده و کوتاه',emoji:'🌙'},
  {letter:'ر',strokes:'خط کوچک از بالا به پایین‌راست',tip:'مثل دندان',emoji:'🦷'},
  {letter:'س',strokes:'سه قوس کوچک روی هم',tip:'مثل موج دریا',emoji:'🌊'},
]

function WritingLearn() {
  const [active, setActive] = useState<number | null>(null)
  return (
    <div>
      <div className="card" style={{ marginBottom: 14, padding: '12px 16px',
        background: 'linear-gradient(135deg,#f0fffe,#fff)', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#4ECDC4', fontWeight: 600 }}>
          ✏️ یاد بگیر چطور حروف بنویسی
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-light)', marginTop: 4 }}>
          روی هر حرف بزن تا راهنمای نوشتن ببینی
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {LETTERS_GUIDE.map((item, i) => (
          <motion.div key={i} whileTap={{ scale: 0.95 }}
            onClick={() => setActive(active === i ? null : i)}
            className="card" style={{ cursor: 'pointer', textAlign: 'center', padding: '14px 10px',
              background: active === i ? '#f0fffe' : 'white',
              border: `2px solid ${active === i ? '#4ECDC4' : '#e2e8f0'}` }}>
            <div style={{ fontSize: '2rem', marginBottom: 4 }}>{item.emoji}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#4ECDC4' }}>{item.letter}</div>
            <AnimatePresence>
              {active === i && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 6 }}>{item.strokes}</div>
                  <div style={{ fontSize: 11, color: '#4ECDC4', marginTop: 4, fontWeight: 600 }}>💡 {item.tip}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// --- Main Page ---
export default function LearningHubPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const student = useStore(s => s.student)
  const [subject, setSubject] = useState(params.get('s') || 'farsi')
  const [alphabet, setAlphabet] = useState<any[]>([])
  const [verses, setVerses] = useState<any[]>([])
  const [sciData, setSciData] = useState<any>({})

  useEffect(() => {
    api.getFarsiAlphabet().then(r => setAlphabet(r.data)).catch(() => {})
    api.getQuranVerses().then(r => setVerses(r.data)).catch(() => {})
    Promise.all([
      api.getScienceTopic('animals').then(r => ({ animals: r.data })),
      api.getScienceTopic('seasons').then(r => ({ seasons: r.data })),
    ]).then(results => setSciData(Object.assign({}, ...results))).catch(() => {})
  }, [student])

  const color = SUBJECTS.find(s => s.id === subject)?.color || '#6C63FF'

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <button onClick={() => nav('/')} style={{ background: 'none', fontSize: 20, border: 'none', cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 20, color }}>📚 یادگیری</h1>
      </div>

      {/* Subject tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', paddingBottom: 4 }}>
        {SUBJECTS.map(s => (
          <button key={s.id} onClick={() => setSubject(s.id)}
            style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
              fontWeight: 600, whiteSpace: 'nowrap',
              background: subject === s.id ? s.color : '#f7fafc',
              color: subject === s.id ? 'white' : 'var(--text-light)',
              border: `2px solid ${subject === s.id ? s.color : '#e2e8f0'}` }}>
            {s.emoji} {s.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={subject} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}>
          {subject === 'farsi' && <FarsiLearn alphabet={alphabet} />}
          {subject === 'math' && <MathLearn />}
          {subject === 'science' && <ScienceLearn data={sciData} />}
          {subject === 'quran' && <QuranLearn verses={verses} />}
          {subject === 'writing' && <WritingLearn />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
