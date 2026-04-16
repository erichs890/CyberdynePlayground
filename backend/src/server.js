const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware: strip debug/vuln hints from ALL JSON responses (blackbox mode)
app.use((_req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = (body) => {
    origJson(stripHints(body));
  };
  next();
});

function stripHints(obj) {
  if (Array.isArray(obj)) return obj.map(stripHints);
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (/^_(vuln|debug|hint|note|warning|exploit|vulns)$/.test(k)) continue;
      if (k === 'sql' && typeof v === 'string' && v.toUpperCase().includes('SELECT')) continue;
      if (k === 'stack' && typeof v === 'string' && v.includes('at ')) continue;
      clean[k] = stripHints(v);
    }
    return clean;
  }
  return obj;
}

// --- All routes ---
app.use('/api', require('./routes/products'));
app.use('/api', require('./routes/search'));
app.use('/api', require('./routes/comments'));
app.use('/api', require('./routes/fetch'));
app.use('/api', require('./routes/download'));
app.use('/api', require('./routes/ping'));
app.use('/api', require('./routes/jwt-auth'));
app.use('/api', require('./routes/users'));
app.use('/api', require('./routes/graphql'));
app.use('/api', require('./routes/chatbot'));
app.use('/api', require('./routes/race'));
app.use('/api', require('./routes/api-keys'));
app.use('/api', require('./routes/cloud-keys'));
app.use('/api', require('./routes/s3-bucket'));
app.use('/api', require('./routes/recon'));
app.use('/api', require('./routes/upload'));
app.use('/api', require('./routes/deserialization'));
app.use('/api', require('./routes/xxe'));
app.use('/api', require('./routes/business-logic'));
app.use('/api', require('./routes/js-secrets'));
app.use('/', require('./routes/wordpress'));
app.use('/api', require('./routes/upload-v2'));
app.use('/api', require('./routes/nosql'));
app.use('/api', require('./routes/swagger'));
app.use('/api', require('./routes/ssti'));
app.use('/api', require('./routes/session'));
app.use('/api', require('./routes/advanced-misc'));

// --- NEW hidden vulns (no labels, no hints) ---
app.use('/api', require('./routes/blackbox-extras'));

// Static frontend
const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

app.get('/api', (_req, res) => {
  res.json({
    name: 'Cyberdyne Systems API',
    version: '2.4.1',
    status: 'operational',
    docs: '/api/docs'
  });
});

app.get('*', (req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  if (fs.existsSync(indexPath) && !req.path.startsWith('/api')) {
    return res.sendFile(indexPath);
  }
  res.status(404).json({ error: 'Not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Cyberdyne Systems API v2.4.1 — port ${PORT}`));
