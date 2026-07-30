// REPLACE WITH YOUR SUPABASE CREDENTIALS
const SUPABASE_URL = 'https://hpcseeboydgfiledqrxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwY3NlZWJveWRnZmlsZWRxcnhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NjUyNzMsImV4cCI6MjEwMDM0MTI3M30.aYBF7ct6tariXX6i6tBkto8b7Doc5UG2ist3y7m7gDg';
    
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let allQuestions = [];
let questions = [];
let currentIndex = 0;
let userAnswers = [];
let reviewStatus = [];
let isSubmitted = false;

// Dual-Timer State Variables
let masterTimeRemaining = 3600;
let masterTimerInterval = null;
let questionTimeSpent = []; // Array tracking seconds spent on each question
let questionTimerInterval = null;

let isSignUpMode = false;
let currentUser = null;
let currentLanguage = 'EN'; // 'EN' or 'HI'

let pendingExamConfig = null;
let currentPaperId = '2026_07_JAN_SHIFT1';

function cleanNewlines(str) {
  if (!str) return '';
  return str.replace(/\\n/g, '\n');
}

function normalizeUnit(unitStr) {
  if (!unitStr) return 'General';
  let clean = unitStr.replace(/^Unit\s+\d+:\s*/i, '').trim();
  if (clean === 'Reading Comprehension') return 'Comprehension';
  return clean;
}

// 1. INITIALISATION & DYNAMIC CYCLE / PAPER DETECTION
async function initQuiz() {
  await checkUserSession();
  try {
    const { data, error } = await db
      .from('questions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error("Supabase Error:", error);
      return;
    }

    if (data && data.length > 0) {
      allQuestions = data.map(q => ({
        id: q.id,
        paper_id: q.paper_id,
        cycle: q.cycle || 'DEC_2025',
        unit: normalizeUnit(q.unit),
        question_text: cleanNewlines(q.question_text),
        question_text_hi: cleanNewlines(q.question_text_hi),
        layout_text: cleanNewlines(q.layout_text),
        options: [cleanNewlines(q.option_a), cleanNewlines(q.option_b), cleanNewlines(q.option_c), cleanNewlines(q.option_d)],
        options_hi: (q.option_a_hi || q.option_b_hi) ? [cleanNewlines(q.option_a_hi), cleanNewlines(q.option_b_hi), cleanNewlines(q.option_c_hi), cleanNewlines(q.option_d_hi)] : null,
        correct_option: q.correct_option,
        ai_hint: cleanNewlines(q.ai_hint)
      }));

      const totalQuestionsCount = allQuestions.length;
      
      const uniquePaperSet = new Set(
        allQuestions
          .map(q => q.paper_id)
          .filter(id => id && !id.includes('[REPLACE'))
      );
      
      const paperList = Array.from(uniquePaperSet);
      if (paperList.length === 0) paperList.push('2026_07_JAN_SHIFT1');

      const totalPapersCount = paperList.length;

      const qStatElem = document.getElementById('stat-question-count');
      const pStatElem = document.getElementById('stat-paper-count');

      if (qStatElem) qStatElem.innerText = totalQuestionsCount;
      if (pStatElem) pStatElem.innerText = totalPapersCount;

      populateCycleDropdown();
    }
  } catch (err) {
    console.error("Data fetch exception:", err);
  } finally {
    setTimeout(updateThemeQuestionLimit, 200);
  }
}

function getCycleDisplayName(cycleId) {
  const cycleNames = {
    'DEC_2025': 'December 2025 Cycle',
    'JUNE_2025': 'June 2025 Cycle',
    'DEC_2024': 'December 2024 Cycle',
    'JUNE_2024': 'June 2024 Cycle'
  };
  return cycleNames[cycleId] || cycleId.replace(/_/g, ' ');
}

function getPaperDisplayName(paperId) {
  return paperId.replace(/_/g, ' ').replace(/-/g, ' ');
}

function populateCycleDropdown() {
  const cycleSelect = document.getElementById('cycle-select');
  if (!cycleSelect) return;

  const uniqueCycles = [...new Set(allQuestions.map(q => q.cycle || 'DEC_2025'))].filter(Boolean);

  cycleSelect.innerHTML = '<option value="ALL">All Exam Cycles</option>';

  uniqueCycles.forEach(cycleId => {
    const opt = document.createElement('option');
    opt.value = cycleId;
    opt.innerText = getCycleDisplayName(cycleId);
    cycleSelect.appendChild(opt);
  });

  populatePaperDropdown();
}

