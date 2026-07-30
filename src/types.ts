export type Product = {
  id: string; title: string; sku: string; category: string; image: string;
  productUrl: string; description: string; units: number; lotEx: number;
  available: boolean; importedAt: string; updatedAt: string; soldAvg: number;
  soldHigh: number; soldLow: number; soldCount: number; sellThrough: number;
  researchedAt?: string; note?: string; history: { date: string; lotEx: number; available: boolean }[];
}

export type PlannerItem = { productId: string; lots: number }
