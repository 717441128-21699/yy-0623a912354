import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useTraining } from '@/store/TrainingContext';
import { mockCases } from '@/data/cases';
import { AuditItem, CaseData, AuditItemKey } from '@/types';
import CategoryTag from '@/components/CategoryTag';
import ProgressBar from '@/components/ProgressBar';
import QuestionCard from '@/components/QuestionCard';
import AnalysisPanel from '@/components/AnalysisPanel';
import classnames from 'classnames';

const QuizPage: React.FC = () => {
  const router = useRouter();
  const { currentCaseId, addWrongRecord, setCaseCompleted, wrongRecords } = useTraining();

  const caseData = useMemo<CaseData | undefined>(() => {
    return mockCases.find(c => c.id === currentCaseId);
  }, [currentCaseId]);

  const [answers, setAnswers] = useState<Record<AuditItemKey, boolean | undefined>>({
    chiefComplaint: undefined,
    examination: undefined,
    treatmentPlan: undefined,
    imaging: undefined,
    informedConsent: undefined
  });

  const [showAnalysis, setShowAnalysis] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<AuditItem['analysis'] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [caseCompletedMarked, setCaseCompletedMarked] = useState(false);
  const [lastAnsweredCorrect, setLastAnsweredCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    if (!caseData) {
      Taro.showToast({ title: '病例不存在', icon: 'error' });
      setTimeout(() => Taro.navigateBack(), 1500);
    }
  }, [caseData]);

  const answeredCount = Object.values(answers).filter(a => a !== undefined).length;
  const totalItems = caseData?.auditItems.length || 5;
  const allAnswered = answeredCount === totalItems;

  const correctCount = useMemo(() => {
    if (!caseData) return 0;
    return caseData.auditItems.filter(item => answers[item.key] === item.isCompliant).length;
  }, [answers, caseData]);

  const wrongCount = totalItems - correctCount;
  const score = totalItems > 0 ? Math.round((correctCount / totalItems) * 100) : 0;

  const handleAnswer = (item: AuditItem, userAnswer: boolean) => {
    const isCorrect = userAnswer === item.isCompliant;
    setLastAnsweredCorrect(isCorrect);

    setAnswers(prev => {
      if (prev[item.key] !== undefined) return prev;
      return { ...prev, [item.key]: userAnswer };
    });

    if (!isCorrect) {
      const existingRecord = wrongRecords.find(
        r => r.caseId === caseData!.id && r.auditItemKey === item.key
      );

      if (!existingRecord) {
        addWrongRecord({
          id: `${caseData!.id}-${item.key}-${Date.now()}`,
          caseId: caseData!.id,
          caseTitle: caseData!.title,
          category: caseData!.category,
          auditItemKey: item.key,
          auditItemLabel: item.label,
          userAnswer,
          correctAnswer: item.isCompliant,
          weaknessCategory: item.weaknessCategory,
          analysis: item.analysis,
          timestamp: Date.now()
        });
      }

      setTimeout(() => {
        setCurrentAnalysis(item.analysis);
        setShowAnalysis(true);
      }, 200);
    }
  };

  const handleViewAnalysis = (analysis: AuditItem['analysis']) => {
    setCurrentAnalysis(analysis);
    setShowAnalysis(true);
  };

  const handleFinish = () => {
    if (!allAnswered || !caseData) return;

    if (!caseCompletedMarked) {
      setCaseCompleted(caseData.id);
      setCaseCompletedMarked(true);
    }
    setShowResult(true);
  };

  const handleGoReview = () => {
    setShowResult(false);
    Taro.redirectTo({ url: '/pages/review/index' });
  };

  const handleBackHome = () => {
    setShowResult(false);
    Taro.navigateBack();
  };

  const handleRetry = () => {
    setShowResult(false);
    setAnswers({
      chiefComplaint: undefined,
      examination: undefined,
      treatmentPlan: undefined,
      imaging: undefined,
      informedConsent: undefined
    });
    setCaseCompletedMarked(false);
    setLastAnsweredCorrect(null);
  };

  if (!caseData) return null;

  const materialItems = [
    { label: '主诉记录', icon: '📋', content: caseData.chiefComplaintRaw },
    { label: '检查描述', icon: '🔍', content: caseData.examinationRaw },
    { label: '治疗计划', icon: '📝', content: caseData.treatmentPlanRaw },
    { label: '影像留存', icon: '🖼️', content: caseData.imagingNote },
    { label: '知情同意', icon: '✍️', content: caseData.consentNote }
  ];

  return (
    <View className={styles.page}>
      <View className={styles.topProgress}>
        <ProgressBar
          current={answeredCount}
          total={totalItems}
          color="primary"
          size="md"
        />
      </View>

      <ScrollView scrollY style={{ height: '100vh' }}>
        <View style={{ padding: '0 32rpx' }}>
          <View className={styles.caseHeader}>
            <View className={styles.caseHeaderTop}>
              <View className={styles.caseTitle}>
                <Text className={styles.caseTitleText}>{caseData.title}</Text>
                <CategoryTag type="case" value={caseData.category} size="sm" />
              </View>
            </View>
            <View className={styles.patientInfo}>
              <View className={styles.patientTag}>
                <Text className={styles.patientTagText}>👤 {caseData.patientGender}</Text>
              </View>
              <View className={styles.patientTag}>
                <Text className={styles.patientTagText}>🎂 {caseData.patientAge}</Text>
              </View>
            </View>
          </View>

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

          <View className={styles.auditSection}>
            <View className={styles.auditSectionTitle}>
              <View className={styles.auditSectionIcon}>⚖️</View>
              <Text className={styles.auditSectionText}>质控稽核判断</Text>
            </View>
            <View className={styles.auditHint}>
              <Text>💡 请逐项判断是否符合门诊规范。答错将自动弹出风险解析，答对可手动查看。</Text>
            </View>

            {caseData.auditItems.map((item, idx) => {
              const isAnswered = answers[item.key] !== undefined;
              const userAnswer = answers[item.key];
              const isCorrectThis = userAnswer === item.isCompliant;

              return (
                <View key={item.key}>
                  <QuestionCard
                    auditItem={item}
                    userAnswer={userAnswer}
                    isAnswered={isAnswered}
                    onAnswer={(ans) => handleAnswer(item, ans)}
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
              {score >= 80 ? '稽核通过！' : score >= 60 ? '继续加油！' : '需要加强练习'}
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
              {wrongCount > 0 && (
                <View className={classnames(styles.resultBtn, styles.resultBtnPrimary)} onClick={handleGoReview}>
                  <Text className={styles.resultBtnTextPrimary}>📖 去错题复盘</Text>
                </View>
              )}
              <View className={classnames(styles.resultBtn, styles.resultBtnSecondary)} onClick={handleRetry}>
                <Text className={styles.resultBtnTextSecondary}>🔄 再练一次</Text>
              </View>
              <View
                className={classnames(styles.resultBtn, styles.resultBtnSecondary)}
                onClick={handleBackHome}
                style={{ background: '#F1F5F9' }}
              >
                <Text className={styles.resultBtnTextSecondary} style={{ color: '#64748B' }}>返回首页</Text>
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
