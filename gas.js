// 主要な要素の取得
const rmvInput = document.getElementById('rmv');
const factorSelect = document.getElementById('factor');
const pStartInput = document.getElementById('p_start');
const vTankInput = document.getElementById('v_tank');
const dMaxInput = document.getElementById('d_max');
// 修正箇所：time_ascent から rate_ascent に変更
const rateAscentInput = document.getElementById('rate_ascent'); 
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
	// 修正箇所：浮上速度を取得
	const R_ascent = parseFloat(rateAscentInput.value);
	const T_safety_stop = parseFloat(timeSafetyStopInput.value);
	const P_buffer = parseFloat(bufferInput.value);

	// 値が有効でない場合は処理を終了
	if (isNaN(RMV_working_max) || isNaN(Factor) || isNaN(P_start) || isNaN(V_tank) || isNaN(D_max) || isNaN(R_ascent) || isNaN(T_safety_stop) || isNaN(P_buffer) || R_ascent <= 0) {
	    rmvPlanResult.textContent = '---';
	    rGasResult.textContent = '---';
	    tGasResult.textContent = '---';
	    return;
	}

	// 浮上時間 (T_ascent) の自動計算: T_ascent = D_max / R_ascent
	// 安全停止深度 (例: 5m) までは一定速度で浮上すると仮定します。
	// R-Gasの計算は最大水深から安全停止深度(例: 5m)までを考慮
	const D_to_SafetyStop = D_max > 5 ? D_max - 5 : D_max; // 5m地点までを浮上距離とする

	// 浮上時間 (T_ascent) の計算
	let T_ascent = D_to_SafetyStop / R_ascent;
	T_ascent = Math.max(T_ascent, 0); // 時間がマイナスにならないようにする

	// 2. RMV_Plan (計画用RMV) の計算
	const RMV_Plan = RMV_working_max * Factor;
	rmvPlanResult.textContent = RMV_Plan.toFixed(1);

	// 3. R-Gas (緊急用ガス) の計算
	// 最大水深の絶対圧 (ATA) を計算: ATA = (D_max / 10) + 1
	const ATA_max = (D_max / 10) + 1;

	// R-Gas Volume (L) の計算: Volume = RMV_Plan * (T_ascent + T_safety_stop) * ATA_max
	// T_ascent には浮上速度から算出された値を使用
	const R_Gas_Volume = RMV_Plan * (T_ascent + T_safety_stop) * ATA_max;

	// R-Gas 圧力 (bar) の計算: P = Volume / V_tank
	let R_Gas_calculated = R_Gas_Volume / V_tank;

	// 安全バッファの追加
	const R_Gas_final = R_Gas_calculated + P_buffer;

	// R-Gasを切り上げて整数で表示
	const R_Gas_display = Math.ceil(R_Gas_final);
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
