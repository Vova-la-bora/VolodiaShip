// Глобальные переменные
let usedCells = 0;
const MAX_CELLS = 20;
let gameStarted = false;
let playerTurn = true;
let playerShips = Array(10).fill().map(() => Array(10).fill(0));
let enemyShips = Array(10).fill().map(() => Array(10).fill(0));
let enemyShipsPositions = [];

document.addEventListener('DOMContentLoaded', function() {
    createCells();
    setupDragAndDrop();
    updateCounter();
    
    document.getElementById('startGame').addEventListener('click', startGame);
});

function createCells() {
    const playerField = document.getElementById('playerField');
    const enemyField = document.getElementById('enemyField');
    
    for (let i = 0; i < 100; i++) {
        const playerCell = document.createElement('div');
        playerCell.className = 'cell';
        playerCell.dataset.index = i;
        playerCell.dataset.row = Math.floor(i / 10);
        playerCell.dataset.col = i % 10;
        playerField.appendChild(playerCell);

        const enemyCell = document.createElement('div');
        enemyCell.className = 'cell';
        enemyCell.dataset.index = i;
        enemyCell.dataset.row = Math.floor(i / 10);
        enemyCell.dataset.col = i % 10;
        enemyField.appendChild(enemyCell);
    }
}

function setupDragAndDrop() {
    const ships = document.querySelectorAll('.ship');
    const playerField = document.getElementById('playerField');
    
    ships.forEach(ship => {
        ship.addEventListener('dragstart', handleDragStart);
    });
    
    playerField.addEventListener('dragover', handleDragOver);
    playerField.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    if (gameStarted || usedCells >= MAX_CELLS) {
        e.preventDefault();
        return;
    }
    
    const shipSize = parseInt(e.target.dataset.size);
    
    if (usedCells + shipSize > MAX_CELLS) {
        e.preventDefault();
        alert(`Нельзя разместить корабль! Будет превышен лимит в ${MAX_CELLS} клеток.`);
        return;
    }
    
    e.dataTransfer.setData('text/plain', e.target.dataset.size);
    e.target.style.opacity = '0.5';
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    
    if (gameStarted || usedCells >= MAX_CELLS) {
        return;
    }
    
    const shipSize = parseInt(e.dataTransfer.getData('text/plain'));
    const cell = e.target;
    
    if (usedCells + shipSize > MAX_CELLS) {
        alert(`Нельзя разместить корабль! Будет превышен лимит в ${MAX_CELLS} клеток.`);
        return;
    }
    
    if (cell.classList.contains('cell')) {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Пробуем разместить горизонтально
        if (canPlaceShip(row, col, shipSize, true)) {
            placeShip(row, col, shipSize, true);
            updateCounter();
            checkShipsAvailability();
        } else if (canPlaceShip(row, col, shipSize, false)) {
            // Если не получается горизонтально, пробуем вертикально
            placeShip(row, col, shipSize, false);
            updateCounter();
            checkShipsAvailability();
        } else {
            alert('Нельзя разместить корабль здесь! Проверьте границы и соседние клетки.');
        }
    }
    
    const ships = document.querySelectorAll('.ship');
    ships.forEach(ship => ship.style.opacity = '1');
}

function canPlaceShip(startRow, startCol, size, horizontal) {
    // Проверяем границы поля
    if (horizontal) {
        if (startCol + size > 10) {
            return false;
        }
    } else {
        if (startRow + size > 10) {
            return false;
        }
    }
    
    // Проверяем все клетки корабля и вокруг них
    for (let i = -1; i <= size; i++) {
        for (let j = -1; j <= 1; j++) {
            let checkRow, checkCol;
            
            if (horizontal) {
                checkRow = startRow + j;
                checkCol = startCol + i;
            } else {
                checkRow = startRow + i;
                checkCol = startCol + j;
            }
            
            // Проверяем только клетки внутри поля
            if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 10) {
                if (playerShips[checkRow][checkCol] === 1) {
                    return false; // Нашли другой корабль рядом
                }
            }
        }
    }
    
    return true;
}

