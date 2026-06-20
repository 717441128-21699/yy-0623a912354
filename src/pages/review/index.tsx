import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useTraining } from '@/store/TrainingContext';
import { WeaknessCategory, AuditItem, CaseCategory, FollowUpStatus } from '@/types';
import { weaknessCategoryLabels, weaknessCategoryIcons, caseCategoryLabels, caseCategoryIcons } from '@/data/cases';
import StatsCard from '@/components/StatsCard';
import WrongItemCard from '@/components/WrongItemCard';
import AnalysisPanel from '@/components/AnalysisPanel';
import classnames from 'classnames';
import { calcWeaknessDistribution } from '@/utils';

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

const caseCategoryOrder: CaseCategory[] = ['implant', 'orthodontic', 'endodontic'];

const adviceMap: Record<WeaknessCategory, string> = {
  medicalRecord: `薄弱项集中在「病历书写」，建议线下跟诊时重点观察带教老师如何规范记录主诉、检查、治疗计划。主诉要涵盖"部位+症状+时间+诉求"四要素，检查描述需具体到数据（如探诊深度、松动度等），治疗计划务必列出备选方案。`,
  infectionControl: `薄弱项集中在「感染控制」，重点关注影像留存规范性和橡皮障使用。切记：种植术前CBCT是强制要求，根管治疗三张片（术前/试尖/术后）是质控标配，橡皮障是根管院感控制的"底线"。`,
  feeConsistency: `薄弱项集中在「收费一致性」，需注意诊断、主诉与收费项目的逻辑一致性。治疗计划中每一项收费都要有对应的适应症说明，高值项目（种植、正畸、全冠）必须单独告知并签字确认。`,
  followUpManagement: `薄弱项集中在「复诊管理」，需加强知情同意的细节把控。专项治疗（种植、正畸、根管）必须签署对应专项知情同意书，青少年治疗需监护人签字，佩戴时长、复诊频率等约束性要求必须书面化。`
};

const statusLabelMap: Record<FollowUpStatus, string> = {
  pending: '待安排',
  scheduled: '已安排',
  done: '已完成'
};