function populatePaperDropdown() {
  const cycleSelect = document.getElementById('cycle-select');
  const paperSelect = document.getElementById('paper-select');
  if (!paperSelect) return;

  const selectedCycle = cycleSelect ? cycleSelect.value : 'ALL';

  const matchingQuestions = allQuestions.filter(q => 
    selectedCycle === 'ALL' || (q.cycle || 'DEC_2025') === selectedCycle
  );

  const uniquePapers = [...new Set(matchingQuestions.map(q => q.paper_id))].filter(Boolean);

  paperSelect.innerHTML = '';

  if (uniquePapers.length === 0) {
    paperSelect.innerHTML = `<option value="">No papers available for this cycle</option>`;
    updateFullTestInfo();
    return;
  }

  uniquePapers.forEach(paperId => {
    const opt = document.createElement('option');
    opt.value = paperId;
    opt.innerText = getPaperDisplayName(paperId);
    paperSelect.appendChild(opt);
  });

  if (uniquePapers.length > 0) {
    currentPaperId = uniquePapers[0];
    updateFullTestInfo();
  }
}

function updateFullTestInfo() {
  const paperSelect = document.getElementById('paper-select');
  if (paperSelect && paperSelect.value) currentPaperId = paperSelect.value;

  const paperQuestions = allQuestions.filter(q => q.paper_id === currentPaperId);
  const countDisp = document.getElementById('full-test-count-display');
  if (countDisp) countDisp.innerText = `${paperQuestions.length} Questions`;
}

// 2. DASHBOARD & THEME SELECTION HELPERS
function showLandingPage() {
  if (!isSubmitted && questions.length > 0) {
    if (!confirm("Are you sure you want to exit? Your active test progress will be lost.")) return;
  }
  stopTimers();
  
  // Unlock Viewport
  document.body.classList.remove('h-screen', 'overflow-hidden');
  
  document.getElementById('top-timer-box')?.classList.add('hidden');
  document.getElementById('landing-view')?.classList.remove('hidden');
  document.getElementById('quiz-view')?.classList.add('hidden');
  document.getElementById('quiz-view')?.classList.remove('flex');
}

function updateThemeQuestionLimit() {
  const themeSelect = document.getElementById('theme-select');
  const slider = document.getElementById('question-slider');
  
  if (!themeSelect || !slider) return;

  const selectedTheme = themeSelect.value;
  const themeQuestions = allQuestions.filter(q => q.unit === selectedTheme);
  const maxCount = themeQuestions.length > 0 ? themeQuestions.length : 5;

  slider.max = maxCount;
  slider.value = maxCount;
  syncQuestionCount(maxCount);
}

function syncQuestionCount(val) {
  const countDisp = document.getElementById('question-count-display');
  const timeDisp = document.getElementById('calculated-time-text');
  
  if (countDisp) countDisp.innerText = `${val} Qs`;
  if (timeDisp) timeDisp.innerText = `Allocated Time: ${val} Minutes (1 min/question)`;
}

// 3. PREPARE & LAUNCH EXAM
function prepareTest(mode) {
  if (!currentUser) {
    openAuthModal('LOGIN');
    return;
  }

  if (mode === 'FULL') {
    const paperSelect = document.getElementById('paper-select');
    if (paperSelect && paperSelect.value) currentPaperId = paperSelect.value;

    const paperQuestions = allQuestions.filter(q => q.paper_id === currentPaperId);
    
    pendingExamConfig = {
      mode: `Full Test (${getPaperDisplayName(currentPaperId)})`,
      questions: paperQuestions.length > 0 ? paperQuestions : [...allQuestions].slice(0, 50),
      duration: 3600
    };
  } else {
    const themeSelect = document.getElementById('theme-select');
    const slider = document.getElementById('question-slider');
    
    const selectedTheme = themeSelect ? themeSelect.value : 'Teaching Aptitude';
    const requestedCount = slider ? parseInt(slider.value) : 5;
    
    const filtered = allQuestions.filter(q => q.unit === selectedTheme).slice(0, requestedCount);

    pendingExamConfig = {
      mode: selectedTheme,
      questions: filtered.length > 0 ? filtered : [...allQuestions].slice(0, requestedCount),
      duration: requestedCount * 60
    };
  }

  const instCount = document.getElementById('inst-count');
  const instTime = document.getElementById('inst-time');
  
  if (instCount) instCount.innerText = pendingExamConfig.questions.length;
  if (instTime) instTime.innerText = `${Math.floor(pendingExamConfig.duration / 60)} Minutes`;
  
  document.getElementById('instruction-modal')?.classList.remove('hidden');
}

