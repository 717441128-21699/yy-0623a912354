export type CaseCategory = 'implant' | 'orthodontic' | 'endodontic'

export type AuditItemKey = 'chiefComplaint' | 'examination' | 'treatmentPlan' | 'imaging' | 'informedConsent'

export type WeaknessCategory = 'medicalRecord' | 'infectionControl' | 'feeConsistency' | 'followUpManagement'

export interface AuditItem {
  key: AuditItemKey
  label: string
  description: string
  isCompliant: boolean
  defectDetail?: string
  analysis: {
    riskType: 'dispute' | 'insurance' | 'fee'
    title: string
    content: string
    scenario: string
  }
  weaknessCategory: WeaknessCategory
}

export interface CaseData {
  id: string
  title: string
  category: CaseCategory
  difficulty: 1 | 2 | 3
  patientAge: string
  patientGender: string
  chiefComplaintRaw: string
  examinationRaw: string
  treatmentPlanRaw: string
  imagingNote: string
  consentNote: string
  auditItems: AuditItem[]
}

export interface WrongRecord {
  id: string
  caseId: string
  caseTitle: string
  category: CaseCategory
  auditItemKey: AuditItemKey
  auditItemLabel: string
  userAnswer: boolean
  correctAnswer: boolean
  weaknessCategory: WeaknessCategory
  analysis: AuditItem['analysis']
  timestamp: number
}

export interface TrainingStats {
  totalCases: number
  completedCases: number
  correctRate: number
  wrongCount: number
  weaknessDistribution: Record<WeaknessCategory, number>
}

export type FollowUpStatus = 'pending' | 'scheduled' | 'done'
export type ClinicScene = 'comprehensive' | 'implant' | 'orthodontic' | 'endodontic' | 'pediatric' | 'surgery'

export interface FollowUpTask {
  id: string
  studentId: string
  category: WeaknessCategory
  status: FollowUpStatus
  createdAt: number
  updatedAt: number
  scheduledDate?: string
  clinicScene?: ClinicScene
  note?: string
}

export interface CaseSessionRecord {
  id: string
  caseId: string
  caseTitle: string
  category: CaseCategory
  completedAt: number
  correctCount: number
  wrongCount: number
  score: number
  isSpecial?: boolean
  specialFilters?: {
    caseCategory?: CaseCategory | 'all'
    weakness?: WeaknessCategory | 'all'
  }
}

export interface SpecialPracticeConfig {
  filterCaseCategory: CaseCategory | 'all'
  filterWeakness: WeaknessCategory | 'all'
  sourceWrongRecordIds: string[]
  auditItems: Array<{
    caseId: string
    caseTitle: string
    caseCategory: CaseCategory
    auditItemKey: AuditItemKey
    auditItem: AuditItem
  }>
}
