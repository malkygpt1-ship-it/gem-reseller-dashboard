import type { Product, VatBasis } from '../types'

export const UK_VAT_RATE = 0.2

const safe = (value: number | null | undefined) =>
  Number.isFinite(value) ? Math.max(0, Number(value)) : 0

export const costsFromLotExVat = (lotCostExVat: number, unitsPerLot: number) => {
  const lotEx = safe(lotCostExVat)
  const units = safe(unitsPerLot)
  const lotInc = lotEx * (1 + UK_VAT_RATE)
  return {
    lotCostExVat: lotEx,
    lotCostIncVat: lotInc,
    unitCostExVat: units > 0 ? lotEx / units : 0,
    unitCostIncVat: units > 0 ? lotInc / units : 0,
  }
}

export const productCosts = (product: Product, basis: VatBasis) => ({
  lot: basis === 'inc' ? product.lotCostIncVat : product.lotCostExVat,
  unit: basis === 'inc' ? product.unitCostIncVat : product.unitCostExVat,
})

export type ProfitInputs = {
  unitPurchaseCost: number
  salePrice: number
  ebayPercentageFee: number
  ebayFixedFee: number
  shippingCost: number
  packagingCost: number
  promotedListingPercentage?: number
  unitsPerLot: number
}

export type ProfitOutputs = {
  grossRevenuePerUnit: number
  totalFeesPerUnit: number
  netRevenuePerUnit: number
  profitPerUnit: number
  profitPerLot: number
  marginPercentage: number | null
  roiPercentage: number | null
  breakEvenSellingPrice: number
  expectedRevenuePerLot: number
}

/** Calculates resale returns without ever returning NaN or Infinity. */
export const calculateProfit = (input: ProfitInputs): ProfitOutputs => {
  const cost = safe(input.unitPurchaseCost)
  const sale = safe(input.salePrice)
  const percentage = safe(input.ebayPercentageFee) / 100
  const promoted = safe(input.promotedListingPercentage) / 100
  const fixedCosts =
    safe(input.ebayFixedFee) + safe(input.shippingCost) + safe(input.packagingCost)
  const percentageFees = sale * (percentage + promoted)
  const totalFees = percentageFees + safe(input.ebayFixedFee)
  const netRevenue = sale - totalFees - safe(input.shippingCost) - safe(input.packagingCost)
  const profit = netRevenue - cost
  const units = safe(input.unitsPerLot)
  const feeRate = Math.min(0.999, percentage + promoted)
  return {
    grossRevenuePerUnit: sale,
    totalFeesPerUnit: totalFees,
    netRevenuePerUnit: netRevenue,
    profitPerUnit: profit,
    profitPerLot: profit * units,
    marginPercentage: sale > 0 ? (profit / sale) * 100 : null,
    roiPercentage: cost > 0 ? (profit / cost) * 100 : null,
    breakEvenSellingPrice: (cost + fixedCosts) / (1 - feeRate),
    expectedRevenuePerLot: sale * units,
  }
}
