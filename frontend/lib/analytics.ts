import { Assessment, AnalyticsData } from "@/types"

export function calculateTotalAssessments(assessments: Assessment[]): number {
  return assessments.length
}

export function calculateAverageMQS(assessments: Assessment[]): number {
  if (assessments.length === 0) return 0
  const sum = assessments.reduce(
    (acc, curr) => acc + Number(curr.meat_quality_score),
    0
  )
  return Math.round((sum / assessments.length) * 10) / 10
}

export function calculateFreshnessDistribution(assessments: Assessment[]): {
  Fresh: number
  Spoiled: number
} {
  const dist = { Fresh: 0, Spoiled: 0 }
  assessments.forEach((a) => {
    if (a.freshness === "Fresh") dist.Fresh++
    else if (a.freshness === "Spoiled") dist.Spoiled++
  })
  return dist
}

export function calculateMarblingDistribution(assessments: Assessment[]): {
  small: number
  slight: number
  modest: number
  moderate: number
  slightly_abundant: number
} {
  const dist = {
    small: 0,
    slight: 0,
    modest: 0,
    moderate: 0,
    slightly_abundant: 0,
  }
  assessments.forEach((a) => {
    const key = a.marbling as keyof typeof dist
    if (dist[key] !== undefined) {
      dist[key]++
    }
  })
  return dist
}

export function aggregateAnalyticsData(assessments: Assessment[]): AnalyticsData {
  return {
    total_assessments: calculateTotalAssessments(assessments),
    average_mqs: calculateAverageMQS(assessments),
    freshness_distribution: calculateFreshnessDistribution(assessments),
    marbling_distribution: calculateMarblingDistribution(assessments),
  }
}
