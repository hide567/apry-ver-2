// ===== グラフ・統計モジュール =====
const ChartsModule = {
    charts: {},
    colors: {
        primary: 'rgba(102, 126, 234, 1)',
        primaryLight: 'rgba(102, 126, 234, 0.5)',
        secondary: 'rgba(118, 75, 162, 1)',
        success: 'rgba(76, 175, 80, 1)',
        warning: 'rgba(255, 152, 0, 1)',
        error: 'rgba(244, 67, 54, 1)',
        gradient: {
            primary: ['rgba(102, 126, 234, 0.8)', 'rgba(118, 75, 162, 0.8)'],
            success: ['rgba(76, 175, 80, 0.8)', 'rgba(139, 195, 74, 0.8)'],
            warm: ['rgba(255, 111, 0, 0.8)', 'rgba(255, 152, 0, 0.8)']
        }
    },
    
    // 初期化
    initialize() {
        this.initializeWeekChart();
        this.initializeSubjectChart();
        this.initializeMonthlyChart();
        this.initializeTrendChart();
        
        console.log('📊 グラフモジュール初期化完了');
    },
    
    // 週間学習グラフ
    initializeWeekChart() {
        const ctx = document.getElementById('weekChart');
        if (!ctx) return;
        
        this.charts.week = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['月', '火', '水', '木', '金', '土', '日'],
                datasets: [{
                    label: '学習問題数',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: this.colors.primaryLight,
                    borderColor: this.colors.primary,
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => `${context.parsed.y}問解答`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            stepSize: 10
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },
    
    // 科目別レーダーチャート
    initializeSubjectChart() {
        const ctx = document.getElementById('subjectChart');
        if (!ctx) return;
        
        this.charts.subject = new Chart(ctx.getContext('2d'), {
            type: 'radar',
            data: {
                labels: ['民法', '行政法', '憲法', '商法', '基礎法学', '一般知識'],
                datasets: [{
                    label: '正答率',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(102, 126, 234, 0.2)',
                    borderColor: this.colors.primary,
                    borderWidth: 3,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: this.colors.primary,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => `正答率: ${context.parsed.r}%`
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(102, 126, 234, 0.2)'
                        },
                        angleLines: {
                            color: 'rgba(102, 126, 234, 0.2)'
                        },
                        pointLabels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            },
                            color: '#333'
                        },
                        ticks: {
                            stepSize: 20,
                            display: false
                        }
                    }
                }
            }
        });
    },
    
    // 月間推移グラフ
    initializeMonthlyChart() {
        const ctx = document.getElementById('monthlyChart');
        if (!ctx) return;
        
        this.charts.monthly = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '日別学習量',
                    data: [],
                    borderColor: this.colors.primary,
                    backgroundColor: this.createGradient(ctx, this.colors.gradient.primary),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => `${context.parsed.y}問解答`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    },
    
    // 正答率トレンドグラフ
    initializeTrendChart() {
        const ctx = document.getElementById('trendChart');
        if (!ctx) return;
        
        this.charts.trend = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '正答率',
                    data: [],
                    borderColor: this.colors.success,
                    backgroundColor: this.createGradient(ctx, this.colors.gradient.success),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.colors.success,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        cornerRadius: 8,
                        callbacks: {
                            label: (context) => `正答率: ${context.parsed.y}%`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },
    
    // グラデーション作成
    createGradient(ctx, colors) {
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, colors[0]);
        gradient.addColorStop(1, colors[1]);
        return gradient;
    },
    
    // 全グラフ更新
    updateCharts() {
        const history = StorageModule.getHistory();
        
        this.updateWeekChart(history);
        this.updateSubjectChart(history);
        this.updateMonthlyChart(history);
        this.updateTrendChart(history);
        
        console.log('📊 グラフデータ更新完了');
    },
    
    // 週間グラフ更新
    updateWeekChart(history) {
        if (!this.charts.week) return;
        
        const weekData = [0, 0, 0, 0, 0, 0, 0];
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1); // 月曜日を週の開始とする
        
        history.forEach(record => {
            const recordDate = new Date(record.date);
            if (recordDate >= weekStart) {
                const dayIndex = recordDate.getDay() === 0 ? 6 : recordDate.getDay() - 1; // 日曜日を6に
                weekData[dayIndex] += record.stats.total || 0;
            }
        });
        
        this.charts.week.data.datasets[0].data = weekData;
        this.charts.week.update('none'); // アニメーション無しで高速更新
    },
    
    // 科目別グラフ更新
    updateSubjectChart(history) {
        if (!this.charts.subject) return;
        
        const subjectData = {
            minpou: { total: 0, correct: 0 },
            gyousei: { total: 0, correct: 0 },
            kenpou: { total: 0, correct: 0 },
            shouhou: { total: 0, correct: 0 },
            kiso: { total: 0, correct: 0 },
            ippan: { total: 0, correct: 0 }
        };
        
        history.forEach(record => {
            if (record.subject && subjectData[record.subject]) {
                subjectData[record.subject].total += record.stats.total || 0;
                subjectData[record.subject].correct += record.stats.correct || 0;
            }
        });
        
        const subjectAccuracy = Object.keys(subjectData).map(key => {
            const data = subjectData[key];
            return data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        });
        
        this.charts.subject.data.datasets[0].data = subjectAccuracy;
        this.charts.subject.update('none');
    },
    
    // 月間グラフ更新
    updateMonthlyChart(history) {
        if (!this.charts.monthly) return;
        
        const labels = [];
        const data = [];
        
        // 過去30日のデータを生成
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
            
            const dayData = history.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.toDateString() === date.toDateString();
            });
            
            const dayTotal = dayData.reduce((sum, record) => sum + (record.stats.total || 0), 0);
            data.push(dayTotal);
        }
        
        this.charts.monthly.data.labels = labels;
        this.charts.monthly.data.datasets[0].data = data;
        this.charts.monthly.update('none');
    },
    
    // トレンドグラフ更新
    updateTrendChart(history) {
        if (!this.charts.trend) return;
        
        const recentHistory = history.slice(0, 20).reverse(); // 最新20件を時系列順に
        const labels = [];
        const data = [];
        
        recentHistory.forEach((record, index) => {
            const date = new Date(record.date);
            labels.push(`${date.getMonth() + 1}/${date.getDate()}`);
            
            const accuracy = parseInt(record.stats.percentage) || 0;
            data.push(accuracy);
        });
        
        this.charts.trend.data.labels = labels;
        this.charts.trend.data.datasets[0].data = data;
        this.charts.trend.update('none');
    },
    
    // 統計データ計算
    calculateStats(history) {
        const stats = {
            totalQuestions: 0,
            totalCorrect: 0,
            totalWrong: 0,
            totalTime: 0,
            studyDays: new Set(),
            averageAccuracy: 0,
            bestAccuracy: 0,
            worstAccuracy: 100,
            subjects: {},
            weeklyTrend: [],
            monthlyTrend: []
        };
        
        history.forEach(record => {
            stats.totalQuestions += record.stats.total || 0;
            stats.totalCorrect += record.stats.correct || 0;
            stats.totalWrong += record.stats.wrong || 0;
            stats.totalTime += record.studyTime || 0;
            
            const date = new Date(record.date);
            stats.studyDays.add(date.toDateString());
            
            const accuracy = parseInt(record.stats.percentage) || 0;
            if (accuracy > stats.bestAccuracy) stats.bestAccuracy = accuracy;
            if (accuracy < stats.worstAccuracy && accuracy > 0) stats.worstAccuracy = accuracy;
            
            // 科目別統計
            if (record.subject) {
                if (!stats.subjects[record.subject]) {
                    stats.subjects[record.subject] = {
                        total: 0,
                        correct: 0,
                        sessions: 0,
                        timeSpent: 0
                    };
                }
                stats.subjects[record.subject].total += record.stats.total || 0;
                stats.subjects[record.subject].correct += record.stats.correct || 0;
                stats.subjects[record.subject].sessions++;
                stats.subjects[record.subject].timeSpent += record.studyTime || 0;
            }
        });
        
        stats.averageAccuracy = stats.totalQuestions > 0 ? 
            Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;
        
        stats.studyDays = stats.studyDays.size;
        
        return stats;
    },
    
    // パフォーマンスメトリクス生成
    generatePerformanceReport() {
        const history = StorageModule.getHistory();
        const stats = this.calculateStats(history);
        
        const report = {
            overview: {
                totalSessions: history.length,
                totalQuestions: stats.totalQuestions,
                averageAccuracy: stats.averageAccuracy,
                totalStudyTime: stats.totalTime,
                studyDays: stats.studyDays
            },
            performance: {
                bestDay: this.findBestPerformanceDay(history),
                improvementTrend: this.calculateImprovementTrend(history),
                consistencyScore: this.calculateConsistencyScore(history),
                weeklyGoalProgress: this.calculateWeeklyProgress(history)
            },
            subjects: this.analyzeSubjectPerformance(stats.subjects),
            recommendations: this.generateRecommendations(stats)
        };
        
        return report;
    },
    
    // 最高パフォーマンスの日を特定
    findBestPerformanceDay(history) {
        let bestDay = null;
        let bestScore = 0;
        
        history.forEach(record => {
            const accuracy = parseInt(record.stats.percentage) || 0;
            const volume = record.stats.total || 0;
            const score = accuracy * (volume / 10); // 正答率 × 問題数重み
            
            if (score > bestScore) {
                bestScore = score;
                bestDay = {
                    date: record.date,
                    accuracy: accuracy,
                    questions: volume,
                    subject: record.subject,
                    score: Math.round(score)
                };
            }
        });
        
        return bestDay;
    },
    
    // 改善トレンド計算
    calculateImprovementTrend(history) {
        if (history.length < 5) return { trend: 'insufficient_data', change: 0 };
        
        const recent = history.slice(0, 5); // 最新5件
        const older = history.slice(5, 10); // その前の5件
        
        const recentAvg = recent.reduce((sum, r) => sum + (parseInt(r.stats.percentage) || 0), 0) / recent.length;
        const olderAvg = older.reduce((sum, r) => sum + (parseInt(r.stats.percentage) || 0), 0) / older.length;
        
        const change = recentAvg - olderAvg;
        
        return {
            trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
            change: Math.round(change),
            recentAverage: Math.round(recentAvg),
            previousAverage: Math.round(olderAvg)
        };
    },
    
    // 学習一貫性スコア計算
    calculateConsistencyScore(history) {
        if (history.length < 7) return 0;
        
        const last7Days = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dayRecords = history.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.toDateString() === date.toDateString();
            });
            
            last7Days.push(dayRecords.length > 0);
        }
        
        const studiedDays = last7Days.filter(Boolean).length;
        return Math.round((studiedDays / 7) * 100);
    },
    
    // 週間目標進捗計算
    calculateWeeklyProgress(history) {
        const weeklyGoal = 500; // 週500問の目標
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);
        
        const thisWeekRecords = history.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate >= weekStart;
        });
        
        const weeklyTotal = thisWeekRecords.reduce((sum, record) => sum + (record.stats.total || 0), 0);
        const progress = Math.round((weeklyTotal / weeklyGoal) * 100);
        
        return {
            current: weeklyTotal,
            goal: weeklyGoal,
            progress: Math.min(progress, 100),
            remaining: Math.max(weeklyGoal - weeklyTotal, 0),
            daysLeft: 7 - today.getDay()
        };
    },
    
    // 科目別パフォーマンス分析
    analyzeSubjectPerformance(subjects) {
        const subjectNames = {
            minpou: '民法',
            gyousei: '行政法',
            kenpou: '憲法',
            shouhou: '商法',
            kiso: '基礎法学',
            ippan: '一般知識'
        };
        
        const analysis = Object.keys(subjects).map(key => {
            const data = subjects[key];
            const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
            
            return {
                subject: key,
                name: subjectNames[key],
                accuracy: accuracy,
                totalQuestions: data.total,
                sessions: data.sessions,
                averageQuestionsPerSession: data.sessions > 0 ? Math.round(data.total / data.sessions) : 0,
                timeSpent: data.timeSpent,
                efficiency: data.timeSpent > 0 ? Math.round(data.total / (data.timeSpent / 60)) : 0 // 問/分
            };
        }).sort((a, b) => b.accuracy - a.accuracy);
        
        return analysis;
    },
    
    // 推奨事項生成
    generateRecommendations(stats) {
        const recommendations = [];
        
        // 正答率が低い科目への推奨
        const weakSubjects = Object.keys(stats.subjects).filter(key => {
            const data = stats.subjects[key];
            const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
            return accuracy < 70 && data.total > 10;
        });
        
        if (weakSubjects.length > 0) {
            recommendations.push({
                type: 'weak_subject',
                priority: 'high',
                message: `${weakSubjects.length}科目で正答率70%未満です。重点的に学習しましょう。`,
                subjects: weakSubjects
            });
        }
        
        // 学習頻度への推奨
        if (stats.studyDays < 5) {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                message: '学習の継続性を高めましょう。毎日少しずつでも学習することが重要です。'
            });
        }
        
        // 学習量への推奨
        const avgQuestionsPerDay = stats.studyDays > 0 ? stats.totalQuestions / stats.studyDays : 0;
        if (avgQuestionsPerDay < 50) {
            recommendations.push({
                type: 'volume',
                priority: 'medium',
                message: '1日あたりの学習量を増やすことを検討してください。目標：50問/日'
            });
        }
        
        return recommendations;
    },
    
    // チャート破棄
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) {
                chart.destroy();
            }
        });
        this.charts = {};
    }
};

// ===== グローバル関数（後方互換性） =====
function updateCharts() {
    ChartsModule.updateCharts();
}

// ===== 初期化 =====
document.addEventListener('DOMContentLoaded', function() {
    // Chart.jsが読み込まれてから初期化
    if (typeof Chart !== 'undefined') {
        ChartsModule.initialize();
    } else {
        console.warn('📊 Chart.jsが読み込まれていません');
    }
});
