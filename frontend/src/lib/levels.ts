export interface LevelDef {
  gameType: string
  title: string
  desc: string
  icon: string
  timerSeconds?: number
  comingSoon?: boolean
}

export const SUBJECT_LEVELS: Record<string, LevelDef[]> = {
  farsi: [
    { gameType: 'alphabet',    title: 'الفبا',        desc: 'یاد گرفتن ۳۳ حرف فارسی',        icon: '🔡' },
    { gameType: 'letterMatch', title: 'حرف‌یاب',      desc: 'حرف اول کلمه را پیدا کن',        icon: '🎯', timerSeconds: 20 },
    { gameType: 'wordbuilder', title: 'کلمه‌ساز',     desc: 'حروف را کنار هم بگذار',          icon: '🔤' },
    { gameType: 'reading',     title: 'صدای قهرمان',  desc: 'جمله‌ها را بلند بخوان',           icon: '🎤' },
    { gameType: 'story',       title: 'داستان‌خوانی', desc: 'داستان‌های جالب بخوان',           icon: '📚' },
    { gameType: 'cs_farsi1',   title: 'شعرخوانی',     desc: 'در حال تولید',                    icon: '🎵', comingSoon: true },
  ],
  math: [
    { gameType: 'rocket',      title: 'موشک حساب',    desc: 'جمع و تفریق را حل کن',            icon: '🚀', timerSeconds: 20 },
    { gameType: 'market',      title: 'بازار ریاضی',  desc: 'خرید و فروش با اعداد',             icon: '🛒', timerSeconds: 20 },
    { gameType: 'pattern',     title: 'الگوها',        desc: 'الگوی اعداد را کامل کن',           icon: '🔮' },
    { gameType: 'compare',     title: 'مقایسه اعداد', desc: 'بزرگ‌تر یا کوچک‌تر؟',             icon: '⚖️', timerSeconds: 15 },
    { gameType: 'shapes',      title: 'شکل‌شناس',     desc: 'اشکال هندسی را بشناس',             icon: '🔷' },
    { gameType: 'pairs',       title: 'جفت‌ساز ۱۰',   desc: 'اعدادی که جمعشان ۱۰ میشه',        icon: '🎯' },
    { gameType: 'counting',    title: 'شمارش',         desc: 'تعداد اشیاء را بشمار',             icon: '🔢', timerSeconds: 20 },
    { gameType: 'measure',     title: 'اندازه‌گیری',  desc: 'بلندتر، کوتاه‌تر، سنگین‌تر',      icon: '📏' },
  ],
  science: [
    { gameType: 'animals',     title: 'جانوران',      desc: 'حیوانات را بشناس',                icon: '🐾' },
    { gameType: 'plants',      title: 'گیاهان',       desc: 'گیاهان و طبیعت',                  icon: '🌱' },
    { gameType: 'seasons',     title: 'فصل‌ها',       desc: 'چهار فصل سال',                    icon: '🌦️' },
    { gameType: 'cs_sci1',     title: 'آب و هوا',     desc: 'در حال تولید',                    icon: '☁️', comingSoon: true },
    { gameType: 'cs_sci2',     title: 'آزمایش',       desc: 'در حال تولید',                    icon: '🔬', comingSoon: true },
  ],
  quran: [
    { gameType: 'recite',      title: 'تلاوت',        desc: 'آیات را تکرار کن',                icon: '📿' },
    { gameType: 'match',       title: 'تطبیق',        desc: 'آیه و معنا را تطبیق بده',         icon: '🔗', timerSeconds: 30 },
    { gameType: 'color',       title: 'رنگ‌آمیزی',    desc: 'نقاشی‌های قرآنی',                icon: '🎨' },
    { gameType: 'cs_quran1',   title: 'حفظ',          desc: 'در حال تولید',                    icon: '⭐', comingSoon: true },
  ],
  writing: [
    { gameType: 'trace',       title: 'خط‌کشی',       desc: 'حروف را دنبال کن',                icon: '✏️' },
    { gameType: 'dictation',   title: 'دیکته',        desc: 'کلمات را بنویس',                  icon: '📝', timerSeconds: 30 },
    { gameType: 'cs_writ1',    title: 'انشا',         desc: 'در حال تولید',                    icon: '📖', comingSoon: true },
    { gameType: 'cs_writ2',    title: 'خوش‌نویسی',    desc: 'در حال تولید',                    icon: '🖊️', comingSoon: true },
  ],
}
