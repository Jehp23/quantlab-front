import { jStat } from '@/lib/vendor/jstat-wrapper';

export function calculateBasicStats(returns) {
    const n = returns.length;
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1);
    const std = Math.sqrt(variance);
    const se = std / Math.sqrt(n);
    return { n, mean, std, variance, se };
}

export function calculateTTest(returns, confidenceLevel) {
    const { n, mean, std, se } = calculateBasicStats(returns);
    const tStat = mean / se;
    const df = n - 1;
    const pValue = 2 * (1 - jStat.studentt.cdf(Math.abs(tStat), df));
    const alpha = 1 - confidenceLevel;
    const tCrit = jStat.studentt.inv(1 - alpha / 2, df);
    const margin = tCrit * se;

    let evidence = "Sin evidencia";
    let evidenceLevel = "none";
    if (pValue < 0.01) { evidence = "Evidencia Fuerte"; evidenceLevel = "strong"; }
    else if (pValue < 0.05) { evidence = "Evidencia Moderada"; evidenceLevel = "moderate"; }
    else if (pValue < 0.10) { evidence = "Evidencia Débil"; evidenceLevel = "weak"; }

    return {
        n, mean, std, se, tStat, pValue, df,
        ciLow: mean - margin, ciHigh: mean + margin,
        rejectH0: pValue < alpha, evidence, evidenceLevel, alpha
    };
}

export function calculateVaR(returns) {
    const sorted = [...returns].sort((a, b) => a - b);
    const { n, mean, std } = calculateBasicStats(returns);

    const idx5 = Math.floor(0.05 * n);
    const idx1 = Math.floor(0.01 * n);
    const varHistorical5 = sorted[idx5];
    const varHistorical1 = sorted[idx1];

    const z95 = jStat.normal.inv(0.05, 0, 1);
    const z99 = jStat.normal.inv(0.01, 0, 1);
    const varParametric5 = mean + z95 * std;
    const varParametric1 = mean + z99 * std;

    const tail5 = sorted.filter(r => r <= varHistorical5);
    const cvar5 = tail5.length > 0 ? tail5.reduce((a, b) => a + b, 0) / tail5.length : varHistorical5;

    const tail1 = sorted.filter(r => r <= varHistorical1);
    const cvar1 = tail1.length > 0 ? tail1.reduce((a, b) => a + b, 0) / tail1.length : varHistorical1;

    return {
        varHistorical5, varHistorical1,
        varParametric5, varParametric1,
        cvar5, cvar1,
        worstDay: sorted[0],
        bestDay: sorted[n - 1],
        mean, std
    };
}

export function calculateNormality(returns) {
    const { n, mean, std } = calculateBasicStats(returns);
    const standardized = returns.map(r => (r - mean) / std);

    const skewness = standardized.reduce((a, b) => a + Math.pow(b, 3), 0) / n;
    const kurtosisExcess = standardized.reduce((a, b) => a + Math.pow(b, 4), 0) / n - 3;
    const jbStat = (n / 6) * (Math.pow(skewness, 2) + Math.pow(kurtosisExcess, 2) / 4);
    const pValue = 1 - jStat.chisquare.cdf(jbStat, 2);

    return { skewness, kurtosisExcess, jbStat, pValue, rejectNormality: pValue < 0.05 };
}

export function calculateRunsTest(returns) {
    const signs = returns.map(r => r >= 0 ? 1 : -1);
    const nPos = signs.filter(s => s > 0).length;
    const nNeg = signs.filter(s => s < 0).length;
    const n = nPos + nNeg;

    let runs = 1;
    for (let i = 1; i < signs.length; i++) {
        if (signs[i] !== signs[i - 1]) runs++;
    }

    const meanRuns = (2 * nPos * nNeg) / n + 1;
    const varRuns = (2 * nPos * nNeg * (2 * nPos * nNeg - n)) / (n * n * (n - 1));
    const stdRuns = Math.sqrt(Math.abs(varRuns));
    const zStat = (runs - meanRuns) / stdRuns;
    const pValue = 2 * (1 - jStat.normal.cdf(Math.abs(zStat), 0, 1));

    return { runs, nPos, nNeg, meanRuns, stdRuns, zStat, pValue, rejectRandomWalk: pValue < 0.05 };
}

export function calculateRollingVolatility(returns, window) {
    const result = new Array(window - 1).fill(null);
    for (let i = window; i <= returns.length; i++) {
        const slice = returns.slice(i - window, i);
        const mean = slice.reduce((a, b) => a + b, 0) / window;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (window - 1);
        result.push(Math.sqrt(variance));
    }
    return result;
}

