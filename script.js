const express = require('express');
const app = express();
const port = 3000;

// Définir le moteur de vue sur EJS
app.set('view engine', 'ejs');

// Route de base
app.get('/', (req, res) => {
  res.render('index', { message: 'Hello World!' });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

