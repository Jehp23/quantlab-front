const PERIOD_MAP = {
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  "1Y": "1y",
  "2Y": "2y",
  "5Y": "5y",
};

export function mapPeriod(period) {
  return PERIOD_MAP[period] ?? "6mo";
}

export function historicalToLogReturns(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return { returns: [], dates: [] };
  }

  const returns = [];
  const dates = [];

  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1]?.close;
    const curr = points[i]?.close;
    const date = points[i]?.date;

    if (!prev || !curr || !date || prev <= 0 || curr <= 0) {
      continue;
    }

    returns.push(Math.log(curr / prev));
    dates.push(date);
  }

  return { returns, dates };
}

export function alignByDate(primaryPoints, secondaryPoints) {
  const secondaryMap = new Map(
    (secondaryPoints ?? []).map((point) => [point.date, point.close]),
  );

  const paired = [];
  for (let i = 1; i < (primaryPoints ?? []).length; i += 1) {
    const prevPrimary = primaryPoints[i - 1];
    const currPrimary = primaryPoints[i];
    const prevSecondary = secondaryMap.get(primaryPoints[i - 1]?.date);
    const currSecondary = secondaryMap.get(currPrimary?.date);

    if (
      !prevPrimary?.close ||
      !currPrimary?.close ||
      !prevSecondary ||
      !currSecondary ||
      prevPrimary.close <= 0 ||
      currPrimary.close <= 0 ||
      prevSecondary <= 0 ||
      currSecondary <= 0
    ) {
      continue;
    }

    paired.push({
      date: currPrimary.date,
      returns1: Math.log(currPrimary.close / prevPrimary.close),
      returns2: Math.log(currSecondary / prevSecondary),
    });
  }

  return {
    dates: paired.map((item) => item.date),
    returns1: paired.map((item) => item.returns1),
    returns2: paired.map((item) => item.returns2),
  };
}
