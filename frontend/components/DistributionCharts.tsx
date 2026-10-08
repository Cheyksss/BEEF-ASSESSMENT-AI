"use client"

import React from "react"
import { AnalyticsData } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, BarChart2 } from "lucide-react"

interface DistributionChartsProps {
  stats: AnalyticsData
}

export function DistributionCharts({ stats }: DistributionChartsProps) {
  const { total_assessments, freshness_distribution, marbling_distribution } = stats

  const marblingLabels: Record<string, string> = {
    small: "Small (10 pts)",
    slight: "Slight (15 pts)",
    modest: "Modest (20 pts)",
    moderate: "Moderate (25 pts)",
    slightly_abundant: "Slightly Abundant (30 pts)",
  }

  const freshCount = freshness_distribution.Fresh
  const spoiledCount = freshness_distribution.Spoiled
  const freshPct = total_assessments > 0 ? (freshCount / total_assessments) * 100 : 0
  const spoiledPct = total_assessments > 0 ? (spoiledCount / total_assessments) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Freshness Distribution Card */}
      <Card className="border border-border/80 bg-card/80 backdrop-blur-md shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-primary" />
              Freshness Distribution
            </CardTitle>
            <span className="text-xs text-muted-foreground">{total_assessments} Total Samples</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-full rounded-full bg-muted overflow-hidden flex">
            <div
              style={{ width: `${freshPct}%` }}
              className="h-full bg-emerald-500 transition-all duration-500"
              title={`Fresh: ${freshPct.toFixed(1)}%`}
            />
            <div
              style={{ width: `${spoiledPct}%` }}
              className="h-full bg-red-500 transition-all duration-500"
              title={`Spoiled: ${spoiledPct.toFixed(1)}%`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Fresh
              </div>
              <div className="text-xl font-bold mt-1 text-foreground">{freshCount}</div>
              <div className="text-[11px] text-muted-foreground">{freshPct.toFixed(1)}%</div>
            </div>

            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-red-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                Spoiled
              </div>
              <div className="text-xl font-bold mt-1 text-foreground">{spoiledCount}</div>
              <div className="text-[11px] text-muted-foreground">{spoiledPct.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Marbling Grade Distribution Card */}
      <Card className="border border-border/80 bg-card/80 backdrop-blur-md shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-amber-500" />
              Marbling Grade Breakdown
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(marbling_distribution).map(([key, count]) => {
            const pct = total_assessments > 0 ? (count / total_assessments) * 100 : 0
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground capitalize">{marblingLabels[key] || key}</span>
                  <span className="text-muted-foreground">
                    {count} ({pct.toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
