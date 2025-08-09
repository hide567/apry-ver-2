// ===== メインアプリケーション =====
class StudyTrackerApp {
    constructor() {
        this.questionStates = {};
        this.currentSubject = null;
        this.deferredPrompt = null;
        
        this.init();
    }
    
    // アプリ初期化
    init() {
        this.setupEventListeners();
        this.initializeComponents();
        this.checkOnlineStatus();
        
        // Service Worker登録
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('SW registered'))
                .catch(err => console.log('SW registration failed'));
        }
        
        console.log('📚 行政書士学習トラッカー v2.0 起動');
    }
    
    // イベントリスナー設定
    setupEventListeners() {
        // PWAインストール促進
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            document.getElementById('installBanner').style.display = 'block';
        });
        
        // オンライン/オフライン状態
        window.addEventListener('online', () => this.updateOnlineStatus(true));
        window.addEventListener('offline', () => this.updateOnlineStatus(false));
        
        // ページ読み込み完了時
        document.addEventListener('DOMContentLoaded', () => {
            this.loadInitialData();
        });
    }
    
    // コンポーネント初期化
    initializeComponents() {
        this.createQuestionGrid(50);
        this.updateStats();
        
        // 各モジュールの初期化
        if (typeof StorageModule !== 'undefined') {
            StorageModule.loadHistory();
            StorageModule.updateAllStats();
        }
        
        if (typeof ChartsModule !== 'undefined') {
            ChartsModule.initialize();
        }
        
        if (typeof AnalyticsModule !== 'undefined') {
            AnalyticsModule.updateBadges();
        }
        
        if (typeof VoiceModule !== 'undefined') {
            VoiceModule.init();
        }
        
        this.calculateDataSize();
    }
    
    // 初期データ読み込み
    loadInitialData() {
        if (typeof StorageModule !== 'undefined') {
            StorageModule.loadHistory();
        }
        this.updateStats();
    }
    
    // 問題グリッド生成
    createQuestionGrid(count) {
        const grid = document.getElementById('questionGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (let i = 1; i <= count; i++) {
            const cell = document.createElement('div');
            cell.className = 'question-cell';
            cell.textContent = i;
            cell.dataset.number = i;
            cell.onclick = () => this.toggleQuestion(i);
            
            // 長押しでマーク
            let pressTimer;
            cell.addEventListener('touchstart', () => {
                pressTimer = setTimeout(() => this.markQuestion(i), 500);
            });
            cell.addEventListener('touchend', () => clearTimeout(pressTimer));
            
            grid.appendChild(cell);
            this.questionStates[i] = { state: null, marked: false };
        }
    }
    
    // 問題状態切替
    toggleQuestion(num) {
        const cell = document.querySelector(`[data-number="${num}"]`);
        if (!cell) return;
        
        const state = this.questionStates[num];
        
        if (state.state === null) {
            state.state = 'correct';
            cell.classList.add('correct');
        } else if (state.state === 'correct') {
            state.state = 'wrong';
            cell.classList.remove('correct');
            cell.classList.add('wrong');
        } else {
            state.state = null;
            cell.classList.remove('wrong');
        }
        
        this.updateStats();
    }
    
    // マーク切替
    markQuestion(num) {
        const cell = document.querySelector(`[data-number="${num}"]`);
        if (!cell) return;
        
        this.questionStates[num].marked = !this.questionStates[num].marked;
        cell.classList.toggle('marked');
    }
    
    // 統計更新
    updateStats() {
        let total = 0, correct = 0, wrong = 0;
        
        Object.values(this.questionStates).forEach(state => {
            if (state.state === 'correct') {
                correct++;
                total++;
            } else if (state.state === 'wrong') {
                wrong++;
                total++;
            }
        });
        
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        
        // DOM更新
        Utils.updateElement('totalCount', total);
        Utils.updateElement('correctCount', correct);
        Utils.updateElement('wrongCount', wrong);
        Utils.updateElement('percentage', total > 0 ? percentage + '%' : '--%');
    }
    
    // 科目選択
    selectSubject(btn, subject) {
        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.currentSubject = subject;
    }
    
    // タブ切替
    switchTab(tabName) {
        document.querySelectorAll('.tab-nav-item').forEach(item => item.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        event.target.classList.add('active');
        document.getElementById(tabName + '-tab').classList.add('active');
        
        // 分析タブの場合はグラフを更新
        if (tabName === 'analysis' && typeof ChartsModule !== 'undefined') {
            ChartsModule.updateCharts();
        }
    }
    
    // 画面切り替え
    switchScreen(screen) {
        // ボトムナビ更新
        document.querySelectorAll('.bottom-nav-item').forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        // 画面切り替え
        document.querySelectorAll('.main-container').forEach(container => {
            container.classList.remove('active');
        });
        
        switch(screen) {
            case 'record':
                document.getElementById('recordContainer').classList.add('active');
                break;
            case 'progress':
                document.getElementById('progressContainer').classList.add('active');
                if (typeof AnalyticsModule !== 'undefined') {
                    AnalyticsModule.updateProgressScreen();
                }
                break;
            case 'analysis':
                document.getElementById('analysisContainer').classList.add('active');
                if (typeof AnalyticsModule !== 'undefined') {
                    AnalyticsModule.updateAnalysisScreen();
                }
                break;
            case 'achievement':
                document.getElementById('achievementContainer').classList.add('active');
                if (typeof AnalyticsModule !== 'undefined') {
                    AnalyticsModule.updateAchievementScreen();
                }
                break;
            case 'settings':
                document.getElementById('settingsContainer').classList.add('active');
                break;
        }
    }
    
    // 記録保存
    saveRecord() {
        const record = {
            id: Date.now(),
            date: new Date().toISOString(),
            book: document.getElementById('bookSelect').value,
            subject: this.currentSubject,
            questions: this.questionStates,
            studyTime: TimerModule.getSeconds(),
            stats: {
                total: parseInt(document.getElementById('totalCount').textContent),
                correct: parseInt(document.getElementById('correctCount').textContent),
                wrong: parseInt(document.getElementById('wrongCount').textContent),
                percentage: document.getElementById('percentage').textContent
            }
        };
        
        // StorageModuleで保存
        if (typeof StorageModule !== 'undefined') {
            StorageModule.saveRecord(record);
        }
        
        // フィードバック
        this.showSaveSuccess();
    }
    
    // 保存成功フィードバック
    showSaveSuccess() {
        const btn = event.target;
        const originalText = btn.textContent;
        const originalStyle = btn.style.background;
        
        btn.textContent = '✓ 保存完了！';
        btn.style.background = 'linear-gradient(135deg, #4caf50, #8bc34a)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = originalStyle;
            this.resetForm();
            
            // データ更新
            if (typeof StorageModule !== 'undefined') {
                StorageModule.loadHistory();
                StorageModule.updateAllStats();
            }
            
            if (typeof AnalyticsModule !== 'undefined') {
                AnalyticsModule.updateBadges();
            }
        }, 2000);
    }
    
    // フォームリセット
    resetForm() {
        this.createQuestionGrid(50);
        this.updateStats();
        
        if (typeof TimerModule !== 'undefined') {
            TimerModule.reset();
        }
        
        document.getElementById('bookSelect').value = '';
        document.querySelectorAll('.subject-btn').forEach(b => b.classList.remove('selected'));
        this.currentSubject = null;
    }
    
    // オンライン状態更新
    updateOnlineStatus(isOnline) {
        const badge = document.getElementById('offlineBadge');
        if (badge) {
            badge.classList.toggle('show', !isOnline);
        }
    }
    
    // オンライン状態チェック
    checkOnlineStatus() {
        this.updateOnlineStatus(navigator.onLine);
    }
    
    // データサイズ計算
    calculateDataSize() {
        const history = localStorage.getItem('studyHistory') || '[]';
        const bytes = new Blob([history]).size;
        const kb = (bytes / 1024).toFixed(2);
        Utils.updateElement('dataSize', `${kb} KB`);
    }
}

// ===== PWA関連の関数 =====
function installApp() {
    if (App.deferredPrompt) {
        App.deferredPrompt.prompt();
        App.deferredPrompt.userChoice.then(result => {
            if (result.outcome === 'accepted') {
                console.log('App installed');
            }
            App.deferredPrompt = null;
        });
    }
    document.getElementById('installBanner').style.display = 'none';
}

function dismissInstall() {
    document.getElementById('installBanner').style.display = 'none';
}

// ===== 設定関連の関数 =====
function toggleSetting(element, setting) {
    element.classList.toggle('active');
    const isActive = element.classList.contains('active');
    localStorage.setItem(`setting_${setting}`, isActive);
}

// ===== グローバルアプリインスタンス =====
let App;

// アプリ起動
document.addEventListener('DOMContentLoaded', function() {
    App = new StudyTrackerApp();
    
    // 開発用：コンソールにアプリインスタンスを公開
    if (typeof window !== 'undefined') {
        window.StudyApp = App;
    }
});