function closeInstructionModal() {
  document.getElementById('instruction-modal')?.classList.add('hidden');
}

function launchExam() {
  closeInstructionModal();
  if (!pendingExamConfig) return;

  questions = pendingExamConfig.questions;
  masterTimeRemaining = pendingExamConfig.duration;

  currentIndex = 0;
  userAnswers = new Array(questions.length).fill(null);
  reviewStatus = new Array(questions.length).fill(false);
  questionTimeSpent = new Array(questions.length).fill(0);
  isSubmitted = false;

  document.getElementById('submit-btn')?.classList.remove('hidden');
  
  // Lock Viewport for strict exam mode
  document.body.classList.add('h-screen', 'overflow-hidden');

  document.getElementById('landing-view')?.classList.add('hidden');
  document.getElementById('quiz-view')?.classList.remove('hidden');
  document.getElementById('quiz-view')?.classList.add('flex');
  document.getElementById('top-timer-box')?.classList.remove('hidden');
  document.getElementById('top-timer-box')?.classList.add('flex');

  renderPalette();
  if (questions.length > 0) loadQuestion(0);
  startMasterTimer();
}

// 4. DYNAMIC MODULAR LAYOUT & QUESTION LOGIC
function togglePalette() {
  const palette = document.getElementById('pane-palette');
  if (!palette) return;

  if (palette.classList.contains('hidden')) {
    palette.classList.remove('hidden');
    palette.classList.add('flex');
  } else {
    palette.classList.add('hidden');
    palette.classList.remove('flex');
  }
}

function toggleLanguage() {
  currentLanguage = (currentLanguage === 'EN') ? 'HI' : 'EN';
  loadQuestion(currentIndex);
}

