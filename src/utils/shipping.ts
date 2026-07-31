export type ParcelMeasurements = {
  lengthCm: number | null
  widthCm: number | null
  depthCm: number | null
  weightKg: number | null
}

export type RoyalMailFormat = 'Large Letter' | 'Small Parcel' | 'Medium Parcel'
export type RoyalMailRate = {
  id: string
  service: string
  format: RoyalMailFormat
  maxWeightKg: number
  maxLengthCm: number
  maxWidthCm: number
  maxDepthCm: number
  onlinePrice: number
}

// Royal Mail online "from" prices effective 7 April 2026.
// Prices are kept in one editable table because Royal Mail updates them periodically.
export const ROYAL_MAIL_RATES: RoyalMailRate[] = [
  { id: 'tracked-48-large-letter', service: 'Tracked 48', format: 'Large Letter', maxWeightKg: 1, maxLengthCm: 35.3, maxWidthCm: 25, maxDepthCm: 2.5, onlinePrice: 2.85 },
  { id: 'tracked-48-small-parcel', service: 'Tracked 48', format: 'Small Parcel', maxWeightKg: 2, maxLengthCm: 45, maxWidthCm: 35, maxDepthCm: 16, onlinePrice: 3.65 },
  { id: 'tracked-48-medium-parcel', service: 'Tracked 48', format: 'Medium Parcel', maxWeightKg: 20, maxLengthCm: 61, maxWidthCm: 46, maxDepthCm: 46, onlinePrice: 5.55 },
  { id: 'tracked-24-large-letter', service: 'Tracked 24', format: 'Large Letter', maxWeightKg: 1, maxLengthCm: 35.3, maxWidthCm: 25, maxDepthCm: 2.5, onlinePrice: 3.80 },
  { id: 'tracked-24-small-parcel', service: 'Tracked 24', format: 'Small Parcel', maxWeightKg: 2, maxLengthCm: 45, maxWidthCm: 35, maxDepthCm: 16, onlinePrice: 4.65 },
  { id: 'tracked-24-medium-parcel', service: 'Tracked 24', format: 'Medium Parcel', maxWeightKg: 20, maxLengthCm: 61, maxWidthCm: 46, maxDepthCm: 46, onlinePrice: 6.55 },
  { id: 'second-class-large-letter', service: '2nd Class', format: 'Large Letter', maxWeightKg: .75, maxLengthCm: 35.3, maxWidthCm: 25, maxDepthCm: 2.5, onlinePrice: 1.55 },
  { id: 'second-class-small-parcel', service: '2nd Class', format: 'Small Parcel', maxWeightKg: 2, maxLengthCm: 45, maxWidthCm: 35, maxDepthCm: 16, onlinePrice: 3.95 },
  { id: 'second-class-medium-parcel', service: '2nd Class', format: 'Medium Parcel', maxWeightKg: 20, maxLengthCm: 61, maxWidthCm: 46, maxDepthCm: 46, onlinePrice: 6.25 },
  { id: 'first-class-large-letter', service: '1st Class', format: 'Large Letter', maxWeightKg: .75, maxLengthCm: 35.3, maxWidthCm: 25, maxDepthCm: 2.5, onlinePrice: 3.20 },
  { id: 'first-class-small-parcel', service: '1st Class', format: 'Small Parcel', maxWeightKg: 2, maxLengthCm: 45, maxWidthCm: 35, maxDepthCm: 16, onlinePrice: 5.15 },
  { id: 'first-class-medium-parcel', service: '1st Class', format: 'Medium Parcel', maxWeightKg: 20, maxLengthCm: 61, maxWidthCm: 46, maxDepthCm: 46, onlinePrice: 7.35 },
]

const fitsDimensions = (measurements: ParcelMeasurements, rate: RoyalMailRate) => {
  const dimensions = [measurements.lengthCm, measurements.widthCm, measurements.depthCm]
  if (dimensions.some(value => value == null) || measurements.weightKg == null) return false
  const actual = dimensions.map(Number).sort((a, b) => b - a)
  const limits = [rate.maxLengthCm, rate.maxWidthCm, rate.maxDepthCm].sort((a, b) => b - a)
  return measurements.weightKg <= rate.maxWeightKg && actual.every((value, index) => value <= limits[index])
}

export const eligibleRoyalMailRates = (measurements: ParcelMeasurements) =>
  ROYAL_MAIL_RATES.filter(rate => fitsDimensions(measurements, rate))
    .sort((a, b) => a.onlinePrice - b.onlinePrice)
