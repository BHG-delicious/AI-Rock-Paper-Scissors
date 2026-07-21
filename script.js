// ==================== 全域變數 ====================
let rulesText = ''; // 將由 fetch 載入

// 比賽制度
const GAME_MODES = {
    1: { wins: 1, total: 1, name: '一戰決勝負' },
    2: { wins: 2, total: 3, name: '三戰兩勝' },
    3: { wins: 3, total: 5, name: '五戰三勝' },
    4: { wins: 4, total: 7, name: '七戰四勝' },
    5: { wins: 5, total: 9, name: '九戰五勝' }
};

// 比賽狀態
let gameState = {
    playerA: { name: '玩家A', model: '', strategy: '', wins: 0 },
    playerB: { name: '玩家B', model: '', strategy: '', wins: 0 },
    currentRound: 1,
    rounds: [],
    gameMode: { wins: 3, total: 5, name: '五戰三勝' },
    matchId: Date.now().toString().slice(-6),
    replayA: '',
    replayB: '',
    lastResponseA: null,
    lastResponseB: null,
};

// ==================== 載入規則 ====================
async function loadRules() {
    try {
        const response = await fetch('/rules.txt');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        rulesText = await response.text();
        document.getElementById('ruleDisplay').textContent = rulesText;
    } catch (e) {
        console.error('載入規則失敗:', e);
        document.getElementById('ruleDisplay').innerHTML = 
            '<div class="message error">⚠️ 無法載入規則檔案，請確認 <code>/rules.txt</code> 是否存在。</div>' +
            '<p style="margin-top:10px;">您可以手動將規則內容貼入下方，再點擊「複製規則」。</p>' +
            '<textarea id="manualRuleInput" class="form-control" rows="6" placeholder="請貼上規則內容..."></textarea>' +
            '<button class="btn btn-secondary" onclick="useManualRule()" style="margin-top:8px;">使用手動規則</button>';
    }
}

function useManualRule() {
    const input = document.getElementById('manualRuleInput');
    if (input.value.trim()) {
        rulesText = input.value.trim();
        document.getElementById('ruleDisplay').textContent = rulesText;
        document.getElementById('manualRuleInput').style.display = 'none';
    } else {
        alert('請先貼上規則內容。');
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    loadRules().then(() => {
        updateStrategyUI('A');
        updateStrategyUI('B');
        checkBothStrategies();
    });
});

// ==================== 步驟切換 ====================
function goToStep(step) {
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step === 4) {
        if (gameState.rounds.length === 0) {
            alert('請先完成比賽。');
            goToStep(3);
            return;
        }
        setupReplay();
    }
    if (step === 5) {
        setupExchange();
    }
}

// ==================== 步驟1：規則宣讀 ====================
function copyRuleToClipboard() {
    if (!rulesText) {
        alert('規則尚未載入，請稍候或手動輸入。');
        return;
    }
    navigator.clipboard.writeText(rulesText).then(() => {
        alert('✅ 規則已複製到剪貼簿，請分別提供給雙方 AI。');
    }).catch(() => {
        alert('❌ 複製失敗，請手動選取文字複製。');
    });
}

function toggleStep1Next() {
    document.getElementById('step1Next').disabled = !document.getElementById('ruleConfirm').checked;
}

// ==================== 步驟2：比賽準備 ====================
function updateStrategyUI(player) {
    const mode = document.getElementById(`player${player}StrategyMode`).value;
    const aiBlock = document.getElementById(`player${player}_ai`);
    const manualBlock = document.getElementById(`player${player}_manual`);
    if (mode === 'ai') {
        aiBlock.style.display = 'block';
        manualBlock.style.display = 'none';
        // 生成 AI 選擇策略提示詞
        const opponentName = player === 'A' ? '玩家B' : '玩家A';
        const prompt = `比賽編號[${gameState.matchId}]，這場比賽你的對手是「${opponentName}」，請自由選擇你要在這場比賽中使用的策略，並給我名稱`;
        document.getElementById(`player${player}_ai_prompt`).textContent = prompt;
        document.getElementById(`player${player}StrategyManual`).value = '';
    } else {
        aiBlock.style.display = 'none';
        manualBlock.style.display = 'block';
        document.getElementById(`player${player}_manual_prompt_area`).style.display = 'none';
        document.getElementById(`player${player}StrategyInput`).value = '';
    }
    checkBothStrategies();
}

