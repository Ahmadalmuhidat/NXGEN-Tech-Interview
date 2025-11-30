const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const routes = require('./routes/routes');
const cors = require('cors');

dotenv.config();

const app = express();

// Middlewares
app.use(cors({
  origin: '*'
}));
app.use(bodyParser.json());
app.use('/', routes);

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;