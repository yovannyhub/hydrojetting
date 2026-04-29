const { getCalendarClient, getCalendarId } = require('./_googleClient');
const nodemailer = require('nodemailer');

const CHICAGO_TZ = 'America/Chicago';

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  if (req.body && typeof req.body === "object") {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1_000_000) reject(new Error("Request body too large"));
    });
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch { reject(new Error("Invalid JSON body")); }
    });
    req.on("error", reject);
  });
}

async function checkSlotConflict(calendar, calendarId, slotStart, slotEnd) {
  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: new Date(slotStart).toISOString(),
      timeMax: new Date(slotEnd).toISOString(),
      items: [{ id: calendarId }],
    },
  });
  const busy = freebusy.data.calendars?.[calendarId]?.busy || [];
  return busy.length > 0;
}

async function sendConfirmationEmail({ email, fullName, slotStart, slotEnd, serviceType, comments }) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'aurorasewercleaningcorp@gmail.com';

  if (!host || !user || !pass || !email) return { sent: false, reason: 'SMTP or recipient missing' };

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const fmt = (iso) => new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

  const subject = 'Aurora Sewer Cleaning - Appointment Request Received';
  const text = [
    `Hi ${fullName},`,
    '',
    'We received your appointment request:',
    `Service: ${serviceType || 'N/A'}`,
    `Start: ${fmt(slotStart)} (${CHICAGO_TZ})`,
    `End: ${fmt(slotEnd)} (${CHICAGO_TZ})`,
    `Notes: ${comments || 'N/A'}`,
    '',
    'If we need any additional details, our team will contact you shortly.',
    'Aurora Sewer Cleaning Corp',
    '(630) 853-2780',
  ].join('\n');

  await transporter.sendMail({ from, to: email, subject, text });
  return { sent: true };
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });

    const body = await readBody(req);
    const { fullName, email, phone, serviceType, comments, slotStart, slotEnd } = body;

    if (!fullName || !phone || !slotStart || !slotEnd) {
      return sendJson(res, 400, { error: 'Missing required fields: fullName, phone, slotStart, slotEnd' });
    }

    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const hasConflict = await checkSlotConflict(calendar, calendarId, slotStart, slotEnd);
    if (hasConflict) {
      return sendJson(res, 409, { error: 'That slot was just taken. Please reload availability and select another slot.' });
    }

    const event = {
      summary: `Aurora Sewer Cleaning - ${serviceType || 'Service Request'} - ${fullName}`,
      description: [
        `Name: ${fullName}`,
        `Phone: ${phone}`,
        `Email: ${email || 'N/A'}`,
        `Service: ${serviceType || 'N/A'}`,
        `Comments: ${comments || 'N/A'}`,
      ].join('\n'),
      start: { dateTime: slotStart, timeZone: CHICAGO_TZ },
      end: { dateTime: slotEnd, timeZone: CHICAGO_TZ },
    };

    const created = await calendar.events.insert({ calendarId, requestBody: event });

    let emailResult = { sent: false, reason: 'not attempted' };
    try {
      emailResult = await sendConfirmationEmail({ email, fullName, slotStart, slotEnd, serviceType, comments });
    } catch (e) {
      emailResult = { sent: false, reason: e.message || 'email failed' };
    }

    return sendJson(res, 200, {
      ok: true,
      eventId: created.data.id,
      htmlLink: created.data.htmlLink,
      emailConfirmation: emailResult,
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Unable to book appointment' });
  }
};

