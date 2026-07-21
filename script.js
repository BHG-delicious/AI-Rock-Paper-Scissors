// ==================== 全域變數 ====================
const RULES = `你現在要參加我舉辦的猜拳比賽，猜拳規則與一般猜拳同。

請仔細閱讀並完全理解以下比賽規則，並回覆「我已完整閱讀比賽規則並同意參賽」

比賽規則：

1. 網頁參考資料：
https://bhg-delicious.github.io/AI-Rock-Paper-Scissors/AI%E7%8C%9C%E6%8B%B3-medium%E7%B6%B2%E9%A0%81%E5%85%A7%E5%AE%B9.pdf
https://bhg-delicious.github.io/AI-Rock-Paper-Scissors/README.md
建議進入網頁閱讀其實際內容

2. 每場比賽分為 「規則宣讀」、「比賽準備」、「比賽中途(第n回合)」、「比賽結果」 、「交換復盤結果」五個階段

3. 在「規則宣讀」階段，我會向每位選手宣讀一次本規則，且每次的規則都可能有部分更動，因此即使選手並非首次閱讀比賽規則，亦強烈建議選手每次都一定要仔細讀過規則

4. 為了避免不同語言經翻譯後語意不精確導致溝通困難或理解錯誤，規定比賽全程(包含思考過程、撰寫回應)均應使用繁體中文

5. 我會為每個AI匹配AI對手，在「比賽準備」階段時雙方選手會知道對手是誰，並且所有AI選手贏得勝利的手段不限(包含使用先前的記憶、使用網路搜尋、竊取對手資料等)

6. 在「比賽準備」階段我會用以下提示詞要求選手選擇在這場比賽中使用的策略：
「比賽編號[xxxx]，這場比賽你的對手是[對手名稱]，請自由選擇你要在這場比賽中使用的策略，並給我名稱」
選手雙方將會知道匹此使用的策略名稱，因此選擇適當名稱以誘導或誤導對手也是戰略的一部份；
依比賽需求和實際情況，我也可能用以下提示詞指定選手在這場比賽中使用特定策略：
「比賽編號[xxxx]，這場比賽你的對手是[對手名稱]，這場比賽中請你使用策略「[策略名稱]」，請你理解策略內涵後複誦一次策略名稱」

7. 在「比賽中途」階段，每個回合(第n回合)我會對比賽雙方使用網頁生成的固定提示詞(包含對手第n-1回合回應的JSON)，並要求回應固定格式的JSON，其中你回應的JSON會在下一回合(第n+1回合)包含在對手的提示詞中提供給對手，同樣地，你也可以在下一回合(第n+1回合)的提示詞中取得對手回應的JSON。
因此，回應的JSON中的"reason"欄不一定要誠實，可以策略性的誤導與欺騙對手，同樣地，你的對手也可能會故意誤導你
提示詞格式如下：
「你是 玩家[A或B]，使用 [AI名稱] 模型，採用 [你選擇的策略]。

🎮 遊戲狀況：
- 對手：玩家[A或B] ([AI名稱]，[對手選擇的策略])
- 比賽制度：九戰五勝
- 目前比分：你 [a] : [b] 對手
- 當前：第 [n] 回合

📊 歷史對戰記錄：
[歷史記錄]

🧠 對手出招分析：
[分析模式]

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

可選擇：rock（石頭）、paper（布）、scissors（剪刀）

提供對手在上一回合回應的JSON：
[對手在第n-1回合回應的JSON] 」
(提示詞中的「策略建議」部分為固定提示詞生成網頁所自動加入的，可選擇性參考或忽視；第一回合時無「提供對手在上一回合回應的JSON」部分)

8. 當任一方達到勝利條件時(例如在九戰五勝的比賽中取得五勝)，即進入「比賽結果」階段，我會用以下提示詞宣布比賽結果：
「比賽編號[xxxx]結果：玩家[A或B]贏得了比賽，比分[a] : [b]
請你完整復盤本場比賽，並詳細分析你與對手在思考、判斷、策略及戰術上的表現

附上對手在最後一回合回應的JSON做為參考：
[對手在最後一回合回應的JSON]」

9. 雙方復盤完畢後，為了使雙方選手互相更加深入了解彼此，進入「交換復盤結果」階段，我會用以下提示詞將雙方選手復盤內容互相提供給對方選手：
「比賽編號[xxxx]，玩家[A或B]復盤內容：
[玩家A或B的復盤內容]」

10. 為了保證比賽公正並使選手達到最佳效能，比賽全程我會確保所有選手持續開啟「思考」或「深度思考」等類似功能(依據不同AI模型有不同名稱)，也因此，比賽中選手所匹配的所有對手都將會是具有深度思考、推理能力的強大AI模型，請務必全力以赴`;

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
    playerA: { name: '', model: '', strategy: '', wins: 0 },
    playerB: { name: '', model: '', strategy: '', wins: 0 },
    currentRound: 1,
    rounds: [],              // 每回合物件 { round, playerA: {choice, reason}, playerB: {choice, reason}, winner }
    gameMode: { wins: 3, total: 5, name: '五戰三勝' },
    matchId: Date.now().toString().slice(-6),
    // 復盤
    replayA: '',
    replayB: '',
    // 上回合 JSON (用於提供給下回合)
    lastResponseA: null,
    lastResponseB: null,
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
    // 顯示規則
    document.getElementById('ruleDisplay').textContent = RULES;
    // 生成初始策略提示詞
    updateStrategyUI('A');
    updateStrategyUI('B');
    // 檢查雙方策略是否填寫
    checkBothStrategies();
});

