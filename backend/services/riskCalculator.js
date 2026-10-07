function calculateRiskScore({ rainfall = 0, elevation = 400, terrain = 'Moderate', drainage = 40, citizenReports = 0 }) {
  const rainfallScore = Math.min(40, Math.max(0, rainfall * 0.85));
  const elevationScore = Math.min(20, Math.max(0, (500 - elevation) / 25));
  const terrainScoreMap = {
    Flat: 15,
    Moderate: 10,
    Hilly: 5,
    Steep: 2
  };
  const terrainScore = terrainScoreMap[terrain] || 10;
  const drainageScore = Math.min(15, Math.max(0, 15 - drainage / 10));
  const citizenScore = Math.min(10, Math.max(0, citizenReports * 1.5));

  const score = Math.min(100, Math.max(0, rainfallScore + elevationScore + terrainScore + drainageScore + citizenScore));

  let riskLevel = 'LOW';
  if (score >= 76) riskLevel = 'VERY HIGH';
  else if (score >= 51) riskLevel = 'HIGH';
  else if (score >= 26) riskLevel = 'MODERATE';

  return {
    score: Math.round(score),
    level: riskLevel,
    rainfallScore: Math.round(rainfallScore),
    elevationScore: Math.round(elevationScore),
    terrainScore: terrainScore,
    drainageScore: Math.round(drainageScore),
    citizenScore: Math.round(citizenScore),
    note: 'Prototype rule-based environmental risk scoring for educational use only. Thresholds are not universal scientific thresholds.'
  };
}

module.exports = {
  calculateRiskScore
};
