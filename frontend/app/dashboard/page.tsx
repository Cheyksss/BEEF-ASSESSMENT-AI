"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { AnalyticsCards } from "@/components/AnalyticsCards"
import { DistributionCharts } from "@/components/DistributionCharts"
import { useAuthContext } from "@/contexts/AuthContext"
import { fetchUserAssessments } from "@/lib/queries"
import { aggregateAnalyticsData } from "@/lib/analytics"
import { AnalyticsData, Assessment } from "@/types"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, PlusCircle, History, RefreshCw, AlertCircle, Beef } from "lucide-react"

export default function DashboardPage() {
  const { user } = useAuthContext()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [stats, setStats] = useState<AnalyticsData>({
    total_assessments: 0,
    average_mqs: 0,
    freshness_distribution: { Fresh: 0, Spoiled: 0 },
    marbling_distribution: {
      small: 0,
      slight: 0,
      modest: 0,
      moderate: 0,
      slightly_abundant: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUserAssessments(user?.id)
      setAssessments(data)
      const aggregated = aggregateAnalyticsData(data)
      setStats(aggregated)
    } catch (err: any) {
      setError(err?.message || "Failed to load dashboard metrics.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Intelligence & Quality Analytics
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Quality Assessment Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time aggregation of MQS scores, marbling distributions, and microbial freshness ratios.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="gap-2 rounded-xl text-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync
            </Button>
            <Link href="/assess">
              <Button
                type="button"
                size="sm"
                className="gap-2 rounded-xl text-xs bg-red-600 hover:bg-red-700 text-white shadow-md"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Assessment
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="min-h-[350px] flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground animate-pulse">Aggregating quality statistics...</p>
          </div>
        ) : (
          <div className="space-y-8">
            <AnalyticsCards stats={stats} />
            <DistributionCharts stats={stats} />

            {/* Quick Actions & Recent History preview */}
            <div className="p-6 rounded-3xl border border-border bg-card/60 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-bold text-foreground text-base">Explore Historical Logs</h3>
                <p className="text-xs text-muted-foreground">
                  View complete individual cut evaluations, raw HSV masks, and high-resolution captures.
                </p>
              </div>
              <Link href="/history">
                <Button variant="secondary" className="rounded-xl gap-2 text-xs font-semibold">
                  <History className="w-4 h-4" />
                  View History Archive ({assessments.length})
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