const ReviewPage: React.FC = () => {
  const {
    wrongRecords,
    getStats,
    getStatsByStudent,
    getWrongRecordsByStudent,
    isTeacherMode,
    teacherViewMode,
    toggleTeacherMode,
    setTeacherViewMode,
    currentStudentId,
    mockStudents,
    switchStudent,
    getTopWeaknessByStudent,
    getFollowUpTasksByStudent,
    updateFollowUpStatus,
    removeFollowUpTask,
    generateFollowUpTasksForStudent,
    addFollowUpTask
  } = useTraining();

  const [activeTab, setActiveTab] = useState<WeaknessCategory | 'all'>('all');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AuditItem['analysis'] | null>(null);
  const [filterCaseCategory, setFilterCaseCategory] = useState<CaseCategory | 'all'>('all');
  const [filterWeakness, setFilterWeakness] = useState<WeaknessCategory | 'all'>('all');

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

  const filteredByUser = useMemo(() => effectiveWrongRecords, [effectiveWrongRecords]);

  const studentViewFilteredRecords = useMemo(() => {
    return filteredByUser.filter(r => {
      if (filterCaseCategory !== 'all' && r.category !== filterCaseCategory) return false;
      if (filterWeakness !== 'all' && r.weaknessCategory !== filterWeakness) return false;
      return true;
    });
  }, [filteredByUser, filterCaseCategory, filterWeakness]);

  const studentViewStats = useMemo(() => {
    const dist = calcWeaknessDistribution(studentViewFilteredRecords);
    const answered = effectiveStats.completedCases * 5;
    const wrongCount = studentViewFilteredRecords.length;
    const correctCount = Math.max(0, answered - wrongCount);
    return {
      ...effectiveStats,
      wrongCount,
      correctRate: answered > 0 ? Math.round((correctCount / answered) * 100) : 0,
      weaknessDistribution: dist
    };
  }, [studentViewFilteredRecords, effectiveStats]);

  const showFilter = !isTeacherMode;
  const displayRecords = showFilter ? studentViewFilteredRecords : filteredByUser.filter(r => activeTab === 'all' ? true : r.weaknessCategory === activeTab);
  const displayStats = showFilter ? studentViewStats : effectiveStats;
  const totalWrong = displayRecords.length;
  const maxWrongCount = Math.max(1, ...Object.values(displayStats.weaknessDistribution));

  const filteredRecords = useMemo(() => {
    if (isTeacherMode) {
      if (activeTab === 'all') return filteredByUser;
      return filteredByUser.filter(r => r.weaknessCategory === activeTab);
    }
    return displayRecords;
  }, [isTeacherMode, activeTab, filteredByUser, displayRecords]);

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

  const allStudentsWithSelf = useMemo(() => {
    return [
      { id: 'self' as const, name: '我自己', avatar: '😊', title: '本人学习数据' },
      ...mockStudents.map(s => ({ id: s.id, name: s.name, avatar: s.avatar, title: s.title }))
    ];
  }, [mockStudents]);

  const followUpList = getFollowUpCategories(effectiveStats);
  const effectiveStudentTasks = getFollowUpTasksByStudent(
    isTeacherMode ? currentStudentId : 'self'
  );

  const classSummary = useMemo(() => {
    let totalCases = 0;
    let totalWrongs = 0;
    let needFollowUp = 0;
    allStudentsWithSelf.forEach(s => {
      const st = s.id === 'self' ? selfStats : getStatsByStudent(s.id);
      totalCases += st.completedCases;
      totalWrongs += st.wrongCount;
      const w = getTopWeaknessByStudent(s.id);
      if (w) needFollowUp += 1;
    });
    return { totalCases, totalWrongs, needFollowUp, totalStudents: allStudentsWithSelf.length };
  }, [allStudentsWithSelf, selfStats, getStatsByStudent, getTopWeaknessByStudent]);

  const resetFilters = () => {
    setFilterCaseCategory('all');
    setFilterWeakness('all');
  };

  const isFilterActive = filterCaseCategory !== 'all' || filterWeakness !== 'all';

  const handleAddManualTask = (category: WeaknessCategory) => {
    const stuId = isTeacherMode ? currentStudentId : 'self';
    if (!stuId) return;
    addFollowUpTask({
      studentId: stuId,
      category,
      status: 'pending'
    });
    Taro.showToast({ title: '已添加任务', icon: 'success' });
  };

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
            <View className={styles.viewModeSwitch}>
              <View
                className={classnames(styles.viewModeSwitchItem, teacherViewMode === 'overview' && styles.viewModeSwitchItemActive)}
                onClick={() => setTeacherViewMode('overview')}
              >
                <Text>👥 班级总览</Text>
              </View>
              <View
                className={classnames(styles.viewModeSwitchItem, teacherViewMode === 'detail' && styles.viewModeSwitchItemActive)}
                onClick={() => setTeacherViewMode('detail')}
              >
                <Text>🎯 个人分析</Text>
              </View>
            </View>

            {teacherViewMode === 'overview' && (
              <View className={styles.classListSection}>
                <View className={styles.classSummaryBar}>
                  <View className={styles.classSummaryItem}>
                    <Text className={styles.classSummaryValue}>{classSummary.totalStudents}</Text>
                    <Text className={styles.classSummaryLabel}>学员总数</Text>
                  </View>
                  <View className={styles.classSummaryItem}>
                    <Text className={styles.classSummaryValue}>{classSummary.totalCases}</Text>
                    <Text className={styles.classSummaryLabel}>累计闯关</Text>
                  </View>
                  <View className={styles.classSummaryItem}>
                    <Text className={styles.classSummaryValue} style={{ color: '#DC2626' }}>{classSummary.totalWrongs}</Text>
                    <Text className={styles.classSummaryLabel}>错题总数</Text>
                  </View>
                  <View className={styles.classSummaryItem}>
                    <Text className={styles.classSummaryValue} style={{ color: '#EA580C' }}>{classSummary.needFollowUp}</Text>
                    <Text className={styles.classSummaryLabel}>需重点跟诊</Text>
                  </View>
                </View>

                <View className={styles.classOverviewGrid}>
                  {allStudentsWithSelf.map(s => {
                    const st = s.id === 'self' ? selfStats : getStatsByStudent(s.id);
                    const topWeak = getTopWeaknessByStudent(s.id);
                    const tasks = getFollowUpTasksByStudent(s.id);
                    return (
                      <View
                        key={s.id}
                        className={classnames(
                          styles.classStudentCard,
                          currentStudentId === s.id && styles.classStudentCardActive
                        )}
                      >
                        <View className={styles.classStudentCardTop}>
                          <View className={styles.classStudentAvatar}>{s.avatar}</View>
                          <View className={styles.classStudentInfo}>
                            <Text className={styles.classStudentName}>{s.name}</Text>
                            <Text className={styles.classStudentTitle}>{s.title}</Text>
                          </View>
                        </View>

                        <View className={styles.classStudentStats}>
                          <View className={styles.classStudentStatBox}>
                            <Text className={styles.classStudentStatValue}>{st.completedCases}/{st.totalCases}</Text>
                            <Text className={styles.classStudentStatLabel}>完成进度</Text>
                          </View>
                          <View className={styles.classStudentStatBox}>
                            <Text className={styles.classStudentStatValue}>{st.correctRate}%</Text>
                            <Text className={styles.classStudentStatLabel}>正确率</Text>
                          </View>
                          <View className={classnames(styles.classStudentStatBox, st.wrongCount >= 3 && styles.classStudentStatBoxDanger)}>
                            <Text className={styles.classStudentStatValue} style={{ color: st.wrongCount >= 3 ? '#DC2626' : undefined }}>
                              {st.wrongCount}
                            </Text>
                            <Text className={styles.classStudentStatLabel}>错题数</Text>
                          </View>
                        </View>

                        {needFU && topWeak && (
                          <View className={styles.classStudentTopWeak}>
                            <Text className={styles.classStudentWeakIcon}>{weaknessCategoryIcons[topWeak]}</Text>
                            <Text className={styles.classStudentWeakLabel}>最突出薄弱项</Text>
                            <Text className={styles.classStudentWeakValue}>{weaknessCategoryLabels[topWeak]}</Text>
                          </View>
                        )}

                        <View className={styles.classStudentCardFooter}>
                          <Text className={styles.classStudentTaskTip}>
                            {tasks.length > 0 ? `已有 ${tasks.length} 项跟诊安排` : '暂无跟诊安排'}
                          </Text>
                          <View
                            className={styles.classStudentViewBtn}
                            onClick={() => {
                              switchStudent(s.id);
                              setTeacherViewMode('detail');
                            }}
                          >
                            <Text>查看详情 →</Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}

        {(!isTeacherMode || teacherViewMode === 'detail') && (
          <>
            {isTeacherMode && (
              <>
                <View className={styles.sectionTitle}>
                  <Text className={styles.sectionTitleIcon}>👥</Text>
                  <Text className={styles.sectionTitleText}>选择学员</Text>
                </View>
                <View className={styles.studentList}>
                  {allStudentsWithSelf.map(s => {
                    const isActive = s.id === currentStudentId;
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
                  value={effectiveStats.wrongCount}
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

            {!isTeacherMode && (
              <View className={styles.filterSection}>
                <View className={styles.sectionTitle}>
                  <Text className={styles.sectionTitleIcon}>🔎</Text>
                  <Text className={styles.sectionTitleText}>交叉筛选</Text>
                </View>

                <Text className={styles.filterGroupTitle}>按病例类型</Text>
                <View className={styles.filterGroup}>
                  <View
                    className={classnames(styles.filterChip, filterCaseCategory === 'all' && styles.filterChipActive)}
                    onClick={() => setFilterCaseCategory('all')}
                  >
                    <Text>📚 全部</Text>
                  </View>
                  {caseCategoryOrder.map(k => (
                    <View
                      key={k}
                      className={classnames(styles.filterChip, filterCaseCategory === k && styles.filterChipActive)}
                      onClick={() => setFilterCaseCategory(k)}
                    >
                      <Text>{caseCategoryIcons[k]} {caseCategoryLabels[k]}</Text>
                    </View>
                  ))}
                </View>

                <Text className={styles.filterGroupTitle}>按薄弱项</Text>
                <View className={styles.filterGroup}>
                  <View
                    className={classnames(styles.filterChip, filterWeakness === 'all' && styles.filterChipActive)}
                    onClick={() => setFilterWeakness('all')}
                  >
                    <Text>📚 全部</Text>
                  </View>
                  {categoryOrder.map(k => (
                    <View
                      key={k}
                      className={classnames(styles.filterChip, filterWeakness === k && styles.filterChipActive)}
                      onClick={() => setFilterWeakness(k)}
                    >
                      <Text>{weaknessCategoryIcons[k]} {weaknessCategoryLabels[k]}</Text>
                    </View>
                  ))}
                  {isFilterActive && (
                    <View className={styles.filterResetBtn} onClick={resetFilters}>
                      <Text>✕ 重置筛选</Text>
                    </View>
                  )}
                </View>

                {isFilterActive && (
                  <View className={styles.filterAppliedBar}>
                    <Text className={styles.filterAppliedBarText}>
                      当前筛选条件已生效
                    </Text>
                    <Text className={styles.filterAppliedBarCount}>
                      {displayRecords.length} 条记录
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View className={styles.radarSection}>
              <View className={styles.sectionTitle}>
                <Text className={styles.sectionTitleIcon}>📡</Text>
                <Text className={styles.sectionTitleText}>
                  {!isTeacherMode && isFilterActive ? '筛选后薄弱项雷达' : '薄弱项雷达'}
                </Text>
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
                      const count = displayStats.weaknessDistribution[key];
                      const percent = Math.round((count / maxWrongCount) * 100);
                      const isWeak = count > 0 && (count / totalWrong) >= 0.25;

                      return (
                        <View
                          key={key}
                          className={classnames(styles.radarItem, isWeak && styles.radarItemWeak)}
                          onClick={() => {
                            if (isTeacherMode) {
                              setActiveTab(key);
                            } else {
                              setFilterWeakness(key);
                            }
                          }}
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

                  {Object.values(displayStats.weaknessDistribution).some(v => v > 0) && (
                    <View className={styles.teacherTip}>
                      <Text className={styles.teacherTipTitle}>
                        <Text>🎯</Text>
                        <Text>
                          {isTeacherMode ? '带教老师建议' : (isFilterActive ? '筛选后建议' : '自我提升建议')}
                        </Text>
                      </Text>
                      <Text className={styles.teacherTipContent}>{getTeacherAdvice(displayStats)}</Text>
                    </View>
                  )}

                  {isTeacherMode && followUpList.length > 0 && (
                    <View className={styles.followUpBox}>
                      <Text className={styles.followUpTitle}>
                        <Text>📋</Text>
                        <Text>薄弱项对应跟诊方向</Text>
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
                        <Text>薄弱项对应跟诊方向</Text>
                      </Text>
                      <View className={styles.noFollowUp}>
                        <Text>该学员各维度表现均衡，暂无需特殊安排跟诊</Text>
                      </View>
                    </View>
                  )}

                  <View className={styles.followUpPanel}>
                    <View className={styles.followUpPanelHeader}>
                      <View className={styles.followUpPanelTitle}>
                        <Text className={styles.followUpPanelTitleIcon}>🗂️</Text>
                        <Text>
                          {isTeacherMode ? '学员跟诊安排' : '我的学习计划'}
                        </Text>
                      </View>
                      <View
                        className={styles.followUpGenBtn}
                        onClick={() => {
                          const target = isTeacherMode ? currentStudentId : 'self';
                          generateFollowUpTasksForStudent(target);
                          Taro.showToast({ title: '已生成待办', icon: 'success' });
                        }}
                      >
                        <Text>⚡ 一键生成</Text>
                      </View>
                    </View>

                    {effectiveStudentTasks.length > 0 ? (
                      <View className={styles.followUpTaskList}>
                        {effectiveStudentTasks.map(task => (
                          <View
                            key={task.id}
                            className={classnames(
                              styles.followUpTaskItem,
                              task.status === 'scheduled' && styles.followUpTaskItemScheduled,
                              task.status === 'done' && styles.followUpTaskItemDone
                            )}
                          >
                            <View className={styles.followUpTaskIcon}>
                              <Text>{weaknessCategoryIcons[task.category]}</Text>
                            </View>
                            <View className={styles.followUpTaskContent}>
                              <Text className={styles.followUpTaskName}>
                                {weaknessCategoryLabels[task.category]}
                              </Text>
                              <Text className={styles.followUpTaskDesc}>
                                {followUpLabels[task.category]}
                              </Text>
                              <Text className={styles.followUpTaskTime}>
                                创建于 {new Date(task.createdAt).toLocaleDateString()}
                              </Text>
                              <View className={styles.followUpTaskStatusBar}>
                                <View className={classnames(
                                  styles.followUpStatusChip,
                                  task.status === 'pending' && styles.followUpStatusChipPending,
                                  task.status === 'scheduled' && styles.followUpStatusChipScheduled,
                                  task.status === 'done' && styles.followUpStatusChipDone
                                )}>
                                  <Text>{statusLabelMap[task.status]}</Text>
                                </View>
                              </View>
                            </View>
                            <View className={styles.followUpTaskActions}>
                              {task.status === 'pending' && (
                                <View
                                  className={classnames(styles.followUpActionBtn, styles.followUpActionBtnPrimary)}
                                  onClick={() => updateFollowUpStatus(task.id, 'scheduled')}
                                >
                                  <Text>安排</Text>
                                </View>
                              )}
                              {task.status === 'scheduled' && (
                                <View
                                  className={classnames(styles.followUpActionBtn, styles.followUpActionBtnSuccess)}
                                  onClick={() => updateFollowUpStatus(task.id, 'done')}
                                >
                                  <Text>完成</Text>
                                </View>
                              )}
                              <View
                                className={classnames(styles.followUpActionBtn, styles.followUpActionBtnDanger)}
                                onClick={() => removeFollowUpTask(task.id)}
                              >
                                <Text>删除</Text>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className={styles.followUpEmpty}>
                        <Text className={styles.followUpEmptyText}>暂无跟诊安排，点击右上角"一键生成"根据薄弱项自动创建</Text>
                      </View>
                    )}

                    {isTeacherMode && (
                      <View style={{ marginTop: 24 }}>
                        <Text className={styles.filterGroupTitle}>快速追加任务</Text>
                        <View className={styles.filterGroup}>
                          {categoryOrder.map(k => (
                            <View
                              key={k}
                              className={styles.filterChip}
                              onClick={() => handleAddManualTask(k)}
                            >
                              <Text>+ {weaknessCategoryLabels[k]}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </>
              ) : (
                <View className={styles.emptyBox} style={{ marginTop: 0, padding: '32rpx' }}>
                  <Text className={styles.emptyIcon}>🎯</Text>
                  <Text className={styles.emptyTitle}>
                    {isTeacherMode ? (teacherViewMode === 'overview' ? '' : '该学员暂无错题') : '暂无薄弱项'}
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
                  {isTeacherMode ? '学员错题集' : (isFilterActive ? '筛选后错题集' : '我的错题集')}
                </Text>
              </View>

              {isTeacherMode && (
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
              )}

              {filteredRecords.length > 0 ? (
                <View className={styles.wrongList}>
                  <View className={styles.filterAll}>
                    <Text className={styles.filterAllText}>
                      {isTeacherMode
                        ? (activeTab === 'all' ? '展示全部错题' : `仅展示「${weaknessCategoryLabels[activeTab as WeaknessCategory]}」分类`)
                        : (isFilterActive ? '应用筛选条件展示' : '展示全部错题')}
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
                    {isTeacherMode
                      ? (activeTab === 'all'
                          ? '该学员暂无比错题记录'
                          : `「${weaknessCategoryLabels[activeTab as WeaknessCategory]}」分类暂无错题`)
                      : (isFilterActive
                          ? '筛选条件下暂无错题，试试调整筛选条件'
                          : '暂无比错题记录，继续保持！完成病例稽核闯关后错题会自动收录到这里。')}
                  </Text>
                  {!isTeacherMode && !isFilterActive && (
                    <View className={styles.emptyBtn} onClick={handleGoHome}>
                      <Text className={styles.emptyBtnText}>🎮 去闯关练习</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </>
        )}
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
