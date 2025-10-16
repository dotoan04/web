const STORAGE_KEYS = {
  USERS: 'quizzai_users',
  SESSION: 'quizzai_session',
  QUIZZES: 'quizzai_quizzes',
  RESULTS: 'quizzai_results',
};

function read(key, fallback) {
  const raw = window.localStorage.getItem(key);
  if (!raw) return structuredClone(fallback);
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`Không thể đọc dữ liệu từ ${key}`, error);
    return structuredClone(fallback);
  }
}

function write(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function structuredClone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

export function getUsers() {
  return read(STORAGE_KEYS.USERS, []);
}

export function saveUsers(users) {
  write(STORAGE_KEYS.USERS, users);
}

export function getSession() {
  return read(STORAGE_KEYS.SESSION, null);
}

export function setSession(session) {
  write(STORAGE_KEYS.SESSION, session);
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export function getQuizzes() {
  return read(STORAGE_KEYS.QUIZZES, []);
}

export function saveQuizzes(quizzes) {
  write(STORAGE_KEYS.QUIZZES, quizzes);
}

export function getResults() {
  return read(STORAGE_KEYS.RESULTS, []);
}

export function saveResults(results) {
  write(STORAGE_KEYS.RESULTS, results);
}

export function upsertQuiz(quiz) {
  const quizzes = getQuizzes();
  const existingIndex = quizzes.findIndex((item) => item.id === quiz.id);
  if (existingIndex >= 0) {
    quizzes[existingIndex] = quiz;
  } else {
    quizzes.push(quiz);
  }
  saveQuizzes(quizzes);
  return quizzes;
}

export function deleteQuiz(quizId) {
  const next = getQuizzes().filter((quiz) => quiz.id !== quizId);
  saveQuizzes(next);
  return next;
}

export function appendResult(result) {
  const results = getResults();
  results.push(result);
  saveResults(results);
  return results;
}
