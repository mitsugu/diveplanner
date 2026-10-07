// 主要な入力要素の取得
const pStartInput = document.getElementById('p_start');
const pEndInput = document.getElementById('p_end');
const vTankInput = document.getElementById('v_tank');
const tDiveInput = document.getElementById('t_dive');
const dAvgInput = document.getElementById('d_avg');

// 結果表示要素の取得
const pUsedResult = document.getElementById('p_used_result');
const vUsedResult = document.getElementById('v_used_result');
const ataAvgResult = document.getElementById('ata_avg_result');
const rmvResult = document.getElementById('rmv_result');

// RMV計算関数
function calculateRmv() {
	// 1. データ取得と数値変換
	const P_start = parseFloat(pStartInput.value);
	const P_end = parseFloat(pEndInput.value);
	const V_tank = parseFloat(vTankInput.value);
	const T_dive = parseFloat(tDiveInput.value);
	const D_avg = parseFloat(dAvgInput.value);

	// 入力値のバリデーション（潜水時間とタンク容量、平均水深は正の値でなければならない）
	if (isNaN(P_start) || isNaN(P_end) || isNaN(V_tank) || isNaN(T_dive) || isNaN(D_avg) || V_tank <= 0 || T_dive <= 0 || D_avg < 0 || P_start <= P_end) {
		pUsedResult.textContent = '---';
		vUsedResult.textContent = '---';
		ataAvgResult.textContent = '---';
		rmvResult.textContent = 'エラー: 入力値を確認してください';
		return;
	}

	// 2. 計算ステップの実行
	// a) 消費圧力 (P_used) の計算: P_used = P_start - P_end
	const P_used = P_start - P_end;
	pUsedResult.textContent = P_used.toFixed(0);

	// b) 消費空気量 (V_used) の計算: V_used = P_used * V_tank
	const V_used = P_used * V_tank;
	vUsedResult.textContent = V_used.toFixed(0);

	// c) 平均水深の絶対圧 (ATA_avg) の計算: ATA = (D_avg / 10) + 1
	const ATA_avg = (D_avg / 10) + 1;
	ataAvgResult.textContent = ATA_avg.toFixed(2);

	// d) RMV の計算: RMV = V_used / (ATA_avg * T_dive)
	const RMV = V_used / (ATA_avg * T_dive);

	// 3. 結果表示
	rmvResult.textContent = RMV.toFixed(1); // RMVを小数点第1位まで表示
}

// イベントリスナー: 入力値が変わるたびに計算を実行
const inputs = document.querySelectorAll('input[type="number"]');
inputs.forEach(input => {
	input.addEventListener('input', calculateRmv);
});

// 初回ロード時の計算実行
window.onload = calculateRmv;
