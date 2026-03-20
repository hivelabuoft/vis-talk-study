// src/public/.../trials.ts
//
// Dynamic block for ONE issue at a time.
// - Uses customParameters.issueId to select which issue this block should run.
// - Reads congruentIssues from a prior "setter" component's reactive answer.
// - Emits exactly 5 phase components for that issue, then returns null.
// - Counts progress by looking at answers keys that include BOTH "stimulus" and the issueId.

import type { JumpFunctionParameters, JumpFunctionReturnVal } from '../../../store/types';

// ---------- Edit these in one place ----------
const ISSUES = [
  {
    issueId: 'gun' as const,
    proposition:
      'Gun ownership should be more strictly regulated in the United States to reduce violent crime.',
    proImagePath: '!stage-2/assets/issue_stimuli/gun_pro.png',
    conImagePath: '!stage-2/assets/issue_stimuli/gun_con.png',
  },
  {
    issueId: 'mil' as const,
    proposition:
      'The United States Government should increase its military budget to protect national security.',
    proImagePath: '!stage-2/assets/issue_stimuli/mil_pro.png',
    conImagePath: '!stage-2/assets/issue_stimuli/mil_con.png',
  },
  {
    issueId: 'trump' as const,
    proposition: 'I approve of the way Donald Trump is handling his job as President.',
    proImagePath: '!stage-2/assets/issue_stimuli/trump_pro.png',
    conImagePath: '!stage-2/assets/issue_stimuli/trump_con.png',
  },
  {
    issueId: 'immig' as const,
    proposition:
      'Immigration in the United States should be more strictly regulated to reduce the number of undocumented immigrants.',
    proImagePath: '!stage-2/assets/issue_stimuli/immig_pro.png',
    conImagePath: '!stage-2/assets/issue_stimuli/immig_con.png',
  },
];

const PHASES = [
  'stimulus-view-chart',
  'stimulus-pre-words',
  'stimulus-getready',
  'stimulus-record',
  'stimulus-post-words',
] as const;

// Belief matrix location
const BELIEF_COMPONENT = 'belief-questionnaire';
const BELIEF_MATRIX_ID = 'belief-matrix';

// ---------- Types ----------
type IssueId = (typeof ISSUES)[number]['issueId'];
type PhaseComponentId = (typeof PHASES)[number];
type Stance = 'agree' | 'disagree';
type BeliefMatrix = string[] | Record<string, unknown>;

type Params = {
  issueId: IssueId;
};

// ---------- Helpers ----------
function normalizeImagePath(p: string): string {
  if (!p) return p;
  return p.startsWith('/') ? p.slice(1) : p;
}

function parseStanceFromLabel(label: unknown): Stance | null {
  if (typeof label !== 'string') return null;

  if (label === 'Strongly Agree' || label === 'Agree' || label === 'Slightly Agree') return 'agree';
  if (label === 'Strongly Disagree' || label === 'Disagree' || label === 'Slightly Disagree') return 'disagree';

  return null;
}

function readBeliefMatrixFromEntry(entry: any): BeliefMatrix | undefined {
  const fromAnswerField = entry?.answer?.[BELIEF_MATRIX_ID];
  if (Array.isArray(fromAnswerField)) return fromAnswerField;
  if (fromAnswerField && typeof fromAnswerField === 'object') return fromAnswerField;

  const fromTopLevel = entry?.[BELIEF_MATRIX_ID];
  if (Array.isArray(fromTopLevel)) return fromTopLevel;
  if (fromTopLevel && typeof fromTopLevel === 'object') return fromTopLevel;

  return undefined;
}

function getBeliefMatrix(answers: any): BeliefMatrix | undefined {
  const allAnswers = answers as Record<string, any> | undefined;
  if (!allAnswers || typeof allAnswers !== 'object') return undefined;

  const candidateKeys = Object.keys(allAnswers).filter(
    (key) => key === BELIEF_COMPONENT || key.startsWith(`${BELIEF_COMPONENT}_`),
  );

  for (let i = candidateKeys.length - 1; i >= 0; i -= 1) {
    const matrix = readBeliefMatrixFromEntry(allAnswers[candidateKeys[i]]);
    if (!matrix) continue;
    if (Array.isArray(matrix) && matrix.length === 0) continue;
    if (!Array.isArray(matrix) && Object.keys(matrix).length === 0) continue;
    return matrix;
  }

  return undefined;
}