function generateManualPrompt(player) {
    const strategyName = document.getElementById(`player${player}StrategyManual`).value.trim();
    if (!strategyName) {
        alert('請先輸入策略名稱。');
        return;
    }
    const opponentName = player === 'A' ? '玩家B' : '玩家A';
    const prompt = `比賽編號[${gameState.matchId}]，這場比賽你的對手是「${opponentName}」，這場比賽中請你使用策略「${strategyName}」，請你理解策略內涵後複誦一次策略名稱`;
    document.getElementById(`player${player}_manual_prompt`).textContent = prompt;
    document.getElementById(`player${player}_manual_prompt_area`).style.display = 'block';
}

function checkBothStrategies() {
    const modeA = document.getElementById('playerAStrategyMode').value;
    let strategyA = '';
    if (modeA === 'ai') {
        strategyA = document.getElementById('playerAStrategyInput').value.trim();
    } else {
        strategyA = document.getElementById('playerAStrategyManual').value.trim();
    }
    const modeB = document.getElementById('playerBStrategyMode').value;
    let strategyB = '';
    if (modeB === 'ai') {
        strategyB = document.getElementById('playerBStrategyInput').value.trim();
    } else {
        strategyB = document.getElementById('playerBStrategyManual').value.trim();
    }
    document.getElementById('step2Next').disabled = !(strategyA && strategyB);
}

// ==================== 開始比賽 ====================
function startGame() {
    const modeA = document.getElementById('playerAStrategyMode').value;
    const strategyA = modeA === 'ai' ? 
        document.getElementById('playerAStrategyInput').value.trim() :
        document.getElementById('playerAStrategyManual').value.trim();
    const modeB = document.getElementById('playerBStrategyMode').value;
    const strategyB = modeB === 'ai' ? 
        document.getElementById('playerBStrategyInput').value.trim() :
        document.getElementById('playerBStrategyManual').value.trim();

    if (!strategyA || !strategyB) {
        alert('請確認雙方策略名稱皆已填入。');
        return;
    }

    gameState.playerA.model = document.getElementById('playerAModel').value;
    gameState.playerA.strategy = strategyA;
    gameState.playerA.wins = 0;

    gameState.playerB.model = document.getElementById('playerBModel').value;
    gameState.playerB.strategy = strategyB;
    gameState.playerB.wins = 0;

    const modeVal = parseInt(document.getElementById('gameMode').value);
    gameState.gameMode = GAME_MODES[modeVal] || GAME_MODES[3];
    gameState.currentRound = 1;
    gameState.rounds = [];
    gameState.lastResponseA = null;
    gameState.lastResponseB = null;
    gameState.matchId = Date.now().toString().slice(-6);

    // 更新顯示名稱（固定）
    document.getElementById('scoreAName').textContent = '玩家A';
    document.getElementById('scoreBName').textContent = '玩家B';
    document.getElementById('scoreA').textContent = '0';
    document.getElementById('scoreB').textContent = '0';
    document.getElementById('currentRound').textContent = '1';
    document.getElementById('promptATitle').textContent = `🤖 玩家A Prompt`;
    document.getElementById('promptBTitle').textContent = `🤖 玩家B Prompt`;
    document.getElementById('resultAName').textContent = '玩家A';
    document.getElementById('resultBName').textContent = '玩家B';

    document.getElementById('roundResult').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');

    goToStep(3);
    generateRoundPrompts();
}

// ==================== 步驟3：比賽中途 ====================
function generateRoundPrompts() {
    const pA = gameState.playerA;
    const pB = gameState.playerB;

    const promptA = buildPrompt(pA, pB, gameState.rounds, gameState.lastResponseB);
    const promptB = buildPrompt(pB, pA, gameState.rounds, gameState.lastResponseA);

    document.getElementById('promptAContent').textContent = promptA;
    document.getElementById('promptBContent').textContent = promptB;
    document.getElementById('responseA').value = '';
    document.getElementById('responseB').value = '';
    document.getElementById('roundResult').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
}

