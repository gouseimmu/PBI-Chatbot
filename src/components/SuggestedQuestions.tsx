import React from 'react';
import { DataContext } from '../models/DataContext';

interface SuggestedQuestionsProps {
  context?: DataContext;
  onSelect: (question: string) => void;
  accentColor: string;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ context, onSelect, accentColor }) => {
  const questions = React.useMemo(() => {
    const measureLabel = context?.dataset?.measures?.[0]?.displayName ?? 'sales';
    const baseQuestions = [
      'What are the main trends?',
      'Which category has the highest value?',
      'Give me a summary of this data.',
      'Compare the top regions.',
      `Explain ${measureLabel.toLowerCase()} in this visual.`
    ];

    if (context?.dataset?.measures?.length) {
      return [
        ...baseQuestions.slice(0, 4),
        `Which measure is most important in this context?`,
        `Explain the current visual context for ${context.dataset.measures[0]?.displayName ?? 'the selected measures'}.`
      ];
    }

    return baseQuestions;
  }, [context]);

  return (
    <div className="suggestions">
      {questions.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelect(question)}
          style={{ borderColor: accentColor, color: accentColor }}
        >
          {question}
        </button>
      ))}
    </div>
  );
};
