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
  FiUsers, FiPercent, FiStar, FiPlay,
  FiChevronRight, FiChevronDown, FiCompass, FiArrowRight,
  FiUploadCloud, FiFile, FiVideo, FiLink, FiTrash2, FiPlus, FiTag, FiFolder, FiX, FiGlobe
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

// ─── SELF-EVALUATION SKILL AREAS ───
const SKILL_AREAS = [
  { id: 'technical', label: 'Technical / Domain Expertise', description: 'Core technical skills, tools, and domain knowledge for your role' },
  { id: 'leadership', label: 'Leadership & People Management', description: 'Leading teams, mentoring, delegation, and conflict resolution' },
  { id: 'communication', label: 'Communication & Stakeholder Management', description: 'Presenting, writing, cross-functional collaboration' },
  { id: 'strategy', label: 'Strategic Thinking & Planning', description: 'Long-term planning, roadmapping, prioritization, business acumen' },
  { id: 'problem_solving', label: 'Problem Solving & Decision Making', description: 'Analytical thinking, data-driven decisions, handling ambiguity' },
  { id: 'execution', label: 'Project Execution & Delivery', description: 'Shipping on time, managing scope, quality standards' },
]

const EXPERIENCE_QUESTIONS = [
  { id: 'years_in_role', label: 'How many years have you been in your current role?', options: ['Less than 1 year', '1-2 years', '2-4 years', '4-6 years', '6+ years'] },
  { id: 'team_size', label: 'How many people have you directly managed or mentored?', options: ['None', '1-3', '4-8', '9-15', '15+'] },
  { id: 'projects_led', label: 'How many cross-functional projects have you led end-to-end?', options: ['None', '1-2', '3-5', '6-10', '10+'] },
]

const PROFICIENCY_LABELS: Record<number, string> = {
  1: 'Beginner',
  2: 'Developing',
  3: 'Competent',
  4: 'Proficient',
  5: 'Expert',
}

// ─── SECTION DEFINITIONS ───
type EmployeeSection = 'assessment' | 'radar' | 'gaps' | 'learning-path' | 'mobility'
type ManagerSection = 'wf-overview' | 'wf-heatmap' | 'wf-shortage' | 'wf-funnel' | 'wf-effectiveness' | 'wf-underperforming' | 'pred-forecast' | 'content-library'

const EMPLOYEE_SECTIONS: { id: EmployeeSection; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'assessment', label: 'Skill Assessment', icon: FiPlay },
  { id: 'radar', label: 'Skill Radar & Readiness', icon: FiTarget },
  { id: 'gaps', label: 'Gap Analysis', icon: FiGrid },
  { id: 'learning-path', label: 'Learning Path', icon: FiBookOpen },
  { id: 'mobility', label: 'Career Mobility', icon: FiMapPin },
]

