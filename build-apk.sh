#!/bin/bash
# Script to build Android APK for Radin educational app

echo "📱 Building Radin APK..."

# Step 1: Build frontend
echo "1. Building frontend..."
cd frontend
npm run build

# Step 2: Add Android platform if not exists
if [ ! -d "android" ]; then
    echo "2. Adding Android platform..."
    npx cap add android
fi

# Step 3: Sync with Capacitor
echo "3. Syncing with Capacitor..."
npx cap sync android

# Step 4: Open Android Studio
echo "4. Opening Android Studio..."
echo "   In Android Studio:"
echo "   - Build → Generate Signed Bundle / APK"
echo "   - Choose APK"
echo "   - Create new keystore or use existing"
echo "   - Build variants: release"
echo "   - Finish and copy APK to frontend/public/radin-app.apk"

# Alternative: Build with Gradle directly (if you have Android SDK)
# cd android
# ./gradlew assembleRelease

echo "✅ APK build instructions complete!"
echo "📥 Download page: http://localhost/download"
echo "📁 APK will be at: frontend/public/radin-app.apk"