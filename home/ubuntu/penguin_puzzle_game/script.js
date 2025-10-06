const CHARACTER_IMAGE = 'puzzle_ville_character.png';
const REWARD_IMAGE = 'morning_ville_trophy_transparent.png';

class PenguinPuzzleGame {
    constructor() {
        this.currentLevel = 1;
        this.moves = 0;
        this.gridSize = 6;
        this.grid = [];
        this.selectedBlock = null;
        this.backgroundMusic = document.getElementById("background-music");
        
        // Game elements
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.levelComplete = document.getElementById('level-complete');
        this.gameOver = document.getElementById('game-over');
        this.gameBoard = document.getElementById('game-board');
        this.blocksPalette = document.getElementById('blocks-palette');
        this.levelDisplay = document.getElementById('level-display');
        this.movesDisplay = document.getElementById('moves-display');
        
        // Define levels
        this.levels = [
            {
                size: 5, // Smaller grid for easier start
                start: { row: 0, col: 0 },
                end: { row: 4, col: 4 },
                obstacles: [
                    { row: 2, col: 1 } // Fewer obstacles
                ],
                blocks: [
                    { type: 'straight', count: 6 }, // More blocks than needed
                    { type: 'corner', count: 5 }    // More blocks than needed
                ]
            },
            {
                size: 7,
                start: { row: 0, col: 0 },
                end: { row: 6, col: 6 },
                obstacles: [
                    { row: 2, col: 3 },
                    { row: 3, col: 2 },
                    { row: 4, col: 4 }
                ],
                blocks: [
                    { type: 'straight', count: 7 }, // Increased
                    { type: 'corner', count: 6 }    // Increased
                ]
            },
            {
                size: 8,
                start: { row: 0, col: 0 },
                end: { row: 7, col: 7 },
                obstacles: [
                    { row: 2, col: 2 },
                    { row: 3, col: 4 },
                    { row: 4, col: 3 },
                    { row: 5, col: 5 }
                ],
                blocks: [
                    { type: 'straight', count: 9 }, // Increased
                    { type: 'corner', count: 8 },    // Increased
                    { type: 't-junction', count: 2 } // Increased
                ]
            }
        ];
        
        this.init();
    }
    
    init() {
        // Button event listeners
        document.getElementById('start-button').addEventListener('click', () => this.startGame());
        document.getElementById('test-path-button').addEventListener('click', () => this.testPath());
        document.getElementById('reset-button').addEventListener('click', () => this.resetLevel());
        document.getElementById('hint-button').addEventListener('click', () => this.showHint());
        document.getElementById('next-level-button').addEventListener('click', () => this.nextLevel());
        document.getElementById('menu-button').addEventListener('click', () => this.showMenu());
        document.getElementById("retry-button").addEventListener("click", () => this.resetLevel());
        document.getElementById("reset-from-fail-button").addEventListener("click", () => this.resetLevel());
        document.getElementById("share-twitter-button-complete").addEventListener("click", () => this.shareToTwitter(true));
        document.getElementById("share-twitter-button-fail").addEventListener("click", () => this.shareToTwitter(false));
        console.log("Game initialized. Start button listener attached.");
    }
    
    startGame() {
        this.currentLevel = 1;
        this.startScreen.classList.add("hidden");
        this.gameScreen.classList.remove("hidden");
        this.loadLevel(this.currentLevel);
        if (this.backgroundMusic) {
            this.backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        }
    }
    
    loadLevel(levelNum) {
        this.moves = 0;
        this.updateDisplay();
        
        const level = this.levels[levelNum - 1];
        this.gridSize = level.size;
        this.grid = [];
        
        // Initialize grid
        for (let row = 0; row < this.gridSize; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.gridSize; col++) {
                this.grid[row][col] = {
                    type: 'empty',
                    connections: []
                };
            }
        }
        
        // Set start and end
        this.grid[level.start.row][level.start.col].type = 'start';
        this.grid[level.end.row][level.end.col].type = 'end';
        
        // Set obstacles
        level.obstacles.forEach(obs => {
            this.grid[obs.row][obs.col].type = 'obstacle';
        });
        
