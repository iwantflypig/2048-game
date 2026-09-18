/**
 * board.js - Board data structure and core transformations
 *
 * Handles:
 * - Board creation
 * - Cell operations (get/set/empty)
 * - Line transformation (merge algorithm)
 * - Board state queries (empty cells, available moves)
 * - Movement tracking (for animation)
 */

const Board = (() => {
    const SIZE = 6;

    function createBoard() {
        const board = [];
        for (let r = 0; r < SIZE; r++) {
            board.push(new Array(SIZE).fill(0));
        }
        return board;
    }

    function cloneBoard(board) {
        return board.map(row => [...row]);
    }

    function getEmptyCells(board) {
        const cells = [];
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                if (board[r][c] === 0) {
                    cells.push({ row: r, col: c });
                }
            }
        }
        return cells;
    }

    function cellsAvailable(board) {
        return getEmptyCells(board).length > 0;
    }

    function availableMoves(board) {
        const moves = [];
        if (canMoveLeft(board)) moves.push('left');
        if (canMoveRight(board)) moves.push('right');
        if (canMoveUp(board)) moves.push('up');
        if (canMoveDown(board)) moves.push('down');
        return moves;
    }

    function canMoveLeft(board) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE - 1; c++) {
                if (board[r][c] !== 0) {
                    if (board[r][c + 1] === 0 || board[r][c] === board[r][c + 1]) return true;
                }
            }
        }
        return false;
    }

    function canMoveRight(board) {
        for (let r = 0; r < SIZE; r++) {
            for (let c = SIZE - 1; c > 0; c--) {
                if (board[r][c] !== 0) {
                    if (board[r][c - 1] === 0 || board[r][c] === board[r][c - 1]) return true;
                }
            }
        }
        return false;
    }

    function canMoveUp(board) {
        for (let c = 0; c < SIZE; c++) {
            for (let r = 0; r < SIZE - 1; r++) {
                if (board[r][c] !== 0) {
                    if (board[r + 1][c] === 0 || board[r][c] === board[r + 1][c]) return true;
                }
            }
        }
        return false;
    }

    function canMoveDown(board) {
        for (let c = 0; c < SIZE; c++) {
            for (let r = SIZE - 1; r > 0; r--) {
                if (board[r][c] !== 0) {
                    if (board[r - 1][c] === 0 || board[r][c] === board[r - 1][c]) return true;
                }
            }
        }
        return false;
    }

    /**
     * Core transformation: remove zeros, merge adjacent equal values, pad with zeros.
     * Also tracks movements for animation.
     * e.g. [2, 0, 2, 4] -> [4, 4, 0, 0]
     * e.g. [2, 2, 2, 2] -> [4, 4, 0, 0] (not [8, 0, 0, 0])
     * Returns: { newLine, scoreIncrease, moved, movements }
     * movements: [{ from: [{row, col}*], to: {row, col}, value, merged }]
     */
    function moveLine(line, lineIndex, isRow, reverse) {
        const movements = [];
        
        // Record non-zero values with their original positions
        const nonZero = [];
        for (let i = 0; i < line.length; i++) {
            if (line[i] !== 0) {
                nonZero.push({ value: line[i], originalIndex: i });
            }
        }
        
        const newLine = new Array(line.length).fill(0);
        let writeIdx = 0;
        let scoreIncrease = 0;
        
        for (let i = 0; i < nonZero.length; i++) {
            if (i < nonZero.length - 1 && nonZero[i].value === nonZero[i + 1].value) {
                // Merge
                const newValue = nonZero[i].value * 2;
                newLine[writeIdx] = newValue;
                scoreIncrease += newValue;
                
                // Calculate actual board coordinates
                const getPos = (idx) => {
                    if (isRow) {
                        return reverse 
                            ? { row: lineIndex, col: SIZE - 1 - idx }
                            : { row: lineIndex, col: idx };
                    } else {
                        return reverse
                            ? { row: SIZE - 1 - idx, col: lineIndex }
                            : { row: idx, col: lineIndex };
                    }
                };
                
                const from1 = getPos(nonZero[i].originalIndex);
                const from2 = getPos(nonZero[i + 1].originalIndex);
                const to = getPos(writeIdx);
                
                movements.push({
                    from: [from1, from2],
                    to,
                    value: newValue,
                    merged: true
                });
                writeIdx++;
                i++; // Skip merged tile
            } else {
                // Move (no merge)
                newLine[writeIdx] = nonZero[i].value;
                
                if (nonZero[i].originalIndex !== writeIdx) {
                    const getPos = (idx) => {
                        if (isRow) {
                            return reverse 
                                ? { row: lineIndex, col: SIZE - 1 - idx }
                                : { row: lineIndex, col: idx };
                        } else {
                            return reverse
                                ? { row: SIZE - 1 - idx, col: lineIndex }
                                : { row: idx, col: lineIndex };
                        }
                    };
                    
                    const from = getPos(nonZero[i].originalIndex);
                    const to = getPos(writeIdx);
                    
                    movements.push({
                        from: [from],
                        to,
                        value: nonZero[i].value,
                        merged: false
                    });
                }
                writeIdx++;
            }
        }
        
        let moved = false;
        for (let i = 0; i < line.length; i++) {
            if (line[i] !== newLine[i]) {
                moved = true;
                break;
            }
        }
        
        return { newLine, scoreIncrease, moved, movements };
    }

    function moveLeft(board) {
        let scoreIncrease = 0;
        let moved = false;
        const newBoard = createBoard();
        const allMovements = [];

        for (let r = 0; r < SIZE; r++) {
            const row = [...board[r]];
            const result = moveLine(row, r, true, false);
            newBoard[r] = result.newLine;
            scoreIncrease += result.scoreIncrease;
            allMovements.push(...result.movements);
            if (result.moved) moved = true;
        }

        return { board: newBoard, scoreIncrease, moved, movements: allMovements };
    }

    function moveRight(board) {
        let scoreIncrease = 0;
        let moved = false;
        const newBoard = createBoard();
        const allMovements = [];

        for (let r = 0; r < SIZE; r++) {
            const row = [...board[r]].reverse();
            const result = moveLine(row, r, true, true);
            newBoard[r] = result.newLine.reverse();
            scoreIncrease += result.scoreIncrease;
            allMovements.push(...result.movements);
            if (result.moved) moved = true;
        }

        return { board: newBoard, scoreIncrease, moved, movements: allMovements };
    }

    function moveUp(board) {
        let scoreIncrease = 0;
        let moved = false;
        const newBoard = createBoard();
        const allMovements = [];

        for (let c = 0; c < SIZE; c++) {
            const col = [];
            for (let r = 0; r < SIZE; r++) col.push(board[r][c]);
            const result = moveLine(col, c, false, false);
            for (let r = 0; r < SIZE; r++) {
                newBoard[r][c] = result.newLine[r];
            }
            scoreIncrease += result.scoreIncrease;
            allMovements.push(...result.movements);
            if (result.moved) moved = true;
        }

        return { board: newBoard, scoreIncrease, moved, movements: allMovements };
    }

    function moveDown(board) {
        let scoreIncrease = 0;
        let moved = false;
        const newBoard = createBoard();
        const allMovements = [];

        for (let c = 0; c < SIZE; c++) {
            const col = [];
            for (let r = SIZE - 1; r >= 0; r--) col.push(board[r][c]);
            const result = moveLine(col, c, false, true);
            for (let r = 0; r < SIZE; r++) {
                newBoard[SIZE - 1 - r][c] = result.newLine[r];
            }
            scoreIncrease += result.scoreIncrease;
            allMovements.push(...result.movements);
            if (result.moved) moved = true;
        }

        return { board: newBoard, scoreIncrease, moved, movements: allMovements };
    }

    return {
        SIZE,
        createBoard,
        cloneBoard,
        getEmptyCells,
        cellsAvailable,
        availableMoves,
        canMoveLeft,
        canMoveRight,
        canMoveUp,
        canMoveDown,
        moveLeft,
        moveRight,
        moveUp,
        moveDown
    };
})();
