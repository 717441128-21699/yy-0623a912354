import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import { CaseData } from '@/types'
import CategoryTag from '@/components/CategoryTag'
import { getDifficultyStars, getDifficultyLabel } from '@/utils'

interface CaseCardProps {
  caseData: CaseData
  isCompleted?: boolean
  onClick?: () => void
}

const difficultyColorMap = {
  1: '#10B981',
  2: '#F59E0B',
  3: '#EF4444'
}

const CaseCard: React.FC<CaseCardProps> = ({ caseData, isCompleted, onClick }) => {
  return (
    <View
      className={classnames(styles.card, isCompleted && styles.completed)}
      onClick={onClick}
    >
      <View className={styles.header}>
        <CategoryTag type="case" value={caseData.category} size="sm" />
        <View className={styles.difficulty}>
          <Text className={styles.difficultyStars} style={{ color: difficultyColorMap[caseData.difficulty] }}>
            {getDifficultyStars(caseData.difficulty)}
          </Text>
          <Text className={styles.difficultyLabel}>{getDifficultyLabel(caseData.difficulty)}</Text>
        </View>
      </View>

      <Text className={styles.title}>{caseData.title}</Text>

      <View className={styles.metaRow}>
        <View className={styles.metaItem}>
          <Text className={styles.metaLabel}>患者</Text>
          <Text className={styles.metaValue}>{caseData.patientGender} · {caseData.patientAge}</Text>
        </View>
        {isCompleted && (
          <View className={styles.completedBadge}>
            <Text className={styles.completedText}>✓ 已完成</Text>
          </View>
        )}
      </View>

      <View className={styles.previewBox}>
        <Text className={styles.previewLabel}>主诉摘要：</Text>
        <Text className={styles.previewText}>{caseData.chiefComplaintRaw}</Text>
      </View>

      <View className={styles.footer}>
        <Text className={styles.startText}>{isCompleted ? '再练一次' : '开始稽核'}</Text>
        <Text className={styles.arrow}>→</Text>
      </View>
    </View>
  )
}

export default CaseCard
