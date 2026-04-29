const { google } = require('googleapis');

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function parsePrivateKey(raw) {
  return raw.replace(/\\n/g, '\n');
}

function getCalendarClient() {
  const clientEmail = requiredEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKeyRaw = requiredEnv('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: parsePrivateKey(privateKeyRaw),
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  return google.calendar({ version: 'v3', auth });
}

function getCalendarId() {
  return requiredEnv('GOOGLE_CALENDAR_ID');
}

module.exports = {
  getCalendarClient,
  getCalendarId,
};
