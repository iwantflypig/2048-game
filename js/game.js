/**
 * game.js - Game controller
 *
 * Manages game state, executes moves, handles spawning, and renders tiles.
 * Uses movement data from board.js for smooth CSS animations.
 */

const Game = (() => {
    const state = {
        board: [],
        score: 0,
        bestScore: 0,
        gameOver: false,
        won: false,
        keepPlaying: false
    };

    let tileContainer = null;
    let scoreEl = null;
    let bestScoreEl = null;
    let messageEl = null;
    let messageTextEl = null;
    let retryBtn = null;
    let keepPlayingBtn = null;
    let newGameBtn = null;

    // Keep track of tile elements by position
    let tileElements = {};

    function init() {
        tileContainer = document.getElementById('tile-container');
        scoreEl = document.getElementById('score');
        bestScoreEl = document.getElementById('best-score');
        messageEl = document.getElementById('game-message');
        messageTextEl = document.getElementById('message-text');
        retryBtn = document.getElementById('retry-btn');
        keepPlayingBtn = document.getElementById('keep-playing-btn');
        newGameBtn = document.getElementById('new-game-btn');

        state.bestScore = Storage.getBestScore();
        updateBestScoreDisplay();

        const savedState = Storage.loadGameState();
        if (savedState) {
            state.board = savedState.board;
            state.score = savedState.score;
            state.gameOver = savedState.gameOver;
            state.won = savedState.won;
            state.keepPlaying = savedState.keepPlaying;
            updateScoreDisplay();
            renderBoard();
            if (state.gameOver) showGameOver();
            else if (state.won && !state.keepPlaying) showWin();
        } else {
            restart();
        }

        Input.init(api);

        retryBtn.addEventListener('click', () => {
            hideMessage();
            restart();
        });

        keepPlayingBtn.addEventListener('click', () => {
            hideMessage();
            state.keepPlaying = true;
            Storage.saveGameState(state);
        });

        newGameBtn.addEventListener('click', () => {
            hideMessage();
            restart();
        });
    }

    function restart() {
        state.board = Board.createBoard();
        state.score = 0;
        state.gameOver = false;
        state.won = false;
        state.keepPlaying = false;

        updateScoreDisplay();
        clearTiles();

        const tile1 = addRandomTile();
        const tile2 = addRandomTile();

        renderBoard([tile1, tile2]);
        Storage.clearGameState();
    }

    function addRandomTile() {
        if (!Board.cellsAvailable(state.board)) return null;

        const emptyCells = Board.getEmptyCells(state.board);
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        state.board[cell.row][cell.col] = value;
        return cell;
    }

    function move(direction) {
        if (state.gameOver || (state.won && !state.keepPlaying)) return;

        let result;
        switch (direction) {
            case 'left':  result = Board.moveLeft(state.board);  break;
            case 'right': result = Board.moveRight(state.board); break;
            case 'up':    result = Board.moveUp(state.board);    break;
            case 'down':  result = Board.moveDown(state.board);  break;
            default: return;
        }

        if (!result.moved) return;

        state.board = result.board;
        state.score += result.scoreIncrease;
        updateScoreDisplay();
        updateBestScore();

        const newTile = addRandomTile();

        // Check win
        if (!state.won && !state.keepPlaying) {
            const S = Board.SIZE;
            for (let r = 0; r < S; r++) {
                for (let c = 0; c < S; c++) {
                    if (state.board[r][c] >= 4096) {
                        state.won = true;
                        break;
                    }
                }
                if (state.won) break;
            }
        }

        // Check game over
        if (!Board.availableMoves(state.board).length) {
            state.gameOver = true;
        }

        // Render with movement info
        renderBoard(newTile ? [newTile] : [], result.movements);

        if (state.won && !state.keepPlaying) {
            showWin();
        } else if (state.gameOver) {
            showGameOver();
        }

        Storage.saveGameState(state);
    }

    // ---- Rendering with animation ----

    function renderBoard(newTiles = [], movements = []) {
        // Step 1: Create a map of old positions from current DOM
        const oldPositions = {};
        for (const [key, tile] of Object.entries(tileElements)) {
            oldPositions[key] = {
                row: parseInt(tile.dataset.row),
                col: parseInt(tile.dataset.col),
                value: parseInt(tile.dataset.value)
            };
        }

        // Step 2: Clear tile container and element cache
        tileContainer.innerHTML = '';
        tileElements = {};

        // Step 3: Determine which tiles are merged (so we can apply special animation)
        const mergedPositions = new Set();
        const movedFrom = new Set();
        
        for (const movement of movements) {
            for (const from of movement.from) {
                movedFrom.add(`${from.row}-${from.col}`);
            }
            if (movement.merged) {
                mergedPositions.add(`${movement.to.row}-${movement.to.col}`);
            }
        }

        // Step 4: Create all current tiles
        const S = Board.SIZE;
        for (let r = 0; r < S; r++) {
            for (let c = 0; c < S; c++) {
                const value = state.board[r][c];
                if (value === 0) continue;

                const key = `${r}-${c}`;
                const isMerged = mergedPositions.has(key);
                const isNew = newTiles.some(t => t.row === r && t.col === c);

                const tile = createTileElement(r, c, value, isMerged, isNew);
                tileContainer.appendChild(tile);
                tileElements[key] = tile;
            }
        }
    }

    function createTileElement(row, col, value, isMerged, isNew) {
        const tile = document.createElement('div');
        tile.id = `tile-${row}-${col}`;
        tile.dataset.key = `${row}-${col}`;
        tile.dataset.row = row;
        tile.dataset.col = col;
        tile.dataset.value = value;

        let className = `tile tile-${value}`;
        if (isMerged) className += ' tile-merged';
        if (isNew) className += ' tile-new';
        tile.className = className;

        tile.style.setProperty('--row', row);
        tile.style.setProperty('--col', col);

        const inner = document.createElement('div');
        inner.className = 'tile-inner';
        inner.textContent = value;
        tile.appendChild(inner);

        return tile;
    }

    function clearTiles() {
        tileContainer.innerHTML = '';
        tileElements = {};
    }

    function updateScoreDisplay() {
        scoreEl.textContent = state.score;
    }

    function updateBestScore() {
        if (state.score > state.bestScore) {
            state.bestScore = state.score;
            Storage.setBestScore(state.bestScore);
        }
        updateBestScoreDisplay();
    }

    function updateBestScoreDisplay() {
        bestScoreEl.textContent = state.bestScore;
    }

    function showWin() {
        messageTextEl.textContent = '你赢了！';
        messageEl.classList.add('active', 'win');
    }

    function showGameOver() {
        messageTextEl.textContent = '游戏结束';
        messageEl.classList.add('active');
        messageEl.classList.remove('win');
    }

    function hideMessage() {
        messageEl.classList.remove('active', 'win');
    }

    const api = {
        get state() { return state; },
        init,
        restart,
        move
    };

    return api;
})();

document.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
