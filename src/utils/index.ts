import { WeaknessCategory } from '@/types'

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

export const calcWeaknessDistribution = (
  records: { weaknessCategory: WeaknessCategory }[]
): Record<WeaknessCategory, number> => {
  const result: Record<WeaknessCategory, number> = {
    medicalRecord: 0,
    infectionControl: 0,
    feeConsistency: 0,
    followUpManagement: 0
  }
  records.forEach(r => {
    result[r.weaknessCategory]++
  })
  return result
}

export const getDifficultyStars = (level: 1 | 2 | 3): string => {
  return '★'.repeat(level) + '☆'.repeat(3 - level)
}

export const getDifficultyLabel = (level: 1 | 2 | 3): string => {
  const labels = { 1: '初级', 2: '中级', 3: '高级' }
  return labels[level]
}
