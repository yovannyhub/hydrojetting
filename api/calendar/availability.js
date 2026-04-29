const { getCalendarClient, getCalendarId } = require('./_googleClient');

const CHICAGO_TZ = 'America/Chicago';

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function fmtLabel(dateIso) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateIso));
}

function buildSlotsFromBusy(busy, startDate, days, businessHours) {
  const slots = [];
  const slotMinutes = 30;

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + dayOffset);

    const dayStart = new Date(day);
    dayStart.setHours(businessHours.startHour, 0, 0, 0);

    const dayEnd = new Date(day);
    dayEnd.setHours(businessHours.endHour, 0, 0, 0);

    for (let t = new Date(dayStart); t < dayEnd; t.setMinutes(t.getMinutes() + slotMinutes)) {
      const slotStart = new Date(t);
      const slotEnd = new Date(t);
      slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);

      const overlaps = busy.some((b) => {
        const bStart = new Date(b.start);
        const bEnd = new Date(b.end);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!overlaps) {
        const start = slotStart.toISOString();
        const end = slotEnd.toISOString();
        slots.push({ start, end, label: fmtLabel(start) });
      }
    }
  }

  return slots;
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return sendJson(res, 405, { error: 'Method not allowed' });

    const url = new URL(req.url, 'http://localhost');
    const days = Math.min(Math.max(parseInt(url.searchParams.get('days') || '14', 10), 1), 30);

    const calendar = getCalendarClient();
    const calendarId = getCalendarId();

    const now = new Date();
    const timeMin = now.toISOString();
    const end = new Date(now);
    end.setDate(end.getDate() + days);
    const timeMax = end.toISOString();

    const freebusy = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, items: [{ id: calendarId }] },
    });

    const busy = freebusy.data.calendars?.[calendarId]?.busy || [];
    const slots = buildSlotsFromBusy(busy, now, days, { startHour: 8, endHour: 18 });

    return sendJson(res, 200, { timezone: CHICAGO_TZ, slots });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Unable to load availability' });
  }
};
