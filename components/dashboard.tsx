'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { ResultsPanel } from './results-panel'
import { createClient } from '@/lib/supabase/client'
import { findPatientById, createPatient, logAnalysisHistory, createDoctorAccount, getAllUsers, updateDoctorAccount, deleteDoctorAccount, getPatientsList, getRecentAnalyses, getAnalysisStats } from '@/app/actions'
import {
  LayoutDashboard,
  Image as ImageIcon,
  History,
  FileText,
  BarChart2,
  Settings,
  ShieldCheck,
  Bell,
  Upload,
  Loader2,
  User,
  ChevronDown,
  Search,
  PlusCircle,
  LogOut,
  Lock
} from 'lucide-react'

export type PredictionResult = {
  disease: string
  confidence: number
  predicted: boolean
  threshold: number
}

interface DashboardProps {
  user: any
}

export function Dashboard({ user }: DashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [predictions, setPredictions] = useState<PredictionResult[]>([])
  const [gradCamOverlay, setGradCamOverlay] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [selectedDisease, setSelectedDisease] = useState<string | null>(null)
  const [heatmapOpacity, setHeatmapOpacity] = useState(0.5)

  // Multi-Model and Analytics State
  const [individualHeatmaps, setIndividualHeatmaps] = useState<Record<string, string>>({})
  const [individualPredictions, setIndividualPredictions] = useState<Record<string, Record<string, number>>>({})
  const [customThresholds, setCustomThresholds] = useState<Record<string, number>>({})

  // Patient Context State
  const [patientIdInput, setPatientIdInput] = useState('')
  const [patientData, setPatientData] = useState<any>(null)
  const [isPatientLoading, setIsPatientLoading] = useState(false)
  const [isNewPatient, setIsNewPatient] = useState(false)
  const [isRediagnose, setIsRediagnose] = useState(false)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [isPatientWidgetExpanded, setIsPatientWidgetExpanded] = useState(false)

  // New Patient Form State
  const [newPatientName, setNewPatientName] = useState('')
  const [newPatientAge, setNewPatientAge] = useState('')
  const [newPatientGender, setNewPatientGender] = useState('Male')

  // Dashboard DB Widgets State
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, abnormal: 0, topDiseases: {} as Record<string, number> })

  // Patient History Tab State
  const [patientsList, setPatientsList] = useState<any[]>([])
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<any>(null)

  // Admin Tab State
  const [adminName, setAdminName] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminMessage, setAdminMessage] = useState('')
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editUserName, setEditUserName] = useState('')
  const [editUserRole, setEditUserRole] = useState('')
  const [selectedPatientIdForHistory, setSelectedPatientIdForHistory] = useState<string | null>(null)

  // Dropdown State
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const isGuest = user?.profile?.role === 'guest'

  useEffect(() => {
    if (!isGuest) fetchDashboardWidgets()
  }, [])

  const fetchDashboardWidgets = async () => {
    try {
      const recent = await getRecentAnalyses()
      if (recent) setRecentAnalyses(recent)
      const statsData = await getAnalysisStats()
      setStats(statsData)
    } catch (e) {
      console.error('Error fetching dashboard widgets:', e)
    }
  }

  const loadPatientsList = async () => {
    try {
      const data = await getPatientsList()
      if (data) setPatientsList(data)
    } catch (e) {
      console.error('Error loading patients:', e)
    }
  }

  const loadPatientHistory = async (patientId: string) => {
    setSelectedPatientIdForHistory(patientId)
    const { data } = await supabase.from('history').select('*').eq('patient_id', patientId).order('created_at', { ascending: false })
    setSelectedPatientHistory(data || [])
  }

  // Handle Tab Switch Hook
  useEffect(() => {
    if (isGuest) return
    if (activeNav === 'Patient History') {
      loadPatientsList()
    }
    if (activeNav === 'Settings' && user.profile?.role === 'admin') {
      loadAdminUsers()
    }
  }, [activeNav])

  const loadAdminUsers = async () => {
    try {
      const users = await getAllUsers()
      setAdminUsers(users)
    } catch (e) {
      console.error('Error loading users:', e)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to delete this doctor?')) {
      await deleteDoctorAccount(id)
      loadAdminUsers()
    }
  }

  const handleUpdateUser = async () => {
    if (editingUserId) {
      await updateDoctorAccount(editingUserId, { name: editUserName, role: editUserRole as 'admin' | 'doctor' })
      setEditingUserId(null)
      loadAdminUsers()
    }
  }

  const handlePatientLookup = async () => {
    if (!patientIdInput.trim()) return
    setIsPatientLoading(true)
    const pat = await findPatientById(patientIdInput.trim())
    if (pat) {
      setPatientData(pat)
      setIsNewPatient(false)
    } else {
      setPatientData(null)
      setIsNewPatient(true)
    }
    setIsPatientLoading(false)
  }

  const handleImageUpload = async (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setPredictions([])
      setGradCamOverlay(null)
      setSelectedDisease(null)
      setIndividualHeatmaps({})
      setIndividualPredictions({})
      setCustomThresholds({})
      setIsRediagnose(false)
      setExistingImageUrl(null)
    }
    reader.readAsDataURL(file)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleImageUpload(files[0])
    }
  }

  const handleRunDiagnostics = async () => {
    if (!uploadedImage) return

    if (!isGuest && !patientData && !isNewPatient) {
      alert("Please link a Patient ID or register a New Patient before analyzing.")
      return
    }

    setIsLoading(true)
    try {
      let activePatientId = patientData?.patient_id

      if (isNewPatient && !activePatientId) {
        const newPat: any = await createPatient({
          name: newPatientName,
          age: parseInt(newPatientAge),
          gender: newPatientGender,
          doctor_id: user.id
        })
        activePatientId = newPat.patient_id
        setPatientData(newPat)
        setIsNewPatient(false)
      }

      const formData = new FormData()

      // For rediagnosis: fetch the raw, unaltered blob directly from ImageKit URL
      // For new uploads: use the base64 data URI from the file reader
      formData.append('is_guest', isGuest ? 'true' : 'false')
      
      if (isRediagnose && existingImageUrl) {
        const rawImageUrl = existingImageUrl.includes('?')
          ? `${existingImageUrl}&tr=orig-true`
          : `${existingImageUrl}?tr=orig-true`
        const rawResponse = await fetch(rawImageUrl)
        const rawBlob = await rawResponse.blob()
        formData.append('image', rawBlob, 'xray.jpg')
        formData.append('skip_upload', 'true')
        formData.append('existing_image_url', existingImageUrl)
      } else {
        const blob = await fetch(uploadedImage).then(r => r.blob())
        formData.append('image', blob, 'xray.jpg')
      }

      const response = await fetch('/api/predict', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Prediction failed')

      const data = await response.json()
      setPredictions(data.predictions || [])
      setGradCamOverlay(data.gradcam_overlay || null)
      setIndividualHeatmaps(data.individual_heatmaps || {})
      setIndividualPredictions(data.individual_predictions || {})

      const newThresholds: Record<string, number> = {}
      let topFinding = 'Normal'
      let topConf = 0

      if (data.predictions && data.predictions.length > 0) {
        data.predictions.forEach((p: PredictionResult) => {
          newThresholds[p.disease] = p.threshold
        })
        
        const positivePredictions = data.predictions.filter((p: PredictionResult) => p.predicted || p.confidence >= p.threshold)
        
        if (positivePredictions.length > 0) {
          const sortedPositives = [...positivePredictions].sort((a, b) => b.confidence - a.confidence)
          topFinding = sortedPositives[0].disease
          topConf = sortedPositives[0].confidence
        } else {
          const sorted = [...data.predictions].sort((a, b) => b.confidence - a.confidence)
          topConf = sorted[0].confidence
          topFinding = 'Normal'
        }
      }
      setCustomThresholds(newThresholds)

      // Always log to database on every analysis, including rediagnosis (unless guest)
      if (activePatientId && !isGuest) {
        await logAnalysisHistory({
          patient_id: activePatientId,
          doctor_id: user.profile ? user.id : null,
          image_url: data.image_url,
          top_finding: topFinding,
          confidence_score: topConf,
          raw_predictions: data.predictions || [] // Use mapped predictions for Multi-Label
        })
        fetchDashboardWidgets()
      }

      // Reset rediagnose state
      setIsRediagnose(false)
      setExistingImageUrl(null)

    } catch (error) {
      console.error('Error running diagnostics:', error)
      alert("Diagnostics failed. Please check the backend connection.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiseaseClick = async (disease: string) => {
    if (!uploadedImage) return

    setSelectedDisease(disease)
    setGradCamOverlay(null)
    setIsLoadingHeatmap(true)

    try {
      const formData = new FormData()
      const blob = await fetch(uploadedImage).then(r => r.blob())
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

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdminMessage('')
    try {
      await createDoctorAccount(adminName, adminEmail, adminPassword)
      setAdminMessage('Successfully created new doctor account!')
      setAdminName('')
      setAdminEmail('')
      setAdminPassword('')
    } catch (err: any) {
      setAdminMessage(`Error: ${err.message}`)
    }
  }

  const handleLogout = async () => {
    if (user?.profile?.role === 'guest') {
      // Purely client-side cleanup
      localStorage.removeItem('isGuest')
      document.cookie = 'guest_mode=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    } else {
      await supabase.auth.signOut()
    }
    window.location.href = '/login'
  }

  // Sub-Components
  const renderPatientLookupPanel = () => (
    <motion.div 
      drag 
      dragMomentum={false}
      dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
      className={`absolute top-4 left-4 z-40 rounded-xl border border-[#1f2937] shadow-xl backdrop-blur-md overflow-hidden transition-all duration-300 ${isPatientWidgetExpanded ? 'w-80 bg-[#111827]/95 p-4 cursor-default' : 'w-auto bg-[#111827]/90 p-2 cursor-grab active:cursor-grabbing hover:bg-[#1f2937]'}`}
    >
      {!isPatientWidgetExpanded ? (
        <div 
          onClick={() => setIsPatientWidgetExpanded(true)}
          className="flex items-center gap-2"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
            <User className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-xs font-semibold text-slate-300 pr-2">Patient Context</span>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" /> Patient Context
            </h3>
            <button onClick={() => setIsPatientWidgetExpanded(false)} className="text-slate-500 hover:text-slate-300">
              <ChevronDown className="h-4 w-4 rotate-90 cursor-pointer" />
            </button>
          </div>

          {!patientData && !isNewPatient && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter Patient UUID"
                  value={patientIdInput}
                  onChange={(e) => setPatientIdInput(e.target.value)}
                  className="flex-1 rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button onClick={handlePatientLookup} disabled={isPatientLoading} className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-500 cursor-pointer">
                  {isPatientLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </button>
              </div>
              <button onClick={() => setIsNewPatient(true)} className="w-full rounded-lg border border-dashed border-[#1f2937] px-3 py-2 text-xs text-slate-400 hover:border-blue-500 hover:text-blue-400 hover:bg-slate-800 flex items-center justify-center gap-2 transition-colors cursor-pointer">
                <PlusCircle className="h-4 w-4" /> Register New Patient
              </button>
            </div>
          )}

          {patientData && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-300"><span className="text-slate-500">Name:</span> {patientData.name}</div>
              <div className="flex justify-between text-slate-300"><span className="text-slate-500">Age:</span> {patientData.age}</div>
              <div className="flex justify-between text-slate-300"><span className="text-slate-500">Gender:</span> {patientData.gender}</div>
              <div className="flex justify-between text-slate-300"><span className="text-slate-500">ID:</span> <span className="truncate w-32" title={patientData.patient_id}>{patientData.patient_id}</span></div>
              <button onClick={() => { setPatientData(null); setPatientIdInput('') }} className="mt-2 w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1 rounded cursor-pointer transition-colors">Unlink Patient</button>
            </div>
          )}

          {isNewPatient && (
            <div className="space-y-3 text-sm">
              <input type="text" placeholder="Full Name" value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} className="w-full rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-3 py-1.5 text-white" />
              <div className="flex gap-2">
                <input type="number" placeholder="Age" value={newPatientAge} onChange={(e) => setNewPatientAge(e.target.value)} className="w-1/3 rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-3 py-1.5 text-white" />
                <select value={newPatientGender} onChange={(e) => setNewPatientGender(e.target.value)} className="w-2/3 rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-3 py-1.5 text-white cursor-pointer">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <button onClick={() => setIsNewPatient(false)} className="w-full text-xs text-slate-500 hover:text-slate-300 cursor-pointer">Cancel</button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )

  const renderDashboardTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-2 flex flex-col gap-8 h-full">
        <div className="relative flex-1 flex flex-col rounded-2xl border border-[#1f2937] bg-[#111827] overflow-hidden min-h-[400px]">
          {renderPatientLookupPanel()}
          {!uploadedImage ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-6 rounded-full bg-blue-500/10 p-4">
                <ImageIcon className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No X-Ray Selected</h3>
              <p className="text-slate-400 mb-6 text-center max-w-sm">
                Upload a patient chest X-ray image to begin the AI diagnostic analysis.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-blue-600 px-6 py-2.5 font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all cursor-pointer"
              >
                Upload X-Ray Image
              </button>
            </div>
          ) : predictions.length > 0 ? (
            /* === Post-Diagnosis: 3 Horizontal Sections === */
            <div className="flex flex-col h-full">
              {/* Patient Info Bar */}
              {patientData && (
                <div className="flex items-center gap-6 border-b border-[#1f2937] bg-[#0a0f1c] px-6 py-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold text-white">{patientData.name}</span>
                  </div>
                  <div className="h-4 w-px bg-[#1f2937]" />
                  <span className="text-xs text-slate-400">ID: <span className="text-slate-300 font-mono">{patientData.patient_id?.substring(0, 8)}...</span></span>
                  <span className="text-xs text-slate-400">Age: <span className="text-slate-300">{patientData.age}</span></span>
                  <span className="text-xs text-slate-400">Gender: <span className="text-slate-300">{patientData.gender}</span></span>
                </div>
              )}
              {/* Images: Original + Heatmap side by side */}
              <div className="flex-1 grid grid-cols-2 gap-0 min-h-0">
                {/* Original Image */}
                <div className="relative flex flex-col border-r border-[#1f2937]">
                  <div className="px-4 py-2 border-b border-[#1f2937] bg-[#0a0f1c]">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Original X-Ray</span>
                  </div>
                  <div className="relative flex-1 bg-black/40 flex items-center justify-center">
                    <img src={uploadedImage} alt="Original X-Ray" className="w-full h-full object-contain p-3" />
                  </div>
                </div>
                {/* Heatmap Image */}
                <div className="relative flex flex-col">
                  <div className="px-4 py-2 border-b border-[#1f2937] bg-[#0a0f1c]">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Grad-CAM Heatmap {selectedDisease ? `— ${selectedDisease}` : ''}</span>
                  </div>
                  <div className="relative flex-1 bg-black/40 flex items-center justify-center">
                    <img src={uploadedImage} alt="Base" className="w-full h-full object-contain p-3" />
                    {gradCamOverlay && (
                      <img src={gradCamOverlay} alt="Grad-CAM Overlay" className="absolute inset-0 z-10 w-full h-full object-contain p-3" style={{ opacity: heatmapOpacity }} />
                    )}
                    {isLoadingHeatmap && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1c]/60 backdrop-blur-sm z-30">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    )}
                  </div>
                  {/* Heatmap Color Scale Legend */}
                  <div className="px-4 py-2 border-t border-[#1f2937] bg-[#0a0f1c] flex items-center gap-3">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Low</span>
                    <div className="flex-1 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #ef4444)' }} />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">High</span>
                    <div className="h-4 w-px bg-[#1f2937] mx-2" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">Opacity</span>
                    <input type="range" min="0" max="1" step="0.05" value={heatmapOpacity} onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))} className="w-24 accent-blue-500 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* === Pre-Diagnosis: Image + Run Button === */
            <div className="relative w-full h-full flex items-center justify-center bg-black/40">
              <img src={uploadedImage} alt="Original X-Ray" className="absolute inset-0 w-full h-full object-contain p-4" />

              {!isLoading && (
                <div className="absolute bottom-4 right-4 z-20">
                  <button
                    onClick={handleRunDiagnostics}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:bg-blue-500 transition-all cursor-pointer"
                  >
                    <BrainCircuitIcon className="h-5 w-5" />
                    Run AI Diagnostics
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0a0f1c]/60 backdrop-blur-sm z-30">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                    <span className="text-sm font-medium text-blue-400">Analyzing image...</span>
                  </div>
                </div>
              )}
            </div>
          )}
          <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" ref={fileInputRef} />
        </div>

        {/* Bottom Area Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5 flex flex-col">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-4">RECENT ANALYSES</h3>
            <div className="max-h-[240px] space-y-3 overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
              {recentAnalyses.map((row, i) => (
                <div key={i} className="flex items-center gap-3 text-xs border-b border-[#1f2937] pb-2 last:border-0 hover:bg-[#0a0f1c] p-1 rounded transition-colors cursor-pointer" onClick={() => loadPatientHistory(row.patient_id)}>
                  {row.image_url ? (
                    <img src={`${row.image_url}?tr=w-40,h-40,fo-auto`} alt="X-Ray" className="w-10 h-10 rounded object-cover border border-[#1f2937] shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded bg-[#1f2937] flex items-center justify-center text-slate-500 shrink-0">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-300 truncate">{row.patients?.name || 'Unknown'}</p>
                    <p className="text-slate-500">{new Date(row.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={row.top_finding !== 'Normal' ? 'text-red-400' : 'text-emerald-400'}>{row.top_finding}</p>
                    <p className="text-slate-500">Conf: <span className="text-slate-300">{(row.confidence_score * 100).toFixed(0)}%</span></p>
                  </div>
                </div>
              ))}
              {recentAnalyses.length === 0 && <p className="text-xs text-slate-500">No analyses found in database.</p>}
            </div>
          </div>

          <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5 flex flex-col">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-4">STATISTICS OVERVIEW</h3>
            <div className="shrink-0 grid grid-cols-2 gap-2 mb-4">
              <div className="bg-[#0a0f1c] rounded-lg p-2 border border-[#1f2937]">
                <p className="text-[10px] uppercase text-slate-500">Total Analyses</p>
                <p className="text-lg font-bold text-white">{stats.total}</p>
              </div>
              <div className="bg-[#0a0f1c] rounded-lg p-2 border border-[#1f2937]">
                <p className="text-[10px] uppercase text-slate-500">Abnormal</p>
                <p className="text-lg font-bold text-red-400">{stats.abnormal}</p>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-[120px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Normal', value: stats.total - stats.abnormal },
                      { name: 'Abnormal', value: stats.abnormal }
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                    label={({ percent = 0 }: any) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#475569', strokeWidth: 1 }}
                  >
                    <Cell fill="#34d399" />
                    <Cell fill="#f87171" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0f1c', borderColor: '#1f2937', borderRadius: '8px', fontSize: '12px', color: '#f1f5f9' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {stats.total === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                  No data
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-[#1f2937] bg-[#111827] p-5 flex flex-col">
            <h3 className="text-xs font-bold tracking-wider text-slate-400 mb-4">QUICK ACTIONS</h3>
            <div className="flex-1 flex flex-col gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-3 rounded-lg border border-[#1f2937] bg-[#0a0f1c] p-3 text-sm text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors cursor-pointer"
              >
                <Upload className="h-4 w-4 text-blue-400" /> Upload New X-Ray
              </button>
              {!isGuest && (
                <button onClick={() => setActiveNav('Patient History')} className="flex items-center gap-3 rounded-lg border border-[#1f2937] bg-[#0a0f1c] p-3 text-sm text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors cursor-pointer">
                  <History className="h-4 w-4 text-blue-400" /> View History
                </button>
              )}
              <button onClick={() => setActiveNav('Analytics')} className="flex items-center gap-3 rounded-lg border border-[#1f2937] bg-[#0a0f1c] p-3 text-sm text-slate-300 hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors cursor-pointer">
                <BarChart2 className="h-4 w-4 text-blue-400" /> View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-1 h-[calc(100vh-144px)]">
        <ResultsPanel
          predictions={predictions}
          isLoading={isLoading}
          onDiseaseClick={handleDiseaseClick}
          activeDisease={selectedDisease}
          customThresholds={customThresholds}
        />
      </div>
    </div>
  )

  const renderPatientHistoryTab = () => {
    const maleCount = patientsList.filter(p => p.gender === 'Male').length
    const femaleCount = patientsList.filter(p => p.gender === 'Female').length
    const totalGender = maleCount + femaleCount
    const malePct = totalGender > 0 ? Math.round((maleCount / totalGender) * 100) : 0
    const femalePct = totalGender > 0 ? Math.round((femaleCount / totalGender) * 100) : 0

    const ageUnder30 = patientsList.filter(p => p.age < 30).length
    const age30to50 = patientsList.filter(p => p.age >= 30 && p.age <= 50).length
    const ageOver50 = patientsList.filter(p => p.age > 50).length
    const totalAge = ageUnder30 + age30to50 + ageOver50
    const under30Pct = totalAge > 0 ? Math.round((ageUnder30 / totalAge) * 100) : 0
    const to50Pct = totalAge > 0 ? Math.round((age30to50 / totalAge) * 100) : 0
    const over50Pct = totalAge > 0 ? Math.round((ageOver50 / totalAge) * 100) : 0

    const topDiseasesEntries = Object.entries(stats.topDiseases || {}).sort((a, b) => b[1] - a[1]).slice(0, 3)

    return (
      <div className="flex flex-col h-full gap-6">
        {/* Analytics Top Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Gender Breakdown</h3>
            <div className="w-full h-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Gender', Male: maleCount, Female: femaleCount }]} layout="vertical" margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0a0f1c', borderColor: '#1f2937', borderRadius: '8px', fontSize: '12px', color: '#f1f5f9' }} />
                  <Bar dataKey="Male" stackId="a" fill="#60a5fa" radius={[4, 0, 0, 4]} barSize={24} />
                  <Bar dataKey="Female" stackId="a" fill="#f472b6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-[10px] mt-2">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-blue-400"/>Male ({maleCount}) - {malePct}%</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-pink-400"/>Female ({femaleCount}) - {femalePct}%</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Age Distribution</h3>
            <div className="w-full h-12">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[{ name: 'Age', '< 30': ageUnder30, '30-50': age30to50, '> 50': ageOver50 }]} layout="vertical" margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" hide />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#0a0f1c', borderColor: '#1f2937', borderRadius: '8px', fontSize: '12px', color: '#f1f5f9' }} />
                  <Bar dataKey="< 30" stackId="a" fill="#64748b" radius={[4, 0, 0, 4]} barSize={24} />
                  <Bar dataKey="30-50" stackId="a" fill="#94a3b8" barSize={24} />
                  <Bar dataKey="> 50" stackId="a" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-[10px] mt-2">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#64748b]"/>&lt; 30 ({ageUnder30}) - {under30Pct}%</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#94a3b8]"/>30-50 ({age30to50}) - {to50Pct}%</span>
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-[#cbd5e1]"/>&gt; 50 ({ageOver50}) - {over50Pct}%</span>
            </div>
          </div>
          <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-4 flex flex-col justify-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Top Detected Diseases</h3>
            <div className="flex flex-col gap-1 justify-center h-16">
              {topDiseasesEntries.length > 0 ? topDiseasesEntries.map(([disease, count]) => (
                <div key={disease} className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 truncate w-2/3">{disease}</span>
                  <span className="text-red-400 font-bold">{count} cases</span>
                </div>
              )) : <span className="text-sm text-slate-500">No data available</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-1 min-h-0 gap-8">
          {/* Patient List */}
          <div className="w-1/3 rounded-2xl border border-[#1f2937] bg-[#111827] p-6 flex flex-col">
            <h2 className="text-xl font-bold text-white mb-6">Patient Registry</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {patientsList.map(pat => (
            <button
              key={pat.patient_id}
              onClick={() => loadPatientHistory(pat.patient_id)}
              className="w-full flex flex-col items-start gap-1 p-3 rounded-xl border border-[#1f2937] bg-[#0a0f1c] hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors text-left"
            >
              <span className="font-semibold text-slate-200">{pat.name}</span>
              <div className="flex gap-4 text-xs text-slate-500">
                <span>ID: {pat.patient_id.substring(0, 8)}...</span>
                <span>Age: {pat.age}</span>
              </div>
            </button>
          ))}
          {patientsList.length === 0 && <p className="text-slate-500 text-sm">No patients found.</p>}
        </div>
      </div>

      {/* History Detail */}
      <div className="flex-1 rounded-2xl border border-[#1f2937] bg-[#111827] p-6 overflow-y-auto custom-scrollbar">
        {selectedPatientHistory ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Analysis Timeline</h2>
              <button 
                onClick={() => {
                  const pat = patientsList.find(p => p.patient_id === selectedPatientIdForHistory);
                  if (pat) {
                    setPatientData(pat);
                    setPatientIdInput(pat.patient_id);
                    setIsNewPatient(false);
                    setIsPatientWidgetExpanded(true);
                    
                    const imgUrl = selectedPatientHistory?.[0]?.image_url || null;
                    if (imgUrl) {
                      setUploadedImage(imgUrl);
                      setIsRediagnose(true);
                      setExistingImageUrl(imgUrl);
                    } else {
                      setUploadedImage(null);
                      setIsRediagnose(false);
                      setExistingImageUrl(null);
                    }
                    
                    // Clear previous run data
                    setPredictions([])
                    setGradCamOverlay(null)
                    setSelectedDisease(null)
                    setIndividualHeatmaps({})
                    setIndividualPredictions({})
                    setCustomThresholds({})

                    setActiveNav('Dashboard');
                    setIsSidebarOpen(false);
                  }
                }}
                className="rounded-lg bg-blue-600/20 border border-blue-500/50 px-4 py-2 text-sm font-semibold text-blue-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
              >
                Rediagnose Patient
              </button>
            </div>
            <div className="space-y-6">
              {selectedPatientHistory.map((hist: any) => {
                let positiveLabels: string[] = []
                
                // Parse raw_predictions if it exists and is mapped array
                if (hist.raw_predictions && Array.isArray(hist.raw_predictions)) {
                  positiveLabels = hist.raw_predictions
                    .filter((p: any) => p.predicted || p.confidence >= p.threshold)
                    .map((p: any) => p.disease)
                }

                if (positiveLabels.length === 0) {
                  positiveLabels = [hist.top_finding]
                }

                return (
                  <div key={hist.analysis_id} className="rounded-xl border border-[#1f2937] bg-[#0a0f1c] p-4 flex gap-4 items-center">
                    {hist.image_url ? (
                      <img src={`${hist.image_url}?tr=w-64,h-64,fo-auto`} alt="X-Ray" className="w-16 h-16 rounded-lg object-cover border border-[#1f2937]" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-[#1f2937] flex items-center justify-center text-slate-500">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-slate-300">{new Date(hist.created_at).toLocaleString()}</p>
                      <p className="text-xs text-slate-500 mt-1">Doctor ID: {hist.doctor_id}</p>
                    </div>
                    <div className="text-right max-w-[250px]">
                      <div className="flex flex-wrap justify-end gap-1 mb-1">
                        {positiveLabels.map(label => (
                          <span key={label} className={`text-[10px] px-1.5 py-0.5 rounded font-bold border uppercase tracking-wider ${label !== 'Normal' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                            {label}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-slate-400">Top Confidence: {(hist.confidence_score * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                )
              })}
              {selectedPatientHistory.length === 0 && <p className="text-slate-500">No analyses recorded for this patient.</p>}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500">
            Select a patient from the registry to view their timeline.
          </div>
        )}
      </div>
    </div>
    </div>
  )
  }

  const renderSettingsTab = () => (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full h-full overflow-y-auto pb-10 custom-scrollbar">
      <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-8">
        <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#1f2937] pb-4">My Profile</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Full Name</label>
            <p className="text-lg font-semibold text-slate-200 mt-1">{user.profile?.name || 'N/A'}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">Email Address</label>
            <p className="text-lg font-semibold text-slate-200 mt-1">{user.email}</p>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wider">System Role</label>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 border border-blue-500/20">
              <ShieldCheck className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400 uppercase tracking-wider">{user.profile?.role || 'doctor'}</span>
            </div>
          </div>
        </div>
      </div>

      {user.profile?.role === 'admin' && (
        <div className="flex flex-col gap-8">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 shadow-[0_0_30px_rgba(239,68,68,0.05)]">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
              <Lock className="h-6 w-6 text-red-400" /> Admin Management Panel
            </h2>
            <p className="text-sm text-slate-400 mb-8 pb-4 border-b border-[#1f2937]">Securely provision new doctor accounts. Authorized access only.</p>

            <form onSubmit={handleCreateDoctor} className="space-y-4 max-w-md">
              {adminMessage && (
                <div className={`p-3 rounded-lg text-sm font-semibold border ${adminMessage.includes('Error') ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                  {adminMessage}
                </div>
              )}
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Doctor Full Name</label>
                <input required type="text" value={adminName} onChange={e => setAdminName(e.target.value)} className="w-full rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-4 py-2 text-white focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Email Address</label>
                <input required type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} className="w-full rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-4 py-2 text-white focus:border-red-500 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Initial Password</label>
                <input required type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} className="w-full rounded-lg border border-[#1f2937] bg-[#0a0f1c] px-4 py-2 text-white focus:border-red-500 focus:outline-none" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-red-600/80 hover:bg-red-600 px-4 py-2 font-semibold text-white transition-colors border border-red-500/50 mt-4">
                Provision Doctor Account
              </button>
            </form>
          </div>
          <div className="rounded-2xl border border-[#1f2937] bg-[#111827] p-8">
            <h2 className="text-2xl font-bold text-white mb-6 border-b border-[#1f2937] pb-4">Manage Doctors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs text-slate-500 uppercase bg-[#0a0f1c] border-b border-[#1f2937]">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Role</th>
                    <th className="px-6 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="border-b border-[#1f2937] hover:bg-[#0a0f1c]/50 transition-colors">
                      <td className="px-6 py-4">
                        {editingUserId === u.id ? (
                          <input type="text" value={editUserName} onChange={e => setEditUserName(e.target.value)} className="w-full rounded border border-[#1f2937] bg-[#0a0f1c] px-2 py-1 text-white focus:border-blue-500 focus:outline-none" />
                        ) : (
                          <span className="font-medium text-white">{u.name}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        {editingUserId === u.id ? (
                          <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)} className="w-full rounded border border-[#1f2937] bg-[#0a0f1c] px-2 py-1 text-white focus:border-blue-500 focus:outline-none">
                            <option value="doctor">doctor</option>
                            <option value="admin">admin</option>
                          </select>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-1 border border-blue-500/20 text-xs text-blue-400 uppercase tracking-wider">{u.role}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingUserId === u.id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={handleUpdateUser} className="text-xs font-semibold text-emerald-400 hover:text-emerald-300">Save</button>
                            <button onClick={() => setEditingUserId(null)} className="text-xs font-semibold text-slate-400 hover:text-slate-300">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button onClick={() => { setEditingUserId(u.id); setEditUserName(u.name || ''); setEditUserRole(u.role || 'doctor'); }} className="text-blue-400 hover:text-blue-300 transition-colors">Edit</button>
                            <button onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:text-red-300 transition-colors">Delete</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {adminUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No doctors found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderAnalyzeImageTab = () => {
    // ... Multi-Model grid omitted for brevity if unchanged, but I must implement it here
    if (!uploadedImage) {
      return <div className="flex items-center justify-center h-full text-slate-500">Upload an image and run diagnostics on the Dashboard tab first.</div>
    }
    const heatmaps = Object.entries(individualHeatmaps)
    if (heatmaps.length === 0) {
      return <div className="flex items-center justify-center h-full text-slate-500">No individual heatmaps available.</div>
    }
    return (
      <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Multi-Model Vision Analysis</h2>
            <p className="text-slate-400">Compare individual Grad-CAM heatmaps from all ensemble architectures.</p>
          </div>
          
          <div className="flex items-center bg-[#111827] rounded-xl border border-[#1f2937] shadow-xl overflow-hidden w-full md:w-auto mt-2 md:mt-0">
            <div className="px-6 py-4 flex flex-1 items-center gap-4">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Low</span>
              <div className="w-24 md:w-48 h-2 rounded-full" style={{ background: 'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #ef4444)' }} />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">High</span>
              <div className="h-6 w-px bg-[#1f2937] mx-2" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Opacity</span>
              <input type="range" min="0" max="1" step="0.01" value={heatmapOpacity} onChange={(e) => setHeatmapOpacity(parseFloat(e.target.value))} className="flex-1 w-32 md:w-64 accent-blue-500 cursor-pointer" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {heatmaps.map(([model, base64]) => (
            <div key={model} className="flex flex-col rounded-2xl border border-[#1f2937] bg-[#111827] overflow-hidden group">
              <div className="px-5 py-3 border-b border-[#1f2937] bg-[#0a0f1c] flex items-center justify-between">
                <h3 className="font-semibold text-blue-400">{model}</h3>
                <BrainCircuitIcon className="h-4 w-4 text-slate-500" />
              </div>
              <div className="relative aspect-square bg-black p-4 flex items-center justify-center">
                {uploadedImage && <img src={uploadedImage} className="absolute inset-0 w-full h-full object-contain p-4" alt="Original" />}
                {base64 && <img src={base64} className="absolute inset-0 z-10 w-full h-full object-contain p-4" alt={`${model} Heatmap`} style={{ opacity: heatmapOpacity }} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderAnalyticsTab = () => {
    if (predictions.length === 0) return <div className="flex items-center justify-center h-full text-slate-500">Upload an image and run diagnostics first.</div>
    return (
      <div className="flex flex-col gap-8 h-full overflow-y-auto custom-scrollbar">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Deep Dive Analytics & Custom Thresholds</h2>
          <p className="text-slate-400">Adjust thresholds interactively to override default sensitivity logic.</p>
        </div>
        <div className="flex flex-col gap-6 pb-8">
          {predictions.map(pred => {
            const disease = pred.disease;
            const threshold = customThresholds[disease] ?? pred.threshold;
            const conf = pred.confidence;
            const isHigh = conf >= threshold;
            return (
              <div key={disease} className={`rounded-2xl border ${isHigh ? 'border-red-500/30' : 'border-[#1f2937]'} bg-[#111827] p-6 transition-colors`}>
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-6 gap-4">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-bold text-slate-200">{disease}</h3>
                    {isHigh ? <span className="rounded bg-red-500/20 px-2 py-1 text-xs font-bold text-red-500 uppercase tracking-wider border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">Positive</span> : <span className="rounded bg-emerald-500/20 px-2 py-1 text-xs font-bold text-emerald-400 uppercase tracking-wider border border-emerald-500/30">Negative</span>}
                    <span className="text-sm font-semibold text-slate-400">Total Conf: {(conf * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-4 rounded-lg bg-[#0a0f1c] px-4 py-2 border border-[#1f2937]">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Threshold Override</label>
                    <input type="range" min="0" max="100" value={threshold * 100} onChange={e => setCustomThresholds(prev => ({ ...prev, [disease]: parseInt(e.target.value) / 100 }))} className="w-32 lg:w-48 accent-blue-500 cursor-pointer" />
                    <span className={`text-sm font-bold w-12 text-right ${isHigh ? 'text-red-400' : 'text-blue-400'}`}>{(threshold * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {Object.entries(individualPredictions).map(([model, preds]) => {
                    const diseasePred = Array.isArray(preds) ? preds.find((p: any) => p.disease === disease) : null;
                    const prob = diseasePred ? diseasePred.probability / 100 : 0;
                    const modelIsHigh = prob >= threshold;
                    return (
                      <div key={model} className="flex flex-col gap-2 rounded-lg bg-[#0a0f1c] p-3 border border-[#1f2937]">
                        <span className="text-xs font-semibold text-slate-400 truncate" title={model}>{model}</span>
                        <span className={`text-lg font-bold ${modelIsHigh ? 'text-red-400' : 'text-blue-400'}`}>{(prob * 100).toFixed(1)}%</span>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden"><div className={`h-full transition-all duration-300 ${modelIsHigh ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-blue-500'}`} style={{ width: `${prob * 100}%` }}></div></div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0f1c] text-slate-200 overflow-hidden font-sans">
      <aside className="w-64 border-r border-[#1f2937] bg-[#0a0f1c] flex flex-col justify-between shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500/20">
              <BrainCircuitIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wider text-white">XRAIX</h1>
              <p className="text-[10px] text-slate-400 tracking-wide uppercase">AI-Powered Diagnostic</p>
            </div>
          </div>

          <nav className="space-y-2">
            {[
              { name: 'Dashboard', icon: LayoutDashboard },
              { name: 'Analyze Image', icon: ImageIcon },
              { name: 'Patient History', icon: History },
              { name: 'Analytics', icon: BarChart2 },
              { name: 'Settings', icon: Settings },
            ].map((item) => {
              // Hide History and Settings from Guests
              if (user.profile?.role === 'guest' && (item.name === 'Patient History' || item.name === 'Settings')) {
                return null;
              }
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveNav(item.name)}
                  className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${activeNav === item.name
                      ? 'bg-blue-500/10 text-blue-400 shadow-[inset_4px_0_0_0_rgba(59,130,246,0.8)]'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#1f2937] bg-[#111827] px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 transition-all mb-4 cursor-pointer">
            <LogOut className="h-4 w-4" /> Secure Logout
          </button>
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[#111827] border border-[#1f2937] p-4 text-center">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Secure & Private</h3>
            <p className="text-xs text-slate-400">HIPAA Compliant DB Sync</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex h-20 items-center justify-between border-b border-[#1f2937] bg-[#0a0f1c] px-8 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Welcome, <span className="text-blue-400">{user.profile?.name || 'Doctor'}</span></h2>
            <p className="text-sm text-slate-400">Let's analyze and detect lung conditions with precision.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 rounded-full border border-[#1f2937] bg-[#111827] px-4 py-1.5">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300">Supabase DB Sync: Active</span>
            </div>
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }} className="relative rounded-full border border-[#1f2937] bg-[#111827] p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border border-[#1f2937] bg-[#111827] shadow-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1f2937] bg-[#0a0f1c]">
                    <span className="text-sm font-semibold text-white">Notifications</span>
                  </div>
                  <div className="p-6 flex flex-col items-center justify-center text-center">
                    <Bell className="h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-sm text-slate-400">No new notifications</p>
                    <p className="text-xs text-slate-500 mt-1">You're all caught up!</p>
                  </div>
                </div>
              )}
            </div>
            {/* User Profile Dropdown */}
            <div className="relative">
              <div onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }} className="flex items-center gap-3 rounded-full border border-[#1f2937] bg-[#111827] px-3 py-1.5 cursor-pointer hover:bg-slate-800 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
                  <User className="h-4 w-4 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-white">{user.profile?.name || 'N/A'}</span>
                  <span className="text-xs text-slate-400 uppercase">{user.profile?.role || 'Doctor'}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 ml-2 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </div>
              {showUserMenu && (
                <div className="absolute right-0 top-14 z-50 w-48 rounded-xl border border-[#1f2937] bg-[#111827] shadow-2xl overflow-hidden">
                  {!isGuest && (
                    <>
                      <button onClick={() => { setActiveNav('Settings'); setShowUserMenu(false) }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-[#0a0f1c] hover:text-white transition-colors cursor-pointer">
                        <Settings className="h-4 w-4 text-slate-400" /> Settings
                      </button>
                      <div className="border-t border-[#1f2937]" />
                    </>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8 custom-scrollbar relative">
          {activeNav === 'Dashboard' && renderDashboardTab()}
          {activeNav === 'Analyze Image' && renderAnalyzeImageTab()}
          {activeNav === 'Analytics' && renderAnalyticsTab()}
          {activeNav === 'Patient History' && renderPatientHistoryTab()}
          {activeNav === 'Settings' && renderSettingsTab()}
          {['Reports'].includes(activeNav) && (
            <div className="flex items-center justify-center h-full text-slate-500">
              {activeNav} view is under construction.
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function BrainCircuitIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  )
}
