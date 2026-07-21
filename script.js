// 遊戲狀態管理
let gameState = {
    playerA: { name: '', model: '', strategy: '', wins: 0 },
    playerB: { name: '', model: '', strategy: '', wins: 0 },
    currentRound: 1,
    rounds: [],
    gameHistory: [],
    responseA: null,
    responseB: null,
    gameMode: { wins: 3, total: 5, name: '五戰三勝' } // 默認五戰三勝
};

// 模型網址配置
const modelUrls = {
    claude: 'https://claude.ai/',
    chatgpt: 'https://chatgpt.com/',
    gemini: 'https://gemini.google.com/',
    deepseek: 'https://chat.deepseek.com/',
    perplexity: 'https://www.perplexity.ai/',
    other: '#'
};

// 比賽制度配置
const gameModes = {
    1: { wins: 1, total: 1, name: '一戰決勝負' },
    2: { wins: 2, total: 3, name: '三戰兩勝' },
    3: { wins: 3, total: 5, name: '五戰三勝' },
    4: { wins: 4, total: 7, name: '七戰四勝' },
    5: { wins: 5, total: 9, name: '九戰五勝' }
};

// 初始化遊戲
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('start-game-btn').addEventListener('click', startNewGame);
    document.getElementById('next-round-btn').addEventListener('click', nextRound);
    document.getElementById('new-game-btn').addEventListener('click', resetGame);
    document.getElementById('view-history-btn').addEventListener('click', showHistory);
    document.getElementById('back-to-game-btn').addEventListener('click', backToGame);
    
    // 初始化模型連結
    updateModelLink('A');
    updateModelLink('B');
    
    loadGameHistory();
});

// 開始新遊戲
function startNewGame() {
    // 獲取比賽制度設定
    const selectedMode = document.getElementById('game-mode').value;
    gameState.gameMode = gameModes[selectedMode];
    
    // 獲取玩家設定
    gameState.playerA = {
        name: '玩家A',
        model: document.getElementById('playerA-model').value,
        strategy: document.getElementById('playerA-strategy').value || '基本策略',
        wins: 0
    };
    
    gameState.playerB = {
        name: '玩家B',
        model: document.getElementById('playerB-model').value,
        strategy: document.getElementById('playerB-strategy').value || '基本策略',
        wins: 0
    };
    
    // 重置遊戲狀態
    gameState.currentRound = 1;
    gameState.rounds = [];
    gameState.responseA = null;
    gameState.responseB = null;
    
    // 更新UI
    updateScoreboard();
    updateDisplayNames();
    
    // 切換到對戰界面
    showSection('battle-section');
    
    // 生成第一回合的prompt
    generatePrompts();
}

// 更新顯示名稱
function updateDisplayNames() {
    document.getElementById('playerA-display-name').textContent = gameState.playerA.name;
    document.getElementById('playerB-display-name').textContent = gameState.playerB.name;
    document.getElementById('promptA-title').textContent = `🤖 ${gameState.playerA.name} Prompt`;
    document.getElementById('promptB-title').textContent = `🤖 ${gameState.playerB.name} Prompt`;
    document.getElementById('resultA-name').textContent = gameState.playerA.name;
    document.getElementById('resultB-name').textContent = gameState.playerB.name;
}

// 更新比分板
function updateScoreboard() {
    document.getElementById('scoreA').textContent = gameState.playerA.wins;
    document.getElementById('scoreB').textContent = gameState.playerB.wins;
    document.getElementById('current-round').textContent = gameState.currentRound;
}

// 生成AI提示詞
function generatePrompts() {
    const promptA = generateAIPrompt(gameState.playerA, gameState.playerB, gameState.rounds);
    const promptB = generateAIPrompt(gameState.playerB, gameState.playerA, gameState.rounds);
    
    document.getElementById('promptA-content').textContent = promptA;
    document.getElementById('promptB-content').textContent = promptB;
    
    // 清空之前的回應
    document.getElementById('responseA').value = '';
    document.getElementById('responseB').value = '';
    gameState.responseA = null;
    gameState.responseB = null;
    
    // 隱藏結果區域
    document.getElementById('round-result').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
}

