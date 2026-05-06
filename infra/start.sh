#!/bin/bash
# راه‌اندازی راد در WSL (بدون Docker Desktop)
# اجرا: bash infra/start.sh

set -e
cd "$(dirname "$0")/.."

echo "🚀 راه‌اندازی راد..."

# بررسی Docker daemon
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker در WSL اجرا نیست. ابتدا اجرا کنید:"
  echo "   sudo service docker start"
  exit 1
fi

# ساخت و اجرا
docker compose up --build -d

echo ""
echo "✅ راد در حال اجرا است:"
echo "   🌐 اپلیکیشن: http://localhost:80"
echo "   📦 MinIO:    http://localhost:9001"
echo "   🔌 Backend:  (داخلی - از طریق nginx)"
echo ""
echo "برای مشاهده لاگ: docker compose logs -f"
echo "برای توقف:        docker compose down"
