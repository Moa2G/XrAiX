'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Upload, Loader2 } from 'lucide-react'

interface ImageUploadPanelProps {
  uploadedImage: string | null
  onImageUpload: (file: File) => void
  gradCamOverlay: string | null
  onRunDiagnostics: () => Promise<void>
  isLoading: boolean
}

export function ImageUploadPanel({
  uploadedImage,
  onImageUpload,
  gradCamOverlay,
  onRunDiagnostics,
  isLoading,
}: ImageUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [showGradCam, setShowGradCam] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      onImageUpload(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      onImageUpload(files[0])
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Upload X-Ray Image</CardTitle>
        <CardDescription>Drag and drop or click to select a chest X-ray image</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {/* Upload Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/30 hover:border-primary/50'
          }`}
          style={{ minHeight: '300px' }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={isLoading}
          />
          <div className="pointer-events-none flex flex-col items-center gap-2 text-center">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground">PNG, JPG, or DICOM up to 10MB</p>
            </div>
          </div>
        </div>

        {/* Image Preview */}
        {uploadedImage && (
          <div className="space-y-4">
            <div className="relative w-full overflow-hidden rounded-lg bg-black/5">
              <img
                src={showGradCam && window.location.href.includes('gradcam') ? gradCamOverlay || uploadedImage : uploadedImage}
                alt="Uploaded X-ray"
                className="h-auto w-full object-contain"
              />
            </div>

            {/* Grad-CAM Toggle */}
            {gradCamOverlay && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
                <label htmlFor="gradcam-toggle" className="text-sm font-medium text-foreground">
                  Show Grad-CAM Overlay
                </label>
                <Switch
                  id="gradcam-toggle"
                  checked={showGradCam}
                  onCheckedChange={setShowGradCam}
                />
              </div>
            )}

            {/* Run Diagnostics Button */}
            <Button
              onClick={onRunDiagnostics}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Analysis...
                </>
              ) : (
                'Run AI Diagnostics'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
