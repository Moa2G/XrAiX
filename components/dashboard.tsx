'use client'

import { useState } from 'react'
import { ImageUploadPanel } from './image-upload-panel'
import { ResultsPanel } from './results-panel'
import { DiseaseOverlay } from './disease-overlay'

export type PredictionResult = {
  disease: string
  confidence: number
  predicted: boolean
}

export function Dashboard() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [gradCamOverlay, setGradCamOverlay] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false)

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRunDiagnostics = async () => {
    if (!uploadedImage) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      const blob = await fetch(uploadedImage).then(r => r.blob())
      formData.append('image', blob, 'xray.jpg')

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Prediction failed')

      const data = await response.json()
      setPredictions(data.predictions || [])
      setGradCamOverlay(data.gradcam_overlay || null)
    } catch (error) {
      console.error('Error running diagnostics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiseaseClick = async (disease: string) => {
    setSelectedDisease(disease)
    setShowOverlay(true)
    setGradCamOverlay(null)
    setIsLoadingHeatmap(true)

    // Fetch disease-specific Grad-CAM overlay
    try {
      const formData = new FormData()
      const blob = await fetch(uploadedImage!).then(r => r.blob())
      formData.append('image', blob, 'xray.jpg')
      formData.append('target_disease', disease)

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setGradCamOverlay(data.gradcam_overlay || null)
      }
    } catch (error) {
      console.error('Error fetching disease-specific overlay:', error)
    } finally {
      setIsLoadingHeatmap(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Medical AI Diagnostics</h1>
              <p className="text-sm text-muted-foreground">Chest X-Ray Analysis with Grad-CAM Visualization</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Panel - Image Upload */}
            <ImageUploadPanel
              uploadedImage={uploadedImage}
              onImageUpload={handleImageUpload}
              gradCamOverlay={gradCamOverlay}
              onRunDiagnostics={handleRunDiagnostics}
              isLoading={isLoading}
            />

            {/* Right Panel - Results */}
            <ResultsPanel
              predictions={predictions}
              isLoading={isLoading}
              onDiseaseClick={handleDiseaseClick}
            />
          </div>
        </div>
      </div>

      {/* Disease Overlay Modal */}
      {showOverlay && selectedDisease && (
        <DiseaseOverlay
          disease={selectedDisease}
          predictions={predictions}
          gradCamOverlay={gradCamOverlay}
          isLoading={isLoadingHeatmap}
          onClose={() => setShowOverlay(false)}
        />
      )}
    </div>
  )
}
