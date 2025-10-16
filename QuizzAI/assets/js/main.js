import {
  register,
  login,
  logout,
  currentUser,
  requireAuth,
} from './auth.js';
import {
  renderWelcome,
  renderQuizzes,
  renderResults,
  renderReviewList,
  updateSaveButtonState,
  notifyIngest,
  clearIngestFeedback,
  registerQuiz,
} from './ui.js';
import { extractQuestions } from './docParser.js';
import {
  normalizeParsedQuestions,
  isQuestionComplete,
  formatQuestionsForSave,
  sanitizeSingleChoice,
} from './quizGenerator.js';
import { gradeQuiz } from './quizEngine.js';
import { getQuizzes } from './storage.js';

function $(selector) {
  return document.querySelector(selector);
}

const state = {
  mode: 'login',
  questions: [],
  quizTitle: '',
  session: null,
  timer: null,
};

function showApp() {
  $('#landing')?.classList.add('hidden');
  $('#app')?.classList.remove('hidden');
}

function resetIngestForm() {
  $('#quiz-title').value = '';
  $('#docx-input').value = '';
  $('#raw-text').value = '';
  state.questions = [];
  state.quizTitle = '';
  renderReviewList([], () => {});
  updateSaveButtonState(false);
}

function toggleModal(open, mode = 'login') {
  state.mode = mode;
  const backdrop = $('#modal-backdrop');
  if (!backdrop) return;
  if (open) {
    backdrop.classList.remove('hidden');
    $('#modal-title').textContent = mode === 'login' ? 'Đăng nhập' : 'Đăng ký';
    $('#auth-form button[type="submit"]').textContent =
      mode === 'login' ? 'Đăng nhập' : 'Đăng ký';
    $('#auth-feedback').classList.add('hidden');
    $('#auth-form').reset();
  } else {
    backdrop.classList.add('hidden');
  }
}

function updateSession() {
  const session = currentUser();
  if (session) {
    state.session = session;
    renderWelcome(session.username);
    renderQuizzes(handlePlayQuiz);
    renderResults(session.username);
    showApp();
  }
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const username = $('#auth-username').value.trim();
  const password = $('#auth-password').value.trim();
  const feedback = $('#auth-feedback');

  if (!username || !password) {
    feedback.textContent = 'Vui lòng điền đầy đủ thông tin.';
    feedback.classList.remove('hidden');
    return;
  }

  try {
    if (state.mode === 'login') {
      login(username, password);
    } else {
      register(username, password);
    }
    toggleModal(false);
    updateSession();
  } catch (error) {
    feedback.textContent = error.message;
    feedback.classList.remove('hidden');
  }
}

function handleLogout() {
  logout();
  state.session = null;
  window.location.reload();
}

async function handleParse() {
  clearIngestFeedback();
  const title = $('#quiz-title').value.trim();
  const file = $('#docx-input').files[0];
  const text = $('#raw-text').value;
  if (!title) {
    notifyIngest('Vui lòng nhập tên bài kiểm tra.', true);
    return;
  }
  if (!file && !text.trim()) {
    notifyIngest('Hãy tải lên tệp hoặc dán nội dung văn bản.', true);
    return;
  }

  notifyIngest('Đang phân tích tài liệu, vui lòng chờ...');
  try {
    const parsed = await extractQuestions({ file, text });
    if (parsed.length === 0) {
      throw new Error('Không tìm thấy câu hỏi nào.');
    }
    state.questions = normalizeParsedQuestions(parsed);
    state.quizTitle = title;
    renderReviewList(state.questions, handleToggleCorrect);
  updateSaveButtonState(state.questions.every(isQuestionComplete));
  notifyIngest(`Đã phân tích ${state.questions.length} câu hỏi. Vui lòng kiểm tra lại đáp án trước khi lưu.`);
  } catch (error) {
    console.error(error);
    notifyIngest(error.message || 'Không thể phân tích tài liệu.', true);
  }
}

