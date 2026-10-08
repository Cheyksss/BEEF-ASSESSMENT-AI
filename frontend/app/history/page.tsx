"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { HistoryTable } from "@/components/HistoryTable"
import { useAuthContext } from "@/contexts/AuthContext"
import { fetchUserAssessments, deleteAssessment } from "@/lib/queries"
import { Assessment } from "@/types"
import { Button } from "@/components/ui/button"
import { History, PlusCircle, RefreshCw, AlertCircle, Beef } from "lucide-react"

export default function HistoryPage() {
  const { user } = useAuthContext()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchUserAssessments(user?.id)
      setAssessments(data)
    } catch (err: any) {
      setError(err?.message || "Failed to load assessment history.")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this evaluation record?")) return
    try {
      await deleteAssessment(id)
      setAssessments((prev) => prev.filter((item) => item.id !== id))
    } catch (err: any) {
      alert(`Delete error: ${err.message}`)
    }
  }

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold">
              <History className="w-3.5 h-3.5" />
              Historical Evaluation Records
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Assessment History
            </h1>
            <p className="text-sm text-muted-foreground">
              Review past beef quality assessments, MQS scores, and classifications.
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
              Refresh
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
          <div className="min-h-[300px] flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground animate-pulse">Loading assessments...</p>
          </div>
        ) : assessments.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4 bg-muted/10">
            <div className="w-14 h-14 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center mx-auto">
              <Beef className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">No assessments recorded yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Capture or upload your first cut of beef to calculate Meat Quality Scores and view detailed breakdown reports.
              </p>
            </div>
            <Link href="/assess">
              <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white rounded-xl">
                Assess Your First Cut
              </Button>
            </Link>
          </div>
        ) : (
          <HistoryTable assessments={assessments} onDelete={handleDelete} />
        )}
      </div>
    </ProtectedRoute>
  )
}
