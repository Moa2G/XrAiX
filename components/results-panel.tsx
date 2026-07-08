'use client'

import { Progress } from '@/components/ui/progress'
import { PredictionResult } from './dashboard'
import { Loader2, BrainCircuit } from 'lucide-react'

interface ResultsPanelProps {
  predictions: PredictionResult[]
  isLoading: boolean
  onDiseaseClick: (disease: string) => void
  activeDisease: string | null
  customThresholds?: Record<string, number>
}

export function ResultsPanel({ predictions, isLoading, onDiseaseClick, activeDisease, customThresholds = {} }: ResultsPanelProps) {
  const sortedPredictions = [...predictions].sort((a, b) => b.confidence - a.confidence)
  const topVerdict = sortedPredictions.length > 0 ? sortedPredictions[0] : null

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl bg-[#111827] border border-[#1f2937] p-6 text-slate-200">
      <div className="text-xs font-bold tracking-wider text-blue-400">AI ANALYSIS RESULT</div>
      
      {isLoading && !predictions.length ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      ) : !topVerdict ? (
        <div className="flex flex-1 items-center justify-center text-slate-500">
          Upload an image to see analysis
        </div>
      ) : (
        <>
          {/* Top Section */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className={`text-3xl font-bold ${topVerdict.confidence >= (customThresholds[topVerdict.disease] ?? topVerdict.threshold) ? 'text-red-500' : 'text-emerald-400'}`}>
                {topVerdict.confidence >= (customThresholds[topVerdict.disease] ?? topVerdict.threshold) ? 'Abnormal' : 'Normal'}
              </div>
              <div className="mt-2 text-sm text-slate-400">Confidence Score</div>
              <div className={`text-5xl font-bold ${topVerdict.confidence >= (customThresholds[topVerdict.disease] ?? topVerdict.threshold) ? 'text-red-500' : 'text-emerald-400'}`}>
                {(topVerdict.confidence * 100).toFixed(0)}%
              </div>
              <Progress 
                value={topVerdict.confidence * 100} 
                className={`mt-4 h-3 ${topVerdict.confidence >= (customThresholds[topVerdict.disease] ?? topVerdict.threshold) ? '[&>div]:bg-red-500 bg-red-950/50 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : '[&>div]:bg-emerald-500 bg-emerald-950/50'}`} 
              />
            </div>
            <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-[#0a0f1c] border border-[#1f2937]">
               {/* 3D Lung Graphic Placeholder */}
               <BrainCircuit className="h-12 w-12 text-blue-500/30" />
            </div>
          </div>

          <div className="mt-4 text-xs font-bold tracking-wider text-blue-400">DETECTED CONDITIONS</div>
          
          {/* Detected Conditions List */}
          <div className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {sortedPredictions.map((prediction, index) => {
              const isHigh = prediction.confidence >= (customThresholds[prediction.disease] ?? prediction.threshold)
              const isActive = activeDisease === prediction.disease
              
              return (
                <button
                  key={index}
                  onClick={() => onDiseaseClick(prediction.disease)}
                  className={`group flex w-full cursor-pointer items-center justify-between rounded-lg border p-2 transition-all duration-300 ${
                    isActive ? 'border-blue-500/50 bg-blue-500/10' : 'border-transparent hover:bg-slate-800/50 hover:border-[#1f2937]'
                  }`}
                >
                  <div className="w-5/12 flex flex-col items-start gap-1 overflow-hidden">
                    <span className="text-left text-sm text-slate-300 truncate w-full" title={prediction.disease}>{prediction.disease}</span>
                    {isHigh && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-500 uppercase tracking-wider border border-red-500/30">
                        Positive
                      </span>
                    )}
                  </div>
                  <div className="flex-1 px-2">
                    <Progress
                      value={prediction.confidence * 100}
                      className={`h-1.5 ${isHigh ? '[&>div]:bg-red-500 bg-red-950/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : '[&>div]:bg-blue-500 bg-blue-950/50'}`}
                    />
                  </div>
                  <span className={`w-12 text-right text-sm font-semibold ${isHigh ? 'text-red-400' : 'text-slate-400'}`}>
                    {(prediction.confidence * 100).toFixed(0)}%
                  </span>
                </button>
              )
            })}
          </div>

          {/* Bottom Section */}
          <div className="mt-2 flex items-start gap-3 rounded-xl bg-[#0a0f1c] p-4 border border-[#1f2937]">
            <BrainCircuit className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
            <div className="text-sm text-slate-300">
              The AI model has detected possible signs of <span className="font-semibold text-blue-400">{topVerdict.disease}</span>. Please correlate clinically.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