function placeShip(startRow, startCol, size, horizontal) {
    for (let i = 0; i < size; i++) {
        const row = horizontal ? startRow : startRow + i;
        const col = horizontal ? startCol + i : startCol;
        
        playerShips[row][col] = 1;
        usedCells++;
        
        const cellIndex = row * 10 + col;
        const cell = document.querySelector(`#playerField .cell[data-index="${cellIndex}"]`);
        cell.classList.add('has-ship');
    }
}

function updateCounter() {
    const counterElement = document.getElementById('usedCells');
    const counterContainer = document.querySelector('.counter');
    
    counterElement.textContent = usedCells;
    
    if (usedCells >= MAX_CELLS) {
        counterContainer.classList.add('limit-reached');
    } else {
        counterContainer.classList.remove('limit-reached');
    }
}

function checkShipsAvailability() {
    const ships = document.querySelectorAll('.ship');
    
    ships.forEach(ship => {
        const shipSize = parseInt(ship.dataset.size);
        
        if (usedCells + shipSize > MAX_CELLS) {
            ship.classList.add('disabled');
            ship.draggable = false;
        } else {
            ship.classList.remove('disabled');
            ship.draggable = true;
        }
    });
}

function startGame() {
    if (usedCells !== MAX_CELLS) {
        alert(`Расставьте все ${MAX_CELLS} клеток кораблей перед началом игры!`);
        return;
    }
    
    gameStarted = true;
    playerTurn = true;
    
    // Блокируем расстановку кораблей
    const ships = document.querySelectorAll('.ship');
    ships.forEach(ship => {
        ship.classList.add('disabled');
        ship.draggable = false;
    });
    
    document.getElementById('startGame').disabled = true;
    
    // Расставляем корабли противника
    setupEnemyShips();
    
    // Настраиваем стрельбу по полю противника
    setupShooting();
    
    updateGameStatus('Ваш ход! Стреляйте по полю противника');
}

function setupEnemyShips() {
    const enemyShipsSizes = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    let placedCells = 0;
    
    for (const size of enemyShipsSizes) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            attempts++;
            const horizontal = Math.random() > 0.5;
            const row = Math.floor(Math.random() * 10);
            const col = Math.floor(Math.random() * 10);
            
            if (canPlaceEnemyShip(row, col, size, horizontal)) {
                placeEnemyShip(row, col, size, horizontal);
                placed = true;
                placedCells += size;
            }
        }
    }
}

function canPlaceEnemyShip(startRow, startCol, size, horizontal) {
    // Проверяем границы поля
    if (horizontal) {
        if (startCol + size > 10) return false;
    } else {
        if (startRow + size > 10) return false;
    }
    
    // Проверяем все клетки корабля и вокруг них
    for (let i = -1; i <= size; i++) {
        for (let j = -1; j <= 1; j++) {
            let checkRow, checkCol;
            
            if (horizontal) {
                checkRow = startRow + j;
                checkCol = startCol + i;
            } else {
                checkRow = startRow + i;
                checkCol = startCol + j;
            }
            
            // Проверяем только клетки внутри поля
            if (checkRow >= 0 && checkRow < 10 && checkCol >= 0 && checkCol < 10) {
                if (enemyShips[checkRow][checkCol] === 1) {
                    return false; // Нашли другой корабль рядом
                }
            }
        }
    }
    
    return true;
}

function placeEnemyShip(startRow, startCol, size, horizontal) {
    const shipPositions = [];
    
    for (let i = 0; i < size; i++) {
        const row = horizontal ? startRow : startRow + i;
        const col = horizontal ? startCol + i : startCol;
        
        enemyShips[row][col] = 1;
        shipPositions.push({row, col});
    }
    
    enemyShipsPositions.push(shipPositions);
}

