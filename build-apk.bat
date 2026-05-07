@echo off
echo 📱 Building Radin APK...

REM Step 1: Build frontend
echo 1. Building frontend...
cd frontend
call npm run build

REM Step 2: Add Android platform if not exists
if not exist "android" (
    echo 2. Adding Android platform...
    call npx cap add android
)

REM Step 3: Sync with Capacitor
echo 3. Syncing with Capacitor...
call npx cap sync android

REM Step 4: Instructions
echo 4. Open Android Studio manually:
echo    - Open the 'android' folder in Android Studio
echo    - Build → Generate Signed Bundle / APK
echo    - Choose APK
echo    - Create new keystore or use existing
echo    - Build variants: release
echo    - Finish and copy APK to frontend/public/radin-app.apk

echo ✅ APK build instructions complete!
echo 📥 Download page: http://localhost/download
echo 📁 APK will be at: frontend/public/radin-app.apk
pause