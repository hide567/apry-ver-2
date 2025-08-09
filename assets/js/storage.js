// ===== データ保存・管理モジュール =====
const StorageModule = {
    STORAGE_KEYS: {
        HISTORY: 'studyHistory',
        SETTINGS: 'appSettings',
        PROBLEM_SETS: 'problemSets',
        FLASH_CARDS: 'flashCards'
    },
    
    MAX_HISTORY_ITEMS: 100,
    
    // 学習記録保存
    saveRecord(record) {
        try {
            let history = this.getHistory();
            history.unshift(record);
            
            // 最大件数を超えた場合は古いものを削除
            if (history.length > this.MAX_HISTORY_ITEMS) {
                history = history.slice(0, this.MAX_HISTORY_ITEMS);
            }
            
            localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(history));
            console.log('💾 学習記録を保存しました:', record);
            
            return true;
        } catch (error) {
            console.error('💾 記録保存エラー:', error);
            this.handleStorageError(error);
            return false;
        }
    },
    
    // 学習履歴取得
    getHistory() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('💾 履歴取得エラー:', error);
            return [];
        }
    },
    
    // 履歴表示
    loadHistory() {
        const history = this.getHistory();
        const historyList = document.getElementById('historyList');
        
        if (!historyList) return;
        
        if (history.length === 0) {
            historyList.innerHTML = '<div class="card"><p style="text-align:center; color:#999;">まだ記録がありません</p></div>';
            return;
        }
        
        const subjects = {
            minpou: '民法',
            gyousei: '行政法',
            kenpou: '憲法',
            shouhou: '商法',
            kiso: '基礎法学',
            ippan: '一般知識'
        };
        
        historyList.innerHTML = history.slice(0, 10).map(record => {
            const date = new Date(record.date);
            const subjectName = subjects[record.subject] || '未選択';
            const studyTimeMin = Math.floor((record.studyTime || 0) / 60);
            
            return `
                <div class="history-item">
                    <div class="history-date">
                        <div class="history-day">${date.getDate()}</div>
                        <div class="history-month">${date.getMonth() + 1}月</div>
                    </div>
                    <div class="history-content">
                        <div class="history-title">${subjectName}</div>
                        <div class="history-detail">${record.stats.total}問 | ${studyTimeMin}分</div>
                    </div>
                    <div class="history-score">
                        <div class="history-percentage">${record.stats.percentage}</div>
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // 全体統計更新
    updateAllStats() {
        const history = this.getHistory();
        
        let totalTime = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;
        
        history.forEach(record => {
            totalTime += record.studyTime || 0;
            totalQuestions += record.stats.total || 0;
            totalCorrect += record.stats.correct || 0;
        });
        
        const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
        
        // 統計表示更新
        const statsContent = document.getElementById('statsContent');
        if (statsContent) {
            statsContent.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: #666;">総学習時間</div>
                        <div style="font-size: 24px; font-weight: bold; color: #333;">${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">総解答数</div>
                        <div style="font-size: 24px; font-weight: bold; color: #333;">${totalQuestions}問</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">平均正答率</div>
                        <div style="font-size: 24px; font-weight: bold; color: #4caf50;">${avgAccuracy}%</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">学習日数</div>
                        <div style="font-size: 24px; font-weight: bold; color: #333;">${history.length}日</div>
                    </div>
                </div>
            `;
        }
    },
    
    // データエクスポート
    exportData(format) {
        const history = this.getHistory();
        
        if (history.length === 0) {
            alert('エクスポートするデータがありません');
            return;
        }
        
        try {
            if (format === 'json') {
                this.exportJSON(history);
            } else if (format === 'csv') {
                this.exportCSV(history);
            }
            
            console.log(`💾 データをエクスポートしました (${format})`);
        } catch (error) {
            console.error('💾 エクスポートエラー:', error);
            alert('エクスポートに失敗しました: ' + error.message);
        }
    },
    
    // JSON形式でエクスポート
    exportJSON(data) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `study_data_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },
    
    // CSV形式でエクスポート
    exportCSV(data) {
        let csv = 'Date,Subject,Book,Total,Correct,Wrong,Percentage,Time(min)\n';
        
        data.forEach(record => {
            const date = new Date(record.date).toLocaleString('ja-JP');
            const subject = record.subject || 'N/A';
            const book = record.book || 'N/A';
            const time = Math.floor((record.studyTime || 0) / 60);
            
            csv += `"${date}","${subject}","${book}",${record.stats.total},${record.stats.correct},${record.stats.wrong},"${record.stats.percentage}",${time}\n`;
        });
        
        const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        const exportFileDefaultName = `study_data_${new Date().toISOString().split('T')[0]}.csv`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    },
    
    // データインポート
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const data = JSON.parse(text);
                
                // データ検証
                if (!Array.isArray(data)) {
                    throw new Error('Invalid data format');
                }
                
                // マージか上書きか選択
                const merge = confirm('既存のデータと結合しますか？\n「キャンセル」を選ぶと上書きされます');
                
                if (merge) {
                    const existing = this.getHistory();
                    const merged = [...existing, ...data];
                    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(merged));
                    alert(`${data.length}件のデータを追加しました`);
                } else {
                    localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(data));
                    alert(`${data.length}件のデータをインポートしました`);
                }
                
                // 画面更新
                this.loadHistory();
                this.updateAllStats();
                
                if (typeof AnalyticsModule !== 'undefined') {
                    AnalyticsModule.updateBadges();
                }
                
            } catch (error) {
                console.error('💾 インポートエラー:', error);
                alert('インポートに失敗しました: ' + error.message);
            }
        };
        
        input.click();
    },
    
    // データクリア
    clearData() {
        if (confirm('すべての学習データが削除されます。よろしいですか？')) {
            try {
                localStorage.removeItem(this.STORAGE_KEYS.HISTORY);
                console.log('💾 データをクリアしました');
                location.reload();
            } catch (error) {
                console.error('💾 データクリアエラー:', error);
                alert('データクリアに失敗しました');
            }
        }
    },
    
    // 設定保存
    saveSetting(key, value) {
        try {
            const settings = this.getSettings();
            settings[key] = value;
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
            
            console.log(`💾 設定を保存しました: ${key} = ${value}`);
            return true;
        } catch (error) {
            console.error('💾 設定保存エラー:', error);
            return false;
        }
    },
    
    // 設定取得
    getSetting(key, defaultValue = null) {
        try {
            const settings = this.getSettings();
            return settings.hasOwnProperty(key) ? settings[key] : defaultValue;
        } catch (error) {
            console.error('💾 設定取得エラー:', error);
            return defaultValue;
        }
    },
    
    // 全設定取得
    getSettings() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('💾 設定取得エラー:', error);
            return {};
        }
    },
    
    // 問題集構造インポート
    importProblemSet() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const problemSet = JSON.parse(text);
                
                // データ検証
                if (!problemSet.bookName || !problemSet.structure) {
                    throw new Error('問題集データの形式が正しくありません');
                }
                
                let problemSets = this.getProblemSets();
                
                // 同じ問題集があるか確認
                const existingIndex = problemSets.findIndex(ps => ps.bookName === problemSet.bookName);
                
                if (existingIndex >= 0) {
                    if (confirm(`「${problemSet.bookName}」は既に登録されています。上書きしますか？`)) {
                        problemSets[existingIndex] = problemSet;
                    } else {
                        return;
                    }
                } else {
                    problemSets.push(problemSet);
                }
                
                localStorage.setItem(this.STORAGE_KEYS.PROBLEM_SETS, JSON.stringify(problemSets));
                
                // 問題集セレクトボックスを更新
                this.updateBookSelect(problemSets);
                
                alert(`問題集「${problemSet.bookName}」を登録しました！\n` +
                      `科目数: ${Object.keys(problemSet.structure).length}\n` +
                      `総問題数: ${this.calculateTotalQuestions(problemSet.structure)}問`);
                
            } catch (error) {
                console.error('💾 問題集インポートエラー:', error);
                alert('インポートに失敗しました: ' + error.message);
            }
        };
        
        input.click();
    },
    
    // 問題集一覧取得
    getProblemSets() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.PROBLEM_SETS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('💾 問題集取得エラー:', error);
            return [];
        }
    },
    
    // 問題集セレクトボックス更新
    updateBookSelect(problemSets) {
        const bookSelect = document.getElementById('bookSelect');
        if (!bookSelect) return;
        
        // デフォルトオプションを保持
        const defaultOptions = `
            <option value="">選択してください...</option>
            <option value="goukaku">合格革命 肢別過去問集</option>
            <option value="ukaru">うかる！行政書士 肢別本</option>
            <option value="lec">出る順行政書士 肢別問題集</option>
            <option value="past-r5">令和5年度 本試験</option>
            <option value="past-r4">令和4年度 本試験</option>
        `;
        
        // インポートした問題集を追加
        const importedOptions = problemSets.map(ps => 
            `<option value="${ps.bookId}">${ps.bookName}</option>`
        ).join('');
        
        bookSelect.innerHTML = defaultOptions + importedOptions;
    },
    
    // 総問題数計算
    calculateTotalQuestions(structure) {
        let total = 0;
        Object.values(structure).forEach(subject => {
            if (subject.chapters && Array.isArray(subject.chapters)) {
                subject.chapters.forEach(chapter => {
                    total += (chapter.endNum || 0) - (chapter.startNum || 0) + 1;
                });
            }
        });
        return total;
    },
    
    // ストレージエラー処理
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            alert('ストレージ容量が不足しています。古いデータを削除してください。');
        } else {
            console.error('💾 ストレージエラー:', error);
        }
    },
    
    // ストレージ使用量取得
    getStorageUsage() {
        try {
            let totalSize = 0;
            
            Object.values(this.STORAGE_KEYS).forEach(key => {
                const data = localStorage.getItem(key);
                if (data) {
                    totalSize += new Blob([data]).size;
                }
            });
            
            return {
                bytes: totalSize,
                kb: (totalSize / 1024).toFixed(2),
                mb: (totalSize / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error('💾 使用量計算エラー:', error);
            return { bytes: 0, kb: '0.00', mb: '0.00' };
        }
    },
    
    // ストレージ容量チェック
    checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            navigator.storage.estimate().then(quota => {
                const used = quota.usage || 0;
                const total = quota.quota || 0;
                const usagePercent = total > 0 ? Math.round((used / total) * 100) : 0;
                
                console.log(`💾 ストレージ使用量: ${usagePercent}% (${Math.round(used / 1024 / 1024)}MB / ${Math.round(total / 1024 / 1024)}MB)`);
                
                if (usagePercent > 80) {
                    console.warn('💾 ストレージ使用量が80%を超えています');
                }
            });
        }
    },
    
    // データ整合性チェック
    validateData() {
        const history = this.getHistory();
        let validRecords = 0;
        let invalidRecords = 0;
        
        const cleanHistory = history.filter(record => {
            // 必須フィールドの存在チェック
            if (!record.id || !record.date || !record.stats) {
                invalidRecords++;
                return false;
            }
            
            // 統計データの妥当性チェック
            const stats = record.stats;
            if (typeof stats.total !== 'number' || 
                typeof stats.correct !== 'number' || 
                typeof stats.wrong !== 'number') {
                invalidRecords++;
                return false;
            }
            
            validRecords++;
            return true;
        });
        
        // 不正なデータがあった場合は修復
        if (invalidRecords > 0) {
            console.warn(`💾 不正なデータを${invalidRecords}件検出し、修復しました`);
            localStorage.setItem(this.STORAGE_KEYS.HISTORY, JSON.stringify(cleanHistory));
        }
        
        return { valid: validRecords, invalid: invalidRecords };
    }
};

// ===== グローバル関数（後方互換性） =====
function exportData(format) {
    StorageModule.exportData(format);
}

function clearData() {
    StorageModule.clearData();
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', function() {
    // データ整合性チェック
    StorageModule.validateData();
    
    // ストレージ容量チェック
    StorageModule.checkStorageQuota();
    
    console.log('💾 ストレージモジュール初期化完了');
});
