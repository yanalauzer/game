// ========== МОДЕЛЬ ==========
class Game2048 {
    constructor() {
        this.board = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        this.score = 0;
        this.history = [];
        this.gameOver = false;
        this.records = this.loadRecords();
    }

    // Начало игры
    start() {
        this.clear();
        this.addTile();
        this.addTile();
        if (Math.random() < 0.5) this.addTile();
        this.render();
    }

    // Очистка
    clear() {
        this.board = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
        this.score = 0;
        this.history = [];
        this.gameOver = false;
    }

    // Добавить плитку (2 или 4)
    addTile() {
        const empty = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 0) empty.push([i, j]);
            }
        }
        if (empty.length) {
            const [i, j] = empty[Math.floor(Math.random() * empty.length)];
            this.board[i][j] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    // Движение
    move(dir) {
        if (this.gameOver) return false;

        const prevBoard = JSON.parse(JSON.stringify(this.board));
        const prevScore = this.score;
        let moved = false;
        let addScore = 0;

        // Поворот для обработки всех направлений
        this.rotateTo(dir);
        
        // Двигаем все ряды
        for (let i = 0; i < 4; i++) {
            const row = this.board[i].filter(v => v !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    addScore += row[j];
                    row.splice(j + 1, 1);
                }
            }
            while (row.length < 4) row.push(0);
            if (JSON.stringify(this.board[i]) !== JSON.stringify(row)) moved = true;
            this.board[i] = row;
        }

        // Поворот обратно
        this.rotateBack(dir);

        if (moved) {
            this.history.push({board: prevBoard, score: prevScore});
            if (this.history.length > 10) this.history.shift();
            this.score += addScore;
            this.addTile();
            this.gameOver = this.checkGameOver();
            this.render();
            this.updateUndoButton();
            
            if (this.gameOver) this.showGameOver();
            return true;
        }
        return false;
    }

    // Поворот доски для обработки направлений
    rotateTo(dir) {
        if (dir === 'up') this.rotate(1);
        if (dir === 'right') this.rotate(2);
        if (dir === 'down') this.rotate(3);
    }

    rotateBack(dir) {
        if (dir === 'up') this.rotate(3);
        if (dir === 'right') this.rotate(2);
        if (dir === 'down') this.rotate(1);
    }

    rotate(times) {
        for (let t = 0; t < times; t++) {
            const newBoard = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    newBoard[j][3 - i] = this.board[i][j];
                }
            }
            this.board = newBoard;
        }
    }

    // Отмена
    undo() {
        if (this.gameOver || !this.history.length) return;
        const prev = this.history.pop();
        this.board = prev.board;
        this.score = prev.score;
        this.gameOver = false;
        this.render();
        this.updateUndoButton();
    }

    // Проверка конца игры
    checkGameOver() {
        // Проверка пустых клеток
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.board[i][j] === 0) return false;
            }
        }
        // Проверка соседей
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                if (this.board[i][j] === this.board[i][j+1] || 
                    this.board[j][i] === this.board[j+1][i]) return false;
            }
        }
        return true;
    }

    // Сохранить рекорд
    saveRecord(name) {
        const record = {
            name: name || 'Аноним',
            score: this.score,
            date: new Date().toLocaleDateString()
        };
        this.records.push(record);
        this.records.sort((a, b) => b.score - a.score);
        this.records = this.records.slice(0, 10);
        localStorage.setItem('2048_records', JSON.stringify(this.records));
    }

    // Загрузить рекорды
    loadRecords() {
        const saved = localStorage.getItem('2048_records');
        return saved ? JSON.parse(saved) : [];
    }

    // Сохранить игру
    saveGame() {
        localStorage.setItem('2048_game', JSON.stringify({
            board: this.board,
            score: this.score,
            history: this.history,
            gameOver: this.gameOver
        }));
    }

    // Загрузить игру
    loadGame() {
        const saved = localStorage.getItem('2048_game');
        if (saved) {
            const data = JSON.parse(saved);
            this.board = data.board;
            this.score = data.score;
            this.history = data.history || [];
            this.gameOver = data.gameOver || false;
            this.render();
            this.updateUndoButton();
            return true;
        }
        return false;
    }

    // Обновить кнопку отмены
    updateUndoButton() {
        const btn = document.getElementById('undo');
        if (btn) btn.disabled = this.history.length === 0 || this.gameOver;
    }

    // Отрисовка
    render() {
        const boardEl = document.getElementById('board');
        boardEl.innerHTML = '';
        
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                const val = this.board[i][j];
                if (val !== 0) {
                    const tile = document.createElement('div');
                    tile.className = `tile tile-${val}`;
                    tile.textContent = val;
                    cell.appendChild(tile);
                }
                
                boardEl.appendChild(cell);
            }
        }
        
        document.getElementById('score').textContent = this.score;
    }

    // Показать окно окончания
    showGameOver() {
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('saveBlock').style.display = 'block';
        document.getElementById('savedBlock').style.display = 'none';
        document.getElementById('playerName').value = '';
        document.getElementById('gameOverlay').style.display = 'flex';
    }
}

