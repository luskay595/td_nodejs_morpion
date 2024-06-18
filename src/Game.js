import React, { useState, useEffect } from 'react';
import Board from './Board';

export default function Game() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [gameId, setGameId] = useState(null);

  useEffect(() => {
    async function createNewGame() {
      try {
        const response = await fetch('http://localhost:3000/api/games', {
          method: 'POST',
        });
        const data = await response.json();
        setGameId(data.id);
      } catch (error) {
        console.error('Error creating new game:', error);
      }
    }
    createNewGame();
  }, []);

  async function handlePlay(nextSquares, cell) {
    if (!gameId) return;

    try {
      const response = await fetch(`http://localhost:3000/api/games/${gameId}`, {
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
      }
    } catch (error) {
      console.error('Error playing move:', error);
    }
  }

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={squares} onPlay={handlePlay} />
      </div>
    </div>
  );
}
