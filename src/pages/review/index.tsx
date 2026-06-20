import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useTraining } from '@/store/TrainingContext';
import { WeaknessCategory, AuditItem } from '@/types';
import { weaknessCategoryLabels, weaknessCategoryIcons } from '@/data/cases';
import StatsCard from '@/components/StatsCard';
import WrongItemCard from '@/components/WrongItemCard';
import AnalysisPanel from '@/components/AnalysisPanel';
import classnames from 'classnames';

const categoryColors: Record<WeaknessCategory, { bg: string; bar: string }> = {
  medicalRecord: { bg: '#EFF6FF', bar: 'linear-gradient(90deg, #2563EB, #60A5FA)' },
  infectionControl: { bg: '#ECFDF5', bar: 'linear-gradient(90deg, #059669, #34D399)' },
  feeConsistency: { bg: '#FFFBEB', bar: 'linear-gradient(90deg, #D97706, #FBBF24)' },
  followUpManagement: { bg: '#F0FDFA', bar: 'linear-gradient(90deg, #0D9488, #2DD4BF)' }
};

const followUpLabels: Record<WeaknessCategory, string> = {
  medicalRecord: '安排病历书写专项跟诊，观察主诉、检查、治疗计划的规范记录流程',
  infectionControl: '安排感染控制观察日，重点关注影像留存、橡皮障使用与消毒流程',
  feeConsistency: '安排收费核对跟诊，强调诊断-治疗-收费逻辑一致性与告知流程',
  followUpManagement: '安排复诊管理观察，熟悉知情同意书签署与复诊提醒流程'
};

const categoryOrder: WeaknessCategory[] = [
  'medicalRecord',
  'infectionControl',
  'feeConsistency',
  'followUpManagement'
];

const adviceMap: Record<WeaknessCategory, string> = {
  medicalRecord: `薄弱项集中在「病历书写」，建议线下跟诊时重点观察带教老师如何规范记录主诉、检查、治疗计划。主诉要涵盖"部位+症状+时间+诉求"四要素，检查描述需具体到数据（如探诊深度、松动度等），治疗计划务必列出备选方案。`,
  infectionControl: `薄弱项集中在「感染控制」，重点关注影像留存规范性和橡皮障使用。切记：种植术前CBCT是强制要求，根管治疗三张片（术前/试尖/术后）是质控标配，橡皮障是根管院感控制的"底线"。`,
  feeConsistency: `薄弱项集中在「收费一致性」，需注意诊断、主诉与收费项目的逻辑一致性。治疗计划中每一项收费都要有对应的适应症说明，高值项目（种植、正畸、全冠）必须单独告知并签字确认。`,
  followUpManagement: `薄弱项集中在「复诊管理」，需加强知情同意的细节把控。专项治疗（种植、正畸、根管）必须签署对应专项知情同意书，青少年治疗需监护人签字，佩戴时长、复诊频率等约束性要求必须书面化。`
};