        this.renderBoard();
        this.renderBlocksPalette(level.blocks);
    }
    
    renderBoard() {
        this.gameBoard.innerHTML = '';
        this.gameBoard.style.gridTemplateColumns = `repeat(${this.gridSize}, 60px)`;
        
        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                const cellData = this.grid[row][col];
                
                if (cellData.type === 'start') {
                    cell.classList.add("start");
                    cell.style.backgroundImage = `url(${CHARACTER_IMAGE})`;
                } else if (cellData.type === "end") {
                    cell.classList.add("end");
                    cell.style.backgroundImage = `url(${REWARD_IMAGE})`;
                } else if (cellData.type === 'obstacle') {
                    cell.classList.add('obstacle');
                    cell.textContent = '🌳';
                } else if (cellData.type === 'path') {
                    cell.classList.add('path');
                    cell.textContent = this.getPathSymbol(cellData.connections);
                }
                
                cell.addEventListener('click', (e) => this.handleCellClick(row, col));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.rotateCellPath(row, col);
                });
                
                this.gameBoard.appendChild(cell);
            }
        }
    }
    
    renderBlocksPalette(blocks) {
        this.blocksPalette.innerHTML = '';
        
        blocks.forEach((block, index) => {
            for (let i = 0; i < block.count; i++) {
                const blockItem = document.createElement('div');
                blockItem.className = 'block-item';
                blockItem.dataset.type = block.type;
                blockItem.dataset.index = `${index}-${i}`;
                
                if (block.type === 'straight') {
                    blockItem.textContent = '— Dirt Road';
                } else if (block.type === 'corner') {
                    blockItem.textContent = '└ Corner Path';
                } else if (block.type === 't-junction') {
                    blockItem.textContent = '┴ T-Junction';
                }
                
                blockItem.addEventListener('click', () => this.selectBlock(blockItem));
                this.blocksPalette.appendChild(blockItem);
            }
        });
    }
    
    selectBlock(blockItem) {
        if (blockItem.classList.contains('used')) return;
        
        // Deselect previous
        const prevSelected = this.blocksPalette.querySelector('.selected');
        if (prevSelected) prevSelected.classList.remove('selected');
        
        blockItem.classList.add('selected');
        this.selectedBlock = {
            type: blockItem.dataset.type,
            element: blockItem
        };
    }
    
    handleCellClick(row, col) {
        if (!this.selectedBlock) return;
        
        const cell = this.grid[row][col];
        if (cell.type !== 'empty' && cell.type !== 'path') return;
        
        // Place block
        this.moves++;
        this.updateDisplay();
        
        cell.type = 'path';
        
        // Set connections based on block type
        if (this.selectedBlock.type === 'straight') {
            cell.connections = ['top', 'bottom'];
        } else if (this.selectedBlock.type === 'corner') {
            cell.connections = ['top', 'right'];
        } else if (this.selectedBlock.type === 't-junction') {
            cell.connections = ['top', 'left', 'right'];
        }
        
        // Mark block as used
        this.selectedBlock.element.classList.add('used');
        this.selectedBlock.element.classList.remove('selected');
        this.selectedBlock = null;
        
        this.renderBoard();
    }
    
    rotateCellPath(row, col) {
        const cell = this.grid[row][col];
        if (cell.type !== 'path') return;
        
        // Rotate connections 90 degrees clockwise
        const rotationMap = {
            'top': 'right',
            'right': 'bottom',
            'bottom': 'left',
            'left': 'top'
        };
        
        cell.connections = cell.connections.map(dir => rotationMap[dir]);
        this.renderBoard();
    }
    
    getPathSymbol(connections) {
        if (!connections || connections.length === 0) return '';
        
        const hasTop = connections.includes('top');
        const hasBottom = connections.includes('bottom');
        const hasLeft = connections.includes('left');
        const hasRight = connections.includes('right');
        
        if (hasTop && hasBottom && !hasLeft && !hasRight) return '┃';
        if (hasLeft && hasRight && !hasTop && !hasBottom) return '━';
        if (hasTop && hasRight && !hasBottom && !hasLeft) return '┗';
        if (hasTop && hasLeft && !hasBottom && !hasRight) return '┛';
        if (hasBottom && hasRight && !hasTop && !hasLeft) return '┏';
        if (hasBottom && hasLeft && !hasTop && !hasRight) return '┓';
        if (hasTop && hasLeft && hasRight) return '┻';
        if (hasBottom && hasLeft && hasRight) return '┳';
        if (hasTop && hasBottom && hasLeft) return '┫';
        if (hasTop && hasBottom && hasRight) return '┣';
        if (hasTop && hasBottom && hasLeft && hasRight) return '╋';
        
        return '❄️';
    }
    
    testPath() {
        const level = this.levels[this.currentLevel - 1];
        const visited = new Set();
        const queue = [[level.start.row, level.start.col]];
        visited.add(`${level.start.row},${level.start.col}`);
        
        while (queue.length > 0) {
            const [row, col] = queue.shift();
            
            // Check if we reached the end
            if (row === level.end.row && col === level.end.col) {
                this.levelCompleted();
                return;
            }
            
            const cell = this.grid[row][col];
            const neighbors = this.getConnectedNeighbors(row, col, cell);
            
            neighbors.forEach(([nRow, nCol]) => {
                const key = `${nRow},${nCol}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push([nRow, nCol]);
                }
            });
        }
        
        // Path not found
        this.pathFailed();
    }
    
    getConnectedNeighbors(row, col, cell) {
        const neighbors = [];
        const directions = {
            'top': [-1, 0],
            'bottom': [1, 0],
            'left': [0, -1],
            'right': [0, 1]
        };
        
        if (cell.type === 'start') {
            // Start can connect in all directions
            Object.values(directions).forEach(([dr, dc]) => {
                const newRow = row + dr;
                const newCol = col + dc;
                if (this.isValidCell(newRow, newCol)) {
                    neighbors.push([newRow, newCol]);
                }
            });
        } else if (cell.connections) {
            cell.connections.forEach(dir => {
                const [dr, dc] = directions[dir];
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (this.isValidCell(newRow, newCol)) {
                    const neighborCell = this.grid[newRow][newCol];
                    
                    // Check if neighbor can connect back
                    const oppositeDir = {
                        'top': 'bottom',
                        'bottom': 'top',
                        'left': 'right',
                        'right': 'left'
                    }[dir];
                    
                    if (neighborCell.type === 'end' || 
                        (neighborCell.connections && neighborCell.connections.includes(oppositeDir))) {
                        neighbors.push([newRow, newCol]);
                    }
                }
            });
        }
        
        return neighbors;
    }
    
    isValidCell(row, col) {
        if (row < 0 || row >= this.gridSize || col < 0 || col >= this.gridSize) {
            return false;
        }
        const cell = this.grid[row][col];
        return cell.type !== 'obstacle';
    }
    
    levelCompleted() {
        this.gameScreen.classList.add('hidden');
        this.levelComplete.classList.remove('hidden');
        
        const stats = document.getElementById('level-stats');
        stats.innerHTML = `
            <p>Moves Used: ${this.moves}</p>
            <p>Level: ${this.currentLevel}</p>
        `;
    }
    
    pathFailed() {
        this.gameScreen.classList.add('hidden');
        this.gameOver.classList.remove('hidden');
    }
    
    nextLevel() {
        this.currentLevel++;
        if (this.currentLevel > this.levels.length) {
            alert('Congratulations! You completed all levels!');
            this.showMenu();
            return;
        }
        
        this.levelComplete.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.loadLevel(this.currentLevel);
    }
    
    resetLevel() {
        this.gameOver.classList.add('hidden');
        this.gameScreen.classList.remove('hidden');
        this.loadLevel(this.currentLevel);
    }
    
    showMenu() {
        this.gameScreen.classList.add('hidden');
        this.levelComplete.classList.add('hidden');
        this.gameOver.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
    }
    
    showHint() {
        alert('Hint: Create a continuous path from the penguin to the fish. Right-click to rotate blocks!');
    }
    
    shareToTwitter(isSuccess) {
        const gameUrl = window.location.href;
        let tweetText;

        if (isSuccess) {
            tweetText = `I solved Level ${this.currentLevel} of PuzzleVille in ${this.moves} moves! Can you collect the golden wheat? 👧🌾`;
        } else {
            tweetText = `I tried Level ${this.currentLevel} of PuzzleVille and made ${this.moves} moves! Can you help the villager collect the golden wheat? 👧🌾`;
        }
        
        const hashtags = "PuzzleVille,FarmGame,WebGame";
        const via = "Ramx_ai";
        
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(gameUrl)}&hashtags=${encodeURIComponent(hashtags)}&via=${encodeURIComponent(via)}`;
        
        window.open(twitterUrl, "_blank", "width=550,height=420");
    }

    updateDisplay() {
        this.levelDisplay.textContent = `Level: ${this.currentLevel}`;
        this.movesDisplay.textContent = `Moves: ${this.moves}`;
    }
}

// Initialize game when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    new PenguinPuzzleGame();
});