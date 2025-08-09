// ===== AI分析・アナリティクスモジュール =====
const AnalyticsModule = {
    
    // 機械学習モデル設定
    models: {
        prediction: {
            weights: {
                recentAccuracy: 0.4,
                trendSlope: 0.3,
                consistency: 0.2,
                volume: 0.1
            }
        },
        difficulty: {
            thresholds: {
                easy: 85,
                medium: 70,
                hard: 55
            }
        }
    },
    
    // 学習パターン分析
    analyzeStudyPatterns() {
        const history = StorageModule.getHistory();
        
        const patterns = {
            timeOfDay: this.analyzeBestTimeOfDay(history),
            sessionLength: this.analyzeOptimalSessionLength(history),
            weeklyPattern: this.analyzeWeeklyPattern(history),
            subjectRotation: this.analyzeSubjectRotation(history),
            difficultyProgression: this.analyzeDifficultyProgression(history),
            learningVelocity: this.calculateLearningVelocity(history)
        };
        
        console.log('🤖 学習パターン分析完了:', patterns);
        return patterns;
    },
    
    // 最適学習時間帯分析
    analyzeBestTimeOfDay(history) {
        const timeSlots = {
            morning: { total: 0, correct: 0, sessions: 0 },    // 6-12
            afternoon: { total: 0, correct: 0, sessions: 0 },  // 12-18
            evening: { total: 0, correct: 0, sessions: 0 },    // 18-24
            night: { total: 0, correct: 0, sessions: 0 }       // 0-6
        };
        
        history.forEach(record => {
            const hour = new Date(record.date).getHours();
            let slot;
            
            if (hour >= 6 && hour < 12) slot = 'morning';
            else if (hour >= 12 && hour < 18) slot = 'afternoon';
            else if (hour >= 18 && hour < 24) slot = 'evening';
            else slot = 'night';
            
            timeSlots[slot].total += record.stats.total || 0;
            timeSlots[slot].correct += record.stats.correct || 0;
            timeSlots[slot].sessions++;
        });
        
        // 各時間帯のパフォーマンス計算
        const timeAnalysis = Object.keys(timeSlots).map(slot => {
            const data = timeSlots[slot];
            return {
                timeSlot: slot,
                accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
                sessions: data.sessions,
                totalQuestions: data.total,
                efficiency: data.sessions > 0 ? Math.round(data.total / data.sessions) : 0
            };
        }).sort((a, b) => b.accuracy - a.accuracy);
        
        return {
            bestTime: timeAnalysis[0],
            worstTime: timeAnalysis[timeAnalysis.length - 1],
            allSlots: timeAnalysis,
            recommendation: this.generateTimeRecommendation(timeAnalysis[0])
        };
    },
    
    // 最適セッション長分析
    analyzeOptimalSessionLength(history) {
        const sessionGroups = {
            short: { records: [], total: 0, correct: 0 },      // 0-30分
            medium: { records: [], total: 0, correct: 0 },     // 30-60分
            long: { records: [], total: 0, correct: 0 },       // 60分以上
        };
        
        history.forEach(record => {
            const minutes = (record.studyTime || 0) / 60;
            let group;
            
            if (minutes <= 30) group = 'short';
            else if (minutes <= 60) group = 'medium';
            else group = 'long';
            
            sessionGroups[group].records.push(record);
            sessionGroups[group].total += record.stats.total || 0;
            sessionGroups[group].correct += record.stats.correct || 0;
        });
        
        const sessionAnalysis = Object.keys(sessionGroups).map(group => {
            const data = sessionGroups[group];
            return {
                duration: group,
                sessions: data.records.length,
                accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
                avgQuestionsPerSession: data.sessions > 0 ? Math.round(data.total / data.sessions) : 0,
                totalQuestions: data.total
            };
        }).sort((a, b) => b.accuracy - a.accuracy);
        
        return {
            optimal: sessionAnalysis[0],
            analysis: sessionAnalysis,
            recommendation: this.generateSessionLengthRecommendation(sessionAnalysis[0])
        };
    },
    
    // 週間学習パターン分析
    analyzeWeeklyPattern(history) {
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        const weeklyData = Array(7).fill(null).map((_, i) => ({
            day: weekdays[i],
            dayIndex: i,
            total: 0,
            correct: 0,
            sessions: 0,
            accuracy: 0
        }));
        
        history.forEach(record => {
            const dayIndex = new Date(record.date).getDay();
            weeklyData[dayIndex].total += record.stats.total || 0;
            weeklyData[dayIndex].correct += record.stats.correct || 0;
            weeklyData[dayIndex].sessions++;
        });
        
        weeklyData.forEach(day => {
            day.accuracy = day.total > 0 ? Math.round((day.correct / day.total) * 100) : 0;
        });
        
        const bestDay = weeklyData.reduce((best, current) => 
            current.accuracy > best.accuracy ? current : best
        );
        
        const mostActiveDay = weeklyData.reduce((most, current) => 
            current.sessions > most.sessions ? current : most
        );
        
        return {
            weeklyData: weeklyData,
            bestPerformanceDay: bestDay,
            mostActiveDay: mostActiveDay,
            weekendVsWeekday: this.compareWeekendVsWeekday(weeklyData)
        };
    },
    
    // 平日vs週末比較
    compareWeekendVsWeekday(weeklyData) {
        const weekdays = weeklyData.slice(1, 6); // 月-金
        const weekend = [weeklyData[0], weeklyData[6]]; // 日、土
        
        const weekdayStats = this.calculateGroupStats(weekdays);
        const weekendStats = this.calculateGroupStats(weekend);
        
        return {
            weekday: weekdayStats,
            weekend: weekendStats,
            preference: weekdayStats.accuracy > weekendStats.accuracy ? 'weekday' : 'weekend'
        };
    },
    
    // グループ統計計算
    calculateGroupStats(group) {
        const totalQuestions = group.reduce((sum, day) => sum + day.total, 0);
        const totalCorrect = group.reduce((sum, day) => sum + day.correct, 0);
        const totalSessions = group.reduce((sum, day) => sum + day.sessions, 0);
        
        return {
            accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
            sessions: totalSessions,
            questionsPerSession: totalSessions > 0 ? Math.round(totalQuestions / totalSessions) : 0
        };
    },
    
    // 科目ローテーション分析
    analyzeSubjectRotation(history) {
        const transitions = [];
        
        for (let i = 1; i < history.length; i++) {
            const current = history[i-1].subject;
            const next = history[i].subject;
            
            if (current && next && current !== next) {
                transitions.push({ from: current, to: next });
            }
        }
        
        // 最も効果的な科目切り替えパターンを分析
        const transitionEffects = {};
        transitions.forEach(transition => {
            const key = `${transition.from}->${transition.to}`;
            if (!transitionEffects[key]) {
                transitionEffects[key] = { count: 0, accuracySum: 0 };
            }
            transitionEffects[key].count++;
        });
        
        return {
            totalTransitions: transitions.length,
            mostCommonTransition: this.findMostCommonTransition(transitions),
            recommendation: transitions.length < 5 ? 
                'より多様な科目を学習することを推奨します' : 
                '良いバランスで科目を切り替えています'
        };
    },
    
    // 最も一般的な科目切り替えを特定
    findMostCommonTransition(transitions) {
        const counts = {};
        
        transitions.forEach(t => {
            const key = `${t.from}->${t.to}`;
            counts[key] = (counts[key] || 0) + 1;
        });
        
        const maxCount = Math.max(...Object.values(counts));
        const mostCommon = Object.keys(counts).find(key => counts[key] === maxCount);
        
        return { pattern: mostCommon, count: maxCount };
    },
    
    // 難易度進行分析
    analyzeDifficultyProgression(history) {
        const recentHistory = history.slice(0, 10); // 最新10セッション
        const accuracyTrend = recentHistory.map(record => parseInt(record.stats.percentage) || 0);
        
        // 線形回帰で傾向を計算
        const slope = this.calculateLinearRegressionSlope(accuracyTrend);
        
        let difficultyRecommendation;
        if (slope > 2) {
            difficultyRecommendation = 'higher'; // より難しい問題に挑戦
        } else if (slope < -2) {
            difficultyRecommendation = 'maintain'; // 現在のレベルを維持
        } else {
            difficultyRecommendation = 'review'; // 復習中心
        }
        
        return {
            trend: slope > 2 ? 'improving' : slope < -2 ? 'declining' : 'stable',
            slope: Math.round(slope * 100) / 100,
            currentLevel: this.assessCurrentDifficultyLevel(accuracyTrend),
            recommendation: difficultyRecommendation
        };
    },
    
    // 学習速度計算
    calculateLearningVelocity(history) {
        if (history.length < 5) return { status: 'insufficient_data' };
        
        const recentSessions = history.slice(0, 10);
        const velocityMetrics = recentSessions.map(record => {
            const timeInMinutes = (record.studyTime || 0) / 60;
            return timeInMinutes > 0 ? (record.stats.total || 0) / timeInMinutes : 0;
        });
        
        const averageVelocity = velocityMetrics.reduce((a, b) => a + b, 0) / velocityMetrics.length;
        
        return {
            questionsPerMinute: Math.round(averageVelocity * 100) / 100,
            efficiency: this.categorizeEfficiency(averageVelocity),
            trend: this.calculateVelocityTrend(velocityMetrics)
        };
    },
    
    // 効率性分類
    categorizeEfficiency(velocity) {
        if (velocity > 2.0) return 'excellent';
        if (velocity > 1.5) return 'good';
        if (velocity > 1.0) return 'average';
        return 'needs_improvement';
    },
    
    // 速度トレンド計算
    calculateVelocityTrend(velocities) {
        if (velocities.length < 3) return 'stable';
        
        const recent = velocities.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const older = velocities.slice(3, 6).reduce((a, b) => a + b, 0) / 3;
        
        const change = recent - older;
        return change > 0.2 ? 'accelerating' : change < -0.2 ? 'slowing' : 'stable';
    },
    
    // 線形回帰の傾き計算
    calculateLinearRegressionSlope(data) {
        const n = data.length;
        if (n < 2) return 0;
        
        const x = Array.from({length: n}, (_, i) => i);
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = data.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * data[i], 0);
        const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    },
    
    // 現在の難易度レベル評価
    assessCurrentDifficultyLevel(accuracyData) {
        const avgAccuracy = accuracyData.reduce((a, b) => a + b, 0) / accuracyData.length;
        
        if (avgAccuracy >= 85) return 'easy';
        if (avgAccuracy >= 70) return 'medium';
        return 'hard';
    },
    
    // AI予測システム
    generateAIPrediction() {
        const history = StorageModule.getHistory();
        if (history.length < 5) {
            return {
                probability: 0,
                confidence: 'low',
                daysNeeded: 180,
                weakestSubject: '未測定',
                recommendation: '更多くのデータが必要です'
            };
        }
        
        const patterns = this.analyzeStudyPatterns();
        const prediction = this.calculatePassProbability(history, patterns);
        
        return {
            probability: Math.round(prediction.probability),
            confidence: prediction.confidence,
            daysNeeded: prediction.daysNeeded,
            weakestSubject: prediction.weakestSubject,
            recommendation: this.generateStudyRecommendation(prediction, patterns),
            nextMilestone: this.calculateNextMilestone(history)
        };
    },
    
    // 合格可能性計算（機械学習風）
    calculatePassProbability(history, patterns) {
        const weights = this.models.prediction.weights;
        
        // 特徴量抽出
        const recentAccuracy = this.getRecentAccuracy(history, 10);
        const trendSlope = this.calculateAccuracyTrend(history);
        const consistency = this.calculateConsistencyScore(history);
        const volume = this.calculateVolumeScore(history);
        
        // 重み付き合計で予測確率計算
        const rawScore = 
            (recentAccuracy * weights.recentAccuracy) +
            (trendSlope * weights.trendSlope) +
            (consistency * weights.consistency) +
            (volume * weights.volume);
        
        // 0-100%の範囲に正規化
        const probability = Math.max(0, Math.min(100, rawScore));
        
        // 信頼度計算
        const confidence = this.calculatePredictionConfidence(history.length, patterns);
        
        // 必要日数計算
        const daysNeeded = this.calculateDaysToTarget(rawScore, 80); // 80%を目標
        
        // 最弱科目特定
        const weakestSubject = this.identifyWeakestSubject(history);
        
        return {
            probability,
            confidence,
            daysNeeded,
            weakestSubject
        };
    },
    
    // 最近の正答率取得
    getRecentAccuracy(history, count) {
        const recent = history.slice(0, count);
        if (recent.length === 0) return 0;
        
        const totalQuestions = recent.reduce((sum, r) => sum + (r.stats.total || 0), 0);
        const totalCorrect = recent.reduce((sum, r) => sum + (r.stats.correct || 0), 0);
        
        return totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
    },
    
    // 正答率トレンド計算
    calculateAccuracyTrend(history) {
        const accuracies = history.slice(0, 15).map(r => parseInt(r.stats.percentage) || 0);
        if (accuracies.length < 3) return 50; // デフォルト値
        
        const slope = this.calculateLinearRegressionSlope(accuracies);
        return Math.max(0, Math.min(100, 50 + slope * 10)); // -5〜+5の傾きを0-100にスケール
    },
    
    // 一貫性スコア計算
    calculateConsistencyScore(history) {
        const last14Days = this.getStudyDaysInLast14Days(history);
        return (last14Days / 14) * 100;
    },
    
    // 学習量スコア計算
    calculateVolumeScore(history) {
        const totalQuestions = history.reduce((sum, r) => sum + (r.stats.total || 0), 0);
        const days = history.length;
        const avgPerDay = days > 0 ? totalQuestions / days : 0;
        
        // 1日50問を100点として計算
        return Math.min(100, (avgPerDay / 50) * 100);
    },
    
    // 予測信頼度計算
    calculatePredictionConfidence(dataPoints, patterns) {
        if (dataPoints < 10) return 'low';
        if (dataPoints < 30) return 'medium';
        return 'high';
    },
    
    // 目標達成までの日数計算
    calculateDaysToTarget(currentScore, targetScore) {
        if (currentScore >= targetScore) return 0;
        
        const deficit = targetScore - currentScore;
        const improvementRate = 0.5; // 1日あたり0.5%向上と仮定
        
        return Math.ceil(deficit / improvementRate);
    },
    
    // 最弱科目特定
    identifyWeakestSubject(history) {
        const subjects = {};
        const subjectNames = {
            minpou: '民法',
            gyousei: '行政法',
            kenpou: '憲法',
            shouhou: '商法',
            kiso: '基礎法学',
            ippan: '一般知識'
        };
        
        history.forEach(record => {
            if (record.subject) {
                if (!subjects[record.subject]) {
                    subjects[record.subject] = { total: 0, correct: 0 };
                }
                subjects[record.subject].total += record.stats.total || 0;
                subjects[record.subject].correct += record.stats.correct || 0;
            }
        });
        
        let weakestSubject = '未測定';
        let lowestAccuracy = 100;
        
        Object.keys(subjects).forEach(subject => {
            const data = subjects[subject];
            if (data.total >= 10) { // 最低10問以上のデータがある科目のみ
                const accuracy = (data.correct / data.total) * 100;
                if (accuracy < lowestAccuracy) {
                    lowestAccuracy = accuracy;
                    weakestSubject = subjectNames[subject] || subject;
                }
            }
        });
        
        return weakestSubject;
    },
    
    // 過去14日の学習日数取得
    getStudyDaysInLast14Days(history) {
        const today = new Date();
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);
        
        const studyDays = new Set();
        history.forEach(record => {
            const recordDate = new Date(record.date);
            if (recordDate >= twoWeeksAgo) {
                studyDays.add(recordDate.toDateString());
            }
        });
        
        return studyDays.size;
    },
    
    // 学習推奨生成
    generateStudyRecommendation(prediction, patterns) {
        const recommendations = [];
        
        if (prediction.probability < 60) {
            recommendations.push('基礎力強化が必要です。間違えた問題の復習を重点的に行いましょう。');
        }
        
        if (patterns.timeOfDay.bestTime.accuracy > 80) {
            recommendations.push(`${patterns.timeOfDay.bestTime.timeSlot}の時間帯での学習が効果的です。`);
        }
        
        if (patterns.sessionLength.optimal.accuracy > 75) {
            recommendations.push(`${patterns.sessionLength.optimal.duration}時間の学習セッションが最適です。`);
        }
        
        return recommendations.length > 0 ? recommendations.join(' ') : '継続的な学習を心がけましょう。';
    },
    
    // 次のマイルストーン計算
    calculateNextMilestone(history) {
        const currentAccuracy = this.getRecentAccuracy(history, 5);
        
        const milestones = [
            { threshold: 60, label: '基礎レベル達成' },
            { threshold: 70, label: '中級レベル達成' },
            { threshold: 80, label: '上級レベル達成' },
            { threshold: 90, label: 'マスターレベル達成' }
        ];
        
        const nextMilestone = milestones.find(m => m.threshold > currentAccuracy);
        
        if (nextMilestone) {
            const questionsNeeded = Math.ceil((nextMilestone.threshold - currentAccuracy) * 10);
            return {
                label: nextMilestone.label,
                targetAccuracy: nextMilestone.threshold,
                currentAccuracy: Math.round(currentAccuracy),
                questionsNeeded: questionsNeeded
            };
        }
        
        return {
            label: '全マイルストーン達成済み',
            targetAccuracy: 100,
            currentAccuracy: Math.round(currentAccuracy),
            questionsNeeded: 0
        };
    },
    
    // バッジ更新
    updateBadges() {
        const history = StorageModule.getHistory();
        const badges = this.calculateBadges(history);
        
        Object.keys(badges).forEach(badgeId => {
            const element = document.getElementById(badgeId);
            if (element && badges[badgeId]) {
                element.classList.add('earned');
            }
        });
    },
    
    // バッジ計算
    calculateBadges(history) {
        let totalQuestions = 0;
        let maxAccuracy = 0;
        let consecutiveDays = this.calculateConsecutiveDays(history);
        let allSubjects = new Set();
        
        history.forEach(record => {
            totalQuestions += record.stats.total || 0;
            const accuracy = parseInt(record.stats.percentage) || 0;
            if (accuracy > maxAccuracy) maxAccuracy = accuracy;
            if (record.subject) allSubjects.add(record.subject);
        });
        
        return {
            badge1: history.length > 0,
            badge2: totalQuestions >= 100,
            badge3: consecutiveDays >= 7,
            badge4: maxAccuracy >= 90,
            badge5: totalQuestions >= 1000,
            badge6: allSubjects.size >= 6,
            badge7: consecutiveDays >= 30,
            badge8: totalQuestions >= 5000 && maxAccuracy >= 95
        };
    },
    
    // 連続学習日数計算
    calculateConsecutiveDays(history) {
        if (history.length === 0) return 0;
        
        const studyDates = [...new Set(history.map(record => 
            new Date(record.date).toDateString()
        ))].sort((a, b) => new Date(b) - new Date(a));
        
        let consecutive = 1;
        const today = new Date().toDateString();
        
        // 今日から逆順にチェック
        for (let i = 1; i < studyDates.length; i++) {
            const current = new Date(studyDates[i-1]);
            const next = new Date(studyDates[i]);
            const diffDays = Math.floor((current - next) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
                consecutive++;
            } else {
                break;
            }
        }
        
        return consecutive;
    },
    
    // 時間推奨生成
    generateTimeRecommendation(bestTime) {
        const timeNames = {
            morning: '朝（6-12時）',
            afternoon: '午後（12-18時）',
            evening: '夕方（18-24時）',
            night: '夜間（0-6時）'
        };
        
        return `${timeNames[bestTime.timeSlot]}の学習が最も効果的です（正答率${bestTime.accuracy}%）`;
    },
    
    // セッション長推奨生成
    generateSessionLengthRecommendation(optimalSession) {
        const durationNames = {
            short: '短時間（30分以下）',
            medium: '中時間（30-60分）',
            long: '長時間（60分以上）'
        };
        
        return `${durationNames[optimalSession.duration]}のセッションが最適です（正答率${optimalSession.accuracy}%）`;
    },
    
    // 進捗画面更新
    updateProgressScreen() {
        const history = StorageModule.getHistory();
        const stats = this.calculateOverallStats(history);
        
        Utils.updateElement('totalTimeDisplay', `${Math.floor(stats.totalTime / 3600)}h`);
        Utils.updateElement('totalQuestionsDisplay', stats.totalQuestions);
        Utils.updateElement('averageAccuracyDisplay', `${stats.avgAccuracy}%`);
        
        const progressBar = document.getElementById('accuracyProgress');
        if (progressBar) {
            progressBar.style.width = `${stats.avgAccuracy}%`;
        }
        
        this.updateSubjectProgress(history);
    },
    
    // 科目別進捗更新
    updateSubjectProgress(history) {
        const subjects = {
            minpou: '民法',
            gyousei: '行政法',
            kenpou: '憲法',
            shouhou: '商法',
            kiso: '基礎法学',
            ippan: '一般知識'
        };
        
        const subjectData = this.calculateSubjectStats(history);
        const progressList = document.getElementById('subjectProgressList');
        
        if (progressList) {
            progressList.innerHTML = Object.keys(subjects).map(key => {
                const data = subjectData[key] || { total: 0, correct: 0 };
                const accuracy = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                
                return `
                    <div style="margin-bottom: 15px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span style="font-weight: bold;">${subjects[key]}</span>
                            <span>${accuracy}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${accuracy}%;"></div>
                        </div>
                        <div style="font-size: 12px; color: #999; margin-top: 5px;">
                            ${data.total}問解答 | ${data.correct}問正解
                        </div>
                    </div>
                `;
            }).join('');
        }
    },
    
    // 全体統計計算
    calculateOverallStats(history) {
        let totalTime = 0;
        let totalQuestions = 0;
        let totalCorrect = 0;
        
        history.forEach(record => {
            totalTime += record.studyTime || 0;
            totalQuestions += record.stats.total || 0;
            totalCorrect += record.stats.correct || 0;
        });
        
        return {
            totalTime,
            totalQuestions,
            totalCorrect,
            avgAccuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
        };
    },
    
    // 科目別統計計算
    calculateSubjectStats(history) {
        const subjectData = {};
        
        history.forEach(record => {
            if (record.subject) {
                if (!subjectData[record.subject]) {
                    subjectData[record.subject] = { total: 0, correct: 0 };
                }
                subjectData[record.subject].total += record.stats.total || 0;
                subjectData[record.subject].correct += record.stats.correct || 0;
            }
        });
        
        return subjectData;
    },
    
    // 分析画面更新
    updateAnalysisScreen() {
        const history = StorageModule.getHistory();
        this.updateWeaknessAnalysis(history);
    },
    
    // 弱点分析更新
    updateWeaknessAnalysis(history) {
        const subjectData = this.calculateSubjectStats(history);
        const subjects = {
            minpou: '民法',
            gyousei: '行政法',
            kenpou: '憲法',
            shouhou: '商法',
            kiso: '基礎法学',
            ippan: '一般知識'
        };
        
        const weaknesses = Object.keys(subjectData)
            .map(key => ({
                name: subjects[key],
                accuracy: subjectData[key].total > 0 ? 
                    Math.round((subjectData[key].correct / subjectData[key].total) * 100) : 0,
                wrong: subjectData[key].total - subjectData[key].correct
            }))
            .filter(item => item.accuracy < 70 && item.wrong > 0)
            .sort((a, b) => a.accuracy - b.accuracy);
        
        const weaknessDiv = document.getElementById('weaknessAnalysis');
        if (weaknessDiv) {
            if (weaknesses.length > 0) {
                weaknessDiv.innerHTML = weaknesses.map(item => `
                    <div style="padding: 10px; background: #ffebee; border-radius: 8px; margin-bottom: 10px;">
                        <div style="font-weight: bold; color: #f44336;">${item.name}</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">
                            正答率: ${item.accuracy}% | 間違い: ${item.wrong}問
                        </div>
                    </div>
                `).join('');
            } else {
                weaknessDiv.innerHTML = '<p style="text-align: center; color: #999;">弱点科目はありません</p>';
            }
        }
    },
    
    // 実績画面更新
    updateAchievementScreen() {
        const history = StorageModule.getHistory();
        const stats = this.calculateAchievementStats(history);
        
        const statsDiv = document.getElementById('achievementStats');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: #666;">総解答数</div>
                        <div style="font-size: 24px; font-weight: bold;">${stats.totalQuestions}問</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">学習日数</div>
                        <div style="font-size: 24px; font-weight: bold;">${stats.studyDays}日</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">最高正答率</div>
                        <div style="font-size: 24px; font-weight: bold;">${stats.maxAccuracy}%</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: #666;">学習科目数</div>
                        <div style="font-size: 24px; font-weight: bold;">${stats.subjectCount}/6</div>
                    </div>
                </div>
            `;
        }
    },
    
    // 実績統計計算
    calculateAchievementStats(history) {
        let totalQuestions = 0;
        let maxAccuracy = 0;
        let studyDays = new Set();
        let allSubjects = new Set();
        
        history.forEach(record => {
            totalQuestions += record.stats.total || 0;
            const accuracy = parseInt(record.stats.percentage) || 0;
            if (accuracy > maxAccuracy) maxAccuracy = accuracy;
            
            const date = new Date(record.date).toDateString();
            studyDays.add(date);
            
            if (record.subject) allSubjects.add(record.subject);
        });
        
        return {
            totalQuestions,
            maxAccuracy,
            studyDays: studyDays.size,
            subjectCount: allSubjects.size
        };
    }
};

// ===== グローバル関数（後方互換性） =====
function updateBadges() {
    AnalyticsModule.updateBadges();
}

function updateProgressScreen() {
    AnalyticsModule.updateProgressScreen();
}

function updateAnalysisScreen() {
    AnalyticsModule.updateAnalysisScreen();
}

function updateAchievementScreen() {
    AnalyticsModule.updateAchievementScreen();
}

// ===== 初期化 =====
console.log('🤖 AI分析モジュール読み込み完了');
