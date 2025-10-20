const steps = [
  {
    id: 'name',
    title: 'お名前',
    hint: '診断レポートの宛名になります',
    type: 'text',
    prompt: 'こんにちは！まずはお名前を教えてください。',
    placeholder: '山田太郎',
    validation: (value) => value.trim().length >= 2 || '2文字以上で入力してください。',
  },
  {
    id: 'email',
    title: 'ご連絡先',
    hint: '診断結果の送信先に利用します',
    type: 'email',
    prompt: '診断結果のサマリーをお届けするメールアドレスを入力してください。',
    placeholder: 'you@example.com',
    validation: (value) => /.+@.+\..+/.test(value) || 'メールアドレスの形式で入力してください。',
  },
  {
    id: 'location',
    title: '活動エリア',
    hint: '市場選定の参考にします',
    type: 'choice',
    prompt: '現在拠点にしている地域はどちらですか？',
    options: ['日本国内', 'アジア圏（日本以外）', '北米', '欧州', 'その他'],
  },
  {
    id: 'role',
    title: '現在の肩書き',
    hint: '職種や職務を教えてください',
    type: 'choice',
    prompt: '現在のご状況に最も近い肩書きを選んでください。',
    options: ['起業準備中', '新規事業担当', 'フリーランス', '学生', 'その他'],
  },
  {
    id: 'skills',
    title: '得意領域',
    hint: '複数選択できます',
    type: 'multi',
    prompt: 'どの領域に強みがありますか？当てはまるものをすべて選んでください。',
    options: [
      'プロダクト開発（エンジニアリング）',
      'AI・データサイエンス',
      '事業開発・BizDev',
      '営業・アライアンス',
      'マーケティング・グロース',
      'デザイン・UX',
      '資金調達・ファイナンス',
    ],
    validation: (value) => value.length > 0 || '少なくとも1つ選択してください。',
  },
  {
    id: 'problem',
    title: '解決したい課題',
    hint: '自由記述（200文字程度）',
    type: 'textarea',
    prompt: '今、解決したい課題や不満はどんなことですか？背景も併せて教えてください。',
    placeholder:
      '例：ホワイトカラーの単純作業を削減したい。特に採用周りでのドキュメント整理に1日2時間以上取られている。',
  },
  {
    id: 'audience',
    title: '想定ユーザー',
    hint: 'セグメントを具体的に',
    type: 'textarea',
    prompt: 'その課題に直面しているのはどのようなユーザー（顧客層）ですか？可能であれば属性も教えてください。',
    placeholder: '例：従業員50〜300名のスタートアップの採用責任者。SaaSに抵抗はない。',
  },
  {
    id: 'goal',
    title: '達成したいゴール',
    hint: '今後12か月の目標',
    type: 'choice',
    prompt: '今後12か月で実現したい状態に最も近いものを選んでください。',
    options: ['副業レベルでの収益化', 'スタートアップ起業（資金調達含む）', '新規事業として社内導入', 'アイデア検証から始めたい'],
  },
  {
    id: 'timeline',
    title: '動き始めるタイミング',
    hint: '最適なNext Actionを提案します',
    type: 'choice',
    prompt: 'どのくらいのスピード感で動き始めたいですか？',
    options: ['今すぐ', '1〜3か月以内', '半年以内', '時期は未定'],
  },
];

const chatWindow = document.getElementById('chatWindow');
const inputForm = document.getElementById('inputForm');
const inputContainer = document.getElementById('inputContainer');
const submitButton = document.getElementById('submitButton');
const progressLabel = document.getElementById('progressLabel');
const progressFill = document.getElementById('progressFill');
const backButton = document.getElementById('backButton');
const startOverTop = document.getElementById('startOverTop');
const sidebarSteps = document.getElementById('sidebarSteps');
const stepTemplate = document.getElementById('stepTemplate');

let currentStepIndex = 0;
const answers = new Map();
let isAwaitingInput = false;

const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
};

const scrollToBottom = () => {
  chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
};

const createMessageElement = (text, author = 'bot') => {
  const wrapper = document.createElement('div');
  wrapper.className = `chat__message chat__message--${author}`;
  wrapper.innerHTML = `
    <span>${text}</span>
    <span class="chat__timestamp">${formatTimestamp()}</span>
  `;
  return wrapper;
};

