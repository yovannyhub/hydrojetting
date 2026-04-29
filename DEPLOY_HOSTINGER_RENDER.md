# Deploy Guide (GitHub + Hostinger + Render)

## 1) Push this project to GitHub
- Commit and push the latest code (including `api/` and `server.js`).

## 2) Create Render Web Service (Backend API)
- In Render: New -> Web Service -> Connect GitHub repo.
- Root directory: `Site`
- Build Command: `npm install`
- Start Command: `npm start`

## 3) Add Render Environment Variables
Set these in Render dashboard:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_CALENDAR_ID`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `FRONTEND_ORIGIN` (your Hostinger domain, e.g. `https://aurorasewercleaning.com`)

## 4) Grant Google Calendar Access
- Share your office Google Calendar with the service account email.
- Give Editor permission.

## 5) Point frontend to Render API
In `index.html`, set:
```html
<script>
  window.SCHEDULER_API_BASE = 'https://YOUR-RENDER-SERVICE.onrender.com';
</script>
```

## 6) Upload frontend to Hostinger
- Upload static site files from `Site` folder to Hostinger.
- Keep `index.html`, `areas-we-service.html`, `styles.css`, `Public/`.

## 7) Test
- Open site on Hostinger.
- Click `Load Availability`.
- Select slot and click `Request Booking`.
- Confirm event appears in Google Calendar.
- Confirm customer confirmation email is sent.

## Notes
- If CORS fails, verify `FRONTEND_ORIGIN` exactly matches domain/protocol.
- Keep private key line breaks as `\n` in env var value.
