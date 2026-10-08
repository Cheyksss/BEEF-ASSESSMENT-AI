import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get quality color based on MQS score
 * @param score Meat Quality Score (0-100)
 * @returns Tailwind color class
 */
export function getQualityColor(score: number): string {
  if (score >= 76) return "quality-excellent"
  if (score >= 51) return "quality-good"
  if (score >= 26) return "quality-medium"
  return "quality-poor"
}

/**
 * Format confidence percentage
 * @param confidence Confidence value (0-100)
 * @returns Formatted string
 */
export function formatConfidence(confidence: number): string {
  return `${confidence.toFixed(1)}%`
}

/**
 * Format date to readable string
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}