// ========== ИНИЦИАЛИЗАЦИЯ ==========
const game = new Game2048();

// Загружаем или начинаем новую игру
if (!game.loadGame()) {
    game.start();
}

// Показываем рекорды
function showRecords() {
    const tbody = document.getElementById('recordsBody');
    tbody.innerHTML = '';
    game.records.forEach(r => {
        tbody.innerHTML += `<tr><td>${r.name}</td><td>${r.score}</td><td>${r.date}</td></tr>`;
    });
    document.getElementById('records').style.display = 'block';
    document.getElementById('mobileControls').style.display = 'none';
}

// ========== ОБРАБОТЧИКИ ==========

// Клавиатура
document.addEventListener('keydown', e => {
    if (document.getElementById('gameOverlay').style.display === 'flex') return;
    const key = e.key.replace('Arrow', '').toLowerCase();
    if (['up', 'down', 'left', 'right'].includes(key)) {
        e.preventDefault();
        game.move(key);
    }
});

// Кнопки управления
document.querySelectorAll('[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => game.move(btn.dataset.dir));
});

// Новая игра
document.getElementById('newGame').addEventListener('click', () => {
    if (confirm('Начать заново?')) {
        game.start();
        document.getElementById('gameOverlay').style.display = 'none';
    }
});

// Отмена
document.getElementById('undo').addEventListener('click', () => game.undo());

// Показать рекорды
document.getElementById('showRecords').addEventListener('click', showRecords);

// Закрыть рекорды
document.getElementById('closeRecords').addEventListener('click', () => {
    document.getElementById('records').style.display = 'none';
    if (window.innerWidth <= 768) {
        document.getElementById('mobileControls').style.display = 'grid';
    }
});

// Сохранить рекорд
document.getElementById('saveRecord').addEventListener('click', () => {
    const name = document.getElementById('playerName').value.trim();
    if (name) {
        game.saveRecord(name);
        showRecords();
        document.getElementById('saveBlock').style.display = 'none';
        document.getElementById('savedBlock').style.display = 'block';
    } else {
        alert('Введите имя!');
    }
});

// Кнопки "Заново" в модалке
document.getElementById('playAgain').addEventListener('click', () => {
    game.start();
    document.getElementById('gameOverlay').style.display = 'none';
});

document.getElementById('playAgain2').addEventListener('click', () => {
    game.start();
    document.getElementById('gameOverlay').style.display = 'none';
});

// Свайпы для мобильных
let touchX, touchY;

document.getElementById('board').addEventListener('touchstart', e => {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
});

document.getElementById('board').addEventListener('touchend', e => {
    if (document.getElementById('gameOverlay').style.display === 'flex') return;
    
    const dx = e.changedTouches[0].clientX - touchX;
    const dy = e.changedTouches[0].clientY - touchY;
    
    if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
        if (Math.abs(dx) > Math.abs(dy)) {
            game.move(dx > 0 ? 'right' : 'left');
        } else {
            game.move(dy > 0 ? 'down' : 'up');
        }
    }
});

// Автосохранение
window.addEventListener('beforeunload', () => game.saveGame());

// Ресайз
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768 && document.getElementById('records').style.display !== 'block') {
        document.getElementById('mobileControls').style.display = 'grid';
    } else {
        document.getElementById('mobileControls').style.display = 'none';
    }
});