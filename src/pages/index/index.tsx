import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import styles from './index.module.scss';
import { useTraining } from '@/store/TrainingContext';
import { mockCases } from '@/data/cases';
import { CaseCategory } from '@/types';
import StatsCard from '@/components/StatsCard';
import CaseCard from '@/components/CaseCard';
import ProgressBar from '@/components/ProgressBar';
import classnames from 'classnames';

const HomePage: React.FC = () => {
  const {
    getStats,
    completedCaseIds,
    setCurrentCase,
    clearAllData,
    wrongCount
  } = useTraining();

  const [activeCategory, setActiveCategory] = useState<CaseCategory | 'all'>('all');
  const [, forceUpdate] = useState(0);

  useDidShow(() => {
    forceUpdate(n => n + 1);
  });

  const stats = useMemo(() => getStats(), [getStats, completedCaseIds.length, wrongCount]);

  const categoryConfig: Array<{ key: CaseCategory | 'all'; icon: string; name: string }> = [
    { key: 'all', icon: '📚', name: '全部病例' },
    { key: 'implant', icon: '🦷', name: '种植' },
    { key: 'orthodontic', icon: '😁', name: '正畸' },
    { key: 'endodontic', icon: '🔬', name: '根管' }
  ];

  const filteredCases = useMemo(() => {
    if (activeCategory === 'all') return mockCases;
    return mockCases.filter(c => c.category === activeCategory);
  }, [activeCategory]);

  const handleStartCase = (caseId: string) => {
    setCurrentCase(caseId);
    Taro.navigateTo({ url: '/pages/quiz/index' });
  };

  const handleGoReview = () => {
    Taro.navigateTo({ url: '/pages/review/index' });
  };

  const handleClearData = () => {
    Taro.showModal({
      title: '确认清除',
      content: '清除后所有学习记录将丢失，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          clearAllData();
          Taro.showToast({ title: '已重置', icon: 'success' });
          forceUpdate(n => n + 1);
        }
      }
    });
  };

  const getCategoryCount = (key: CaseCategory | 'all') => {
    if (key === 'all') return mockCases.length;
    return mockCases.filter(c => c.category === key).length;
  };

  const weaknessCount = Object.values(stats.weaknessDistribution).filter(v => v > 0).length;

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View className={styles.page} style={{ padding: '0 32rpx' }}>
        <View className={styles.header}>
          <View className={styles.headerInner}>
            <View className={styles.badgeRow}>
              <View className={styles.badge}>
                <Text className={styles.badgeText}>🎯 口腔质控训练</Text>
              </View>
              <View className={styles.badge}>
                <Text className={styles.badgeText}>闯关模式</Text>
              </View>
            </View>
            <Text className={styles.title}>你好，临床稽核官</Text>
            <Text className={styles.subtitle}>每一份规范的病历，都是医患双方的护身符</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <StatsCard
            title="已闯关"
            value={stats.completedCases}
            unit={`/ ${stats.totalCases}`}
            icon="🏆"
            color="primary"
          />
          <StatsCard
            title="正确率"
            value={stats.correctRate}
            unit="%"
            icon="✅"
            color="success"
            subText={stats.completedCases === 0 ? '完成首关解锁' : '基于已完成关卡'}
          />
          <StatsCard
            title="薄弱项"
            value={weaknessCount}
            unit="类"
            icon="🔍"
            color="warning"
          />
          <StatsCard
            title="错题数"
            value={stats.wrongCount}
            unit="题"
            icon="📝"
            color="error"
          />
        </View>

        {stats.completedCases > 0 && (
          <View style={{ marginBottom: 32, background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2rpx 12rpx rgba(0,0,0,0.08)' }}>
            <ProgressBar
              current={stats.completedCases}
              total={stats.totalCases}
              color="primary"
              size="md"
            />
          </View>
        )}

        <View className={styles.sectionHeader}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleIcon}>🎮</Text>
            <Text className={styles.sectionTitleText}>病例闯关</Text>
          </View>
          <View className={styles.reviewBtn} onClick={handleGoReview}>
            <Text className={styles.reviewBtnText}>错题复盘</Text>
            <Text className={styles.reviewBtnText}>→</Text>
          </View>
        </View>

        <View className={styles.categoryTabs}>
          {categoryConfig.map(tab => (
            <View
              key={tab.key}
              className={classnames(
                styles.tabItem,
                activeCategory === tab.key && styles.tabItemActive
              )}
              onClick={() => setActiveCategory(tab.key as any)}
            >
              <Text className={styles.tabIcon}>{tab.icon}</Text>
              <Text className={styles.tabName}>{tab.name}</Text>
              <Text className={styles.tabCount}>{getCategoryCount(tab.key)}题</Text>
            </View>
          ))}
        </View>

        {filteredCases.length > 0 ? (
          filteredCases.map(caseItem => (
            <CaseCard
              key={caseItem.id}
              caseData={caseItem}
              isCompleted={completedCaseIds.includes(caseItem.id)}
              onClick={() => handleStartCase(caseItem.id)}
            />
          ))
        ) : (
          <View className={styles.emptyBox}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>
              该分类暂无比病例
            </Text>
          </View>
        )}

        {(stats.completedCases > 0 || stats.wrongCount > 0) && (
          <View className={styles.clearBtn} onClick={handleClearData}>
            <Text className={styles.clearBtnText}>重置所有学习记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
