const app = require('./app');
const path = require('path');
const fs = require('fs');
const express = require('express');

const publicDir = path.join(__dirname, '..', 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      return res.sendFile(path.join(publicDir, 'index.html'));
    }
    res.status(404).json({ error: 'Not found' });
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Cyberdyne Systems API v2.4.1 — port ${PORT}`));
