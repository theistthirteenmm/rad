# 🎓 رادین - بازی آموزشی کلاس اول

برنامه تعاملی آموزشی برای دانش‌آموزان کلاس اول ابتدایی

## ویژگی‌ها

- 🎤 **تشخیص صدا** برای خواندن جملات فارسی و تلاوت قرآن
- 📚 **۵ درس**: فارسی، ریاضی، علوم، قرآن، نگارش
- 🎮 **۱۵+ بازی** مختلف
- ⭐ **سیستم پاداش**: ستاره، سکه، شخصیت کارتونی
- 📊 **پنل پیشرفت** برای والدین و معلم
- 📱 **PWA** قابل نصب روی موبایل
- 📶 **آفلاین**: بازی‌های بدون صدا بدون اینترنت کار می‌کنند

## اجرا با Docker

```bash
# در WSL:
cd /mnt/d/radin
docker compose up -d --build
```

بعد از راه‌اندازی:
- **اپ:** http://localhost:3000
- **API:** http://localhost:8000
- **مستندات API:** http://localhost:8000/docs

## ساختار پروژه

```
radin/
├── backend/          # FastAPI + Python
│   ├── app/
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── routers/
│   └── requirements.txt
├── frontend/         # React + TypeScript + Vite
│   ├── src/
│   │   ├── pages/    # صفحات
│   │   ├── games/    # کامپوننت‌های بازی
│   │   ├── components/
│   │   ├── hooks/    # API hooks
│   │   └── store/    # Zustand store
│   └── package.json
├── docker-compose.yml
└── pdf/              # کتاب‌های درسی
```

## بازی‌ها

| درس | بازی‌ها |
|-----|---------|
| فارسی | صدای قهرمان (میکروفن)، کلمه‌ساز، تیرانداز حروف |
| ریاضی | موشک اعداد، بازار ریاضی، الگوی اعداد |
| علوم | دنیای حیوانات، باغبان کوچک، فصل‌های سال |
| قرآن | تلاوت ستاره (میکروفن)، معنای آیه، رنگ‌آمیزی |
| نگارش | خط‌نویس (لمسی)، نقاشی کلمه |

## ساخت APK

```bash
cd frontend
npm run build
npx cap add android
npx cap sync android
npx cap open android
# در Android Studio: Build → Generate Signed APK
```

## توسعه محلی بدون Docker

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```
