/**
 * input.js - Unified input handling
 * Supports: Arrow keys, WASD, Touch swipe
 * All inputs are converted to directional events dispatched to the game
 */

const Input = (() => {
    let game = null;

    function init(gameInstance) {
        game = gameInstance;

        // Keyboard
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);

        // Touch
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
            gameContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
            gameContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
        }

        // Prevent whole-page scroll/bounce on the game area
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
    }

    function destroy() {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);

        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.removeEventListener('touchstart', handleTouchStart);
            gameContainer.removeEventListener('touchmove', handleTouchMove);
            gameContainer.removeEventListener('touchend', handleTouchEnd);
        }
    }

    const keyMap = {
        'ArrowUp': 'up',
        'ArrowDown': 'down',
        'ArrowLeft': 'left',
        'ArrowRight': 'right',
        'KeyW': 'up',
        'KeyS': 'down',
        'KeyA': 'left',
        'KeyD': 'right',
        'KeyR': 'restart'
    };

    function handleKeyDown(e) {
        if (!game) return;

        // Prevent default for game keys
        const mapped = keyMap[e.code];
        if (mapped) {
            e.preventDefault();
        }

        if (e.repeat) return;

        if (e.code === 'KeyR') {
            game.restart();
            return;
        }

        if (e.code === 'Enter' || e.code === 'Space') {
            if (game.state.gameOver || (game.state.won && !game.state.keepPlaying)) {
                game.restart();
            }
        }
    }

    function handleKeyUp(e) {
        if (!game) return;

        const mapped = keyMap[e.code];
        if (!mapped || mapped === 'restart') return;

        game.move(mapped);
    }

    // Touch handling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    function handleTouchStart(e) {
        if (e.touches.length > 1) return;
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
    }

    function handleTouchMove(e) {
        e.preventDefault();
    }

    function handleTouchEnd(e) {
        if (!game) return;
        if (e.changedTouches.length === 0) return;

        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;

        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Must move at least 30px within 500ms
        if (Math.max(absDx, absDy) < 30 || elapsed > 500) return;

        e.preventDefault();

        // Determine direction (the larger delta wins)
        if (absDx > absDy) {
            game.move(dx > 0 ? 'right' : 'left');
        } else {
            game.move(dy > 0 ? 'down' : 'up');
        }
    }

    return {
        init,
        destroy
    };
})();