function buildPrompt(player, opponent, history, lastOpponentResponse) {
    let historyText = history.length === 0 ? '這是第一回合，暫無歷史記錄。' :
        history.map((r, i) => 
            `第${i+1}回合：${r.playerA.name}出${getChoiceEmoji(r.playerA.choice)}，${r.playerB.name}出${getChoiceEmoji(r.playerB.choice)} → ${r.winner === 'draw' ? '平手' : r.winner + '獲勝'}`
        ).join('\n');

    const analysis = history.length === 0 ? '對手尚未出招，無法分析模式。' : analyzeOpponent(history, opponent.name);

    let prompt = `你是 ${player.name}，使用 ${player.model} 模型，採用 ${player.strategy}。

🎮 遊戲狀況：
- 對手：${opponent.name} (${opponent.model}，${opponent.strategy})
- 比賽制度：${gameState.gameMode.name}
- 目前比分：你 ${player.wins} : ${opponent.wins} 對手
- 當前：第 ${gameState.currentRound} 回合

📊 歷史對戰記錄：
${historyText}

🧠 對手出招分析：
${analysis}

🎯 策略建議：
- 分析對手的出招模式和習慣
- 考慮心理戰術和反預測
- 根據比分情況隨時調整策略
- 避免自己的出招過於規律
- 確保自己不落入對手的圈套

請仔細分析局勢並做出最佳選擇。

回應格式（必須是有效的JSON）：
{
  "choice": "rock",
  "reason": "詳細說明你的分析過程和選擇理由，包括對對手策略的判斷和你的應對思路"
}

可選擇：rock（石頭）、paper（布）、scissors（剪刀）`;

    if (lastOpponentResponse) {
        prompt += `\n\n提供對手在上一回合回應的JSON：\n${JSON.stringify(lastOpponentResponse, null, 2)}`;
    }

    return prompt;
}

function getChoiceEmoji(choice) {
    const map = { rock: '🪨', paper: '📄', scissors: '✂️' };
    return map[choice] || choice;
}

function analyzeOpponent(history, opponentName) {
    const choices = history.map(r => {
        return r.playerA.name === opponentName ? r.playerA.choice : r.playerB.choice;
    });
    const counts = { rock: 0, paper: 0, scissors: 0 };
    choices.forEach(c => counts[c]++);
    const total = choices.length;
    const analysis = `對手${opponentName}的出招統計：
- 石頭：${counts.rock}次 (${((counts.rock/total)*100).toFixed(1)}%)
- 布：${counts.paper}次 (${((counts.paper/total)*100).toFixed(1)}%)
- 剪刀：${counts.scissors}次 (${((counts.scissors/total)*100).toFixed(1)}%)

最近3次出招：${choices.slice(-3).map(getChoiceEmoji).join(' → ')}`;
    return analysis;
}

function copyPrompt(id) {
    let text = '';
    if (id === 'A_ai') text = document.getElementById('playerA_ai_prompt').textContent;
    else if (id === 'B_ai') text = document.getElementById('playerB_ai_prompt').textContent;
    else if (id === 'A_manual') text = document.getElementById('playerA_manual_prompt').textContent;
    else if (id === 'B_manual') text = document.getElementById('playerB_manual_prompt').textContent;
    else if (id === 'A_round') text = document.getElementById('promptAContent').textContent;
    else if (id === 'B_round') text = document.getElementById('promptBContent').textContent;
    else if (id === 'replayA') text = document.getElementById('replayPromptA').textContent;
    else if (id === 'replayB') text = document.getElementById('replayPromptB').textContent;
    else if (id === 'exchangeA') text = document.getElementById('exchangePromptA').textContent;
    else if (id === 'exchangeB') text = document.getElementById('exchangePromptB').textContent;
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ 提示詞已複製到剪貼簿。');
        }).catch(() => {
            alert('❌ 複製失敗，請手動選取文字複製。');
        });
    }
}

function parseResponse(player) {
    const textarea = document.getElementById(`response${player}`);
    const raw = textarea.value.trim();
    if (!raw) {
        alert('請先貼上 AI 的回應。');
        return;
    }
    try {
        let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const json = JSON.parse(cleaned);
        if (!json.choice || !['rock','paper','scissors'].includes(json.choice)) {
            throw new Error('choice 必須是 rock, paper 或 scissors');
        }
        if (!json.reason) throw new Error('缺少 reason 欄位');
        if (player === 'A') {
            gameState.lastResponseA = json;
        } else {
            gameState.lastResponseB = json;
        }
        if (gameState.lastResponseA && gameState.lastResponseB) {
            processRound();
        } else {
            alert(`✅ ${player === 'A' ? '玩家A' : '玩家B'} 回應已解析，等待另一位選手。`);
        }
    } catch (e) {
        alert(`❌ 解析失敗：${e.message}\n\n請確認格式為 JSON，例如：\n{"choice":"rock","reason":"我的分析..."}`);
    }
}

function processRound() {
    const choiceA = gameState.lastResponseA.choice;
    const choiceB = gameState.lastResponseB.choice;
    const reasonA = gameState.lastResponseA.reason;
    const reasonB = gameState.lastResponseB.reason;

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

    const roundResult = {
        round: gameState.currentRound,
        playerA: { name: gameState.playerA.name, choice: choiceA, reason: reasonA },
        playerB: { name: gameState.playerB.name, choice: choiceB, reason: reasonB },
        winner: winner
    };
    gameState.rounds.push(roundResult);

    document.getElementById('scoreA').textContent = gameState.playerA.wins;
    document.getElementById('scoreB').textContent = gameState.playerB.wins;

    showRoundResult(roundResult);

    const mode = gameState.gameMode;
    if (gameState.playerA.wins >= mode.wins || gameState.playerB.wins >= mode.wins) {
        endGame();
    } else {
        document.getElementById('nextRoundBtn').disabled = false;
    }
}

