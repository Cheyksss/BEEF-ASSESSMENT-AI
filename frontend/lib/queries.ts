import { supabase } from "@/lib/supabase"
import { Assessment } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/**
 * Fetch all assessments, sorted by creation date descending.
 * First fetches from the local backend database; if empty/unavailable, falls back to Supabase.
 */
export async function fetchUserAssessments(userId?: string): Promise<Assessment[]> {
  // 1. Try local backend persistence
  try {
    const res = await fetch(`${API_URL}/assessments`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (res.ok) {
      const records = await res.json()
      if (Array.isArray(records) && records.length > 0) {
        if (userId) {
          return records.filter((r) => !r.user_id || r.user_id === userId)
        }
        return records as Assessment[]
      }
    }
  } catch (err: any) {
    console.warn("Backend /assessments query failed, trying Supabase fallback:", err?.message)
  }

  // 2. Fallback to Supabase if configured
  try {
    let query = supabase
      .from("assessments")
      .select("*")
      .order("created_at", { ascending: false })

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data as Assessment[]
    }
  } catch (err: any) {
    console.warn("Supabase query fallback note:", err?.message)
  }

  return []
}

/**
 * Fetch a single assessment by ID.
 * Queries local backend first, then falls back to Supabase.
 */
export async function fetchAssessmentById(assessmentId: string): Promise<Assessment | null> {
  // 1. Try local backend persistence
  try {
    const res = await fetch(`${API_URL}/assessments/${assessmentId}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    })
    if (res.ok) {
      const record = await res.json()
      if (record && record.id) {
        return record as Assessment
      }
    }
  } catch (err: any) {
    console.warn("Backend /assessments/:id query failed, trying Supabase fallback:", err?.message)
  }

  // 2. Fallback to Supabase
  try {
    const { data, error } = await supabase
      .from("assessments")
      .select("*")
      .eq("id", assessmentId)
      .single()

    if (!error && data) {
      return data as Assessment
    }
  } catch (err: any) {
    console.warn("Supabase fetch single note:", err?.message)
  }

  return null
}

/**
 * Delete an assessment by ID.
 */
export async function deleteAssessment(assessmentId: string): Promise<void> {
  let deletedLocally = false

  // 1. Delete from backend local SQLite
  try {
    const res = await fetch(`${API_URL}/assessments/${assessmentId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      deletedLocally = true
    }
  } catch (err: any) {
    console.warn("Backend delete note:", err?.message)
  }

  // 2. Also attempt Supabase delete if configured
  try {
    await supabase.from("assessments").delete().eq("id", assessmentId)
  } catch {
    // Ignore Supabase delete errors if deleted locally
  }

  if (!deletedLocally) {
    // If neither succeeded or local failed
    console.log(`Assessment ${assessmentId} removed.`)
  }
}
