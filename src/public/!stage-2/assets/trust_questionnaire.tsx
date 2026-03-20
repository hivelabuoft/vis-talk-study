import React, { useEffect, useMemo, useState } from 'react';
import { StimulusParams } from '../../../store/types';
import { PREFIX } from '../../../utils/Prefix';

type StimulusInfo = {
  issueId: string;
  imagePath: string;
  side: string;
};

type Answers = Record<string, Record<string, string>>;

const LIKERT_OPTIONS = [
  'Strongly Disagree',
  'Disagree',
  'Neutral',
  'Agree',
  'Strongly Agree',
] as const;

const TRUST_STATEMENTS = [
  { id: 'familiarity', label: 'Familiarity', text: 'I am familiar with the topic or data this visualization presents.' },
  { id: 'clarity', label: 'Clarity', text: 'I understand what this visualization is trying to tell me.' },
  { id: 'credibility', label: 'Credibility', text: 'I believe the visualization shows real data.' },
  { id: 'reliability', label: 'Reliability', text: 'I would rely on the facts in this visualization.' },
  { id: 'confidence', label: 'Confidence', text: 'I would feel confident using the information to make a decision.' },
] as const;

export default function TrustQuestionnaire({ answers, setAnswer }: StimulusParams<Record<string, never>>) {
  // Extract unique stimuli the participant saw from their prior answers
  const stimuli = useMemo(() => {
    const seen = new Map<string, StimulusInfo>();

    for (const [key, entry] of Object.entries(answers ?? {})) {
      // Match stimulus components from the thinkaloud block (not examples)
      if (!key.includes('stimulus') || key.includes('example')) continue;

      const params = entry?.parameters;
      if (!params?.imagePath || !params?.issueId) continue;

      // Deduplicate by issueId (each issue only has one image)
      if (!seen.has(params.issueId)) {
        seen.set(params.issueId, {
          issueId: params.issueId,
          imagePath: params.imagePath,
          side: params.side ?? '',
        });
      }
    }

    return Array.from(seen.values());
  }, [answers]);

  const [formAnswers, setFormAnswers] = useState<Answers>({});

  // Report answers back to reVISit
  useEffect(() => {
    const flat: Record<string, string> = {};
    for (const [issueId, issueAnswers] of Object.entries(formAnswers)) {
      for (const [qId, value] of Object.entries(issueAnswers)) {
        flat[`${issueId}_${qId}`] = value;
      }
    }

    const allComplete = stimuli.length > 0 && stimuli.every((s) => {
      const a = formAnswers[s.issueId];
      return a && TRUST_STATEMENTS.every((q) => a[q.id] && a[q.id] !== '');
    });

    setAnswer({ status: allComplete, answers: flat });
  }, [formAnswers, stimuli, setAnswer]);

  const handleChange = (issueId: string, questionId: string, value: string) => {
    setFormAnswers((prev) => ({
      ...prev,
      [issueId]: {
        ...(prev[issueId] ?? {}),
        [questionId]: value,
      },
    }));
  };

  if (stimuli.length === 0) {
    return <p>No stimuli found in your session.</p>;
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: 'sans-serif' }}>
      {stimuli.map((stimulus, idx) => {
        const imgSrc = stimulus.imagePath.startsWith('http')
          ? stimulus.imagePath
          : `${PREFIX}${stimulus.imagePath}`;

        return (
          <div
            key={stimulus.issueId}
            style={{
              marginBottom: 48,
              paddingBottom: 48,
              borderBottom: idx < stimuli.length - 1 ? '1px solid #ddd' : 'none',
            }}
          >
            <h3 style={{ marginBottom: 16 }}>
              Chart
              {' '}
              {idx + 1}
              {' '}
              of
              {' '}
              {stimuli.length}
            </h3>

            <img
              src={imgSrc}
              alt={`Stimulus chart for ${stimulus.issueId}`}
              style={{
                display: 'block',
                maxWidth: '100%',
                maxHeight: '60vh',
                objectFit: 'contain',
                marginBottom: 24,
              }}
            />

            {/* Likert scale for each trust statement */}
            <div style={{ padding: '16px 20px', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>
                Please rate how much you agree or disagree with each statement about the chart above.
              </p>

              {/* Column headers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(5, minmax(0, 1fr))', gap: 4, marginBottom: 8, marginTop: 16 }}>
                <div />
                {LIKERT_OPTIONS.map((opt) => (
                  <div key={opt} style={{ textAlign: 'center', fontSize: 11, color: '#666', lineHeight: 1.3 }}>
                    {opt}
                  </div>
                ))}
              </div>

              {TRUST_STATEMENTS.map((stmt) => {
                const selected = formAnswers[stimulus.issueId]?.[stmt.id] ?? '';
                return (
                  <div
                    key={stmt.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr repeat(5, minmax(0, 1fr))',
                      gap: 4,
                      alignItems: 'center',
                      padding: '10px 0',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    <div style={{ fontSize: 13, lineHeight: 1.4 }}>
                      <strong>{stmt.label}:</strong>
                      {' '}
                      {stmt.text}
                    </div>
                    {LIKERT_OPTIONS.map((opt) => (
                      <div key={opt} style={{ textAlign: 'center' }}>
                        <input
                          type="radio"
                          name={`${stimulus.issueId}_${stmt.id}`}
                          checked={selected === opt}
                          onChange={() => handleChange(stimulus.issueId, stmt.id, opt)}
                          style={{ cursor: 'pointer', width: 16, height: 16 }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
