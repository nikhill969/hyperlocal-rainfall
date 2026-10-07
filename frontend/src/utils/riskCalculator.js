export function calculateRisk({ rainfall = 0, elevation = 450, terrain = 'Moderate', citizenReports = 0 }) {
  const rainfallScore = Math.min(40, Math.max(0, rainfall * 0.85));
  const elevationScore = Math.min(20, Math.max(0, (500 - elevation) / 25));
  const terrainScoreMap = {
    Flat: 15,
    Moderate: 10,
    Hilly: 5,
    Steep: 2
  };

  const terrainScore = terrainScoreMap[terrain] || 10;
  const drainageScore = 8 + Math.min(7, citizenReports * 0.6);
  const citizenScore = Math.min(10, citizenReports * 1.2);

  const total = Math.min(100, Math.round(rainfallScore + elevationScore + terrainScore + drainageScore + citizenScore));

  let level = 'LOW';
  if (total >= 76) level = 'VERY HIGH';
  else if (total >= 51) level = 'HIGH';
  else if (total >= 26) level = 'MODERATE';

  return {
    score: total,
    level,
    rainfallScore: Math.round(rainfallScore),
    elevationScore: Math.round(elevationScore),
    terrainScore,
    drainageScore: Math.round(drainageScore),
    citizenScore: Math.round(citizenScore),
    note: 'Prototype rule-based calculation. Thresholds are educational assumptions, not universal scientific thresholds.'
  };
}

