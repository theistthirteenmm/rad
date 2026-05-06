# SSL Certificates

For HTTPS, place your certificates here:

- `cert.pem` — your SSL certificate
- `key.pem`  — your private key

## Self-signed (for local testing)

```bash
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout infra/ssl/key.pem \
  -out infra/ssl/cert.pem \
  -subj "/CN=localhost"
```

## Production (Let's Encrypt)

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem infra/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem  infra/ssl/key.pem
```
