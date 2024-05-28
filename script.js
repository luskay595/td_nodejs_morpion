const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 3000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'morpion',
  password: 'Benben1010',
  port: 5432,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// Création de la table "games" si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    state JSON NOT NULL,
    player CHAR(1) NOT NULL
  );
`);

app.get('/', async (req, res) => {
  res.render('home');
});

// Route pour initialiser une nouvelle partie
app.post('/new-game', async (req, res) => {
  try {
    await pool.query('INSERT INTO games(state, player) VALUES($1, $2)', [JSON.stringify([["", "", ""], ["", "", ""], ["", "", ""]]), 'X']);
    res.redirect('/game');
  } catch (error) {
    console.error('Error initializing new game:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/game', async (req, res) => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT state, player FROM games ORDER BY id DESC LIMIT 1');
    const { state, player } = result.rows[0] || { state: '[[ "", "", ""], ["", "", ""], ["", "", ""]]', player: 'X' };

    const boardState = JSON.parse(state);

    res.render('game', { currentPlayer: player, boardState });

    client.release();
  } catch (error) {
    console.error('Error fetching game state:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/submit', async (req, res) => {
  try {
    const { cell } = req.body;
    const [i, j] = cell.split('-').map(Number);

    const client = await pool.connect();
    const result = await client.query('SELECT state, player FROM games ORDER BY id DESC LIMIT 1');
    const { state, player } = result.rows[0] || { state: '[[ "", "", ""], ["", "", ""], ["", "", ""]]', player: 'X' };

    let boardState = JSON.parse(state);
    if (boardState[i][j] !== '') {
      // Case already filled, return without changing state
      res.redirect('/game');
      return;
    }
    boardState[i][j] = player;

    const winner = checkWinner(boardState);
    if (winner) {
      let message;
      if (winner === 'draw') {
        message = 'Dommage, vous avez fait match nul.';
      } else {
        message = `Félicitations, joueur ${winner}, vous avez gagné !`;
      }
      // Réinitialiser le jeu
      await client.query('INSERT INTO games(state, player) VALUES($1, $2)', [JSON.stringify([["", "", ""], ["", "", ""], ["", "", ""]]), 'X']);
      res.render('congrats', { message });
      return;
    }

    const nextPlayer = player === 'X' ? 'O' : 'X'; // Change player
    await client.query('INSERT INTO games(state, player) VALUES($1, $2)', [JSON.stringify(boardState), nextPlayer]);

    res.redirect('/game');

    client.release();
  } catch (error) {
    console.error('Error submitting move:', error);
    res.status(500).send('Internal Server Error');
  }
});

function checkWinner(morpion) {
  // Vérification des lignes et des colonnes
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

  // Vérification des cases vides restantes
  let isDraw = true;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (morpion[i][j] === '') {
        isDraw = false;
        break;
      }
    }
    if (!isDraw) {
      break;
    }
  }
  
  // Si toutes les cases sont remplies et aucun gagnant n'est trouvé, c'est un match nul
  if (isDraw) {
    return 'draw';
  }

  // Si aucun gagnant n'est trouvé, retourne null pour indiquer que la partie est en cours
  return null;
}


app.listen(port, () => console.log(`Server listening on port ${port}`));