const renderSidebarSteps = () => {
  sidebarSteps.innerHTML = '';
  steps.forEach((step, index) => {
    const node = stepTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.sidebar__step-index').textContent = index + 1;
    node.querySelector('.sidebar__step-title').textContent = step.title;
    node.querySelector('.sidebar__step-hint').textContent = step.hint;
    if (index < currentStepIndex) node.classList.add('complete');
    if (index === currentStepIndex) node.classList.add('active');
    sidebarSteps.appendChild(node);
  });
};

const updateProgress = () => {
  progressLabel.textContent = `${Math.min(currentStepIndex + 1, steps.length)} / ${steps.length}`;
  const completion = (currentStepIndex / steps.length) * 100;
  progressFill.style.width = `${Math.min(completion, 100)}%`;
};

const addBotMessage = (text) => {
  chatWindow.appendChild(createMessageElement(text, 'bot'));
  scrollToBottom();
};

const addUserMessage = (text) => {
  chatWindow.appendChild(createMessageElement(text, 'user'));
  scrollToBottom();
};

const clearInput = () => {
  inputContainer.innerHTML = '';
  submitButton.style.display = 'none';
};

const renderTextInput = (step, multiline = false) => {
  clearInput();
  const input = multiline ? document.createElement('textarea') : document.createElement('input');
  input.name = step.id;
  input.placeholder = step.placeholder || '';
  input.required = true;
  if (step.type === 'email') input.type = 'email';
  const existing = answers.get(step.id);
  if (existing) input.value = existing;
  inputContainer.appendChild(input);
  submitButton.style.display = 'inline-flex';
  submitButton.textContent = '送信';
  requestAnimationFrame(() => input.focus());
};

const renderChoiceInput = (step) => {
  clearInput();
  const wrapper = document.createElement('div');
  wrapper.className = 'quick-replies';

  step.options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick-reply';
    button.textContent = option;
    button.addEventListener('click', () => {
      answers.set(step.id, option);
      addUserMessage(option);
      goToNextStep();
    });
    wrapper.appendChild(button);
  });

  inputContainer.appendChild(wrapper);
  submitButton.style.display = 'none';
};

const renderMultiChoiceInput = (step) => {
  clearInput();
  const wrapper = document.createElement('div');
  wrapper.className = 'quick-replies';
  const selected = new Set(answers.get(step.id) || []);

  step.options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick-reply';
    button.textContent = option;
    if (selected.has(option)) button.classList.add('is-selected');

    button.addEventListener('click', () => {
      if (selected.has(option)) {
        selected.delete(option);
        button.classList.remove('is-selected');
      } else {
        selected.add(option);
        button.classList.add('is-selected');
      }
    });
    wrapper.appendChild(button);
  });

  const confirm = document.createElement('button');
  confirm.type = 'button';
  confirm.className = 'primary-button';
  confirm.textContent = '選択を確定';
  confirm.addEventListener('click', () => {
    const chosen = Array.from(selected);
    const validationResult = step.validation ? step.validation(chosen) : true;
    if (validationResult !== true) {
      showInlineError(validationResult);
      return;
    }
    answers.set(step.id, chosen);
    addUserMessage(chosen.join('、'));
    goToNextStep();
  });

  inputContainer.append(wrapper, confirm);
  submitButton.style.display = 'none';
};

const showInlineError = (message) => {
  let error = inputContainer.querySelector('.input__error');
  if (!error) {
    error = document.createElement('p');
    error.className = 'input__error';
    error.style.color = '#d62839';
    error.style.fontSize = '0.85rem';
    error.style.margin = '0';
    error.style.flexBasis = '100%';
    inputContainer.appendChild(error);
  }
  error.textContent = message;
};

const renderStepInput = (step) => {
  renderSidebarSteps();
  updateProgress();
  isAwaitingInput = true;

  switch (step.type) {
    case 'text':
    case 'email':
      renderTextInput(step);
      break;
    case 'textarea':
      renderTextInput(step, true);
      break;
    case 'choice':
      renderChoiceInput(step);
      break;
    case 'multi':
      renderMultiChoiceInput(step);
      break;
    default:
      renderTextInput(step);
  }
};

const goToStep = (index) => {
  currentStepIndex = index;
  const step = steps[currentStepIndex];
  addBotMessage(step.prompt);
  renderStepInput(step);
};

const goToNextStep = () => {
  isAwaitingInput = false;
  if (currentStepIndex < steps.length - 1) {
    currentStepIndex += 1;
    const step = steps[currentStepIndex];
    setTimeout(() => {
      addBotMessage(step.prompt);
      renderStepInput(step);
    }, 320);
  } else {
    showSummary();
  }
};

