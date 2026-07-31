export type VatBasis = 'inc' | 'ex'
export type OpportunityStatus = 'Buy' | 'Review' | 'Avoid' | 'Unresearched'
export type StockStatus = 'in_stock' | 'out_of_stock' | 'unknown'
export type ConfidenceLabel = 'Very low' | 'Low' | 'Moderate' | 'High' | 'Very high'

export type PriceHistory = {
  id: string
  productId: string
  recordedAt: string
  lotCostExVat: number
  lotCostIncVat: number
  unitCostExVat: number
  unitCostIncVat: number
  stockStatus: StockStatus
}

export type EbayResearch = {
  productId: string
  expectedSellingPrice: number | null
  averageSoldPrice: number | null
  lowestSoldPrice: number | null
  highestSoldPrice: number | null
  recentSoldCount: number | null
  activeListingCount: number | null
  estimatedSellThroughRate: number | null
  soldPriceCoefficientOfVariation?: number | null
  confidenceScore: number | null
  confidenceLabel: ConfidenceLabel | null
  researchedAt: string | null
  researchNotes: string
}

export type Product = {
  id: string
  title: string
  imageUrl: string | null
  gemUrl: string
  gemSku: string | null
  category: string | null
  description: string
  unitsPerLot: number
  lotCostExVat: number
  lotCostIncVat: number
  unitCostExVat: number
  unitCostIncVat: number
  packagedLengthCm: number | null
  packagedWidthCm: number | null
  packagedDepthCm: number | null
  packagedWeightKg: number | null
  stockStatus: StockStatus
  importedAt: string
  updatedAt: string
  opportunityStatus: OpportunityStatus
  notes: string
  research: EbayResearch | null
  priceHistory: PriceHistory[]
}

export type PlannerItem = {
  productId: string
  lotQuantity: number
  selected: boolean
  createdAt: string
}
