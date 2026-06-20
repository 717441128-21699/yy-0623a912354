import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'
import { AuditItem } from '@/types'

interface AnalysisPanelProps {
  analysis: AuditItem['analysis']
  visible: boolean
  onClose: () => void
}

const riskTypeMap = {
  dispute: { label: '⚖️ 医疗纠纷风险', color: '#EF4444', bg: '#FEF2F2' },
  insurance: { label: '🏥 医保拒付风险', color: '#F59E0B', bg: '#FFFBEB' },
  fee: { label: '💰 收费争议风险', color: '#8B5CF6', bg: '#F5F3FF' }
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis, visible, onClose }) => {
  if (!visible) return null

  const risk = riskTypeMap[analysis.riskType]

  return (
    <View className={styles.overlay} onClick={onClose}>
      <View className={styles.panel} onClick={e => e.stopPropagation()}>
        <View className={styles.handle} />

        <View className={styles.header}>
          <View
            className={styles.riskTag}
            style={{ backgroundColor: risk.bg, color: risk.color }}
          >
            <Text className={styles.riskText}>{risk.label}</Text>
          </View>
          <View className={styles.closeBtn} onClick={onClose}>
            <Text className={styles.closeText}>×</Text>
          </View>
        </View>

        <Text className={styles.title}>{analysis.title}</Text>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon}>📋</View>
            <Text className={styles.sectionTitle}>规范解析</Text>
          </View>
          <View className={styles.sectionContent}>
            <Text className={styles.sectionText}>{analysis.content}</Text>
          </View>
        </View>

        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <View className={styles.sectionIcon}>⚠️</View>
            <Text className={styles.sectionTitle}>真实案例场景</Text>
          </View>
          <View className={classnames(styles.sectionContent, styles.scenario)}>
            <Text className={styles.sectionText}>{analysis.scenario}</Text>
          </View>
        </View>

        <View className={styles.footer}>
          <View className={styles.tipBox}>
            <Text className={styles.tipIcon}>💡</Text>
            <Text className={styles.tipText}>养成规范书写习惯，保护患者也保护自己</Text>
          </View>
          <View className={styles.confirmBtn} onClick={onClose}>
            <Text className={styles.confirmText}>我记住了</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default AnalysisPanel
