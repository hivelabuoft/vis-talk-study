import React, { useEffect, useState } from 'react';

const LEAN_OPTIONS = ['Lean Disagree', 'Lean Agree'] as const;
type LeanOption = (typeof LEAN_OPTIONS)[number];

type Props = {
  parameters?: { neutralQuestions?: string[] };
  setAnswer: (answer: { status: boolean; answers: Record<string, unknown> }) => void;
};

export default function BeliefLean({ parameters, setAnswer }: Props) {
  const neutralQuestions = parameters?.neutralQuestions ?? [];
  const [leanAnswers, setLeanAnswers] = useState<Record<string, LeanOption>>({});

  useEffect(() => {
    const allAnswered = neutralQuestions.every((q) => leanAnswers[q] !== undefined);

    const answers: Record<string, string> = {};
    for (const [question, lean] of Object.entries(leanAnswers)) {
      answers[`belief-lean_${question}`] = lean;
    }

    setAnswer({ status: allAnswered, answers });
  }, [leanAnswers, neutralQuestions, setAnswer]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 680, margin: '0 auto', padding: '8px 0 24px' }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 20 }}>
        For the following {neutralQuestions.length === 1 ? 'issue' : 'issues'}, you
        answered <strong>Neutral</strong>. If you had to lean one way or the other,
        would you say you agree or disagree more?
      </p>

      {neutralQuestions.map((question) => {
        const selected = leanAnswers[question];
        return (
          <div
            key={question}
            style={{
              marginBottom: 20,
              padding: '16px 20px',
              borderRadius: 8,
              background: '#fffbeb',
              border: '1.5px solid #fcd34d',
            }}
          >
            <p style={{ fontSize: 14, color: '#92400e', fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5 }}>
              {question}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {LEAN_OPTIONS.map((opt) => {
                const isSelected = selected === opt;
                return (
                  <label
                    key={opt}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: 6,
                      border: `1.5px solid ${isSelected ? '#d97706' : '#ccc'}`,
                      background: isSelected ? '#fef3c7' : '#fff',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: isSelected ? '#92400e' : '#333',
                      fontWeight: isSelected ? 600 : 400,
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="radio"
                      name={`lean_${question}`}
                      value={opt}
                      checked={isSelected}
                      onChange={() => setLeanAnswers((prev) => ({ ...prev, [question]: opt }))}
                      style={{ display: 'none' }}
                    />
                    {opt}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}