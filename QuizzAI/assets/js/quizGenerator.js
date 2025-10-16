function makeQuestionId(index) {
  return `question-${Date.now()}-${index}`;
}

function normalizeOption(option, index) {
  const key = option.key?.trim() || String.fromCharCode(65 + index);
  const text = option.value?.trim() || option.text?.trim() || '';
  return {
    key,
    text,
    index,
  };
}

export function normalizeParsedQuestions(rawQuestions) {
  return rawQuestions.map((item, index) => {
    const options = item.options.map((opt, idx) => normalizeOption(opt, idx));
    const correct = new Set();
    item.options.forEach((opt, idx) => {
      if (opt.isCorrect) {
        correct.add(idx);
      }
    });
    return {
      id: makeQuestionId(index),
      prompt: item.title.trim(),
      multi: Boolean(item.multi),
      options,
      correct,
    };
  });
}

export function isQuestionComplete(question) {
  return question.correct.size > 0;
}

export function formatQuestionsForSave(questions) {
  return questions.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    multi: question.multi,
    options: question.options.map((option) => ({
      key: option.key,
      text: option.text,
    })),
    correct: Array.from(question.correct).sort((a, b) => a - b),
  }));
}

export function sanitizeSingleChoice(question) {
  if (question.multi || question.correct.size <= 1) return;
  const [first] = question.correct;
  question.correct = new Set([first]);
}
