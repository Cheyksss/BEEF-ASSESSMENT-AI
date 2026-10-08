"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ResultsDisplay } from "@/components/ResultsDisplay"
import { fetchAssessmentById } from "@/lib/queries"
import { Assessment, PredictionResponse } from "@/types"
import { Button } from "@/components/ui/button"
import { ChevronLeft, AlertCircle, Beef } from "lucide-react"

export default function AssessmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchRecord = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAssessmentById(id)
        if (!data) {
          setError("Assessment record not found.")
        } else {
          setAssessment(data)
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load assessment details.")
      } finally {
        setLoading(false)
      }
    }

    fetchRecord()
  }, [id])

  // Convert Assessment to PredictionResponse schema for ResultsDisplay
  const mappedResults: PredictionResponse | null = assessment
    ? {
        freshness: assessment.freshness as any,
        freshness_confidence: Number(assessment.freshness_confidence),
        marbling: assessment.marbling as any,
        marbling_confidence: Number(assessment.marbling_confidence),
        fat_ratio_percent: Number(assessment.fat_ratio),
        fat_ratio_category: assessment.fat_category as any,
        meat_quality_score: Number(assessment.meat_quality_score),
        assessment_id: assessment.id,
        image_url: assessment.image_url,
      }
    : null

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/history">
            <Button variant="outline" size="sm" className="rounded-xl gap-1 text-xs">
              <ChevronLeft className="w-4 h-4" />
              Back to History
            </Button>
          </Link>
          <span className="text-xs text-muted-foreground font-mono">ID: {id}</span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-500/10 text-red-500 border border-red-500/20">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center space-y-3">
            <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-muted-foreground animate-pulse">Loading assessment record...</p>
          </div>
        ) : mappedResults ? (
          <div className="space-y-6">
            <ResultsDisplay results={mappedResults} />

            {assessment?.image_url && (
              <div className="rounded-3xl overflow-hidden border border-border bg-card/60 backdrop-blur-md p-4 space-y-3 shadow-lg">
                <h3 className="text-sm font-bold text-foreground">Archived Cut Image</h3>
                <div className="rounded-2xl overflow-hidden max-h-[460px] bg-black/60 flex items-center justify-center">
                  <img
                    src={assessment.image_url}
                    alt="Archived beef cut evaluation"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </ProtectedRoute>
  )
}