const MANAGER_SECTIONS: { id: ManagerSection; label: string; icon: React.ComponentType<any>; group: string }[] = [
  { id: 'wf-overview', label: 'Workforce Overview', icon: FiUsers, group: 'Workforce Intelligence' },
  { id: 'wf-heatmap', label: 'Skill Heatmap', icon: FiLayers, group: 'Workforce Intelligence' },
  { id: 'wf-shortage', label: 'Shortage Index', icon: FiAlertTriangle, group: 'Workforce Intelligence' },
  { id: 'wf-funnel', label: 'Readiness Funnel', icon: FiBarChart2, group: 'Workforce Intelligence' },
  { id: 'wf-effectiveness', label: 'Effectiveness Analytics', icon: FiActivity, group: 'Workforce Intelligence' },
  { id: 'wf-underperforming', label: 'Underperforming Programs', icon: FiAlertTriangle, group: 'Workforce Intelligence' },
  { id: 'pred-forecast', label: 'Predictive Forecast', icon: FiTrendingUp, group: 'Predictive Analytics' },
  { id: 'content-library', label: 'Content Library', icon: FiFolder, group: 'Content Management' },
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

// ─── CONTENT LIBRARY TYPES ───
type ContentType = 'video_url' | 'document' | 'pdf' | 'website_url'

interface ContentItem {
  id: string
  title: string
  description: string
  type: ContentType
  url: string
  departments: string[]
  roles: string[]
  addedAt: string
}

const CONTENT_TYPE_OPTIONS: { value: ContentType; label: string; icon: React.ComponentType<any>; description: string }[] = [
  { value: 'video_url', label: 'Video URL', icon: FiVideo, description: 'YouTube, Vimeo, or other video links' },
  { value: 'document', label: 'Document', icon: FiFile, description: 'Word docs, spreadsheets, presentations' },
  { value: 'pdf', label: 'PDF', icon: FiFile, description: 'PDF documents and guides' },
  { value: 'website_url', label: 'Website URL', icon: FiGlobe, description: 'Web pages, articles, or online courses' },
]

const DEPARTMENT_OPTIONS = ['Engineering', 'Product', 'Data Science', 'DevOps', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations']

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

  // Multi-step assessment state
  const [assessmentStep, setAssessmentStep] = useState<1 | 2 | 3>(1)
  const [skillRatings, setSkillRatings] = useState<Record<string, number>>({})
  const [experienceAnswers, setExperienceAnswers] = useState<Record<string, string>>({})
  const [strengthsNote, setStrengthsNote] = useState('')
  const [growthNote, setGrowthNote] = useState('')

  // Content Library state
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [showAddContent, setShowAddContent] = useState(false)
  const [newContentTitle, setNewContentTitle] = useState('')
  const [newContentDescription, setNewContentDescription] = useState('')
  const [newContentType, setNewContentType] = useState<ContentType>('video_url')
  const [newContentUrl, setNewContentUrl] = useState('')
  const [newContentDepartments, setNewContentDepartments] = useState<string[]>([])
  const [newContentRoles, setNewContentRoles] = useState<string[]>([])
  const [contentFilterDept, setContentFilterDept] = useState<string>('all')
  const [contentFilterType, setContentFilterType] = useState<string>('all')

  const mainRef = useRef<HTMLDivElement>(null)

  // Scroll to top on section change
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [activeEmployeeSection, activeManagerSection])

  // ─── HELPERS FOR ASSESSMENT STEPS ───
  const isStep1Complete = currentRole !== '' && targetRole !== ''
  const isStep2Complete = SKILL_AREAS.every(s => skillRatings[s.id] !== undefined) && EXPERIENCE_QUESTIONS.every(q => experienceAnswers[q.id] !== undefined)

  const handleNextStep = useCallback(() => {
    if (assessmentStep === 1 && isStep1Complete) setAssessmentStep(2)
    else if (assessmentStep === 2 && isStep2Complete) setAssessmentStep(3)
  }, [assessmentStep, isStep1Complete, isStep2Complete])

  const handlePrevStep = useCallback(() => {
    if (assessmentStep === 2) setAssessmentStep(1)
    else if (assessmentStep === 3) setAssessmentStep(2)
  }, [assessmentStep])

  // ─── HANDLERS ───
  const handleStartAssessment = useCallback(async () => {
    if (!currentRole || !targetRole) return
    setIsAssessing(true)
    setAssessmentComplete(false)
    setOrchestratorData(null)
    setErrorMsg(null)
    setActiveAgentId(ORCHESTRATOR_AGENT_ID)
    try {
      // Build self-evaluation context
      const skillSummary = SKILL_AREAS.map(s => `${s.label}: ${skillRatings[s.id] ?? 0}/5 (${PROFICIENCY_LABELS[skillRatings[s.id] ?? 0] ?? 'Not rated'})`).join('; ')
      const expSummary = EXPERIENCE_QUESTIONS.map(q => `${q.label} ${experienceAnswers[q.id] ?? 'Not answered'}`).join('; ')
      const strengthsContext = strengthsNote.trim() ? `Key strengths: ${strengthsNote.trim()}.` : ''
      const growthContext = growthNote.trim() ? `Areas wanting to grow: ${growthNote.trim()}.` : ''

      const message = `Perform a comprehensive skill gap assessment for an employee transitioning from ${currentRole} to ${targetRole}.

Employee Self-Evaluation:
- Skill Ratings: ${skillSummary}
- Experience: ${expSummary}
${strengthsContext}
${growthContext}

Based on this self-evaluation, generate accurate skill radar data (current_score and required_score for each relevant skill), gap heatmap with severity classifications, a personalized learning path, internal mobility matches, and ROI metrics. The current scores should reflect the employee's self-evaluation ratings appropriately.`

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
  }, [currentRole, targetRole, skillRatings, experienceAnswers, strengthsNote, growthNote])

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

  // ─── CONTENT LIBRARY HANDLERS ───
  const handleAddContent = useCallback(() => {
    if (!newContentTitle.trim() || !newContentUrl.trim()) return
    const item: ContentItem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title: newContentTitle.trim(),
      description: newContentDescription.trim(),
      type: newContentType,
      url: newContentUrl.trim(),
      departments: newContentDepartments,
      roles: newContentRoles,
      addedAt: new Date().toISOString(),
    }
    setContentItems(prev => [item, ...prev])
    setNewContentTitle('')
    setNewContentDescription('')
    setNewContentType('video_url')
    setNewContentUrl('')
    setNewContentDepartments([])
    setNewContentRoles([])
    setShowAddContent(false)
  }, [newContentTitle, newContentDescription, newContentType, newContentUrl, newContentDepartments, newContentRoles])

  const handleRemoveContent = useCallback((id: string) => {
    setContentItems(prev => prev.filter(c => c.id !== id))
  }, [])

  const toggleDepartment = useCallback((dept: string) => {
    setNewContentDepartments(prev => prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept])
  }, [])

  const toggleRole = useCallback((role: string) => {
    setNewContentRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
  }, [])

  const filteredContent = contentItems.filter(item => {
    if (contentFilterDept !== 'all' && !item.departments.includes(contentFilterDept)) return false
    if (contentFilterType !== 'all' && item.type !== contentFilterType) return false
    return true
  })

  const contentTypeIcon = (type: ContentType) => {
    const opt = CONTENT_TYPE_OPTIONS.find(o => o.value === type)
    return opt ? opt.icon : FiFile
  }

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
                    {/* Step Progress Indicator */}
                    {!hasEmployeeData && !isAssessing && (
                      <div className="flex items-center gap-2">
                        {[
                          { step: 1 as const, label: 'Role Selection' },
                          { step: 2 as const, label: 'Self-Evaluation' },
                          { step: 3 as const, label: 'Review & Analyze' },
                        ].map((s, idx) => (
                          <React.Fragment key={s.step}>
                            <button
                              onClick={() => {
                                if (s.step === 1) setAssessmentStep(1)
                                else if (s.step === 2 && isStep1Complete) setAssessmentStep(2)
                                else if (s.step === 3 && isStep1Complete && isStep2Complete) setAssessmentStep(3)
                              }}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-sans transition-all ${
                                assessmentStep === s.step
                                  ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                                  : assessmentStep > s.step
                                    ? 'bg-primary/10 text-primary font-medium cursor-pointer'
                                    : 'bg-secondary/50 text-muted-foreground cursor-default'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 ${
                                assessmentStep === s.step
                                  ? 'bg-primary-foreground text-primary'
                                  : assessmentStep > s.step
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                {assessmentStep > s.step ? <FiCheckCircle className="text-xs" /> : s.step}
                              </span>
                              <span className="hidden sm:inline">{s.label}</span>
                            </button>
                            {idx < 2 && <FiChevronRight className="text-muted-foreground/40 flex-shrink-0" />}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {/* STEP 1: Role Selection */}
                    {!hasEmployeeData && !isAssessing && assessmentStep === 1 && (
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiUser className="text-primary" /> Step 1: Select Your Roles</CardTitle>
                          <CardDescription className="font-sans leading-relaxed">Choose your current position and the role you want to transition into. This tells our AI which skills to assess and what gaps to identify.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label className="font-sans text-sm font-medium">Current Role</Label>
                              <Select value={currentRole} onValueChange={setCurrentRole}>
                                <SelectTrigger className="h-11"><SelectValue placeholder="Select your current role" /></SelectTrigger>
                                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">The role you currently hold</p>
                            </div>
                            <div className="space-y-2">
                              <Label className="font-sans text-sm font-medium">Target Role</Label>
                              <Select value={targetRole} onValueChange={setTargetRole}>
                                <SelectTrigger className="h-11"><SelectValue placeholder="Select your target role" /></SelectTrigger>
                                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                              <p className="text-xs text-muted-foreground">The role you aspire to move into</p>
                            </div>
                          </div>
                          <Separator />
                          <div className="flex justify-end">
                            <Button onClick={handleNextStep} disabled={!isStep1Complete} className="h-10 px-6">
                              Continue to Self-Evaluation <FiChevronRight className="ml-2" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* STEP 2: Self-Evaluation */}
                    {!hasEmployeeData && !isAssessing && assessmentStep === 2 && (
                      <div className="space-y-6">
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiBarChart2 className="text-primary" /> Step 2: Rate Your Skills</CardTitle>
                            <CardDescription className="font-sans leading-relaxed">Rate yourself honestly on each skill area from 1 (Beginner) to 5 (Expert). This self-assessment helps the AI calibrate your current skill levels accurately.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            {SKILL_AREAS.map(skill => (
                              <div key={skill.id} className="p-4 rounded-lg bg-secondary/30 border border-secondary">
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <p className="text-sm font-medium">{skill.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                                  </div>
                                  {skillRatings[skill.id] !== undefined && (
                                    <Badge variant="outline" className="text-xs font-mono flex-shrink-0 ml-3">
                                      {skillRatings[skill.id]}/5 - {PROFICIENCY_LABELS[skillRatings[skill.id]]}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                  {[1, 2, 3, 4, 5].map(level => (
                                    <button
                                      key={level}
                                      onClick={() => setSkillRatings(prev => ({ ...prev, [skill.id]: level }))}
                                      className={`flex-1 py-2 px-1 rounded-md text-xs font-sans font-medium transition-all border ${
                                        skillRatings[skill.id] === level
                                          ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                          : skillRatings[skill.id] !== undefined && skillRatings[skill.id] >= level
                                            ? 'bg-primary/15 text-primary border-primary/25'
                                            : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                                      }`}
                                    >
                                      <span className="block font-mono text-sm">{level}</span>
                                      <span className="block text-[10px] mt-0.5 leading-tight">{PROFICIENCY_LABELS[level]}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </CardContent>
                        </Card>

                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiBriefcase className="text-primary" /> Experience Context</CardTitle>
                            <CardDescription className="font-sans">Help us understand your background for a more accurate assessment</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            {EXPERIENCE_QUESTIONS.map(q => (
                              <div key={q.id} className="space-y-2">
                                <Label className="font-sans text-sm">{q.label}</Label>
                                <div className="flex flex-wrap gap-2">
                                  {q.options.map(opt => (
                                    <button
                                      key={opt}
                                      onClick={() => setExperienceAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                      className={`px-3 py-1.5 rounded-md text-xs font-sans transition-all border ${
                                        experienceAnswers[q.id] === opt
                                          ? 'bg-primary text-primary-foreground border-primary shadow-sm font-medium'
                                          : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}

                            <Separator className="my-2" />

                            <div className="space-y-2">
                              <Label className="font-sans text-sm">What do you consider your strongest skills? <span className="text-muted-foreground">(optional)</span></Label>
                              <Textarea
                                value={strengthsNote}
                                onChange={(e) => setStrengthsNote(e.target.value)}
                                placeholder="e.g., I'm strong at data analysis, stakeholder presentations, and sprint planning..."
                                rows={2}
                                className="resize-none text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-sans text-sm">What areas do you most want to grow in? <span className="text-muted-foreground">(optional)</span></Label>
                              <Textarea
                                value={growthNote}
                                onChange={(e) => setGrowthNote(e.target.value)}
                                placeholder="e.g., I want to improve my strategic thinking, executive communication, and team leadership..."
                                rows={2}
                                className="resize-none text-sm"
                              />
                            </div>
                          </CardContent>
                        </Card>

                        <div className="flex justify-between">
                          <Button variant="outline" onClick={handlePrevStep} className="h-10 px-6">
                            <FiChevronDown className="mr-2 rotate-90" /> Back
                          </Button>
                          <Button onClick={handleNextStep} disabled={!isStep2Complete} className="h-10 px-6">
                            Review & Analyze <FiChevronRight className="ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: Review & Run */}
                    {!hasEmployeeData && !isAssessing && assessmentStep === 3 && (
                      <div className="space-y-6">
                        <Card className="shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiCompass className="text-primary" /> Step 3: Review & Launch Analysis</CardTitle>
                            <CardDescription className="font-sans leading-relaxed">Review your inputs below. When ready, click &quot;Run Skill Gap Analysis&quot; to generate your personalized assessment.</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-5">
                            {/* Role Summary */}
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/15">
                              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Career Transition</p>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 p-3 rounded-md bg-card border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Current Role</p>
                                  <p className="text-sm font-medium mt-0.5">{currentRole}</p>
                                </div>
                                <FiArrowRight className="text-primary flex-shrink-0" />
                                <div className="flex-1 p-3 rounded-md bg-card border border-border">
                                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Target Role</p>
                                  <p className="text-sm font-medium mt-0.5">{targetRole}</p>
                                </div>
                              </div>
                            </div>

                            {/* Skill Ratings Summary */}
                            <div>
                              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Self-Evaluation Ratings</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {SKILL_AREAS.map(skill => {
                                  const rating = skillRatings[skill.id] ?? 0
                                  return (
                                    <div key={skill.id} className="flex items-center gap-3 p-2.5 rounded-md bg-secondary/30">
                                      <span className="text-sm flex-1 font-sans">{skill.label}</span>
                                      <div className="flex items-center gap-1.5">
                                        {[1, 2, 3, 4, 5].map(n => (
                                          <span key={n} className={`w-2 h-2 rounded-full ${n <= rating ? 'bg-primary' : 'bg-muted'}`} />
                                        ))}
                                        <span className="text-xs font-mono ml-1 text-muted-foreground">{rating}/5</span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>

                            {/* Experience Summary */}
                            <div>
                              <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Experience</p>
                              <div className="space-y-1.5">
                                {EXPERIENCE_QUESTIONS.map(q => (
                                  <div key={q.id} className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-secondary/30">
                                    <span className="text-xs text-muted-foreground font-sans">{q.label}</span>
                                    <Badge variant="outline" className="text-xs">{experienceAnswers[q.id] ?? '-'}</Badge>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            {(strengthsNote.trim() || growthNote.trim()) && (
                              <div>
                                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Additional Notes</p>
                                {strengthsNote.trim() && (
                                  <div className="p-3 rounded-md bg-secondary/30 mb-2">
                                    <p className="text-xs text-muted-foreground font-semibold mb-1">Strengths</p>
                                    <p className="text-sm font-sans">{strengthsNote}</p>
                                  </div>
                                )}
                                {growthNote.trim() && (
                                  <div className="p-3 rounded-md bg-secondary/30">
                                    <p className="text-xs text-muted-foreground font-semibold mb-1">Growth Areas</p>
                                    <p className="text-sm font-sans">{growthNote}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <Separator />

                            <div className="flex justify-between">
                              <Button variant="outline" onClick={handlePrevStep} className="h-10 px-6">
                                <FiChevronDown className="mr-2 rotate-90" /> Back
                              </Button>
                              <Button onClick={handleStartAssessment} disabled={isAssessing} className="h-11 px-8 text-base">
                                <FiPlay className="mr-2" /> Run Skill Gap Analysis
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        <p className="text-xs text-center text-muted-foreground font-sans">
                          Or toggle &quot;Sample Data&quot; in the top bar to explore with example data.
                        </p>
                      </div>
                    )}

                    {isAssessing && <SkeletonDashboard message="Analyzing your self-evaluation, identifying skill gaps, generating learning paths, and scanning mobility opportunities..." />}

                    {!isAssessing && hasEmployeeData && displayOrchestrator && (
                      <Card className="shadow-md bg-primary/5 border-primary/15">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4">
                            <FiCheckCircle className="text-green-600 text-xl flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-serif font-semibold text-sm">Assessment Complete</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {displayOrchestrator.employee_name ?? 'Employee'}: {currentRole || displayOrchestrator.current_role || 'Current Role'} → {targetRole || displayOrchestrator.target_role || 'Target Role'} | Readiness: <span className="font-mono font-bold text-primary">{displayOrchestrator.overall_readiness_score ?? 0}%</span>
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
                {activeEmployeeSection === 'radar' && hasEmployeeData && displayOrchestrator && (() => {
                  const radarSkills = Array.isArray(displayOrchestrator.skill_radar_data) ? displayOrchestrator.skill_radar_data : []
                  const readiness = displayOrchestrator.overall_readiness_score ?? 0
                  const gaps = Array.isArray(displayOrchestrator.gap_heatmap) ? displayOrchestrator.gap_heatmap : []
                  const gapSummary = displayOrchestrator.gap_summary ?? { critical_count: 0, important_count: 0, enhancement_count: 0 }
                  const totalGapsCount = gapSummary.critical_count + gapSummary.important_count + gapSummary.enhancement_count

                  // Derived insights
                  const avgCurrent = radarSkills.length > 0 ? Math.round(radarSkills.reduce((s, r) => s + (r?.current_score ?? 0), 0) / radarSkills.length) : 0
                  const avgRequired = radarSkills.length > 0 ? Math.round(radarSkills.reduce((s, r) => s + (r?.required_score ?? 0), 0) / radarSkills.length) : 0
                  const strongestSkills = [...radarSkills].sort((a, b) => (b?.current_score ?? 0) - (a?.current_score ?? 0)).slice(0, 3)
                  const weakestSkills = [...radarSkills].sort((a, b) => {
                    const gapA = (a?.required_score ?? 0) - (a?.current_score ?? 0)
                    const gapB = (b?.required_score ?? 0) - (b?.current_score ?? 0)
                    return gapB - gapA
                  }).slice(0, 3)
                  const sortedByGap = [...radarSkills].sort((a, b) => {
                    const gapA = (a?.required_score ?? 0) - (a?.current_score ?? 0)
                    const gapB = (b?.required_score ?? 0) - (b?.current_score ?? 0)
                    return gapB - gapA
                  })
                  const readinessLevel = readiness >= 80 ? 'Strong' : readiness >= 60 ? 'Moderate' : readiness >= 40 ? 'Developing' : 'Early Stage'
                  const readinessColor = readiness >= 80 ? 'text-green-700' : readiness >= 60 ? 'text-accent-foreground' : readiness >= 40 ? 'text-orange-600' : 'text-destructive'

                  return (
                    <div className="space-y-6">
                      {/* Hero Assessment Banner */}
                      <Card className="shadow-lg border-primary/15 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary/[0.06] via-primary/[0.03] to-transparent">
                          <CardContent className="p-6">
                            <div className="flex items-start gap-6">
                              {/* Readiness Gauge */}
                              <div className="flex-shrink-0">
                                <ReadinessGauge score={readiness} />
                              </div>

                              {/* Profile & Transition Info */}
                              <div className="flex-1 min-w-0 py-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <FiUser className="text-primary text-sm" />
                                  <h3 className="font-serif text-lg font-bold tracking-wide">{displayOrchestrator.employee_name ?? 'Employee'}</h3>
                                  <Badge variant="outline" className={`text-xs font-mono ${readinessColor}`}>{readinessLevel}</Badge>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                  <span className="text-sm font-sans text-muted-foreground">{currentRole || displayOrchestrator.current_role || 'Current Role'}</span>
                                  <FiArrowRight className="text-primary text-xs flex-shrink-0" />
                                  <span className="text-sm font-sans font-medium">{targetRole || displayOrchestrator.target_role || 'Target Role'}</span>
                                </div>

                                {/* Quick Stats Row */}
                                <div className="grid grid-cols-4 gap-3">
                                  <div className="p-2.5 rounded-lg bg-card border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-sans">Avg Current</p>
                                    <p className="font-mono text-lg font-bold mt-0.5">{avgCurrent}<span className="text-xs text-muted-foreground">/100</span></p>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-card border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-sans">Avg Required</p>
                                    <p className="font-mono text-lg font-bold mt-0.5">{avgRequired}<span className="text-xs text-muted-foreground">/100</span></p>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-card border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-sans">Avg Gap</p>
                                    <p className={`font-mono text-lg font-bold mt-0.5 ${avgRequired - avgCurrent > 20 ? 'text-destructive' : 'text-accent-foreground'}`}>-{avgRequired - avgCurrent}<span className="text-xs text-muted-foreground"> pts</span></p>
                                  </div>
                                  <div className="p-2.5 rounded-lg bg-card border border-border">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-sans">Skills Assessed</p>
                                    <p className="font-mono text-lg font-bold mt-0.5">{radarSkills.length}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Gap Summary Mini */}
                              <div className="flex-shrink-0 hidden lg:flex flex-col gap-2 py-2">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-1">Gap Breakdown</p>
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-destructive flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground font-sans w-16">Critical</span>
                                  <span className="font-mono text-sm font-bold">{gapSummary.critical_count}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-accent flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground font-sans w-16">Important</span>
                                  <span className="font-mono text-sm font-bold">{gapSummary.important_count}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground font-sans w-16">Enhance</span>
                                  <span className="font-mono text-sm font-bold">{gapSummary.enhancement_count}</span>
                                </div>
                                <Separator className="my-1" />
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground font-sans w-16 font-medium">Total</span>
                                  <span className="font-mono text-sm font-bold">{totalGapsCount}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </div>
                      </Card>

                      {/* Radar Chart + Strengths/Weaknesses */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Radar Chart - Takes 2/3 */}
                        <Card className="lg:col-span-2 shadow-md hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-2">
                            <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiTarget className="text-primary" /> Competency Radar</CardTitle>
                            <CardDescription className="font-sans">Visual comparison of your current skills against target role requirements</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={380}>
                              <RadarChart data={radarSkills}>
                                <PolarGrid stroke="hsl(35, 15%, 75%)" />
                                <PolarAngleAxis dataKey="skill_name" tick={{ fill: 'hsl(30, 22%, 14%)', fontSize: 11 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                                <Radar name="Current Level" dataKey="current_score" stroke={CHART_COLORS.c1} fill={CHART_COLORS.c1} fillOpacity={0.3} strokeWidth={2} />
                                <Radar name="Required Level" dataKey="required_score" stroke={CHART_COLORS.c2} fill={CHART_COLORS.c2} fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(35, 15%, 80%)' }} />
                              </RadarChart>
                            </ResponsiveContainer>
                            <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground font-sans">
                              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ backgroundColor: CHART_COLORS.c1 }} /> Solid line = Your current skills</span>
                              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded border-t-2 border-dashed" style={{ borderColor: CHART_COLORS.c2 }} /> Dashed line = Target requirements</span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Strengths & Growth Areas - Takes 1/3 */}
                        <div className="space-y-6">
                          {/* Top Strengths */}
                          <Card className="shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                              <CardTitle className="font-serif text-base tracking-wide flex items-center gap-2">
                                <FiAward className="text-green-600" /> Top Strengths
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5">
                              {strongestSkills.map((skill, i) => {
                                const gap = (skill?.required_score ?? 0) - (skill?.current_score ?? 0)
                                const isReady = gap <= 10
                                return (
                                  <div key={i} className="p-2.5 rounded-lg bg-green-600/5 border border-green-600/15">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm font-medium font-sans">{skill?.skill_name ?? ''}</span>
                                      <span className="font-mono text-sm font-bold text-green-700">{skill?.current_score ?? 0}</span>
                                    </div>
                                    <div className="relative h-2 bg-secondary/60 rounded-full overflow-hidden">
                                      <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-green-600/70 transition-all duration-700"
                                        style={{ width: `${skill?.current_score ?? 0}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-[10px] text-muted-foreground">Required: {skill?.required_score ?? 0}</span>
                                      {isReady ? (
                                        <span className="text-[10px] text-green-600 font-medium flex items-center gap-0.5"><FiCheckCircle className="text-[9px]" /> Ready</span>
                                      ) : (
                                        <span className="text-[10px] text-muted-foreground">Gap: -{gap}</span>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </CardContent>
                          </Card>

                          {/* Biggest Gaps */}
                          <Card className="shadow-md hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-2">
                              <CardTitle className="font-serif text-base tracking-wide flex items-center gap-2">
                                <FiAlertTriangle className="text-destructive" /> Largest Gaps
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2.5">
                              {weakestSkills.map((skill, i) => {
                                const gap = (skill?.required_score ?? 0) - (skill?.current_score ?? 0)
                                const gapEntry = gaps.find(g => g?.skill_name === skill?.skill_name)
                                const severity = gapEntry?.classification ?? (gap > 30 ? 'Critical' : gap > 15 ? 'Important' : 'Enhancement')
                                return (
                                  <div key={i} className={`p-2.5 rounded-lg border ${
                                    severity.toLowerCase() === 'critical' ? 'bg-destructive/5 border-destructive/15'
                                    : severity.toLowerCase() === 'important' ? 'bg-accent/5 border-accent/15'
                                    : 'bg-secondary/30 border-secondary'
                                  }`}>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-sm font-medium font-sans">{skill?.skill_name ?? ''}</span>
                                        {classificationBadge(severity)}
                                      </div>
                                      <span className={`font-mono text-sm font-bold ${severity.toLowerCase() === 'critical' ? 'text-destructive' : 'text-accent-foreground'}`}>-{gap}</span>
                                    </div>
                                    <div className="relative h-2 bg-secondary/60 rounded-full overflow-hidden">
                                      <div
                                        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-700 ${
                                          severity.toLowerCase() === 'critical' ? 'bg-destructive/50' : 'bg-accent/50'
                                        }`}
                                        style={{ width: `${skill?.current_score ?? 0}%` }}
                                      />
                                      <div
                                        className="absolute inset-y-0 w-0.5 border-l border-dashed border-foreground/30"
                                        style={{ left: `${skill?.required_score ?? 0}%` }}
                                      />
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <span className="text-[10px] text-muted-foreground">Current: {skill?.current_score ?? 0}</span>
                                      <span className="text-[10px] text-muted-foreground">Required: {skill?.required_score ?? 0}</span>
                                    </div>
                                  </div>
                                )
                              })}
                            </CardContent>
                          </Card>
                        </div>
                      </div>

                      {/* Full Skill Breakdown Table */}
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiBarChart2 className="text-primary" /> Skill-by-Skill Breakdown</CardTitle>
                          <CardDescription className="font-sans">Detailed view of every assessed competency sorted by gap size</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2.5">
                            {sortedByGap.map((skill, i) => {
                              const current = skill?.current_score ?? 0
                              const required = skill?.required_score ?? 0
                              const gap = required - current
                              const gapEntry = gaps.find(g => g?.skill_name === skill?.skill_name)
                              const severity = gapEntry?.classification ?? (gap > 30 ? 'Critical' : gap > 15 ? 'Important' : 'Enhancement')
                              const isReady = gap <= 0
                              const pct = required > 0 ? Math.round((current / required) * 100) : 100

                              return (
                                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 border border-secondary/50 hover:bg-secondary/30 transition-colors">
                                  {/* Rank */}
                                  <span className="text-xs font-mono text-muted-foreground w-5 text-center flex-shrink-0">{i + 1}</span>

                                  {/* Skill name & badge */}
                                  <div className="w-40 flex-shrink-0">
                                    <p className="text-sm font-medium font-sans truncate">{skill?.skill_name ?? ''}</p>
                                    {gapEntry?.category && <p className="text-[10px] text-muted-foreground">{gapEntry.category}</p>}
                                  </div>

                                  {/* Visual Progress Bar */}
                                  <div className="flex-1 min-w-0">
                                    <div className="relative h-5 bg-secondary/50 rounded-md overflow-hidden">
                                      {/* Current level fill */}
                                      <div
                                        className={`absolute inset-y-0 left-0 rounded-md transition-all duration-700 flex items-center justify-end pr-1.5 ${
                                          isReady ? 'bg-green-600/60' : gap > 30 ? 'bg-destructive/40' : gap > 15 ? 'bg-accent/40' : 'bg-primary/30'
                                        }`}
                                        style={{ width: `${current}%` }}
                                      >
                                        {current >= 20 && (
                                          <span className="text-[10px] font-mono font-semibold text-foreground/80">{current}</span>
                                        )}
                                      </div>
                                      {/* Required marker */}
                                      {!isReady && (
                                        <div
                                          className="absolute inset-y-0 w-0.5 border-l-[1.5px] border-dashed border-foreground/40"
                                          style={{ left: `${required}%` }}
                                        />
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between mt-0.5">
                                      <span className="text-[9px] text-muted-foreground font-mono">{current}/100 current</span>
                                      <span className="text-[9px] text-muted-foreground font-mono">{required}/100 required</span>
                                    </div>
                                  </div>

                                  {/* Readiness % */}
                                  <div className="w-14 text-center flex-shrink-0">
                                    <span className={`font-mono text-sm font-bold ${pct >= 90 ? 'text-green-700' : pct >= 70 ? 'text-accent-foreground' : 'text-destructive'}`}>{Math.min(pct, 100)}%</span>
                                    <p className="text-[9px] text-muted-foreground">ready</p>
                                  </div>

                                  {/* Gap */}
                                  <div className="w-16 text-right flex-shrink-0">
                                    {isReady ? (
                                      <span className="text-xs text-green-600 font-medium flex items-center justify-end gap-1"><FiCheckCircle className="text-[10px]" /> Met</span>
                                    ) : (
                                      <>
                                        <span className={`font-mono text-sm font-bold ${severity.toLowerCase() === 'critical' ? 'text-destructive' : severity.toLowerCase() === 'important' ? 'text-accent-foreground' : 'text-muted-foreground'}`}>-{gap}</span>
                                        <div className="mt-0.5">{classificationBadge(severity)}</div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Bottom Insight */}
                      <Card className="shadow-md bg-primary/5 border-primary/15">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <FiCompass className="text-primary text-lg" />
                            </div>
                            <div>
                              <p className="font-serif font-semibold text-sm mb-1">Readiness Summary</p>
                              <p className="text-sm text-muted-foreground leading-relaxed font-sans">
                                {readiness >= 80
                                  ? `With ${readiness}% readiness, you are well-prepared for the ${targetRole || displayOrchestrator.target_role} role. Your strongest skill is ${strongestSkills[0]?.skill_name ?? 'N/A'} at ${strongestSkills[0]?.current_score ?? 0}/100. Focus on the ${gapSummary.critical_count} critical gap${gapSummary.critical_count !== 1 ? 's' : ''} to reach full readiness.`
                                  : readiness >= 60
                                    ? `At ${readiness}% readiness, you have a solid foundation for the ${targetRole || displayOrchestrator.target_role} transition. Your average skill level is ${avgCurrent}/100 against a required ${avgRequired}/100. Prioritize closing the ${gapSummary.critical_count} critical and ${gapSummary.important_count} important gaps identified.`
                                    : `Your current readiness of ${readiness}% indicates significant room for growth toward the ${targetRole || displayOrchestrator.target_role} role. The average gap of ${avgRequired - avgCurrent} points across ${radarSkills.length} skills suggests focusing on ${weakestSkills[0]?.skill_name ?? 'key areas'} first. Use the Learning Path section for a structured plan.`
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

                {/* SECTION: Gap Analysis */}
                {activeEmployeeSection === 'gaps' && hasEmployeeData && displayOrchestrator && (() => {
                  const gaps = Array.isArray(displayOrchestrator.gap_heatmap) ? displayOrchestrator.gap_heatmap : []
                  const radarData = Array.isArray(displayOrchestrator.skill_radar_data) ? displayOrchestrator.skill_radar_data : []
                  const severityOrder: Record<string, number> = { critical: 0, important: 1, enhancement: 2 }
                  const sortedGaps = [...gaps].sort((a, b) => (severityOrder[(a?.classification ?? '').toLowerCase()] ?? 3) - (severityOrder[(b?.classification ?? '').toLowerCase()] ?? 3))
                  const categories = Array.from(new Set(gaps.map(g => g?.category).filter(Boolean))) as string[]

                  return (
                    <div className="space-y-6">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-4">
                        <Card className="shadow-md border-destructive/20 bg-destructive/5">
                          <CardContent className="p-4 text-center">
                            <FiAlertTriangle className="mx-auto text-destructive text-xl mb-1.5" />
                            <p className="font-mono text-3xl font-bold text-destructive">{displayOrchestrator.gap_summary?.critical_count ?? 0}</p>
                            <p className="text-xs text-destructive/80 mt-1 font-sans font-medium">Critical Gaps</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Require immediate action</p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-md border-accent/20 bg-accent/5">
                          <CardContent className="p-4 text-center">
                            <FiActivity className="mx-auto text-accent text-xl mb-1.5" />
                            <p className="font-mono text-3xl font-bold">{displayOrchestrator.gap_summary?.important_count ?? 0}</p>
                            <p className="text-xs font-sans font-medium mt-1">Important Gaps</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Should be addressed soon</p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-md">
                          <CardContent className="p-4 text-center">
                            <FiStar className="mx-auto text-muted-foreground text-xl mb-1.5" />
                            <p className="font-mono text-3xl font-bold text-muted-foreground">{displayOrchestrator.gap_summary?.enhancement_count ?? 0}</p>
                            <p className="text-xs text-muted-foreground font-sans font-medium mt-1">Enhancements</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Nice-to-have improvements</p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Detailed Gap Breakdown */}
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiGrid className="text-primary" /> Skill Gap Breakdown</CardTitle>
                          <CardDescription className="font-sans leading-relaxed">
                            Each bar shows your current proficiency vs. what is required for the target role. The gap (difference) determines the severity classification.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {/* Legend */}
                          <div className="flex items-center gap-6 mb-5 pb-4 border-b border-border">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS.c1 }} />
                              <span className="text-xs text-muted-foreground font-sans">Your Current Score</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-sm border-2 border-dashed" style={{ borderColor: CHART_COLORS.c2 }} />
                              <span className="text-xs text-muted-foreground font-sans">Required Score</span>
                            </div>
                            <div className="flex items-center gap-2 ml-auto">
                              <FiArrowRight className="text-xs text-muted-foreground" />
                              <span className="text-xs text-muted-foreground font-sans">Gap = Required - Current</span>
                            </div>
                          </div>

                          <div className="space-y-6">
                            {categories.map(category => {
                              const categoryGaps = sortedGaps.filter(g => g?.category === category)
                              if (categoryGaps.length === 0) return null
                              return (
                                <div key={category}>
                                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 flex items-center gap-2">
                                    <FiLayers className="text-xs" /> {category}
                                  </p>
                                  <div className="space-y-3">
                                    {categoryGaps.map((gap, i) => {
                                      const cls = (gap?.classification ?? '').toLowerCase()
                                      const delta = gap?.delta ?? 0
                                      const radarEntry = radarData.find(r => r?.skill_name === gap?.skill_name)
                                      const currentScore = radarEntry?.current_score ?? 0
                                      const requiredScore = radarEntry?.required_score ?? (currentScore + delta)
                                      const borderClass = cls === 'critical' ? 'border-l-destructive' : cls === 'important' ? 'border-l-accent' : 'border-l-muted-foreground/40'

                                      return (
                                        <div key={i} className={`p-4 rounded-lg bg-card border border-border border-l-4 ${borderClass}`}>
                                          <div className="flex items-center justify-between mb-2.5">
                                            <div className="flex items-center gap-2">
                                              <p className="text-sm font-medium">{gap?.skill_name ?? ''}</p>
                                              {classificationBadge(gap?.classification ?? '')}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-xs text-muted-foreground font-sans">Gap:</span>
                                              <span className={`font-mono text-sm font-bold ${cls === 'critical' ? 'text-destructive' : cls === 'important' ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                                                {delta} pts
                                              </span>
                                            </div>
                                          </div>

                                          {/* Visual bar */}
                                          <div className="relative h-7 bg-secondary/50 rounded-md overflow-hidden">
                                            {/* Current score bar */}
                                            <div
                                              className="absolute inset-y-0 left-0 rounded-md flex items-center justify-end pr-2 transition-all duration-500"
                                              style={{ width: `${currentScore}%`, backgroundColor: CHART_COLORS.c1 }}
                                            >
                                              {currentScore >= 15 && (
                                                <span className="text-[11px] font-mono font-semibold text-white">{currentScore}</span>
                                              )}
                                            </div>
                                            {/* Required score marker */}
                                            <div
                                              className="absolute inset-y-0 w-0.5 border-l-2 border-dashed"
                                              style={{ left: `${requiredScore}%`, borderColor: CHART_COLORS.c2 }}
                                            />
                                            <div
                                              className="absolute -top-0.5 -translate-x-1/2 text-[10px] font-mono font-semibold px-1 rounded"
                                              style={{ left: `${requiredScore}%`, color: CHART_COLORS.c2 }}
                                            >
                                              {requiredScore}
                                            </div>
                                          </div>

                                          {/* Score labels */}
                                          <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-[11px] text-muted-foreground font-sans">Current: <span className="font-mono font-medium text-foreground">{currentScore}/100</span></span>
                                            <span className="text-[11px] text-muted-foreground font-sans">Required: <span className="font-mono font-medium text-foreground">{requiredScore}/100</span></span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Priority Action Summary */}
                      <Card className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiTarget className="text-primary" /> Priority Actions</CardTitle>
                          <CardDescription className="font-sans">Focus on critical gaps first for the fastest path to readiness</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {sortedGaps.map((gap, i) => {
                              const cls = (gap?.classification ?? '').toLowerCase()
                              const icon = cls === 'critical' ? FiAlertTriangle : cls === 'important' ? FiActivity : FiCheckCircle
                              const IconComp = icon
                              const colorClass = cls === 'critical' ? 'text-destructive' : cls === 'important' ? 'text-accent' : 'text-green-600'
                              return (
                                <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-secondary/50 transition-colors">
                                  <span className="text-xs font-mono text-muted-foreground w-5 text-center">{i + 1}</span>
                                  <IconComp className={`text-sm flex-shrink-0 ${colorClass}`} />
                                  <span className="text-sm font-medium flex-1">{gap?.skill_name ?? ''}</span>
                                  <Badge variant="outline" className="text-[10px]">{gap?.category ?? ''}</Badge>
                                  <span className={`font-mono text-xs font-semibold ${cls === 'critical' ? 'text-destructive' : cls === 'important' ? 'text-accent-foreground' : 'text-muted-foreground'}`}>
                                    -{gap?.delta ?? 0} pts
                                  </span>
                                  {classificationBadge(gap?.classification ?? '')}
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}

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

                {/* SECTION: Content Library */}
                {activeManagerSection === 'content-library' && (
                  <div className="space-y-6">
                    {/* Header with Add button */}
                    <Card className="shadow-md hover:shadow-lg transition-shadow">
                      <CardContent className="p-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-serif font-semibold text-base tracking-wide">Learning Content Library</h3>
                          <p className="text-xs text-muted-foreground font-sans mt-0.5">Upload and manage learning resources tagged by department and role</p>
                        </div>
                        <Button onClick={() => setShowAddContent(!showAddContent)}>
                          {showAddContent ? <><FiX className="mr-2" /> Cancel</> : <><FiPlus className="mr-2" /> Add Content</>}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Add Content Form */}
                    {showAddContent && (
                      <Card className="shadow-md border-primary/20 bg-primary/[0.02]">
                        <CardHeader className="pb-3">
                          <CardTitle className="font-serif text-lg tracking-wide flex items-center gap-2"><FiUploadCloud className="text-primary" /> Add Learning Content</CardTitle>
                          <CardDescription className="font-sans">Upload a new learning resource for employees</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                          {/* Content Type Selection */}
                          <div className="space-y-2">
                            <Label className="font-sans text-sm font-medium">Content Type</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {CONTENT_TYPE_OPTIONS.map(opt => {
                                const IconComp = opt.icon
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={() => setNewContentType(opt.value)}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                      newContentType === opt.value
                                        ? 'bg-primary/10 border-primary/30 ring-1 ring-primary/20'
                                        : 'bg-card border-border hover:bg-secondary/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <IconComp className={`text-sm ${newContentType === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                                      <span className={`text-xs font-medium ${newContentType === opt.value ? 'text-primary' : ''}`}>{opt.label}</span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-tight">{opt.description}</p>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Title & URL */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="font-sans text-sm font-medium">Title <span className="text-destructive">*</span></Label>
                              <input
                                type="text"
                                value={newContentTitle}
                                onChange={(e) => setNewContentTitle(e.target.value)}
                                placeholder="e.g., Advanced System Design Workshop"
                                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="font-sans text-sm font-medium">
                                {newContentType === 'video_url' ? 'Video URL' : newContentType === 'website_url' ? 'Website URL' : 'File URL / Link'} <span className="text-destructive">*</span>
                              </Label>
                              <div className="relative">
                                <input
                                  type="url"
                                  value={newContentUrl}
                                  onChange={(e) => setNewContentUrl(e.target.value)}
                                  placeholder={
                                    newContentType === 'video_url' ? 'https://youtube.com/watch?v=...'
                                    : newContentType === 'website_url' ? 'https://example.com/article'
                                    : 'https://drive.google.com/file/...'
                                  }
                                  className="w-full h-10 px-3 pr-9 rounded-md border border-input bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <FiLink className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          <div className="space-y-2">
                            <Label className="font-sans text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                            <Textarea
                              value={newContentDescription}
                              onChange={(e) => setNewContentDescription(e.target.value)}
                              placeholder="Brief description of this learning resource..."
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>

                          <Separator />

                          {/* Department Tags */}
                          <div className="space-y-2">
                            <Label className="font-sans text-sm font-medium flex items-center gap-1.5"><FiTag className="text-xs text-primary" /> Tag by Department</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {DEPARTMENT_OPTIONS.map(dept => (
                                <button
                                  key={dept}
                                  onClick={() => toggleDepartment(dept)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-sans transition-all border ${
                                    newContentDepartments.includes(dept)
                                      ? 'bg-primary text-primary-foreground border-primary font-medium'
                                      : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                                  }`}
                                >
                                  {dept}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Role Tags */}
                          <div className="space-y-2">
                            <Label className="font-sans text-sm font-medium flex items-center gap-1.5"><FiBriefcase className="text-xs text-primary" /> Tag by Role</Label>
                            <div className="flex flex-wrap gap-1.5">
                              {ROLES.map(role => (
                                <button
                                  key={role}
                                  onClick={() => toggleRole(role)}
                                  className={`px-2.5 py-1 rounded-md text-xs font-sans transition-all border ${
                                    newContentRoles.includes(role)
                                      ? 'bg-accent text-accent-foreground border-accent font-medium'
                                      : 'bg-card text-muted-foreground border-border hover:bg-secondary hover:text-foreground'
                                  }`}
                                >
                                  {role}
                                </button>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowAddContent(false)}>Cancel</Button>
                            <Button onClick={handleAddContent} disabled={!newContentTitle.trim() || !newContentUrl.trim()}>
                              <FiUploadCloud className="mr-2" /> Add to Library
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Filters */}
                    {contentItems.length > 0 && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground font-sans whitespace-nowrap">Department:</Label>
                          <Select value={contentFilterDept} onValueChange={setContentFilterDept}>
                            <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Departments</SelectItem>
                              {DEPARTMENT_OPTIONS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground font-sans whitespace-nowrap">Type:</Label>
                          <Select value={contentFilterType} onValueChange={setContentFilterType}>
                            <SelectTrigger className="h-8 w-[140px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Types</SelectItem>
                              {CONTENT_TYPE_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="ml-auto">
                          <Badge variant="secondary" className="text-xs font-mono">{filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''}</Badge>
                        </div>
                      </div>
                    )}

                    {/* Content Items List */}
                    {filteredContent.length > 0 ? (
                      <div className="space-y-3">
                        {filteredContent.map(item => {
                          const TypeIcon = contentTypeIcon(item.type)
                          const typeLabel = CONTENT_TYPE_OPTIONS.find(o => o.value === item.type)?.label ?? item.type
                          return (
                            <Card key={item.id} className="shadow-md hover:shadow-lg transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  {/* Type Icon */}
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                    item.type === 'video_url' ? 'bg-red-600/10' :
                                    item.type === 'website_url' ? 'bg-blue-600/10' :
                                    item.type === 'pdf' ? 'bg-orange-600/10' : 'bg-green-600/10'
                                  }`}>
                                    <TypeIcon className={`text-lg ${
                                      item.type === 'video_url' ? 'text-red-600' :
                                      item.type === 'website_url' ? 'text-blue-600' :
                                      item.type === 'pdf' ? 'text-orange-600' : 'text-green-600'
                                    }`} />
                                  </div>

                                  {/* Content Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-sm truncate">{item.title}</p>
                                      <Badge variant="outline" className="text-[10px] flex-shrink-0">{typeLabel}</Badge>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                      <FiLink className="text-xs flex-shrink-0" />
                                      <span className="truncate max-w-[400px] font-mono text-[11px]">{item.url}</span>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-1">
                                      {item.departments.map(d => (
                                        <Badge key={d} variant="secondary" className="text-[10px] font-sans">{d}</Badge>
                                      ))}
                                      {item.roles.map(r => (
                                        <Badge key={r} variant="outline" className="text-[10px] font-sans bg-accent/5">{r}</Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <span className="text-[10px] text-muted-foreground font-mono mr-2">
                                      {new Date(item.addedAt).toLocaleDateString()}
                                    </span>
                                    <button
                                      onClick={() => handleRemoveContent(item.id)}
                                      className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      title="Remove content"
                                    >
                                      <FiTrash2 className="text-sm" />
                                    </button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <Card className="shadow-md">
                        <CardContent className="p-12 text-center">
                          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <FiFolder className="text-primary text-2xl" />
                          </div>
                          <h3 className="font-serif text-xl font-semibold mb-2">Content Library</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-sans">
                            {contentItems.length === 0
                              ? 'No learning content added yet. Click "Add Content" to upload video URLs, documents, PDFs, or website links and tag them by department and role.'
                              : 'No content matches the current filters. Try adjusting the department or type filter above.'}
                          </p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Summary Stats */}
                    {contentItems.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Card className="shadow-md">
                          <CardContent className="p-4 text-center">
                            <FiFolder className="mx-auto text-primary text-lg mb-1" />
                            <p className="font-mono text-2xl font-bold">{contentItems.length}</p>
                            <p className="text-xs text-muted-foreground font-sans">Total Resources</p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-md">
                          <CardContent className="p-4 text-center">
                            <FiVideo className="mx-auto text-red-600 text-lg mb-1" />
                            <p className="font-mono text-2xl font-bold">{contentItems.filter(c => c.type === 'video_url').length}</p>
                            <p className="text-xs text-muted-foreground font-sans">Videos</p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-md">
                          <CardContent className="p-4 text-center">
                            <FiFile className="mx-auto text-green-600 text-lg mb-1" />
                            <p className="font-mono text-2xl font-bold">{contentItems.filter(c => c.type === 'document' || c.type === 'pdf').length}</p>
                            <p className="text-xs text-muted-foreground font-sans">Documents</p>
                          </CardContent>
                        </Card>
                        <Card className="shadow-md">
                          <CardContent className="p-4 text-center">
                            <FiGlobe className="mx-auto text-blue-600 text-lg mb-1" />
                            <p className="font-mono text-2xl font-bold">{contentItems.filter(c => c.type === 'website_url').length}</p>
                            <p className="text-xs text-muted-foreground font-sans">Web Resources</p>
                          </CardContent>
                        </Card>
                      </div>
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