function showRoundResult(result) {
    document.getElementById('resultAChoice').textContent = getChoiceEmoji(result.playerA.choice);
    document.getElementById('resultAReason').textContent = result.playerA.reason;
    document.getElementById('resultBChoice').textContent = getChoiceEmoji(result.playerB.choice);
    document.getElementById('resultBReason').textContent = result.playerB.reason;

    const winnerEl = document.getElementById('winnerAnnouncement');
    if (result.winner === 'draw') {
        winnerEl.textContent = '🤝 平手！';
        winnerEl.style.background = '#a0aec0';
    } else {
        winnerEl.textContent = `🎉 ${result.winner} 獲勝！`;
        winnerEl.style.background = '#ffd700';
    }
    document.getElementById('roundResult').classList.remove('hidden');
}

function nextRound() {
    gameState.currentRound++;
    document.getElementById('currentRound').textContent = gameState.currentRound;
    document.getElementById('nextRoundBtn').disabled = true;
    generateRoundPrompts();
}

function endGame() {
    const winner = gameState.playerA.wins >= gameState.gameMode.wins ? gameState.playerA.name : gameState.playerB.name;
    document.getElementById('finalWinner').textContent = `🏆 ${winner} 獲得勝利！\n${gameState.gameMode.name}\n最終比分：${gameState.playerA.wins} : ${gameState.playerB.wins}`;
    document.getElementById('gameOver').classList.remove('hidden');
    setTimeout(() => {
        goToStep(4);
        setupReplay();
    }, 500);
}

// ==================== 步驟4：復盤 ====================
function setupReplay() {
    const lastJSON_A = gameState.lastResponseA || { choice: '?', reason: '無' };
    const lastJSON_B = gameState.lastResponseB || { choice: '?', reason: '無' };

    const replayA = `比賽編號[${gameState.matchId}]結果：玩家A贏得了比賽，比分${gameState.playerA.wins} : ${gameState.playerB.wins}
請你完整復盤本場比賽，並詳細分析你與對手在思考、判斷、策略及戰術上的表現

附上對手在最後一回合回應的JSON做為參考：
${JSON.stringify(lastJSON_B, null, 2)}`;

    const replayB = `比賽編號[${gameState.matchId}]結果：玩家B贏得了比賽，比分${gameState.playerB.wins} : ${gameState.playerA.wins}
請你完整復盤本場比賽，並詳細分析你與對手在思考、判斷、策略及戰術上的表現

附上對手在最後一回合回應的JSON做為參考：
${JSON.stringify(lastJSON_A, null, 2)}`;

    document.getElementById('replayPromptA').textContent = replayA;
    document.getElementById('replayPromptB').textContent = replayB;
    document.getElementById('replayResponseA').value = '';
    document.getElementById('replayResponseB').value = '';
    document.getElementById('step4Next').disabled = true;
}

function saveReplays() {
    const textA = document.getElementById('replayResponseA').value.trim();
    const textB = document.getElementById('replayResponseB').value.trim();
    if (!textA || !textB) {
        alert('請貼上雙方 AI 的復盤內容後再儲存。');
        return;
    }
    gameState.replayA = textA;
    gameState.replayB = textB;
    alert('✅ 復盤內容已儲存，可以進入交換復盤階段。');
    document.getElementById('step4Next').disabled = false;
}

// ==================== 步驟5：交換復盤 ====================
function setupExchange() {
    if (!gameState.replayA || !gameState.replayB) {
        alert('請先在步驟4儲存復盤內容。');
        goToStep(4);
        return;
    }
    document.getElementById('replayTextA').textContent = gameState.replayA;
    document.getElementById('replayTextB').textContent = gameState.replayB;

    const exchangeA = `比賽編號[${gameState.matchId}]，玩家B復盤內容：\n${gameState.replayB}`;
    const exchangeB = `比賽編號[${gameState.matchId}]，玩家A復盤內容：\n${gameState.replayA}`;
    document.getElementById('exchangePromptA').textContent = exchangeA;
    document.getElementById('exchangePromptB').textContent = exchangeB;
}

// ==================== 重置 ====================
function resetAll() {
    if (confirm('確定要重新開始嗎？所有進度將遺失。')) {
        location.reload();
    }
}
