// Biến toàn cục
let currentWord = '';
let score = 0;
let timeLeft = 90;
let timer;
let gameActive = false;
let usedWords = new Set();
let metSuperHard = false;
let metExtremeHard = false;
let lastPointsAdded = 0;
let selectedExtremeWord = null;  // Lưu từ siêu khó được chọn
let gameStarted = false;  // Kiểm soát xem game đã bắt đầu hay chưa
let wordCount = 0;  // Đếm số lần gọi nextWord()
const EMBED_DEBUG = true;

function embedDebug(tag, extra = {}) {
    if (!EMBED_DEBUG) return;
    console.log('[EMBED_IFRAME]', tag, {
        gameActive,
        gameStarted,
        activeElement: document.activeElement ? (document.activeElement.id || document.activeElement.tagName) : 'null',
        ...extra,
    });
}

// Lắng nghe phím Enter để bắt đầu trò chơi
document.addEventListener('keydown', function(event) {
    embedDebug('document:keydown', { key: event.key, code: event.code });
    if (event.key === 'Enter' && !gameStarted) {
        startGame();
        gameStarted = true;
    }
});

// Lắng nghe phím Enter trong ô input để kiểm tra từ
document.getElementById('answer').addEventListener('keydown', function(event) {
    embedDebug('answer:keydown', { key: event.key, code: event.code, valueLength: this.value.length });
    if (event.key === 'Enter' && gameActive) {
        checkInput();
    }
});

// Lắng nghe phím Enter trên toàn bộ document để focus lại ô input nếu mất focus
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && window.parent && window.parent !== window) {
        embedDebug('document:keydown:space:postExitEmbeddedGame', {
            gameActive,
            gameStarted,
        });
        window.parent.postMessage({ type: 'exitEmbeddedGame' }, '*');
        event.preventDefault();
        return;
    }

    if (event.key === 'Enter' && gameActive && document.activeElement !== document.getElementById('answer')) {
        document.getElementById('answer').focus();
        event.preventDefault();
    }
});

// Auto-refocus input khi mất focus (click ra ngoài)
document.getElementById('answer').addEventListener('blur', function() {
    if (gameActive) {
        // Delay để tránh refocus ngay lập tức (cho phép xử lý sự kiện click trước)
        setTimeout(() => {
            if (gameActive && document.activeElement !== this) {
                this.focus();
            }
        }, 50);
    }
});

// Khi click bất kỳ đâu trong game-screen, focus lại input
document.querySelector('.game-screen').addEventListener('click', function(event) {
    if (gameActive) {
        const answerEl = document.getElementById('answer');
        if (event.target !== answerEl) {
            // Focus input khi click trên các phần tử khác trong game-screen
            setTimeout(() => {
                answerEl.focus();
            }, 10);
        }
    }
}, true); // Use capture phase để chắc chắn bắt được click

// Nhận message từ parent (game2_2) để focus input hoặc bắt đầu game (Enter trên parent)
window.addEventListener('message', function(event) {
    embedDebug('window:message', { type: event.data && event.data.type ? event.data.type : 'unknown' });
    if (!event.data || typeof event.data.type !== 'string') return;
    if (!gameActive) return;

    if (event.data.type === 'embedStartGame') {
        if (!gameStarted) {
            startGame();
        }
        return;
    }

    const answerEl = document.getElementById('answer');
    if (answerEl) {
        answerEl.focus();
        // Di chuyển cursor tới cuối text
        const end = answerEl.value.length;
        answerEl.setSelectionRange(end, end);
    }
});

window.parent.postMessage({
  type: 'gameOver'
}, '*');


window.addEventListener('message', (event) => {
  if (event.data?.type === 'MOUSE_BLACKOUT_ON') {
    document.getElementById('blackout')?.classList.add('active');
  }

  if (event.data?.type === 'MOUSE_BLACKOUT_OFF') {
    document.getElementById('blackout')?.classList.remove('active');
  }
});

/**
 * Bắt đầu trò chơi
 */
function clearBlackout() {
    document.getElementById('blackout')?.classList.remove('active');
}

function startGame() {
    embedDebug('startGame:begin');
    clearBlackout();
    score = 0;
    timeLeft = 90;
    gameActive = true;
    gameStarted = true;
    usedWords.clear();
    metSuperHard = false;
    metExtremeHard = false;
    lastPointsAdded = 0;
    wordCount = 0;  // Reset counter
    
    // Chọn một từ siêu khó ngẫu nhiên cho game này
    const extremeWordsArray = Array.from(extremeHardWords);
    selectedExtremeWord = extremeWordsArray[Math.floor(Math.random() * extremeWordsArray.length)];
    
    // Ẩn start-screen, hiện game-screen, hiện stats
    document.querySelector('.start-screen').classList.add('hidden');
    document.querySelector('.game-screen').classList.add('show');
    document.querySelector('.stats').classList.add('show');
    
    document.getElementById('score').textContent = score;
    document.getElementById('time').textContent = timeLeft;
    document.getElementById('pointsAdded').textContent = '';
    document.getElementById('answer').value = '';
    document.getElementById('answer').focus();
    
    // Chặn paste vào input
    document.getElementById('answer').addEventListener('paste', (e) => {
        e.preventDefault();
    });

    if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'gameStarted' }, '*');
    }
    
    nextWord();
    timer = setInterval(updateTimer, 1000);
}

