import { CaseData } from '@/types'

export const mockCases: CaseData[] = [
  {
    id: 'implant-001',
    title: '左下后牙缺失种植修复',
    category: 'implant',
    difficulty: 2,
    patientAge: '45岁',
    patientGender: '男',
    chiefComplaintRaw: '左下后牙缺失3月余，要求修复。',
    examinationRaw: '口内检查：36、37缺失，牙槽嵴丰满，黏膜正常。邻牙无松动，对颌牙无伸长。张口度正常。',
    treatmentPlanRaw: '1. CBCT评估骨量 2. 36、37区植入种植体 3. 术后3月行冠修复',
    imagingNote: '已拍摄全景片，未见CBCT检查记录。',
    consentNote: '患者签署一般治疗同意书，未见种植专项知情同意书。',
    auditItems: [
      {
        key: 'chiefComplaint',
        label: '主诉记录',
        description: '主诉应包含部位、症状、持续时间、诉求四要素',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '主诉记录规范',
          content: '本例主诉完整包含了部位（左下后牙）、症状（缺失）、持续时间（3月余）、诉求（要求修复）。',
          scenario: '若主诉只写"种牙"不写时间，患者日后可反咬"医生没问清楚就急着做"，引发修复时机争议。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'examination',
        label: '检查描述',
        description: '检查记录应包含口内、口外、影像学三部分',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '检查描述规范',
          content: '本例记录了缺牙区、邻牙、对颌牙、张口度等关键指标，描述具体。',
          scenario: '曾有案例因只写"缺牙"未记录邻牙松动度，种植后邻牙脱落被患者归咎于手术。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'treatmentPlan',
        label: '治疗计划',
        description: '治疗计划应包含备选方案和风险提示',
        isCompliant: false,
        defectDetail: '仅列种植方案，未提及固定桥、活动义齿等备选方案，也未标注骨量不足时的备选（植骨）。',
        analysis: {
          riskType: 'dispute',
          title: '治疗计划缺少备选方案风险',
          content: '根据《病历书写规范》，治疗计划必须列出所有可行方案供患者知情选择。本例仅列种植方案，违反知情选择权。',
          scenario: '患者种植后因骨结合失败需植骨，翻查病历发现从未提及备选方案，被认定为"强制推荐高价治疗"，被判全额退费+赔偿。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'imaging',
        label: '影像留存',
        description: '种植术前必须留存CBCT，测量骨高度、骨宽度、神经管位置',
        isCompliant: false,
        defectDetail: '仅拍摄全景片，缺少CBCT三维影像记录，无法评估种植区精确骨量及神经管位置。',
        analysis: {
          riskType: 'insurance',
          title: '种植术前缺少CBCT风险',
          content: '根据《口腔种植技术管理规范》，种植术前必须行CBCT检查并进行三维测量。全景片无法提供骨宽度及颊舌向神经管信息。',
          scenario: '某地医保飞行检查中，23例种植病历因术前无CBCT被拒付，医院被罚款12万元，涉事医生被扣当月绩效。'
        },
        weaknessCategory: 'infectionControl'
      },
      {
        key: 'informedConsent',
        label: '知情同意',
        description: '种植治疗需签署专项知情同意书，含风险、费用、备选方案',
        isCompliant: false,
        defectDetail: '仅签署通用治疗同意书，缺少种植专项知情同意（手术风险、植骨可能、失败率、费用明细等）。',
        analysis: {
          riskType: 'dispute',
          title: '缺少种植专项知情同意风险',
          content: '《医疗纠纷预防和处理条例》明确要求，特殊治疗需单独知情同意。种植属于有创高值项目，必须专项告知。',
          scenario: '患者术后下唇麻木3个月，鉴定为神经损伤。因无专项知情同意书，法院推定医院未履行告知义务，判赔18万元。'
        },
        weaknessCategory: 'followUpManagement'
      }
    ]
  },
  {
    id: 'implant-002',
    title: '右上单颗牙即刻种植',
    category: 'implant',
    difficulty: 3,
    patientAge: '38岁',
    patientGender: '女',
    chiefComplaintRaw: '右上牙疼痛1周，要求治疗。',
    examinationRaw: '16残根，叩(+)，松II度，牙龈红肿。CBCT示16根尖阴影5x6mm，骨高度约10mm。',
    treatmentPlanRaw: '1. 16拔除即刻种植 2. 延期修复 3. 费用约1.5万',
    imagingNote: 'CBCT、根尖片均留存完整，标注清晰。',
    consentNote: '已签署种植专项知情同意书，内容含即刻种植风险、植骨可能、费用。',
    auditItems: [
      {
        key: 'chiefComplaint',
        label: '主诉记录',
        description: '主诉应清晰反映主要诉求，且与后续治疗逻辑一致',
        isCompliant: false,
        defectDetail: '主诉写"疼痛1周要求治疗"，但实际行拔除+即刻种植，主诉未体现拔牙或种植诉求，逻辑不一致。',
        analysis: {
          riskType: 'fee',
          title: '主诉与治疗不一致的收费风险',
          content: '主诉为"牙痛治疗"，实际收取种植费1.5万。医保审查会判定为"诊断与收费不符"，涉嫌分解收费或诱导消费。',
          scenario: '某诊所被举报"治牙痛收种牙费"，医保局核查发现主诉与实际收费项目严重不符，按欺诈骗保处理，退回全部费用并罚款3倍。'
        },
        weaknessCategory: 'feeConsistency'
      },
      {
        key: 'examination',
        label: '检查描述',
        description: '即刻种植应额外记录牙周条件、咬合关系、种植体方向预估',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '即刻种植检查规范',
          content: '本例记录了患牙状态、CBCT三维测量、根尖情况，符合即刻种植术前检查要求。',
          scenario: '即刻种植因检查不全面致种植体穿通上颌窦的案例屡见不鲜，完整的术前影像记录是医生的"护身符"。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'treatmentPlan',
        label: '治疗计划',
        description: '即刻种植需注明可行性判断依据及备选方案',
        isCompliant: false,
        defectDetail: '未说明为何选择"即刻种植"而非"延期种植"，未写即刻种植的适应症判断依据（骨壁完整度、感染控制等）。',
        analysis: {
          riskType: 'dispute',
          title: '即刻种植未记录适应症依据',
          content: '即刻种植有严格适应症（根尖无急性感染、骨壁至少4壁完整等），计划中必须写明选择依据，否则属"超适应症治疗"。',
          scenario: '患者即刻种植后感染，取出种植体。鉴定专家指出病历中无即刻种植适应症判断记录，推定医生"盲目追求高收费项目"，医院担责70%。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'imaging',
        label: '影像留存',
        description: '即刻种植需留存术前、术中（可选）、术后影像比对',
        isCompliant: true,
        analysis: {
          riskType: 'insurance',
          title: '影像留存完整',
          content: '本例CBCT和根尖片齐备，标注清晰，是种植病历规范性的体现。',
          scenario: '医保飞检中，影像缺失是种植病历最高频缺陷（占比约42%），也是最容易被拒付的原因之一。'
        },
        weaknessCategory: 'infectionControl'
      },
      {
        key: 'informedConsent',
        label: '知情同意',
        description: '知情同意应包含费用明细及各方案费用对比',
        isCompliant: true,
        analysis: {
          riskType: 'fee',
          title: '知情同意规范',
          content: '本例种植专项同意书内容完整，涵盖了风险、费用、备选方案，有效保护医患双方权益。',
          scenario: '"同意书就是免责书"是误解，但完整的知情同意确实能降低80%以上因"未告知"导致的败诉风险。'
        },
        weaknessCategory: 'followUpManagement'
      }
    ]
  },
  {
    id: 'orthodontic-001',
    title: '青少年牙列拥挤固定矫治',
    category: 'orthodontic',
    difficulty: 1,
    patientAge: '14岁',
    patientGender: '女',
    chiefComplaintRaw: '牙齿不齐，要求矫正。',
    examinationRaw: '恒牙列，安氏I类，牙列拥挤约8mm。磨牙关系中性，覆合覆盖正常。侧貌直面型。',
    treatmentPlanRaw: '1. 全口直丝弓矫治 2. 减数14、24、34、44 3. 疗程约2年 4. 费用2.5万',
    imagingNote: '头颅侧位片、全景片、口内照、面像齐全，模型已灌制。',
    consentNote: '患者母亲签署正畸知情同意书，含减数方案、风险、费用、保持器要求。',
    auditItems: [
      {
        key: 'chiefComplaint',
        label: '主诉记录',
        description: '正畸主诉应注明患者本人诉求或家长诉求',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '主诉记录规范',
          content: '本例主诉简洁明确，与正畸治疗目的一致，记录有效。',
          scenario: '青少年正畸纠纷中约30%涉及"孩子不想做是家长逼的"，主诉注明诉求主体有助于厘清责任。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'examination',
        label: '检查描述',
        description: '正畸检查应含：牙列、咬合、骨骼、软组织、影像学五项',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '正畸检查规范',
          content: '本例涵盖了安氏分类、拥挤度、磨牙关系、覆合覆盖、侧貌分析，检查较全面。',
          scenario: '若检查不记录覆合深度，正畸后出现牙根吸收，医生无法证明治疗前不存在异常，易败诉。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'treatmentPlan',
        label: '治疗计划',
        description: '减数正畸应说明减数理由及非减数方案对比',
        isCompliant: false,
        defectDetail: '直接列出减数4个4，但未说明"为何必须减数"，也未对比扩弓、片切等非减数方案的优劣。',
        analysis: {
          riskType: 'dispute',
          title: '减数正畸未记录理由风险',
          content: '拔牙矫治属于不可逆治疗，计划中必须写明减数适应症（拥挤度、骨量不调等）及非减数方案的局限性。',
          scenario: '患者矫治后嫌嘴瘪，起诉"医生拔错牙"。鉴定发现病历无任何减数适应症分析记录，法院采信"过度治疗"主张，判赔22万元。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'imaging',
        label: '影像留存',
        description: '正畸标准影像为"一正一侧一口内照+面像+模型"',
        isCompliant: true,
        analysis: {
          riskType: 'insurance',
          title: '正畸影像留存规范',
          content: '本例资料齐备，正畸治疗资料保存是整个疗程结束后仍需保留的重要凭证。',
          scenario: '根据《医疗机构管理条例》，正畸病历资料应至少保存至患者满18岁后15年，影像缺失在医疗诉讼中100%对医方不利。'
        },
        weaknessCategory: 'infectionControl'
      },
      {
        key: 'informedConsent',
        label: '知情同意',
        description: '青少年正畸知情同意书必须有监护人签字',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '青少年正畸知情同意规范',
          content: '本例由母亲（监护人）签署，且同意书内容完整，符合《未成年人保护法》相关要求。',
          scenario: '某诊所因让13岁患者自己签字，被认定知情同意无效，发生纠纷后虽治疗无过错，仍因程序瑕疵承担20%赔偿责任。'
        },
        weaknessCategory: 'followUpManagement'
      }
    ]
  },
  {
    id: 'orthodontic-002',
    title: '成人隐形矫治龅牙前突',
    category: 'orthodontic',
    difficulty: 2,
    patientAge: '27岁',
    patientGender: '女',
    chiefComplaintRaw: '龅牙，想做隐形矫正。',
    examinationRaw: '安氏II类1分类，骨性轻度前突，覆盖6mm，凸面型。牙周情况良好。',
    treatmentPlanRaw: '隐适美隐形矫治，拔除14、24，内收前牙，疗程18个月。',
    imagingNote: '影像资料齐全，但未见牙周探诊深度记录及洁治记录。',
    consentNote: '签署隐形矫治同意书，但未见附件粘接、片切、种植钉支抗等告知项目。',
    auditItems: [
      {
        key: 'chiefComplaint',
        label: '主诉记录',
        description: '主诉应反映治疗期望（美观/功能）',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '主诉记录规范',
          content: '本例主诉明确指向美观诉求，与隐形矫治定位一致。',
          scenario: '美观诉求越高，术后"不满意"风险越大。主诉中记录期望方向有助于设置合理预期。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'examination',
        label: '检查描述',
        description: '成人正畸必须包含牙周基础检查（探诊深度、出血指数）',
        isCompliant: false,
        defectDetail: '仅写"牙周良好"，未记录具体探诊深度、出血指数，也未见治疗前洁治记录。成人正畸前牙周评估是强制要求。',
        analysis: {
          riskType: 'dispute',
          title: '成人正畸缺少牙周评估风险',
          content: '25岁以上患者牙周病患病率超过60%，正畸前必须行牙周检查并记录具体数据。"牙周良好"不等于检查到位。',
          scenario: '成人隐形矫治10个月后牙齿松动II度，检查发现正畸前即有深牙周袋但无记录。法院认定医方未行必要检查，判赔后续植牙费用12万元。'
        },
        weaknessCategory: 'infectionControl'
      },
      {
        key: 'treatmentPlan',
        label: '治疗计划',
        description: '隐形矫治应说明附件使用、IPR、支抗等关键操作',
        isCompliant: false,
        defectDetail: '计划过于简略，未提及是否需要附件粘接、片切（IPR）、种植钉支抗等操作，也未说明拔除后间隙关闭方式。',
        analysis: {
          riskType: 'fee',
          title: '隐形矫治计划不详细的收费争议',
          content: '隐形矫治常出现"基础费用+附加操作"的二次收费情况，治疗计划必须事先列明全部操作项及对应费用。',
          scenario: '患者治疗中被告知需加4颗种植钉另收8千元，认为"收费不透明"投诉至12315。因计划中未提及，诊所被迫免费实施。'
        },
        weaknessCategory: 'feeConsistency'
      },
      {
        key: 'imaging',
        label: '影像留存',
        description: '隐形矫治还需留存数字口扫STL文件路径',
        isCompliant: false,
        defectDetail: '传统影像齐全，但隐形矫治必须的数字口扫数据、ClinCheck方案版本号、牙移动模拟视频等电子资料未记录存档位置。',
        analysis: {
          riskType: 'dispute',
          title: '隐形矫治数字资料缺失风险',
          content: '隐形矫治的核心资料是数字方案而非传统影像。ClinCheck版本号、迭代次数、口扫STL文件必须存档并记录可追溯路径。',
          scenario: '患者投诉"矫治效果与承诺不符"，要求对比原始方案。医方无法提供ClinCheck方案原始文件，因举证不能承担不利后果。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'informedConsent',
        label: '知情同意',
        description: '隐形矫治需单独告知：不配合佩戴的后果、附加操作、保持器要求',
        isCompliant: false,
        defectDetail: '同意书未包含：附件粘接的牙面损伤风险、片切后的龋齿风险、佩戴时长不足（<22h/天）的后果、种植钉支抗的额外创伤等内容。',
        analysis: {
          riskType: 'dispute',
          title: '隐形矫治知情同意缺项风险',
          content: '隐形矫治"看似简单"实则细节繁多，每一项附加操作都有对应风险，必须逐一告知并确认签字。',
          scenario: '患者每日仅戴牙套12小时，疗程结束效果极差。因知情同意书未写佩戴时长要求及后果，法院不采信"患者不配合"抗辩。'
        },
        weaknessCategory: 'followUpManagement'
      }
    ]
  },
  {
    id: 'endodontic-001',
    title: '牙髓炎根管治疗',
    category: 'endodontic',
    difficulty: 1,
    patientAge: '32岁',
    patientGender: '男',
    chiefComplaintRaw: '右下后牙自发痛、夜间痛3天，伴冷热刺激加剧。',
    examinationRaw: '46合面深龋近髓，探痛(+)，叩(±)，冷热刺激痛持续10秒以上。牙龈未见窦道。',
    treatmentPlanRaw: '46 RCT + 全冠修复。RCT费用1800元，全冠费用2500元起。',
    imagingNote: '术前根尖片可见46深龋及髓，根尖周膜略增宽。术中、术后片未拍摄。',
    consentNote: '患者签署根管治疗知情同意书，含疼痛、肿胀、断针等常见并发症。',
    auditItems: [
      {
        key: 'chiefComplaint',
        label: '主诉记录',
        description: '主诉应包含症状的典型特征，支持后续诊断',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '主诉记录规范',
          content: '本例主诉含自发痛、夜间痛、冷热刺激加剧等牙髓炎典型三联征，诊断依据充分。',
          scenario: '若主诉只写"牙痛"，根管治疗后患者称"我只是补牙你为什么杀我神经"，医生将难以举证诊断依据。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'examination',
        label: '检查描述',
        description: '牙髓检查必须包含活力测试结果',
        isCompliant: false,
        defectDetail: '描述了冷热刺激反应，但缺少明确的牙髓活力测试（电髓仪或冷测/热测的量化记录），也未记录牙髓诊断结论（如"急性化脓性牙髓炎"）。',
        analysis: {
          riskType: 'dispute',
          title: '牙髓活力未记录导致诊断争议',
          content: '仅凭"冷热刺激痛"不等同于规范的牙髓活力测试，必须记录使用的测试方法（冷测/电测）及具体结果。',
          scenario: '患者根管后3个月因咬合痛再次就诊，认为当初不该杀神经。病历中无牙髓活力测试记录，鉴定专家无法确认治疗前牙髓状态，医方承担举证不利责任。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'treatmentPlan',
        label: '治疗计划',
        description: '根管治疗应说明替代方案（如拔除+修复），并与冠修复分开告知费用',
        isCompliant: false,
        defectDetail: '未告知患牙拔除后种植/固定桥等替代方案。RCT与全冠费用合并叙述，可能让患者误解为"打包价"。',
        analysis: {
          riskType: 'fee',
          title: '治疗方案未告知替代方案的收费争议',
          content: '高值修复项目（全冠）必须独立告知费用和必要性，不得与基础治疗打包叙述，更不能缺失拔除等保守选择。',
          scenario: '患者缴费时发现全冠比RCT还贵，称"以为4300全包"。因计划未明确分开标价，诊所被要求仅收RCT费用，全冠项目患者自行放弃。'
        },
        weaknessCategory: 'feeConsistency'
      },
      {
        key: 'imaging',
        label: '影像留存',
        description: '根管治疗标准为术前、术中（根充片/试尖片）、术后三张片',
        isCompliant: false,
        defectDetail: '仅存术前片，缺少试尖片（验证主尖长度）和术后根充片（评估充填质量），无法证明根管治疗质量符合规范。',
        analysis: {
          riskType: 'insurance',
          title: '根管影像缺失的医保拒付与纠纷风险',
          content: '根据《牙体牙髓病诊疗规范》，根管治疗至少需术前+术后2张片，建议加试尖片共3张。无影像=无质控证据。',
          scenario: '某市医保2024年专项检查中，根管治疗项目因影像不全拒付率高达68%，平均每张病历被追回费用1200元。患者后续出问题维权时，无片医方100%败诉。'
        },
        weaknessCategory: 'infectionControl'
      },
      {
        key: 'informedConsent',
        label: '知情同意',
        description: '根管治疗知情同意还应包含：冠修复必要性、可能的复诊次数、失败后处理',
        isCompliant: false,
        defectDetail: '仅列常见并发症，未提及：①RCT后建议冠修复的原因及不做冠的后果（牙折） ②可能需2-3次复诊 ③失败后可能需根尖手术或拔除。',
        analysis: {
          riskType: 'dispute',
          title: '根管知情同意缺项的常见纠纷',
          content: '根管治疗后牙折是最高发纠纷类型（占根管纠纷的45%），必须提前告知冠修复的必要性，让患者理解"为什么补完牙还得做牙套"。',
          scenario: '患者拒绝冠修复，半年后患牙咬硬物纵折拔除。因知情同意书中未强调"不做冠易折裂"，患者起诉"医生没提醒"，法院判赔该牙种植费用的50%。'
        },
        weaknessCategory: 'followUpManagement'
      }
    ]
  },
  {
    id: 'endodontic-002',
    title: '后牙再根管治疗+橡皮障使用',
    category: 'endodontic',
    difficulty: 3,
    patientAge: '52岁',
    patientGender: '女',
    chiefComplaintRaw: '右上后牙反复起脓包半年，要求重做。',
    examinationRaw: '16原RCT后，叩(+)，颊侧窦道口，PD约5-7mm。根尖片示原根充欠填，根尖阴影8x10mm。',
    treatmentPlanRaw: '16再根管治疗，费用2500元。建议显微根管，附加费用另计。',
    imagingNote: '术前片、原RCT影像均有留存，诊断依据明确。未见橡皮障使用记录。',
    consentNote: '签署再治疗同意书，含失败可能、根尖手术备选。无橡皮障费用告知记录。',
    auditItems: [
      {
        key: 'chiefComplaint',
        label: '主诉记录',
        description: '再治疗主诉应包含既往治疗史',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '主诉记录规范',
          content: '"要求重做"清晰反映了再治疗诉求，窦道口描述也与慢性根尖周炎症状一致。',
          scenario: '再治疗纠纷中常见"不知道之前做过根管"的扯皮，主诉中体现重做意图很关键。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'examination',
        label: '检查描述',
        description: '再根管应评估：原根充质量、牙周状态、牙体剩余量、咬合情况',
        isCompliant: true,
        analysis: {
          riskType: 'dispute',
          title: '再根管检查规范',
          content: '本例记录了根充欠填、牙周探诊深度、根尖阴影范围，为再治疗方案选择提供了依据。',
          scenario: '不评估牙周条件就贸然再根管，可能出现"根管做好了但牙因牙周病拔掉"的尴尬，患者必然投诉"白花冤枉钱"。'
        },
        weaknessCategory: 'medicalRecord'
      },
      {
        key: 'treatmentPlan',
        label: '治疗计划',
        description: '再治疗应对比根尖手术、拔除+种植等方案的性价比',
        isCompliant: false,
        defectDetail: '仅列再根管费用，但未对比根尖手术费用、拔除+种植费用及其预后差异。"附加费用另计"过于模糊，不符合明码标价要求。',
        analysis: {
          riskType: 'fee',
          title: '再治疗费用未明确的投诉风险',
          content: '《价格法》要求服务项目必须明码标价。"附加费用另计"属于不规范标价，可能被认定为价格欺诈。',
          scenario: '患者被收取2500元基础费+3000元显微费+800元取断针费，总计6300元。因"附加费用另计"过于模糊，市监局责令退还超出2500元部分。'
        },
        weaknessCategory: 'feeConsistency'
      },
      {
        key: 'imaging',
        label: '影像留存',
        description: '根管治疗强制使用橡皮障，需记录使用情况',
        isCompliant: false,
        defectDetail: '无橡皮障使用记录。根据《口腔诊疗器械消毒技术操作规范》及多数地区质控标准，根管治疗必须使用橡皮障隔离术区。',
        analysis: {
          riskType: 'infectionControl',
          title: '根管治疗未用橡皮障的感染控制风险',
          content: '橡皮障是根管治疗质量和院感控制的"标配"，能隔绝唾液污染，降低交叉感染风险。无橡皮障记录=质控不合格。',
          scenario: '某区院感专项检查中，12家机构因根管未常规使用橡皮障被警告，其中3家被通报批评并限期整改，纳入重点监管名单。'
        },
        weaknessCategory: 'infectionControl'
      },
      {
        key: 'informedConsent',
        label: '知情同意',
        description: '橡皮障等额外收费项目必须单独告知并签字确认',
        isCompliant: false,
        defectDetail: '橡皮障使用费、显微根管附加费、可能的取断针费用等均未在知情同意书中单独列明并确认。',
        analysis: {
          riskType: 'fee',
          title: '附加收费项目未单独告知风险',
          content: '橡皮障、显微镜、MTA、取断针等都属于"增值收费项"，必须逐项告知并签字，不能默认包含在基础费用中。',
          scenario: '某诊所被患者投诉"做根管被多收了好几百块的莫名其妙费用"，因橡皮障、显微镜收费未单独签字确认，被消协调解全额退还该部分费用。'
        },
        weaknessCategory: 'feeConsistency'
      }
    ]
  }
]

export const caseCategoryLabels: Record<string, string> = {
  implant: '种植病例',
  orthodontic: '正畸病例',
  endodontic: '根管治疗病例'
}

export const weaknessCategoryLabels: Record<string, string> = {
  medicalRecord: '病历书写',
  infectionControl: '感染控制',
  feeConsistency: '收费一致性',
  followUpManagement: '复诊管理'
}

export const weaknessCategoryIcons: Record<string, string> = {
  medicalRecord: '📝',
  infectionControl: '🧤',
  feeConsistency: '💰',
  followUpManagement: '📅'
}

export const caseCategoryIcons: Record<string, string> = {
  implant: '🦷',
  orthodontic: '😁',
  endodontic: '🔬'
}

export const clinicSceneLabels: Record<string, string> = {
  comprehensive: '综合门诊',
  implant: '种植门诊',
  orthodontic: '正畸门诊',
  endodontic: '牙体牙髓',
  pediatric: '儿科门诊',
  surgery: '外科门诊'
}
