// gas.js
// 主要な要素の取得
const rmvInput = document.getElementById('rmv');
const femInput = document.getElementById('fem');
const pStartInput = document.getElementById('p_start');
const vTankInput = document.getElementById('v_tank');
const dMaxInput = document.getElementById('d_max');
const rAscentInput = document.getElementById('r_ascent');
const tSafetyStopInput = document.getElementById('t_safety_stop');
const pMPriorityInput = document.getElementById('p_m_priority');
const tMoveInput = document.getElementById('t_move'); // TmoveInputを追加

// 結果要素の取得
const mGasResult = document.getElementById('M_Gas_Result');
const rGasResult = document.getElementById('R_Gas_Result');
const tGasResult = document.getElementById('T_Gas_Result');
const mGasDetails = document.getElementById('M_Gas_Details');
const rGasDetails = document.getElementById('R_Gas_Details');
const errorMessage = document.getElementById('Error_Message');

// 計算関数
function calculateGasPlan() {
	// 1. データ取得とバリデーション
	const RMV = parseFloat(rmvInput.value);
	const Fem = parseFloat(femInput.value);
	const P_start = parseFloat(pStartInput.value);
	const V_tank = parseFloat(vTankInput.value);
	const D_max = parseFloat(dMaxInput.value);
	const R_ascent = parseFloat(rAscentInput.value);
	const T_safety_stop = parseFloat(tSafetyStopInput.value);
	const P_M_priority = parseFloat(pMPriorityInput.value);
	const T_move = parseFloat(tMoveInput.value); // Tmoveを取得

	errorMessage.textContent = '';
	mGasDetails.innerHTML = '';
	rGasDetails.innerHTML = '';

	// 基本的な必須項目の入力チェック
	if (isNaN(RMV) || isNaN(Fem) || isNaN(P_start) || isNaN(V_tank) || isNaN(D_max) || isNaN(R_ascent) || isNaN(T_safety_stop) || isNaN(T_move) || R_ascent <= 0 || V_tank <= 0 || Fem < 1.0) {
		mGasResult.textContent = '---';
		rGasResult.textContent = '---';
		tGasResult.textContent = '入力エラー';
		errorMessage.textContent = 'エラー: 全項目を正しく入力してください (RMV, Fem > 1.0など)。';
		return;
	}

	// 安全停止水深 (5mを基準とする)
	const D_safety = 5;

	// 最大深度が安全停止水深を下回る場合のチェック (論理的なエラー回避のため)
	if (D_max <= D_safety) {
		errorMessage.textContent = '警告: 最大水深が安全停止水深 (5m) 以下です。計画を見直してください。';
		const M_Gas_safe = 30;
		const R_Gas_safe = 10;
		mGasResult.textContent = M_Gas_safe.toFixed(0);
		rGasResult.textContent = R_Gas_safe.toFixed(0);
		tGasResult.textContent = (M_Gas_safe + R_Gas_safe).toFixed(0);
		return;
	}

	// 2. M-Gas (Minimum Gas) の計算

	// 2.1. 緊急時総消費率 (RMV_Em)
	const RMV_Em = Fem * RMV;

	// 2.2. 浮上経路の平均絶対圧 (ATA_avg_asc)
	const D_avg_asc = (D_max + D_safety) / 2;
	const ATA_avg_asc = (D_avg_asc / 10) + 1;

	// 2.3. M-Gas 浮上・停止の総所要時間 (T_Total)
	// M-Gasは純粋な緊急浮上コストのため、T_moveは含めない
	const T_asc = (D_max - D_safety) / R_ascent;
	const T_emergency_buffer = 2; // 緊急時マージン時間 (2 min)
	const T_Total = T_asc + T_safety_stop + T_emergency_buffer;

	// 2.4. M-Gas (L) を計算し Bar に変換 (Turn Pressure Ruleに基づく計算値)
	const M_Gas_calculated = (ATA_avg_asc * T_Total * RMV_Em) / V_tank;

	// 2.5. M-Gas の最終値決定 (強制優先ロジックの適用)
	let M_Gas_final;
	let isPriorityApplied = false;

	if (!isNaN(P_M_priority) && P_M_priority > 0) {
		M_Gas_final = P_M_priority;
		isPriorityApplied = true;
	} else {
		M_Gas_final = M_Gas_calculated;
	}

	// 3. R-Gas (Return Gas) の計算

	// 3.1. 復路の総所要時間 (T_Return) - 水平移動時間 T_move を含む
	const T_Return_asc_stop = T_asc + T_safety_stop;
	const T_Return = T_Return_asc_stop + T_move; // T_moveを追加

	// 3.2. R-Gas (L) を計算し Bar に変換
	// 消費率は通常のRMV (RMV_Emではない) を使用
	const R_Gas_calculated = (ATA_avg_asc * T_Return * RMV) / V_tank;

	// 4. T-Gas (Turn Pressure) の最終計算
	const T_Gas_final = M_Gas_final + R_Gas_calculated;

	// 5. 結果表示
	mGasResult.textContent = Math.ceil(M_Gas_final).toFixed(0);
	rGasResult.textContent = Math.ceil(R_Gas_calculated).toFixed(0);
	tGasResult.textContent = Math.ceil(T_Gas_final).toFixed(0);

	// 詳細表示
	let mGasNote = isPriorityApplied ? `(固定値 ${P_M_priority.toFixed(0)} bar を強制)` : `(計算値 ${M_Gas_calculated.toFixed(0)} bar)`;
	mGasDetails.innerHTML = `
		<p>RMV_Em (緊急時総消費率): ${RMV_Em.toFixed(1)} L/min</p>
		<p>M-Gas 計算結果: ${M_Gas_calculated.toFixed(0)} bar</p>
		<p>最終M-Gas: ${Math.ceil(M_Gas_final).toFixed(0)} bar ${mGasNote}</p>
		<p>ATA_avg_asc (浮上平均圧): ${ATA_avg_asc.toFixed(2)} ATA</p>
	`;
	// R-Gasの詳細にT_moveの内訳を追加
	rGasDetails.innerHTML = `
		<p>T_Return (復路総所要時間): ${T_Return.toFixed(1)} min (浮上/停止: ${T_Return_asc_stop.toFixed(1)} min + 移動: ${T_move} min)</p>
	`;

	// P_startがT_Gasを下回る場合の警告
	if (P_start <= T_Gas_final) {
		errorMessage.textContent = '【危険】初期残圧が T-Gas を下回っています。計画は実行不可能です。';
		tGasResult.textContent = '要再計画';
	}
}

// イベントリスナー: 入力値が変わるたびに計算を実行
const inputs = document.querySelectorAll('input[type="number"], select');
inputs.forEach(input => {
	input.addEventListener('input', calculateGasPlan);
});

// 初回ロード時の計算実行
window.onload = calculateGasPlan;
