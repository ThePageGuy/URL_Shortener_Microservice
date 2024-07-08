// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const urlParser = require('url');

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Database Configuration
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const urlSchema = new mongoose.Schema({
  original_url: { type: String, required: true },
  short_url: { type: Number, required: true }
});

const Url = mongoose.model('Url', urlSchema);

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// API Endpoint to handle URL shortening
let urlCounter = 1;

app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  const parsedUrl = urlParser.parse(originalUrl);

  dns.lookup(parsedUrl.hostname, (err, address) => {
    if (!address) {
      res.json({ error: 'invalid url' });
    } else {
      Url.findOne({ original_url: originalUrl }, (err, data) => {
        if (data) {
          res.json({ original_url: data.original_url, short_url: data.short_url });
        } else {
          const newUrl = new Url({
            original_url: originalUrl,
            short_url: urlCounter++
          });
          newUrl.save((err, data) => {
            res.json({ original_url: data.original_url, short_url: data.short_url });
          });
        }
      });
    }
  });
});

// API Endpoint to handle URL redirection
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;

  Url.findOne({ short_url: shortUrl }, (err, data) => {
    if (data) {
      res.redirect(data.original_url);
    } else {
      res.json({ error: 'No short URL found for the given input' });
    }
  });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
