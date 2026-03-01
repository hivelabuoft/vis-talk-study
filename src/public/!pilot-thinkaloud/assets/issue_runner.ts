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
    proImagePath: '!pilot-thinkaloud/assets/issue_stimuli/gun_pro.png',
    conImagePath: '!pilot-thinkaloud/assets/issue_stimuli/gun_con.png',
  },
  {
    issueId: 'mil' as const,
    proposition:
      'The United States Government should increase its military budget to protect national security.',
    proImagePath: '!pilot-thinkaloud/assets/issue_stimuli/mil_pro.png',
    conImagePath: '!pilot-thinkaloud/assets/issue_stimuli/mil_con.png',
  },
  {
    issueId: 'trump' as const,
    proposition: 'I approve of the way Donald Trump is handling his job as President.',
    proImagePath: '!pilot-thinkaloud/assets/issue_stimuli/trump_pro.png',
    conImagePath: '!pilot-thinkaloud/assets/issue_stimuli/trump_con.png',
  },
  {
    issueId: 'immig' as const,
    proposition:
      'Immigration in the United States should be more strictly regulated to reduce the number of undocumented immigrants.',
    proImagePath: '!pilot-thinkaloud/assets/issue_stimuli/immig_pro.png',
    conImagePath: '!pilot-thinkaloud/assets/issue_stimuli/immig_con.png',
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

// Congruence "setter" storage location (update if you used a different component id)
const CONGRUENCE_SETTER_COMPONENT = 'congruence-setter';
const CONGRUENCE_SETTER_RESPONSE_ID = 'congruentIssues';

// ---------- Types ----------
type IssueId = (typeof ISSUES)[number]['issueId'];
type PhaseComponentId = (typeof PHASES)[number];
type Stance = 'agree' | 'disagree';

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

  if (label === 'Strongly Agree' || label === 'Agree') return 'agree';
  if (label === 'Strongly Disagree' || label === 'Disagree') return 'disagree';
  if (label === 'Neutral') return null;

  const lc = label.toLowerCase();
  if (lc.includes('strong') && lc.includes('agree')) return 'agree';
  if (lc === 'agree') return 'agree';
  if (lc.includes('strong') && lc.includes('disagree')) return 'disagree';
  if (lc === 'disagree') return 'disagree';
  if (lc === 'neutral') return null;

  return null;
}

function stanceForIssue(
  answers: any,
  issueId: IssueId,
): { stance: Stance; isNeutral: boolean } {
  const matrix = answers?.[BELIEF_COMPONENT]?.answer?.[BELIEF_MATRIX_ID] as
    | string[]
    | undefined;

  const order: IssueId[] = ['gun', 'mil', 'trump', 'immig'];
  const idx = order.indexOf(issueId);

  const label = Array.isArray(matrix) ? matrix[idx] : undefined;
  const parsed = parseStanceFromLabel(label);

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
  console.log(answers, issueId);
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
