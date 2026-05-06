import json
import random
from pathlib import Path
from fastapi import APIRouter
from ..cache import cache_get, cache_set

router = APIRouter(prefix="/api/games", tags=["games"])

CONTENT_DIR = Path(__file__).parent.parent.parent / "content"


def _load(path: str) -> list | dict:
    full = CONTENT_DIR / path
    if not full.exists():
        return []
    with open(full, encoding="utf-8") as f:
        return json.load(f)


# ── Farsi ────────────────────────────────────────────────────────

@router.get("/farsi/words")
async def get_farsi_words(level: int = 1):
    cached = await cache_get(f"farsi:words:{level}")
    if cached:
        return cached
    words = _load("farsi/words.json")
    result = [w for w in words if w["difficulty"] <= level + 1]
    await cache_set(f"farsi:words:{level}", result, ttl=3600)
    return result


@router.get("/farsi/sentences")
async def get_farsi_sentences(level: int = 1):
    cached = await cache_get(f"farsi:sentences:{level}")
    if cached:
        return cached
    sentences = _load("farsi/sentences.json")
    result = [s for s in sentences if s["level"] <= max(level, 2)]
    await cache_set(f"farsi:sentences:{level}", result, ttl=3600)
    return result


@router.get("/farsi/alphabet")
async def get_farsi_alphabet():
    cached = await cache_get("farsi:alphabet")
    if cached:
        return cached
    result = _load("farsi/alphabet.json")
    await cache_set("farsi:alphabet", result, ttl=86400)
    return result


# ── Math ─────────────────────────────────────────────────────────

@router.get("/math/problems")
async def get_math_problems(level: int = 1, count: int = 5):
    cached = await cache_get(f"math:problems:{level}:{count}")
    if cached:
        return cached
    problems = _load("math/problems.json")
    filtered = [p for p in problems if p["level"] <= level]
    result = random.sample(filtered, min(count, len(filtered))) if filtered else []
    await cache_set(f"math:problems:{level}:{count}", result, ttl=60)
    return result


# ── Science ──────────────────────────────────────────────────────

SCIENCE_TOPICS = {
    "animals": [
        {"name": "گربه",  "type": "خانگی",  "sound": "میو",   "image": "cat"},
        {"name": "سگ",    "type": "خانگی",  "sound": "هاپ",   "image": "dog"},
        {"name": "مرغ",   "type": "پرنده",  "sound": "قدقد",  "image": "chicken"},
        {"name": "گاو",   "type": "مزرعه",  "sound": "ماو",   "image": "cow"},
        {"name": "شیر",   "type": "وحشی",   "sound": "غرش",   "image": "lion"},
        {"name": "ماهی",  "type": "آبزی",   "sound": "-",     "image": "fish"},
        {"name": "اسب",   "type": "مزرعه",  "sound": "شیهه",  "image": "horse"},
        {"name": "خرگوش", "type": "خانگی",  "sound": "-",     "image": "rabbit"},
    ],
    "plants": [
        {"stage": 1, "name": "دانه",     "description": "دانه در خاک"},
        {"stage": 2, "name": "جوانه",    "description": "جوانه زدن"},
        {"stage": 3, "name": "گیاهچه",   "description": "رشد ساقه"},
        {"stage": 4, "name": "گیاه",     "description": "برگ‌ها رشد می‌کنند"},
        {"stage": 5, "name": "گل",       "description": "شکوفا شدن"},
    ],
    "seasons": [
        {"name": "بهار",    "description": "هوا گرم، گل‌ها شکوفا",    "color": "#90EE90"},
        {"name": "تابستان", "description": "هوا گرم، میوه‌ها رسیده",  "color": "#FFD700"},
        {"name": "پاییز",   "description": "برگ‌ها می‌ریزند",          "color": "#FFA500"},
        {"name": "زمستان",  "description": "هوا سرد، برف می‌بارد",    "color": "#E0E8FF"},
    ],
}


@router.get("/science/{topic}")
async def get_science_topic(topic: str):
    if topic not in SCIENCE_TOPICS:
        return {"error": "موضوع یافت نشد"}
    return SCIENCE_TOPICS[topic]


# ── Quran ────────────────────────────────────────────────────────

QURAN_VERSES = [
    {"arabic": "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ",       "persian": "به نام خداوند بخشنده مهربان",              "surah": "فاتحه", "verse": 1},
    {"arabic": "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",        "persian": "ستایش خدایی که پروردگار جهانیان است",      "surah": "فاتحه", "verse": 2},
    {"arabic": "الرَّحْمَنِ الرَّحِيمِ",                        "persian": "بخشنده مهربان",                            "surah": "فاتحه", "verse": 3},
    {"arabic": "مَالِكِ يَوْمِ الدِّينِ",                       "persian": "مالک روز جزاست",                          "surah": "فاتحه", "verse": 4},
    {"arabic": "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",    "persian": "تنها تو را می‌پرستیم و از تو یاری می‌خواهیم", "surah": "فاتحه", "verse": 5},
    {"arabic": "قُلْ هُوَ اللَّهُ أَحَدٌ",                      "persian": "بگو: او خداوند یکتاست",                   "surah": "توحید", "verse": 1},
    {"arabic": "اللَّهُ الصَّمَدُ",                              "persian": "خداوند بی‌نیاز است",                       "surah": "توحید", "verse": 2},
]


@router.get("/quran/verses")
async def get_quran_verses():
    return QURAN_VERSES
