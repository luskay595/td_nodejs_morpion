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
app.use(express.json()); // Ajout du middleware pour parser le corps des requêtes JSON

// Création de la table "games" si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    state TEXT NOT NULL,
    player CHAR(1) NOT NULL
  );
`);
app.get('/', async (req, res) => {
  res.render('home');
});

// Route pour créer une nouvelle partie de morpion
app.post('/api/games', async (req, res) => {
  try {
    const newState = JSON.stringify([["", "", ""], ["", "", ""], ["", "", ""]]);
    const newPlayer = 'X';

    const result = await pool.query('INSERT INTO games(state, player) VALUES($1, $2) RETURNING id', [newState, newPlayer]);

    res.json({ id: result.rows[0].id });
  } catch (error) {
    console.error('Error creating new game:', error);
    res.status(500).send('Internal Server Error');
  }
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

app.put('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const { cell } = req.body;

    // Vérifier si une cellule a été sélectionnée
    if (!cell) {
      res.status(400).json({ error: 'Cell not selected' });
      return;
    }

    const [i, j] = cell.split('-').map(Number);

    // Récupérer l'état actuel de la partie depuis la base de données
    const result = await pool.query('SELECT state, player FROM games WHERE id = $1', [gameId]);
    const { state, player } = result.rows[0];
    let boardState = JSON.parse(state);

    // Vérifier si la case est déjà occupée
    if (boardState[i][j] !== '') {
      res.status(400).json({ error: 'Cell already filled' });
      return;
    }

    // Mettre à jour l'état de la partie avec le coup joué
    boardState[i][j] = player;

    // Vérifier s'il y a un gagnant ou si la partie est terminée
    const winner = checkWinner(boardState);
    if (winner) {
      await endGame(gameId, boardState, res);
    } else {
      // Changer de joueur pour le prochain coup
      const nextPlayer = player === 'X' ? 'O' : 'X';
      // Mettre à jour l'état de la partie dans la base de données avec le nouveau joueur
      await pool.query('UPDATE games SET state = $1, player = $2 WHERE id = $3', [JSON.stringify(boardState), nextPlayer, gameId]);
      res.json({ state: boardState, player: nextPlayer });
    }

  } catch (error) {
    console.error('Error playing move:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Route pour récupérer l'état actuel d'une partie de morpion
app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;

    // Récupérer l'état actuel de la partie depuis la base de données
    const result = await pool.query('SELECT state, player FROM games WHERE id = $1', [gameId]);
    const { state, player } = result.rows[0];
    const boardState = JSON.parse(state);

    // Renvoyer l'état de la partie dans la réponse JSON
    res.json({ id: gameId, state: boardState, player });
  } catch (error) {
    console.error('Error fetching game state:', error);
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

    // Vérifier si une cellule a été sélectionnée
    if (!cell) {
      res.redirect('/game');
      return;
    }

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
      res.render('congrats', { message, newGameRedirect: true });
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

// Fonction pour terminer la partie et afficher le message de félicitations
async function endGame(gameId, boardState, res) {
  // Réinitialiser le jeu
  await pool.query('UPDATE games SET state = $1, player = $2 WHERE id = $3', [JSON.stringify([["", "", ""], ["", "", ""], ["", "", ""]]), 'X', gameId]);

  // Afficher le message de félicitations avec le joueur gagnant
  const winner = checkWinner(boardState);
  let message;
  if (winner === 'draw') {
    message = 'Dommage, vous avez fait match nul.';
  } else {
    message = `Félicitations, joueur ${winner}, vous avez gagné !`;
  }
  res.render('congrats', { message, newGameRedirect: true });
}

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

