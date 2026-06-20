import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import { AuditItem } from '@/types'
import CategoryTag from '@/components/CategoryTag'

interface QuestionCardProps {
  auditItem: AuditItem
  userAnswer?: boolean
  isAnswered: boolean
  onAnswer: (answer: boolean) => void
  index: number
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  auditItem,
  userAnswer,
  isAnswered,
  onAnswer,
  index
}) => {
  const isCorrect = isAnswered && userAnswer === auditItem.isCompliant
  const isWrong = isAnswered && userAnswer !== auditItem.isCompliant

  return (
    <View className={classnames(
      styles.card,
      isCorrect && styles.correct,
      isWrong && styles.wrong
    )}>
      <View className={styles.header}>
        <View className={styles.indexBadge}>
          <Text className={styles.indexText}>{index}</Text>
        </View>
        <View className={styles.headerContent}>
          <View className={styles.titleRow}>
            <Text className={styles.title}>{auditItem.label}</Text>
            <CategoryTag type="weakness" value={auditItem.weaknessCategory} size="sm" />
          </View>
          <Text className={styles.rule}>{auditItem.description}</Text>
        </View>
      </View>

      {!isAnswered ? (
        <View className={styles.actionRow}>
          <Text className={styles.question}>该项是否符合门诊规范？</Text>
          <View className={styles.buttonGroup}>
            <View
              className={classnames(styles.btn, styles.btnCompliant)}
              onClick={() => onAnswer(true)}
            >
              <Text className={styles.btnText}>✓ 符合规范</Text>
            </View>
            <View
              className={classnames(styles.btn, styles.btnNonCompliant)}
              onClick={() => onAnswer(false)}
            >
              <Text className={styles.btnText}>✕ 存在缺陷</Text>
            </View>
          </View>
        </View>
      ) : (
        <View className={styles.resultRow}>
          <View className={styles.resultHeader}>
            {isCorrect ? (
              <View className={styles.correctTag}>
                <Text className={styles.correctTagText}>✓ 判断正确</Text>
              </View>
            ) : (
              <View className={styles.wrongTag}>
                <Text className={styles.wrongTagText}>✕ 判断错误</Text>
              </View>
            )}
            <View className={styles.answerRow}>
              <Text className={styles.answerLabel}>正确答案：</Text>
              <Text className={classnames(
                styles.answerValue,
                auditItem.isCompliant ? styles.answerYes : styles.answerNo
              )}>
                {auditItem.isCompliant ? '符合规范' : '存在缺陷'}
              </Text>
            </View>
          </View>

          {!auditItem.isCompliant && auditItem.defectDetail && (
            <View className={styles.defectBox}>
              <Text className={styles.defectLabel}>缺陷明细：</Text>
              <Text className={styles.defectText}>{auditItem.defectDetail}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

export default QuestionCard