function loadQuestion(index) {
  if (questions.length === 0) return;
  
  // Pause and switch per-question timer
  currentIndex = index;
  startQuestionTimer(index);

  const q = questions[index];

  const qNum = document.getElementById('question-number');
  const qUnit = document.getElementById('question-unit');
  const qText = document.getElementById('question-text');
  const langToggleBtn = document.getElementById('lang-toggle-btn');

  // Auto-Detect Bilingual Support for Active Question
  const hasHindi = q.question_text_hi || (q.options_hi && q.options_hi.some(Boolean));
  if (hasHindi && langToggleBtn) {
    langToggleBtn.classList.remove('hidden');
    langToggleBtn.innerText = currentLanguage === 'EN' ? 'E / अ' : 'अ / E';
  } else if (langToggleBtn) {
    langToggleBtn.classList.add('hidden');
    currentLanguage = 'EN';
  }

  if (qNum) qNum.innerText = `Q ${index + 1} / ${questions.length}`;
  if (qUnit) qUnit.innerText = q.unit || "General";
  
  // Display Question Text based on active language choice
  const activeQText = (currentLanguage === 'HI' && q.question_text_hi) ? q.question_text_hi : q.question_text;
  if (qText) qText.innerHTML = activeQText;

  // Intelligent Pane Splitting Logic (2-Pane vs 3-Pane)
  const paneLayout = document.getElementById('pane-layout');
  const layoutText = document.getElementById('layout-text');
  
  if (q.layout_text && q.layout_text.trim() !== "") {
    layoutText.innerHTML = q.layout_text;
    paneLayout.classList.remove('hidden');
    paneLayout.classList.add('flex');
  } else {
    layoutText.innerHTML = '';
    paneLayout.classList.add('hidden');
    paneLayout.classList.remove('flex');
  }

  const optionsContainer = document.getElementById('options-container');
  if (optionsContainer) {
    optionsContainer.innerHTML = '';

    const activeOptions = (currentLanguage === 'HI' && q.options_hi) ? q.options_hi : q.options;

    activeOptions.forEach((optText, optIdx) => {
      const isSelected = userAnswers[index] === optIdx;
      let borderClass = isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-slate-300';
      
      if (isSubmitted) {
        if (optIdx === q.correct_option) {
          borderClass = 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold';
        } else if (isSelected && optIdx !== q.correct_option) {
          borderClass = 'border-rose-600 bg-rose-50 text-rose-900';
        }
      }

      const optDiv = document.createElement('div');
      optDiv.className = `p-4 border-2 rounded-lg cursor-pointer transition flex items-center gap-3 bg-white ${borderClass}`;
      optDiv.onclick = () => selectOption(optIdx);

      optDiv.innerHTML = `
        <div class="w-5 h-5 rounded-full border-2 border-slate-400 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600' : ''}">
          ${isSelected ? '<div class="w-2 h-2 bg-white rounded-full"></div>' : ''}
        </div>
        <span class="text-sm sm:text-base">${optText}</span>
      `;
      optionsContainer.appendChild(optDiv);
    });
  }

  const hintContainer = document.getElementById('hint-container');
  const hintText = document.getElementById('hint-text');
  if (hintContainer && hintText) {
    if (isSubmitted) {
      hintText.innerText = q.ai_hint;
      hintContainer.classList.remove('hidden');
    } else {
      hintContainer.classList.add('hidden');
    }
  }

  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) prevBtn.disabled = index === 0;

  if (isSubmitted) {
    document.getElementById('quiz-action-bar')?.classList.add('hidden');
  } else {
    document.getElementById('quiz-action-bar')?.classList.remove('hidden');
    document.getElementById('quiz-action-bar')?.classList.add('flex');
  }
  
  renderPalette();

  // Trigger Math Rendering
  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById('pane-question'), {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false}
      ],
      throwOnError: false
    });
    if (!paneLayout.classList.contains('hidden')) {
      renderMathInElement(paneLayout, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    }
  }
}

function selectOption(optIdx) {
  if (isSubmitted) return;
  userAnswers[currentIndex] = optIdx;
  loadQuestion(currentIndex);
}

function clearResponse() {
  if (isSubmitted) return;
  userAnswers[currentIndex] = null;
  loadQuestion(currentIndex);
}

function openReportModal() {
  document.getElementById('report-modal')?.classList.remove('hidden');
}

function closeReportModal() {
  document.getElementById('report-modal')?.classList.add('hidden');
  const commentInput = document.getElementById('report-comment');
  if (commentInput) commentInput.value = '';
}

async function submitReport() {
  const reportType = document.getElementById('report-type')?.value;
  const comment = document.getElementById('report-comment')?.value;
  const currentQ = questions[currentIndex];

  if (!currentQ) return;

  try {
    console.log(`Reported Q ID ${currentQ.id}: ${reportType} - ${comment}`);
    alert("Thank you! Your feedback has been submitted for review.");
    closeReportModal();
  } catch (err) {
    alert("Could not submit report: " + err.message);
  }
}

function toggleReview() {
  if (isSubmitted) return;
  reviewStatus[currentIndex] = !reviewStatus[currentIndex];
  renderPalette();
}

function navigate(direction) {
  const newIndex = currentIndex + direction;
  if (newIndex >= 0 && newIndex < questions.length) loadQuestion(newIndex);
}

function renderPalette() {
  const grid = document.getElementById('palette-grid');
  if (!grid) return;
  grid.innerHTML = '';

  questions.forEach((_, idx) => {
    let btnColor = 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300';
    
    if (idx === currentIndex) {
      btnColor = 'bg-indigo-600 text-white font-bold ring-2 ring-indigo-900 ring-offset-1';
    } else if (reviewStatus[idx]) {
      btnColor = 'bg-amber-400 text-amber-950 font-bold border-transparent';
    } else if (userAnswers[idx] !== null) {
      btnColor = 'bg-emerald-500 text-white font-bold border-transparent';
    }

    const btn = document.createElement('button');
    btn.className = `w-9 h-9 text-xs rounded-lg transition flex items-center justify-center ${btnColor}`;
    btn.innerText = idx + 1;
    btn.onclick = () => loadQuestion(idx);
    grid.appendChild(btn);
  });
}

