import {
  JumpFunctionParameters,
  JumpFunctionReturnVal,
} from '../../store/types';

export default function func({
  answers,
  customParameters,
}: JumpFunctionParameters<{ brush: string }>): JumpFunctionReturnVal {
  const answerKeys = Object.keys(answers);

  const brushKey = `${customParameters.brush.replaceAll(' ', '')}`;
  const hasDynamicBlock = answerKeys.some((key) => key.includes(brushKey));

  if (hasDynamicBlock) {
    return { component: null };
  }

  return {
    component: 'WebsiteWrapper',
    parameters: {
      page: 'http://localhost:5173/study-params',
      brushType: customParameters.brush ?? 'Rectangle',
      cluster: Math.ceil(Math.random() * 5),
    },
  };
}