const ReviewPage: React.FC = () => {
  const {
    wrongRecords,
    getStats,
    getStatsByStudent,
    getWrongRecordsByCategory,
    getWrongRecordsByStudent,
    isTeacherMode,
    toggleTeacherMode,
    currentStudentId,
    mockStudents,
    switchStudent
  } = useTraining();

  const [activeTab, setActiveTab] = useState<WeaknessCategory | 'all'>('all');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AuditItem['analysis'] | null>(null);

  const selfStats = useMemo(() => getStats(), [getStats, wrongRecords.length]);
  const selfWrong = wrongRecords;

  const effectiveStats = useMemo(() => {
    if (!isTeacherMode || currentStudentId === 'self') return selfStats;
    return getStatsByStudent(currentStudentId);
  }, [isTeacherMode, currentStudentId, selfStats, getStatsByStudent]);

  const effectiveWrongRecords = useMemo(() => {
    if (!isTeacherMode || currentStudentId === 'self') return selfWrong;
    return getWrongRecordsByStudent(currentStudentId);
  }, [isTeacherMode, currentStudentId, selfWrong, getWrongRecordsByStudent]);

  const totalWrong = effectiveWrongRecords.length;
  const maxWrongCount = Math.max(1, ...Object.values(effectiveStats.weaknessDistribution));

  const filteredRecords = useMemo(() => {
    const all = effectiveWrongRecords;
    if (activeTab === 'all') return all;
    return all.filter(r => r.weaknessCategory === activeTab);
  }, [activeTab, effectiveWrongRecords]);

  const handleViewAnalysis = (analysis: AuditItem['analysis']) => {
    setCurrentAnalysis(analysis);
    setShowAnalysis(true);
  };

  const handleGoHome = () => {
    Taro.navigateBack();
  };

  const getTeacherAdvice = (statsFor: typeof effectiveStats) => {
    const dist = statsFor.weaknessDistribution;
    const sorted = categoryOrder
      .map(k => ({ key: k, count: dist[k] }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count);

    if (sorted.length === 0) return '';
    return adviceMap[sorted[0].key];
  };

  const getFollowUpCategories = (statsFor: typeof effectiveStats): WeaknessCategory[] => {
    const total = Object.values(statsFor.weaknessDistribution).reduce((a, b) => a + b, 0);
    if (total === 0) return [];
    return categoryOrder.filter(k => {
      const count = statsFor.weaknessDistribution[k];
      return count > 0 && count / total >= 0.25;
    });
  };

  const tabs = [
    { key: 'all' as const, icon: '📚', name: '全部' },
    ...categoryOrder.map(k => ({
      key: k as WeaknessCategory,
      icon: weaknessCategoryIcons[k],
      name: weaknessCategoryLabels[k]
    }))
  ];

  const allStudents = useMemo(() => {
    return [
      { id: 'self', name: '我自己', avatar: '😊', title: '本人学习数据' },
      ...mockStudents.map(s => ({ id: s.id, name: s.name, avatar: s.avatar, title: s.title }))
    ];
  }, [mockStudents]);

  const followUpList = getFollowUpCategories(effectiveStats);

  return (
    <ScrollView scrollY className={styles.page} style={{ height: '100vh' }}>
      <View style={{ padding: '0 32rpx' }}>
        <View className={styles.header}>
          <View className={styles.headerInner}>
            <View className={styles.headerBadge}>
              <Text className={styles.headerBadgeText}>📊 学习数据分析</Text>
            </View>

            <View className={styles.modeSwitch}>
              <View
                className={classnames(styles.modeSwitchItem, !isTeacherMode && styles.modeSwitchItemActive)}
                onClick={() => { if (isTeacherMode) toggleTeacherMode(); }}
              >
                <Text>👤 学员视角</Text>
              </View>
              <View
                className={classnames(styles.modeSwitchItem, isTeacherMode && styles.modeSwitchItemActive)}
                onClick={() => { if (!isTeacherMode) toggleTeacherMode(); }}
              >
                <Text>👨‍🏫 带教老师</Text>
              </View>
            </View>

            <Text className={styles.headerTitle}>
              {isTeacherMode ? '学员错题复盘中心' : '我的错题复盘中心'}
            </Text>
            <Text className={styles.headerSubtitle}>
              {isTeacherMode
                ? '切换学员查看薄弱项分布，安排针对性跟诊'
                : '每一道错题都是进步的阶梯'}
            </Text>
          </View>
        </View>

        {isTeacherMode && (
          <>
            <View className={styles.sectionTitle}>
              <Text className={styles.sectionTitleIcon}>👥</Text>
              <Text className={styles.sectionTitleText}>选择学员</Text>
            </View>
            <View className={styles.studentList}>
              {allStudents.map(s => {
                const isActive = (s.id === 'self' && currentStudentId === 'self') || s.id === currentStudentId;
                return (
                  <View
                    key={s.id}
                    className={classnames(styles.studentItem, isActive && styles.studentItemActive)}
                    onClick={() => switchStudent(s.id)}
                  >
                    <View className={styles.studentAvatar}>{s.avatar}</View>
                    <Text className={styles.studentName}>{s.name}</Text>
                    <Text className={styles.studentTitle}>{s.title}</Text>
                  </View>
                );
              })}
            </View>

            <View className={styles.studentStatsBar}>
              <View className={styles.studentStatBox}>
                <Text className={styles.studentStatValue}>{effectiveStats.completedCases}</Text>
                <Text className={styles.studentStatLabel}>已完成病例</Text>
              </View>
              <View className={styles.studentStatBox}>
                <Text className={styles.studentStatValue}>{effectiveStats.correctRate}%</Text>
                <Text className={styles.studentStatLabel}>正确率</Text>
              </View>
              <View className={styles.studentStatBox}>
                <Text className={styles.studentStatValue} style={{ color: '#EF4444' }}>
                  {effectiveStats.wrongCount}
                </Text>
                <Text className={styles.studentStatLabel}>错题总数</Text>
              </View>
            </View>
          </>
        )}

        {!isTeacherMode && (
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
              value={Object.values(effectiveStats.weaknessDistribution).filter(v => v > 0).length}
              unit="类"
              icon="⚠️"
              color="warning"
              subText="点击下方查看详情"
            />
          </View>
        )}

        <View className={styles.radarSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleIcon}>📡</Text>
            <Text className={styles.sectionTitleText}>薄弱项雷达</Text>
          </View>

          {totalWrong > 0 ? (
            <>
              <View className={styles.radarHint}>
                <Text>
                  {isTeacherMode
                    ? '👨‍🏫 带教老师视图：红色高亮项为重点关注方向，下方已自动生成跟诊安排建议。'
                    : '👨‍🏫 带教老师提示：红色高亮项为重点关注方向，建议安排线下跟诊观察。'}
                </Text>
              </View>
              <View className={styles.radarList}>
                {categoryOrder.map(key => {
                  const count = effectiveStats.weaknessDistribution[key];
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

              {Object.values(effectiveStats.weaknessDistribution).some(v => v > 0) && (
                <View className={styles.teacherTip}>
                  <Text className={styles.teacherTipTitle}>
                    <Text>🎯</Text>
                    <Text>{isTeacherMode ? '带教老师建议' : '自我提升建议'}</Text>
                  </Text>
                  <Text className={styles.teacherTipContent}>{getTeacherAdvice(effectiveStats)}</Text>
                </View>
              )}

              {isTeacherMode && followUpList.length > 0 && (
                <View className={styles.followUpBox}>
                  <Text className={styles.followUpTitle}>
                    <Text>📋</Text>
                    <Text>跟诊安排建议</Text>
                  </Text>
                  <View className={styles.followUpList}>
                    {followUpList.map(k => (
                      <View key={k} className={styles.followUpItem}>
                        <View className={styles.followUpIcon}>
                          <Text>{weaknessCategoryIcons[k]}</Text>
                        </View>
                        <Text className={styles.followUpText}>{followUpLabels[k]}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {isTeacherMode && followUpList.length === 0 && (
                <View className={styles.followUpBox}>
                  <Text className={styles.followUpTitle}>
                    <Text>📋</Text>
                    <Text>跟诊安排建议</Text>
                  </Text>
                  <View className={styles.noFollowUp}>
                    <Text>该学员各维度表现均衡，暂无需特殊安排跟诊</Text>
                  </View>
                </View>
              )}
            </>
          ) : (
            <View className={styles.emptyBox} style={{ marginTop: 0, padding: '32rpx' }}>
              <Text className={styles.emptyIcon}>🎯</Text>
              <Text className={styles.emptyTitle}>
                {isTeacherMode ? '该学员暂无错题' : '暂无薄弱项'}
              </Text>
              <Text className={styles.emptyText}>
                {isTeacherMode
                  ? '该学员还未产生错题记录'
                  : '完成病例稽核闯关后，这里会显示薄弱项分析'}
              </Text>
            </View>
          )}
        </View>

        <View className={styles.weaknessSection}>
          <View className={styles.sectionTitle}>
            <Text className={styles.sectionTitleIcon}>📖</Text>
            <Text className={styles.sectionTitleText}>
              {isTeacherMode ? '学员错题集' : '我的错题集'}
            </Text>
          </View>

          <View className={styles.tabsRow}>
            {tabs.map(tab => {
              const count = tab.key === 'all'
                ? totalWrong
                : effectiveStats.weaknessDistribution[tab.key];

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
                  ? (isTeacherMode
                      ? '该学员暂无比错题记录'
                      : '暂无比错题记录，继续保持！完成病例稽核闯关后错题会自动收录到这里。')
                  : `「${weaknessCategoryLabels[activeTab as WeaknessCategory]}」分类暂无错题`}
              </Text>
              {!isTeacherMode && (
                <View className={styles.emptyBtn} onClick={handleGoHome}>
                  <Text className={styles.emptyBtnText}>🎮 去闯关练习</Text>
                </View>
              )}
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
