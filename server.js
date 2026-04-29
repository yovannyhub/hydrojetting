const express = require('express');
const cors = require('cors');

const availabilityHandler = require('./api/calendar/availability');
const bookHandler = require('./api/calendar/book');

const app = express();
const port = process.env.PORT || 3000;

const frontendOrigin = process.env.FRONTEND_ORIGIN || '*';
app.use(cors({ origin: frontendOrigin === '*' ? true : frontendOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'aurora-calendar-api' });
});

app.get('/api/calendar/availability', (req, res) => availabilityHandler(req, res));
app.post('/api/calendar/book', (req, res) => bookHandler(req, res));

app.listen(port, () => {
  console.log(`Aurora Calendar API listening on port ${port}`);
});
