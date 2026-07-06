'use client'

import { PredictionResult } from './dashboard'
import { Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DiseaseOverlayProps {
  disease: string
  predictions: PredictionResult[]
  gradCamOverlay: string | null
  isLoading?: boolean
  onClose: () => void
}

export function DiseaseOverlay({
  disease,
  predictions,
  gradCamOverlay,
  isLoading,
  onClose,
}: DiseaseOverlayProps) {
  const prediction = predictions.find((p) => p.disease === disease)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
      <div className="relative flex w-full max-w-2xl max-h-[90vh] flex-col rounded-xl bg-card shadow-2xl">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 text-muted-foreground shadow-sm backdrop-blur transition-all hover:bg-background hover:text-foreground"
          aria-label="Close overlay"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex-none border-b border-border p-6 pr-14">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{disease}</h2>
            {prediction && (
              <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>Confidence: <span className="font-medium text-foreground">{(prediction.confidence * 100).toFixed(1)}%</span></span>
                <span>•</span>
                <span>Status: <span className={prediction.predicted ? 'font-medium text-destructive' : 'font-medium text-green-600 dark:text-green-400'}>{prediction.predicted ? 'Positive' : 'Negative'}</span></span>
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating targeted Grad-CAM...</p>
            </div>
          ) : gradCamOverlay ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-foreground">
                  Grad-CAM Visualization
                </label>
                <div className="relative w-full overflow-hidden rounded-lg bg-black/5">
                  <img
                    src={gradCamOverlay}
                    alt={`Grad-CAM overlay for ${disease}`}
                    className="h-auto w-full object-contain"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  The highlighted regions show areas of the X-ray that contributed most to the model&apos;s {disease} prediction.
                </p>
              </div>

              {prediction && (
                <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
                    <p className={`text-lg font-bold ${
                      prediction.predicted
                        ? 'text-destructive'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {prediction.predicted ? 'Positive' : 'Negative'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">Confidence</p>
                    <p className="text-lg font-bold text-foreground">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                This visualization is for clinical decision support only and should not be used as the sole basis for diagnosis.
              </p>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center text-center">
              <p className="text-sm text-muted-foreground">
                No Grad-CAM visualization available for this prediction.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-none justify-end border-t border-border p-6">
          <Button onClick={onClose} variant="outline" className="px-6">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
