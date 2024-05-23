const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// Utiliser bodyParser pour traiter les données POST
app.use(bodyParser.urlencoded({ extended: true }));

// Définir le moteur de vue sur EJS
app.set('view engine', 'ejs');

// Variable pour suivre le joueur courant
let currentPlayer = 'X';

// Route pour la page d'accueil (GET)
app.get('/', (req, res) => {
  // Définir les données du jeu de morpion
  const morpion = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];
  
  // Rendre la vue EJS et passer les données du jeu de morpion et le joueur courant
  res.render('index', { morpion: morpion, currentPlayer: currentPlayer });
});

// Route pour gérer l'envoi du formulaire (POST)
app.post('/submit', (req, res) => {
  // Traitement des données du formulaire
  console.log('Données du formulaire:', req.body);
  // Mettre à jour le joueur courant
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  // Rediriger vers la page d'accueil
  res.redirect('/');
});

// Démarrer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
