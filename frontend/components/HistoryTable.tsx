"use client"

import React from "react"
import Link from "next/link"
import { Assessment } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Trash2, ShieldCheck, ShieldAlert } from "lucide-react"

interface HistoryTableProps {
  assessments: Assessment[]
  onDelete?: (id: string) => void
}

const SPLIT_MARBLING_POINTS: Record<string, number> = {
  small: 20,
  slight: 30,
  modest: 40,
  moderate: 50,
  slightly_abundant: 60,
}

export function calculateSplitScore(marbling: string, fatRatio: number): number {
  const marblingPoints = SPLIT_MARBLING_POINTS[marbling?.toLowerCase?.()] ?? 20
  const fatPoints = Math.min(Number(fatRatio || 0) * 2, 40)
  return Math.round((marblingPoints + fatPoints) * 10) / 10
}

export function HistoryTable({ assessments, onDelete }: HistoryTableProps) {
  const getMqsBadge = (score: number) => {
    if (score >= 76) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          {score.toFixed(1)} / 100
        </span>
      )
    } else if (score >= 51) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          {score.toFixed(1)} / 100
        </span>
      )
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
          {score.toFixed(1)} / 100
        </span>
      )
    }
  }

  const getSplitScoreBadge = (score: number) => {
    if (score >= 80) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          {score.toFixed(1)} / 100
        </span>
      )
    } else if (score >= 65) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
          {score.toFixed(1)} / 100
        </span>
      )
    } else if (score >= 45) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
          {score.toFixed(1)} / 100
        </span>
      )
    } else {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
          {score.toFixed(1)} / 100
        </span>
      )
    }
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card/60 backdrop-blur-md shadow-md">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground tracking-wider">
          <tr>
            <th className="px-4 py-3.5">Image</th>
            <th className="px-4 py-3.5">Date / Time</th>
            <th className="px-4 py-3.5">MQS Score</th>
            <th className="px-4 py-3.5">Split Score</th>
            <th className="px-4 py-3.5">Freshness</th>
            <th className="px-4 py-3.5">Marbling</th>
            <th className="px-4 py-3.5">Fat Ratio</th>
            <th className="px-4 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {assessments.map((item) => {
            const isFresh = item.freshness === "Fresh"
            const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
            const splitScore = calculateSplitScore(item.marbling, item.fat_ratio)

            return (
              <tr
                key={item.id}
                className="hover:bg-muted/30 transition-colors group"
              >
                <td className="px-4 py-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border flex items-center justify-center">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt="Beef thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">No img</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-xs text-foreground">
                  {dateStr}
                </td>
                <td className="px-4 py-3">
                  {getMqsBadge(item.meat_quality_score)}
                </td>
                <td className="px-4 py-3">
                  {getSplitScoreBadge(splitScore)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      isFresh ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {isFresh ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    )}
                    {item.freshness}
                  </span>
                </td>
                <td className="px-4 py-3 capitalize text-xs font-medium">
                  {item.marbling.replace("_", " ")}
                </td>
                <td className="px-4 py-3 text-xs font-medium">
                  {item.fat_ratio.toFixed(2)}% ({item.fat_category})
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <Link href={`/history/${item.id}`}>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 rounded-lg text-xs gap-1 hover:text-foreground"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Details
                      </Button>
                    </Link>
                    {onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        className="h-8 px-2 rounded-lg text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
