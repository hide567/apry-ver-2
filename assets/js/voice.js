// ===== 音声コマンドモジュール =====
const VoiceModule = {
    recognition: null,
    isActive: false,
    isSupported: false,
    
    // 初期化
    init() {
        this.checkBrowserSupport();
        this.setupRecognition();
        console.log('🎤 音声コマンドモジュール初期化完了');
    },
    
    // ブラウザ対応チェック
    checkBrowserSupport() {
        this.isSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
        
        if (!this.isSupported) {
            console.warn('🎤 音声認識に対応していないブラウザです');
            this.disableVoiceUI();
            return false;
        }
        
        return true;
    },
    
    // 音声認識設定
    setupRecognition() {
        if (!this.isSupported) return;
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // 設定
        this.recognition.lang = 'ja-JP';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        // イベントハンドラー
        this.recognition.onresult = (event) => this.handleResult(event);
        this.recognition.onerror = (event) => this.handleError(event);
        this.recognition.onstart = () => this.handleStart();
        this.recognition.onend = () => this.handleEnd();
    },
    
    // 音声認識開始
    start() {
        if (!this.isSupported) {
            alert('お使いのブラウザは音声認識に対応していません');
            return;
        }
        
        // マイクの許可をリクエスト
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => {
                this.isActive = true;
                this.recognition.start();
                
                this.updateUI();
                this.updateStatus('開始中...', '#ff9800');
                
                console.log('🎤 音声認識開始');
            })
            .catch((error) => {
                console.error('🎤 マイクアクセス拒否:', error);
                alert('マイクへのアクセスが必要です。ブラウザの設定を確認してください。');
            });
    },
    
    // 音声認識停止
    stop() {
        this.isActive = false;
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        this.updateUI();
        this.updateStatus('停止中', '#666');
        
        console.log('🎤 音声認識停止');
    },
    
    // 結果処理
    handleResult(event) {
        let finalTranscript = '';
        
        // 最終結果のみを処理
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
            console.log('🎤 音声認識結果:', finalTranscript);
            this.processCommand(finalTranscript);
        }
    },
    
    // エラー処理
    handleError(event) {
        console.error('🎤 音声認識エラー:', event.error);
        this.updateStatus('エラー: ' + event.error, '#f44336');
        
        // 自動で停止
        setTimeout(() => {
            this.stop();
        }, 2000);
    },
    
    // 開始時処理
    handleStart() {
        console.log('🎤 音声認識開始');
        this.updateStatus('聞き取り中...', '#4caf50');
        this.speak('音声コマンドを開始しました');
    },
    
    // 終了時処理
    handleEnd() {
        console.log('🎤 音声認識終了');
        
        if (this.isActive) {
            this.updateStatus('再接続中...', '#ff9800');
            // 自動再開
            setTimeout(() => {
                if (this.isActive) {
                    try {
                        this.recognition.start();
                    } catch(e) {
                        console.error('🎤 再開エラー:', e);
                        this.stop();
                    }
                }
            }, 1000);
        } else {
            this.updateStatus('停止中', '#666');
            this.speak('音声コマンドを停止しました');
        }
    },
    
    // コマンド処理
    processCommand(command) {
        console.log('🎤 処理中のコマンド:', command);
        const lowerCommand = command.toLowerCase();
        
        // コマンドマッピング
        const commands = {
            // タイマー操作
            'タイマー開始': () => {
                TimerModule.start();
                this.speak('タイマーを開始しました');
            },
            'タイマー停止': () => {
                TimerModule.stop();
                this.speak('タイマーを停止しました');
            },
            'タイマーリセット': () => {
                TimerModule.reset();
                this.speak('タイマーをリセットしました');
            },
            'ポモドーロ': () => {
                PomodoroModule.start();
                this.speak('ポモドーロタイマーを開始しました');
            },
            
            // 科目選択
            '民法': () => this.selectSubjectByVoice('minpou', '民法'),
            '行政法': () => this.selectSubjectByVoice('gyousei', '行政法'),
            '憲法': () => this.selectSubjectByVoice('kenpou', '憲法'),
            '商法': () => this.selectSubjectByVoice('shouhou', '商法'),
            '基礎法学': () => this.selectSubjectByVoice('kiso', '基礎法学'),
            '一般知識': () => this.selectSubjectByVoice('ippan', '一般知識'),
            
            // 画面切り替え
            '分析': () => {
                App.switchScreen('analysis');
                this.speak('分析画面を表示しました');
            },
            '履歴': () => {
                App.switchTab('history');
                this.speak('履歴を表示しました');
            },
            '進捗': () => {
                App.switchScreen('progress');
                this.speak('進捗画面を表示しました');
            },
            
            // データ操作
            '保存': () => {
                App.saveRecord();
                this.speak('学習記録を保存しました');
            },
            'リセット': () => {
                App.resetForm();
                this.speak('フォームをリセットしました');
            }
        };
        
        // コマンド実行
        let commandExecuted = false;
        Object.keys(commands).forEach(key => {
            if (lowerCommand.includes(key.toLowerCase()) || command.includes(key)) {
                commands[key]();
                commandExecuted = true;
                this.updateStatus(`実行: ${key}`, '#4caf50');
                
                // 2秒後にステータスを戻す
                setTimeout(() => {
                    if (this.isActive) {
                        this.updateStatus('聞き取り中...', '#4caf50');
                    }
                }, 2000);
            }
        });
        
        // 数値入力の処理
        if (!commandExecuted) {
            commandExecuted = this.processNumberCommands(command);
        }
        
        // 認識されなかった場合
        if (!commandExecuted) {
            this.updateStatus('コマンド不明', '#ff9800');
            setTimeout(() => {
                if (this.isActive) {
                    this.updateStatus('聞き取り中...', '#4caf50');
                }
            }, 2000);
        }
    },
    
    // 数値コマンド処理
    processNumberCommands(command) {
        // "42問正解" のような入力
        const correctMatch = command.match(/(\d+)問.*正解/);
        if (correctMatch) {
            const count = parseInt(correctMatch[1]);
            this.setCorrectAnswers(count);
            this.speak(`${count}問正解を入力しました`);
            return true;
        }
        
        // "20問間違い" のような入力
        const wrongMatch = command.match(/(\d+)問.*間違/);
        if (wrongMatch) {
            const count = parseInt(wrongMatch[1]);
            this.setWrongAnswers(count);
            this.speak(`${count}問不正解を入力しました`);
            return true;
        }
        
        return false;
    },
    
    // 音声で科目選択
    selectSubjectByVoice(subjectCode, subjectName) {
        const btn = document.querySelector(`[onclick*="${subjectCode}"]`);
        if (btn && typeof App !== 'undefined') {
            App.selectSubject(btn, subjectCode);
            this.speak(`${subjectName}を選択しました`);
        }
    },
    
    // 正解数を自動設定
    setCorrectAnswers(count) {
        if (typeof App !== 'undefined') {
            for (let i = 1; i <= Math.min(count, 50); i++) {
                if (App.questionStates[i].state !== 'correct') {
                    const cell = document.querySelector(`[data-number="${i}"]`);
                    App.questionStates[i].state = 'correct';
                    cell.classList.remove('wrong');
                    cell.classList.add('correct');
                }
            }
            App.updateStats();
        }
    },
    
    // 不正解数を自動設定
    setWrongAnswers(count) {
        if (typeof App !== 'undefined') {
            let setCount = 0;
            for (let i = 1; i <= 50 && setCount < count; i++) {
                if (App.questionStates[i].state !== 'correct') {
                    const cell = document.querySelector(`[data-number="${i}"]`);
                    App.questionStates[i].state = 'wrong';
                    cell.classList.remove('correct');
                    cell.classList.add('wrong');
                    setCount++;
                }
            }
            App.updateStats();
        }
    },
    
    // 音声出力
    speak(text) {
        if ('speechSynthesis' in window) {
            // 前の音声を停止
            speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 1.2;  // 少し早めに
            utterance.volume = 0.7; // 少し小さめに
            speechSynthesis.speak(utterance);
        }
    },
    
    // UI更新
    updateUI() {
        const startBtn = document.getElementById('voiceStartBtn');
        const stopBtn = document.getElementById('voiceStopBtn');
        
        if (startBtn && stopBtn) {
            if (this.isActive) {
                startBtn.style.display = 'none';
                stopBtn.style.display = 'inline-block';
            } else {
                startBtn.style.display = 'inline-block';
                stopBtn.style.display = 'none';
            }
        }
    },
    
    // ステータス更新
    updateStatus(message, color = '#666') {
        const statusElement = document.getElementById('voiceStatus');
        if (statusElement) {
            statusElement.textContent = '音声コマンド: ' + message;
            statusElement.style.color = color;
        }
    },
    
    // UI無効化
    disableVoiceUI() {
        const startBtn = document.getElementById('voiceStartBtn');
        if (startBtn) {
            startBtn.textContent = '非対応';
            startBtn.disabled = true;
        }
    }
};

// ===== グローバル関数（後方互換性） =====
function startVoiceCommand() {
    VoiceModule.start();
}

function stopVoiceCommand() {
    VoiceModule.stop();
}
