import React, { useState, useEffect } from 'react';
import Board from './Board';

export default function Game() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameId, setGameId] = useState(null);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    async function createNewGame() {
      try {
        const response = await fetch('http://localhost/api/games', {
          method: 'POST',
        });
        const data = await response.json();
        setGameId(data.id);
      } catch (error) {
        console.error('Error creating new game:', error);
      }
    }

    async function fetchGamesPlayed() {
      try {
        const response = await fetch('http://localhost/api/games');
        const data = await response.json();
        setGamesPlayed(data.gamesPlayed);
      } catch (error) {
        console.error('Error fetching games played:', error);
      }
    }

    createNewGame();
    fetchGamesPlayed();
  }, []);

  async function handlePlay(nextSquares, cell) {
    if (!gameId) return;

    try {
      const response = await fetch(`http://localhost/api/games/${gameId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cell }),
      });

      const data = await response.json();
      const { state, winner } = data;

      setSquares(state.flat());
      setXIsNext(!xIsNext);

      if (winner) {
        if (winner === 'D') {
          alert("Match nul !");
        } else {
          alert(`Winner: ${winner}`);
        }
        // Fetch the updated number of games played
        fetchGamesPlayed();
      }
    } catch (error) {
      console.error('Error playing move:', error);
    }
  }

  return (
    <div className="game">
      <div className="game-info">
        <h3>Games Played: {gamesPlayed}</h3>
        <button onClick={() => window.location.reload()}>New Game</button>
      </div>
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={squares} onPlay={handlePlay} />
      </div>
    </div>
  );
}
