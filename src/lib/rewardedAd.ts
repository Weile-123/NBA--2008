export async function completeRewardedAd(): Promise<boolean> {
  if (!window.ColorboxAI?.vatask?.completeRewardVideo) {
    console.warn('[激励广告] ColorboxAI.vatask.completeRewardVideo 未注入');
    return false;
  }

  try {
    // Keep the method bound to vatask when it dispatches to the native bridge.
    const result = await window.ColorboxAI.vatask.completeRewardVideo();
    // Different App/WebView versions have returned the status code and reward
    // flag with slightly different primitive types/locations. Normalize those
    // equivalent success responses while still requiring an explicit reward.
    const response = result as unknown as {
      code?: number | string;
      statusCode?: number | string;
      data?: { rewarded?: boolean | number | string; reward?: boolean | number | string };
      rewarded?: boolean | number | string;
      reward?: boolean | number | string;
      message?: string;
    };
    const code = response.code ?? response.statusCode;
    const statusOk = code === 200 || code === '200';
    const rewardFlag = response.data?.rewarded ?? response.data?.reward ?? response.rewarded ?? response.reward;
    const rewarded = statusOk && (rewardFlag === true || rewardFlag === 1 || rewardFlag === 'true' || rewardFlag === '1');
    if (!rewarded) {
      console.warn('[激励广告] 未获得奖励', { code, message: response.message });
    }
    return rewarded;
  } catch (error) {
    console.warn('[激励广告] 调用失败', error);
    return false;
  }
}
