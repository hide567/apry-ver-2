// ===== タイマーモジュール =====
const TimerModule = {
    interval: null,
    seconds: 0,
    isRunning: false,
    
    // タイマー開始
    start() {
        if (!this.isRunning) {
            this.interval = setInterval(() => {
                this.seconds++;
                this.updateDisplay();
            }, 1000);
            
            this.isRunning = true;
            this.updateButtons();
            
            console.log('⏱️ タイマー開始');
        }
    },
    
    // タイマー停止
    stop() {
        if (this.isRunning) {
            clearInterval(this.interval);
            this.interval = null;
            this.isRunning = false;
            this.updateButtons();
            
            console.log('⏱️ タイマー停止');
        }
    },
    
    // タイマーリセット
    reset() {
        this.stop();
        this.seconds = 0;
        this.updateDisplay();
        
        console.log('⏱️ タイマーリセット');
    },
    
    // 表示更新
    updateDisplay() {
        const h = Math.floor(this.seconds / 3600);
        const m = Math.floor((this.seconds % 3600) / 60);
        const s = this.seconds % 60;
        
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        
        const timerEl = document.getElementById('timer');
        if (timerEl) {
            timerEl.textContent = timeStr;
        }
    },
    
    // ボタン表示更新
    updateButtons() {
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (startBtn && stopBtn) {
            if (this.isRunning) {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            } else {
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
            }
        }
    },
    
    // 現在の秒数取得
    getSeconds() {
        return this.seconds;
    },
    
    // 時間設定（外部から）
    setSeconds(seconds) {
        this.seconds = seconds;
        this.updateDisplay();
    },
    
    // フォーマットされた時間取得
    getFormattedTime() {
        const h = Math.floor(this.seconds / 3600);
        const m = Math.floor((this.seconds % 3600) / 60);
        const s = this.seconds % 60;
        
        if (h > 0) {
            return `${h}時間${m}分`;
        } else if (m > 0) {
            return `${m}分${s}秒`;
        } else {
            return `${s}秒`;
        }
    }
};

// ===== ポモドーロテクニック =====
const PomodoroModule = {
    WORK_TIME: 25 * 60,      // 25分
    SHORT_BREAK: 5 * 60,     // 5分
    LONG_BREAK: 15 * 60,     // 15分
    
    currentSession: 0,       // 現在のセッション数
    isPomodoro: false,       // ポモドーロモード中か
    
    // ポモドーロ開始
    start() {
        TimerModule.reset();
        TimerModule.start();
        
        this.isPomodoro = true;
        this.currentSession++;
        
        // 25分後に通知
        setTimeout(() => {
            this.onWorkComplete();
        }, this.WORK_TIME * 1000);
        
        console.log('🍅 ポモドーロセッション開始');
        
        // 音声フィードバック
        if (typeof VoiceModule !== 'undefined') {
            VoiceModule.speak('ポモドーロタイマーを開始しました');
        }
    },
    
    // 作業完了時
    onWorkComplete() {
        TimerModule.stop();
        this.isPomodoro = false;
        
        // 通知
        this.showNotification('休憩時間です！', '5分間休憩しましょう');
        this.playSound();
        
        // 音声フィードバック
        if (typeof VoiceModule !== 'undefined') {
            VoiceModule.speak('25分経過しました。5分間休憩しましょう');
        }
        
        // 休憩タイマー開始の提案
        if (confirm('休憩タイマーを開始しますか？')) {
            this.startBreak();
        }
        
        console.log('🍅 ポモドーロセッション完了');
    },
    
    // 休憩開始
    startBreak() {
        TimerModule.reset();
        TimerModule.start();
        
        const breakTime = this.currentSession % 4 === 0 ? this.LONG_BREAK : this.SHORT_BREAK;
        const breakType = this.currentSession % 4 === 0 ? '長い休憩' : '短い休憩';
        
        setTimeout(() => {
            this.onBreakComplete();
        }, breakTime * 1000);
        
        console.log(`☕ ${breakType}開始`);
    },
    
    // 休憩完了時
    onBreakComplete() {
        TimerModule.stop();
        
        this.showNotification('休憩終了！', '次のセッションを始めましょう');
        this.playSound();
        
        console.log('☕ 休憩完了');
    },
    
    // 通知表示
    showNotification(title, message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: 'assets/icons/icon-192.png',
                badge: 'assets/icons/icon-192.png'
            });
        } else if ('Notification' in window && Notification.permission !== 'denied') {
            // 通知許可を求める
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, {
                        body: message,
                        icon: 'assets/icons/icon-192.png'
                    });
                }
            });
        }
        
        // フォールバック：アラート
        if (!('Notification' in window) || Notification.permission === 'denied') {
            alert(`${title}\n${message}`);
        }
    },
    
    // 通知音再生
    playSound() {
        try {
            // Web Audio APIでビープ音生成
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800; // 周波数
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('音声再生に失敗:', error);
        }
    },
    
    // 統計取得
    getStats() {
        return {
            totalSessions: this.currentSession,
            isActive: this.isPomodoro
        };
    }
};

// ===== グローバル関数（後方互換性） =====
function startTimer() {
    TimerModule.start();
}

function stopTimer() {
    TimerModule.stop();
}

function resetTimer() {
    TimerModule.reset();
}

function startPomodoro() {
    PomodoroModule.start();
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', function() {
    // タイマー表示初期化
    TimerModule.updateDisplay();
    TimerModule.updateButtons();
    
    console.log('⏱️ タイマーモジュール初期化完了');
});
