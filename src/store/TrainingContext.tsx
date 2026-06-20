import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import {
  WrongRecord,
  TrainingStats,
  WeaknessCategory,
  CaseData,
  CaseCategory,
  FollowUpTask,
  FollowUpStatus,
  ClinicScene,
  CaseSessionRecord,
  SpecialPracticeConfig,
  AuditItemKey
} from '@/types'
import { mockCases } from '@/data/cases'
import { calcWeaknessDistribution } from '@/utils'

export interface MockStudent {
  id: string
  name: string
  avatar: string
  title: string
  completedCaseIds: string[]
  wrongRecords: WrongRecord[]
  sessionRecords: CaseSessionRecord[]
}

interface TrainingContextType {
  wrongRecords: WrongRecord[]
  completedCaseIds: string[]
  currentCaseId: string | null
  wrongCount: number
  currentStudentId: string
  isTeacherMode: boolean
  teacherViewMode: 'overview' | 'detail'
  mockStudents: MockStudent[]
  followUpTasks: FollowUpTask[]
  sessionRecords: CaseSessionRecord[]
  specialPractice: SpecialPracticeConfig | null
  isSpecialMode: boolean
  addWrongRecord: (record: WrongRecord) => void
  setCaseCompleted: (caseId: string, session?: Omit<CaseSessionRecord, 'id' | 'completedAt'>) => void
  setCurrentCase: (caseId: string) => void
  clearAllData: () => void
  getStats: () => TrainingStats
  getStatsByStudent: (studentId: string) => TrainingStats
  getCasesByCategory: (category: CaseCategory) => CaseData[]
  getWrongRecordsByCategory: (category: WeaknessCategory) => WrongRecord[]
  getWrongRecordsByStudent: (studentId: string) => WrongRecord[]
  switchStudent: (studentId: string) => void
  toggleTeacherMode: () => void
  setTeacherViewMode: (mode: 'overview' | 'detail') => void
  getTopWeaknessByStudent: (studentId: string) => WeaknessCategory | null
  addFollowUpTask: (task: Omit<FollowUpTask, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateFollowUpStatus: (taskId: string, status: FollowUpStatus) => void
  updateFollowUpDetails: (taskId: string, patch: Partial<Pick<FollowUpTask, 'scheduledDate' | 'clinicScene' | 'note'>>) => void
  removeFollowUpTask: (taskId: string) => void
  getFollowUpTasksByStudent: (studentId: string) => FollowUpTask[]
  getFollowUpTasksByDate: (date: string) => FollowUpTask[]
  generateFollowUpTasksForStudent: (studentId: string) => void
  getSessionRecordsByStudent: (studentId: string, limit?: number) => CaseSessionRecord[]
  getTrendByStudent: (studentId: string, lastN?: number) => Array<{
    idx: number
    label: string
    score: number
    correctRate: number
    wrongCount: number
    delta: 'up' | 'down' | 'flat'
  }>
  generateSpecialPractice: (filter: {
    caseCategory: CaseCategory | 'all'
    weakness: WeaknessCategory | 'all'
  }) => number
  clearSpecialPractice: () => void
  getCurrentSpecialAuditItems: () => Array<{
    caseId: string
    caseTitle: string
    caseCategory: CaseCategory
    auditItemKey: AuditItemKey
    patientInfo: { age: string; gender: string }
    rawMaterials: {
      chiefComplaintRaw: string
      examinationRaw: string
      treatmentPlanRaw: string
      imagingNote: string
      consentNote: string
    }
  }>
}

const TrainingContext = createContext<TrainingContextType | null>(null)

const STORAGE_KEY_WRONG = 'dental_qc_wrong_records_v2'
const STORAGE_KEY_COMPLETED = 'dental_qc_completed_cases_v2'
const STORAGE_KEY_MODE = 'dental_qc_mode'
const STORAGE_KEY_STUDENT = 'dental_qc_current_student'
const STORAGE_KEY_STUDENTS = 'dental_qc_students_v3'
const STORAGE_KEY_TEACHER_VIEW = 'dental_qc_teacher_view'
const STORAGE_KEY_FOLLOWUP = 'dental_qc_followup_v3'
const STORAGE_KEY_SESSIONS = 'dental_qc_session_records_v1'
const STORAGE_KEY_SPECIAL = 'dental_qc_special_practice_v1'

const generateMockWrongRecords = (seed: number): WrongRecord[] => {
  const items: Array<{
    caseId: string
    caseTitle: string
    category: CaseCategory
    auditItemKey: AuditItemKey
    auditItemLabel: string
    weaknessCategory: WeaknessCategory
    analysis: import('@/types').AuditItem['analysis']
    userAnswer: boolean
  }> = []

  mockCases.forEach(c => {
    c.auditItems.forEach(item => {
      if (!item.isCompliant) {
        items.push({
          caseId: c.id,
          caseTitle: c.title,
          category: c.category,
          auditItemKey: item.key,
          auditItemLabel: item.label,
          weaknessCategory: item.weaknessCategory,
          analysis: item.analysis,
          userAnswer: true
        })
      }
    })
  })

  const shuffled = items.sort(() => Math.sin(seed) - 0.5 + (Math.random() - 0.5))
  const count = Math.min(shuffled.length, 4 + (seed % 8))
  const selected = shuffled.slice(0, count)

  return selected.map((it, idx) => ({
    id: `mock-${seed}-${idx}`,
    ...it,
    correctAnswer: false,
    timestamp: Date.now() - (idx + 1) * 3600_000
  }))
}

const generateMockSessions = (seed: number, completedIds: string[]): CaseSessionRecord[] => {
  const result: CaseSessionRecord[] = []
  const now = Date.now()
  completedIds.forEach((cid, i) => {
    const c = mockCases.find(x => x.id === cid)
    if (!c) return
    const s = Math.max(40, Math.min(100, 60 + seed * 5 + i * 7 - Math.floor(Math.random() * 30)))
    result.push({
      id: `sess-${seed}-${i}`,
      caseId: cid,
      caseTitle: c.title,
      category: c.category,
      completedAt: now - (completedIds.length - i) * 86400_000,
      correctCount: Math.round(s / 20),
      wrongCount: 5 - Math.round(s / 20),
      score: s
    })
  })
  return result
}

const defaultMockStudents: MockStudent[] = [
  {
    id: 'stu-001',
    name: '张思远',
    avatar: '👨‍⚕️',
    title: '规培第一年',
    completedCaseIds: ['implant-001', 'orthodontic-001', 'endodontic-001'],
    wrongRecords: generateMockWrongRecords(1),
    sessionRecords: generateMockSessions(1, ['implant-001', 'orthodontic-001', 'endodontic-001'])
  },
  {
    id: 'stu-002',
    name: '李雨桐',
    avatar: '👩‍⚕️',
    title: '新入职3个月',
    completedCaseIds: ['implant-001', 'implant-002', 'endodontic-001'],
    wrongRecords: generateMockWrongRecords(2),
    sessionRecords: generateMockSessions(2, ['implant-001', 'implant-002', 'endodontic-001'])
  },
  {
    id: 'stu-003',
    name: '王浩然',
    avatar: '🧑‍⚕️',
    title: '口腔医学生·大五',
    completedCaseIds: ['orthodontic-001', 'endodontic-001'],
    wrongRecords: generateMockWrongRecords(3),
    sessionRecords: generateMockSessions(3, ['orthodontic-001', 'endodontic-001'])
  },
  {
    id: 'stu-004',
    name: '陈佳琪',
    avatar: '👩‍🎓',
    title: '规培第二年',
    completedCaseIds: ['implant-001', 'implant-002', 'orthodontic-001', 'orthodontic-002', 'endodontic-001', 'endodontic-002'],
    wrongRecords: generateMockWrongRecords(4),
    sessionRecords: generateMockSessions(4, ['implant-001', 'implant-002', 'orthodontic-001', 'orthodontic-002', 'endodontic-001', 'endodontic-002'])
  }
]

const loadStorage = <T,>(key: string, fallback: T): T => {
  try {
    if (process.env.TARO_ENV === 'h5') {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } else {
      const raw = Taro.getStorageSync(key)
      return raw !== '' && raw !== undefined && raw !== null ? JSON.parse(raw) : fallback
    }
  } catch (e) {
    console.warn(`[Storage] load ${key} failed:`, e)
    return fallback
  }
}

const saveStorage = (key: string, value: unknown) => {
  try {
    const str = JSON.stringify(value)
    if (process.env.TARO_ENV === 'h5') {
      localStorage.setItem(key, str)
    } else {
      Taro.setStorageSync(key, str)
    }
  } catch (e) {
    console.warn(`[Storage] save ${key} failed:`, e)
  }
}

const removeStorage = (key: string) => {
  try {
    if (process.env.TARO_ENV === 'h5') {
      localStorage.removeItem(key)
    } else {
      Taro.removeStorageSync(key)
    }
  } catch (e) {
    console.warn(`[Storage] remove ${key} failed:`, e)
  }
}

const formatDateLabel = (ts: number) => {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export const TrainingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wrongRecords, setWrongRecords] = useState<WrongRecord[]>(() =>
    loadStorage<WrongRecord[]>(STORAGE_KEY_WRONG, [])
  )

