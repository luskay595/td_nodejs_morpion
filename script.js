// Dans votre fichier app.js (ou index.js)

const express = require('express');
const app = express();
const port = 3000;

app.set('view engine', 'ejs');

// Middleware pour parser le corps des requêtes POST
app.use(express.urlencoded({ extended: true }));

let currentPlayer = 'X';
let morpion = [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
];

// Route pour afficher la page de jeu
app.get('/', (req, res) => {
  res.render('index', { currentPlayer, morpion });
});

// Route pour gérer la soumission du formulaire
app.post('/submit', (req, res) => {
  const { cell } = req.body;
  const [i, j] = cell.split('-').map(Number);
  
  // Mettre à jour le tableau avec le coup joué
  morpion[i][j] = currentPlayer;

  // Vérifier s'il y a un gagnant ou un match nul
  const winner = checkWinner();
  if (winner) {
    if (winner === 'draw') {
      res.send('Match nul !');
    } else {
      res.send(`Le joueur ${winner} a gagné !`);
    }
    // Réinitialiser le tableau
    morpion = [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ];
  } else {
    // Changer de joueur
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    // Rediriger vers la page de jeu
    res.redirect('/');
  }
});

// Fonction pour vérifier s'il y a un gagnant
function checkWinner() {
  // Vérification des lignes et colonnes
  for (let i = 0; i < 3; i++) {
    if (morpion[i][0] !== '' && morpion[i][0] === morpion[i][1] && morpion[i][1] === morpion[i][2]) {
      return morpion[i][0];
    }
    if (morpion[0][i] !== '' && morpion[0][i] === morpion[1][i] && morpion[1][i] === morpion[2][i]) {
      return morpion[0][i];
    }
  }

  // Vérification des diagonales
  if (morpion[0][0] !== '' && morpion[0][0] === morpion[1][1] && morpion[1][1] === morpion[2][2]) {
    return morpion[0][0];
  }
  if (morpion[0][2] !== '' && morpion[0][2] === morpion[1][1] && morpion[1][1] === morpion[2][0]) {
    return morpion[0][2];
  }

  // Vérification match nul
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (morpion[i][j] === '') {
        // Il reste des cases vides, le jeu continue
        return null;
      }
    }
  }
  // Si toutes les cases sont remplies et aucun gagnant n'est trouvé, c'est un match nul
  return 'draw';
}

app.listen(port, () => console.log(`Server listening on port ${port}`));
