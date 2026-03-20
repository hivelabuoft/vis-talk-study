// src/public/my-study/assets/SetCongruence.tsx
import React, { useEffect, useRef } from 'react';

type Props = {
  parameters?: { congruentIssues?: string[] };
};

const STORAGE_KEY = 'revisit_congruentIssues';

export default function SetCongruence({ parameters }: Props) {
  const didSetRef = useRef(false);

  useEffect(() => {
    if (didSetRef.current) return;
    didSetRef.current = true;

    const congruentIssues = Array.isArray(parameters?.congruentIssues)
      ? parameters!.congruentIssues
      : [];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(congruentIssues));
      (window as any).__revisit_congruentIssues = congruentIssues; // optional convenience
    } catch (e) {
      // If localStorage is blocked, at least keep it on window
      (window as any).__revisit_congruentIssues = congruentIssues;
      console.warn('Could not write congruentIssues to localStorage:', e);
    }
  }, [parameters]);

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', lineHeight: 1.5 }}>
      <h1>Part 3</h1>
      <p>
        In the following sections, you will be presented with a few charts. Please take at least 30 seconds to read and understand each
        chart. You will be asked a few questions about your opinion on the chart, then complete a speaking task.
      </p>
      <p>
        For the speaking task, you will be asked to explain your opinion about the
        chart you just read. When you click &quot;Start Recording&quot;,
        please speak into the microphone to say your thoughts.
        {' '}
      <strong>
        You may focus on strengths or weaknesses of the
        chart (or both).
      </strong>
      {' '}
      </p>
        
      <p>
        When you start recording, you should see a visualization of your audio input in the top right of your screen. If you do not see this, please check that your browser is capturing audio and that you are not muted. The audio recording is required to successfully complete the study and receive payment.
        Once you are done speaking, you can click &quot;Finish Recording&quot; to end the recording.
      </p>

      <p>
        We'll walk through a practice question together to help you get familiar with the process. Click &quot;Next&quot; to start the practice question.
      </p>
    </div>
  );
}
