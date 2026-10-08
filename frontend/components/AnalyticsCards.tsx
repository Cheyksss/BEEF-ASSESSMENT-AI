"use client"

import React from "react"
import { AnalyticsData } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Award, Layers, ShieldCheck, CheckCircle2, TrendingUp } from "lucide-react"

interface AnalyticsCardsProps {
  stats: AnalyticsData
}

export function AnalyticsCards({ stats }: AnalyticsCardsProps) {
  const { total_assessments, average_mqs, freshness_distribution, marbling_distribution } = stats

  // Most common marbling grade
  const marblingEntries = Object.entries(marbling_distribution)
  marblingEntries.sort((a, b) => b[1] - a[1])
  const topMarbling = total_assessments > 0 ? marblingEntries[0][0] : "None"

  const freshPercent = total_assessments > 0
    ? Math.round((freshness_distribution.Fresh / total_assessments) * 100)
    : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Assessments */}
      <Card className="border border-border/80 bg-card/80 backdrop-blur-md shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Evaluations
          </CardTitle>
          <TrendingUp className="w-4 h-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">{total_assessments}</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Total cuts processed through pipeline
          </p>
        </CardContent>
      </Card>

      {/* Average MQS */}
      <Card className="border border-border/80 bg-card/80 backdrop-blur-md shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Mean MQS Score
          </CardTitle>
          <Award className="w-4 h-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black">
            {average_mqs.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">/ 100</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Across all valid assessments
          </p>
        </CardContent>
      </Card>

      {/* Fresh Ratio */}
      <Card className="border border-border/80 bg-card/80 backdrop-blur-md shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Freshness Rate
          </CardTitle>
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black text-emerald-500">{freshPercent}%</div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {freshness_distribution.Fresh} fresh vs {freshness_distribution.Spoiled} spoiled
          </p>
        </CardContent>
      </Card>

      {/* Top Marbling Grade */}
      <Card className="border border-border/80 bg-card/80 backdrop-blur-md shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Primary Marbling
          </CardTitle>
          <Layers className="w-4 h-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-black capitalize">
            {topMarbling.replace("_", " ")}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            Most frequent IMF lipid class
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
