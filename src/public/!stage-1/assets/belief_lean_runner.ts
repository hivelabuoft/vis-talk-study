import { JumpFunctionParameters, JumpFunctionReturnVal } from '../../../store/types';

export default function beliefLeanRunner({ answers }: JumpFunctionParameters<Record<string, never>>): JumpFunctionReturnVal {
  const beliefMatrix = answers['belief-questionnaire']?.answer?.['belief-matrix'] as unknown as Record<string, string> | undefined;

  const neutralQuestions = beliefMatrix
    ? Object.entries(beliefMatrix)
        .filter(([, value]) => value === 'Neutral')
        .map(([question]) => question)
    : [];

  if (neutralQuestions.length === 0) {
    return { component: null };
  }

  return {
    component: 'belief-lean',
    parameters: { neutralQuestions },
  };
}