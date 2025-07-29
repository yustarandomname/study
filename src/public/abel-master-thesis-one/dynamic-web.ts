import {
  JumpFunctionParameters,
  JumpFunctionReturnVal,
} from '../../store/types';

export default function func({
  answers,
  customParameters,
}: JumpFunctionParameters<{
  brush: string;
  automations: boolean;
}>): JumpFunctionReturnVal {
  const answerKeys = Object.keys(answers);

  function staticFirst(key: string) {
    if (!key.startsWith(customParameters.brush)) return false;

    return /_\d+_WebsiteWrapper_0+$/.test(key);
  }

  function automationFirst(key: string) {
    if (!key.startsWith(customParameters.brush.concat('-Dynamic'))) {
      return false;
    }

    return /_\d+_WebsiteWrapper_0+$/.test(key);
  }

  const firstEncounter = answerKeys.some(staticFirst);
  const nthEncounter = answerKeys.some(automationFirst);

  if (firstEncounter && !customParameters.automations) {
    return { component: null };
  }

  if (nthEncounter && customParameters.automations) {
    return { component: null };
  }

  return {
    component: 'WebsiteWrapper',
    parameters: {
      page: 'https://master-thesis-rho.vercel.app/study-params',
      brushType: customParameters.brush ?? 'Rectangle',
      allowAutomations: customParameters.automations ?? false,
      cluster: Math.ceil(Math.random() * 5),
    },
  };
}
