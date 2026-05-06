# راه‌اندازی در WSL (بدون Docker Desktop)

## ۱. نصب Docker در WSL

```bash
# در ترمینال WSL:
sudo apt update
sudo apt install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## ۲. دسترسی به فایل‌های Windows از WSL

```bash
# فایل‌های پروژه از مسیر /mnt/d/radin قابل دسترسی هستند
cd /mnt/d/radin
```

## ۳. اجرای اپ

```bash
cd /mnt/d/radin

# اولین بار (build کامل):
docker compose up --build -d

# بارهای بعدی:
docker compose up -d
```

## ۴. مشاهده وضعیت

```bash
docker compose ps
docker compose logs -f backend    # لاگ backend
docker compose logs -f frontend   # لاگ frontend
```

## ۵. آدرس‌ها

| سرویس       | آدرس                        |
|-------------|------------------------------|
| اپلیکیشن   | http://localhost              |
| MinIO پنل  | http://localhost:9001         |
| API مستقیم | http://localhost/api/docs    |

## ۶. توقف

```bash
docker compose down          # متوقف کردن
docker compose down -v       # متوقف + پاک کردن دیتا
```

## ۷. Deploy روی سرور واقعی

```bash
# کپی فایل‌ها به سرور:
scp -r /mnt/d/radin user@server:/opt/rad

# روی سرور:
cd /opt/rad
SECRET_KEY="کلید_قوی_تصادفی" docker compose up --build -d
```
