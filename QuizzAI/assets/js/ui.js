import { getResults, getQuizzes, upsertQuiz, deleteQuiz } from './storage.js';
import { formatResultText } from './quizEngine.js';

function $(selector) {
  return document.querySelector(selector);
}

function createElement(tag, className, content) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content !== undefined) element.innerHTML = content;
  return element;
}

export function renderWelcome(username) {
  const target = $('#welcome-text');
  if (target) {
    target.textContent = `Xin chào, ${username}!`;
  }
}

export function renderQuizzes(onPlay, onRemove) {
  const list = $('#quiz-list');
  const quizzes = getQuizzes();
  const count = $('#quiz-count');
  if (!list) return;
  list.innerHTML = '';

  if (count) {
    count.textContent = `${quizzes.length} bài`;
  }

  if (quizzes.length === 0) {
    list.appendChild(
      createElement(
        'p',
        'text-sm text-slate-400',
        'Chưa có bài kiểm tra nào. Hãy phân tích tài liệu trước.',
      ),
    );
    return;
  }

  quizzes
    .slice()
    .reverse()
    .forEach((quiz) => {
      const card = createElement(
        'div',
        'rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3',
      );
      const title = createElement(
        'h3',
        'text-lg font-semibold',
        quiz.title,
      );
      card.appendChild(title);

      const stats = createElement(
        'p',
        'text-xs text-slate-400',
        `${quiz.questions.length} câu hỏi • Cập nhật ${new Date(
          quiz.updatedAt,
        ).toLocaleString('vi-VN')}`,
      );
      card.appendChild(stats);

      const actions = createElement('div', 'flex gap-2');
      const startBtn = createElement(
        'button',
        'px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-medium',
        'Làm bài',
      );
      startBtn.addEventListener('click', () => onPlay(quiz));
      actions.appendChild(startBtn);

      const removeBtn = createElement(
        'button',
        'px-3 py-1 rounded-lg border border-slate-700 hover:border-slate-500 text-sm font-medium',
        'Xóa',
      );
      removeBtn.addEventListener('click', () => {
        if (window.confirm('Bạn chắc chắn muốn xóa bài kiểm tra này?')) {
          deleteQuiz(quiz.id);
          renderQuizzes(onPlay, onRemove);
          onRemove?.(quiz);
        }
      });
      actions.appendChild(removeBtn);

      card.appendChild(actions);
      list.appendChild(card);
    });
}

export function renderResults(username) {
  const container = $('#results-list');
  if (!container) return;
  container.innerHTML = '';
  const results = getResults()
    .slice()
    .reverse()
    .filter((item) => item.username === username);

  if (results.length === 0) {
    container.appendChild(
      createElement(
        'p',
        'text-sm text-slate-400',
        'Chưa có kết quả nào. Hãy làm bài kiểm tra trước.',
      ),
    );
    return;
  }

  results.forEach((result) => {
    const card = createElement(
      'div',
      'border border-slate-800 bg-slate-900/60 rounded-lg p-4 space-y-2',
    );
    card.appendChild(
      createElement(
        'p',
        'font-semibold text-sm',
        `Bài: ${result.quizTitle}`,
      ),
    );
    card.appendChild(
      createElement(
        'p',
        'text-sm text-slate-300',
        formatResultText(result),
      ),
    );
    card.appendChild(
      createElement(
        'p',
        'text-xs text-slate-500',
        new Date(result.createdAt).toLocaleString('vi-VN'),
      ),
    );
    container.appendChild(card);
  });
}

export function renderReviewList(questions, onToggle) {
  const container = $('#question-review');
  if (!container) return;
  container.innerHTML = '';
  if (!questions || questions.length === 0) {
    container.appendChild(
      createElement(
        'p',
        'text-sm text-slate-400',
        'Chưa có câu hỏi nào. Hãy phân tích tài liệu trước.',
      ),
    );
    return;
  }

  questions.forEach((question, index) => {
    const block = createElement(
      'article',
      'rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3',
    );
    const heading = createElement(
      'h3',
      'font-semibold',
      `Câu ${index + 1}: ${question.prompt}`,
    );
    block.appendChild(heading);

    const list = createElement('div', 'space-y-2');
    question.options.forEach((option, optIndex) => {
      const optionId = `${question.id}-${optIndex}`;
      const wrapper = createElement(
        'label',
        'flex gap-3 items-start bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2',
      );
      const input = document.createElement('input');
      input.type = question.multi ? 'checkbox' : 'radio';
      input.name = question.id;
      input.id = optionId;
      input.value = String(optIndex);
      input.checked = question.correct.has(optIndex);
      input.addEventListener('change', () => onToggle(question, optIndex, input));
      wrapper.appendChild(input);
      const text = createElement(
        'div',
        'text-sm',
        `<span class="font-semibold mr-2">${option.key}.</span> ${option.text}`,
      );
      wrapper.appendChild(text);
      list.appendChild(wrapper);
    });
    block.appendChild(list);
      const badge = createElement(
        'p',
        'text-xs text-slate-400',
        question.multi ? 'Nhiều đáp án đúng' : 'Một đáp án đúng',
      );
      block.appendChild(badge);
      const count = question.correct.size;
      if (count > 0) {
        const hint = createElement(
          'p',
          'text-xs text-emerald-400',
          `Đã đánh dấu ${count} đáp án đúng`,
        );
        block.appendChild(hint);
      }
    container.appendChild(block);
  });
}

export function updateSaveButtonState(enabled) {
  const button = document.getElementById('save-quiz-btn');
  if (!button) return;
  button.disabled = !enabled;
}

export function notifyIngest(message, isError = false) {
  const feedback = document.getElementById('ingest-feedback');
  if (!feedback) return;
  feedback.classList.toggle('text-emerald-400', !isError);
  feedback.classList.toggle('text-rose-400', isError);
  feedback.textContent = message;
  feedback.classList.remove('hidden');
}

export function clearIngestFeedback() {
  const feedback = document.getElementById('ingest-feedback');
  if (!feedback) return;
  feedback.classList.add('hidden');
}

export function registerQuiz(quiz) {
  return upsertQuiz(quiz);
}
