import { JumpFunctionParameters, JumpFunctionReturnVal } from '../../../store/types';

export default function beliefLeanRunner({ answers, currentStep }: JumpFunctionParameters<Record<string, never>>): JumpFunctionReturnVal {
  if (currentStep >= 7) {
    return { component: null };
  }

  const beliefEntry = Object.entries(answers).find(([key]) => key.startsWith('belief-questionnaire_'));
  const beliefMatrix = beliefEntry?.[1]?.answer?.['belief-matrix'] as unknown as Record<string, string> | undefined;

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