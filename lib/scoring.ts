export type OperatorTier = 'scout' | 'operator' | 'strategist' | 'partner' | 'syndicate'

export function calcFoundryScore(
  totalCapitalIn: number,
  totalCapitalOut: number,
  reliabilityScore: number,
  playCount: number
): number {
  const roi = totalCapitalIn > 0
    ? ((totalCapitalOut - totalCapitalIn) / totalCapitalIn) * 100
    : 0
  return Math.round((roi * 0.35) + (reliabilityScore * 0.35) + Math.min(playCount * 3, 30))
}

export function calcRoi(capitalIn: number, capitalOut: number): number {
  if (capitalIn === 0) return 0
  return Math.round(((capitalOut - capitalIn) / capitalIn) * 100)
}

export const TIER_ALLOCATIONS = {
  scout: 100,
  operator: 500,
  strategist: 2500,
  partner: 10000,
  syndicate: null,
} as const

export const PROFIT_SPLITS = {
  scout:      { operator: 0.50, foundry: 0.50 },
  operator:   { operator: 0.55, foundry: 0.45 },
  strategist: { operator: 0.60, foundry: 0.40 },
  partner:    { operator: 0.65, foundry: 0.35 },
  syndicate:  { operator: null, foundry: null },
} as const

export function calcSplit(netProfit: number, tier: keyof typeof PROFIT_SPLITS) {
  const split = PROFIT_SPLITS[tier]
  if (!split.operator) return null
  return {
    operator: Math.round(netProfit * split.operator * 100) / 100,
    foundry:  Math.round(netProfit * (split.foundry as number) * 100) / 100,
  }
}