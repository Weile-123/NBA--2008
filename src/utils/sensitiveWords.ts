// Sensitive word filter utility for player name validation

const SENSITIVE_WORDS = [
  'admin', 'administrator', 'system', 'root', 'moderator',
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'nigger',
  '傻逼', '草泥马', '操你妈', '日你妈', '逼', '婊子', '狗娘养',
  '法轮功', '藏独', '台独', '疆独', '达赖',
  '外围', '赌博', '办证', '代孕', '枪支', '毒品', '大麻', '冰毒',
  '色情', '黄片', '嫖娼', '兼职妹', '裸聊'
];

export interface SensitiveValidationResult {
  isValid: boolean;
  errorMsg?: string;
  matchedWord?: string;
}

export function validateSensitiveName(name: string): SensitiveValidationResult {
  if (!name || !name.trim()) {
    return { isValid: false, errorMsg: '姓名不能为空' };
  }

  const normalized = name.toLowerCase().replace(/\s+/g, '');
  
  for (const word of SENSITIVE_WORDS) {
    if (normalized.includes(word.toLowerCase())) {
      return {
        isValid: false,
        errorMsg: `包含敏感或违规词汇，请修改后重试`,
        matchedWord: word,
      };
    }
  }

  return { isValid: true };
}
