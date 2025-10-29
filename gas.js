// 主要な要素の取得
const rmvInput = document.getElementById('rmv');
const factorSelect = document.getElementById('factor');
const pStartInput = document.getElementById('p_start');
const vTankInput = document.getElementById('v_tank');
const dMaxInput = document.getElementById('d_max');
const rateAscentInput = document.getElementById('rate_ascent'); 
// 【変更点】優先 R-Gasの入力要素を取得
const pPriorityRGasInput = document.getElementById('p_priority_r_gas'); 
const timeSafetyStopInput = document.getElementById('time_safety_stop');
const bufferInput = document.getElementById('buffer');

// 結果要素の取得
const rmvPlanResult = document.getElementById('RMV_Plan_Result');
const rGasResult = document.getElementById('R_Gas_Result');
const tGasResult = document.getElementById('T_Gas_Result');

// 計算関数
function calculateGasMinimums() {
    // 1. データ取得と数値変換
    const RMV_working_max = parseFloat(rmvInput.value);
    const Factor = parseFloat(factorSelect.value);
    const P_start = parseFloat(pStartInput.value);
    const V_tank = parseFloat(vTankInput.value);
    const D_max = parseFloat(dMaxInput.value);
    const R_ascent = parseFloat(rateAscentInput.value); 
    const T_safety_stop = parseFloat(timeSafetyStopInput.value);
    const P_buffer = parseFloat(bufferInput.value);
    // 優先 R-Gas の値を取得 (数値でない、または 0 の場合は、後続の RMV 計算を使用)
    const P_priority_RGas = parseFloat(pPriorityRGasInput.value); 

    // 値が有効でない場合は処理を終了
    if (isNaN(RMV_working_max) || isNaN(Factor) || isNaN(P_start) || isNaN(V_tank) || isNaN(D_max) || isNaN(R_ascent) || isNaN(T_safety_stop) || isNaN(P_buffer) || R_ascent <= 0 || P_start < P_buffer) {
        rmvPlanResult.textContent = '---';
        rGasResult.textContent = '---';
        tGasResult.textContent = '---';
        return;
    }

    // 浮上時間 (T_ascent) の自動計算
    const D_to_SafetyStop = D_max > 5 ? D_max - 5 : D_max; 
    let T_ascent = D_to_SafetyStop / R_ascent;
    T_ascent = Math.max(T_ascent, 0); // 時間がマイナスにならないようにする

    // 2. RMV_Plan (計画用RMV) の計算
    const RMV_Plan = RMV_working_max * Factor;
    rmvPlanResult.textContent = RMV_Plan.toFixed(1);

    // 3. R-Gas (緊急用ガス) の計算と優先値の適用
    let R_Gas_display;
    
    if (!isNaN(P_priority_RGas) && P_priority_RGas > 0) {
        // 【優先ロジック】優先 R-Gas が設定されている場合、その値を採用
        R_Gas_display = Math.ceil(P_priority_RGas);
    } else {
        // RMVベースの計算を使用
        const ATA_max = (D_max / 10) + 1;
        const R_Gas_Volume = RMV_Plan * (T_ascent + T_safety_stop) * ATA_max;
        const R_Gas_calculated = R_Gas_Volume / V_tank;
        const R_Gas_final = R_Gas_calculated + P_buffer;
        
        // R-Gasを切り上げて整数で表示
        R_Gas_display = Math.ceil(R_Gas_final);
    }

    rGasResult.textContent = R_Gas_display.toFixed(0);
    
    // 4. T-Gas (ターニング・プレッシャー) の計算
    // U-Gas計算にはR-Gasの最終値を切り上げた値を使用
    const R_Gas_for_U_Gas = R_Gas_display;

    // 初期残圧がR-Gasを下回る場合はエラー
    if (P_start <= R_Gas_for_U_Gas) {
         tGasResult.textContent = '要再計画';
         return;
    }
    
    // 使える空気量 (U-Gas) の計算
    const U_Gas = P_start - R_Gas_for_U_Gas;

    // T-Gas の計算: T-Gas = P_start - (U-Gas / 2)
    const T_Gas = P_start - (U_Gas / 2);
    
    // T-Gasも切り上げて整数で表示
    tGasResult.textContent = Math.ceil(T_Gas).toFixed(0); 
}

// イベントリスナー: 入力値が変わるたびに計算を実行
const inputs = document.querySelectorAll('input[type="number"], select');
inputs.forEach(input => {
    input.addEventListener('input', calculateGasMinimums);
});

// 初回ロード時の計算実行
window.onload = calculateGasMinimums;
