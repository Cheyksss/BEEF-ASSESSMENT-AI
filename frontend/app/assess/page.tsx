"use client"

import React, { useState } from "react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ImageUploadWidget } from "@/components/ImageUploadWidget"
import { CameraCaptureWidget } from "@/components/CameraCaptureWidget"
import { ResultsDisplay } from "@/components/ResultsDisplay"
import { useAuthContext } from "@/contexts/AuthContext"
import { predictBeefQuality, APIError } from "@/lib/api"
import { PredictionResponse } from "@/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, Camera, Sparkles, AlertCircle, RefreshCw, Beef } from "lucide-react"

export default function AssessPage() {
  const { getAccessToken } = useAuthContext()
  const [inputMode, setInputMode] = useState<"upload" | "camera">("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<PredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelected = (file: File) => {
    setSelectedFile(file)
    setError(null)
  }

  const handleClear = () => {
    setSelectedFile(null)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select or capture a beef cut image before submitting.")
      return
    }

    try {
      setIsProcessing(true)
      setError(null)
      const token = getAccessToken() || undefined
      const data = await predictBeefQuality(selectedFile, token)
      setResults(data)
    } catch (err: any) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError(err?.message || "Assessment failed. Please verify connection and retry.")
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReset = () => {
    setResults(null)
    setSelectedFile(null)
    setError(null)
  }

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {/* Page Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 text-xs font-semibold">
            <Beef className="w-3.5 h-3.5" />
            Computer Vision + ReXNet-150 Model Inference
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Beef Quality Assessment
          </h1>
          <p className="text-sm text-muted-foreground">
            Upload or capture a cross-sectional beef cut image to evaluate Freshness, Marbling, Fat Ratio, and MQS.
          </p>
        </div>

        {results ? (
          <ResultsDisplay results={results} onReset={handleReset} />
        ) : (
          <Card className="border border-border/80 shadow-xl bg-card/80 backdrop-blur-md">
            <CardHeader>
              <div className="flex items-center justify-between pb-2">
                <CardTitle className="text-lg font-bold">Image Input Source</CardTitle>
                <div className="flex bg-muted/60 p-1 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode("upload")
                      handleClear()
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${inputMode === "upload"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    File Upload
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInputMode("camera")
                      handleClear()
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${inputMode === "camera"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Live Camera
                  </button>
                </div>
              </div>
              <CardDescription>
                Ensure clear illumination, minimal specular glare, centered and top-down placement of the cut.
                <br /><small>*Disclaimer: Upload images of ribeye cuts for best performance; however, you may use other cuts at your discretion.</small>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {inputMode === "upload" ? (
                <ImageUploadWidget
                  onImageSelected={handleImageSelected}
                  onClear={handleClear}
                />
              ) : (
                <CameraCaptureWidget
                  onImageCaptured={handleImageSelected}
                  onCancel={() => setInputMode("upload")}
                />
              )}

              <div className="pt-2 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!selectedFile || isProcessing}
                  className="h-11 px-6 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-rose-700 text-white font-semibold rounded-xl shadow-lg transition-all"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing Neural Representations...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Run Quality Evaluation
                    </span>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  )
}
