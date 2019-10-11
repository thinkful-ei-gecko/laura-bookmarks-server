require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config.js');
const bookmarksRouter = require('./bookmarks/bookmarks-router.js');
const logger = require('./logger');
const { API_TOKEN } = require('./config.js');

const app = express(); 

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
  skip: () => NODE_ENV === 'test'}));
app.use(helmet());
app.use(cors());

app.get('/xss', (req, res) => {
  res.cookie('secretToken', '1234567890');
  res.sendFile(__dirname + '/xss-example.html');
});


app.use(function validateBearerToken(req, res, next) {
  const apiToken = API_TOKEN;
  const authToken = req.get('Authorization');

  if (!authToken || authToken.split(' ')[1] !== apiToken) {
    logger.error(`Unauthorized request to path: ${req.path}`);
    return res.status(401).json({ error: 'Unauthorized request' });
  }
  next();
});

app.use('/api/bookmarks', bookmarksRouter);

app.get('/', (req, res) => {
  res.send('Hello! Welcome to bookmarks!');
});

app.use(function errorHandler(error, req, res, next) {
  let response;
  if (NODE_ENV === 'production') {
    console.error(error);
     response = { error: { message: 'server error' }};
  } else {
    console.error(error);
    response = { error, message: error.message };
   }
   res.status(500).json(response);
 });

module.exports = app;