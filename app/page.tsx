'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  FiUser, FiBarChart2, FiTarget, FiTrendingUp, FiAward, FiBookOpen,
  FiRefreshCw, FiActivity, FiAlertTriangle, FiCheckCircle,
  FiClock, FiMapPin, FiBriefcase, FiZap, FiLayers, FiGrid,
  FiDollarSign, FiUsers, FiPercent, FiStar, FiPlay,
  FiChevronRight, FiChevronDown, FiCompass, FiPieChart, FiArrowRight
} from 'react-icons/fi'
import {
  RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Line, Area, AreaChart,
  ResponsiveContainer
} from 'recharts'

// ─── AGENT IDS ───
const ORCHESTRATOR_AGENT_ID = '69a012c83dc260b752bd74f1'
const WORKFORCE_AGENT_ID = '69a012c85fed26b186572e52'
const PREDICTIVE_AGENT_ID = '69a012dc3dc260b752bd74f3'

// ─── CHART COLORS ───
const CHART_COLORS = {
  c1: 'hsl(27, 61%, 26%)',
  c2: 'hsl(43, 75%, 38%)',
  c3: 'hsl(30, 55%, 25%)',
  c4: 'hsl(35, 45%, 42%)',
  c5: 'hsl(20, 65%, 35%)',
}

// ─── ROLE OPTIONS ───
const ROLES = [
  'Software Engineer', 'Senior Software Engineer', 'Tech Lead', 'Engineering Manager',
  'Product Manager', 'Senior Product Manager', 'Data Scientist', 'Senior Data Scientist',
  'ML Engineer', 'DevOps Engineer', 'Cloud Architect', 'UX Designer',
  'Senior UX Designer', 'QA Engineer', 'Security Engineer', 'Business Analyst',
  'Project Manager', 'VP of Engineering',
]

// ─── SECTION DEFINITIONS ───
type EmployeeSection = 'assessment' | 'radar' | 'gaps' | 'learning-path' | 'mobility' | 'roi'
type ManagerSection = 'wf-overview' | 'wf-heatmap' | 'wf-shortage' | 'wf-funnel' | 'wf-effectiveness' | 'wf-roi' | 'wf-underperforming' | 'pred-forecast'

const EMPLOYEE_SECTIONS: { id: EmployeeSection; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'assessment', label: 'Skill Assessment', icon: FiPlay },
  { id: 'radar', label: 'Skill Radar & Readiness', icon: FiTarget },
  { id: 'gaps', label: 'Gap Analysis', icon: FiGrid },
  { id: 'learning-path', label: 'Learning Path', icon: FiBookOpen },
  { id: 'mobility', label: 'Career Mobility', icon: FiMapPin },
  { id: 'roi', label: 'ROI Metrics', icon: FiDollarSign },
]

const MANAGER_SECTIONS: { id: ManagerSection; label: string; icon: React.ComponentType<any>; group: string }[] = [
  { id: 'wf-overview', label: 'Workforce Overview', icon: FiUsers, group: 'Workforce Intelligence' },
  { id: 'wf-heatmap', label: 'Skill Heatmap', icon: FiLayers, group: 'Workforce Intelligence' },
  { id: 'wf-shortage', label: 'Shortage Index', icon: FiAlertTriangle, group: 'Workforce Intelligence' },
  { id: 'wf-funnel', label: 'Readiness Funnel', icon: FiBarChart2, group: 'Workforce Intelligence' },
  { id: 'wf-effectiveness', label: 'Effectiveness Analytics', icon: FiActivity, group: 'Workforce Intelligence' },
  { id: 'wf-roi', label: 'ROI by Department', icon: FiDollarSign, group: 'Workforce Intelligence' },
  { id: 'wf-underperforming', label: 'Underperforming Programs', icon: FiAlertTriangle, group: 'Workforce Intelligence' },
  { id: 'pred-forecast', label: 'Predictive Forecast', icon: FiTrendingUp, group: 'Predictive Analytics' },
]

// ─── TYPESCRIPT INTERFACES ───
interface OrchestratorResponse {
  overall_readiness_score: number
  employee_name: string
  current_role: string
  target_role: string
  skill_radar_data: Array<{ skill_name: string; current_score: number; required_score: number }>
  gap_heatmap: Array<{ skill_name: string; category: string; delta: number; classification: string }>
  learning_path: {
    momentum_score: number
    total_weeks: number
    activities: Array<{ title: string; type: string; skill: string; hours: number; sequence: number }>
  }
  mobility_matches: Array<{ role_title: string; department: string; readiness: number; gap_skills: string[] }>
  roi_metrics: {
    effectiveness_score: number
    acquisition_velocity: number
    program_roi: number
    retention_lift: number
  }
  gap_summary: { critical_count: number; important_count: number; enhancement_count: number }
}

interface WorkforceResponse {
  summary_cards: {
    total_employees_assessed: number
    critical_skill_gaps: number
    avg_readiness_score: number
    learning_roi_percentage: number
  }
  skill_heatmap: Array<{
    department: string
    skills: Array<{ skill_name: string; proficiency: number; gap_severity: string }>
  }>
  shortage_index: Array<{
    skill_name: string
    shortage_severity: string
    affected_departments: string[]
    employees_with_skill: number
    employees_needing_skill: number
  }>
  readiness_funnel: Array<{
    role: string
    not_ready: number
    developing: number
    nearly_ready: number
    ready: number
  }>
  effectiveness_analytics: {
    adoption_rate: number
    completion_rate: number
    avg_skill_lift: number
    performance_correlation: number
    retention_correlation: number
    promotion_acceleration: number
  }
  roi_by_department: Array<{ department: string; investment: number; returns: number; roi_percentage: number }>
  underperforming_programs: Array<{
    program_name: string
    completion_rate: number
    skill_lift: number
    cost: number
    recommendation: string
  }>
}

interface PredictiveResponse {
  scenario: string
  forecast_horizon_months: number
  skill_shortage_forecasts: Array<{
    skill_name: string
    current_supply: number
    projected_demand: number
    gap_at_6_months: number
    gap_at_12_months: number
    gap_at_18_months: number
    severity: string
  }>
  hiring_vs_upskilling: Array<{
    skill_name: string
    hire_cost: number
    hire_time_months: number
    upskill_cost: number
    upskill_time_months: number
    recommendation: string
    confidence: number
  }>
  readiness_projections: Array<{
    month: number
    readiness_percentage: number
    confidence_lower: number
    confidence_upper: number
  }>
  strategic_recommendations: Array<{
    title: string
    description: string
    priority: string
    impact: string
    timeline: string
  }>
}