export function calculatePerformance(returns) {
    const annualFactor = 252;
    const rfAnnual = 0.04;
    const { n, mean, std } = calculateBasicStats(returns);

    const annualReturn = mean * annualFactor;
    const annualVol = std * Math.sqrt(annualFactor);
    const sharpe = (annualReturn - rfAnnual) / annualVol;

    // Sortino: uses only downside deviation
    const rfDaily = rfAnnual / annualFactor;
    const downsideVariance = returns.reduce((a, r) => {
        const diff = r - rfDaily;
        return a + (diff < 0 ? diff * diff : 0);
    }, 0) / n;
    const sortino = (annualReturn - rfAnnual) / (Math.sqrt(downsideVariance) * Math.sqrt(annualFactor));

    // Cumulative returns & drawdown (log space)
    let cum = 0;
    let peak = 0;
    let maxDD = 0;
    const cumReturns = [];
    const drawdowns = [];

    for (const r of returns) {
        cum += r;
        if (cum > peak) peak = cum;
        const dd = cum - peak;
        if (dd < maxDD) maxDD = dd;
        cumReturns.push(+((Math.exp(cum) - 1) * 100).toFixed(4));
        drawdowns.push(+((Math.exp(dd) - 1) * 100).toFixed(4));
    }

    const maxDrawdownPct = (Math.exp(maxDD) - 1) * 100;
    const calmar = maxDD !== 0 ? annualReturn / Math.abs(maxDD) : Infinity;
    const totalReturn = (Math.exp(cum) - 1) * 100;

    return { annualReturn, annualVol, sharpe, sortino, calmar, maxDrawdownPct, cumReturns, drawdowns, totalReturn, rfAnnual };
}

export function calculateACF(returns, maxLag = 20) {
    const n = returns.length;
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const denom = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0);
    const ci = 1.96 / Math.sqrt(n);

    const acfData = Array.from({ length: maxLag }, (_, i) => {
        const lag = i + 1;
        let num = 0;
        for (let j = lag; j < n; j++) {
            num += (returns[j] - mean) * (returns[j - lag] - mean);
        }
        const acf = num / denom;
        return { lag, acf: +acf.toFixed(4), significant: Math.abs(acf) > ci };
    });

    // Ljung-Box Q statistic
    const q = n * (n + 2) * acfData.reduce((a, { lag, acf }) => a + (acf * acf) / (n - lag), 0);
    const sigLags = acfData.filter(d => d.significant).length;

    return { acfData, ci: +ci.toFixed(4), q: +q.toFixed(3), sigLags };
}

export function runMonteCarlo(returns, nDays, nPaths) {
    const { mean, std } = calculateBasicStats(returns);

    const paths = Array.from({ length: nPaths }, () => {
        const path = [0];
        for (let d = 0; d < nDays; d++) {
            let u = 0, v = 0;
            while (u === 0) u = Math.random();
            while (v === 0) v = Math.random();
            const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
            path.push(path[d] + mean + std * z);
        }
        return path;
    });

    const percentileData = Array.from({ length: nDays + 1 }, (_, day) => {
        const vals = paths.map(p => (Math.exp(p[day]) - 1) * 100).sort((a, b) => a - b);
        const at = (p) => vals[Math.max(0, Math.floor(p * nPaths) - 1)];
        return {
            day,
            p5:  +at(0.05).toFixed(2),
            p25: +at(0.25).toFixed(2),
            p50: +at(0.50).toFixed(2),
            p75: +at(0.75).toFixed(2),
            p95: +at(0.95).toFixed(2),
        };
    });

    const finalVals = paths.map(p => (Math.exp(p[nDays]) - 1) * 100);
    const probPositive = +(finalVals.filter(v => v > 0).length / nPaths * 100).toFixed(1);
    const probLoss10   = +(finalVals.filter(v => v < -10).length / nPaths * 100).toFixed(1);

    return { percentileData, probPositive, probLoss10, mean, std, nDays, nPaths };
}

export function calculateMonthlyReturns(returns, dates) {
    if (!dates || dates.length !== returns.length) return null;

    const monthly = {};
    dates.forEach((date, i) => {
        const [year, month] = date.split('-');
        const key = `${year}-${month}`;
        if (!monthly[key]) monthly[key] = { year, month: parseInt(month), sum: 0 };
        monthly[key].sum += returns[i];
    });

    return Object.values(monthly).map(m => ({
        year: m.year,
        month: m.month,
        ret: +((Math.exp(m.sum) - 1) * 100).toFixed(2),
    }));
}

export function calculateCorrelation(returnsX, returnsY) {
    const n = Math.min(returnsX.length, returnsY.length);
    const x = returnsX.slice(0, n);
    const y = returnsY.slice(0, n);

    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let cov = 0, varX = 0, varY = 0;
    for (let i = 0; i < n; i++) {
        cov += (x[i] - meanX) * (y[i] - meanY);
        varX += Math.pow(x[i] - meanX, 2);
        varY += Math.pow(y[i] - meanY, 2);
    }
    cov /= n;
    varX /= n;
    varY /= n;

    const stdX = Math.sqrt(varX);
    const stdY = Math.sqrt(varY);
    const pearson = cov / (stdX * stdY);
    const r2 = Math.pow(pearson, 2);
    const beta = cov / varY;
    const alpha = meanX - beta * meanY;

    return { pearson, r2, beta, alpha, n, meanX, meanY, stdX, stdY };
}
