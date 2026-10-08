"use client"

import React, { useState } from "react"
import { PredictionResponse } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Layers,
  PieChart,
  Clock,
  RotateCcw,
  Award,
  Sliders,
  Flame,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react"

interface ResultsDisplayProps {
  results: PredictionResponse
  imageUrl?: string
  onReset?: () => void
}

// Split Scoring Weights (Marbling 60 max, Fat 40 max, Freshness 0 pts)
const SPLIT_MARBLING_POINTS: Record<string, number> = {
  small: 20,
  slight: 30,
  modest: 40,
  moderate: 50,
  slightly_abundant: 60,
}

// Standard MQS Weights (Freshness 50 max, Marbling 30 max, Fat 20 max)
const STANDARD_MARBLING_POINTS: Record<string, number> = {
  small: 10,
  slight: 15,
  modest: 20,
  moderate: 25,
  slightly_abundant: 30,
}

export function ResultsDisplay({ results, imageUrl, onReset }: ResultsDisplayProps) {
  // Split scoring is the default view
  const [activeTab, setActiveTab] = useState<"split" | "unified">("split")

  const isSpoiled = results.freshness === "Spoiled"

  // --- Split Scoring Calculations (Freshness separate, Marbling 60 + Fat 40 = 100) ---
  const marblingSplitPoints = SPLIT_MARBLING_POINTS[results.marbling.toLowerCase()] ?? 20
  const fatSplitPoints = Math.min(results.fat_ratio_percent * 2, 40)
  const splitMqs = marblingSplitPoints + fatSplitPoints // max 100 points
  const splitMqsPercent = Math.min(Math.max(splitMqs, 0), 100)

  let splitMqsBadgeBg = "from-amber-500 via-orange-500 to-rose-600"
  let splitMqsTier = "Commercial / Lean Cut"
  if (splitMqs >= 80) {
    splitMqsBadgeBg = "from-emerald-500 via-teal-600 to-cyan-600"
    splitMqsTier = "Prime High-Marbled Cut"
  } else if (splitMqs >= 65) {
    splitMqsBadgeBg = "from-amber-500 via-amber-600 to-orange-600"
    splitMqsTier = "Choice Well-Marbled Cut"
  } else if (splitMqs >= 45) {
    splitMqsBadgeBg = "from-blue-500 via-indigo-600 to-violet-600"
    splitMqsTier = "Select Moderate-Marbled Cut"
  }

  // --- Standard MQS Calculations (Freshness 50 + Marbling 30 + Fat 20 = 100) ---
  const freshnessStandardPoints = isSpoiled ? 0 : 50
  const marblingStandardPoints = STANDARD_MARBLING_POINTS[results.marbling.toLowerCase()] ?? 10
  const fatStandardPoints = Math.min(results.fat_ratio_percent, 20)
  let standardMqs = results.meat_quality_score ?? (freshnessStandardPoints + marblingStandardPoints + fatStandardPoints)
  if (isSpoiled && standardMqs > 50) {
    standardMqs = 50
  }
  standardMqs = Math.min(Math.max(standardMqs, 0), 100)

  let standardMqsBadgeBg = "from-red-600 to-rose-700 text-white shadow-red-500/20"
  let standardMqsTier = "Low / Spoiled Grade"
  if (standardMqs >= 76) {
    standardMqsBadgeBg = "from-emerald-500 to-teal-700 text-white shadow-emerald-500/20"
    standardMqsTier = "Prime / Premium Quality"
  } else if (standardMqs >= 51) {
    standardMqsBadgeBg = "from-amber-500 to-orange-600 text-white shadow-amber-500/20"
    standardMqsTier = "Commercial / Standard Quality"
  }

  const timestamp = new Date().toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Scoring Mode Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-1 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Scoring Model:
          </span>
          <div className="inline-flex p-1 rounded-xl bg-muted/70 border border-border/80">
            {/* Split Scoring is first / default */}
            <button
              type="button"
              onClick={() => setActiveTab("split")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "split"
                ? "bg-background text-foreground shadow-sm text-red-600 font-extrabold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Split Scoring (Freshness Separate + Meat Quality Score)
            </button>
            {/* Standard MQS is second */}
            <button
              type="button"
              onClick={() => setActiveTab("unified")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "unified"
                ? "bg-background text-foreground shadow-sm text-red-600 font-extrabold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Award className="w-3.5 h-3.5" />
              Standard MQS (Unified View)
            </button>
          </div>
        </div>

        {/* Action Button: New Assessment */}
        {onReset && (
          <Button
            type="button"
            onClick={onReset}
            variant="outline"
            size="sm"
            className="rounded-xl border-border/80 text-xs font-semibold gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New Assessment
          </Button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: SPLIT SCORING (DEFAULT VIEW)                                       */}
      {/* ========================================================================= */}
      {activeTab === "split" && (
        <div className="space-y-6 animate-fade-in">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ------------------------------------------------------------- */}
            {/* CARD 1: FRESHNESS & SAFETY (SEPARATE INDEPENDENT SAFETY INDEX)*/}
            {/* ------------------------------------------------------------- */}
            <div className={`relative overflow-hidden rounded-3xl p-7 bg-gradient-to-br ${isSpoiled
              ? "from-red-600 via-rose-700 to-red-900 shadow-red-500/20"
              : "from-emerald-600 via-teal-700 to-emerald-900 shadow-emerald-500/20"
              } text-white shadow-xl border border-white/20 flex flex-col justify-between`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white">
                    {isSpoiled ? <AlertTriangle className="w-3.5 h-3.5 text-red-300" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
                    Food Safety Inspection
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                    Independent Indicator
                  </span>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-white/80">
                    Freshness Classification & Confidence
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black tracking-tight drop-shadow-md">
                      {results.freshness.toUpperCase()}
                    </span>
                    <span className="text-sm font-semibold ml-auto px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md">
                      {results.freshness_confidence.toFixed(1)}% Confidence
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/15">
                  <div className="flex justify-between text-xs text-white/90">
                    <span>Classification Status:</span>
                    <span className="font-bold underline underline-offset-2">{results.freshness}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/90">
                    <span>Model Confidence:</span>
                    <span className="font-bold">{results.freshness_confidence.toFixed(2)}%</span>
                  </div>
                </div>

                {/* Progress bar representing confidence */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-black/30 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSpoiled ? "bg-red-400" : "bg-emerald-300"}`}
                      style={{ width: `${results.freshness_confidence}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/75">
                    <span>Microbial Safety Checkpoint</span>
                    <span>{results.freshness_confidence.toFixed(1)}% certainty</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/20 text-xs text-white/85 flex items-center gap-2">
                {isSpoiled ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Spoiled microbial activity detected. Reject cut.</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                    <span>Verified Fresh. Microbiologically safe for consumption.</span>
                  </>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* CARD 2: MEAT QUALITY SCORE (MQS - FORMERLY LIPID SCORE)       */}
            {/* ------------------------------------------------------------- */}
            <div className={`relative overflow-hidden rounded-3xl p-7 bg-gradient-to-br ${splitMqsBadgeBg} text-white shadow-xl shadow-amber-500/15 border border-white/20 flex flex-col justify-between`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider text-white">
                    <Award className="w-3.5 h-3.5 text-amber-300" />
                    Meat Quality Score (MQS)
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md">
                    Total: 100 pts
                  </span>
                </div>

                <div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-white/80">
                    Palatability & Lipid Index
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-black tracking-tight drop-shadow-md">
                      {splitMqs.toFixed(1)}
                    </span>
                    <span className="text-xl font-light text-white/80">/ 100 pts</span>
                    <span className="text-sm font-semibold ml-auto px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md">
                      {splitMqsPercent.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-white/90 font-medium mt-1">
                    Quality Tier: <span className="font-bold underline underline-offset-2">{splitMqsTier}</span>
                  </p>
                </div>

                {/* Sub-breakdown: Marbling & Fat Share */}
                <div className="space-y-2 pt-2 border-t border-white/15 text-xs text-white/90">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      Marbling Grain ({results.marbling.replace("_", " ")}):
                    </span>
                    <span className="font-bold">{marblingSplitPoints} / 60 pts</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <PieChart className="w-3.5 h-3.5" />
                      Visible Fat Ratio ({results.fat_ratio_percent.toFixed(1)}%):
                    </span>
                    <span className="font-bold">{fatSplitPoints.toFixed(1)} / 40 pts</span>
                  </div>
                </div>

                {/* Stacked Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 rounded-full bg-black/30 overflow-hidden flex">
                    <div
                      className="h-full bg-amber-300 transition-all"
                      style={{ width: `${(marblingSplitPoints / 100) * 100}%` }}
                      title={`Marbling: ${marblingSplitPoints} pts`}
                    ></div>
                    <div
                      className="h-full bg-rose-300 transition-all"
                      style={{ width: `${(fatSplitPoints / 100) * 100}%` }}
                      title={`Visible Fat: ${fatSplitPoints.toFixed(1)} pts`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-white/75">
                    <span>Marbling Share (60 max)</span>
                    <span>Fat Share (40 max)</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-white/20 text-xs text-white/85 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
                <span>Combines intramuscular lipid marbling (60 pts) + visible boundary fat ratio (40 pts).</span>
              </div>
            </div>
          </div>

          {/* Detailed Metric Cards in Split Mode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Left Card: Detailed Freshness Analysis */}
            <Card className="border border-border/70 shadow-md bg-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    1. Microbial Freshness Evaluation
                  </span>
                  {isSpoiled ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                </div>
                <CardTitle className="text-xl font-bold">
                  {results.freshness} State ({results.freshness_confidence.toFixed(1)}% Confidence)
                </CardTitle>
                <CardDescription className="text-xs">
                  ReXNet-150 Binary Deep Learning Inference
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  • <strong>Model Output:</strong> Evaluated as {results.freshness.toLowerCase()} meat with a confidence level of {results.freshness_confidence.toFixed(2)}%.
                </p>
                <p>
                  • <strong>Safety Role:</strong> Freshness serves as an independent microbiological food safety checkpoint. Freshness state does not contribute points to the physical Meat Quality Score (MQS).
                </p>
              </CardContent>
            </Card>

            {/* Right Card: Detailed Meat Quality Score Analysis */}
            <Card className="border border-border/70 shadow-md bg-card/80">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    2. Meat Quality Score Evaluation
                  </span>
                  <Award className="w-4 h-4 text-amber-500" />
                </div>
                <CardTitle className="text-xl font-bold">
                  {splitMqs.toFixed(1)} / 100 Pts ({splitMqsPercent.toFixed(1)}%)
                </CardTitle>
                <CardDescription className="text-xs">
                  ReXNet-150 Marbling (60 pts max) + OpenCV/HSV Fat Ratio (40 pts max)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <p>
                  • <strong>Marbling Grain:</strong> Graded as <span className="font-semibold text-foreground capitalize">{results.marbling.replace("_", " ")}</span> yielding <strong>{marblingSplitPoints} / 60 points</strong>.
                </p>
                <p>
                  • <strong>Visible Fat Content:</strong> Computer vision measured <span className="font-semibold text-foreground">{results.fat_ratio_percent.toFixed(2)}%</span> fat (Tier: {results.fat_ratio_category}), contributing <strong>{fatSplitPoints.toFixed(1)} / 40 points</strong>.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: STANDARD MQS (UNIFIED VIEW - REVERTED WEIGHTS WITH FRESHNESS)       */}
      {/* ========================================================================= */}
      {activeTab === "unified" && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Banner: Meat Quality Score (MQS) */}
          <div className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br ${standardMqsBadgeBg} shadow-2xl border border-white/20`}>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-white">
                  <Award className="w-3.5 h-3.5" />
                  Comprehensive Meat Quality Score (MQS)
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight drop-shadow-md">
                  {standardMqs.toFixed(1)} <span className="text-2xl font-light opacity-80">/ 100</span>
                </h2>
                <p className="text-sm font-medium text-white/90">
                  Assessed Tier: <span className="font-bold underline underline-offset-4">{standardMqsTier}</span>
                </p>
              </div>

              <div className="bg-black/20 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-xs space-y-1.5 text-white/90 max-w-xs">
                <div className="font-bold text-white text-xs uppercase tracking-wider">Formula Composition:</div>
                <div className="flex justify-between">
                  <span>Freshness Weight:</span>
                  <span className="font-semibold">{isSpoiled ? "0" : "50"} / 50 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Marbling Grade:</span>
                  <span className="font-semibold">{marblingStandardPoints} / 30 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>Visible Fat (Capped):</span>
                  <span className="font-semibold">{fatStandardPoints.toFixed(1)} / 20 pts</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/20 font-bold">
                  <span>Total MQS:</span>
                  <span>{standardMqs.toFixed(1)} / 100 pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid of Key Diagnostic Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Metric 1: Freshness */}
            <Card className="border border-border/70 shadow-lg backdrop-blur-md bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Freshness State
                  </span>
                  {isSpoiled ? (
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <span className={isSpoiled ? "text-red-500" : "text-emerald-500"}>
                    {results.freshness}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground">Confidence</span>
                    <span className="font-semibold">{results.freshness_confidence.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isSpoiled ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${results.freshness_confidence}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isSpoiled
                    ? "Warning: Spoiled beef capped at max 50 MQS safety threshold."
                    : "Optimal microbial condition (50 MQS points)."}
                </p>
              </CardContent>
            </Card>

            {/* Metric 2: Marbling Grade */}
            <Card className="border border-border/70 shadow-lg backdrop-blur-md bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Marbling Grade
                  </span>
                  <Layers className="w-5 h-5 text-amber-500" />
                </div>
                <CardTitle className="text-2xl font-bold capitalize text-foreground">
                  {results.marbling.replace("_", " ")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground">MQS Marbling Contribution</span>
                    <span className="font-semibold">{marblingStandardPoints} / 30 pts</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(marblingStandardPoints / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Intramuscular lipid grain distribution scored via ReXNet-150.
                </p>
              </CardContent>
            </Card>

            {/* Metric 3: Visible Fat Ratio */}
            <Card className="border border-border/70 shadow-lg backdrop-blur-md bg-card/80">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Visible Fat Ratio
                  </span>
                  <PieChart className="w-5 h-5 text-rose-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-between">
                  <span>{results.fat_ratio_percent.toFixed(2)}%</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted border text-foreground">
                    Tier: {results.fat_ratio_category}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-muted-foreground">MQS Fat Contribution</span>
                    <span className="font-semibold">{fatStandardPoints.toFixed(1)} / 20 pts</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500"
                      style={{ width: `${Math.min(results.fat_ratio_percent, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  HSV segmentation with rembg mask analysis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Assessment Metadata Footer */}
      <div className="p-4 rounded-2xl bg-card border border-border flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span>Evaluated on: {timestamp}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] opacity-75">ID: {results.assessment_id}</span>
        </div>
      </div>
    </div>
  )
}
