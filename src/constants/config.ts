/**
 * Centralized branding and configuration constants for the "未完" novel chat prototype.
 * Modify these values to re-brand the product across all views.
 */

export const APP_CONFIG = {
  name: "未完",
  tagline: "故事从这里继续",
  version: "0.1.0-prototype",
  visitorNickname: "林初",
  badgeText: "界面原型预览 · 模拟输出",
  
  // Default values for story creation demo
  defaultExample: {
    characterName: "沈砚",
    setting:
      "沈砚是海边旧书店的店主，话不多，记性很好。我叫林初，是回乡整理外婆遗物的插画师。我们小时候认识，十年没有联系。故事发生在一个多雨的小城，节奏慢，偏日常和细腻的关系发展。开场是我拿着一本没有署名的旧日记，推开他的书店门。请以沈砚和环境描写推动故事，不替我决定行动。",
  },

  // Color tokens referenced throughout the app
  colors: {
    pageBgLight: "#F5F6F9",
    surfaceLight: "#FFFFFF",
    textMainLight: "#202736",
    textMutedLight: "#6A7382",
    brandPrimary: "#625177",
    borderLight: "#E0E3EB",
  },
} as const;
