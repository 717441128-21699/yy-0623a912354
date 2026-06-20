import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'
import { WrongRecord, TrainingStats, WeaknessCategory, CaseData } from '@/types'
import { mockCases } from '@/data/cases'
import { calcWeaknessDistribution } from '@/utils'

interface TrainingContextType {
  wrongRecords: WrongRecord[]
  completedCaseIds: string[]
  currentCaseId: string | null
  addWrongRecord: (record: WrongRecord) => void
  setCaseCompleted: (caseId: string) => void
  setCurrentCase: (caseId: string) => void
  clearAllData: () => void
  getStats: () => TrainingStats
  getCasesByCategory: (category: CaseData['category']) => CaseData[]
  getWrongRecordsByCategory: (category: WeaknessCategory) => WrongRecord[]
}

const TrainingContext = createContext<TrainingContextType | null>(null)

const STORAGE_KEY_WRONG = 'dental_qc_wrong_records'
const STORAGE_KEY_COMPLETED = 'dental_qc_completed_cases'

export const TrainingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wrongRecords, setWrongRecords] = useState<WrongRecord[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_WRONG)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const [completedCaseIds, setCompletedCaseIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMPLETED)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(wrongRecords))
  }, [wrongRecords])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPLETED, JSON.stringify(completedCaseIds))
  }, [completedCaseIds])

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
  }, [])

  const getStats = useCallback((): TrainingStats => {
    const totalCases = mockCases.length
    const completedCases = completedCaseIds.length
    const totalAuditItems = mockCases.reduce(
      (sum, c) => sum + c.auditItems.length, 0
    )
    const wrongCount = wrongRecords.length
    const correctRate = totalAuditItems > 0
      ? Math.max(0, Math.round(((totalAuditItems * completedCases / mockCases.length) - wrongCount) / (totalAuditItems * completedCases / mockCases.length || 1) * 100))
      : 0

    const weaknessDistribution = calcWeaknessDistribution(wrongRecords)

    return {
      totalCases,
      completedCases,
      correctRate: completedCases === 0 ? 0 : correctRate,
      wrongCount,
      weaknessDistribution
    }
  }, [completedCaseIds, wrongRecords])

  const getCasesByCategory = useCallback((category: CaseData['category']) => {
    return mockCases.filter(c => c.category === category)
  }, [])

  const getWrongRecordsByCategory = useCallback((category: WeaknessCategory) => {
    return wrongRecords.filter(r => r.weaknessCategory === category)
  }, [wrongRecords])

  return (
    <TrainingContext.Provider
      value={{
        wrongRecords,
        completedCaseIds,
        currentCaseId,
        addWrongRecord,
        setCaseCompleted,
        setCurrentCase,
        clearAllData,
        getStats,
        getCasesByCategory,
        getWrongRecordsByCategory
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
