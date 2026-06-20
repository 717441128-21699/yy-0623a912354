import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useTraining } from '@/store/TrainingContext';
import { WeaknessCategory } from '@/types';
import { weaknessCategoryLabels, weaknessCategoryIcons } from '@/data/cases';
import StatsCard from '@/components/StatsCard';
import WrongItemCard from '@/components/WrongItemCard';
import AnalysisPanel from '@/components/AnalysisPanel';
import classnames from 'classnames';
import { AuditItem } from '@/types';

const categoryColors: Record<WeaknessCategory, { bg: string; bar: string }> = {
  medicalRecord: { bg: '#EFF6FF', bar: 'linear-gradient(90deg, #2563EB, #60A5FA)' },
  infectionControl: { bg: '#ECFDF5', bar: 'linear-gradient(90deg, #059669, #34D399)' },
  feeConsistency: { bg: '#FFFBEB', bar: 'linear-gradient(90deg, #D97706, #FBBF24)' },
  followUpManagement: { bg: '#F0FDFA', bar: 'linear-gradient(90deg, #0D9488, #2DD4BF)' }
};

const categoryOrder: WeaknessCategory[] = [
  'medicalRecord',
  'infectionControl',
  'feeConsistency',
  'followUpManagement'
];

const ReviewPage: React.FC = () => {
  const { wrongRecords, getStats, getWrongRecordsByCategory } = useTraining();
  const [activeTab, setActiveTab] = useState<WeaknessCategory | 'all'>('all');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AuditItem['analysis'] | null>(null);

  const stats = useMemo(() => getStats(), [getStats, wrongRecords.length]);
  const totalWrong = wrongRecords.length;
  const maxWrongCount = Math.max(1, ...Object.values(stats.weaknessDistribution));

  const filteredRecords = useMemo(() => {
    if (activeTab === 'all') return wrongRecords;
    return getWrongRecordsByCategory(activeTab);
  }, [activeTab, wrongRecords, getWrongRecordsByCategory]);

  const handleViewAnalysis = (analysis: AuditItem['analysis']) => {
    setCurrentAnalysis(analysis);
    setShowAnalysis(true);
  };

  const handleGoHome = () => {
    Taro.navigateBack();
  };

  const getTeacherAdvice = () => {
    const dist = stats.weaknessDistribution;
    const sorted = categoryOrder
      .map(k => ({ key: k, count: dist[k] }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) return '';

    const topWeakness = sorted[0];
    const adviceMap: Record<WeaknessCategory, string> = {
      medicalRecord: `薄弱项集中在「病历书写」，建议线下跟诊时重点观察带教老师如何规范记录主诉、检查、治疗计划。主诉要涵盖"部位+症状+时间+诉求"四要素，检查描述需具体到数据（如探诊深度、松动度等），治疗计划务必列出备选方案。`,
      infectionControl: `薄弱项集中在「感染控制」，重点关注影像留存规范性和橡皮障使用。切记：种植术前CBCT是强制要求，根管治疗三张片（术前/试尖/术后）是质控标配，橡皮障是根管院感控制的"底线"。`,
      feeConsistency: `薄弱项集中在「收费一致性」，需注意诊断、主诉与收费项目的逻辑一致性。治疗计划中每一项收费都要有对应的适应症说明，高值项目（种植、正畸、全冠）必须单独告知并签字确认。`,
      followUpManagement: `薄弱项集中在「复诊管理」，需加强知情同意的细节把控。专项治疗（种植、正畸、根管）必须签署对应专项知情同意书，青少年治疗需监护人签字，佩戴时长、复诊频率等约束性要求必须书面化。`
    };

    return adviceMap[topWeakness.key];
  };

  const tabs = [
    { key: 'all' as const, icon: '📚', name: '全部' },
    ...categoryOrder.map(k => ({
      key: k as WeaknessCategory,
      icon: weaknessCategoryIcons[k],
      name: weaknessCategoryLabels[k]
    }))
  ];

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View style={{ padding: '0 32rpx' }}>
        <View className={styles.header}>
          <View className={styles.headerInner}>
            <View className={styles.headerBadge}>
              <Text className={styles.headerBadgeText}>📊 学习数据分析</Text>
            </View>
            <Text className={styles.headerTitle}>错题复盘中心</Text>
            <Text className={styles.headerSubtitle}>每一道错题都是进步的阶梯</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <StatsCard
            title="总错题"
            value={totalWrong}
            unit="题"
            icon="📝"
            color="error"
          />
          <StatsCard
            title="薄弱项"
            value={Object.values(stats.weaknessDistribution).filter(v => v > 0).length}
            unit="类"
            icon="⚠️"
            color="warning"
            subText="点击下方查看详情"
          />
        </View>

        <View className={styles.radarSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleIcon}>📡</Text>
            <Text className={styles.sectionTitleText}>薄弱项雷达</Text>
          </View>

          {totalWrong > 0 ? (
            <>
              <View className={styles.radarHint}>
                <Text>👨‍🏫 带教老师视图：根据错题分布，红色高亮项为重点关注方向，建议安排线下跟诊观察。</Text>
              </View>
              <View className={styles.radarList}>
                {categoryOrder.map(key => {
                  const count = stats.weaknessDistribution[key];
                  const percent = Math.round((count / maxWrongCount) * 100);
                  const isWeak = count > 0 && (count / totalWrong) >= 0.25;

                  return (
                    <View
                      key={key}
                      className={classnames(styles.radarItem, isWeak && styles.radarItemWeak)}
                      onClick={() => setActiveTab(key)}
                    >
                      <View
                        className={styles.radarItemIcon}
                        style={{ backgroundColor: categoryColors[key].bg }}
                      >
                        <Text>{weaknessCategoryIcons[key]}</Text>
                      </View>
                      <View className={styles.radarItemContent}>
                        <View className={styles.radarItemTop}>
                          <Text className={styles.radarItemName}>{weaknessCategoryLabels[key]}</Text>
                          <Text className={classnames(styles.radarItemCount, isWeak && styles.weakCount)}>
                            {count}题 {isWeak && ' ⚡需强化'}
                          </Text>
                        </View>
                        <View className={styles.radarBarTrack}>
                          <View
                            className={styles.radarBarFill}
                            style={{
                              width: `${percent}%`,
                              background: categoryColors[key].bar
                            }}
                          />
                        </View>
                        <Text className={styles.radarBarText}>
                          占比 {totalWrong > 0 ? Math.round((count / totalWrong) * 100) : 0}%
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>

              {Object.values(stats.weaknessDistribution).some(v => v > 0) && (
                <View className={styles.teacherTip}>
                  <Text className={styles.teacherTipTitle}>
                    <Text>🎯</Text>
                    <Text>带教老师建议</Text>
                  </Text>
                  <Text className={styles.teacherTipContent}>{getTeacherAdvice()}</Text>
                </View>
              )}
            </>
          ) : (
            <View className={styles.emptyBox} style={{ marginTop: 0, padding: '32rpx' }}>
              <Text className={styles.emptyIcon}>🎯</Text>
              <Text className={styles.emptyTitle}>暂无薄弱项</Text>
              <Text className={styles.emptyText}>完成病例稽核闯关后，这里会显示你的薄弱项分析</Text>
            </View>
          )}
        </View>

        <View className={styles.weaknessSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleIcon}>📖</Text>
            <Text className={styles.sectionTitleText}>错题集</Text>
          </View>

          <View className={styles.tabsRow}>
            {tabs.map(tab => {
              const count = tab.key === 'all'
                ? totalWrong
                : stats.weaknessDistribution[tab.key];

              return (
                <View
                  key={tab.key}
                  className={classnames(styles.tabItem, activeTab === tab.key && styles.tabItemActive)}
                  onClick={() => setActiveTab(tab.key as any)}
                >
                  <Text className={styles.tabIcon}>{tab.icon}</Text>
                  <Text className={styles.tabName}>{tab.name}</Text>
                  <Text className={styles.tabCount}>{count}</Text>
                </View>
              );
            })}
          </View>

          {filteredRecords.length > 0 ? (
            <View className={styles.wrongList}>
              <View className={styles.filterAll}>
                <Text className={styles.filterAllText}>
                  {activeTab === 'all' ? '展示全部错题' : `仅展示「${weaknessCategoryLabels[activeTab as WeaknessCategory]}」分类`}
                </Text>
                <Text className={styles.filterAllValue}>{filteredRecords.length} 条记录</Text>
              </View>

              {filteredRecords.map(record => (
                <WrongItemCard
                  key={record.id}
                  record={record}
                  onViewAnalysis={() => handleViewAnalysis(record.analysis)}
                />
              ))}
            </View>
          ) : (
            <View className={styles.emptyBox}>
              <Text className={styles.emptyIcon}>🎉</Text>
              <Text className={styles.emptyTitle}>太棒了！</Text>
              <Text className={styles.emptyText}>
                {activeTab === 'all'
                  ? '暂无比错题记录，继续保持！完成病例稽核闯关后错题会自动收录到这里。'
                  : `「${weaknessCategoryLabels[activeTab as WeaknessCategory]}」分类暂无错题`}
              </Text>
              <View className={styles.emptyBtn} onClick={handleGoHome}>
                <Text className={styles.emptyBtnText}>🎮 去闯关练习</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <AnalysisPanel
        analysis={currentAnalysis!}
        visible={showAnalysis && !!currentAnalysis}
        onClose={() => setShowAnalysis(false)}
      />
    </ScrollView>
  );
};

export default ReviewPage;