function stanceForIssue(
  answers: any,
  issueId: IssueId,
): { stance: Stance; isNeutral: boolean } {
  const matrix = getBeliefMatrix(answers);

  const order: IssueId[] = ['gun', 'mil', 'trump', 'immig'];
  const idx = order.indexOf(issueId);

  const issue = ISSUES.find((x) => x.issueId === issueId);
  let label: unknown;

  if (Array.isArray(matrix)) {
    label = matrix[idx];
  } else if (matrix && typeof matrix === 'object') {
    const byProposition = issue ? (matrix as Record<string, unknown>)[issue.proposition] : undefined;
    const byIssueId = (matrix as Record<string, unknown>)[issueId];
    const byOrder = Object.values(matrix).filter((x) => typeof x === 'string')[idx];
    label = byProposition ?? byIssueId ?? byOrder;
  }

  const parsed = parseStanceFromLabel(label);

  console.log(`Parsed stance for issue "${issueId}": label="${label}", parsed="${parsed}"`);

  if (parsed === null) return { stance: 'disagree', isNeutral: true };
  if (!parsed) return { stance: 'disagree', isNeutral: false };

  return { stance: parsed, isNeutral: false };
}

const STORAGE_KEY = 'revisit_congruentIssues';
const VALID_ISSUES: readonly IssueId[] = ['gun', 'mil', 'trump', 'immig'] as const;

function isIssueId(x: unknown): x is IssueId {
  return typeof x === 'string' && (VALID_ISSUES as readonly string[]).includes(x);
}

export function getCongruentIssuesFromSetter(): IssueId[] {
  // 1) window fallback
  const w = (globalThis as any).__revisit_congruentIssues;
  if (Array.isArray(w)) {
    return w.filter(isIssueId);
  }

  // 2) localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) {
      return parsed.filter(isIssueId);
    }
  } catch {
    // ignore
  }

  return [];
}

function chooseImagePath(opts: {
  issue: (typeof ISSUES)[number];
  congruentSet: Set<IssueId>;
  stance: Stance;
}): { imagePath: string; side: 'pro' | 'con' } {
  const { issue, congruentSet, stance } = opts;
  const isCongruent = congruentSet.has(issue.issueId);

  const showPro = (isCongruent && stance === 'agree') || (!isCongruent && stance === 'disagree');

  return {
    imagePath: normalizeImagePath(showPro ? issue.proImagePath : issue.conImagePath),
    side: showPro ? 'pro' : 'con',
  };
}

/**
 * Count how many of the phase pages for THIS issue have been completed.
 * We look for component keys like:
 *   "stimulus-view-chart_gun", "stimulus-record_gun_2", etc.
 * which are generated by revisit dynamic blocks.
 */
function countCompletedForIssue(answers: any, issueId: IssueId): number {
  return Object.entries(answers ?? {}).filter(([componentName]) => (componentName.includes('stimulus')
      && componentName.includes(issueId))).length;
}

// ---------- Main dynamic function ----------
export default function trials({
  answers,
  customParameters,
}: JumpFunctionParameters<Params>): JumpFunctionReturnVal {
  const issueId = customParameters?.issueId;

  if (!issueId) {
    console.error('Missing customParameters.issueId for issue runner.');
    return { component: null };
  }

  const issue = ISSUES.find((x) => x.issueId === issueId);
  if (!issue) {
    console.error(`Unknown issueId "${issueId}".`);
    return { component: null };
  }

  // Congruence pair comes from the setter component's stored answer
  const congruentIssues = getCongruentIssuesFromSetter();
  const congruentSet = new Set<IssueId>(congruentIssues);

  // Progress inside THIS issue runner = how many phase pages for this issue have completed so far
  const k = countCompletedForIssue(answers, issueId);
  const phaseCount = PHASES.length; // 5
  const phaseIndex = k % phaseCount;

  // Stop after 5 pages for this issue
  if (k >= phaseCount) {
    return { component: null };
  }

  const phaseComponentId = PHASES[phaseIndex] as PhaseComponentId;

  const { stance, isNeutral } = stanceForIssue(answers, issueId);
  const { imagePath, side } = chooseImagePath({ issue, congruentSet, stance });

  console.log(`Issue runner for issue "${issueId}", k ${k}, phase "${phaseComponentId}", phaseIndex ${phaseIndex}, phaseCount ${phaseCount}, stance "${stance}", congruent=${congruentSet.has(issueId)}, image="${imagePath}"`);

  return {
    component: phaseComponentId,
    parameters: {
      imagePath,
      issueId,
      side,
      isNeutral,
    },
  };
}
