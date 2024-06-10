import React, { useState, useEffect } from 'react';

function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ squares, onSquareClick }) {
  return (
    <>
      <div className="board-row">
        {squares.map((value, index) => (
          <Square key={index} value={value} onSquareClick={() => onSquareClick(index)} />
        ))}
      </div>
    </>
  );
}

export default function Game() {
  const [currentMove, setCurrentMove] = useState(0);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [boardState, setBoardState] = useState(Array(9).fill(null));

  useEffect(() => {
    // Charger l'état initial du jeu au chargement de la page
    fetch(`/api/games/${currentMove}`)
      .then(response => response.json())
      .then(data => {
        setCurrentPlayer(data.player);
        setBoardState(data.state);
      })
      .catch(error => console.error('Error:', error));
  }, []);

  function handlePlay(index) {
    if (boardState[index] || calculateWinner(boardState)) {
      return;
    }

    const nextSquares = [...boardState];
    nextSquares[index] = currentPlayer;

    const requestOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cell: `${Math.floor(index / 3)}-${index % 3}` }),
    };

    fetch(`/api/games/${currentMove}`, requestOptions)
      .then(response => response.json())
      .then(data => {
        setCurrentMove(currentMove + 1);
        setCurrentPlayer(data.player);
        setBoardState(data.state);
      })
      .catch(error => console.error('Error:', error));
  }

  function jumpTo(move) {
    fetch(`/api/games/${move}`)
      .then(response => response.json())
      .then(data => {
        setCurrentMove(move);
        setCurrentPlayer(data.player);
        setBoardState(data.state);
      })
      .catch(error => console.error('Error:', error));
  }

  const winner = calculateWinner(boardState);
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else {
    status = 'Next player: ' + currentPlayer;
  }

  const moves = Array(currentMove + 1).fill().map((_, move) => {
    const description = move ? 'Go to move #' + move : 'Go to game start';
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  return (
    <div className="game">
      <div className="game-board">
        <Board squares={boardState} onSquareClick={handlePlay} />
      </div>
      <div className="game-info">
        <div>{status}</div>
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

