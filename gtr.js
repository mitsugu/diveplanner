// 要素の取得
const pReserveInput = document.getElementById('p_reserve');
const pFillInput = document.getElementById('p_fill'); 
const vTankInput = document.getElementById('v_tank');
const rmvInput = document.getElementById('rmv');
const pCurrentInput = document.getElementById('p_current');
const dCurrentInput = document.getElementById('d_current');
const rAscentInput = document.getElementById('r_ascent');
const tStopInput = document.getElementById('t_stop');

const gtrResult = document.getElementById('GTR_Result');
const vUsedResult = document.getElementById('V_used_Result');
const pUsedResult = document.getElementById('P_used_Result');
const vAscentResult = document.getElementById('V_ascent_Result');
const pAscentResult = document.getElementById('P_ascent_Result');
const rateDepthResult = document.getElementById('Rate_depth_Result');
const gtrWarning = document.getElementById('GTR_Warning');

function calculateGTR() {
    // 1. データ取得
    const p_reserve = parseFloat(pReserveInput.value);
    const p_fill = parseFloat(pFillInput.value);
    const v_tank = parseFloat(vTankInput.value);
    const rmv = parseFloat(rmvInput.value);
    const p_current = parseFloat(pCurrentInput.value);
    const d_current = parseFloat(dCurrentInput.value);
    const r_ascent = parseFloat(rAscentInput.value);
    const t_stop = parseFloat(tStopInput.value);

    // バリデーション
    if ([p_reserve, p_fill, v_tank, rmv, p_current, d_current, r_ascent, t_stop].some(isNaN) || v_tank <= 0 || rmv <= 0 || r_ascent <= 0) {
        gtrResult.textContent = '---';
        vUsedResult.textContent = '---';
        pUsedResult.textContent = '---';
        vAscentResult.textContent = '---';
        pAscentResult.textContent = '---';
        rateDepthResult.textContent = '---';
        gtrWarning.classList.add('hidden');
        return;
    }

    // 2. これまでに消費したガス量の計算
    const p_used = Math.max(0, p_fill - p_current); // 念のためマイナス防止
    const v_used = p_used * v_tank;

    // 3. 浮上に必要なガス量の計算
    // 浮上移動時間 = 現在水深 / 最大浮上速度
    const t_travel = d_current / r_ascent;
    
    // 浮上中の平均水深 (簡易的に現在水深の半分とする)
    const d_avg_ascent = d_current / 2;
    const ata_avg_ascent = (d_avg_ascent / 10) + 1;

    // 移動中の消費ガス量 (L)
    const v_travel = t_travel * rmv * ata_avg_ascent;

    // 安全停止中の消費ガス量 (L) - 水深5m (1.5 ATA) と仮定
    let v_stop = 0;
    if (d_current >= 5) {
        v_stop = t_stop * rmv * 1.5;
    }

    // 浮上に必要な総ガス量 (L) と 圧力 (bar)
    const v_ascent_total = v_travel + v_stop;
    const p_ascent = v_ascent_total / v_tank;

    // 4. 現在水深での消費率 (L/min) の計算
    const ata_current = (d_current / 10) + 1;
    const rate_depth = rmv * ata_current;

    // 5. 利用可能なガスと GTR の計算
    // 利用可能な圧力 = 現在の残圧 - (水面到達時予備圧 + 浮上に必要な圧力)
    const p_usable = p_current - p_reserve - p_ascent;
    
    // 利用可能なガス量 (L) = 利用可能な圧力 * タンク容量
    const v_usable = p_usable * v_tank;

    // GTR (min) = 利用可能なガス量 / 現在水深での消費率
    const gtr = v_usable / rate_depth;

    // 6. 結果の表示
    vUsedResult.textContent = v_used.toFixed(1);
    pUsedResult.textContent = p_used.toFixed(1);
    
    vAscentResult.textContent = v_ascent_total.toFixed(1);
    pAscentResult.textContent = p_ascent.toFixed(1);
    rateDepthResult.textContent = rate_depth.toFixed(1);

    // クラスのリセット
    gtrResult.className = '';
    gtrWarning.classList.add('hidden');

    if (gtr <= 0) {
        // 既に限界を超えている場合
        gtrResult.textContent = '0.0';
        gtrResult.classList.add('danger');
        gtrWarning.classList.remove('hidden');
    } else {
        gtrResult.textContent = gtr.toFixed(1);
        if (gtr <= 5) {
            // 残り5分以下は警告色
            gtrResult.classList.add('caution');
        } else {
            gtrResult.classList.add('safe');
        }
    }
}

// 初回実行
window.onload = calculateGTR;
