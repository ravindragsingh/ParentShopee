// Shared "for learning only" finance math used by the Future-Ready interactive
// widgets -- simplified, fixed-rate projections, not real return predictions.

export function futureValue(startAmount, monthlyAmount, annualRate, years) {
  const months = years * 12
  const monthlyRate = annualRate / 12
  const growthOnStart = startAmount * Math.pow(1 + monthlyRate, months)
  const growthOnContributions = monthlyRate === 0
    ? monthlyAmount * months
    : monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  return growthOnStart + growthOnContributions
}

export function formatMoney(n) {
  return '$' + Math.round(n).toLocaleString('en-US')
}
