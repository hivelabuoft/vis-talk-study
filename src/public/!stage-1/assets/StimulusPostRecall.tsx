import { Image, Stack, Text } from '@mantine/core';
import { StimulusParams } from '../../../store/types';
import { PREFIX } from '../../../utils/Prefix';

const RESPONSE_ID = 'stimulus-words-response';

interface StimulusPostParams {
  imagePath?: string;
  imageAlt?: string;
}

export default function StimulusPostRecall({ answers, parameters }: StimulusParams<StimulusPostParams>) {
  const previousDescription = Object.values(answers)
    .filter((storedAnswer) => typeof storedAnswer.answer?.[RESPONSE_ID] === 'string')
    .sort((a, b) => b.endTime - a.endTime)[0]
    ?.answer?.[RESPONSE_ID] as string | undefined;

  const imageUrl = parameters?.imagePath
    ? (parameters.imagePath.startsWith('http') ? parameters.imagePath : `${PREFIX}${parameters.imagePath}`)
    : undefined;

  return (
    <Stack gap="xs" style={{ width: '100%' }}>
      {imageUrl && <Image mx="auto" src={imageUrl} alt={parameters?.imageAlt || 'Stimulus image'} />}
      <Text>
        {`Now that you have talked about the visualization, recall how you initially described it earlier: "${previousDescription || '(no earlier description found)'}"`}
      </Text>
    </Stack>
  );
}
