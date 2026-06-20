import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useTraining } from '@/store/TrainingContext';
import { mockCases, weaknessCategoryLabels, caseCategoryLabels } from '@/data/cases';
import { AuditItem, CaseData, AuditItemKey, CaseCategory } from '@/types';
import CategoryTag from '@/components/CategoryTag';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';
import AnalysisPanel from '@/components/AnalysisPanel';
import classnames from 'classnames';

interface SpecialVirtualCase {
  kind: 'special'
  virtualCaseId: string
  title: string
  category: CaseCategory
  patientAge: string
  patientGender: string
  items: Array<{
    idx: number
    caseId: string
    caseTitle: string
    caseCategory: CaseCategory
    auditItemKey: AuditItemKey
    patientAge: string
    patientGender: string
    chiefComplaintRaw: string
    examinationRaw: string
    treatmentPlanRaw: string
    imagingNote: string
    consentNote: string
    auditItem: AuditItem
  }>
  filterLabel: string
}

const QuizPage: React.FC = () => {
  const {
    currentCaseId,
    addWrongRecord,
    setCaseCompleted,
    wrongRecords,
    isSpecialMode,
    specialPractice,
    getCurrentSpecialAuditItems,
    clearSpecialPractice
  } = useTraining();

  const normalCase = useMemo<CaseData | undefined>(() => {
    return mockCases.find(c => c.id === currentCaseId);
  }, [currentCaseId]);

  const specialCase = useMemo<SpecialVirtualCase | null>(() => {
    if (!isSpecialMode || !specialPractice) return null;
    const rawItems = getCurrentSpecialAuditItems();
    const items = rawItems.map((it, idx) => ({
      idx,
      ...it,
      patientAge: it.patientInfo.age,
      patientGender: it.patientInfo.gender,
      chiefComplaintRaw: it.rawMaterials.chiefComplaintRaw,
      examinationRaw: it.rawMaterials.examinationRaw,
      treatmentPlanRaw: it.rawMaterials.treatmentPlanRaw,
      imagingNote: it.rawMaterials.imagingNote,
      consentNote: it.rawMaterials.consentNote,
      auditItem: mockCases.find(c => c.id === it.caseId)!.auditItems.find(a => a.key === it.auditItemKey)!
    }));

    let filterLabel = '';
    const parts: string[] = [];
    if (specialPractice.filterCaseCategory !== 'all') {
      parts.push(caseCategoryLabels[specialPractice.filterCaseCategory]);
    }
    if (specialPractice.filterWeakness !== 'all') {
      parts.push(weaknessCategoryLabels[specialPractice.filterWeakness]);
    }
    if (parts.length > 0) {
      filterLabel = parts.join(' × ');
    } else {
      filterLabel = '薄弱项全科';
    }

    const first = items[0];
    return {
      kind: 'special',
      virtualCaseId: `special-${Date.now()}`,
      title: `专项再练：${filterLabel}（${items.length}题）`,
      category: first ? first.caseCategory : 'implant',
      patientAge: '专项',
      patientGender: '练习',
      items,
      filterLabel
    };
  }, [isSpecialMode, specialPractice, getCurrentSpecialAuditItems]);

  const mode: 'normal' | 'special' = isSpecialMode && specialCase ? 'special' : 'normal';

  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>({});
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AuditItem['analysis'] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [caseCompletedMarked, setCaseCompletedMarked] = useState(false);
  const [sessionMarked, setSessionMarked] = useState(false);

  useEffect(() => {
    if (mode === 'normal' && !normalCase) {
      Taro.showToast({ title: '病例不存在', icon: 'error' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
    if (mode === 'special' && !specialCase) {
      Taro.showToast({ title: '专项练习已失效', icon: 'none' });
      setTimeout(() => Taro.redirectTo({ url: '/pages/review/index' }), 1500);
    }
  }, [mode, normalCase, specialCase]);

  const currentItems = useMemo<Array<{
    key: string
    auditItem: AuditItem
    sourceCaseId: string
    sourceCaseTitle: string
    patientAge: string
    patientGender: string
    chiefComplaintRaw: string
    examinationRaw: string
    treatmentPlanRaw: string
    imagingNote: string
    consentNote: string
  }>>(() => {
    if (mode === 'normal' && normalCase) {
      return normalCase.auditItems.map(it => ({
        key: it.key,
        auditItem: it,
        sourceCaseId: normalCase.id,
        sourceCaseTitle: normalCase.title,
        patientAge: normalCase.patientAge,
        patientGender: normalCase.patientGender,
        chiefComplaintRaw: normalCase.chiefComplaintRaw,
        examinationRaw: normalCase.examinationRaw,
        treatmentPlanRaw: normalCase.treatmentPlanRaw,
        imagingNote: normalCase.imagingNote,
        consentNote: normalCase.consentNote
      }));
    }
    if (mode === 'special' && specialCase) {
      return specialCase.items.map(it => ({
        key: `${it.caseId}-${it.auditItemKey}-${it.idx}`,
        auditItem: it.auditItem,
        sourceCaseId: it.caseId,
        sourceCaseTitle: it.caseTitle,
        patientAge: it.patientAge,
        patientGender: it.patientGender,
        chiefComplaintRaw: it.chiefComplaintRaw,
        examinationRaw: it.examinationRaw,
        treatmentPlanRaw: it.treatmentPlanRaw,
        imagingNote: it.imagingNote,
        consentNote: it.consentNote
      }));
    }
    return [];
  }, [mode, normalCase, specialCase]);

  const answeredCount = Object.values(answers).filter(a => a !== undefined).length;
  const totalItems = currentItems.length;
  const allAnswered = answeredCount === totalItems && totalItems > 0;

  const correctCount = useMemo(() => {
    return currentItems.filter(it => answers[it.key] === it.auditItem.isCompliant).length;
  }, [answers, currentItems]);

  const wrongCount = totalItems - correctCount;
  const score = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;

  const handleAnswer = (itemKey: string, sourceItem: ReturnType<typeof currentItems['find']>, userAnswer: boolean) => {
    if (!sourceItem) return;
    const audit = sourceItem.auditItem;
    const isCorrect = userAnswer === audit.isCompliant;

    setAnswers(prev => {
      if (prev[itemKey] !== undefined) return prev;
      return { ...prev, [itemKey]: userAnswer };
    });

    if (!isCorrect) {
      const existingRecord = wrongRecords.find(
        r => r.caseId === sourceItem.sourceCaseId && r.auditItemKey === audit.key
      );
      if (!existingRecord) {
        addWrongRecord({
          id: `${sourceItem.sourceCaseId}-${audit.key}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          caseId: sourceItem.sourceCaseId,
          caseTitle: sourceItem.sourceCaseTitle,
          category: mockCases.find(c => c.id === sourceItem.sourceCaseId)!.category,
          auditItemKey: audit.key,
          auditItemLabel: audit.label,
          userAnswer,
          correctAnswer: audit.isCompliant,
          weaknessCategory: audit.weaknessCategory,
          analysis: audit.analysis,
          timestamp: Date.now()
        });
      }

      setTimeout(() => {
        setCurrentAnalysis(audit.analysis);
        setShowAnalysis(true);
      }, 200);
    }
  };

  const handleViewAnalysis = (analysis: AuditItem['analysis']) => {
    setCurrentAnalysis(analysis);
    setShowAnalysis(true);
  };

  const handleFinish = () => {
    if (!allAnswered) return;

    if (mode === 'normal' && normalCase && !caseCompletedMarked) {
      setCaseCompleted(normalCase.id, {
        caseId: normalCase.id,
        caseTitle: normalCase.title,
        category: normalCase.category,
        correctCount,
        wrongCount,
        score,
        isSpecial: false
      });
      setCaseCompletedMarked(true);
    }

    if (mode === 'special' && specialCase && !sessionMarked) {
      setCaseCompleted(`special-${specialCase.virtualCaseId}`, {
        caseId: specialCase.virtualCaseId,
        caseTitle: specialCase.title,
        category: specialCase.category,
        correctCount,
        wrongCount,
        score,
        isSpecial: true,
        specialFilters: {
          caseCategory: specialPractice!.filterCaseCategory,
          weakness: specialPractice!.filterWeakness
        }
      });
      setSessionMarked(true);
    }

    setShowResult(true);
  };

  const handleGoReview = () => {
    setShowResult(false);
    if (mode === 'special') {
      clearSpecialPractice();
    }
    Taro.redirectTo({ url: '/pages/review/index' });
  };

  const handleBackHome = () => {
    setShowResult(false);
    if (mode === 'special') {
      clearSpecialPractice();
    }
    if (mode === 'normal') {
      Taro.navigateBack();
    } else {
      Taro.redirectTo({ url: '/pages/review/index' });
    }
  };

  const handleRetry = () => {
    setShowResult(false);
    setAnswers({});
    setCaseCompletedMarked(false);
    setSessionMarked(false);
  };

  if ((mode === 'normal' && !normalCase) || (mode === 'special' && !specialCase)) {
    return null;
  }

  const materialItems = (() => {
    const first = currentItems[0];
    if (!first) return [];
    return [
      { label: '主诉记录', icon: '📋', content: first.chiefComplaintRaw },
      { label: '检查描述', icon: '🔍', content: first.examinationRaw },
      { label: '治疗计划', icon: '📝', content: first.treatmentPlanRaw },
      { label: '影像留存', icon: '🖼️', content: first.imagingNote },
      { label: '知情同意', icon: '✍️', content: first.consentNote }
    ];
  })();

  const headerTitle = mode === 'normal'
    ? normalCase!.title
    : specialCase!.title;
  const headerCategory = mode === 'normal' ? normalCase!.category : specialCase!.category;
  const headerPatient = mode === 'normal'
    ? { gender: normalCase!.patientGender, age: normalCase!.patientAge }
    : { gender: '专项练习', age: `${totalItems}题` };

  return (
    <View className={styles.page}>
      <View className={styles.topProgress}>
        <ProgressBar
          current={answeredCount}
          total={totalItems}
          color="primary"
          size="md"
        />
        {mode === 'special' && (
          <View style={{
            padding: '12rpx 32rpx',
            background: 'linear-gradient(90deg, #FEF3C7, #FDE68A)',
            fontSize: '24rpx',
            color: '#92400E',
            fontWeight: 600
          }}>
            🎯 专项再练：{specialCase!.filterLabel}，共 {totalItems} 道薄弱题
          </View>
        )}
      </View>

      <ScrollView scrollY style={{ height: '100vh' }}>
        <View style={{ padding: '0 32rpx' }}>
          <View className={styles.caseHeader}>
            <View className={styles.caseHeaderTop}>
              <View className={styles.caseTitle}>
                <Text className={styles.caseTitleText}>{headerTitle}</Text>
                <CategoryTag type="case" value={headerCategory} size="sm" />
              </View>
            </View>
            <View className={styles.patientInfo}>
              <View className={styles.patientTag}>
                <Text className={styles.patientTagText}>👤 {headerPatient.gender}</Text>
              </View>
              <View className={styles.patientTag}>
                <Text className={styles.patientTagText}>🎂 {headerPatient.age}</Text>
              </View>
            </View>
          </View>

          {mode === 'normal' && (
            <View className={styles.materialSection}>
              <View className={styles.sectionTitle}>
                <Text className={styles.sectionIcon}>📂</Text>
                <Text className={styles.sectionTitleText}>病例材料</Text>
              </View>
              <View className={styles.materialGrid}>
                {materialItems.map(item => (
                  <View key={item.label} className={styles.materialItem}>
                    <View className={styles.materialLabelBox}>
                      <Text className={styles.materialLabel}>{item.icon} {item.label}</Text>
                    </View>
                    <View className={styles.materialContent}>
                      <Text className={styles.materialText}>{item.content}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View className={styles.auditSection}>
            <View className={styles.auditSectionTitle}>
              <View className={styles.auditSectionIcon}>⚖️</View>
              <Text className={styles.auditSectionText}>
                {mode === 'normal' ? '质控稽核判断' : `专项再练判断（共 ${totalItems} 题）`}
              </Text>
            </View>
            <View className={styles.auditHint}>
              <Text>
                {mode === 'normal'
                  ? '💡 请逐项判断是否符合门诊规范。答错将自动弹出风险解析，答对可手动查看。'
                  : '💡 专项再练：请仔细判断每一题，答错将自动弹出解析，巩固薄弱点。'}
              </Text>
            </View>

            {currentItems.map((it, idx) => {
              const item = it.auditItem;
              const isAnswered = answers[it.key] !== undefined;
              const userAnswer = answers[it.key];
              const isCorrectThis = userAnswer === item.isCompliant;

              return (
                <View key={it.key}>
                  {mode === 'special' && (
                    <View className={styles.specialCaseTag}>
                      <Text className={styles.specialCaseTagText}>
                        来源：{it.sourceCaseTitle}（{caseCategoryLabels[mockCases.find(c => c.id === it.sourceCaseId)!.category]}）
                      </Text>
                    </View>
                  )}
                  <QuestionCard
                    auditItem={item}
                    userAnswer={userAnswer}
                    isAnswered={isAnswered}
                    onAnswer={(ans) => handleAnswer(it.key, it, ans)}
                    index={idx + 1}
                  />
                  {isAnswered && isCorrectThis && (
                    <View
                      className={styles.viewAnalysisBtn}
                      onClick={() => handleViewAnalysis(item.analysis)}
                    >
                      <Text className={styles.viewAnalysisBtnText}>💡 查看风险解析</Text>
                      <Text className={styles.viewAnalysisBtnText}>→</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View className={styles.bottomBar}>
        <View className={styles.summaryRow}>
          <View className={styles.summaryItem}>
            <View className={classnames(styles.summaryDot, styles.dotCorrect)} />
            <Text className={styles.summaryText}>正确</Text>
            <Text className={styles.summaryValue}>{correctCount}</Text>
          </View>
          <View className={styles.summaryItem}>
            <View className={classnames(styles.summaryDot, styles.dotWrong)} />
            <Text className={styles.summaryText}>错误</Text>
            <Text className={styles.summaryValue} style={{ color: '#EF4444' }}>{wrongCount}</Text>
          </View>
          <View className={styles.summaryItem}>
            <View className={classnames(styles.summaryDot, styles.dotPending)} />
            <Text className={styles.summaryText}>待答</Text>
            <Text className={styles.summaryValue}>{totalItems - answeredCount}</Text>
          </View>
        </View>
        <View
          className={classnames(
            styles.finishBtn,
            !allAnswered && styles.finishBtnDisabled
          )}
          onClick={allAnswered ? handleFinish : undefined}
        >
          <Text className={styles.finishBtnText}>
            {allAnswered ? `完成稽核 (得分 ${score}分)` : `还剩 ${totalItems - answeredCount} 项未判断`}
          </Text>
        </View>
      </View>

      {showResult && (
        <View className={styles.resultOverlay} onClick={handleBackHome}>
          <View className={styles.resultPanel} onClick={e => e.stopPropagation()}>
            <View className={classnames(styles.resultIcon, score >= 80 ? styles.resultGood : styles.resultBad)}>
              <Text>{score >= 80 ? '🎉' : '💪'}</Text>
            </View>
            <Text className={styles.resultTitle}>
              {mode === 'special'
                ? (score >= 80 ? '专项再练完成！' : '专项再练继续努力！')
                : (score >= 80 ? '稽核通过！' : score >= 60 ? '继续加油！' : '需要加强练习')}
            </Text>
            <Text className={styles.resultSubtitle}>
              {score >= 80
                ? '对质控规范掌握良好，注意保持细节敏感度'
                : '薄弱项已收录到错题本，建议重点复盘'}
            </Text>
            <View className={styles.resultStats}>
              <View className={styles.resultStatBox}>
                <Text className={styles.resultStatValue}>{score}</Text>
                <Text className={styles.resultStatLabel}>得分</Text>
              </View>
              <View className={styles.resultStatBox}>
                <Text className={classnames(styles.resultStatValue, styles.valueCorrect)}>{correctCount}</Text>
                <Text className={styles.resultStatLabel}>正确</Text>
              </View>
              <View className={styles.resultStatBox}>
                <Text className={classnames(styles.resultStatValue, styles.valueWrong)}>{wrongCount}</Text>
                <Text className={styles.resultStatLabel}>错误</Text>
              </View>
            </View>
            <View className={styles.resultBtns}>
              <View className={classnames(styles.resultBtn, styles.resultBtnPrimary)} onClick={handleGoReview}>
                <Text className={styles.resultBtnTextPrimary}>📖 回到复盘</Text>
              </View>
              {mode === 'special' && wrongCount > 0 && (
                <View className={classnames(styles.resultBtn, styles.resultBtnSecondary)} onClick={handleRetry}>
                  <Text className={styles.resultBtnTextSecondary}>� 再练一遍</Text>
                </View>
              )}
              {mode === 'normal' && wrongCount > 0 && (
                <View className={classnames(styles.resultBtn, styles.resultBtnSecondary)} onClick={handleRetry}>
                  <Text className={styles.resultBtnTextSecondary}>🔄 再练一次</Text>
                </View>
              )}
              <View
                className={classnames(styles.resultBtn, styles.resultBtnSecondary)}
                onClick={handleBackHome}
                style={{ background: '#F1F5F9' }}
              >
                <Text className={styles.resultBtnTextSecondary} style={{ color: '#64748B' }}>
                  {mode === 'special' ? '返回复盘' : '返回首页'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <AnalysisPanel
        analysis={currentAnalysis!}
        visible={showAnalysis && !!currentAnalysis}
        onClose={() => setShowAnalysis(false)}
      />
    </View>
  );
};

export default QuizPage;
