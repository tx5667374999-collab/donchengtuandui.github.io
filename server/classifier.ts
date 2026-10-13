import { FeedbackCategory, FeedbackPriority } from '../src/types/feedback';

interface ClassificationResult {
  category: FeedbackCategory;
  priority: FeedbackPriority;
  autoTags: string[];
}

export function classifyFeedback(subject: string, content: string): ClassificationResult {
  const text = `${subject} ${content}`.toLowerCase();
  const autoTags: string[] = [];

  let category: FeedbackCategory = '其他问题';
  let priority: FeedbackPriority = '普通';

  // 1. Check for Payment / Recharging issues (Highest immediate priority)
  const paymentKeywords = ['充值', '扣款', '扣费', '没到账', '退款', '未到账', '点券', '钻石', '购买失败', '订单', '付款', '支付宝', '微信支付', '苹果内购', '支付异常'];
  const hasPayment = paymentKeywords.some((kw) => text.includes(kw));
  if (hasPayment || subject.includes('充值')) {
    category = '充值问题';
    priority = '紧急';
    autoTags.push('涉及财产');
    if (text.includes('未到账') || text.includes('没到账')) {
      autoTags.push('充值掉单');
    }
  }

  // 2. Check for Account Security issues
  const securityKeywords = ['盗号', '改密', '密码被改', '异地登录', '被盗', '解绑', '换绑', '账号被封', '申诉', '封号', '恶意绑定', '手机号失效'];
  const hasSecurity = securityKeywords.some((kw) => text.includes(kw));
  if (!hasPayment && (hasSecurity || subject.includes('安全') || subject.includes('账号'))) {
    category = '账号安全';
    priority = '高';
    autoTags.push('账号风险');
  }

  // 3. Check for Cheat / Violation / Toxic Report
  const reportKeywords = ['外挂', '透视', '自瞄', '加速器', '脚本', '作弊', '骂人', '侮辱', '涉黄', '诈骗', '违规', '恶意送人头', '演员', '假赛', '辱骂', '妈', '去你妈'];
  const hasReport = reportKeywords.some((kw) => text.includes(kw));
  if (!hasPayment && !hasSecurity && (hasReport || subject.includes('违规') || subject.includes('举报'))) {
    category = '举报违规';
    if (text.includes('外挂') || text.includes('透视') || text.includes('自瞄') || text.includes('脚本')) {
      priority = '高';
      autoTags.push('疑似外挂/作弊');
    } else if (text.includes('辱骂') || text.includes('骂人') || text.includes('妈')) {
      priority = '中';
      autoTags.push('不当言论/辱骂');
    } else {
      priority = '中';
      autoTags.push('违规举报');
    }
  }

  // 4. Check for Bug / Crash / Glitch
  const bugKeywords = ['bug', '卡死', '闪退', '黑屏', '白屏', '报错', '穿模', '卡住', '异常', '掉帧', '报错代码', '技能失效', '任务卡住', '无响应', '崩溃'];
  const hasBug = bugKeywords.some((kw) => text.includes(kw));
  if (!hasPayment && !hasSecurity && !hasReport && (hasBug || subject.includes('bug') || subject.includes('Bug') || subject.includes('故障'))) {
    category = 'Bug反馈';
    if (text.includes('闪退') || text.includes('崩溃') || text.includes('黑屏') || text.includes('卡死')) {
      priority = '高';
      autoTags.push('客户端闪退/崩溃');
    } else if (text.includes('穿模') || text.includes('显示异常')) {
      priority = '普通';
      autoTags.push('表现层异常');
    } else {
      priority = '中';
      autoTags.push('游戏逻辑异常');
    }
  }

  // 5. Check for Network / Latency issues
  const netKeywords = ['卡顿', '延迟高', '460', '跳ping', '掉线', '断线', '服务器连不上', '无法连接'];
  const hasNet = netKeywords.some((kw) => text.includes(kw));
  if (category === '其他问题' && (hasNet || subject.includes('网络') || subject.includes('性能'))) {
    category = '网络/性能';
    priority = '中';
    autoTags.push('网络波动');
  }

  // 6. Check for Game Suggestions / Proposals
  const suggestionKeywords = ['建议', '希望', '优化', '期望', '玩法建议', '平衡性', '新英雄', '新皮肤', 'ui优化', '界面改进'];
  const hasSuggestion = suggestionKeywords.some((kw) => text.includes(kw));
  if (category === '其他问题' && (hasSuggestion || subject.includes('建议') || subject.includes('想法'))) {
    category = '游戏建议';
    priority = '普通';
    autoTags.push('玩法体验优化');
  }

  // If still fallback, match with standard subject selection
  if (category === '其他问题') {
    if (subject.includes('举报') || subject.includes('违规')) category = '举报违规';
    else if (subject.includes('Bug') || subject.includes('bug')) category = 'Bug反馈';
    else if (subject.includes('充值')) category = '充值问题';
    else if (subject.includes('建议')) category = '游戏建议';
    else if (subject.includes('安全')) category = '账号安全';
    autoTags.push('常规反馈');
  }

  return { category, priority, autoTags };
}