// 生成AI提示詞的核心函數
function generateAIPrompt(player, opponent, gameHistory) {
    const historyText = formatGameHistory(gameHistory);
    const opponentAnalysis = analyzeOpponentPattern(gameHistory, opponent.name);
    
    // 確保 gameMode 存在，如果不存在則使用默認值
    const currentGameMode = gameState.gameMode || { wins: 3, total: 5, name: '五戰三勝' };
    
    return `你是 ${player.name}，使用 ${player.model} 模型，採用 ${player.strategy}。

🎮 遊戲狀況：
- 對手：${opponent.name} (${opponent.model}，${opponent.strategy})
- 比賽制度：${currentGameMode.name}
- 目前比分：你 ${player.wins} : ${opponent.wins} 對手
- 當前：第 ${gameState.currentRound} 回合

📊 歷史對戰記錄：
${historyText}

🧠 對手出招分析：
${opponentAnalysis}

🎯 策略建議：
- 分析對手的出招模式和習慣
- 考慮心理戰術和反預測
- 根據比分情況調整策略（領先時保守，落後時進攻）
- 避免自己的出招過於規律

請仔細分析局勢並做出最佳選擇。

回應格式（必須是有效的JSON）：
{
  "choice": "rock",
  "reason": "詳細說明你的分析過程和選擇理由，包括對對手策略的判斷和你的應對思路"
}

可選擇：rock（石頭）、paper（布）、scissors（剪刀）`;
}

// 格式化遊戲歷史
function formatGameHistory(rounds) {
    if (rounds.length === 0) {
        return "這是第一回合，暫無歷史記錄。";
    }
    
    let history = "";
    rounds.forEach((round, index) => {
        history += `第${index + 1}回合：${round.playerA.name}出${getChoiceEmoji(round.playerA.choice)}，${round.playerB.name}出${getChoiceEmoji(round.playerB.choice)} → ${round.winner === 'draw' ? '平手' : round.winner + '獲勝'}\n`;
    });
    
    return history;
}

// 分析對手出招模式
function analyzeOpponentPattern(rounds, opponentName) {
    if (rounds.length === 0) {
        return "對手尚未出招，無法分析模式。";
    }
    
    const opponentChoices = rounds.map(round => {
        return round.playerA.name === opponentName ? round.playerA.choice : round.playerB.choice;
    });
    
    const counts = { rock: 0, paper: 0, scissors: 0 };
    opponentChoices.forEach(choice => counts[choice]++);
    
    const total = opponentChoices.length;
    const analysis = `
對手${opponentName}的出招統計：
- 石頭：${counts.rock}次 (${((counts.rock/total)*100).toFixed(1)}%)
- 布：${counts.paper}次 (${((counts.paper/total)*100).toFixed(1)}%)
- 剪刀：${counts.scissors}次 (${((counts.scissors/total)*100).toFixed(1)}%)

最近3次出招：${opponentChoices.slice(-3).map(getChoiceEmoji).join(' → ')}`;
    
    return analysis;
}

// 獲取選擇對應的表情符號
function getChoiceEmoji(choice) {
    const emojis = {
        rock: '🪨石頭',
        paper: '📄布', 
        scissors: '✂️剪刀'
    };
    return emojis[choice] || choice;
}

// 複製prompt到剪貼板
function copyPrompt(player, buttonElement = null) {
    const promptContent = document.getElementById(`prompt${player}-content`).textContent;
    navigator.clipboard.writeText(promptContent).then(() => {
        // 顯示複製成功提示
        const btn = buttonElement || event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ 已複製！';
        btn.style.background = '#48bb78';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }).catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動選擇文字複製');
    });
}

// 更新模型連結
function updateModelLink(player) {
    const selectElement = document.getElementById(`player${player}-model`);
    const linkElement = document.getElementById(`player${player}-model-link`);
    const selectedModel = selectElement.value;
    
    if (selectedModel && selectedModel !== 'other') {
        linkElement.href = modelUrls[selectedModel];
        linkElement.classList.remove('hidden');
        linkElement.textContent = `🔗 前往 ${selectElement.options[selectElement.selectedIndex].text}`;
    } else {
        linkElement.classList.add('hidden');
    }
}

