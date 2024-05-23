const express = require('express');
const app = express();
const port = 3000;

// Définir le moteur de vue sur EJS
app.set('view engine', 'ejs');

// Route pour la page d'accueil
app.get('/', (req, res) => {
  // Définir les données du jeu de morpion
  const morpion = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];
  
  // Rendre la vue EJS et passer les données du jeu de morpion
  res.render('index', { morpion: morpion });
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

