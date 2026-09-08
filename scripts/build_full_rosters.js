const fs = require('fs');

function calculatePlayerOvr(age, peakAge, peakOvr, peakDuration) {
  const safeAge = age || 25;
  const safePeakAge = peakAge || 27;
  const safePeakOvr = peakOvr || 75;
  const safePeakDuration = peakDuration || 5;

  const peakEndAge = safePeakAge + safePeakDuration - 1;

  if (safeAge >= safePeakAge && safeAge <= peakEndAge) {
    return safePeakOvr;
  } else if (safeAge < safePeakAge) {
    const yearsToPeak = safePeakAge - safeAge;
    const growthPenalty = Math.pow(yearsToPeak, 1.05) * 2.0;
    return Math.max(62, Math.round(safePeakOvr - growthPenalty));
  } else {
    const yearsPastPeak = safeAge - peakEndAge;
    const declinePenalty = Math.pow(yearsPastPeak, 1.22) * 2.4;
    return Math.max(60, Math.round(safePeakOvr - declinePenalty));
  }
}

console.log("Formula test Kobe (age 30, peak 27, peakOvr 98, duration 5):", calculatePlayerOvr(30, 27, 98, 5));
console.log("Formula test LeBron (age 24, peak 24, peakOvr 98, duration 9):", calculatePlayerOvr(24, 24, 98, 9));
console.log("Formula test Curry (age 20, peak 27, peakOvr 97, duration 6):", calculatePlayerOvr(20, 27, 97, 6));
console.log("Formula test Shaq (age 36, peak 28, peakOvr 98, duration 5):", calculatePlayerOvr(36, 28, 98, 5));
