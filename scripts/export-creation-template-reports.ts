import fs from 'node:fs';
import path from 'node:path';
import {
  CREATION_POSITION_COMBINATIONS,
  calculateCreationTemplateAttributes,
  getCreationTemplateScoutReport,
  type BodyShape,
} from '../src/utils/creationTemplates';
import type { Position } from '../src/types';

const BASE_OVR = 69;
const ALL_COMBINATIONS = CREATION_POSITION_COMBINATIONS;
const SHAPES: Array<[BodyShape, string]> = [
  ['slim', '轻盈'],
  ['balanced', '均衡'],
  ['heavy', '强壮'],
];
const lines = [
  '# 创建球员模板球探报告',
  '',
  `共 42 套创建页可选模板。以下统一使用初始综评 ${BASE_OVR}、无广告加成。实际评级会随玩家创建时的初始综评改变，优缺点也可能随属性调整变化。`,
  '',
  '评级规则：80 及以上 A+（顶级新秀），75–79 A（重点培养），70–74 A-（潜力新秀），70 以下 B+（发展型新秀）。',
  '',
];

let count = 0;
for (const combination of ALL_COMBINATIONS) {
  const [primary, secondary] = combination.split('/') as [Position, Position | undefined];
  lines.push(`## ${combination}`, '');
  for (const [shape, shapeLabel] of SHAPES) {
    const { attributes, initialOvr, template } = calculateCreationTemplateAttributes(primary, secondary ?? null, shape, 0, BASE_OVR);
    const report = getCreationTemplateScoutReport({
      archetype: template.name,
      position: primary,
      secondaryPosition: secondary ?? null,
      ovr: initialOvr,
      attributes,
    });
    if (!report) throw new Error(`缺少球探报告：${combination}/${shape}`);
    lines.push(
      `### ${shapeLabel} · ${template.name}（${report.starName}）`,
      '',
      `- 评级：${report.grade}（${initialOvr} OVR）`,
      `- 核心优点：${report.strengths.join('；')}`,
      `- 需调整与提升：${report.weaknesses.join('；')}`,
      `- 球探描述：${report.scoutComment}`,
      '',
    );
    count += 1;
  }
}

const output = path.resolve('docs/创建球员模板球探报告.md');
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, lines.join('\n'), 'utf8');
console.log(`已导出 ${count} 个模板：${output}`);
