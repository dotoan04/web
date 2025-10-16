import { appendResult } from './storage.js';

function computeScore(questions, answers) {
  let correct = 0;
  questions.forEach((question) => {
    const picked = answers[question.id] || [];
    const sortedPicked = picked.slice().sort();
    const sortedCorrect = Array.from(question.correct).sort();
    if (
      sortedPicked.length === sortedCorrect.length &&
      sortedPicked.every((value, index) => value === sortedCorrect[index])
    ) {
      correct += 1;
    }
  });
  return {
    correct,
    total: questions.length,
    score: Math.round((correct / questions.length) * 100),
  };
}

export function gradeQuiz({ quiz, answers, username }) {
  const result = {
    id: `result-${Date.now()}`,
    quizId: quiz.id,
    quizTitle: quiz.title,
    username,
    createdAt: Date.now(),
    summary: computeScore(quiz.questions, answers),
    answers,
  };
  appendResult(result);
  return result;
}

export function formatResultText(result) {
  const { summary } = result;
  return `Điểm: ${summary.score} (Đúng ${summary.correct}/${summary.total})`;
}
