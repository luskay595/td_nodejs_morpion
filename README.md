# Morpion (Tic-Tac-Toe) Application

Welcome to the Morpion application, a Tic-Tac-Toe game developed using React, Node.js, and PostgreSQL. This project utilizes Docker to simplify installation and running of the application.

## Prerequisites

- [Docker](https://www.docker.com/get-started)
- [Node.js](https://nodejs.org/en/download/) (version 14.x or higher)
- [npm](https://www.npmjs.com/get-npm)

## Installation

Follow these steps to install and run the application on your local machine.

### 1. Clone the repository

Clone the GitHub repository using either SSH or HTTPS:

```bash
# Clone with SSH
git clone git@github.com:luskay595/td_nodejs_morpion.git

# Or clone with HTTPS
git clone https://github.com/luskay595/td_nodejs_morpion.git

cd td_nodejs_morpion
```

### 2. Start Docker services

Next, start the Docker services, including PostgreSQL:

```bash
docker-compose up -d
```

This command will launch a PostgreSQL instance configured as per `docker-compose.yml`.

### 3. Install dependencies

Install project dependencies using npm:

```bash
npm install
```

### 4. Start Node.js server

Start the Node.js server serving the backend API:

```bash
node server.js
```

The server will listen on port 3000.

### 5. Start React application

In another terminal, start the React application:

```bash
npm start
```

The React application will be accessible at [http://localhost:3001](http://localhost:3001).

## Usage

- Visit [http://localhost:3001](http://localhost:3001) in your browser to play Tic-Tac-Toe.
- Games are stored in the PostgreSQL database.
- The backend API handles create, update, and retrieve game state operations.

## Architecture

- `docker-compose.yml`: Docker services configuration, including PostgreSQL.
- `server.js`: Node.js server handling the backend API.
- `src/`: Source code of the React application.
  - `Board.js`: Game board component.
  - `Square.js`: Square component for the board.
  - `Game.js`: Main game component.
  - `index.js`: Entry point for the React application.
  - `calculateWinner.js`: Utility function to determine the winner.
  - `styles.css`: Styling for the application.

---
