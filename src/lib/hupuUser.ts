export interface HupuUserInfo {
  islogin?: number;
  puid?: string | null;
  nickname?: string | null;
  avatar?: string | null;
  userHeadUrl?: string | null;
}

export interface PlayerIdentity {
  name: string;
  source: 'hupu' | 'random';
  reason?: string;
}

interface HupuUserInfoResponse {
  code: number;
  message?: string;
  data?: HupuUserInfo | null;
}

declare global {
  interface Window {
    /** CloudBase gateway value injected by the activity host at publish time. */
    ACTIVITY_API_BASE?: string;
    ColorboxAI?: {
      auth?: {
        getUserInfo: () => Promise<HupuUserInfoResponse>;
      };
      storage?: {
        getValue: (key: string) => Promise<unknown>;
        setValue: (value: Record<string, unknown>) => Promise<unknown>;
      };
      cloud?: {
        request: (options: { url: string; method?: string; data?: unknown; envId?: string; auth?: boolean }) => Promise<{ statusCode?: number; code?: number; message?: string; data?: unknown }>;
      };
      oss?: { uploadFile: (options: { file: Blob; filename?: string }) => Promise<{ downloadUrl?: string }> };
      request?: { bbs?: { openPostEditor: (options: { topicId?: string; tagId?: string; topicName?: string; tagName?: string; title?: string; content?: string; imageUrl?: string }) => Promise<{ code?: number; message?: string; schema?: string }> } };
      vatask?: {
        completeRewardVideo?: () => Promise<{ code?: number; message?: string; data?: { rewarded?: boolean } }>;
      };
    };
  }
}

let activeRequest: Promise<HupuUserInfo> | null = null;

const FAMILY_NAMES = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈', '褚', '卫', '蒋', '沈', '韩', '杨', '朱', '秦', '许', '何'];
const GIVEN_NAMES = ['子轩', '浩然', '宇辰', '俊杰', '博文', '嘉豪', '天佑', '晨阳', '明远', '景行', '志远', '承宇', '泽楷', '亦凡', '文昊', '致远', '星河', '凌云', '向阳', '凯旋'];

export function createRandomChineseName(random = Math.random): string {
  const familyName = FAMILY_NAMES[Math.floor(random() * FAMILY_NAMES.length)];
  const givenName = GIVEN_NAMES[Math.floor(random() * GIVEN_NAMES.length)];
  return `${familyName}${givenName}`;
}

/**
 * Hupu capabilities are optional at runtime. Every consumer must provide a
 * browser fallback rather than assuming that ColorboxAI was injected.
 */
export function isHupuAppEnvironment(): boolean {
  return typeof window !== 'undefined' && !!window.ColorboxAI;
}

export function getHupuUserInfo(forceRefresh = false): Promise<HupuUserInfo> {
  if (forceRefresh) activeRequest = null;
  if (activeRequest) return activeRequest;

  activeRequest = (async () => {
    const auth = window.ColorboxAI?.auth;
    if (!auth?.getUserInfo) {
      throw new Error('请在虎扑 App 内打开本游戏后重试');
    }

    const response = await auth.getUserInfo();
    if (response.code !== 200) {
      throw new Error(response.message || '虎扑用户信息获取失败，请稍后重试');
    }
    if (response.data?.islogin !== 1 || !response.data.nickname?.trim()) {
      throw new Error('请先登录虎扑账号，再重新获取昵称');
    }
    return response.data;
  })().catch((error) => {
    activeRequest = null;
    throw error;
  });

  return activeRequest;
}

export async function getPlayerIdentity(
  forceRefresh = false,
  existingFallbackName?: string,
): Promise<PlayerIdentity> {
  try {
    const user = await getHupuUserInfo(forceRefresh);
    return { name: user.nickname!.trim(), source: 'hupu' };
  } catch (error) {
    return {
      name: existingFallbackName || createRandomChineseName(),
      source: 'random',
      reason: error instanceof Error ? error.message : '当前环境无法获取虎扑用户信息',
    };
  }
}