const handleSubmit = (event) => {
  event.preventDefault();
  if (!isAwaitingInput) return;
  const step = steps[currentStepIndex];
  const formData = new FormData(inputForm);
  let value = formData.get(step.id);
  if (typeof value === 'string') value = value.trim();

  if (step.validation) {
    const validationResult = step.validation(value);
    if (validationResult !== true) {
      showInlineError(validationResult);
      return;
    }
  }

  answers.set(step.id, value);
  addUserMessage(Array.isArray(value) ? value.join('、') : value);
  goToNextStep();
};

const showSummary = () => {
  isAwaitingInput = false;
  currentStepIndex = steps.length;
  renderSidebarSteps();
  updateProgress();
  submitButton.style.display = 'none';
  inputContainer.innerHTML = '';

  const summary = document.createElement('article');
  summary.className = 'summary-card';

  const heading = document.createElement('h3');
  heading.textContent = '診断サマリー';
  summary.appendChild(heading);

  const description = document.createElement('p');
  description.textContent = '入力内容をもとに、次のステップに役立つ提案をまとめました。チームやメンターと共有して議論を進めてみましょう。';
  summary.appendChild(description);

  const dl = document.createElement('dl');
  steps.forEach((step) => {
    const dt = document.createElement('dt');
    dt.textContent = step.title;
    const dd = document.createElement('dd');
    const answer = answers.get(step.id);
    dd.textContent = Array.isArray(answer) ? answer.join('、') : answer || '未入力';
    dl.append(dt, dd);
  });
  summary.appendChild(dl);

  const recommendations = document.createElement('section');
  recommendations.style.marginTop = '1.2rem';
  recommendations.innerHTML = `
    <h4 style="margin-bottom: 0.6rem">おすすめのNext Action</h4>
    <ul style="margin: 0; padding-left: 1.2rem; line-height: 1.7; color: var(--text-muted)">
      <li>回答内容を踏まえたアイデア候補を3案ピックアップしてみましょう。</li>
      <li>想定ユーザーへのヒアリングを2件スケジュールし、課題の深堀りを行います。</li>
      <li>強みを活かした最初のMVPスコープを描き、必要リソースを棚卸しします。</li>
    </ul>
  `;
  summary.appendChild(recommendations);

  const actions = document.createElement('div');
  actions.className = 'summary-actions';

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'primary-button';
  restart.textContent = '別の診断をはじめる';
  restart.addEventListener('click', resetConversation);

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.className = 'ghost-button';
  copy.textContent = 'サマリーをコピー';
  copy.addEventListener('click', () => {
    const summaryText = steps
      .map((step) => `${step.title}: ${Array.isArray(answers.get(step.id)) ? answers.get(step.id).join('、') : answers.get(step.id) || '未入力'}`)
      .join('\n');
    navigator.clipboard
      .writeText(`SmartLaunch Co-Founder 診断サマリー\n${summaryText}`)
      .then(() => {
        copy.textContent = 'コピーしました！';
        setTimeout(() => (copy.textContent = 'サマリーをコピー'), 1600);
      })
      .catch(() => {
        copy.textContent = 'コピーに失敗しました';
        setTimeout(() => (copy.textContent = 'サマリーをコピー'), 1600);
      });
  });

  actions.append(restart, copy);
  summary.appendChild(actions);

  addBotMessage('診断が完了しました。以下のサマリーを参考に、次のアクションを検討してみましょう。');
  chatWindow.appendChild(summary);
  scrollToBottom();
};

const resetConversation = () => {
  chatWindow.innerHTML = '';
  answers.clear();
  currentStepIndex = 0;
  isAwaitingInput = false;
  renderSidebarSteps();
  updateProgress();
  submitButton.style.display = 'none';
  inputContainer.innerHTML = '';
  setTimeout(() => {
    addBotMessage('SmartLaunch Co-Founderへようこそ。これから数分で、あなたに最適なAI起業アイデアのヒントを見つけましょう。');
    setTimeout(() => goToStep(0), 500);
  }, 100);
};

inputForm.addEventListener('submit', handleSubmit);
backButton.addEventListener('click', () => {
  if (currentStepIndex === 0) return;
  currentStepIndex -= 1;
  const step = steps[currentStepIndex];
  addBotMessage(`${step.title}を修正しましょう。`);
  renderStepInput(step);
});

startOverTop.addEventListener('click', () => resetConversation());

document.addEventListener('DOMContentLoaded', () => {
  renderSidebarSteps();
  updateProgress();
  resetConversation();
});