// ─── SAMPLE DATA ───
const SAMPLE_ORCHESTRATOR: OrchestratorResponse = {
  overall_readiness_score: 68,
  employee_name: 'Alex Morgan',
  current_role: 'Software Engineer',
  target_role: 'Tech Lead',
  skill_radar_data: [
    { skill_name: 'System Design', current_score: 65, required_score: 90 },
    { skill_name: 'Team Leadership', current_score: 45, required_score: 85 },
    { skill_name: 'Architecture', current_score: 70, required_score: 95 },
    { skill_name: 'Code Review', current_score: 80, required_score: 90 },
    { skill_name: 'Mentoring', current_score: 50, required_score: 80 },
    { skill_name: 'Stakeholder Mgmt', current_score: 40, required_score: 75 },
    { skill_name: 'Performance Tuning', current_score: 75, required_score: 85 },
    { skill_name: 'Strategic Planning', current_score: 35, required_score: 80 },
  ],
  gap_heatmap: [
    { skill_name: 'Team Leadership', category: 'Leadership', delta: 40, classification: 'Critical' },
    { skill_name: 'Strategic Planning', category: 'Leadership', delta: 45, classification: 'Critical' },
    { skill_name: 'Stakeholder Mgmt', category: 'Communication', delta: 35, classification: 'Critical' },
    { skill_name: 'System Design', category: 'Technical', delta: 25, classification: 'Important' },
    { skill_name: 'Architecture', category: 'Technical', delta: 25, classification: 'Important' },
    { skill_name: 'Mentoring', category: 'Leadership', delta: 30, classification: 'Important' },
    { skill_name: 'Code Review', category: 'Technical', delta: 10, classification: 'Enhancement' },
    { skill_name: 'Performance Tuning', category: 'Technical', delta: 10, classification: 'Enhancement' },
  ],
  learning_path: {
    momentum_score: 72,
    total_weeks: 24,
    activities: [
      { title: 'Leadership Foundations Masterclass', type: 'Course', skill: 'Team Leadership', hours: 20, sequence: 1 },
      { title: 'System Design Interview Prep', type: 'Workshop', skill: 'System Design', hours: 15, sequence: 2 },
      { title: 'Lead a Cross-Team Feature', type: 'Stretch Assignment', skill: 'Stakeholder Mgmt', hours: 40, sequence: 3 },
      { title: 'AWS Solutions Architect Certification', type: 'Certification', skill: 'Architecture', hours: 30, sequence: 4 },
      { title: 'Mentor Two Junior Engineers', type: 'On-the-Job', skill: 'Mentoring', hours: 24, sequence: 5 },
      { title: 'Strategic Technical Planning Workshop', type: 'Workshop', skill: 'Strategic Planning', hours: 12, sequence: 6 },
    ],
  },
  mobility_matches: [
    { role_title: 'Tech Lead - Platform', department: 'Engineering', readiness: 72, gap_skills: ['Strategic Planning', 'Team Leadership'] },
    { role_title: 'Senior Engineer - Architecture', department: 'Infrastructure', readiness: 85, gap_skills: ['Stakeholder Mgmt'] },
    { role_title: 'Engineering Manager - Mobile', department: 'Product Engineering', readiness: 55, gap_skills: ['Team Leadership', 'Strategic Planning', 'Stakeholder Mgmt'] },
  ],
  roi_metrics: { effectiveness_score: 78, acquisition_velocity: 3.2, program_roi: 245, retention_lift: 18 },
  gap_summary: { critical_count: 3, important_count: 3, enhancement_count: 2 },
}

const SAMPLE_WORKFORCE: WorkforceResponse = {
  summary_cards: { total_employees_assessed: 847, critical_skill_gaps: 156, avg_readiness_score: 64, learning_roi_percentage: 312 },
  skill_heatmap: [
    { department: 'Engineering', skills: [{ skill_name: 'Cloud Architecture', proficiency: 72, gap_severity: 'Low' }, { skill_name: 'AI/ML', proficiency: 45, gap_severity: 'Critical' }, { skill_name: 'Security', proficiency: 58, gap_severity: 'High' }, { skill_name: 'Leadership', proficiency: 52, gap_severity: 'High' }] },
    { department: 'Product', skills: [{ skill_name: 'Cloud Architecture', proficiency: 35, gap_severity: 'Critical' }, { skill_name: 'AI/ML', proficiency: 40, gap_severity: 'Critical' }, { skill_name: 'Security', proficiency: 30, gap_severity: 'Critical' }, { skill_name: 'Leadership', proficiency: 68, gap_severity: 'Low' }] },
    { department: 'Data Science', skills: [{ skill_name: 'Cloud Architecture', proficiency: 55, gap_severity: 'High' }, { skill_name: 'AI/ML', proficiency: 82, gap_severity: 'Low' }, { skill_name: 'Security', proficiency: 48, gap_severity: 'High' }, { skill_name: 'Leadership', proficiency: 45, gap_severity: 'Critical' }] },
    { department: 'DevOps', skills: [{ skill_name: 'Cloud Architecture', proficiency: 88, gap_severity: 'Low' }, { skill_name: 'AI/ML', proficiency: 30, gap_severity: 'Critical' }, { skill_name: 'Security', proficiency: 75, gap_severity: 'Low' }, { skill_name: 'Leadership', proficiency: 42, gap_severity: 'Critical' }] },
  ],
  shortage_index: [
    { skill_name: 'AI/ML Engineering', shortage_severity: 'Critical', affected_departments: ['Engineering', 'Product', 'DevOps'], employees_with_skill: 34, employees_needing_skill: 120 },
    { skill_name: 'Cybersecurity', shortage_severity: 'High', affected_departments: ['Engineering', 'Data Science'], employees_with_skill: 45, employees_needing_skill: 95 },
    { skill_name: 'Cloud Native', shortage_severity: 'Medium', affected_departments: ['Product', 'Data Science'], employees_with_skill: 78, employees_needing_skill: 110 },
    { skill_name: 'Leadership & Mgmt', shortage_severity: 'High', affected_departments: ['Engineering', 'Data Science', 'DevOps'], employees_with_skill: 52, employees_needing_skill: 88 },
  ],
  readiness_funnel: [
    { role: 'Senior Engineer', not_ready: 25, developing: 45, nearly_ready: 20, ready: 10 },
    { role: 'Tech Lead', not_ready: 40, developing: 30, nearly_ready: 18, ready: 12 },
    { role: 'Eng Manager', not_ready: 55, developing: 25, nearly_ready: 12, ready: 8 },
    { role: 'Data Scientist', not_ready: 30, developing: 35, nearly_ready: 22, ready: 13 },
    { role: 'Product Manager', not_ready: 20, developing: 40, nearly_ready: 25, ready: 15 },
  ],
  effectiveness_analytics: { adoption_rate: 78, completion_rate: 65, avg_skill_lift: 23, performance_correlation: 0.72, retention_correlation: 0.68, promotion_acceleration: 34 },
  roi_by_department: [
    { department: 'Engineering', investment: 450000, returns: 1350000, roi_percentage: 200 },
    { department: 'Product', investment: 280000, returns: 820000, roi_percentage: 193 },
    { department: 'Data Science', investment: 320000, returns: 1100000, roi_percentage: 244 },
    { department: 'DevOps', investment: 180000, returns: 590000, roi_percentage: 228 },
    { department: 'Design', investment: 150000, returns: 380000, roi_percentage: 153 },
  ],
  underperforming_programs: [
    { program_name: 'Legacy Java Migration Track', completion_rate: 32, skill_lift: 8, cost: 85000, recommendation: 'Replace with modern cloud-native curriculum' },
    { program_name: 'Basic SQL Bootcamp', completion_rate: 45, skill_lift: 12, cost: 42000, recommendation: 'Merge with Data Engineering pathway' },
    { program_name: 'Generic Leadership 101', completion_rate: 28, skill_lift: 5, cost: 65000, recommendation: 'Replace with role-specific leadership modules' },
  ],
}

