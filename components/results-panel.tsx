'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { PredictionResult } from './dashboard'
import { AlertCircle, Check, Loader2 } from 'lucide-react'

interface ResultsPanelProps {
  predictions: PredictionResult[]
  isLoading: boolean
  onDiseaseClick: (disease: string) => void
}

const THRESHOLD = 0.5

export function ResultsPanel({ predictions, isLoading, onDiseaseClick }: ResultsPanelProps) {
  const sortedPredictions = [...predictions].sort((a, b) => b.confidence - a.confidence)

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>AI Predictions</CardTitle>
        <CardDescription>Disease detection results with confidence scores</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-2 overflow-y-auto">
        {isLoading && !predictions.length ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing X-ray image...</p>
            </div>
          </div>
        ) : predictions.length === 0 ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Upload an image and run diagnostics to see results</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPredictions.map((prediction, index) => {
              const isPositive = prediction.predicted
              const isHigh = prediction.confidence > THRESHOLD

              return (
                <button
                  key={index}
                  onClick={() => onDiseaseClick(prediction.disease)}
                  className="group w-full cursor-pointer rounded-xl border border-border/50 bg-card/40 p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-md"
                >
                  {/* Header Row */}
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{prediction.disease}</span>
                      {isPositive ? (
                        <div className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-2.5 py-0.5 text-destructive shadow-sm ring-1 ring-inset ring-destructive/20">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold tracking-wide uppercase">Positive</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-emerald-600 shadow-sm ring-1 ring-inset ring-emerald-500/20 dark:text-emerald-400">
                          <Check className="h-3.5 w-3.5" />
                          <span className="text-xs font-bold tracking-wide uppercase">Negative</span>
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {(prediction.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <Progress
                      value={prediction.confidence * 100}
                      className="h-2"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Confidence</span>
                      <span>
                        {isHigh ? (
                          <span className="font-medium text-destructive">
                            {isPositive ? 'High Risk' : 'Reliable'}
                          </span>
                        ) : (
                          <span>Low Confidence</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Threshold Line */}
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span>Threshold: {(THRESHOLD * 100).toFixed(0)}%</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
