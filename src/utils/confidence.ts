import type { ConfidenceLabel, EbayResearch } from '../types'

export type ConfidenceResult = {
  score: number | null
  label: ConfidenceLabel | null
  reason?: 'insufficient_data'
}

export const confidenceLabel = (score: number): ConfidenceLabel => {
  if (score < 25) return 'Very low'
  if (score < 50) return 'Low'
  if (score < 70) return 'Moderate'
  if (score < 85) return 'High'
  return 'Very high'
}

/**
 * Evidence-weighted eBay confidence score.
 * A score is withheld unless sold count, research date, active competition,
 * sell-through and price-consistency evidence are all present.
 */
export const calculateConfidence = (
  research: Pick<
    EbayResearch,
    | 'recentSoldCount'
    | 'activeListingCount'
    | 'estimatedSellThroughRate'
    | 'soldPriceCoefficientOfVariation'
    | 'researchedAt'
  >,
  now = new Date(),
): ConfidenceResult => {
  const { recentSoldCount, activeListingCount, estimatedSellThroughRate, soldPriceCoefficientOfVariation, researchedAt } = research
  if (
    recentSoldCount == null ||
    activeListingCount == null ||
    estimatedSellThroughRate == null ||
    soldPriceCoefficientOfVariation == null ||
    !researchedAt
  ) return { score: null, label: null, reason: 'insufficient_data' }

  const ageDays = Math.max(0, (now.getTime() - new Date(researchedAt).getTime()) / 86_400_000)
  const sample = Math.min(30, recentSoldCount) / 30 * 30
  const recency = Math.max(0, 20 - ageDays / 4.5)
  const consistency = Math.max(0, 20 - soldPriceCoefficientOfVariation * 40)
  const competition = Math.max(0, 10 - activeListingCount / Math.max(1, recentSoldCount) * 5)
  const sellThrough = Math.min(100, Math.max(0, estimatedSellThroughRate)) / 100 * 20
  const score = Math.round(Math.min(100, Math.max(0, sample + recency + consistency + competition + sellThrough)))
  return { score, label: confidenceLabel(score) }
}