const SAMPLE_PREDICTIVE: PredictiveResponse = {
  scenario: 'Rapid AI/ML adoption across all product lines requiring 40% workforce upskilling in generative AI, MLOps, and responsible AI practices',
  forecast_horizon_months: 18,
  skill_shortage_forecasts: [
    { skill_name: 'Generative AI', current_supply: 15, projected_demand: 85, gap_at_6_months: -35, gap_at_12_months: -55, gap_at_18_months: -70, severity: 'Critical' },
    { skill_name: 'MLOps', current_supply: 22, projected_demand: 60, gap_at_6_months: -20, gap_at_12_months: -30, gap_at_18_months: -38, severity: 'High' },
    { skill_name: 'Responsible AI', current_supply: 8, projected_demand: 45, gap_at_6_months: -18, gap_at_12_months: -28, gap_at_18_months: -37, severity: 'Critical' },
    { skill_name: 'Data Engineering', current_supply: 40, projected_demand: 65, gap_at_6_months: -10, gap_at_12_months: -18, gap_at_18_months: -25, severity: 'Medium' },
    { skill_name: 'Cloud ML Services', current_supply: 30, projected_demand: 55, gap_at_6_months: -12, gap_at_12_months: -20, gap_at_18_months: -25, severity: 'High' },
  ],
  hiring_vs_upskilling: [
    { skill_name: 'Generative AI', hire_cost: 185000, hire_time_months: 4, upskill_cost: 12000, upskill_time_months: 6, recommendation: 'Hybrid: Hire 30%, Upskill 70%', confidence: 0.82 },
    { skill_name: 'MLOps', hire_cost: 165000, hire_time_months: 3, upskill_cost: 8500, upskill_time_months: 4, recommendation: 'Upskill Priority', confidence: 0.88 },
    { skill_name: 'Responsible AI', hire_cost: 195000, hire_time_months: 5, upskill_cost: 6000, upskill_time_months: 3, recommendation: 'Upskill Priority', confidence: 0.91 },
    { skill_name: 'Data Engineering', hire_cost: 155000, hire_time_months: 3, upskill_cost: 9000, upskill_time_months: 5, recommendation: 'Upskill Priority', confidence: 0.85 },
    { skill_name: 'Cloud ML Services', hire_cost: 170000, hire_time_months: 3, upskill_cost: 7500, upskill_time_months: 4, recommendation: 'Hybrid: Hire 20%, Upskill 80%', confidence: 0.87 },
  ],
  readiness_projections: [
    { month: 0, readiness_percentage: 32, confidence_lower: 30, confidence_upper: 34 },
    { month: 3, readiness_percentage: 42, confidence_lower: 38, confidence_upper: 46 },
    { month: 6, readiness_percentage: 55, confidence_lower: 49, confidence_upper: 61 },
    { month: 9, readiness_percentage: 65, confidence_lower: 57, confidence_upper: 73 },
    { month: 12, readiness_percentage: 74, confidence_lower: 64, confidence_upper: 84 },
    { month: 15, readiness_percentage: 82, confidence_lower: 70, confidence_upper: 94 },
    { month: 18, readiness_percentage: 88, confidence_lower: 74, confidence_upper: 100 },
  ],
  strategic_recommendations: [
    { title: 'Launch AI Academy Program', description: 'Create an internal AI Academy with tiered learning paths for Generative AI, MLOps, and Responsible AI.', priority: 'Critical', impact: 'High', timeline: '0-3 months' },
    { title: 'Hire Strategic AI Leaders', description: 'Recruit 5-8 senior AI practitioners to serve as technical leads and internal trainers.', priority: 'High', impact: 'High', timeline: '1-4 months' },
    { title: 'Establish AI Ethics Board', description: 'Form a cross-functional Responsible AI committee to develop governance frameworks.', priority: 'Critical', impact: 'Medium', timeline: '0-2 months' },
    { title: 'Cloud ML Infrastructure Investment', description: 'Upgrade cloud infrastructure to support ML workloads and training environments.', priority: 'Medium', impact: 'High', timeline: '2-6 months' },
  ],
}

// ─── PARSE AGENT RESPONSE ───
function parseAgentResponse(result: any): any {
  try {
    let data = result?.response?.result
    if (typeof data === 'string') {
      try { data = JSON.parse(data) } catch { /* keep as string */ }
    }
    if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
      data = result?.response
      if (typeof data === 'string') {
        try { data = JSON.parse(data) } catch { /* keep as string */ }
      }
    }
    return data
  } catch {
    return null
  }
}

// ─── HELPERS ───
function classificationBadge(classification: string) {
  const cls = (classification ?? '').toLowerCase()
  if (cls === 'critical') return <Badge variant="destructive" className="text-xs">{classification}</Badge>
  if (cls === 'important' || cls === 'high') return <Badge className="text-xs bg-accent text-accent-foreground">{classification}</Badge>
  return <Badge variant="secondary" className="text-xs">{classification}</Badge>
}

function severityColor(severity: string): string {
  const s = (severity ?? '').toLowerCase()
  if (s === 'critical') return 'bg-destructive/15 text-destructive border-destructive/30'
  if (s === 'high') return 'bg-accent/15 text-accent-foreground border-accent/30'
  if (s === 'medium') return 'bg-primary/10 text-primary border-primary/20'
  return 'bg-muted text-muted-foreground border-muted'
}

function heatmapCellColor(proficiency: number): string {
  if (proficiency >= 75) return 'bg-green-700/20 text-green-900'
  if (proficiency >= 55) return 'bg-yellow-600/20 text-yellow-900'
  if (proficiency >= 35) return 'bg-orange-600/20 text-orange-900'
  return 'bg-red-600/20 text-red-900'
}

function formatCurrency(val: number): string {
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
  return `$${val}`
}

function typeBadgeClass(type: string): string {
  const t = (type ?? '').toLowerCase()
  if (t === 'course') return 'bg-primary/15 text-primary border-primary/25'
  if (t === 'workshop') return 'bg-accent/15 text-accent-foreground border-accent/25'
  if (t === 'certification') return 'bg-green-700/15 text-green-900 border-green-700/25'
  if (t === 'stretch assignment') return 'bg-purple-700/15 text-purple-900 border-purple-700/25'
  if (t === 'on-the-job') return 'bg-blue-700/15 text-blue-900 border-blue-700/25'
  return 'bg-muted text-muted-foreground border-muted'
}

// ─── ERROR BOUNDARY ───
class PageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button onClick={() => this.setState({ hasError: false, error: '' })} className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">Try again</button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── READINESS GAUGE ───
function ReadinessGauge({ score }: { score: number }) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? 'stroke-green-600' : score >= 60 ? 'stroke-accent' : 'stroke-destructive'
  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="hsl(35, 15%, 85%)" strokeWidth="12" />
        <circle cx="80" cy="80" r={radius} fill="none" className={color} strokeWidth="12" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" transform="rotate(-90 80 80)" />
        <text x="80" y="72" textAnchor="middle" className="fill-foreground font-mono text-3xl font-bold">{score}%</text>
        <text x="80" y="96" textAnchor="middle" className="fill-muted-foreground text-xs">Readiness</text>
      </svg>
    </div>
  )
}

