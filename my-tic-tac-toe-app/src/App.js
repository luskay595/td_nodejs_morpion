import { useState, useEffect } from 'react';

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    const row = Math.floor(i / 3);
    const col = i % 3;
    onPlay(nextSquares, `${row}-${col}`);
  }

  const winner = calculateWinner(squares);
  let status;
  if (winner ){
   if (winner == 'D') {
    status = "Match nul !";
  } else if (winner) {
    status = 'Winner: ' + winner;
  } }else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }
  

  return (
    <>
      <div className="status">{status}</div>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

export default function Game() {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const [gameId, setGameId] = useState(null);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

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
      const { state, player, winner } = data;

      const nextHistory = [...history.slice(0, currentMove + 1), state.flat()];
      setHistory(nextHistory);
      setCurrentMove(nextHistory.length - 1);

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

  async function jumpTo(nextMove) {
    const state = history[nextMove];

    try {
      const response = await fetch('http://localhost:3000/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: state.map((val, idx) => ({
            i: Math.floor(idx / 3),
            j: idx % 3,
            val: val,
          })),
          player: nextMove % 2 === 0 ? 'X' : 'O',
        }),
      });

      const data = await response.json();
      setGameId(data.id);
      setCurrentMove(nextMove);
    } catch (error) {
      console.error('Error creating new game with current state:', error);
    }
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Go to move #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>
      <div className="game-info">
        <ol>{moves}</ol>
      </div>
    </div>
  );
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}

