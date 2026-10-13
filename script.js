(() => {
  'use strict';

  const STORAGE_KEY = 'cct360-who-lives-here-v2';
  const TOTAL_ITEMS = 9;
  const GUESS_THRESHOLD = 6;

  const sceneConfig = {
    overview: { image: 'images/overview.png', title: 'APARTMENT', layer: 'overviewLayer' },
    bedroom: { image: 'images/bedroom.png', title: 'BEDROOM', layer: 'bedroomLayer' },
    desk: { image: 'images/desk.png', title: 'BEDROOM / DESK', layer: 'deskLayer' },
    kitchen: { image: 'images/kitchen.png', title: 'KITCHEN', layer: 'kitchenLayer' },
    living: { image: 'images/title-bg.png', title: 'LIVING ROOM', layer: 'livingLayer' }
  };

  const items = {
    mugNote: {
      title: 'Weekly Class Note',
      type: 'evidence',
      note: '2:00–5:00 PM — CC 2130. Don’t forget Wednesday.',
      kicker: 'EVIDENCE',
      image: 'images/mug.jpg'
    },
    laptopFiles: {
      title: 'Course Folders',
      type: 'evidence',
      note: 'The laptop contains several CCT course folders. Art-history files only appear after the USB is connected.',
      kicker: 'STRONG EVIDENCE'
    },
    sketchbook: {
      title: 'Sketchbook',
      type: 'evidence',
      note: 'Layout sketches, visual studies, typography ideas, and exhibition notes.',
      kicker: 'EVIDENCE'
    },
    agoBrochure: {
      title: 'AGO Exhibition Brochure',
      type: 'evidence',
      note: 'An exhibition brochure from the Art Gallery of Ontario with a few notes inside.',
      kicker: 'EVIDENCE',
      image: 'images/ago-brochure.jpg'
    },
    usb: {
      title: 'USB Drive',
      type: 'evidence',
      note: 'A USB drive from the desk drawer. When connected, it reveals FAH262 and FAS folders with exhibition and painting research.',
      kicker: 'ITEM FOUND'
    },
    fridge: {
      title: 'Almost Empty Fridge',
      type: 'other',
      note: 'Half a carton of milk, one egg, yesterday’s takeout, and an iced coffee.',
      kicker: 'ITEM FOUND',
      image: 'images/fridge.jpg'
    },
    vegetarianCabinet: {
      title: 'Food Cabinet',
      type: 'other',
      note: 'The cabinet is stocked mostly with vegetarian convenience food.',
      kicker: 'ITEM FOUND',
      image: 'images/vegetarian-cabinet.jpg'
    },
    vitamins: {
      title: 'Vitamin Cabinet',
      type: 'other',
      note: 'Several bottles of vitamins are stored together.',
      kicker: 'ITEM FOUND',
      image: 'images/vitamins.jpg'
    },
    receipt: {
      title: 'Walmart Receipt',
      type: 'other',
      note: 'Groceries, tissues, and a few household items. Probably not very helpful.',
      kicker: 'ITEM FOUND',
      image: 'images/walmart-receipt.jpg'
    }
  };

  const defaultState = () => ({
    player: '',
    found: [],
    currentScene: 'overview',
    laptopUnlocked: false,
    usbTaken: false,
    usbInserted: false,
    introSeen: false,
    completed: false
  });

  let state = loadState() || defaultState();
  let toastTimer = null;
  let lastToastItem = null;
  let majorSelections = [];

  const $ = (id) => document.getElementById(id);
  const screens = ['homeScreen', 'profileScreen', 'introScreen', 'gameScreen', 'quizScreen'];

  const homeScreen = $('homeScreen');
  const profileScreen = $('profileScreen');
  const introScreen = $('introScreen');
  const gameScreen = $('gameScreen');
  const quizScreen = $('quizScreen');
  const startBtn = $('startBtn');
  const continueBtn = $('continueBtn');
  const howBtn = $('howBtn');
  const playerName = $('playerName');
  const profileError = $('profileError');
  const createFileBtn = $('createFileBtn');
  const profileBackBtn = $('profileBackBtn');
  const beginInvestigationBtn = $('beginInvestigationBtn');
  const scene = $('scene');
  const sceneBackdrop = $('sceneBackdrop');
  const sceneTitle = $('sceneTitle');
  const headerCount = $('headerCount');
  const headerProgressBar = $('headerProgressBar');
  const sceneBackBtn = $('sceneBackBtn');
  const progressText = $('progressText');
  const progressBar = $('progressBar');
  const guessBtn = $('guessBtn');
  const notebookBtn = $('notebookBtn');
  const notebookPlayer = $('notebookPlayer');
  const notebookCount = $('notebookCount');
  const evidenceList = $('evidenceList');
  const otherList = $('otherList');
  const notebookGuessStatus = $('notebookGuessStatus');
  const modal = $('modal');
  const modalVisual = $('modalVisual');
  const modalKicker = $('modalKicker');
  const modalTitle = $('modalTitle');
  const modalBody = $('modalBody');
  const modalActions = $('modalActions');
  const laptopModal = $('laptopModal');
  const computerLogin = $('computerLogin');
  const computerDesktop = $('computerDesktop');
  const passwordInput = $('passwordInput');
  const passwordError = $('passwordError');
  const unlockBtn = $('unlockBtn');
  const fah262Folder = $('fah262Folder');
  const fasFolder = $('fasFolder');
  const usbStatus = $('usbStatus');
  const insertUsbBtn = $('insertUsbBtn');
  const folderWindow = $('folderWindow');
  const folderTitle = $('folderTitle');
  const folderContents = $('folderContents');
  const closeFolder = $('closeFolder');
  const addLaptopFilesBtn = $('addLaptopFilesBtn');
  const quizStepLabel = $('quizStepLabel');
  const quizContent = $('quizContent');
  const exitQuizBtn = $('exitQuizBtn');
  const toast = $('toast');
  const toastLabel = $('toastLabel');
  const toastTitle = $('toastTitle');
  const toastViewBtn = $('toastViewBtn');

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const merged = { ...defaultState(), ...parsed };
      merged.found = Array.isArray(merged.found) ? merged.found.filter(id => Object.prototype.hasOwnProperty.call(items, id)) : [];
      if (!merged.usbTaken) merged.usbInserted = false;
      return merged;
    } catch (err) {
      console.warn('Could not load save file.', err);
      return null;
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (err) { console.warn('Could not save progress.', err); }
    updateContinueButton();
  }

  function clearState() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    state = defaultState();
    updateContinueButton();
  }

  function showScreen(id) {
    screens.forEach(screenId => $(screenId).classList.toggle('is-active', screenId === id));
  }

  function updateContinueButton() {
    continueBtn.disabled = !(state.player && (state.introSeen || state.found.length > 0 || state.currentScene !== 'overview'));
  }

  function startNewGame() {
    const hasExisting = Boolean(loadState()?.player);
    if (hasExisting) {
      openModal({
        kicker: 'NEW INVESTIGATION',
        title: 'Start over?',
        body: '<p>Starting a new investigation will replace the saved progress on this device.</p>',
        actions: [
          { label: 'CANCEL', close: true },
          { label: 'START NEW GAME', primary: true, onClick: () => { clearState(); closeModal(); playerName.value = ''; showScreen('profileScreen'); setTimeout(() => playerName.focus(), 50); } }
        ]
      });
      return;
    }
    clearState();
    playerName.value = '';
    showScreen('profileScreen');
    setTimeout(() => playerName.focus(), 50);
  }

  function continueGame() {
    const saved = loadState();
    if (!saved?.player) return;
    state = saved;
    showScreen('gameScreen');
    setScene(state.currentScene || 'overview', false);
    updateAllUI();
  }

  function createProfile() {
    const name = playerName.value.trim();
    if (!name) {
      profileError.textContent = 'Please enter an investigator name.';
      playerName.focus();
      return;
    }
    state = defaultState();
    state.player = name;
    saveState();
    profileError.textContent = '';
    showScreen('introScreen');
  }

  function beginInvestigation() {
    state.introSeen = true;
    state.currentScene = 'overview';
    saveState();
    showScreen('gameScreen');
    setScene('overview');
    updateAllUI();
  }

  function setScene(sceneName, animate = true) {
    if (!sceneConfig[sceneName]) sceneName = 'overview';
    state.currentScene = sceneName;
    saveState();
    scene.dataset.scene = sceneName;
    sceneBackdrop.style.backgroundImage = `url('${sceneConfig[sceneName].image}')`;
    sceneTitle.textContent = sceneConfig[sceneName].title;
    document.querySelectorAll('.scene-layer').forEach(layer => layer.classList.add('hidden'));
    $(sceneConfig[sceneName].layer).classList.remove('hidden');
    document.querySelectorAll('.room-nav button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.room === sceneName || (sceneName === 'desk' && btn.dataset.room === 'bedroom'));
    });
    if (animate) {
      sceneBackdrop.classList.remove('scene-enter');
      void sceneBackdrop.offsetWidth;
      sceneBackdrop.classList.add('scene-enter');
    }
  }

  function collectItem(id) {
    // Inspecting an object does not automatically save it.
    // The player must choose ADD TO NOTEBOOK inside the evidence card.
    showItemDetail(id);
  }

  function addToNotebook(id) {
    const item = items[id];
    if (!item || state.found.includes(id)) return;
    state.found.push(id);
    saveState();
    updateAllUI();
    closeModal();
    showAddedToast(id);
    if (state.found.length === GUESS_THRESHOLD) setTimeout(showToastReady, 1000);
  }

  function showAddedToast(id) {
    const item = items[id];
    if (!item) return;
    lastToastItem = id;
    clearTimeout(toastTimer);
    toastLabel.textContent = 'ADDED TO NOTEBOOK';
    toastTitle.textContent = item.title;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 5200);
  }

  function showToastReady() {
    clearTimeout(toastTimer);
    lastToastItem = null;
    toastLabel.textContent = 'ENOUGH EVIDENCE COLLECTED';
    toastTitle.textContent = 'You can now make a deduction.';
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 5200);
  }

  function detailActions(id) {
    if (state.found.includes(id)) {
      return [
        { label: 'IN NOTEBOOK', primary: true, onClick: () => { closeModal(); openNotebook(); } },
        { label: 'CLOSE', close: true }
      ];
    }
    return [
      { label: 'ADD TO NOTEBOOK', primary: true, onClick: () => addToNotebook(id) },
      { label: 'CLOSE', close: true }
    ];
  }

  function showItemDetail(id) {
    const item = items[id];
    if (!item) return;
    if (id === 'mugNote') {
      openModal({
        kicker: item.kicker,
        title: item.title,
        image: item.image,
        visualMode: 'contain',
        body: `<p>You lift the mug and find a sticky note underneath.</p><div class="quote-note">2:00–5:00 PM — CC 2130<br>Don’t forget Wednesday.</div><p>The room number may be useful somewhere else.</p>`,
        actions: detailActions(id)
      });
      return;
    }
    if (id === 'agoBrochure') {
      openModal({ kicker: item.kicker, title: item.title, image: item.image, visualMode: 'contain', body: `<p>${item.note}</p>`, actions: detailActions(id) });
      return;
    }
    if (id === 'receipt') {
      openModal({ kicker: item.kicker, title: item.title, image: item.image, visualMode: 'contain', body: `<p>${item.note}</p>`, actions: detailActions(id) });
      return;
    }
    openModal({ kicker: item.kicker, title: item.title, image: item.image, body: `<p>${item.note}</p>`, actions: detailActions(id) });
  }

  function inspectBackpack() {
    openModal({
      kicker: 'OBSERVATION',
      title: 'Backpack',
      body: '<p>Inside are a charging cable, a pencil case, and a few crumpled sheets of paper.</p><p>Nothing here clearly proves who the resident is.</p>',
      actions: [{ label: 'CLOSE', close: true }]
    });
  }

  function inspectKitchenDrawer() {
    openModal({
      kicker: 'OBSERVATION',
      title: 'Kitchen Drawer',
      body: '<p>A few chopsticks, takeout menus, rubber bands, and spare batteries.</p><p>Nothing here seems useful for identifying the resident.</p>',
      actions: [{ label: 'CLOSE', close: true }]
    });
  }

  function openModal({ kicker = '', title = '', body = '', image = '', actions = [], visualMode = 'cover' }) {
    modalKicker.textContent = kicker;
    modalTitle.textContent = title;
    modalBody.innerHTML = body;
    modalActions.innerHTML = '';
    if (image) {
      modalVisual.classList.remove('hidden');
      modalVisual.style.backgroundImage = `url('${image}')`;
      modalVisual.classList.toggle('visual-contain', visualMode === 'contain');
    } else {
      modalVisual.classList.add('hidden');
      modalVisual.style.backgroundImage = '';
      modalVisual.classList.remove('visual-contain');
    }
    actions.forEach(action => {
      const btn = document.createElement('button');
      btn.textContent = action.label;
      if (action.primary) btn.classList.add('primary');
      btn.addEventListener('click', () => {
        if (action.onClick) action.onClick();
        if (action.close) closeModal();
      });
      modalActions.appendChild(btn);
    });
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function openHowToPlay() {
    openModal({
      kicker: 'HOW TO PLAY',
      title: 'Investigate the apartment',
      body: `<p>Explore the Bedroom, Kitchen, and Living Room. Move through each space and inspect objects that seem important.</p><p>When you find something, inspect it and choose <strong>ADD TO NOTEBOOK</strong> if you want to keep it in your Case File. Some objects are useful evidence; others may simply tell you about the resident’s everyday life.</p><p>Find at least <strong>6 of 9 items</strong> to unlock the final theory. Use the evidence to decide who lives here.</p>`,
      actions: [{ label: 'CLOSE', close: true }]
    });
  }

  function bedObservation() {
    openModal({ kicker: 'OBSERVATION', title: 'Nothing unusual here', body: '<p>The bed is neatly made. It does not seem to tell you much about the resident.</p>', actions: [{ label: 'CLOSE', close: true }] });
  }

  function inspectDrawer() {
    if (!state.usbTaken) {
      openModal({
        kicker: 'DESK DRAWER',
        title: 'Something is inside',
        body: '<p>Among notebooks, cables, and stationery, you find a small USB drive.</p>',
        actions: [
          { label: 'LEAVE IT', close: true },
          { label: 'TAKE USB', primary: true, onClick: () => { state.usbTaken = true; saveState(); closeModal(); showItemDetail('usb'); } }
        ]
      });
    } else {
      showItemDetail('usb');
    }
  }

  function openLaptop() {
    laptopModal.classList.add('open');
    laptopModal.setAttribute('aria-hidden', 'false');
    folderWindow.classList.add('hidden');
    passwordError.textContent = '';
    if (state.laptopUnlocked) showDesktop();
    else {
      computerLogin.classList.remove('hidden');
      computerDesktop.classList.add('hidden');
      passwordInput.value = '';
      setTimeout(() => passwordInput.focus(), 100);
    }
  }

  function closeLaptop() {
    laptopModal.classList.remove('open');
    laptopModal.setAttribute('aria-hidden', 'true');
  }

  function unlockLaptop() {
    if (passwordInput.value.trim() === '2130') {
      state.laptopUnlocked = true;
      saveState();
      showDesktop();
    } else {
      passwordError.textContent = 'Incorrect password.';
      passwordInput.select();
    }
  }

  function showDesktop() {
    computerLogin.classList.add('hidden');
    computerDesktop.classList.remove('hidden');
    fah262Folder.classList.toggle('hidden', !state.usbInserted);
    fasFolder.classList.toggle('hidden', !state.usbInserted);
    insertUsbBtn.classList.toggle('hidden', !state.usbTaken || state.usbInserted);
    if (state.usbInserted) usbStatus.textContent = 'USB drive connected — FAH262H5 and FAS available';
    else if (state.usbTaken) usbStatus.textContent = 'USB drive available — not connected';
    else usbStatus.textContent = 'No external drive';
  }

  function insertUsb() {
    if (!state.usbTaken || state.usbInserted) return;
    insertUsbBtn.disabled = true;
    usbStatus.textContent = 'Connecting USB…';
    setTimeout(() => {
      state.usbInserted = true;
      saveState();
      insertUsbBtn.disabled = false;
      showDesktop();
    }, 650);
  }

  function openFolder(name) {
    const cctFolders = ['CCT360H5', 'CCT356H5', 'CCT353H5'];
    const usbCourseFolders = ['FAH262H5', 'FAS'];
    folderTitle.textContent = name;
    folderWindow.classList.remove('hidden');
    addLaptopFilesBtn.classList.add('hidden');

    if (cctFolders.includes(name)) {
      addLaptopFilesBtn.classList.remove('hidden');
      addLaptopFilesBtn.textContent = state.found.includes('laptopFiles') ? 'CCT COURSE FOLDERS IN NOTEBOOK' : 'ADD CCT COURSE FOLDERS TO NOTEBOOK';
      addLaptopFilesBtn.disabled = state.found.includes('laptopFiles');
      const courseContent = {
        CCT360H5: [['assignment_1', 'HTML / CSS / JavaScript'], ['week_05_notes', 'web interaction'], ['references', 'course material']],
        CCT356H5: [['campaign_project', 'presentation'], ['ad_mockups', 'creative files'], ['research_notes', 'PDF']],
        CCT353H5: [['image_sound_project', 'video'], ['edit_notes', 'text'], ['exports', 'folder']]
      };
      folderContents.innerHTML = courseContent[name].map(row => `<div class="file-row"><span>${row[0]}</span><small>${row[1]}</small></div>`).join('');
    } else if (usbCourseFolders.includes(name)) {
      if (!state.usbInserted) {
        folderContents.innerHTML = `<div class="file-row"><span>Drive unavailable</span><small>Insert the USB first.</small></div>`;
        return;
      }
      const usbContent = name === 'FAH262H5'
        ? [['Exhibition Research', 'document'], ['Painting Analysis', 'document'], ['Gallery Notes', 'document']]
        : [['Exhibition Research', 'document'], ['Painting Analysis', 'document'], ['Gallery Notes', 'document']];
      folderContents.innerHTML = usbContent.map(row => `<div class="file-row"><span>${row[0]}</span><small>${row[1]}</small></div>`).join('');
    }
    updateAllUI();
  }

  function openNotebook() {
    renderNotebook();
    $('caseFile').classList.add('open');
    $('caseFile').setAttribute('aria-hidden', 'false');
  }

  function closeNotebook() {
    $('caseFile').classList.remove('open');
    $('caseFile').setAttribute('aria-hidden', 'true');
  }

  function renderNotebook() {
    notebookPlayer.textContent = `Investigator: ${state.player || 'Unknown'}`;
    notebookCount.textContent = `${state.found.length} / ${TOTAL_ITEMS} items found`;
    const evidence = Object.entries(items).filter(([, item]) => item.type === 'evidence');
    const other = Object.entries(items).filter(([, item]) => item.type === 'other');
    evidenceList.innerHTML = evidence.map(([id, item]) => clueRow(id, item)).join('');
    otherList.innerHTML = other.map(([id, item]) => clueRow(id, item)).join('');
    if (state.found.length >= GUESS_THRESHOLD) {
      notebookGuessStatus.className = 'notebook-status ready';
      notebookGuessStatus.innerHTML = `<strong>Enough information collected.</strong><br>You can now make a final guess.`;
    } else {
      notebookGuessStatus.className = 'notebook-status';
      notebookGuessStatus.innerHTML = `Find <strong>${GUESS_THRESHOLD - state.found.length} more</strong> item${GUESS_THRESHOLD - state.found.length === 1 ? '' : 's'} to unlock your final theory.`;
    }
  }

  function clueRow(id, item) {
    const found = state.found.includes(id);
    return `<div class="clue-row ${found ? '' : 'missing'}"><span class="mark">${found ? '✓' : '○'}</span><span class="clue-name">${found ? item.title : 'Not found yet'}${found ? `<span class="clue-note">${item.note}</span>` : ''}</span></div>`;
  }

  function updateAllUI() {
    const count = state.found.length;
    headerCount.textContent = `${count} / ${TOTAL_ITEMS}`;
    if (headerProgressBar) headerProgressBar.style.width = `${(count / TOTAL_ITEMS) * 100}%`;
    progressText.textContent = `${count} / ${TOTAL_ITEMS} items found`;
    progressBar.style.width = `${(count / TOTAL_ITEMS) * 100}%`;
    const ready = count >= GUESS_THRESHOLD;
    guessBtn.disabled = !ready;
    guessBtn.textContent = ready ? 'MAKE A DEDUCTION' : `FIND ${GUESS_THRESHOLD - count} MORE TO MAKE A DEDUCTION`;
    updateContinueButton();
    renderNotebook();
    if (state.laptopUnlocked) showDesktop();
  }

  function startQuiz() {
    if (state.found.length < GUESS_THRESHOLD) return;
    closeNotebook();
    showScreen('quizScreen');
    renderRoleQuestion();
  }

  function renderRoleQuestion() {
    quizScreen.classList.remove('wrong-mode', 'solved-mode');
    exitQuizBtn.classList.remove('hidden');
    quizStepLabel.classList.remove('hidden');
    quizStepLabel.textContent = '1 / 3';
    quizContent.innerHTML = `
      <p class="eyebrow dark">FINAL THEORY</p>
      <h2>Who is this person?</h2>
      <p class="quiz-help">Start with the broadest conclusion. Which identity best matches the evidence you collected?</p>
      <div class="choice-grid">
        <button class="choice" data-role-choice="student">A STUDENT</button>
        <button class="choice" data-role-choice="working">A WORKING PROFESSIONAL</button>
      </div>`;
  }

  function renderWorkQuestion() {
    quizScreen.classList.remove('wrong-mode', 'solved-mode');
    exitQuizBtn.classList.remove('hidden');
    quizStepLabel.classList.remove('hidden');
    quizStepLabel.textContent = '1 / 3';
    quizContent.innerHTML = `
      <p class="eyebrow dark">WORKING PROFESSIONAL</p>
      <h2>What kind of work?</h2>
      <p class="quiz-help">Some objects could suggest a creative or academic career. Choose the theory that seems strongest.</p>
      <div class="choice-grid">
        <button class="choice" data-work-choice="professor">UNIVERSITY PROFESSOR</button>
        <button class="choice" data-work-choice="designer">FULL-TIME DESIGNER</button>
        <button class="choice" data-work-choice="museum">MUSEUM WORKER</button>
        <button class="choice" data-work-choice="freelancer">FREELANCER</button>
      </div>
      <div id="workFeedback"></div>
      <button class="quiz-submit" data-return-role>← RECONSIDER</button>`;
  }

  function renderWrongResult() {
    quizScreen.classList.add('wrong-mode');
    quizScreen.classList.remove('solved-mode');
    exitQuizBtn.classList.add('hidden');
    quizStepLabel.classList.add('hidden');
    quizStepLabel.textContent = 'THEORY INCOMPLETE';
    quizContent.innerHTML = `
      <div class="result-panel wrong-result">
        <p class="result-kicker">THEORY INCOMPLETE</p>
        <h2>SOMETHING DOESN’T<br>ADD UP.</h2>
        <p class="result-copy">At least one major part of your theory conflicts with the evidence. Re-open the notebook, then return to the apartment and look for patterns rather than single objects.</p>
        <div class="result-meta"><span>${state.found.length}/${TOTAL_ITEMS} evidence</span><span>${new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
        <div class="result-actions stacked">
          <button class="result-primary" data-review-clues>REVIEW EVIDENCE</button>
          <button class="result-secondary" data-return-apartment>RETURN TO APARTMENT</button>
          <button class="result-secondary" data-play-again>PLAY AGAIN</button>
        </div>
      </div>`;
  }

  function renderSchoolQuestion() {
    quizScreen.classList.remove('wrong-mode', 'solved-mode');
    exitQuizBtn.classList.remove('hidden');
    quizStepLabel.classList.remove('hidden');
    quizStepLabel.textContent = '2 / 3';
    quizContent.innerHTML = `
      <p class="eyebrow dark">STUDENT</p>
      <h2>Where does this person study?</h2>
      <p class="quiz-help">Look carefully at the course codes and the kind of coursework found on the laptop.</p>
      <div class="choice-grid">
        <button class="choice" data-school-choice="utm">UNIVERSITY OF TORONTO MISSISSAUGA</button>
        <button class="choice" data-school-choice="sheridan">SHERIDAN COLLEGE</button>
      </div>
      <div id="schoolFeedback"></div>`;
  }

  function renderMajorQuestion() {
    quizScreen.classList.remove('wrong-mode', 'solved-mode');
    exitQuizBtn.classList.remove('hidden');
    quizStepLabel.classList.remove('hidden');
    quizStepLabel.textContent = '3 / 3';
    majorSelections = [];
    const majors = [
      ['ccit', 'Communication, Culture, Information & Technology (CCIT)'],
      ['aah', 'Art & Art History'],
      ['cs', 'Computer Science'],
      ['psych', 'Psychology'],
      ['econ', 'Economics'],
      ['english', 'English'],
      ['bio', 'Biology'],
      ['stats', 'Statistics']
    ];
    quizContent.innerHTML = `
      <p class="eyebrow dark">UTM STUDENT</p>
      <h2>What are the two majors?</h2>
      <p class="quiz-help">This student is completing a <strong>double major</strong>. Select exactly two programs.</p>
      <div class="major-grid">${majors.map(([id, label]) => `<button class="major-option" data-major="${id}">${label}</button>`).join('')}</div>
      <button id="submitMajors" class="quiz-submit" disabled>SUBMIT THEORY</button>
      <div id="majorFeedback"></div>`;
  }

  function toggleMajor(btn) {
    const id = btn.dataset.major;
    if (majorSelections.includes(id)) {
      majorSelections = majorSelections.filter(x => x !== id);
      btn.classList.remove('selected');
    } else {
      if (majorSelections.length >= 2) return;
      majorSelections.push(id);
      btn.classList.add('selected');
    }
    $('submitMajors').disabled = majorSelections.length !== 2;
  }

  function submitMajors() {
    const correct = ['ccit', 'aah'];
    const hits = majorSelections.filter(id => correct.includes(id)).length;
    if (hits === 2) {
      state.completed = true;
      saveState();
      renderSolved();
      return;
    }
    renderWrongResult();
  }

  function renderSolved() {
    quizScreen.classList.add('solved-mode');
    quizScreen.classList.remove('wrong-mode');
    exitQuizBtn.classList.add('hidden');
    quizStepLabel.classList.add('hidden');
    quizStepLabel.textContent = 'CASE SOLVED';
    quizContent.innerHTML = `
      <div class="solved-layout">
        <div class="solved-visual">
          <div class="solved-photo"><img src="images/bedroom.png" alt="The resident's bedroom"><span>A student living at UTM ☺</span></div>
          <div class="solved-note">Good things<br>take time. :)</div>
        </div>
        <div class="solved-info">
          <h2>You got it right!</h2>
          <p class="solved-subtitle">Here’s who lives here.</p>
          <div class="identity-row"><span class="identity-icon">◯</span><div><small>STATUS</small><strong>University student</strong></div></div>
          <div class="identity-row"><span class="identity-icon">⌖</span><div><small>LOCATION</small><strong>UTM</strong></div></div>
          <div class="identity-row"><span class="identity-icon">▤</span><div><small>FIELD</small><strong>CCIT &amp; Art &amp; Art History</strong></div></div>
          <div class="identity-row"><span class="identity-icon">☕</span><div><small>DAILY LIFE</small><strong>Relies on quick meals and coffee</strong></div></div>
          <div class="solved-actions">
            <button class="result-primary" data-save-exit>SAVE &amp; EXIT</button>
            <button class="result-secondary" data-play-again>PLAY AGAIN</button>
          </div>
        </div>
      </div>`;
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>'"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function leaveQuiz() {
    showScreen('gameScreen');
    setScene(state.currentScene || 'overview', false);
    updateAllUI();
  }

  /* Event wiring */
  startBtn.addEventListener('click', startNewGame);
  continueBtn.addEventListener('click', continueGame);
  howBtn.addEventListener('click', openHowToPlay);
  createFileBtn.addEventListener('click', createProfile);
  profileBackBtn.addEventListener('click', () => showScreen('homeScreen'));
  playerName.addEventListener('keydown', e => { if (e.key === 'Enter') createProfile(); });
  beginInvestigationBtn.addEventListener('click', beginInvestigation);
  $('homeLogoBtn').addEventListener('click', () => { showScreen('homeScreen'); updateContinueButton(); });

  document.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.querySelectorAll('[data-close-notebook]').forEach(el => el.addEventListener('click', closeNotebook));
  document.querySelectorAll('[data-close-laptop]').forEach(el => el.addEventListener('click', closeLaptop));

  notebookBtn.addEventListener('click', openNotebook);
  sceneBackBtn.addEventListener('click', () => {
    if (state.currentScene === 'desk') setScene('bedroom');
    else if (state.currentScene === 'overview') { showScreen('homeScreen'); updateContinueButton(); }
    else setScene('overview');
  });
  guessBtn.addEventListener('click', startQuiz);
  exitQuizBtn.addEventListener('click', leaveQuiz);

  document.querySelectorAll('.room-nav button').forEach(btn => btn.addEventListener('click', () => setScene(btn.dataset.room)));
  document.querySelectorAll('[data-enter]').forEach(btn => btn.addEventListener('click', () => setScene(btn.dataset.enter)));

  scene.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const map = {
      'open-desk': () => setScene('desk'),
      'back-bedroom': () => setScene('bedroom'),
      'bed-observation': bedObservation,
      'inspect-mug': () => collectItem('mugNote'),
      'open-laptop': openLaptop,
      'inspect-sketchbook': () => collectItem('sketchbook'),
      'inspect-brochure': () => collectItem('agoBrochure'),
      'inspect-drawer': inspectDrawer,
      'inspect-fridge': () => collectItem('fridge'),
      'inspect-food-cabinet': () => collectItem('vegetarianCabinet'),
      'inspect-vitamin-cabinet': () => collectItem('vitamins'),
      'inspect-kitchen-drawer': inspectKitchenDrawer,
      'inspect-receipt': () => collectItem('receipt'),
      'inspect-backpack': inspectBackpack
    };
    if (map[action]) map[action]();
  });

  unlockBtn.addEventListener('click', unlockLaptop);
  insertUsbBtn.addEventListener('click', insertUsb);
  passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') unlockLaptop(); });
  document.querySelectorAll('.folder-icon').forEach(btn => btn.addEventListener('click', () => openFolder(btn.dataset.folder)));
  closeFolder.addEventListener('click', () => folderWindow.classList.add('hidden'));
  addLaptopFilesBtn.addEventListener('click', () => {
    if (state.found.includes('laptopFiles')) return;
    state.found.push('laptopFiles');
    saveState();
    updateAllUI();
    addLaptopFilesBtn.textContent = 'COURSE FOLDERS IN NOTEBOOK';
    addLaptopFilesBtn.disabled = true;
    showAddedToast('laptopFiles');
    if (state.found.length === GUESS_THRESHOLD) setTimeout(showToastReady, 1000);
  });

  toastViewBtn.addEventListener('click', () => {
    toast.classList.remove('show');
    if (quizScreen.classList.contains('is-active')) leaveQuiz();
    openNotebook();
  });

  quizContent.addEventListener('click', e => {
    const role = e.target.closest('[data-role-choice]');
    const work = e.target.closest('[data-work-choice]');
    const school = e.target.closest('[data-school-choice]');
    const major = e.target.closest('[data-major]');
    if (role) role.dataset.roleChoice === 'student' ? renderSchoolQuestion() : renderWorkQuestion();
    if (work) renderWrongResult();
    if (school) {
      if (school.dataset.schoolChoice === 'utm') renderMajorQuestion();
      else renderWrongResult();
    }
    if (major) toggleMajor(major);
    if (e.target.closest('#submitMajors')) submitMajors();
    if (e.target.closest('[data-return-role]')) renderRoleQuestion();
    if (e.target.closest('[data-review-clues]')) { leaveQuiz(); openNotebook(); }
    if (e.target.closest('[data-return-apartment]')) leaveQuiz();
    if (e.target.closest('[data-save-exit]')) {
      saveState();
      showScreen('homeScreen');
      updateContinueButton();
    }
    if (e.target.closest('[data-play-again]')) { clearState(); showScreen('profileScreen'); playerName.value = ''; }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (modal.classList.contains('open')) closeModal();
    else if ($('caseFile').classList.contains('open')) closeNotebook();
    else if (laptopModal.classList.contains('open')) closeLaptop();
  });

  // Initial UI
  updateContinueButton();
  updateAllUI();
  setScene(state.currentScene || 'overview', false);
})();
