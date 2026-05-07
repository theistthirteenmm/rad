# 📱 نسخه APK اپ رادین

این صفحه برای دانلود نسخه مستقل اندروید اپ آموزشی رادین است.

## 🚀 نحوه ساخت APK واقعی

برای ساخت APK واقعی (به جای فایل placeholder):

1. **پیش‌نیازها:**
   - Node.js 18+
   - Java JDK 11+
   - Android Studio
   - Android SDK

2. **مراحل ساخت:**
   ```bash
   # 1. Build frontend
   cd frontend
   npm run build

   # 2. Add Android platform
   npx cap add android

   # 3. Sync with Capacitor
   npx cap sync android

   # 4. Open Android Studio
   npx cap open android
   ```

3. **در Android Studio:**
   - Build → Generate Signed Bundle / APK
   - انتخاب APK
   - ساخت keystore جدید (یا استفاده از موجود)
   - Build variant: release
   - خروجی APK را در `frontend/public/radin-app.apk` کپی کنید

## 🌐 دسترسی به صفحه دانلود

- **محلی:** http://localhost/download
- **تولید:** https://your-domain.com/download

## 🔧 تنظیمات Nginx

فایل APK به طور خودکار توسط Nginx سرو می‌شود چون در `frontend/public/` قرار دارد.

## 📊 آمار دانلود (اختیاری)

اگر می‌خواهید آمار دانلود داشته باشید، می‌توانید:

1. یک endpoint در backend بسازید که دانلودها را ثبت کند
2. از Google Analytics برای tracking استفاده کنید
3. یا یک سرویس ساده مثل [GoatCounter](https://goatcounter.com) اضافه کنید

## 🛡️ امنیت

- فقط از این لینک رسمی APK را دانلود کنید
- APK باید با کلید امضای مخصوص شما sign شده باشد
- کاربران را از دانلود از منابع دیگر منع کنید

## 📞 پشتیبانی

اگر کاربران در نصب مشکل داشتند:
1. مطمئن شوید "نصب از منابع ناشناس" فعال است
2. فایل APK کامل دانلود شده باشد
3. فضای کافی روی دستگاه باشد
4. اندروید 8 یا بالاتر باشد