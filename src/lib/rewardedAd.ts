export async function completeRewardedAd(): Promise<boolean> {
  if (!window.ColorboxAI?.vatask?.completeRewardVideo) {
    console.warn('[激励广告] ColorboxAI.vatask.completeRewardVideo 未注入');
    return false;
  }

  try {
    // Keep the method bound to vatask when it dispatches to the native bridge.
    const result = await window.ColorboxAI.vatask.completeRewardVideo();
    const rewarded = result.code === 200 && result.data?.rewarded === true;
    if (!rewarded) {
      console.warn('[激励广告] 未获得奖励', { code: result.code, message: result.message });
    }
    return rewarded;
  } catch (error) {
    console.warn('[激励广告] 调用失败', error);
    return false;
  }
}
