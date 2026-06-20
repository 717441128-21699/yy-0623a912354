import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface StatsCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: string
  trend?: 'up' | 'down' | 'none'
  color?: 'primary' | 'success' | 'warning' | 'error'
  subText?: string
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  unit,
  icon,
  color = 'primary',
  subText
}) => {
  return (
    <View className={classnames(styles.card, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`])}>
      {icon && <View className={styles.icon}>{icon}</View>}
      <View className={styles.content}>
        <View className={styles.title}>
          <Text className={styles.titleText}>{title}</Text>
        </View>
        <View className={styles.valueRow}>
          <Text className={styles.value}>{value}</Text>
          {unit && <Text className={styles.unit}>{unit}</Text>}
        </View>
        {subText && <Text className={styles.subText}>{subText}</Text>}
      </View>
    </View>
  )
}

export default StatsCard