// ─── SKELETON LOADER ───
function SkeletonDashboard({ message }: { message: string }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/15">
        <FiRefreshCw className="animate-spin text-primary text-lg" />
        <span className="text-sm font-medium text-primary">{message}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="shadow-md"><CardContent className="p-5"><Skeleton className="h-4 w-20 mb-3" /><Skeleton className="h-8 w-16 mb-2" /><Skeleton className="h-3 w-24" /></CardContent></Card>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md"><CardContent className="p-6"><Skeleton className="h-5 w-40 mb-4" /><Skeleton className="h-[280px] w-full rounded-lg" /></CardContent></Card>
        <Card className="shadow-md"><CardContent className="p-6"><Skeleton className="h-5 w-40 mb-4" /><Skeleton className="h-[280px] w-full rounded-lg" /></CardContent></Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════

export default function Page() {
  const [activeView, setActiveView] = useState<'employee' | 'manager'>('employee')
  const [activeEmployeeSection, setActiveEmployeeSection] = useState<EmployeeSection>('assessment')
  const [activeManagerSection, setActiveManagerSection] = useState<ManagerSection>('wf-overview')

  const [currentRole, setCurrentRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [orchestratorData, setOrchestratorData] = useState<OrchestratorResponse | null>(null)
  const [workforceData, setWorkforceData] = useState<WorkforceResponse | null>(null)
  const [predictiveData, setPredictiveData] = useState<PredictiveResponse | null>(null)
  const [isAssessing, setIsAssessing] = useState(false)
  const [isLoadingWorkforce, setIsLoadingWorkforce] = useState(false)
  const [isLoadingForecast, setIsLoadingForecast] = useState(false)
  const [scenario, setScenario] = useState('')
  const [assessmentComplete, setAssessmentComplete] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [showSample, setShowSample] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const mainRef = useRef<HTMLDivElement>(null)

  // Scroll to top on section change
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [activeEmployeeSection, activeManagerSection])

  // ─── HANDLERS ───
  const handleStartAssessment = useCallback(async () => {
    if (!currentRole || !targetRole) return
    setIsAssessing(true)
    setAssessmentComplete(false)
    setOrchestratorData(null)
    setErrorMsg(null)
    setActiveAgentId(ORCHESTRATOR_AGENT_ID)
    try {
      const message = `Perform a comprehensive skill gap assessment for an employee transitioning from ${currentRole} to ${targetRole}. Generate skill radar data, gap heatmap, learning path, mobility matches, and ROI metrics.`
      const result = await callAIAgent(message, ORCHESTRATOR_AGENT_ID)
      if (result.success) {
        const data = parseAgentResponse(result)
        if (data) {
          setOrchestratorData(data as OrchestratorResponse)
          setAssessmentComplete(true)
          setActiveEmployeeSection('radar')
        } else {
          setErrorMsg('Failed to parse assessment response. Please try again.')
        }
      } else {
        setErrorMsg(result.error ?? 'Assessment failed. Please try again.')
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setIsAssessing(false)
      setActiveAgentId(null)
    }
  }, [currentRole, targetRole])

  const handleRefreshWorkforce = useCallback(async () => {
    setIsLoadingWorkforce(true)
    setWorkforceData(null)
    setErrorMsg(null)
    setActiveAgentId(WORKFORCE_AGENT_ID)
    try {
      const message = 'Generate comprehensive workforce intelligence report including org-wide skill heatmap, skill distribution, critical shortage index, readiness funnels, learning effectiveness analytics, ROI by department, and underperforming program detection for the entire organization.'
      const result = await callAIAgent(message, WORKFORCE_AGENT_ID)
      if (result.success) {
        const data = parseAgentResponse(result)
        if (data) setWorkforceData(data as WorkforceResponse)
        else setErrorMsg('Failed to parse workforce data. Please try again.')
      } else {
        setErrorMsg(result.error ?? 'Workforce analysis failed. Please try again.')
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoadingWorkforce(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleRunForecast = useCallback(async () => {
    if (!scenario.trim()) return
    setIsLoadingForecast(true)
    setPredictiveData(null)
    setErrorMsg(null)
    setActiveAgentId(PREDICTIVE_AGENT_ID)
    try {
      const message = `Run a capability gap forecast and hiring vs upskilling simulation for the following scenario: ${scenario}. Analyze skill shortage trends over 6-18 months, provide hiring vs upskilling trade-off analysis, workforce readiness projections, and strategic recommendations.`
      const result = await callAIAgent(message, PREDICTIVE_AGENT_ID)
      if (result.success) {
        const data = parseAgentResponse(result)
        if (data) setPredictiveData(data as PredictiveResponse)
        else setErrorMsg('Failed to parse forecast data. Please try again.')
      } else {
        setErrorMsg(result.error ?? 'Forecast failed. Please try again.')
      }
    } catch {
      setErrorMsg('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoadingForecast(false)
      setActiveAgentId(null)
    }
  }, [scenario])

  const displayOrchestrator = showSample ? SAMPLE_ORCHESTRATOR : orchestratorData
  const displayWorkforce = showSample ? SAMPLE_WORKFORCE : workforceData
  const displayPredictive = showSample ? SAMPLE_PREDICTIVE : predictiveData
  const hasEmployeeData = showSample || assessmentComplete

  // Group manager sections
  const managerGroups = MANAGER_SECTIONS.reduce<Record<string, typeof MANAGER_SECTIONS>>((acc, s) => {
    if (!acc[s.group]) acc[s.group] = []
    acc[s.group].push(s)
    return acc
  }, {})

  return (
    <PageErrorBoundary>
      <div className="min-h-screen bg-background text-foreground flex">
        {/* ═══ SIDEBAR ═══ */}
        <aside className="w-72 flex-shrink-0 border-r border-sidebar-border bg-[hsl(35,25%,90%)] flex flex-col h-screen sticky top-0">
          {/* Logo */}
          <div className="p-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <FiAward className="text-primary-foreground text-lg" />
              </div>
              <div>
                <h1 className="font-serif font-bold text-base tracking-wide leading-tight">AI Learning</h1>
                <p className="text-xs text-muted-foreground font-sans">Co-Pilot Platform</p>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="px-3 pt-4 pb-2">
            <div className="flex rounded-lg bg-[hsl(35,20%,85%)] p-1">
              <button
                onClick={() => { setActiveView('employee'); setActiveEmployeeSection('assessment') }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${activeView === 'employee' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FiUser className="text-sm" /> Employee
              </button>
              <button
                onClick={() => { setActiveView('manager'); setActiveManagerSection('wf-overview') }}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${activeView === 'manager' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FiBarChart2 className="text-sm" /> L&D Manager
              </button>
            </div>
          </div>

          {/* Section Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {activeView === 'employee' && (
              <>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-2 pb-1">Employee Sections</p>
                {EMPLOYEE_SECTIONS.map(sec => {
                  const isActive = activeEmployeeSection === sec.id
                  const needsData = sec.id !== 'assessment' && !hasEmployeeData
                  return (
                    <button
                      key={sec.id}
                      onClick={() => setActiveEmployeeSection(sec.id)}
                      disabled={needsData}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                          : needsData
                            ? 'text-muted-foreground/40 cursor-not-allowed'
                            : 'text-foreground hover:bg-[hsl(35,20%,85%)]'
                      }`}
                    >
                      <sec.icon className={`text-sm flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                      <span className="font-sans text-left">{sec.label}</span>
                      {isActive && <FiChevronRight className="ml-auto text-xs text-primary" />}
                    </button>
                  )
                })}
              </>
            )}

            {activeView === 'manager' && (
              <>
                {Object.entries(managerGroups).map(([group, sections]) => (
                  <div key={group}>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-3 pt-3 pb-1">{group}</p>
                    {sections.map(sec => {
                      const isActive = activeManagerSection === sec.id
                      return (
                        <button
                          key={sec.id}
                          onClick={() => setActiveManagerSection(sec.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                            isActive
                              ? 'bg-primary/10 text-primary font-medium border border-primary/20'
                              : 'text-foreground hover:bg-[hsl(35,20%,85%)]'
                          }`}
                        >
                          <sec.icon className={`text-sm flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                          <span className="font-sans text-left">{sec.label}</span>
                          {isActive && <FiChevronRight className="ml-auto text-xs text-primary" />}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </>
            )}
          </nav>

          {/* Agent Status Footer */}
          <div className="p-3 border-t border-sidebar-border">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1 pb-2">AI Agents</p>
            <div className="space-y-1.5">
              {[
                { id: ORCHESTRATOR_AGENT_ID, name: 'Orchestrator' },
                { id: WORKFORCE_AGENT_ID, name: 'Workforce Intel' },
                { id: PREDICTIVE_AGENT_ID, name: 'Predictive Gap' },
              ].map(agent => (
                <div key={agent.id} className="flex items-center gap-2 px-1">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <span className={`text-[11px] ${activeAgentId === agent.id ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{agent.name}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main ref={mainRef} className="flex-1 overflow-y-auto h-screen">
          {/* TOP BAR */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold tracking-wide">
                {activeView === 'employee' ? 'AI Learning Co-Pilot' : 'L&D Command Center'}
              </h2>
              <p className="text-xs text-muted-foreground font-sans">
                {activeView === 'employee'
                  ? EMPLOYEE_SECTIONS.find(s => s.id === activeEmployeeSection)?.label ?? ''
                  : MANAGER_SECTIONS.find(s => s.id === activeManagerSection)?.label ?? ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
              <Switch id="sample-toggle" checked={showSample} onCheckedChange={setShowSample} />
            </div>
          </div>

          <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* ERROR DISPLAY */}
            {errorMsg && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                <FiAlertTriangle className="flex-shrink-0" />
                <p className="text-sm">{errorMsg}</p>
                <button onClick={() => setErrorMsg(null)} className="ml-auto text-xs underline">Dismiss</button>
              </div>
            )}

            {/* ═══ EMPLOYEE VIEW ═══ */}
            {activeView === 'employee' && (
              <>
                {/* SECTION: Assessment */}
                {activeEmployeeSection === 'assessment' && (
                  <div className="space-y-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiTarget className="text-primary" /> Skill Assessment Configuration</CardTitle>
                        <CardDescription className="font-sans leading-relaxed">Select your current role and the role you aspire to transition into. Our AI agents will perform a comprehensive skill gap analysis, generate a personalized learning path, and identify internal mobility opportunities.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div className="space-y-2">
                            <Label className="font-sans text-sm">Current Role</Label>
                            <Select value={currentRole} onValueChange={setCurrentRole}>
                              <SelectTrigger><SelectValue placeholder="Select current role" /></SelectTrigger>
                              <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-sans text-sm">Target Role</Label>
                            <Select value={targetRole} onValueChange={setTargetRole}>
                              <SelectTrigger><SelectValue placeholder="Select target role" /></SelectTrigger>
                              <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <Button onClick={handleStartAssessment} disabled={isAssessing || !currentRole || !targetRole} className="h-10">
                            {isAssessing ? <><FiRefreshCw className="mr-2 animate-spin" /> Analyzing...</> : <><FiPlay className="mr-2" /> Start Skill Assessment</>}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {isAssessing && <SkeletonDashboard message="Analyzing skill gaps, generating learning paths, and scanning mobility opportunities..." />}

                    {!isAssessing && !hasEmployeeData && (
                      <Card className="shadow-md">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FiTarget className="text-primary text-2xl" />
                          </div>
                          <h3 className="font-serif text-xl font-semibold mb-2">Begin Your Skill Assessment</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-sans">
                            Select your current role and target role above, then click &quot;Start Skill Assessment&quot; to receive a comprehensive analysis. Once complete, navigate through the sidebar sections to explore your results.
                          </p>
                          <p className="text-xs text-muted-foreground mt-4 font-sans">
                            Or toggle &quot;Sample Data&quot; in the top bar to explore with example data.
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {!isAssessing && hasEmployeeData && displayOrchestrator && (
                      <Card className="shadow-md bg-primary/5 border-primary/15">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4">
                            <FiCheckCircle className="text-green-600 text-xl flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-serif font-semibold text-sm">Assessment Complete</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {displayOrchestrator.employee_name ?? 'Employee'}: {displayOrchestrator.current_role ?? currentRole} → {displayOrchestrator.target_role ?? targetRole} | Readiness: <span className="font-mono font-bold text-primary">{displayOrchestrator.overall_readiness_score ?? 0}%</span>
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground font-sans">Use the sidebar to explore each section</p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* SECTION: Skill Radar & Readiness */}
                {activeEmployeeSection === 'radar' && hasEmployeeData && displayOrchestrator && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide">Assessment Result</CardTitle>
                          <CardDescription className="font-sans">
                            {displayOrchestrator.employee_name ?? 'Employee'} - {displayOrchestrator.current_role ?? currentRole} to {displayOrchestrator.target_role ?? targetRole}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center">
                          <ReadinessGauge score={displayOrchestrator.overall_readiness_score ?? 0} />
                          <p className="text-xs text-muted-foreground mt-2 text-center font-sans">Overall Readiness Score</p>
                        </CardContent>
                      </Card>
                      <div className="md:col-span-2">
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiTarget className="text-primary" /> Skill Radar</CardTitle>
                            <CardDescription className="font-sans">Current vs. required competency scores</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={340}>
                              <RadarChart data={Array.isArray(displayOrchestrator.skill_radar_data) ? displayOrchestrator.skill_radar_data : []}>
                                <PolarGrid stroke="hsl(35, 15%, 75%)" />
                                <PolarAngleAxis dataKey="skill_name" tick={{ fill: 'hsl(30, 22%, 14%)', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Radar name="Current" dataKey="current_score" stroke={CHART_COLORS.c1} fill={CHART_COLORS.c1} fillOpacity={0.3} />
                                <Radar name="Required" dataKey="required_score" stroke={CHART_COLORS.c2} fill={CHART_COLORS.c2} fillOpacity={0.15} />
                                <Legend />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {/* SECTION: Gap Analysis */}
                {activeEmployeeSection === 'gaps' && hasEmployeeData && displayOrchestrator && (
                  <div className="space-y-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiGrid className="text-primary" /> Gap Heatmap</CardTitle>
                        <CardDescription className="font-sans">Skill gaps classified by severity</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 mb-4 flex-wrap">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 border border-destructive/20">
                            <FiAlertTriangle className="text-destructive text-sm" />
                            <span className="font-mono text-sm font-semibold text-destructive">{displayOrchestrator.gap_summary?.critical_count ?? 0}</span>
                            <span className="text-xs text-destructive">Critical</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent/10 border border-accent/20">
                            <FiActivity className="text-accent text-sm" />
                            <span className="font-mono text-sm font-semibold">{displayOrchestrator.gap_summary?.important_count ?? 0}</span>
                            <span className="text-xs">Important</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted border border-muted">
                            <FiStar className="text-muted-foreground text-sm" />
                            <span className="font-mono text-sm font-semibold text-muted-foreground">{displayOrchestrator.gap_summary?.enhancement_count ?? 0}</span>
                            <span className="text-xs text-muted-foreground">Enhancement</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {(Array.isArray(displayOrchestrator.gap_heatmap) ? displayOrchestrator.gap_heatmap : []).map((gap, i) => {
                            const cls = (gap?.classification ?? '').toLowerCase()
                            const bgClass = cls === 'critical' ? 'bg-destructive/10 border-destructive/20' : cls === 'important' ? 'bg-accent/10 border-accent/20' : 'bg-muted border-muted'
                            return (
                              <div key={i} className={`p-3 rounded-lg border ${bgClass}`}>
                                <p className="text-xs font-medium truncate">{gap?.skill_name ?? ''}</p>
                                <p className="text-xs text-muted-foreground">{gap?.category ?? ''}</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="font-mono text-lg font-bold">{gap?.delta ?? 0}</span>
                                  {classificationBadge(gap?.classification ?? '')}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* SECTION: Learning Path */}
                {activeEmployeeSection === 'learning-path' && hasEmployeeData && displayOrchestrator && (
                  <div className="space-y-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiBookOpen className="text-primary" /> Learning Path</CardTitle>
                            <CardDescription className="font-sans">Personalized adaptive learning journey</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Momentum Score</p>
                            <p className="font-mono text-2xl font-bold text-primary">{displayOrchestrator.learning_path?.momentum_score ?? 0}%</p>
                            <p className="text-xs text-muted-foreground">{displayOrchestrator.learning_path?.total_weeks ?? 0} weeks total</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(Array.isArray(displayOrchestrator.learning_path?.activities) ? displayOrchestrator.learning_path.activities.sort((a, b) => (a?.sequence ?? 0) - (b?.sequence ?? 0)) : []).map((activity, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50 border border-secondary">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-mono font-bold">{activity?.sequence ?? i + 1}</div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">{activity?.title ?? ''}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Skill: {activity?.skill ?? ''}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="outline" className={`text-xs ${typeBadgeClass(activity?.type ?? '')}`}>{activity?.type ?? ''}</Badge>
                                <span className="text-xs text-muted-foreground font-mono flex items-center gap-1"><FiClock className="text-xs" />{activity?.hours ?? 0}h</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* SECTION: Career Mobility */}
                {activeEmployeeSection === 'mobility' && hasEmployeeData && displayOrchestrator && (
                  <div className="space-y-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiMapPin className="text-primary" /> Internal Mobility Matches</CardTitle>
                        <CardDescription className="font-sans">Career opportunities aligned with your profile</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(Array.isArray(displayOrchestrator.mobility_matches) ? displayOrchestrator.mobility_matches : []).map((match, i) => (
                            <div key={i} className="p-4 rounded-lg border border-border bg-card">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="font-medium text-sm">{match?.role_title ?? ''}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1"><FiBriefcase className="text-xs" />{match?.department ?? ''}</p>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-lg font-bold text-primary">{match?.readiness ?? 0}%</span>
                                  <p className="text-xs text-muted-foreground">Readiness</p>
                                </div>
                              </div>
                              <Progress value={match?.readiness ?? 0} className="h-2 mb-3" />
                              {Array.isArray(match?.gap_skills) && match.gap_skills.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="text-xs text-muted-foreground mr-1">Gap Skills:</span>
                                  {match.gap_skills.map((skill, j) => <Badge key={j} variant="outline" className="text-xs">{skill}</Badge>)}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* SECTION: ROI Metrics */}
                {activeEmployeeSection === 'roi' && hasEmployeeData && displayOrchestrator && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: 'Effectiveness Score', value: `${displayOrchestrator.roi_metrics?.effectiveness_score ?? 0}%`, icon: FiCheckCircle },
                        { label: 'Acquisition Velocity', value: `${displayOrchestrator.roi_metrics?.acquisition_velocity ?? 0}x`, icon: FiZap },
                        { label: 'Program ROI', value: `${displayOrchestrator.roi_metrics?.program_roi ?? 0}%`, icon: FiDollarSign },
                        { label: 'Retention Lift', value: `+${displayOrchestrator.roi_metrics?.retention_lift ?? 0}%`, icon: FiTrendingUp },
                      ].map((m, i) => (
                        <Card key={i} className="shadow-md hover:shadow-lg transition-shadow">
                          <CardContent className="p-4 flex flex-col items-center text-center">
                            <m.icon className="text-primary text-xl mb-2" />
                            <p className="font-mono text-2xl font-bold">{m.value}</p>
                            <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ═══ MANAGER VIEW ═══ */}
            {activeView === 'manager' && (
              <>
                {/* SECTION: Workforce Overview */}
                {activeManagerSection === 'wf-overview' && (
                  <div className="space-y-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-serif font-semibold text-base tracking-wide">Workforce Intelligence Report</h3>
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">Org-wide skill analytics and learning effectiveness metrics</p>
                        </div>
                        <Button onClick={handleRefreshWorkforce} disabled={isLoadingWorkforce}>
                          {isLoadingWorkforce ? <><FiRefreshCw className="mr-2 animate-spin" /> Generating...</> : <><FiRefreshCw className="mr-2" /> Refresh Intelligence</>}
                        </Button>
                      </CardContent>
                    </Card>

                    {isLoadingWorkforce && <SkeletonDashboard message="Generating workforce intelligence report across all departments..." />}

                    {!isLoadingWorkforce && displayWorkforce && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: 'Employees Assessed', value: displayWorkforce.summary_cards?.total_employees_assessed ?? 0, icon: FiUsers, fmt: (v: number) => v.toLocaleString() },
                          { label: 'Critical Skill Gaps', value: displayWorkforce.summary_cards?.critical_skill_gaps ?? 0, icon: FiAlertTriangle, fmt: (v: number) => v.toString() },
                          { label: 'Avg Readiness Score', value: displayWorkforce.summary_cards?.avg_readiness_score ?? 0, icon: FiTarget, fmt: (v: number) => `${v}%` },
                          { label: 'Learning ROI', value: displayWorkforce.summary_cards?.learning_roi_percentage ?? 0, icon: FiTrendingUp, fmt: (v: number) => `${v}%` },
                        ].map((c, i) => (
                          <Card key={i} className="shadow-md hover:shadow-lg transition-shadow">
                            <CardContent className="p-5">
                              <div className="flex items-center justify-between mb-3">
                                <c.icon className="text-primary text-lg" />
                                <Badge variant="secondary" className="text-xs font-sans">Live</Badge>
                              </div>
                              <p className="font-mono text-3xl font-bold">{c.fmt(c.value)}</p>
                              <p className="text-xs text-muted-foreground mt-1 font-sans">{c.label}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {!isLoadingWorkforce && !displayWorkforce && (
                      <Card className="shadow-md">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FiBarChart2 className="text-primary text-2xl" />
                          </div>
                          <h3 className="font-serif text-xl font-semibold mb-2">Workforce Intelligence</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-sans">
                            Click &quot;Refresh Intelligence&quot; above to generate a comprehensive org-wide report. Or toggle &quot;Sample Data&quot; to preview.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* SECTION: Skill Heatmap */}
                {activeManagerSection === 'wf-heatmap' && (
                  <div className="space-y-6">
                    {displayWorkforce ? (
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiLayers className="text-primary" /> Org-Wide Skill Heatmap</CardTitle>
                          <CardDescription className="font-sans">Department proficiency across key skills</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                          {(() => {
                            const departments = Array.isArray(displayWorkforce.skill_heatmap) ? displayWorkforce.skill_heatmap : []
                            const allSkills: string[] = []
                            departments.forEach(dept => {
                              if (Array.isArray(dept?.skills)) dept.skills.forEach(s => { if (s?.skill_name && !allSkills.includes(s.skill_name)) allSkills.push(s.skill_name) })
                            })
                            return (
                              <>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="font-serif text-sm">Department</TableHead>
                                      {allSkills.map((s, i) => <TableHead key={i} className="text-center text-xs font-sans">{s}</TableHead>)}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {departments.map((dept, i) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium text-sm">{dept?.department ?? ''}</TableCell>
                                        {allSkills.map((skillName, j) => {
                                          const skill = Array.isArray(dept?.skills) ? dept.skills.find(s => s?.skill_name === skillName) : null
                                          const prof = skill?.proficiency ?? 0
                                          return <TableCell key={j} className="text-center"><span className={`inline-block px-2 py-1 rounded text-xs font-mono font-semibold ${heatmapCellColor(prof)}`}>{prof}%</span></TableCell>
                                        })}
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-700/20 inline-block" /> 75+</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-600/20 inline-block" /> 55-74</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-orange-600/20 inline-block" /> 35-54</span>
                                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600/20 inline-block" /> Below 35</span>
                                </div>
                              </>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-md"><CardContent className="p-12 text-center"><p className="text-muted-foreground text-sm font-sans">Load workforce data from the Overview section first, or enable Sample Data.</p></CardContent></Card>
                    )}
                  </div>
                )}

                {/* SECTION: Shortage Index */}
                {activeManagerSection === 'wf-shortage' && (
                  <div className="space-y-6">
                    {displayWorkforce ? (
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiAlertTriangle className="text-primary" /> Critical Skill Shortage Index</CardTitle>
                          <CardDescription className="font-sans">Skills with the greatest supply-demand mismatch</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(Array.isArray(displayWorkforce.shortage_index) ? displayWorkforce.shortage_index : []).map((item, i) => {
                            const total = (item?.employees_needing_skill ?? 1)
                            const ratio = total > 0 ? Math.round(((item?.employees_with_skill ?? 0) / total) * 100) : 0
                            return (
                              <div key={i} className={`p-4 rounded-lg border ${severityColor(item?.shortage_severity ?? '')}`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <p className="font-medium text-sm">{item?.skill_name ?? ''}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{Array.isArray(item?.affected_departments) ? item.affected_departments.join(', ') : ''}</p>
                                  </div>
                                  {classificationBadge(item?.shortage_severity ?? '')}
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex-1"><Progress value={ratio} className="h-2" /></div>
                                  <span className="font-mono text-xs whitespace-nowrap">{item?.employees_with_skill ?? 0} / {item?.employees_needing_skill ?? 0}</span>
                                </div>
                              </div>
                            )
                          })}
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-md"><CardContent className="p-12 text-center"><p className="text-muted-foreground text-sm font-sans">Load workforce data from the Overview section first, or enable Sample Data.</p></CardContent></Card>
                    )}
                  </div>
                )}

                {/* SECTION: Readiness Funnel */}
                {activeManagerSection === 'wf-funnel' && (
                  <div className="space-y-6">
                    {displayWorkforce ? (
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiBarChart2 className="text-primary" /> Readiness Funnel by Role</CardTitle>
                          <CardDescription className="font-sans">Employee readiness distribution across target roles</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={360}>
                            <BarChart data={Array.isArray(displayWorkforce.readiness_funnel) ? displayWorkforce.readiness_funnel : []} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 80%)" />
                              <XAxis type="number" tick={{ fontSize: 11 }} />
                              <YAxis type="category" dataKey="role" width={110} tick={{ fontSize: 11 }} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="ready" stackId="a" fill="hsl(140, 50%, 35%)" name="Ready" />
                              <Bar dataKey="nearly_ready" stackId="a" fill={CHART_COLORS.c2} name="Nearly Ready" />
                              <Bar dataKey="developing" stackId="a" fill={CHART_COLORS.c4} name="Developing" />
                              <Bar dataKey="not_ready" stackId="a" fill={CHART_COLORS.c5} name="Not Ready" />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-md"><CardContent className="p-12 text-center"><p className="text-muted-foreground text-sm font-sans">Load workforce data from the Overview section first, or enable Sample Data.</p></CardContent></Card>
                    )}
                  </div>
                )}

                {/* SECTION: Effectiveness Analytics */}
                {activeManagerSection === 'wf-effectiveness' && (
                  <div className="space-y-6">
                    {displayWorkforce ? (
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiActivity className="text-primary" /> Learning Effectiveness Analytics</CardTitle>
                          <CardDescription className="font-sans">Impact metrics for L&D programs</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                              { label: 'Adoption Rate', value: `${displayWorkforce.effectiveness_analytics?.adoption_rate ?? 0}%`, icon: FiUsers },
                              { label: 'Completion Rate', value: `${displayWorkforce.effectiveness_analytics?.completion_rate ?? 0}%`, icon: FiCheckCircle },
                              { label: 'Avg Skill Lift', value: `+${displayWorkforce.effectiveness_analytics?.avg_skill_lift ?? 0}%`, icon: FiTrendingUp },
                              { label: 'Performance Corr.', value: (displayWorkforce.effectiveness_analytics?.performance_correlation ?? 0).toFixed(2), icon: FiActivity },
                              { label: 'Retention Corr.', value: (displayWorkforce.effectiveness_analytics?.retention_correlation ?? 0).toFixed(2), icon: FiAward },
                              { label: 'Promotion Accel.', value: `${displayWorkforce.effectiveness_analytics?.promotion_acceleration ?? 0}%`, icon: FiZap },
                            ].map((m, i) => (
                              <div key={i} className="p-4 rounded-lg bg-secondary/50 border border-secondary text-center">
                                <m.icon className="mx-auto text-primary text-lg mb-1.5" />
                                <p className="font-mono text-xl font-bold">{m.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-md"><CardContent className="p-12 text-center"><p className="text-muted-foreground text-sm font-sans">Load workforce data from the Overview section first, or enable Sample Data.</p></CardContent></Card>
                    )}
                  </div>
                )}

                {/* SECTION: ROI by Department */}
                {activeManagerSection === 'wf-roi' && (
                  <div className="space-y-6">
                    {displayWorkforce ? (
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiDollarSign className="text-primary" /> ROI by Department</CardTitle>
                          <CardDescription className="font-sans">Investment vs. returns across departments</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={Array.isArray(displayWorkforce.roi_by_department) ? displayWorkforce.roi_by_department : []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 80%)" />
                              <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatCurrency(v)} />
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                              <Bar dataKey="investment" fill={CHART_COLORS.c4} name="Investment" />
                              <Bar dataKey="returns" fill={CHART_COLORS.c2} name="Returns" />
                            </BarChart>
                          </ResponsiveContainer>
                          <div className="mt-4 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Department</TableHead>
                                  <TableHead className="text-xs text-right">Investment</TableHead>
                                  <TableHead className="text-xs text-right">Returns</TableHead>
                                  <TableHead className="text-xs text-right">ROI %</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(Array.isArray(displayWorkforce.roi_by_department) ? displayWorkforce.roi_by_department : []).map((r, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="text-sm font-medium">{r?.department ?? ''}</TableCell>
                                    <TableCell className="text-sm text-right font-mono">{formatCurrency(r?.investment ?? 0)}</TableCell>
                                    <TableCell className="text-sm text-right font-mono">{formatCurrency(r?.returns ?? 0)}</TableCell>
                                    <TableCell className="text-sm text-right font-mono font-semibold">{r?.roi_percentage ?? 0}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-md"><CardContent className="p-12 text-center"><p className="text-muted-foreground text-sm font-sans">Load workforce data from the Overview section first, or enable Sample Data.</p></CardContent></Card>
                    )}
                  </div>
                )}

                {/* SECTION: Underperforming Programs */}
                {activeManagerSection === 'wf-underperforming' && (
                  <div className="space-y-6">
                    {displayWorkforce ? (
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiAlertTriangle className="text-accent" /> Underperforming Programs</CardTitle>
                          <CardDescription className="font-sans">Programs flagged for review or replacement</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Program Name</TableHead>
                                <TableHead className="text-xs text-center">Completion %</TableHead>
                                <TableHead className="text-xs text-center">Skill Lift</TableHead>
                                <TableHead className="text-xs text-right">Cost</TableHead>
                                <TableHead className="text-xs">Recommendation</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(Array.isArray(displayWorkforce.underperforming_programs) ? displayWorkforce.underperforming_programs : []).map((p, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-sm font-medium">{p?.program_name ?? ''}</TableCell>
                                  <TableCell className="text-center"><span className="font-mono text-sm">{p?.completion_rate ?? 0}%</span></TableCell>
                                  <TableCell className="text-center"><span className="font-mono text-sm">+{p?.skill_lift ?? 0}%</span></TableCell>
                                  <TableCell className="text-right font-mono text-sm">{formatCurrency(p?.cost ?? 0)}</TableCell>
                                  <TableCell className="text-xs text-muted-foreground max-w-[200px]">{p?.recommendation ?? ''}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="shadow-md"><CardContent className="p-12 text-center"><p className="text-muted-foreground text-sm font-sans">Load workforce data from the Overview section first, or enable Sample Data.</p></CardContent></Card>
                    )}
                  </div>
                )}

                {/* SECTION: Predictive Forecast */}
                {activeManagerSection === 'pred-forecast' && (
                  <div className="space-y-6">
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiTrendingUp className="text-primary" /> Capability Gap Forecast</CardTitle>
                        <CardDescription className="font-sans leading-relaxed">Describe a business scenario to forecast future skill shortages, compare hiring vs upskilling strategies, and generate strategic workforce recommendations.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="font-sans text-sm">Scenario Description</Label>
                          <Textarea
                            value={scenario}
                            onChange={(e) => setScenario(e.target.value)}
                            placeholder="Example: Rapid AI/ML adoption across all product lines requiring 40% workforce upskilling in generative AI, MLOps, and responsible AI practices over the next 18 months..."
                            rows={4}
                            className="resize-none"
                          />
                        </div>
                        <Button onClick={handleRunForecast} disabled={isLoadingForecast || !scenario.trim()}>
                          {isLoadingForecast ? <><FiRefreshCw className="mr-2 animate-spin" /> Running Forecast...</> : <><FiPlay className="mr-2" /> Run Capability Forecast</>}
                        </Button>
                      </CardContent>
                    </Card>

                    {isLoadingForecast && <SkeletonDashboard message="Running capability forecast and hiring vs upskilling simulations..." />}

                    {!isLoadingForecast && displayPredictive && (
                      <div className="space-y-6">
                        {/* Scenario Summary */}
                        <Card className="shadow-md bg-primary/5 border-primary/15">
                          <CardContent className="p-5">
                            <div className="flex items-start gap-3">
                              <FiTarget className="text-primary text-lg mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-serif font-semibold text-sm mb-1">Forecast Scenario</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">{displayPredictive.scenario ?? ''}</p>
                                <Badge variant="outline" className="mt-2 text-xs">{displayPredictive.forecast_horizon_months ?? 0} Month Horizon</Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Shortage Forecasts */}
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiTrendingUp className="text-primary" /> Skill Shortage Forecasts</CardTitle>
                            <CardDescription className="font-sans">Projected skill gaps over 6, 12, and 18 months</CardDescription>
                          </CardHeader>
                          <CardContent className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Skill</TableHead>
                                  <TableHead className="text-xs text-center">Supply</TableHead>
                                  <TableHead className="text-xs text-center">Demand</TableHead>
                                  <TableHead className="text-xs text-center">6 Mo</TableHead>
                                  <TableHead className="text-xs text-center">12 Mo</TableHead>
                                  <TableHead className="text-xs text-center">18 Mo</TableHead>
                                  <TableHead className="text-xs text-center">Severity</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(Array.isArray(displayPredictive.skill_shortage_forecasts) ? displayPredictive.skill_shortage_forecasts : []).map((item, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="text-sm font-medium">{item?.skill_name ?? ''}</TableCell>
                                    <TableCell className="text-center font-mono text-sm">{item?.current_supply ?? 0}</TableCell>
                                    <TableCell className="text-center font-mono text-sm">{item?.projected_demand ?? 0}</TableCell>
                                    <TableCell className="text-center font-mono text-sm text-destructive">{item?.gap_at_6_months ?? 0}</TableCell>
                                    <TableCell className="text-center font-mono text-sm text-destructive">{item?.gap_at_12_months ?? 0}</TableCell>
                                    <TableCell className="text-center font-mono text-sm text-destructive">{item?.gap_at_18_months ?? 0}</TableCell>
                                    <TableCell className="text-center">{classificationBadge(item?.severity ?? '')}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* Hiring vs Upskilling */}
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiPercent className="text-primary" /> Hiring vs. Upskilling Analysis</CardTitle>
                            <CardDescription className="font-sans">Cost and time comparison for talent strategies</CardDescription>
                          </CardHeader>
                          <CardContent className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">Skill</TableHead>
                                  <TableHead className="text-xs text-right">Hire Cost</TableHead>
                                  <TableHead className="text-xs text-center">Hire Time</TableHead>
                                  <TableHead className="text-xs text-right">Upskill Cost</TableHead>
                                  <TableHead className="text-xs text-center">Upskill Time</TableHead>
                                  <TableHead className="text-xs">Recommendation</TableHead>
                                  <TableHead className="text-xs text-center">Confidence</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {(Array.isArray(displayPredictive.hiring_vs_upskilling) ? displayPredictive.hiring_vs_upskilling : []).map((item, i) => (
                                  <TableRow key={i}>
                                    <TableCell className="text-sm font-medium">{item?.skill_name ?? ''}</TableCell>
                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(item?.hire_cost ?? 0)}</TableCell>
                                    <TableCell className="text-center font-mono text-sm">{item?.hire_time_months ?? 0}mo</TableCell>
                                    <TableCell className="text-right font-mono text-sm text-green-700">{formatCurrency(item?.upskill_cost ?? 0)}</TableCell>
                                    <TableCell className="text-center font-mono text-sm">{item?.upskill_time_months ?? 0}mo</TableCell>
                                    <TableCell className="text-xs max-w-[160px]">{item?.recommendation ?? ''}</TableCell>
                                    <TableCell className="text-center"><span className="font-mono text-sm">{Math.round((item?.confidence ?? 0) * 100)}%</span></TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* Readiness Projection Chart */}
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiActivity className="text-primary" /> Readiness Projection</CardTitle>
                            <CardDescription className="font-sans">Workforce readiness trajectory with confidence bands</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={320}>
                              <AreaChart data={Array.isArray(displayPredictive.readiness_projections) ? displayPredictive.readiness_projections : []} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 80%)" />
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottomRight', offset: -5, fontSize: 11 }} />
                                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: 'Readiness %', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="confidence_upper" stroke="none" fill={CHART_COLORS.c2} fillOpacity={0.15} name="Upper Bound" />
                                <Area type="monotone" dataKey="confidence_lower" stroke="none" fill="transparent" fillOpacity={0} name="Lower Bound" />
                                <Line type="monotone" dataKey="readiness_percentage" stroke={CHART_COLORS.c1} strokeWidth={3} dot={{ fill: CHART_COLORS.c1, r: 4 }} name="Readiness %" />
                                <Line type="monotone" dataKey="confidence_lower" stroke={CHART_COLORS.c4} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Lower Confidence" />
                                <Line type="monotone" dataKey="confidence_upper" stroke={CHART_COLORS.c4} strokeWidth={1} strokeDasharray="4 4" dot={false} name="Upper Confidence" />
                                <Legend />
                              </AreaChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Strategic Recommendations */}
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiStar className="text-primary" /> Strategic Recommendations</CardTitle>
                            <CardDescription className="font-sans">AI-generated strategic action items</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {(Array.isArray(displayPredictive.strategic_recommendations) ? displayPredictive.strategic_recommendations : []).map((rec, i) => (
                              <div key={i} className="p-4 rounded-lg border border-border bg-card">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-serif font-semibold text-sm">{rec?.title ?? ''}</h4>
                                  <div className="flex gap-1.5 flex-shrink-0">
                                    {classificationBadge(rec?.priority ?? '')}
                                    <Badge variant="outline" className="text-xs">{rec?.impact ?? ''} Impact</Badge>
                                  </div>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">{rec?.description ?? ''}</p>
                                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                  <FiClock className="text-xs" />
                                  <span>{rec?.timeline ?? ''}</span>
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {!isLoadingForecast && !displayPredictive && (
                      <Card className="shadow-md">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FiTrendingUp className="text-primary text-2xl" />
                          </div>
                          <h3 className="font-serif text-xl font-semibold mb-2">Predictive Capability Forecast</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-sans">
                            Enter a business scenario above to forecast future skill shortages and generate a hiring vs upskilling analysis. Or toggle &quot;Sample Data&quot; to preview.
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </PageErrorBoundary>
  )
}