function setupShooting() {
    const enemyCells = document.querySelectorAll('#enemyField .cell');
    
    enemyCells.forEach(cell => {
        cell.addEventListener('click', function() {
            if (!gameStarted || !playerTurn) return;
            
            const row = parseInt(this.dataset.row);
            const col = parseInt(this.dataset.col);
            
            // Проверяем, не стреляли ли уже сюда
            if (this.classList.contains('hit') || this.classList.contains('miss')) {
                return;
            }
            
            // Игрок стреляет
            if (enemyShips[row][col] === 1) {
                this.classList.add('hit');
                enemyShips[row][col] = 2; // Помечаем как подбитый
                updateGameStatus('Попадание! Стреляйте снова');
                
                // Проверяем потоплен ли корабль
                if (checkShipSunk(enemyShipsPositions, row, col)) {
                    updateGameStatus('Корабль противника потоплен! Продолжайте стрелять');
                }
                
                // Проверяем победу
                if (checkWin(enemyShips)) {
                    endGame(true);
                    return;
                }
            } else {
                this.classList.add('miss');
                enemyShips[row][col] = 3; // Помечаем как промах
                updateGameStatus('Промах! Ход противника');
                playerTurn = false;
                
                // Ход бота
                setTimeout(enemyShoot, 1000);
            }
        });
    });
}

function enemyShoot() {
    if (!gameStarted || playerTurn) return;
    
    let row, col;
    let attempts = 0;
    
    // Бот ищет случайную свободную клетку
    do {
        row = Math.floor(Math.random() * 10);
        col = Math.floor(Math.random() * 10);
        attempts++;
    } while (playerShips[row][col] >= 2 && attempts < 100);
    
    const cellIndex = row * 10 + col;
    const cell = document.querySelector(`#playerField .cell[data-index="${cellIndex}"]`);
    
    if (playerShips[row][col] === 1) {
        cell.classList.add('hit');
        playerShips[row][col] = 2;
        updateGameStatus('Противник попал! Его ход продолжается');
        
        // Проверяем победу бота
        if (checkWin(playerShips)) {
            endGame(false);
            return;
        }
        
        // Бот стреляет снова
        setTimeout(enemyShoot, 1000);
    } else {
        cell.classList.add('miss');
        playerShips[row][col] = 3;
        updateGameStatus('Противник промахнулся! Ваш ход');
        playerTurn = true;
    }
}

function checkShipSunk(shipsPositions, row, col) {
    for (const ship of shipsPositions) {
        for (const position of ship) {
            if (position.row === row && position.col === col) {
                // Проверяем весь корабль
                const sunk = ship.every(pos => enemyShips[pos.row][pos.col] === 2);
                return sunk;
            }
        }
    }
    return false;
}

function checkWin(shipsField) {
    // Победа, если все клетки с кораблями подбиты
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            if (shipsField[i][j] === 1) { // Если остался неподбитый корабль
                return false;
            }
        }
    }
    return true;
}

function updateGameStatus(message) {
    const statusElement = document.getElementById('gameStatus');
    statusElement.textContent = message;
    statusElement.className = 'game-status';
    
    if (message.includes('Ваш ход')) {
        statusElement.classList.add('player-turn');
    } else if (message.includes('Ход противника')) {
        statusElement.classList.add('enemy-turn');
    }
}

function endGame(playerWon) {
    gameStarted = false;
    
    const statusElement = document.getElementById('gameStatus');
    if (playerWon) {
        statusElement.textContent = '🎉 Поздравляем! Вы победили!';
        statusElement.classList.add('win');
    } else {
        statusElement.textContent = '💥 К сожалению, вы проиграли!';
        statusElement.classList.add('lose');
    }
    
    // Показываем корабли противника
    showEnemyShips();
}

function showEnemyShips() {
    const enemyCells = document.querySelectorAll('#enemyField .cell');
    
    enemyCells.forEach(cell => {
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (enemyShips[row][col] === 1) { // Неподбитые корабли противника
            cell.classList.add('has-ship');
        }
    });
}