function renderCurrentWord(word) {
    const currentWordEl = document.getElementById('currentWord');
    currentWordEl.textContent = word;
    if (extremeHardWords.has(word)) {
        currentWordEl.classList.add('extreme-word');
    } else {
        currentWordEl.classList.remove('extreme-word');
    }
}


/**
 * Lấy từ tiếp theo (ưu tiên từ khó nếu chưa gặp)
 */
function nextWord() {
    wordCount++;
    let availableWords = words.filter(word => !usedWords.has(word));
    if (availableWords.length === 0) {
        availableWords = words;
        usedWords.clear();
    }
    
    // Chỉ hiển thị từ extreme khi đó là lần thứ 2 (wordCount = 2)
    if (wordCount === 2 && !metExtremeHard && !usedWords.has(selectedExtremeWord)) {
        currentWord = selectedExtremeWord;
        usedWords.add(currentWord);
        renderCurrentWord(currentWord);
        return;
    }
    
    // Ưu tiên từ super khó nếu chưa gặp
    if (!metSuperHard) {
        let superHardCandidates = availableWords.filter(word => superHardWords.has(word));
        if (superHardCandidates.length > 0) {
            currentWord = superHardCandidates[Math.floor(Math.random() * superHardCandidates.length)];
            usedWords.add(currentWord);
            renderCurrentWord(currentWord);
            return;
        }
    }
    
    // Chọn từ ngẫu nhiên bình thường
    currentWord = availableWords[Math.floor(Math.random() * availableWords.length)];
    usedWords.add(currentWord);
    renderCurrentWord(currentWord);
}

/**
 * Phát âm thanh thành công
 */
function playSuccessSound() {
    const audio = document.getElementById('successSound');
    audio.currentTime = 0;
    audio.volume = 0.7;
    audio.play().catch(() => {
        // Im lặng nếu phát âm thanh thất bại
    });
}

/**
 * Kiểm tra đầu vào từ người chơi
 */
function checkInput() {
    if (!gameActive) return;
    
    const input = document.getElementById('answer').value.toLowerCase();
    if (input === currentWord) {
        let pointsToAdd = 0;
        
        if (extremeHardWords.has(currentWord)) {
            pointsToAdd = 30;
            metExtremeHard = true;
        } else if (superHardWords.has(currentWord)) {
            pointsToAdd = 9;
            metSuperHard = true;
        } else if (hardWords.has(currentWord)) {
            pointsToAdd = 6;
        } else {
            pointsToAdd = 3;
        }
        
        score += pointsToAdd;
        lastPointsAdded = pointsToAdd;
        
        document.getElementById('score').textContent = score;
        document.getElementById('pointsAdded').textContent = '(+' + pointsToAdd + ')';
        
        // Phát âm thanh thành công
        playSuccessSound();
        
        // Ẩn thông báo điểm sau 1.5 giây
        setTimeout(() => {
            document.getElementById('pointsAdded').textContent = '';
        }, 1500);
        
        document.getElementById('answer').value = '';
        nextWord();
    }
}

/**
 * Cập nhật bộ đếm thời gian
 */
function updateTimer() {
    timeLeft--;
    document.getElementById('time').textContent = timeLeft;
    if (timeLeft <= 0) {
        clearInterval(timer);
        gameActive = false;
        clearBlackout();

        // Ẩn game-screen và stats, hiện end-screen
        document.querySelector('.game-screen').classList.remove('show');
        document.querySelector('.stats').classList.remove('show');
        document.querySelector('.end-screen').classList.add('show');
        
        document.getElementById('finalScore').textContent = score;
        document.getElementById('answer').value = '';

        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'gameOver', score: score }, '*');
        }

        if (typeof window.GPA_SCORE !== 'undefined' && typeof window.GPA_SCORE.postScore === 'function') {
            window.GPA_SCORE.postScore('game2_1', score).catch(function (err) {
                console.warn('[GPA_SCORE] game2_1:', err && err.message ? err.message : err);
            });
        }
    }
}

/**
 * Quay lại màn hình bắt đầu
 */
function returnToStart() {
    clearBlackout();
    // Ẩn end-screen, hiện start-screen
    document.querySelector('.end-screen').classList.remove('show');
    document.querySelector('.start-screen').classList.remove('hidden');
    gameStarted = false;  // Reset để có thể bắt đầu lại bằng Enter
}