// 5. DUAL-TIMER ENGINE
function startMasterTimer() {
  if (masterTimerInterval) clearInterval(masterTimerInterval);
  
  updateMasterTimerDisplay();

  masterTimerInterval = setInterval(() => {
    if (masterTimeRemaining <= 0) {
      stopTimers();
      executeSubmission(true);
    } else {
      masterTimeRemaining--;
      updateMasterTimerDisplay();
    }
  }, 1000);
}

function updateMasterTimerDisplay() {
  const mins = Math.floor(masterTimeRemaining / 60);
  const secs = masterTimeRemaining % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  
  const topTimerDisp = document.getElementById('top-timer-display');
  if (topTimerDisp) topTimerDisp.innerText = formatted;
}

function startQuestionTimer(qIdx) {
  if (questionTimerInterval) clearInterval(questionTimerInterval);

  updateQuestionTimerDisplay(qIdx);

  if (isSubmitted) return;

  questionTimerInterval = setInterval(() => {
    questionTimeSpent[qIdx] = (questionTimeSpent[qIdx] || 0) + 1;
    updateQuestionTimerDisplay(qIdx);
  }, 1000);
}

function updateQuestionTimerDisplay(qIdx) {
  const spent = questionTimeSpent[qIdx] || 0;
  const mins = Math.floor(spent / 60);
  const secs = spent % 60;
  const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const qTimerDisp = document.getElementById('q-timer-display');
  if (qTimerDisp) qTimerDisp.innerText = formatted;
}

function stopTimers() {
  if (masterTimerInterval) clearInterval(masterTimerInterval);
  if (questionTimerInterval) clearInterval(questionTimerInterval);
}

// 6. SUBMISSION & RESULTS
function confirmSubmitModal() {
  document.getElementById('submit-confirm-modal')?.classList.remove('hidden');
}

function closeSubmitConfirmModal() {
  document.getElementById('submit-confirm-modal')?.classList.add('hidden');
}

async function executeSubmission(isAuto = false) {
  closeSubmitConfirmModal();

  isSubmitted = true;
  stopTimers();

  let correctCount = 0;
  let unitStats = {};

  questions.forEach((q, idx) => {
    const isCorrect = userAnswers[idx] === q.correct_option;
    if (isCorrect) correctCount++;

    if (!unitStats[q.unit]) unitStats[q.unit] = { total: 0, correct: 0 };
    unitStats[q.unit].total++;
    if (isCorrect) unitStats[q.unit].correct++;
  });

  const marksObtained = correctCount * 2;
  const totalPossibleMarks = questions.length * 2;
  const totalQs = questions.length > 0 ? questions.length : 1;
  const percentage = ((correctCount / totalQs) * 100).toFixed(2);
  const timeTaken = pendingExamConfig ? (pendingExamConfig.duration - masterTimeRemaining) : 0;

  try {
    if (currentUser) {
      const studentName = currentUser.user_metadata?.full_name || 'Student';

      await db.from('test_submissions').insert([{
        user_id: currentUser.id,
        user_email: currentUser.email,
        student_name: studentName,
        paper_id: currentPaperId,
        test_mode: pendingExamConfig ? pendingExamConfig.mode : 'Full Test',
        total_questions: questions.length,
        correct_answers: correctCount,
        score_percentage: parseFloat(percentage),
        time_taken_seconds: timeTaken,
        unit_breakdown: unitStats
      }]);
    }
  } catch (err) {
    console.error("Error saving submission:", err.message);
  }

  document.getElementById('submit-btn')?.classList.add('hidden');

  const resScore = document.getElementById('res-score');
  const resPerc = document.getElementById('res-percentage');
  const resTime = document.getElementById('res-time');

  if (resScore) resScore.innerText = `${marksObtained} / ${totalPossibleMarks} Marks (${correctCount}/${questions.length} Qs)`;
  if (resPerc) resPerc.innerText = `${percentage}%`;
  if (resTime) resTime.innerText = `${Math.floor(timeTaken / 60)} mins ${timeTaken % 60} secs`;

  document.getElementById('result-modal')?.classList.remove('hidden');

  loadQuestion(0);
}

