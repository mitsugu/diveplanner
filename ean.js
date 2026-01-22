// 要素の取得
const fo2Input = document.getElementById('fo2');
const po2LimitInput = document.getElementById('po2_limit');
const depthInput = document.getElementById('depth');

const modResult = document.getElementById('mod_result');
const currentDepthDisplay = document.getElementById('current_depth_display');
const po2Result = document.getElementById('po2_result');
const eadResult = document.getElementById('ead_result');
const warningMsg = document.getElementById('warning_msg');

function calculateEan() {
    // 1. 値の取得
    const FO2_percent = parseFloat(fo2Input.value);
    const PO2_limit = parseFloat(po2LimitInput.value);
    const Depth = parseFloat(depthInput.value);

    // バリデーション
    if (isNaN(FO2_percent) || isNaN(PO2_limit) || isNaN(Depth) || FO2_percent < 21 || FO2_percent > 100) {
        modResult.textContent = '---';
        po2Result.textContent = '---';
        eadResult.textContent = '---';
        return;
    }

    // 計算用係数
    const FO2 = FO2_percent / 100; // % を小数に (0.32など)
    const FN2 = 1 - FO2;           // 窒素分割 (0.68など)

    // 2. MOD (最大許容水深) の計算
    // 公式: MOD = 10 * ( (PO2_limit / FO2) - 1 )
    const MOD = 10 * ((PO2_limit / FO2) - 1);
    modResult.textContent = Math.floor(MOD); // 安全側に切り捨て表示が一般的だが、ここでは整数化

    // 表示更新
    currentDepthDisplay.textContent = Depth;

    // 3. 現在深度での PO2 計算
    // 公式: PO2 = FO2 * ( (Depth / 10) + 1 )
    const ATA = (Depth / 10) + 1;
    const Current_PO2 = FO2 * ATA;
    
    po2Result.textContent = Current_PO2.toFixed(2);

    // PO2に基づく色分けと警告
    po2Result.className = ''; // クラスリセット
    warningMsg.classList.add('hidden'); // メッセージを一旦隠す

    // 【修正箇所】判定ロジック
    if (Current_PO2 > 1.6) {
        // 1.6超えは設定に関わらず常に危険 (CNS毒性リスク)
        po2Result.classList.add('danger');
        warningMsg.textContent = `⚠️ 危険: PO2が 1.6 を超えています (CNS毒性リスク)`;
        warningMsg.classList.remove('hidden');
    } 
    else if (Current_PO2 > PO2_limit) {
        // 設定したリミットを超えた場合 (例: 1.2設定で 1.3 の場合など)
        po2Result.classList.add('caution');
        warningMsg.textContent = `⚠️ 注意: 設定した最大 PO2 (${PO2_limit}) を超えています`;
        warningMsg.classList.remove('hidden');
    } 
    else {
        // 安全圏内
        po2Result.classList.add('safe');
    }

    // 4. EAD (空気換算深度) の計算
    // 公式: EAD = [ ( (Depth + 10) * FN2 ) / 0.79 ] - 10
    // ナイトロックスの窒素分圧と同じ窒素分圧になる空気の水深
    const EAD = ( ( (Depth + 10) * FN2 ) / 0.79 ) - 10;
    
    // EADが0未満（浅場や高酸素）の場合は0とする
    const EAD_display = Math.max(0, Math.ceil(EAD));
    eadResult.textContent = EAD_display;
}

// イベントリスナー
const inputs = document.querySelectorAll('input, select');
inputs.forEach(input => {
    input.addEventListener('input', calculateEan);
});

// 初期実行
window.onload = calculateEan;
