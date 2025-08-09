// ===== 暗記カードシステム（Ankiスタイル） =====
const FlashCardModule = {
    cards: [],
    currentCard: 0,
    session: {
        correct: 0,
        wrong: 0,
        total: 0,
        startTime: null,
        isActive: false
    },
    
    // SM-2アルゴリズム設定
    SM2_CONFIG: {
        INITIAL_INTERVAL: 1,
        INITIAL_EASE_FACTOR: 2.5,
        MIN_EASE_FACTOR: 1.3,
        QUALITY_THRESHOLD: 3,
        EASE_ADJUSTMENT: [
            -0.8, -0.54, -0.32, -0.14, 0, 0.15 // quality 0-5に対応
        ]
    },
    
    // 初期化
    init() {
        this.loadCards();
        this.setupEventListeners();
        console.log('🎴 暗記カードモジュール初期化完了');
    },
    
    // カード読み込み
    loadCards() {
        this.cards = Utils.safeLocalStorage.get('flashCards', []);
        console.log(`🎴 ${this.cards.length}枚のカードを読み込みました`);
    },
    
    // カード保存
    saveCards() {
        Utils.safeLocalStorage.set('flashCards', this.cards);
    },
    
    // イベントリスナー設定
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.session.isActive) {
                this.handleKeyboardInput(e);
            }
        });
    },
    
    // キーボード入力処理
    handleKeyboardInput(e) {
        switch(e.key) {
            case ' ': // スペースキーでカードをめくる
                e.preventDefault();
                this.flipCard();
                break;
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
                e.preventDefault();
                this.rateCard(parseInt(e.key));
                break;
            case 'Escape':
                this.endSession();
                break;
        }
    },
    
    // カード作成
    createCard(front, back, tags = [], subject = '') {
        const card = {
            id: Utils.generateId(),
            front: front.trim(),
            back: back.trim(),
            tags: Array.isArray(tags) ? tags : [],
            subject: subject,
            created: new Date().toISOString(),
            lastReviewed: null,
            nextReview: new Date().toISOString(),
            interval: this.SM2_CONFIG.INITIAL_INTERVAL,
            easeFactor: this.SM2_CONFIG.INITIAL_EASE_FACTOR,
            repetitions: 0,
            reviews: [],
            isLearning: true,
            lapses: 0
        };
        
        this.cards.push(card);
        this.saveCards();
        
        console.log('🎴 新しいカードを作成:', front.substring(0, 20) + '...');
        return card;
    },
    
    // カード編集
    editCard(cardId, updates) {
        const cardIndex = this.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return false;
        
        this.cards[cardIndex] = { ...this.cards[cardIndex], ...updates };
        this.saveCards();
        
        return true;
    },
    
    // カード削除
    deleteCard(cardId) {
        this.cards = this.cards.filter(c => c.id !== cardId);
        this.saveCards();
        
        console.log('🎴 カードを削除:', cardId);
    },
    
    // 復習対象カード取得
    getDueCards() {
        const now = new Date();
        return this.cards.filter(card => new Date(card.nextReview) <= now);
    },
    
    // 新規カード取得
    getNewCards(limit = 10) {
        return this.cards
            .filter(card => card.reviews.length === 0)
            .slice(0, limit);
    },
    
    // 学習セッション開始
    startSession(deckType = 'mixed', maxCards = 20) {
        let sessionCards = [];
        
        switch(deckType) {
            case 'due':
                sessionCards = this.getDueCards();
                break;
            case 'new':
                sessionCards = this.getNewCards(maxCards);
                break;
            case 'mixed':
                const dueCards = this.getDueCards();
                const newCards = this.getNewCards(Math.max(0, maxCards - dueCards.length));
                sessionCards = [...dueCards, ...newCards];
                break;
            case 'subject':
                // 特定科目のカードを取得
                sessionCards = this.getSubjectCards(maxCards);
                break;
        }
        
        if (sessionCards.length === 0) {
            alert('復習するカードがありません！');
            return false;
        }
        
        // カードをシャッフル
        this.sessionCards = Utils.shuffleArray(sessionCards);
        this.currentCard = 0;
        this.session = {
            correct: 0,
            wrong: 0,
            total: this.sessionCards.length,
            startTime: new Date(),
            isActive: true,
            type: deckType
        };
        
        this.showSessionInterface();
        this.displayCurrentCard();
        
        console.log(`🎴 学習セッション開始: ${this.session.total}枚`);
        return true;
    },
    
    // 科目別カード取得
    getSubjectCards(limit) {
        // 現在選択されている科目に基づいてカードを取得
        const currentSubject = App.currentSubject;
        if (!currentSubject) return [];
        
        return this.cards
            .filter(card => card.subject === currentSubject)
            .slice(0, limit);
    },
    
    // セッション画面表示
    showSessionInterface() {
        const container = document.createElement('div');
        container.id = 'flashcard-session';
        container.className = 'flashcard-session-overlay';
        
        container.innerHTML = `
            <div class="flashcard-session-container">
                <!-- ヘッダー -->
                <div class="flashcard-header">
                    <div class="session-progress">
                        <span id="card-counter">${this.currentCard + 1} / ${this.session.total}</span>
                        <div class="progress-bar">
                            <div class="progress-fill" id="session-progress" style="width: 0%;"></div>
                        </div>
                    </div>
                    <button class="close-session-btn" onclick="FlashCardModule.endSession()">✕</button>
                </div>
                
                <!-- カード表示エリア -->
                <div class="flashcard-display">
                    <div id="flashcard-container" class="flashcard-container">
                        <div id="flashcard" class="flashcard">
                            <!-- 表面 -->
                            <div class="card-front">
                                <div class="card-content">
                                    <div class="card-type">問題</div>
                                    <div id="card-front-text" class="card-text"></div>
                                </div>
                            </div>
                            
                            <!-- 裏面 -->
                            <div class="card-back">
                                <div class="card-content">
                                    <div class="card-type">答え</div>
                                    <div id="card-back-text" class="card-text"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- コントロール -->
                    <div class="flashcard-controls">
                        <button id="flip-btn" class="control-btn primary" onclick="FlashCardModule.flipCard()">
                            <span>カードをめくる</span>
                            <small>スペースキー</small>
                        </button>
                        
                        <div id="rating-buttons" class="rating-buttons" style="display: none;">
                            <div class="rating-instruction">理解度を選択してください</div>
                            <div class="rating-grid">
                                <button class="rating-btn again" onclick="FlashCardModule.rateCard(1)">
                                    <span class="rating-icon">😰</span>
                                    <span class="rating-label">Again</span>
                                    <small>1</small>
                                </button>
                                <button class="rating-btn hard" onclick="FlashCardModule.rateCard(2)">
                                    <span class="rating-icon">🤔</span>
                                    <span class="rating-label">Hard</span>
                                    <small>2</small>
                                </button>
                                <button class="rating-btn good" onclick="FlashCardModule.rateCard(3)">
                                    <span class="rating-icon">😊</span>
                                    <span class="rating-label">Good</span>
                                    <small>3</small>
                                </button>
                                <button class="rating-btn easy" onclick="FlashCardModule.rateCard(4)">
                                    <span class="rating-icon">😎</span>
                                    <span class="rating-label">Easy</span>
                                    <small>4</small>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 統計表示 -->
                <div class="session-stats">
                    <div class="stat-item correct">
                        <div class="stat-value" id="session-correct">0</div>
                        <div class="stat-label">正解</div>
                    </div>
                    <div class="stat-item wrong">
                        <div class="stat-value" id="session-wrong">0</div>
                        <div class="stat-label">不正解</div>
                    </div>
                    <div class="stat-item time">
                        <div class="stat-value" id="session-time">00:00</div>
                        <div class="stat-label">経過時間</div>
                    </div>
                </div>
                
                <!-- キーボードヘルプ -->
                <div class="keyboard-help">
                    <small>
                        スペース: めくる | 1-4: 評価 | ESC: 終了
                    </small>
                </div>
            </div>
        `;
        
        // CSSを動的に追加
        this.addFlashCardCSS();
        
        document.body.appendChild(container);
        
        // タイマー開始
        this.startSessionTimer();
    },
    
    // 現在のカード表示
    displayCurrentCard() {
        if (this.currentCard >= this.sessionCards.length) {
            this.showSessionResults();
            return;
        }
        
        const card = this.sessionCards[this.currentCard];
        
        // カード内容更新
        Utils.updateElement('card-front-text', card.front);
        Utils.updateElement('card-back-text', card.back);
        
        // プログレス更新
        const progress = ((this.currentCard + 1) / this.session.total) * 100;
        Utils.updateElement('card-counter', `${this.currentCard + 1} / ${this.session.total}`);
        
        const progressBar = document.getElementById('session-progress');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        // カードリセット
        this.resetCardDisplay();
    },
    
    // カード表示リセット
    resetCardDisplay() {
        const flashcard = document.getElementById('flashcard');
        if (flashcard) {
            flashcard.classList.remove('flipped');
        }
        
        const flipBtn = document.getElementById('flip-btn');
        const ratingButtons = document.getElementById('rating-buttons');
        
        if (flipBtn) flipBtn.style.display = 'block';
        if (ratingButtons) ratingButtons.style.display = 'none';
    },
    
    // カードめくり
    flipCard() {
        const flashcard = document.getElementById('flashcard');
        const flipBtn = document.getElementById('flip-btn');
        const ratingButtons = document.getElementById('rating-buttons');
        
        if (flashcard) {
            flashcard.classList.add('flipped');
        }
        
        if (flipBtn) flipBtn.style.display = 'none';
        if (ratingButtons) ratingButtons.style.display = 'block';
    },
    
    // カード評価（SM-2アルゴリズム）
    rateCard(quality) {
        const card = this.sessionCards[this.currentCard];
        this.updateCardWithSM2(card, quality);
        
        // セッション統計更新
        if (quality >= this.SM2_CONFIG.QUALITY_THRESHOLD) {
            this.session.correct++;
        } else {
            this.session.wrong++;
        }
        
        this.updateSessionStats();
        
        // 次のカードへ
        this.currentCard++;
        
        // アニメーション付きで次のカードを表示
        setTimeout(() => {
            this.displayCurrentCard();
        }, 300);
        
        // ハプティックフィードバック
        Utils.hapticFeedback();
    },
    
    // SM-2アルゴリズムでカード更新
    updateCardWithSM2(card, quality) {
        const now = new Date();
        
        // 復習記録追加
        card.reviews.push({
            date: now.toISOString(),
            quality: quality,
            interval: card.interval,
            easeFactor: card.easeFactor
        });
        
        card.lastReviewed = now.toISOString();
        
        // SM-2アルゴリズム適用
        if (quality >= this.SM2_CONFIG.QUALITY_THRESHOLD) {
            // 正解の場合
            if (card.repetitions === 0) {
                card.interval = 1;
            } else if (card.repetitions === 1) {
                card.interval = 6;
            } else {
                card.interval = Math.round(card.interval * card.easeFactor);
            }
            card.repetitions++;
            card.isLearning = false;
        } else {
            // 不正解の場合
            card.repetitions = 0;
            card.interval = 1;
            card.isLearning = true;
            card.lapses++;
        }
        
        // 容易度因子更新
        const adjustment = this.SM2_CONFIG.EASE_ADJUSTMENT[quality] || 0;
        card.easeFactor = Math.max(
            this.SM2_CONFIG.MIN_EASE_FACTOR,
            card.easeFactor + adjustment
        );
        
        // 次回復習日設定
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + card.interval);
        card.nextReview = nextReview.toISOString();
        
        this.saveCards();
        
        console.log(`🎴 カード評価: quality=${quality}, interval=${card.interval}日, ease=${card.easeFactor.toFixed(2)}`);
    },
    
    // セッション統計更新
    updateSessionStats() {
        Utils.updateElement('session-correct', this.session.correct);
        Utils.updateElement('session-wrong', this.session.wrong);
    },
    
    // セッションタイマー開始
    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            if (this.session.startTime) {
                const elapsed = Math.floor((new Date() - this.session.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                Utils.updateElement('session-time', `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
            }
        }, 1000);
    },
    
    // セッション結果表示
    showSessionResults() {
        const duration = Math.floor((new Date() - this.session.startTime) / 1000);
        const accuracy = this.session.total > 0 ? Math.round((this.session.correct / this.session.total) * 100) : 0;
        
        const container = document.getElementById('flashcard-session');
        
        container.innerHTML = `
            <div class="session-results">
                <div class="results-header">
                    <h2>🎉 学習完了！</h2>
                    <p>お疲れさまでした</p>
                </div>
                
                <div class="results-stats">
                    <div class="result-item">
                        <div class="result-value">${this.session.total}</div>
                        <div class="result-label">カード数</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${this.session.correct}</div>
                        <div class="result-label">正解</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${this.session.wrong}</div>
                        <div class="result-label">不正解</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${accuracy}%</div>
                        <div class="result-label">正答率</div>
                    </div>
                    <div class="result-item">
                        <div class="result-value">${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}</div>
                        <div class="result-label">学習時間</div>
                    </div>
                </div>
                
                <div class="results-actions">
                    <button class="control-btn primary" onclick="FlashCardModule.startSession('mixed')">
                        もう一度学習
                    </button>
                    <button class="control-btn secondary" onclick="FlashCardModule.endSession()">
                        終了
                    </button>
                </div>
                
                <div class="next-review-info">
                    <p>次回復習予定: ${this.getNextReviewInfo()}</p>
                </div>
            </div>
        `;
        
        // 学習記録を保存
        this.saveSessionRecord(duration, accuracy);
    },
    
    // 次回復習情報取得
    getNextReviewInfo() {
        const dueCards = this.getDueCards();
        if (dueCards.length > 0) {
            return `${dueCards.length}枚のカードが復習待ちです`;
        }
        
        // 最も早い次回復習日を取得
        const nextDue = this.cards
            .filter(card => card.nextReview)
            .map(card => new Date(card.nextReview))
            .sort((a, b) => a - b)[0];
        
        if (nextDue) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (nextDue <= tomorrow) {
                return '明日';
            } else {
                return Utils.formatDate(nextDue, 'MM/DD');
            }
        }
        
        return '新しいカードを追加してください';
    },
    
    // セッション記録保存
    saveSessionRecord(duration, accuracy) {
        const record = {
            id: Utils.generateId(),
            type: 'flashcard',
            date: new Date().toISOString(),
            duration: duration,
            cardsStudied: this.session.total,
            correct: this.session.correct,
            wrong: this.session.wrong,
            accuracy: accuracy,
            sessionType: this.session.type
        };
        
        // 既存の学習履歴に追加
        const history = StorageModule.getHistory();
        history.unshift(record);
        Utils.safeLocalStorage.set('studyHistory', history);
        
        console.log('🎴 暗記カードセッション記録を保存:', record);
    },
    
    // セッション終了
    endSession() {
        this.session.isActive = false;
        
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        const container = document.getElementById('flashcard-session');
        if (container) {
            container.remove();
        }
        
        console.log('🎴 暗記カードセッション終了');
    },
    
    // 暗記カード管理画面表示
    showManagementInterface() {
        const container = document.createElement('div');
        container.id = 'flashcard-management';
        container.innerHTML = `
            <div class="management-container">
                <div class="management-header">
                    <h2>🎴 暗記カード管理</h2>
                    <button class="close-btn" onclick="FlashCardModule.closeManagement()">✕</button>
                </div>
                
                <div class="management-tabs">
                    <button class="tab-btn active" onclick="FlashCardModule.showTab('overview')">概要</button>
                    <button class="tab-btn" onclick="FlashCardModule.showTab('create')">カード作成</button>
                    <button class="tab-btn" onclick="FlashCardModule.showTab('browse')">カード一覧</button>
                    <button class="tab-btn" onclick="FlashCardModule.showTab('stats')">統計</button>
                </div>
                
                <div class="management-content">
                    <div id="overview-tab" class="tab-content active">
                        ${this.generateOverviewHTML()}
                    </div>
                    
                    <div id="create-tab" class="tab-content">
                        ${this.generateCreateHTML()}
                    </div>
                    
                    <div id="browse-tab" class="tab-content">
                        ${this.generateBrowseHTML()}
                    </div>
                    
                    <div id="stats-tab" class="tab-content">
                        ${this.generateStatsHTML()}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(container);
    },
    
    // 概要HTML生成
    generateOverviewHTML() {
        const dueCards = this.getDueCards();
        const newCards = this.getNewCards();
        const totalCards = this.cards.length;
        
        return `
            <div class="overview-stats">
                <div class="stat-card">
                    <div class="stat-number">${totalCards}</div>
                    <div class="stat-label">総カード数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${dueCards.length}</div>
                    <div class="stat-label">復習待ち</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">${newCards.length}</div>
                    <div class="stat-label">新規カード</div>
                </div>
            </div>
            
            <div class="quick-actions">
                <button class="action-btn primary" onclick="FlashCardModule.startSession('mixed')" ${dueCards.length === 0 && newCards.length === 0 ? 'disabled' : ''}>
                    学習開始
                </button>
                <button class="action-btn secondary" onclick="FlashCardModule.startSession('due')" ${dueCards.length === 0 ? 'disabled' : ''}>
                    復習のみ
                </button>
                <button class="action-btn secondary" onclick="FlashCardModule.startSession('new')" ${newCards.length === 0 ? 'disabled' : ''}>
                    新規のみ
                </button>
            </div>
        `;
    },
    
    // 作成HTML生成
    generateCreateHTML() {
        return `
            <form id="card-create-form" onsubmit="FlashCardModule.handleCreateCard(event)">
                <div class="form-group">
                    <label for="card-front">問題（表面）</label>
                    <textarea id="card-front" placeholder="問題文を入力してください" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="card-back">答え（裏面）</label>
                    <textarea id="card-back" placeholder="答えを入力してください" required></textarea>
                </div>
                
                <div class="form-group">
                    <label for="card-subject">科目</label>
                    <select id="card-subject">
                        <option value="">選択してください</option>
                        <option value="minpou">民法</option>
                        <option value="gyousei">行政法</option>
                        <option value="kenpou">憲法</option>
                        <option value="shouhou">商法</option>
                        <option value="kiso">基礎法学</option>
                        <option value="ippan">一般知識</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="card-tags">タグ（カンマ区切り）</label>
                    <input type="text" id="card-tags" placeholder="条文, 判例, 重要" />
                </div>
                
                <button type="submit" class="submit-btn">カード作成</button>
            </form>
        `;
    },
    
    // 一覧HTML生成
    generateBrowseHTML() {
        if (this.cards.length === 0) {
            return '<p class="empty-message">まだカードがありません。新しいカードを作成してください。</p>';
        }
        
        return `
            <div class="browse-controls">
                <input type="text" id="search-cards" placeholder="カードを検索..." oninput="FlashCardModule.filterCards()" />
                <select id="filter-subject" onchange="FlashCardModule.filterCards()">
                    <option value="">全科目</option>
                    <option value="minpou">民法</option>
                    <option value="gyousei">行政法</option>
                    <option value="kenpou">憲法</option>
                    <option value="shouhou">商法</option>
                    <option value="kiso">基礎法学</option>
                    <option value="ippan">一般知識</option>
                </select>
            </div>
            
            <div id="cards-list">
                ${this.generateCardsList()}
            </div>
        `;
    },
    
    // カード一覧生成
    generateCardsList() {
        return this.cards.map(card => `
            <div class="card-item" data-card-id="${card.id}">
                <div class="card-preview">
                    <div class="card-front-preview">${card.front.substring(0, 100)}...</div>
                    <div class="card-back-preview">${card.back.substring(0, 100)}...</div>
                </div>
                <div class="card-meta">
                    <span class="card-subject">${this.getSubjectName(card.subject)}</span>
                    <span class="card-interval">間隔: ${card.interval}日</span>
                    <span class="card-ease">容易度: ${card.easeFactor.toFixed(2)}</span>
                </div>
                <div class="card-actions">
                    <button onclick="FlashCardModule.editCard('${card.id}')">編集</button>
                    <button onclick="FlashCardModule.deleteCard('${card.id}')" class="delete-btn">削除</button>
                </div>
            </div>
        `).join('');
    },
    
    // 科目名取得
    getSubjectName(subjectCode) {
        const subjects = {
            minpou: '民法',
            gyousei: '行政法',
            kenpou: '憲法',
            shouhou: '商法',
            kiso: '基礎法学',
            ippan: '一般知識'
        };
        return subjects[subjectCode] || '未分類';
    },
    
    // 統計HTML生成
    generateStatsHTML() {
        const stats = this.calculateStats();
        
        return `
            <div class="stats-grid">
                <div class="stat-item">
                    <h3>学習統計</h3>
                    <p>総復習回数: ${stats.totalReviews}</p>
                    <p>平均正答率: ${stats.averageAccuracy}%</p>
                    <p>学習日数: ${stats.studyDays}</p>
                </div>
                
                <div class="stat-item">
                    <h3>カード統計</h3>
                    <p>学習済み: ${stats.matureCards}</p>
                    <p>学習中: ${stats.learningCards}</p>
                    <p>新規: ${stats.newCards}</p>
                </div>
                
                <div class="stat-item">
                    <h3>科目別統計</h3>
                    ${Object.entries(stats.subjectStats).map(([subject, count]) => 
                        `<p>${this.getSubjectName(subject)}: ${count}枚</p>`
                    ).join('')}
                </div>
            </div>
        `;
    },
    
    // 統計計算
    calculateStats() {
        const stats = {
            totalReviews: 0,
            averageAccuracy: 0,
            studyDays: new Set(),
            matureCards: 0,
            learningCards: 0,
            newCards: 0,
            subjectStats: {}
        };
        
        let totalQuality = 0;
        let qualityCount = 0;
        
        this.cards.forEach(card => {
            stats.totalReviews += card.reviews.length;
            
            // 復習日を記録
            card.reviews.forEach(review => {
                const date = new Date(review.date).toDateString();
                stats.studyDays.add(date);
                totalQuality += review.quality;
                qualityCount++;
            });
            
            // カード状態分類
            if (card.reviews.length === 0) {
                stats.newCards++;
            } else if (card.isLearning) {
                stats.learningCards++;
            } else {
                stats.matureCards++;
            }
            
            // 科目別統計
            if (card.subject) {
                stats.subjectStats[card.subject] = (stats.subjectStats[card.subject] || 0) + 1;
            }
        });
        
        stats.averageAccuracy = qualityCount > 0 ? Math.round((totalQuality / qualityCount) * 20) : 0; // quality 0-5 を 0-100% に変換
        stats.studyDays = stats.studyDays.size;
        
        return stats;
    },
    
    // カード作成フォーム処理
    handleCreateCard(event) {
        event.preventDefault();
        
        const front = document.getElementById('card-front').value.trim();
        const back = document.getElementById('card-back').value.trim();
        const subject = document.getElementById('card-subject').value;
        const tagsInput = document.getElementById('card-tags').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
        
        if (!front || !back) {
            alert('問題と答えの両方を入力してください');
            return;
        }
        
        this.createCard(front, back, tags, subject);
        
        // フォームリセット
        event.target.reset();
        
        // 成功メッセージ
        this.showToast('カードを作成しました！', 'success');
        
        // 概要タブを更新
        this.updateOverviewTab();
    },
    
    // カードフィルタリング
    filterCards() {
        const searchTerm = document.getElementById('search-cards').value.toLowerCase();
        const subjectFilter = document.getElementById('filter-subject').value;
        
        let filteredCards = this.cards;
        
        if (searchTerm) {
            filteredCards = filteredCards.filter(card => 
                card.front.toLowerCase().includes(searchTerm) ||
                card.back.toLowerCase().includes(searchTerm) ||
                card.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        if (subjectFilter) {
            filteredCards = filteredCards.filter(card => card.subject === subjectFilter);
        }
        
        const cardsList = document.getElementById('cards-list');
        if (cardsList) {
            cardsList.innerHTML = this.generateCardsListFromArray(filteredCards);
        }
    },
    
    // 指定カード配列からリスト生成
    generateCardsListFromArray(cards) {
        if (cards.length === 0) {
            return '<p class="empty-message">条件に一致するカードがありません。</p>';
        }
        
        return cards.map(card => `
            <div class="card-item" data-card-id="${card.id}">
                <div class="card-preview">
                    <div class="card-front-preview">${card.front.substring(0, 100)}${card.front.length > 100 ? '...' : ''}</div>
                    <div class="card-back-preview">${card.back.substring(0, 100)}${card.back.length > 100 ? '...' : ''}</div>
                </div>
                <div class="card-meta">
                    <span class="card-subject">${this.getSubjectName(card.subject)}</span>
                    <span class="card-interval">間隔: ${card.interval}日</span>
                    <span class="card-ease">容易度: ${card.easeFactor.toFixed(2)}</span>
                    <span class="card-reviews">復習: ${card.reviews.length}回</span>
                </div>
                <div class="card-actions">
                    <button onclick="FlashCardModule.editCardDialog('${card.id}')">編集</button>
                    <button onclick="FlashCardModule.confirmDeleteCard('${card.id}')" class="delete-btn">削除</button>
                </div>
            </div>
        `).join('');
    },
    
    // カード編集ダイアログ
    editCardDialog(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;
        
        const front = prompt('問題を編集してください:', card.front);
        if (front === null) return;
        
        const back = prompt('答えを編集してください:', card.back);
        if (back === null) return;
        
        this.editCard(cardId, { front: front.trim(), back: back.trim() });
        this.updateBrowseTab();
        this.showToast('カードを更新しました！', 'success');
    },
    
    // カード削除確認
    confirmDeleteCard(cardId) {
        if (confirm('このカードを削除しますか？この操作は取り消せません。')) {
            this.deleteCard(cardId);
            this.updateBrowseTab();
            this.updateOverviewTab();
            this.showToast('カードを削除しました', 'info');
        }
    },
    
    // タブ表示切り替え
    showTab(tabName) {
        // タブボタンの状態更新
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`button[onclick="FlashCardModule.showTab('${tabName}')"]`).classList.add('active');
        
        // タブコンテンツの表示切り替え
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // タブごとの更新処理
        switch(tabName) {
            case 'overview':
                this.updateOverviewTab();
                break;
            case 'browse':
                this.updateBrowseTab();
                break;
            case 'stats':
                this.updateStatsTab();
                break;
        }
    },
    
    // 概要タブ更新
    updateOverviewTab() {
        const overviewTab = document.getElementById('overview-tab');
        if (overviewTab) {
            overviewTab.innerHTML = this.generateOverviewHTML();
        }
    },
    
    // 一覧タブ更新
    updateBrowseTab() {
        const browseTab = document.getElementById('browse-tab');
        if (browseTab) {
            browseTab.innerHTML = this.generateBrowseHTML();
        }
    },
    
    // 統計タブ更新
    updateStatsTab() {
        const statsTab = document.getElementById('stats-tab');
        if (statsTab) {
            statsTab.innerHTML = this.generateStatsHTML();
        }
    },
    
    // 管理画面を閉じる
    closeManagement() {
        const container = document.getElementById('flashcard-management');
        if (container) {
            container.remove();
        }
    },
    
    // トースト通知表示
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        // アニメーション
        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    // 暗記カード用CSS追加
    addFlashCardCSS() {
        if (document.getElementById('flashcard-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'flashcard-styles';
        style.textContent = `
            .flashcard-session-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.9);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .flashcard-session-container {
                background: white;
                border-radius: 16px;
                width: 100%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .flashcard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px;
                border-bottom: 1px solid #eee;
            }
            
            .session-progress {
                flex: 1;
            }
            
            .close-session-btn {
                background: #f44336;
                color: white;
                border: none;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
            }
            
            .flashcard-display {
                padding: 20px;
                flex: 1;
            }
            
            .flashcard-container {
                perspective: 1000px;
                margin-bottom: 30px;
            }
            
            .flashcard {
                position: relative;
                width: 100%;
                height: 300px;
                transition: transform 0.6s;
                transform-style: preserve-3d;
                cursor: pointer;
            }
            
            .flashcard.flipped {
                transform: rotateY(180deg);
            }
            
            .card-front, .card-back {
                position: absolute;
                width: 100%;
                height: 100%;
                backface-visibility: hidden;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 30px;
            }
            
            .card-front {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            
            .card-back {
                background: linear-gradient(135deg, #f093fb, #f5576c);
                color: white;
                transform: rotateY(180deg);
            }
            
            .card-content {
                text-align: center;
                width: 100%;
            }
            
            .card-type {
                font-size: 14px;
                opacity: 0.9;
                margin-bottom: 15px;
                font-weight: bold;
            }
            
            .card-text {
                font-size: 18px;
                line-height: 1.6;
                word-wrap: break-word;
            }
            
            .flashcard-controls {
                text-align: center;
            }
            
            .control-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .control-btn.primary {
                background: #667eea;
                color: white;
            }
            
            .control-btn.secondary {
                background: #f5f5f5;
                color: #333;
            }
            
            .rating-buttons {
                margin-top: 20px;
            }
            
            .rating-instruction {
                margin-bottom: 15px;
                font-size: 14px;
                color: #666;
            }
            
            .rating-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 10px;
            }
            
            .rating-btn {
                padding: 15px 10px;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                text-align: center;
                transition: all 0.2s;
                font-size: 12px;
            }
            
            .rating-btn.again { background: #ffebee; color: #f44336; }
            .rating-btn.hard { background: #fff3e0; color: #ff9800; }
            .rating-btn.good { background: #e8f5e9; color: #4caf50; }
            .rating-btn.easy { background: #e3f2fd; color: #2196f3; }
            
            .rating-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            
            .rating-icon {
                display: block;
                font-size: 24px;
                margin-bottom: 5px;
            }
            
            .rating-label {
                display: block;
                font-weight: bold;
                margin-bottom: 2px;
            }
            
            .session-stats {
                display: flex;
                justify-content: space-around;
                padding: 20px;
                border-top: 1px solid #eee;
                background: #f8f9fa;
            }
            
            .stat-item {
                text-align: center;
            }
            
            .stat-value {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .stat-item.correct .stat-value { color: #4caf50; }
            .stat-item.wrong .stat-value { color: #f44336; }
            .stat-item.time .stat-value { color: #667eea; }
            
            .stat-label {
                font-size: 12px;
                color: #666;
            }
            
            .keyboard-help {
                text-align: center;
                padding: 10px 20px;
                background: #f0f0f0;
                color: #666;
            }
            
            .session-results {
                padding: 40px;
                text-align: center;
            }
            
            .results-header h2 {
                color: #4caf50;
                margin-bottom: 10px;
            }
            
            .results-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin: 30px 0;
            }
            
            .result-item {
                text-align: center;
            }
            
            .result-value {
                font-size: 32px;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 5px;
            }
            
            .result-label {
                font-size: 14px;
                color: #666;
            }
            
            .results-actions {
                display: flex;
                gap: 10px;
                justify-content: center;
                margin: 30px 0;
            }
            
            .next-review-info {
                font-size: 14px;
                color: #666;
                margin-top: 20px;
            }
            
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 8px;
                color: white;
                font-weight: bold;
                z-index: 20000;
                transform: translateX(100%);
                transition: transform 0.3s;
            }
            
            .toast.show {
                transform: translateX(0);
            }
            
            .toast-success { background: #4caf50; }
            .toast-info { background: #2196f3; }
            .toast-warning { background: #ff9800; }
            .toast-error { background: #f44336; }
            
            @media (max-width: 600px) {
                .flashcard-session-container {
                    margin: 10px;
                    max-height: 95vh;
                }
                
                .rating-grid {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 15px;
                }
                
                .card-text {
                    font-size: 16px;
                }
                
                .results-stats {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;
        
        document.head.appendChild(style);
    },
    
    // 予習カード自動生成（AI機能と連携）
    generateCardsFromHistory() {
        const history = StorageModule.getHistory();
        const weakAreas = this.identifyWeakAreas(history);
        
        const generatedCards = [];
        
        weakAreas.forEach(area => {
            // 弱点エリアに基づいてカードテンプレートを生成
            const templates = this.getCardTemplates(area.subject, area.topic);
            templates.forEach(template => {
                const card = this.createCard(
                    template.front,
                    template.back,
                    [area.subject, area.topic, '自動生成'],
                    area.subject
                );
                generatedCards.push(card);
            });
        });
        
        console.log(`🎴 ${generatedCards.length}枚のカードを自動生成しました`);
        return generatedCards;
    },
    
    // 弱点エリア特定
    identifyWeakAreas(history) {
        const subjectAccuracy = {};
        
        history.forEach(record => {
            if (record.subject) {
                if (!subjectAccuracy[record.subject]) {
                    subjectAccuracy[record.subject] = { total: 0, correct: 0 };
                }
                subjectAccuracy[record.subject].total += record.stats.total || 0;
                subjectAccuracy[record.subject].correct += record.stats.correct || 0;
            }
        });
        
        return Object.keys(subjectAccuracy)
            .filter(subject => {
                const data = subjectAccuracy[subject];
                const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                return accuracy < 70 && data.total >= 10; // 正答率70%未満かつ10問以上
            })
            .map(subject => ({
                subject: subject,
                topic: 'general', // 実際にはより詳細な分析が必要
                accuracy: Math.round((subjectAccuracy[subject].correct / subjectAccuracy[subject].total) * 100)
            }));
    },
    
    // カードテンプレート取得
    getCardTemplates(subject, topic) {
        const templates = {
            minpou: [
                {
                    front: '契約の成立要件は何ですか？',
                    back: '①申込み ②承諾 ③対価関係（有償契約の場合）'
                },
                {
                    front: '意思表示の瑕疵にはどのようなものがありますか？',
                    back: '①心裡留保 ②虚偽表示 ③錯誤 ④詐欺 ⑤強迫'
                }
            ],
            gyousei: [
                {
                    front: '行政行為の効力にはどのようなものがありますか？',
                    back: '①公定力 ②確定力 ③存続力 ④執行力'
                },
                {
                    front: '行政処分の取消事由は何ですか？',
                    back: '①違法性 ②裁量権の逸脱・濫用'
                }
            ],
            kenpou: [
                {
                    front: '基本的人権の分類を述べてください',
                    back: '①自由権 ②参政権 ③社会権 ④国務請求権'
                }
            ]
        };
        
        return templates[subject] || [];
    },
    
    // 学習効果分析
    analyzeLearningEffectiveness() {
        const analysis = {
            retentionRate: this.calculateRetentionRate(),
            optimalReviewInterval: this.calculateOptimalInterval(),
            difficultyDistribution: this.calculateDifficultyDistribution(),
            learningProgress: this.calculateLearningProgress()
        };
        
        return analysis;
    },
    
    // 記憶定着率計算
    calculateRetentionRate() {
        const recentReviews = this.cards
            .flatMap(card => card.reviews)
            .filter(review => {
                const reviewDate = new Date(review.date);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return reviewDate >= weekAgo;
            });
        
        if (recentReviews.length === 0) return 0;
        
        const correctReviews = recentReviews.filter(review => review.quality >= 3).length;
        return Math.round((correctReviews / recentReviews.length) * 100);
    },
    
    // 最適復習間隔計算
    calculateOptimalInterval() {
        const intervalEffectiveness = {};
        
        this.cards.forEach(card => {
            card.reviews.forEach((review, index) => {
                if (index > 0) {
                    const interval = card.reviews[index - 1].interval;
                    if (!intervalEffectiveness[interval]) {
                        intervalEffectiveness[interval] = { total: 0, correct: 0 };
                    }
                    intervalEffectiveness[interval].total++;
                    if (review.quality >= 3) {
                        intervalEffectiveness[interval].correct++;
                    }
                }
            });
        });
        
        let bestInterval = 1;
        let bestAccuracy = 0;
        
        Object.keys(intervalEffectiveness).forEach(interval => {
            const data = intervalEffectiveness[interval];
            const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
            if (accuracy > bestAccuracy && data.total >= 5) {
                bestAccuracy = accuracy;
                bestInterval = parseInt(interval);
            }
        });
        
        return { interval: bestInterval, accuracy: Math.round(bestAccuracy) };
    },
    
    // 難易度分布計算
    calculateDifficultyDistribution() {
        const distribution = { easy: 0, medium: 0, hard: 0 };
        
        this.cards.forEach(card => {
            if (card.reviews.length > 0) {
                const avgQuality = card.reviews.reduce((sum, r) => sum + r.quality, 0) / card.reviews.length;
                if (avgQuality >= 4) distribution.easy++;
                else if (avgQuality >= 2) distribution.medium++;
                else distribution.hard++;
            }
        });
        
        return distribution;
    },
    
    // 学習進捗計算
    calculateLearningProgress() {
        const total = this.cards.length;
        if (total === 0) return { progress: 0, stage: 'empty' };
        
        const mature = this.cards.filter(card => !card.isLearning && card.interval >= 21).length;
        const learning = this.cards.filter(card => card.isLearning).length;
        const newCards = this.cards.filter(card => card.reviews.length === 0).length;
        
        const progress = Math.round((mature / total) * 100);
        
        let stage;
        if (progress >= 80) stage = 'advanced';
        else if (progress >= 50) stage = 'intermediate';
        else if (progress >= 20) stage = 'beginner';
        else stage = 'starting';
        
        return {
            progress,
            stage,
            mature,
            learning,
            newCards,
            total
        };
    }
};

// ===== グローバル関数（後方互換性） =====
function startFlashCardSession() {
    FlashCardModule.startSession('mixed');
}

function showFlashCardManagement() {
    FlashCardModule.showManagementInterface();
}

function flipCard() {
    FlashCardModule.flipCard();
}

function rateCard(quality) {
    FlashCardModule.rateCard(quality);
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', function() {
    FlashCardModule.init();
    console.log('🎴 暗記カードモジュール初期化完了');
});