  const [completedCaseIds, setCompletedCaseIds] = useState<string[]>(() =>
    loadStorage<string[]>(STORAGE_KEY_COMPLETED, [])
  )

  const [mockStudents, setMockStudents] = useState<MockStudent[]>(() =>
    loadStorage<MockStudent[]>(STORAGE_KEY_STUDENTS, defaultMockStudents)
  )

  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null)

  const [isTeacherMode, setIsTeacherMode] = useState<boolean>(() =>
    loadStorage<boolean>(STORAGE_KEY_MODE, false)
  )

  const [teacherViewMode, setTeacherViewModeState] = useState<'overview' | 'detail'>(() =>
    loadStorage<'overview' | 'detail'>(STORAGE_KEY_TEACHER_VIEW, 'overview')
  )

  const [followUpTasks, setFollowUpTasks] = useState<FollowUpTask[]>(() =>
    loadStorage<FollowUpTask[]>(STORAGE_KEY_FOLLOWUP, [])
  )

  const [sessionRecords, setSessionRecords] = useState<CaseSessionRecord[]>(() =>
    loadStorage<CaseSessionRecord[]>(STORAGE_KEY_SESSIONS, [])
  )

  const [specialPractice, setSpecialPractice] = useState<SpecialPracticeConfig | null>(() =>
    loadStorage<SpecialPracticeConfig | null>(STORAGE_KEY_SPECIAL, null)
  )

  const [currentStudentId, setCurrentStudentId] = useState<string>(() =>
    loadStorage<string>(STORAGE_KEY_STUDENT, 'self')
  )

  useEffect(() => {
    saveStorage(STORAGE_KEY_WRONG, wrongRecords)
  }, [wrongRecords])

  useEffect(() => {
    saveStorage(STORAGE_KEY_COMPLETED, completedCaseIds)
  }, [completedCaseIds])

  useEffect(() => {
    saveStorage(STORAGE_KEY_STUDENTS, mockStudents)
  }, [mockStudents])

  useEffect(() => {
    saveStorage(STORAGE_KEY_MODE, isTeacherMode)
  }, [isTeacherMode])

  useEffect(() => {
    saveStorage(STORAGE_KEY_TEACHER_VIEW, teacherViewMode)
  }, [teacherViewMode])

  useEffect(() => {
    saveStorage(STORAGE_KEY_FOLLOWUP, followUpTasks)
  }, [followUpTasks])

  useEffect(() => {
    saveStorage(STORAGE_KEY_SESSIONS, sessionRecords)
  }, [sessionRecords])

  useEffect(() => {
    saveStorage(STORAGE_KEY_SPECIAL, specialPractice)
  }, [specialPractice])

  useEffect(() => {
    saveStorage(STORAGE_KEY_STUDENT, currentStudentId)
  }, [currentStudentId])

  const isSpecialMode = specialPractice !== null

  const computeStats = useCallback((wrongs: WrongRecord[], completed: string[]): TrainingStats => {
    const totalCases = mockCases.length
    const completedCases = completed.length
    const answeredItems = completedCases * 5
    const wrongCount = wrongs.length
    const correctCount = Math.max(0, answeredItems - wrongCount)
    const correctRate = answeredItems > 0
      ? Math.round((correctCount / answeredItems) * 100)
      : 0
    const weaknessDistribution = calcWeaknessDistribution(wrongs)

    return {
      totalCases,
      completedCases,
      correctRate,
      wrongCount,
      weaknessDistribution
    }
  }, [])

  const getStats = useCallback((): TrainingStats => {
    return computeStats(wrongRecords, completedCaseIds)
  }, [wrongRecords, completedCaseIds, computeStats])

  const getStatsByStudent = useCallback((studentId: string): TrainingStats => {
    if (studentId === 'self') {
      return computeStats(wrongRecords, completedCaseIds)
    }
    const stu = mockStudents.find(s => s.id === studentId)
    if (!stu) {
      return computeStats([], [])
    }
    return computeStats(stu.wrongRecords, stu.completedCaseIds)
  }, [wrongRecords, completedCaseIds, mockStudents, computeStats])

  const addWrongRecord = useCallback((record: WrongRecord) => {
    setWrongRecords(prev => {
      const exists = prev.some(
        r => r.caseId === record.caseId && r.auditItemKey === record.auditItemKey
      )
      if (exists) return prev
      return [...prev, record]
    })
  }, [])

  const setCaseCompleted = useCallback((caseId: string, session?: Omit<CaseSessionRecord, 'id' | 'completedAt'>) => {
    setCompletedCaseIds(prev => {
      if (prev.includes(caseId)) return prev
      return [...prev, caseId]
    })
    if (session) {
      const now = Date.now()
      const record: CaseSessionRecord = {
        ...session,
        id: `sess-${now}-${Math.random().toString(36).slice(2, 7)}`,
        completedAt: now
      }
      setSessionRecords(prev => [...prev, record])
    }
  }, [])

  const setCurrentCase = useCallback((caseId: string) => {
    setCurrentCaseId(caseId)
  }, [])

  const clearAllData = useCallback(() => {
    setWrongRecords([])
    setCompletedCaseIds([])
    setSessionRecords([])
    setSpecialPractice(null)
    removeStorage(STORAGE_KEY_WRONG)
    removeStorage(STORAGE_KEY_COMPLETED)
    removeStorage(STORAGE_KEY_SESSIONS)
    removeStorage(STORAGE_KEY_SPECIAL)
  }, [])

  const getCasesByCategory = useCallback((category: CaseCategory) => {
    return mockCases.filter(c => c.category === category)
  }, [])

  const getWrongRecordsByCategory = useCallback((category: WeaknessCategory) => {
    return wrongRecords.filter(r => r.weaknessCategory === category)
  }, [wrongRecords])

  const getWrongRecordsByStudent = useCallback((studentId: string) => {
    if (studentId === 'self') return wrongRecords
    const stu = mockStudents.find(s => s.id === studentId)
    return stu ? stu.wrongRecords : []
  }, [wrongRecords, mockStudents])

  const switchStudent = useCallback((studentId: string) => {
    setCurrentStudentId(studentId)
  }, [])

  const toggleTeacherMode = useCallback(() => {
    setIsTeacherMode(prev => {
      const next = !prev
      if (next && currentStudentId === 'self' && mockStudents.length > 0) {
        setCurrentStudentId(mockStudents[0].id)
        setTeacherViewModeState('overview')
      }
      return next
    })
  }, [currentStudentId, mockStudents])

  const setTeacherViewMode = useCallback((mode: 'overview' | 'detail') => {
    setTeacherViewModeState(mode)
  }, [])

  const getTopWeaknessByStudent = useCallback((studentId: string): WeaknessCategory | null => {
    const stats = getStatsByStudent(studentId)
    const dist = stats.weaknessDistribution
    const order: WeaknessCategory[] = ['medicalRecord', 'infectionControl', 'feeConsistency', 'followUpManagement']
    let top: WeaknessCategory | null = null
    let topCount = 0
    order.forEach(k => {
      if (dist[k] > topCount) {
        topCount = dist[k]
        top = k
      }
    })
    return topCount > 0 ? top : null
  }, [getStatsByStudent])

  const addFollowUpTask = useCallback((task: Omit<FollowUpTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now()
    setFollowUpTasks(prev => [
      ...prev,
      { ...task, id: `fu-${now}-${Math.random().toString(36).slice(2, 7)}`, createdAt: now, updatedAt: now }
    ])
  }, [])

  const updateFollowUpStatus = useCallback((taskId: string, status: FollowUpStatus) => {
    setFollowUpTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status, updatedAt: Date.now() } : t
    ))
  }, [])

  const updateFollowUpDetails = useCallback((taskId: string, patch: Partial<Pick<FollowUpTask, 'scheduledDate' | 'clinicScene' | 'note'>>) => {
    setFollowUpTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...patch, updatedAt: Date.now() } : t
    ))
  }, [])

  const removeFollowUpTask = useCallback((taskId: string) => {
    setFollowUpTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const getFollowUpTasksByStudent = useCallback((studentId: string) => {
    return followUpTasks.filter(t => t.studentId === studentId).sort((a, b) => {
      if (!a.scheduledDate && !b.scheduledDate) return b.createdAt - a.createdAt
      if (!a.scheduledDate) return 1
      if (!b.scheduledDate) return -1
      return a.scheduledDate.localeCompare(b.scheduledDate)
    })
  }, [followUpTasks])

  const getFollowUpTasksByDate = useCallback((date: string) => {
    return followUpTasks.filter(t => t.scheduledDate === date)
  }, [followUpTasks])

  const generateFollowUpTasksForStudent = useCallback((studentId: string) => {
    const stats = getStatsByStudent(studentId)
    const total = Object.values(stats.weaknessDistribution).reduce((a, b) => a + b, 0)
    if (total === 0) return

    const order: WeaknessCategory[] = ['medicalRecord', 'infectionControl', 'feeConsistency', 'followUpManagement']
    const now = Date.now()
    const existing = followUpTasks.filter(t => t.studentId === studentId)

    setFollowUpTasks(prev => {
      const next = [...prev]
      order.forEach(k => {
        const ratio = stats.weaknessDistribution[k] / total
        if (ratio >= 0.25 && !existing.some(e => e.category === k)) {
          next.push({
            id: `fu-${now}-${k}-${Math.random().toString(36).slice(2, 5)}`,
            studentId,
            category: k,
            status: 'pending',
            createdAt: now,
            updatedAt: now
          })
        }
      })
      return next
    })
  }, [getStatsByStudent, followUpTasks])

  const getSessionRecordsByStudent = useCallback((studentId: string, limit?: number): CaseSessionRecord[] => {
    let list: CaseSessionRecord[]
    if (studentId === 'self') {
      list = [...sessionRecords]
    } else {
      const stu = mockStudents.find(s => s.id === studentId)
      list = stu ? [...stu.sessionRecords] : []
    }
    list.sort((a, b) => b.completedAt - a.completedAt)
    return typeof limit === 'number' ? list.slice(0, limit) : list
  }, [sessionRecords, mockStudents])

  const getTrendByStudent = useCallback((studentId: string, lastN: number = 5) => {
    const list = getSessionRecordsByStudent(studentId, lastN).reverse()
    if (list.length === 0) return []
    const result: Array<{
      idx: number
      label: string
      score: number
      correctRate: number
      wrongCount: number
      delta: 'up' | 'down' | 'flat'
    }> = []
    list.forEach((rec, i) => {
      const total = rec.correctCount + rec.wrongCount
      const correctRate = total > 0 ? Math.round((rec.correctCount / total) * 100) : 0
      let delta: 'up' | 'down' | 'flat' = 'flat'
      if (i > 0) {
        const prev = result[i - 1]
        if (correctRate > prev.correctRate) delta = 'up'
        else if (correctRate < prev.correctRate) delta = 'down'
      }
      result.push({
        idx: i + 1,
        label: formatDateLabel(rec.completedAt),
        score: rec.score,
        correctRate,
        wrongCount: rec.wrongCount,
        delta
      })
    })
    return result
  }, [getSessionRecordsByStudent])

  const generateSpecialPractice = useCallback((filter: {
    caseCategory: CaseCategory | 'all'
    weakness: WeaknessCategory | 'all'
  }) => {
    const pool: SpecialPracticeConfig['auditItems'] = []
    const sourceIds: string[] = []

    wrongRecords.forEach(wr => {
      if (filter.caseCategory !== 'all' && wr.category !== filter.caseCategory) return
      if (filter.weakness !== 'all' && wr.weaknessCategory !== filter.weakness) return
      const c = mockCases.find(x => x.id === wr.caseId)
      if (!c) return
      const item = c.auditItems.find(a => a.key === wr.auditItemKey)
      if (!item) return
      pool.push({
        caseId: c.id,
        caseTitle: c.title,
        caseCategory: c.category,
        auditItemKey: item.key,
        auditItem: item
      })
      sourceIds.push(wr.id)
    })

    const limited = pool.slice(0, Math.min(10, Math.max(3, pool.length)))
    if (limited.length === 0) {
      Taro.showToast({ title: '暂无可练习错题', icon: 'none' })
      return 0
    }

    setSpecialPractice({
      filterCaseCategory: filter.caseCategory,
      filterWeakness: filter.weakness,
      sourceWrongRecordIds: sourceIds,
      auditItems: limited
    })
    return limited.length
  }, [wrongRecords])

  const clearSpecialPractice = useCallback(() => {
    setSpecialPractice(null)
  }, [])

  const getCurrentSpecialAuditItems = useCallback(() => {
    if (!specialPractice) return []
    return specialPractice.auditItems.map(item => {
      const c = mockCases.find(x => x.id === item.caseId)!
      return {
        caseId: item.caseId,
        caseTitle: item.caseTitle,
        caseCategory: item.caseCategory,
        auditItemKey: item.auditItemKey,
        patientInfo: { age: c.patientAge, gender: c.patientGender },
        rawMaterials: {
          chiefComplaintRaw: c.chiefComplaintRaw,
          examinationRaw: c.examinationRaw,
          treatmentPlanRaw: c.treatmentPlanRaw,
          imagingNote: c.imagingNote,
          consentNote: c.consentNote
        }
      }
    })
  }, [specialPractice])

  return (
    <TrainingContext.Provider
      value={{
        wrongRecords,
        completedCaseIds,
        currentCaseId,
        wrongCount: wrongRecords.length,
        currentStudentId,
        isTeacherMode,
        teacherViewMode,
        mockStudents,
        followUpTasks,
        sessionRecords,
        specialPractice,
        isSpecialMode,
        addWrongRecord,
        setCaseCompleted,
        setCurrentCase,
        clearAllData,
        getStats,
        getStatsByStudent,
        getCasesByCategory,
        getWrongRecordsByCategory,
        getWrongRecordsByStudent,
        switchStudent,
        toggleTeacherMode,
        setTeacherViewMode,
        getTopWeaknessByStudent,
        addFollowUpTask,
        updateFollowUpStatus,
        updateFollowUpDetails,
        removeFollowUpTask,
        getFollowUpTasksByStudent,
        getFollowUpTasksByDate,
        generateFollowUpTasksForStudent,
        getSessionRecordsByStudent,
        getTrendByStudent,
        generateSpecialPractice,
        clearSpecialPractice,
        getCurrentSpecialAuditItems
      }}
    >
      {children}
    </TrainingContext.Provider>
  )
}

export const useTraining = () => {
  const ctx = useContext(TrainingContext)
  if (!ctx) {
    throw new Error('useTraining must be used within TrainingProvider')
  }
  return ctx
}

export type { ClinicScene }
