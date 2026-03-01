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
      <p>
        In the following sections, you will be presented with a few data
        visualizations. You will have 30 seconds to read and understand each
        visualization. After 30 seconds, click &quot;Next&quot; when you are
        ready to proceed. You will then be asked to do a speaking task and a
        writing task, though the order may vary.
      </p>

      <p>
        For the writing task, please simply write how you would describe the
        data visualization in 3-5 words.
      </p>

      <p>
        For the speaking task, you will be asked to critique the data
        visualization you just read. When you click &quot;Start Recording&quot;,
        please speak into the microphone to say your thoughts.
        {' '}
        <strong>
          Your critiques may focus on strengths or weaknesses of the
          visualization.
        </strong>
        {' '}
        Once you are done speaking, click &quot;Finish Recording&quot; to end
        the recording.
      </p>
    </div>
  );
}
