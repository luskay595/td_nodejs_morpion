const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 5000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'morpion',
  password: 'Benben1010',
  port: 5432,
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
pool.query(`
  CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    state TEXT NOT NULL,
    player CHAR(1) NOT NULL,
    winner CHAR(1),
    CONSTRAINT valid_player CHECK (player IN ('X', 'O'))
  );
`);


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

app.put('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const { cell } = req.body;

    if (!cell || typeof cell !== 'string') {
      res.status(400).json({ error: 'Invalid cell value' });
      return;
    }

    const [i, j] = cell.split('-').map(Number);

    const result = await pool.query('SELECT state, player, winner FROM games WHERE id = $1', [gameId]);
    const { state, player, winner } = result.rows[0];
    let boardState = JSON.parse(state);

    if (winner || boardState[i][j] !== '') {
      res.status(400).json({ error: 'Game already finished or cell already filled' });
      return;
    }

    // Update board state
    boardState[i][j] = player;

    // Check for winner
    let newWinner = checkWinner(boardState);

    // Check for draw
    if (!newWinner && boardState.flat().every(cell => cell !== '')) {
      newWinner = 'D';
    }

    // Change active player
    const nextPlayer = player === 'X' ? 'O' : 'X';

    // Update game state in the database
    await pool.query('UPDATE games SET state = $1, player = $2, winner = $3 WHERE id = $4', [JSON.stringify(boardState), nextPlayer, newWinner, gameId]);

    res.json({ state: boardState, player: nextPlayer, winner: newWinner });
  } catch (error) {
    console.error('Error playing move:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/api/games/:id', async (req, res) => {
  try {
    const gameId = req.params.id;
    const result = await pool.query('SELECT state, player, winner FROM games WHERE id = $1', [gameId]);
    const { state, player, winner } = result.rows[0];
    res.json({ state: JSON.parse(state), player, winner });
  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).send('Internal Server Error');
  }
});

function checkWinner(morpion) {
  // Check rows and columns
  for (let i = 0; i < 3; i++) {
    if (morpion[i][0] !== '' && morpion[i][0] === morpion[i][1] && morpion[i][1] === morpion[i][2]) {
      return morpion[i][0];
    }
    if (morpion[0][i] !== '' && morpion[0][i] === morpion[1][i] && morpion[1][i] === morpion[2][i]) {
      return morpion[0][i];
    }
  }

  // Check diagonals
  if (morpion[0][0] !== '' && morpion[0][0] === morpion[1][1] && morpion[1][1] === morpion[2][2]) {
    return morpion[0][0];
  }
  if (morpion[0][2] !== '' && morpion[0][2] === morpion[1][1] && morpion[1][1] === morpion[2][0]) {
    return morpion[0][2];
  }

  return null;
}

app.listen(port, () => console.log(`Server listening on port ${port}`));

