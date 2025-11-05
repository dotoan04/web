# DigitalOcean Spaces integration for DOCX import

## Environment variables
Add these to your project (Vercel / .env):

- SPACES_ENDPOINT=https://<bucket>.<region>.digitaloceanspaces.com
- SPACES_REGION=<region> (e.g. sgp1)
- SPACES_BUCKET=<bucket>
- SPACES_KEY_ID=<access key id>
- SPACES_SECRET=<secret key>
- SPACES_PUBLIC_BASE_URL=https://<bucket>.<region>.digitaloceanspaces.com
- NEXT_PUBLIC_SPACES_PUBLIC_BASE_URL=https://<bucket>.<region>.digitaloceanspaces.com

## Flow
- Admin clicks "Tải lên Spaces" in quiz form → server makes a presigned POST (1 minute expiry) at `/api/storage/presign` → client uploads the `.docx` directly to Spaces → client calls `/api/quizzes/import` with `fileUrl` to parse.

This bypasses Vercel body-size limits.