function handleToggleCorrect(question, optionIndex, input) {
  if (!question.multi) {
    question.correct = new Set([optionIndex]);
    const groupInputs = document.getElementsByName(question.id);
    groupInputs.forEach((element) => {
      if (Number(element.value) !== optionIndex) {
        element.checked = false;
      }
    });
  } else {
    if (input.checked) {
      question.correct.add(optionIndex);
    } else {
      question.correct.delete(optionIndex);
    }
  }
  sanitizeSingleChoice(question);
  updateSaveButtonState(state.questions.every(isQuestionComplete));
}

function handleSaveQuiz() {
  try {
    requireAuth();
  } catch (error) {
    alert('Vui lòng đăng nhập trước khi lưu bài kiểm tra.');
    return;
  }

  const questionsReady = state.questions.every(isQuestionComplete);
  if (!questionsReady) {
    alert('Hãy đánh dấu đáp án đúng cho tất cả câu hỏi.');
    return;
  }

  const quiz = {
    id: state.quizTitle.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
    title: state.quizTitle,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    questions: formatQuestionsForSave(state.questions),
    owner: state.session?.username || null,
  };

  registerQuiz(quiz);
  renderQuizzes(handlePlayQuiz);
  notifyIngest('Bài kiểm tra đã được lưu.', false);
  resetIngestForm();
}

function handlePlayQuiz(quiz) {
  const overlay = $('#quiz-runner');
  const form = $('#runner-form');
  const title = $('#runner-title');
  const meta = $('#runner-meta');
  const feedback = $('#runner-feedback');
  const timer = $('#runner-timer');

  overlay.classList.remove('hidden');
  form.innerHTML = '';
  feedback.classList.add('hidden');
  timer.textContent = '';
  title.textContent = quiz.title;
  meta.textContent = `${quiz.questions.length} câu hỏi`;

  quiz.questions.forEach((question, index) => {
    const block = document.createElement('fieldset');
    block.className = 'space-y-3 border border-slate-800 bg-slate-900/60 rounded-lg p-4';
    const legend = document.createElement('legend');
    legend.className = 'font-semibold';
    legend.textContent = `Câu ${index + 1}: ${question.prompt}`;
    block.appendChild(legend);
    question.options.forEach((option, optIndex) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'flex gap-3 items-start text-sm bg-slate-950/60 px-3 py-2 rounded-lg border border-slate-800';
      const input = document.createElement('input');
      input.type = question.multi ? 'checkbox' : 'radio';
      input.name = question.id;
      input.value = String(optIndex);
      wrapper.appendChild(input);
      const span = document.createElement('span');
      span.innerHTML = `<span class="font-semibold mr-2">${option.key}.</span> ${option.text}`;
      wrapper.appendChild(span);
      block.appendChild(wrapper);
    });
    form.appendChild(block);
  });

  $('#runner-submit').onclick = (event) => {
    event.preventDefault();
    handleSubmitQuiz(quiz);
  };
}

function closeRunner() {
  $('#quiz-runner').classList.add('hidden');
}

function handleSubmitQuiz(quiz) {
  const form = $('#runner-form');
  const formData = new FormData(form);
  const answers = {};
  quiz.questions.forEach((question) => {
    const values = formData.getAll(question.id);
    answers[question.id] = values.map((value) => Number(value));
  });

  const result = gradeQuiz({ quiz, answers, username: state.session?.username });

  const feedback = $('#runner-feedback');
  feedback.textContent = `Kết quả: ${result.summary.score} điểm (Đúng ${result.summary.correct}/${result.summary.total}).`;
  feedback.classList.remove('hidden');
  renderResults(state.session?.username);
}

function bindEvents() {
  $('#open-login')?.addEventListener('click', () => toggleModal(true, 'login'));
  $('#open-register')?.addEventListener('click', () => toggleModal(true, 'register'));
  $('#modal-close')?.addEventListener('click', () => toggleModal(false));
  $('#auth-form')?.addEventListener('submit', handleAuthSubmit);
  $('#logout-btn')?.addEventListener('click', handleLogout);
  $('#parse-btn')?.addEventListener('click', handleParse);
  $('#clear-btn')?.addEventListener('click', resetIngestForm);
  $('#save-quiz-btn')?.addEventListener('click', handleSaveQuiz);
  $('#runner-close')?.addEventListener('click', closeRunner);
}

renderQuizzes(() => {});
renderResults('');
bindEvents();
updateSession();
