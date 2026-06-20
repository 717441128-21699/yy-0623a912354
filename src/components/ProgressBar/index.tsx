import React from 'react'
import { View, Text } from '@tarojs/components'
import classnames from 'classnames'
import styles from './index.module.scss'

interface ProgressBarProps {
  current: number
  total: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  showLabel = true,
  size = 'md',
  color = 'primary'
}) => {
  const percent = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0

  return (
    <View className={classnames(styles.wrapper, styles[`size${size.charAt(0).toUpperCase() + size.slice(1)}`])}>
      {showLabel && (
        <View className={styles.label}>
          <Text className={styles.labelText}>进度 {current}/{total}</Text>
          <Text className={styles.percent}>{percent}%</Text>
        </View>
      )}
      <View className={styles.track}>
        <View
          className={classnames(styles.fill, styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}`])}
          style={{ width: `${percent}%` }}
        />
      </View>
    </View>
  )
}

export default ProgressBar
