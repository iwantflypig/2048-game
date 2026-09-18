/**
 * storage.js - LocalStorage persistence for high score and game state
 *
 * Uses localStorage to save:
 * - Best score (always persisted)
 * - Current game state (for restore after refresh)
 */

const Storage = (() => {
    const BEST_SCORE_KEY = '2048-best-score';
    const GAME_STATE_KEY = '2048-game-state';

    function getBestScore() {
        try {
            const value = localStorage.getItem(BEST_SCORE_KEY);
            return value ? parseInt(value, 10) : 0;
        } catch (e) {
            return 0;
        }
    }

    function setBestScore(score) {
        try {
            localStorage.setItem(BEST_SCORE_KEY, String(score));
        } catch (e) {
            // localStorage might be disabled
        }
    }

    function saveGameState(gameState) {
        try {
            const data = {
                board: gameState.board,
                score: gameState.score,
                gameOver: gameState.gameOver,
                won: gameState.won,
                keepPlaying: gameState.keepPlaying
            };
            localStorage.setItem(GAME_STATE_KEY, JSON.stringify(data));
        } catch (e) {
            // localStorage might be disabled
        }
    }

    function loadGameState() {
        try {
            const raw = localStorage.getItem(GAME_STATE_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (!data || !data.board) return null;
            return data;
        } catch (e) {
            return null;
        }
    }

    function clearGameState() {
        try {
            localStorage.removeItem(GAME_STATE_KEY);
        } catch (e) {
            // ignore
        }
    }

    return {
        getBestScore,
        setBestScore,
        saveGameState,
        loadGameState,
        clearGameState
    };
})();
