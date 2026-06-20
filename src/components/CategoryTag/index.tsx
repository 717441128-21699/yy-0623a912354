import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import { CaseCategory, WeaknessCategory } from '@/types'
import { caseCategoryLabels, weaknessCategoryLabels } from '@/data/cases'

interface CategoryTagProps {
  type: 'case' | 'weakness'
  value: CaseCategory | WeaknessCategory
  size?: 'sm' | 'md'
}

const colorMap: Record<string, { bg: string; text: string }> = {
  implant: { bg: '#F5F3FF', text: '#7C3AED' },
  orthodontic: { bg: '#ECFEFF', text: '#0891B2' },
  endodontic: { bg: '#FEF2F2', text: '#DC2626' },
  medicalRecord: { bg: '#EFF6FF', text: '#2563EB' },
  infectionControl: { bg: '#ECFDF5', text: '#059669' },
  feeConsistency: { bg: '#FFFBEB', text: '#D97706' },
  followUpManagement: { bg: '#F0FDFA', text: '#0D9488' }
}

const CategoryTag: React.FC<CategoryTagProps> = ({ type, value, size = 'md' }) => {
  const colors = colorMap[value] || { bg: '#F1F5F9', text: '#64748B' }
  const label = type === 'case'
    ? caseCategoryLabels[value as CaseCategory] || value
    : weaknessCategoryLabels[value as WeaknessCategory] || value

  return (
    <View
      className={classnames(styles.tag, size === 'sm' && styles.tagSm)}
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      <Text className={styles.text}>{label}</Text>
    </View>
  )
}

export default CategoryTag