function closeResultModal() {
  document.getElementById('result-modal')?.classList.add('hidden');
}

// 7. AUTHENTICATION & HISTORY
async function checkUserSession() {
  const { data } = await db.auth.getUser();
  const user = data?.user;
  
  const userDisp = document.getElementById('user-email-display');
  const userPill = document.getElementById('user-pill');
  const authGroup = document.getElementById('auth-buttons-group');

  if (user) {
    currentUser = user;
    const displayName = user.user_metadata?.full_name || user.email;
    if (userDisp) userDisp.innerText = `👋 ${displayName}`;
    if (userPill) userPill.classList.remove('hidden');
    if (authGroup) authGroup.classList.add('hidden');
  } else {
    currentUser = null;
    if (userPill) userPill.classList.add('hidden');
    if (authGroup) authGroup.classList.remove('hidden');
  }
}

function openAuthModal(mode = 'LOGIN') {
  isSignUpMode = (mode === 'REGISTER');
  updateAuthModalUI();
  document.getElementById('auth-modal')?.classList.remove('hidden');
}

function closeAuthModal() {
  document.getElementById('auth-modal')?.classList.add('hidden');
}

function switchAuthMode() {
  isSignUpMode = !isSignUpMode;
  updateAuthModalUI();
}

function updateAuthModalUI() {
  const title = document.getElementById('auth-title');
  const btn = document.getElementById('auth-submit-btn');
  const toggleTxt = document.getElementById('auth-toggle-text');
  const toggleBtn = document.getElementById('auth-toggle-btn');
  const nameGroup = document.getElementById('name-field-group');

  if (title) title.innerText = isSignUpMode ? "Student Registration" : "Student Login";
  if (btn) btn.innerText = isSignUpMode ? "Sign Up" : "Login";
  if (toggleTxt) toggleTxt.innerText = isSignUpMode ? "Already have an account?" : "Don't have an account?";
  if (toggleBtn) toggleBtn.innerText = isSignUpMode ? "Login" : "Sign Up";

  if (nameGroup) {
    if (isSignUpMode) {
      nameGroup.classList.remove('hidden');
    } else {
      nameGroup.classList.add('hidden');
    }
  }
}

async function handleAuthSubmit() {
  const nameInput = document.getElementById('auth-name');
  const emailInput = document.getElementById('auth-email');
  const passInput = document.getElementById('auth-password');

  const fullName = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    alert("Please enter both email and password.");
    return;
  }

  if (isSignUpMode && !fullName) {
    alert("Please enter your Full Name.");
    return;
  }

  try {
    if (isSignUpMode) {
      const { error } = await db.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) throw error;
    } else {
      const { error } = await db.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
    closeAuthModal();
    await checkUserSession();
  } catch (err) {
    alert("Authentication Error: " + err.message);
  }
}

async function handleLogout() {
  await db.auth.signOut();
  await checkUserSession();
  showLandingPage();
}

async function toggleHistoryModal() {
  const modal = document.getElementById('history-modal');
  if (!modal) return;
  modal.classList.toggle('hidden');

  if (!modal.classList.contains('hidden')) {
    const container = document.getElementById('history-list');
    if (!container) return;

    if (!currentUser) {
      container.innerHTML = `<p class="text-sm text-slate-500">Please log in to view your test history.</p>`;
      return;
    }

    const { data, error } = await db
      .from('test_submissions')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('submitted_at', { ascending: false });

    if (error || !data || data.length === 0) {
      container.innerHTML = `<p class="text-sm text-slate-500">No test attempts recorded yet.</p>`;
      return;
    }

    container.innerHTML = data.map(item => `
      <div class="p-4 border rounded-xl bg-slate-50 flex justify-between items-center">
        <div>
          <span class="text-xs font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">${item.test_mode}</span>
          <p class="text-xs text-slate-500 mt-1">${new Date(item.submitted_at).toLocaleString()}</p>
        </div>
        <div class="text-right">
          <span class="text-lg font-bold text-slate-800">${item.correct_answers * 2} Marks (${item.correct_answers}/${item.total_questions} Qs)</span>
          <span class="text-xs font-semibold block text-emerald-600">${item.score_percentage}% Score</span>
        </div>
      </div>
    `).join('');
  }
}

window.onload = initQuiz;