// 解析AI回應
function parseResponse(player) {
    const responseText = document.getElementById(`response${player}`).value.trim();
    
    if (!responseText) {
        alert(`請先貼上${player === 'A' ? gameState.playerA.name : gameState.playerB.name}的回應`);
        return;
    }
    
    try {
        // 清理回應文本，移除可能的markdown代碼塊標記
        let cleanedText = responseText;
        
        // 移除開頭的 ```json 或 ```
        cleanedText = cleanedText.replace(/^```(json)?\s*\n?/i, '');
        
        // 移除結尾的 ```
        cleanedText = cleanedText.replace(/\n?```\s*$/i, '');
        
        // 再次修剪空白字符
        cleanedText = cleanedText.trim();
        
        const response = JSON.parse(cleanedText);
        
        // 驗證回應格式
        if (!response.choice || !response.reason) {
            throw new Error('回應必須包含choice和reason欄位');
        }
        
        if (!['rock', 'paper', 'scissors'].includes(response.choice)) {
            throw new Error('choice必須是rock、paper或scissors');
        }
        
        // 儲存回應
        if (player === 'A') {
            gameState.responseA = response;
        } else {
            gameState.responseB = response;
        }
        
        // 顯示解析成功
        const btn = event.target;
        btn.textContent = '✅ 解析成功！';
        btn.style.background = '#48bb78';
        
        // 檢查是否兩個玩家都已回應
        if (gameState.responseA && gameState.responseB) {
            setTimeout(() => {
                processRound();
            }, 1000);
        }
        
    } catch (error) {
        alert(`解析失敗：${error.message}\n\n請確保回應是有效的JSON格式，例如：\n{"choice":"rock","reason":"我的分析..."}`);
    }
}

// 處理回合結果
function processRound() {
    const choiceA = gameState.responseA.choice;
    const choiceB = gameState.responseB.choice;
    const reasonA = gameState.responseA.reason;
    const reasonB = gameState.responseB.reason;
    
    // 判定勝負
    let winner = 'draw';
    if (choiceA !== choiceB) {
        if ((choiceA === 'rock' && choiceB === 'scissors') ||
            (choiceA === 'paper' && choiceB === 'rock') ||
            (choiceA === 'scissors' && choiceB === 'paper')) {
            winner = gameState.playerA.name;
            gameState.playerA.wins++;
        } else {
            winner = gameState.playerB.name;
            gameState.playerB.wins++;
        }
    }
    
    // 記錄回合
    const roundResult = {
        round: gameState.currentRound,
        playerA: {
            name: gameState.playerA.name,
            choice: choiceA,
            reason: reasonA,
            model: gameState.playerA.model
        },
        playerB: {
            name: gameState.playerB.name,
            choice: choiceB,
            reason: reasonB,
            model: gameState.playerB.model
        },
        winner: winner,
        timestamp: new Date()
    };
    
    gameState.rounds.push(roundResult);
    
    // 更新UI
    updateScoreboard();
    showRoundResult(roundResult);
    
    // 檢查遊戲是否結束
    const currentGameMode = gameState.gameMode || { wins: 3, total: 5, name: '五戰三勝' };
    if (gameState.playerA.wins >= currentGameMode.wins || gameState.playerB.wins >= currentGameMode.wins) {
        endGame();
    }
}

// 顯示回合結果
function showRoundResult(result) {
    // 更新選擇顯示
    document.getElementById('resultA-choice').className = `choice-icon ${result.playerA.choice}`;
    document.getElementById('resultA-reason').textContent = result.playerA.reason;
    
    document.getElementById('resultB-choice').className = `choice-icon ${result.playerB.choice}`;
    document.getElementById('resultB-reason').textContent = result.playerB.reason;
    
    // 更新勝負顯示
    const winnerElement = document.getElementById('winner-announcement');
    if (result.winner === 'draw') {
        winnerElement.textContent = '🤝 平手！';
        winnerElement.style.background = '#a0aec0';
    } else {
        winnerElement.textContent = `🎉 ${result.winner} 獲勝！`;
        winnerElement.style.background = '#ffd700';
    }
    
    // 顯示結果區域
    document.getElementById('round-result').classList.remove('hidden');
}

// 下一回合
function nextRound() {
    gameState.currentRound++;
    
    // 重置解析按鈕
    document.querySelectorAll('.parse-btn').forEach(btn => {
        btn.textContent = '✅ 解析回應';
        btn.style.background = '';
    });
    
    generatePrompts();
}

// 結束遊戲
function endGame() {
    const currentGameMode = gameState.gameMode || { wins: 3, total: 5, name: '五戰三勝' };
    const winner = gameState.playerA.wins >= currentGameMode.wins ? gameState.playerA.name : gameState.playerB.name;
    
    // 記錄完整比賽
    const matchRecord = {
        id: Date.now(),
        timestamp: new Date(),
        playerA: gameState.playerA,
        playerB: gameState.playerB,
        rounds: [...gameState.rounds],
        winner: winner,
        finalScore: `${gameState.playerA.wins}:${gameState.playerB.wins}`,
        gameMode: currentGameMode
    };
    
    gameState.gameHistory.push(matchRecord);
    saveGameHistory();
    
    // 更新UI
    document.getElementById('final-winner').textContent = `🏆 ${winner} 獲得勝利！\n${currentGameMode.name}\n最終比分：${gameState.playerA.wins} : ${gameState.playerB.wins}`;
    document.getElementById('game-over').classList.remove('hidden');
}

// 重置遊戲
function resetGame() {
    gameState.playerA.wins = 0;
    gameState.playerB.wins = 0;
    gameState.currentRound = 1;
    gameState.rounds = [];
    gameState.responseA = null;
    gameState.responseB = null;
    
    showSection('setup-section');
}

// 顯示歷史記錄
function showHistory() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    if (gameState.gameHistory.length === 0) {
        historyList.innerHTML = '<p>暫無對戰記錄</p>';
    } else {
        gameState.gameHistory.reverse().forEach(match => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'history-item';
            
            const roundsHtml = match.rounds.map(round => 
                `<div class="history-round">
                    <span>第${round.round}回合</span>
                    <span>${round.playerA.name}: ${getChoiceEmoji(round.playerA.choice)}</span>
                    <span>vs</span>
                    <span>${round.playerB.name}: ${getChoiceEmoji(round.playerB.choice)}</span>
                    <span>${round.winner === 'draw' ? '平手' : round.winner + '勝'}</span>
                </div>`
            ).join('');
            
            matchDiv.innerHTML = `
                <h4>🏆 ${match.winner} 獲勝 (${match.finalScore})</h4>
                <p>📅 ${match.timestamp.toLocaleString()}</p>
                <p>🎮 比賽制度：${match.gameMode ? match.gameMode.name : '七戰四勝'}</p>
                <p>🤖 ${match.playerA.name} (${match.playerA.model}) vs ${match.playerB.name} (${match.playerB.model})</p>
                <div class="history-rounds">${roundsHtml}</div>
            `;
            
            historyList.appendChild(matchDiv);
        });
    }
    
    showSection('history-section');
}

// 返回遊戲
function backToGame() {
    if (gameState.currentRound === 1 && gameState.rounds.length === 0) {
        showSection('setup-section');
    } else {
        showSection('battle-section');
    }
}

// 顯示指定區域
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.add('hidden');
    });
    document.getElementById(sectionId).classList.remove('hidden');
}

// 保存遊戲歷史到本地存儲
function saveGameHistory() {
    localStorage.setItem('rockPaperScissorsHistory', JSON.stringify(gameState.gameHistory));
}

// 載入遊戲歷史
function loadGameHistory() {
    const saved = localStorage.getItem('rockPaperScissorsHistory');
    if (saved) {
        try {
            gameState.gameHistory = JSON.parse(saved).map(match => ({
                ...match,
                timestamp: new Date(match.timestamp)
            }));
        } catch (error) {
            console.error('載入歷史記錄失敗:', error);
            gameState.gameHistory = [];
        }
    }
}
