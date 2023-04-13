const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();

const PORT = 5000;

app.use(cors());
app.use(morgan('tiny'));
app.get('/', (req, res) => {
  console.log(`host: ${req.get('host')}\nhostname: ${req.hostname}`);
  return res.status(200).send('<h1>Hello world!</h1>');
});

app.listen(PORT, () => {
  console.log('Listening on: %d', PORT);
});