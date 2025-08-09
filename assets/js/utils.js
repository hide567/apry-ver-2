// ===== 汎用ユーティリティ関数 =====
const Utils = {
    
    // DOM要素取得（安全）
    getElement(id) {
        const element = document.getElementById(id);
        if (!element) {
            console.warn(`⚠️ 要素が見つかりません: ${id}`);
        }
        return element;
    },
    
    // DOM要素の内容更新
    updateElement(id, content) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = content;
            return true;
        }
        return false;
    },
    
    // DOM要素のHTML更新
    updateElementHTML(id, html) {
        const element = this.getElement(id);
        if (element) {
            element.innerHTML = html;
            return true;
        }
        return false;
    },
    
    // 日付フォーマット
    formatDate(date, format = 'YYYY/MM/DD') {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const hour = String(d.getHours()).padStart(2, '0');
        const minute = String(d.getMinutes()).padStart(2, '0');
        const second = String(d.getSeconds()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day)
            .replace('HH', hour)
            .replace('mm', minute)
            .replace('ss', second);
    },
    
    // 相対時間表示（○分前、○時間前など）
    getRelativeTime(date) {
        const now = new Date();
        const target = new Date(date);
        const diffMs = now - target;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        
        if (diffSec < 60) {
            return 'たった今';
        } else if (diffMin < 60) {
            return `${diffMin}分前`;
        } else if (diffHour < 24) {
            return `${diffHour}時間前`;
        } else if (diffDay < 7) {
            return `${diffDay}日前`;
        } else {
            return this.formatDate(date, 'MM/DD');
        }
    },
    
    // 時間を秒からフォーマット
    formatDuration(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        
        if (h > 0) {
            return `${h}時間${m}分`;
        } else if (m > 0) {
            return `${m}分${s}秒`;
        } else {
            return `${s}秒`;
        }
    },
    
    // 数値を3桁区切りでフォーマット
    formatNumber(num) {
        return num.toLocaleString('ja-JP');
    },
    
    // パーセンテージ計算
    calculatePercentage(correct, total) {
        if (total === 0) return 0;
        return Math.round((correct / total) * 100);
    },
    
    // 配列の平均値計算
    calculateAverage(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) return 0;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return Math.round(sum / numbers.length);
    },
    
    // 配列の最大値・最小値
    getMinMax(numbers) {
        if (!Array.isArray(numbers) || numbers.length === 0) {
            return { min: 0, max: 0 };
        }
        return {
            min: Math.min(...numbers),
            max: Math.max(...numbers)
        };
    },
    
    // 配列をシャッフル
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },
    
    // オブジェクトの深いコピー
    deepClone(obj) {
        try {
            return JSON.parse(JSON.stringify(obj));
        } catch (error) {
            console.error('🔧 深いコピーに失敗:', error);
            return obj;
        }
    },
    
    // URLパラメータを取得
    getUrlParams() {
        const params = {};
        const searchParams = new URLSearchParams(window.location.search);
        for (const [key, value] of searchParams) {
            params[key] = value;
        }
        return params;
    },
    
    // ローカルストレージの安全な読み書き
    safeLocalStorage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('🔧 LocalStorage書き込みエラー:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('🔧 LocalStorage読み込みエラー:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('🔧 LocalStorage削除エラー:', error);
                return false;
            }
        }
    },
    
    // デバウンス関数
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // スロットル関数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // アニメーション付きスクロール
    smoothScrollTo(targetY, duration = 500) {
        const startY = window.pageYOffset;
        const distance = targetY - startY;
        const startTime = new Date().getTime();
        
        const easeInOutQuart = (time, from, distance, duration) => {
            if ((time /= duration / 2) < 1) {
                return distance / 2 * time * time * time * time + from;
            }
            return -distance / 2 * ((time -= 2) * time * time * time - 2) + from;
        };
        
        const timer = setInterval(() => {
            const time = new Date().getTime() - startTime;
            const newY = easeInOutQuart(time, startY, distance, duration);
            
            if (time >= duration) {
                clearInterval(timer);
                window.scrollTo(0, targetY);
            } else {
                window.scrollTo(0, newY);
            }
        }, 1000 / 60);
    },
    
    // 要素の可視性判定
    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
        
        return !(rect.bottom < 0 || rect.top - viewHeight >= 0);
    },
    
    // バイブレーション（対応デバイスのみ）
    vibrate(pattern = [100]) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    },
    
    // ハプティックフィードバック（iOS Safari）
    hapticFeedback(type = 'impact') {
        if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
            // iOS 13+
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    },
    
    // ファイルサイズをフォーマット
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // ランダムID生成
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // カラーコード生成
    generateRandomColor() {
        const colors = [
            '#667eea', '#764ba2', '#f093fb', '#f5576c',
            '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
            '#ffecd2', '#fcb69f', '#a8edea', '#fed6e3'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // パフォーマンス測定
    performance: {
        start(label) {
            performance.mark(`${label}-start`);
        },
        
        end(label) {
            performance.mark(`${label}-end`);
            performance.measure(label, `${label}-start`, `${label}-end`);
            
            const measure = performance.getEntriesByName(label)[0];
            console.log(`⚡ ${label}: ${measure.duration.toFixed(2)}ms`);
            
            // クリーンアップ
            performance.clearMarks(`${label}-start`);
            performance.clearMarks(`${label}-end`);
            performance.clearMeasures(label);
            
            return measure.duration;
        }
    },
    
    // エラーログ
    logError(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context: context,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
        
        console.error('🚨 エラーログ:', errorInfo);
        
        // 実装時：エラーログをサーバーに送信
        // this.sendErrorLog(errorInfo);
    },
    
    // デバッグ情報取得
    getDebugInfo() {
        return {
            userAgent: navigator.userAgent,
            viewportSize: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            screenSize: {
                width: screen.width,
                height: screen.height
            },
            devicePixelRatio: window.devicePixelRatio,
            online: navigator.onLine,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            localStorage: typeof Storage !== 'undefined',
            serviceWorker: 'serviceWorker' in navigator,
            timestamp: new Date().toISOString()
        };
    }
};

// ===== DOM操作ヘルパー =====
const DOM = {
    // クラス操作
    addClass(element, className) {
        if (element && className) {
            element.classList.add(className);
        }
    },
    
    removeClass(element, className) {
        if (element && className) {
            element.classList.remove(className);
        }
    },
    
    toggleClass(element, className) {
        if (element && className) {
            element.classList.toggle(className);
        }
    },
    
    hasClass(element, className) {
        return element && element.classList.contains(className);
    },
    
    // 要素作成
    create(tagName, attributes = {}, textContent = '') {
        const element = document.createElement(tagName);
        
        Object.keys(attributes).forEach(key => {
            if (key === 'className') {
                element.className = attributes[key];
            } else if (key === 'innerHTML') {
                element.innerHTML = attributes[key];
            } else {
                element.setAttribute(key, attributes[key]);
            }
        });
        
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    },
    
    // イベントリスナー
    on(element, event, handler) {
        if (element && event && handler) {
            element.addEventListener(event, handler);
        }
    },
    
    off(element, event, handler) {
        if (element && event && handler) {
            element.removeEventListener(event, handler);
        }
    },
    
    // 要素削除
    remove(element) {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }
};

// ===== 初期化 =====
console.log('🔧 ユーティリティモジュール読み込み完了');
