"use client"

import React, { useState, useRef, DragEvent, ChangeEvent } from "react"
import { UploadCloud, Image as ImageIcon, X, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImageUploadWidgetProps {
  onImageSelected: (file: File) => void
  onClear?: () => void
  maxSizeMB?: number
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg"]

export function ImageUploadWidget({
  onImageSelected,
  onClear,
  maxSizeMB = 10,
}: ImageUploadWidgetProps) {
  const [dragActive, setDragActive] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateAndSelectFile = (file: File) => {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid file format. Please upload a JPEG or PNG image.")
      return
    }

    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      setError(`File size exceeds ${maxSizeMB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`)
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    onImageSelected(file)
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0])
    }
  }

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClear?.()
  }

  return (
    <div className="w-full space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!previewUrl ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[220px] ${
            dragActive
              ? "border-red-500 bg-red-500/5 scale-[1.01]"
              : "border-border hover:border-red-400/60 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mb-3">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">
            Click to upload or drag & drop beef cut image
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            JPEG or PNG format (Maximum size {maxSizeMB}MB)
          </p>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-border shadow-md bg-muted/20">
          <img
            src={previewUrl}
            alt="Selected beef cut preview"
            className="w-full max-h-[380px] object-contain bg-black/40"
          />
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleClear}
              className="h-8 px-2.5 rounded-lg shadow-lg flex items-center gap-1 text-xs"
            >
              <X className="w-4 h-4" />
              Remove
            </Button>
          </div>
          {selectedFile && (
            <div className="p-3 bg-card/90 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="truncate max-w-[200px] font-medium text-foreground">
                {selectedFile.name}
              </span>
              <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
