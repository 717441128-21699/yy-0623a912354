import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import Taro from '@tarojs/taro'
import { WrongRecord, TrainingStats, WeaknessCategory, CaseData, CaseCategory, FollowUpTask, FollowUpStatus } from '@/types'
import { mockCases } from '@/data/cases'
import { calcWeaknessDistribution } from '@/utils'

export interface MockStudent {
  id: string
  name: string
  avatar: string
  title: string
  completedCaseIds: string[]
  wrongRecords: WrongRecord[]
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
  addWrongRecord: (record: WrongRecord) => void
  setCaseCompleted: (caseId: string) => void
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
  removeFollowUpTask: (taskId: string) => void
  getFollowUpTasksByStudent: (studentId: string) => FollowUpTask[]
  generateFollowUpTasksForStudent: (studentId: string) => void
}

const TrainingContext = createContext<TrainingContextType | null>(null)

const STORAGE_KEY_WRONG = 'dental_qc_wrong_records_v2'
const STORAGE_KEY_COMPLETED = 'dental_qc_completed_cases_v2'
const STORAGE_KEY_MODE = 'dental_qc_mode'
const STORAGE_KEY_STUDENT = 'dental_qc_current_student'
const STORAGE_KEY_STUDENTS = 'dental_qc_students_v2'
const STORAGE_KEY_TEACHER_VIEW = 'dental_qc_teacher_view'
const STORAGE_KEY_FOLLOWUP = 'dental_qc_followup_v2'

const generateMockWrongRecords = (seed: number): WrongRecord[] => {
  const items: Array<{
    caseId: string
    caseTitle: string
    category: CaseCategory
    auditItemKey: import('@/types').AuditItemKey
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

const defaultMockStudents: MockStudent[] = [
  {
    id: 'stu-001',
    name: '张思远',
    avatar: '👨‍⚕️',
    title: '规培第一年',
    completedCaseIds: ['implant-001', 'orthodontic-001', 'endodontic-001'],
    wrongRecords: generateMockWrongRecords(1)
  },
  {
    id: 'stu-002',
    name: '李雨桐',
    avatar: '👩‍⚕️',
    title: '新入职3个月',
    completedCaseIds: ['implant-001', 'implant-002', 'endodontic-001'],
    wrongRecords: generateMockWrongRecords(2)
  },
  {
    id: 'stu-003',
    name: '王浩然',
    avatar: '🧑‍⚕️',
    title: '口腔医学生·大五',
    completedCaseIds: ['orthodontic-001', 'endodontic-001'],
    wrongRecords: generateMockWrongRecords(3)
  },
  {
    id: 'stu-004',
    name: '陈佳琪',
    avatar: '👩‍🎓',
    title: '规培第二年',
    completedCaseIds: ['implant-001', 'implant-002', 'orthodontic-001', 'orthodontic-002', 'endodontic-001', 'endodontic-002'],
    wrongRecords: generateMockWrongRecords(4)
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
    saveStorage(STORAGE_KEY_STUDENT, currentStudentId)
  }, [currentStudentId])

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

  const setCaseCompleted = useCallback((caseId: string) => {
    setCompletedCaseIds(prev => {
      if (prev.includes(caseId)) return prev
      return [...prev, caseId]
    })
  }, [])

  const setCurrentCase = useCallback((caseId: string) => {
    setCurrentCaseId(caseId)
  }, [])

  const clearAllData = useCallback(() => {
    setWrongRecords([])
    setCompletedCaseIds([])
    removeStorage(STORAGE_KEY_WRONG)
    removeStorage(STORAGE_KEY_COMPLETED)
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
    const stats = studentId === 'self'
      ? computeStats(wrongRecords, completedCaseIds)
      : getStatsByStudent(studentId)
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
  }, [wrongRecords, completedCaseIds, computeStats, getStatsByStudent])

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

  const removeFollowUpTask = useCallback((taskId: string) => {
    setFollowUpTasks(prev => prev.filter(t => t.id !== taskId))
  }, [])

  const getFollowUpTasksByStudent = useCallback((studentId: string) => {
    return followUpTasks.filter(t => t.studentId === studentId)
  }, [followUpTasks])

  const generateFollowUpTasksForStudent = useCallback((studentId: string) => {
    const stats = studentId === 'self'
      ? computeStats(wrongRecords, completedCaseIds)
      : getStatsByStudent(studentId)
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
  }, [wrongRecords, completedCaseIds, computeStats, getStatsByStudent, followUpTasks])

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
        removeFollowUpTask,
        getFollowUpTasksByStudent,
        generateFollowUpTasksForStudent
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
