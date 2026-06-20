import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import { WrongRecord } from '@/types'
import CategoryTag from '@/components/CategoryTag'
import { formatTime } from '@/utils'

interface WrongItemCardProps {
  record: WrongRecord
  onViewAnalysis: () => void
}

const WrongItemCard: React.FC<WrongItemCardProps> = ({ record, onViewAnalysis }) => {
  return (
    <View className={styles.card} onClick={onViewAnalysis}>
      <View className={styles.header}>
        <CategoryTag type="case" value={record.category} size="sm" />
        <View className={styles.time}>
          <Text className={styles.timeText}>{formatTime(record.timestamp)}</Text>
        </View>
      </View>

      <Text className={styles.caseTitle}>{record.caseTitle}</Text>

      <View className={styles.errorRow}>
        <View className={styles.errorBadge}>
          <Text className={styles.errorBadgeText}>稽核项：{record.auditItemLabel}</Text>
        </View>
      </View>

      <View className={styles.answersRow}>
        <View className={classnames(styles.answerBox, styles.userWrong)}>
          <Text className={styles.answerLabel}>你的判断</Text>
          <Text className={styles.answerValue}>{record.userAnswer ? '符合规范' : '存在缺陷'}</Text>
        </View>
        <View className={styles.arrowBox}>
          <Text className={styles.arrowText}>→</Text>
        </View>
        <View className={classnames(styles.answerBox, styles.correctAnswer)}>
          <Text className={styles.answerLabel}>正确答案</Text>
          <Text className={styles.answerValue}>{record.correctAnswer ? '符合规范' : '存在缺陷'}</Text>
        </View>
      </View>

      <View className={styles.footer}>
        <CategoryTag type="weakness" value={record.weaknessCategory} size="sm" />
        <View className={styles.viewBtn}>
          <Text className={styles.viewText}>查看解析</Text>
          <Text className={styles.arrowIcon}>→</Text>
        </View>
      </View>
    </View>
  )
}

export default WrongItemCard
