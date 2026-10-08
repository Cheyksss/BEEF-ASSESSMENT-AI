"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { Camera, RefreshCw, X, AlertCircle, SwitchCamera } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CameraCaptureWidgetProps {
  onImageCaptured: (file: File) => void
  onCancel?: () => void
}

export function CameraCaptureWidget({
  onImageCaptured,
  onCancel,
}: CameraCaptureWidgetProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [error, setError] = useState<string | null>(null)
  const [capturedUrl, setCapturedUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    setError(null)
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (err: any) {
      setError(
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access in your browser."
          : "Camera not detected or unavailable on this device."
      )
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [facingMode, startCamera])

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
  }

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const file = new File([blob], `beef-capture-${Date.now()}.jpg`, {
          type: "image/jpeg",
        })
        const url = URL.createObjectURL(blob)
        setCapturedUrl(url)
        onImageCaptured(file)
      },
      "image/jpeg",
      0.95
    )
  }

  const handleRetake = () => {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl)
    }
    setCapturedUrl(null)
    startCamera(facingMode)
  }

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-border">
        {!capturedUrl ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {stream && (
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={toggleCamera}
                  className="rounded-full bg-background/60 backdrop-blur-md border-white/20 text-white hover:bg-background/80"
                >
                  <SwitchCamera className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  onClick={handleCapture}
                  className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/40 p-0 flex items-center justify-center"
                >
                  <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={onCancel}
                    className="rounded-full bg-background/60 backdrop-blur-md border-white/20 text-white hover:bg-background/80"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <img
              src={capturedUrl}
              alt="Captured beef cut"
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleRetake}
                className="rounded-xl shadow-md gap-1.5 text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retake
              </Button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