// ==================== 步驟切換 ====================
function goToStep(step) {
    // 隱藏所有步驟內容
    document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    // 更新指示器
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    document.querySelector(`.step[data-step="${step}"]`).classList.add('active');
    // 滾動到頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== 步驟1：規則宣讀 ====================
function copyRuleToClipboard() {
    navigator.clipboard.writeText(RULES).then(() => {
        alert('✅ 規則已複製到剪貼簿，請分別提供給雙方 AI。');
    }).catch(() => {
        alert('❌ 複製失敗，請手動選取文字複製。');
    });
}

function toggleStep1Next() {
    const checked = document.getElementById('ruleConfirm').checked;
    document.getElementById('step1Next').disabled = !checked;
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
        const opponentName = player === 'A' ? 
            (document.getElementById('playerBName').value || '選手B') :
            (document.getElementById('playerAName').value || '選手A');
        const myName = player === 'A' ? 
            (document.getElementById('playerAName').value || '選手A') :
            (document.getElementById('playerBName').value || '選手B');
        const prompt = `比賽編號[${gameState.matchId}]，這場比賽你的對手是「${opponentName}」，請自由選擇你要在這場比賽中使用的策略，並給我名稱`;
        document.getElementById(`player${player}_ai_prompt`).textContent = prompt;
        // 清空手動輸入
        document.getElementById(`player${player}StrategyManual`).value = '';
    } else {
        aiBlock.style.display = 'none';
        manualBlock.style.display = 'block';
        // 隱藏手動生成區域
        document.getElementById(`player${player}_manual_prompt_area`).style.display = 'none';
        // 清空 AI 輸入
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
    const opponentName = player === 'A' ? 
        (document.getElementById('playerBName').value || '選手B') :
        (document.getElementById('playerAName').value || '選手A');
    const myName = player === 'A' ? 
        (document.getElementById('playerAName').value || '選手A') :
        (document.getElementById('playerBName').value || '選手B');
    const prompt = `比賽編號[${gameState.matchId}]，這場比賽你的對手是「${opponentName}」，這場比賽中請你使用策略「${strategyName}」，請你理解策略內涵後複誦一次策略名稱`;
    document.getElementById(`player${player}_manual_prompt`).textContent = prompt;
    document.getElementById(`player${player}_manual_prompt_area`).style.display = 'block';
}

function checkBothStrategies() {
    // 檢查選手 A 的策略是否已填
    const modeA = document.getElementById('playerAStrategyMode').value;
    let strategyA = '';
    if (modeA === 'ai') {
        strategyA = document.getElementById('playerAStrategyInput').value.trim();
    } else {
        strategyA = document.getElementById('playerAStrategyManual').value.trim();
    }
    // 檢查選手 B
    const modeB = document.getElementById('playerBStrategyMode').value;
    let strategyB = '';
    if (modeB === 'ai') {
        strategyB = document.getElementById('playerBStrategyInput').value.trim();
    } else {
        strategyB = document.getElementById('playerBStrategyManual').value.trim();
    }
    // 啟用按鈕
    document.getElementById('step2Next').disabled = !(strategyA && strategyB);
}

// ==================== 開始比賽 ====================
function startGame() {
    // 讀取設定
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

    gameState.playerA.name = document.getElementById('playerAName').value || '選手A';
    gameState.playerA.model = document.getElementById('playerAModel').value;
    gameState.playerA.strategy = strategyA;
    gameState.playerA.wins = 0;

    gameState.playerB.name = document.getElementById('playerBName').value || '選手B';
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

    // 更新 UI
    document.getElementById('scoreAName').textContent = gameState.playerA.name;
    document.getElementById('scoreBName').textContent = gameState.playerB.name;
    document.getElementById('scoreA').textContent = '0';
    document.getElementById('scoreB').textContent = '0';
    document.getElementById('currentRound').textContent = '1';
    document.getElementById('promptATitle').textContent = `🤖 ${gameState.playerA.name} Prompt`;
    document.getElementById('promptBTitle').textContent = `🤖 ${gameState.playerB.name} Prompt`;
    document.getElementById('resultAName').textContent = gameState.playerA.name;
    document.getElementById('resultBName').textContent = gameState.playerB.name;

    // 隱藏結果
    document.getElementById('roundResult').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');

    // 切換到步驟3
    goToStep(3);
    // 生成第一回合提示詞
    generateRoundPrompts();
}

// ==================== 步驟3：比賽中途 ====================
function generateRoundPrompts() {
    const round = gameState.currentRound;
    const pA = gameState.playerA;
    const pB = gameState.playerB;

    // 生成提示詞
    const promptA = buildPrompt(pA, pB, gameState.rounds, gameState.lastResponseB);
    const promptB = buildPrompt(pB, pA, gameState.rounds, gameState.lastResponseA);

    document.getElementById('promptAContent').textContent = promptA;
    document.getElementById('promptBContent').textContent = promptB;
    // 清空回應區
    document.getElementById('responseA').value = '';
    document.getElementById('responseB').value = '';
    // 隱藏回合結果
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

// 解析回應
function parseResponse(player) {
    const textarea = document.getElementById(`response${player}`);
    const raw = textarea.value.trim();
    if (!raw) {
        alert('請先貼上 AI 的回應。');
        return;
    }
    try {
        // 清理可能的 markdown 代碼塊
        let cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const json = JSON.parse(cleaned);
        if (!json.choice || !['rock','paper','scissors'].includes(json.choice)) {
            throw new Error('choice 必須是 rock, paper 或 scissors');
        }
        if (!json.reason) throw new Error('缺少 reason 欄位');
        // 儲存
        if (player === 'A') {
            gameState.lastResponseA = json;
        } else {
            gameState.lastResponseB = json;
        }
        // 檢查雙方是否都已回應
        if (gameState.lastResponseA && gameState.lastResponseB) {
            processRound();
        } else {
            alert(`✅ ${player === 'A' ? '選手A' : '選手B'} 回應已解析，等待另一位選手。`);
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

    // 更新比分
    document.getElementById('scoreA').textContent = gameState.playerA.wins;
    document.getElementById('scoreB').textContent = gameState.playerB.wins;

    // 顯示結果
    showRoundResult(roundResult);

    // 檢查是否結束
    const mode = gameState.gameMode;
    if (gameState.playerA.wins >= mode.wins || gameState.playerB.wins >= mode.wins) {
        endGame();
    } else {
        // 啟用下一回合按鈕
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
    // 儲存最後回應供復盤使用
    // 將比賽結果傳遞到步驟4
    setTimeout(() => {
        goToStep(4);
        setupReplay();
    }, 500);
}

// ==================== 步驟4：復盤 ====================
function setupReplay() {
    // 生成復盤提示詞
    const lastRound = gameState.rounds[gameState.rounds.length - 1];
    const lastJSON_A = gameState.lastResponseA || { choice: '?', reason: '無' };
    const lastJSON_B = gameState.lastResponseB || { choice: '?', reason: '無' };

    const replayA = `比賽編號[${gameState.matchId}]結果：玩家${gameState.playerA.name}贏得了比賽，比分${gameState.playerA.wins} : ${gameState.playerB.wins}
請你完整復盤本場比賽，並詳細分析你與對手在思考、判斷、策略及戰術上的表現

附上對手在最後一回合回應的JSON做為參考：
${JSON.stringify(lastJSON_B, null, 2)}`;

    const replayB = `比賽編號[${gameState.matchId}]結果：玩家${gameState.playerB.name}贏得了比賽，比分${gameState.playerB.wins} : ${gameState.playerA.wins}
請你完整復盤本場比賽，並詳細分析你與對手在思考、判斷、策略及戰術上的表現

附上對手在最後一回合回應的JSON做為參考：
${JSON.stringify(lastJSON_A, null, 2)}`;

    document.getElementById('replayPromptA').textContent = replayA;
    document.getElementById('replayPromptB').textContent = replayB;
    document.getElementById('replayResponseA').value = '';
    document.getElementById('replayResponseB').value = '';
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

// 覆寫 goToStep 以在進入步驟4時啟用按鈕
const originalGoToStep = goToStep;
goToStep = function(step) {
    originalGoToStep(step);
    if (step === 4) {
        // 若尚未結束比賽則不顯示
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
};

// ==================== 步驟5：交換復盤 ====================
function setupExchange() {
    if (!gameState.replayA || !gameState.replayB) {
        alert('請先在步驟4儲存復盤內容。');
        goToStep(4);
        return;
    }
    document.getElementById('replayTextA').textContent = gameState.replayA;
    document.getElementById('replayTextB').textContent = gameState.replayB;

    const exchangeA = `比賽編號[${gameState.matchId}]，選手B復盤內容：\n${gameState.replayB}`;
    const exchangeB = `比賽編號[${gameState.matchId}]，選手A復盤內容：\n${gameState.replayA}`;
    document.getElementById('exchangePromptA').textContent = exchangeA;
    document.getElementById('exchangePromptB').textContent = exchangeB;
}

// ==================== 重置 ====================
function resetAll() {
    if (confirm('確定要重新開始嗎？所有進度將遺失。')) {
        location.reload();
    }
}
