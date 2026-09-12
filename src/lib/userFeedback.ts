import activity from '../../activity.json';

const FEEDBACK_CONFIG = Object.freeze({
  apiBase: 'https://feedback-public-d8fnf79rd0e395c3-1252166086.ap-shanghai.app.tcloudbase.com/api',
  envId: 'feedback-public-d8fnf79rd0e395c3',
  applicationId: activity.activityId,
});

type FeedbackResponse = {
  statusCode?: number;
  code?: number;
  message?: string;
  data?: unknown;
};

export function feedbackContentLength(value: string): number {
  return Array.from(value.trim()).length;
}

export async function submitUserFeedback(rawContent: string): Promise<void> {
  const content = rawContent.trim();
  const length = feedbackContentLength(content);

  if (length < 1 || length > 2000) {
    throw new Error('请输入 1–2000 个字符的反馈内容');
  }
  if (!/^app_[0-9a-f]{10}$/.test(FEEDBACK_CONFIG.applicationId)) {
    throw new Error('反馈功能配置异常，请稍后再试');
  }

  if (!window.ColorboxAI?.auth?.getUserInfo || !window.ColorboxAI?.cloud?.request) {
    throw new Error('请在虎扑 App 内登录后提交反馈');
  }

  const userInfo = await window.ColorboxAI.auth.getUserInfo();
  if (userInfo.code !== 200 || !userInfo.data || userInfo.data.islogin !== 1) {
    throw new Error('请先登录虎扑账号后再提交反馈');
  }

  const nickname = typeof userInfo.data.nickname === 'string' ? userInfo.data.nickname.trim() : '';
  const avatar = typeof userInfo.data.avatar === 'string' ? userInfo.data.avatar.trim() : '';
  const userHeadUrl = typeof userInfo.data.userHeadUrl === 'string' ? userInfo.data.userHeadUrl.trim() : '';
  const avatarUrl = avatar || userHeadUrl;
  const data: Record<string, string> = {
    applicationId: FEEDBACK_CONFIG.applicationId,
    content,
  };
  if (nickname) data.nickname = nickname;
  if (avatarUrl.startsWith('https://')) data.avatarUrl = avatarUrl;

  const response = await window.ColorboxAI!.cloud!.request({
    url: `${FEEDBACK_CONFIG.apiBase}/feedback`,
    method: 'POST',
    data,
    envId: FEEDBACK_CONFIG.envId,
    auth: true,
  }) as FeedbackResponse;

  if (response.statusCode === 201 && response.code === 0) return;
  if (response.statusCode === 401) throw new Error('登录状态已失效，请重新登录后提交');
  if (response.statusCode === 413) throw new Error('反馈内容过长，请精简后提交');
  if (response.statusCode === 429) throw new Error('提交过于频繁，请稍后再试');
  if (response.statusCode === 400) throw new Error(response.message || '反馈内容不符合要求');
  throw new Error('提交结果暂不确定，请稍后确认未成功后再试');
}
