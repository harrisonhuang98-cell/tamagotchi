(() => {
  'use strict';
  const KEY = 'bloom-savings-v1';
  const $ = id => document.getElementById(id);
  const names = ['Seedling', 'Sprout', 'Bloom', 'Guardian'];
  const thresholds = [0, .25, .5, 1];
  const descriptions = ['A tiny buddy with a whole lot of potential.', 'Growing roots, one little habit at a time.', 'Your care is turning into something beautiful.', 'A little reminder of everything you’ve grown.'];
  let state = { name: 'My little freedom fund', goal: 100000, entries: [], sound: false };
  let storageAvailable = true;
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && typeof saved.name === 'string' && Number.isSafeInteger(saved.goal) && saved.goal > 0 && Array.isArray(saved.entries)) {
      const ids = new Set();
      let sum = 0;
      const entries = saved.entries.filter(e => {
        if (!e || !Number.isSafeInteger(e.amount) || e.amount <= 0 || e.amount > 10000000000 || typeof e.id !== 'string' || ids.has(e.id) || !Number.isFinite(Date.parse(e.date)) || !Number.isSafeInteger(sum + e.amount)) return false;
        ids.add(e.id); sum += e.amount; return true;
      });
      state = { name: saved.name.trim().slice(0, 50) || state.name, goal: Math.min(10000000000, Math.max(100, saved.goal)), sound: !!saved.sound, entries };
    }
  } catch { /* A damaged record must not prevent a fresh start. */ }
  try { const probe = KEY + '-check'; localStorage.setItem(probe, '1'); localStorage.removeItem(probe); } catch { storageAvailable = false; }
  function notify(message) {
    $('form-message').textContent = message;
    $('storage-message').textContent = storageAvailable ? '' : 'Browser storage is unavailable. Progress lasts for this visit only.';
  }
  const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100);
  const total = () => state.entries.reduce((sum, e) => sum + e.amount, 0);
  const level = () => thresholds.reduce((current, threshold, i) => total() / state.goal >= threshold ? i : current, 0);
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); storageAvailable = true; }
    catch { storageAvailable = false; }
  }
  function render() {
    const sum = total(), ratio = sum / state.goal, stage = level();
    $('goal-name').textContent = state.name + ' ✷';
    $('balance').textContent = money(sum);
    $('goal-total').textContent = money(state.goal);
    $('percentage').textContent = Math.floor(ratio * 100) + '%';
    $('progress-bar').style.width = Math.min(ratio * 100, 100) + '%';
    const progress = $('progress-bar').parentElement;
    if (progress) {
      progress.setAttribute('role', 'progressbar');
      progress.setAttribute('aria-label', 'Savings goal progress');
      progress.setAttribute('aria-valuemin', '0');
      progress.setAttribute('aria-valuemax', '100');
      progress.setAttribute('aria-valuenow', String(Math.min(100, Math.floor(ratio * 100))));
      progress.setAttribute('aria-valuetext', `${money(sum)} saved toward ${money(state.goal)}`);
    }
    $('progress-text').textContent = sum ? (ratio >= 1 ? 'You did it. Look how far you’ve grown!' : 'Little by little, you’re getting there') : 'Your first little step starts here';
    $('stage-badge').textContent = 'THE ' + names[stage].toUpperCase();
    $('level-label').textContent = 'LEVEL 0' + (stage + 1);
    $('pet').dataset.level = stage;
    $('pet').setAttribute('aria-label', 'Pip, your ' + names[stage].toLowerCase() + ' buddy');
    $('buddy-description').textContent = descriptions[stage];
    $('next-title').textContent = stage === 3 ? 'Your dream has bloomed!' : 'A new chapter is on its way';
    $('next-detail').textContent = stage === 3 ? 'Every small step brought you here. Keep growing.' : `Save ${money(Math.max(0, Math.ceil(state.goal * thresholds[stage + 1]) - sum))} more to meet the ${names[stage + 1]}.`;
    document.querySelectorAll('[data-stage]').forEach((card, i) => {
      card.classList.toggle('current', i === stage);
      card.classList.toggle('unlocked', i < stage);
      card.querySelector('.stage-status').textContent = i === stage ? 'YOU ARE HERE' : i < stage ? 'GROWN WITH LOVE ✓' : `${thresholds[i] * 100}% OF YOUR GOAL`;
    });
    $('deposit-count').textContent = `${state.entries.length} little step${state.entries.length === 1 ? '' : 's'} forward`;
    $('sound').setAttribute('aria-pressed', String(state.sound));
    $('sound').querySelector('span').textContent = state.sound ? 'Sound on' : 'Sound off';
    const history = $('history'); history.replaceChildren();
    if (!state.entries.length) { const p = document.createElement('p'); p.className = 'empty-history'; p.textContent = 'Your story starts with your first save. Make it a little one. ✧'; history.append(p); }
    state.entries.slice().reverse().forEach(entry => {
      const row = document.createElement('div'); row.className = 'history-row';
      const icon = document.createElement('span'); icon.className = 'history-icon'; icon.textContent = '↗';
      const caption = document.createElement('div'); caption.textContent = 'A little closer to your dream';
      const date = document.createElement('small'); date.textContent = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); caption.append(date);
      const amount = document.createElement('strong'); amount.textContent = '+' + money(entry.amount);
      const undo = document.createElement('button'); undo.className = 'undo'; undo.textContent = 'Undo'; undo.setAttribute('aria-label', `Undo ${money(entry.amount)} saved on ${date.textContent}`);
      undo.addEventListener('click', () => { state.entries = state.entries.filter(e => e.id !== entry.id); persist(); render(); $('speech').textContent = 'Your pace is a good pace. ♡'; notify('Entry removed. Your journey is still yours.'); $('amount').focus(); });
      row.append(icon, caption, amount, undo); history.append(row);
    });
    $('storage-message').textContent = storageAvailable ? '' : 'Browser storage is unavailable. Progress lasts for this visit only.';
  }
  let audio;
  function chime() {
    if (!state.sound) return;
    try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); [523.25, 659.25, 783.99].forEach((frequency, i) => { const osc = audio.createOscillator(), gain = audio.createGain(), start = audio.currentTime + i * .09; osc.type = 'sine'; osc.frequency.value = frequency; gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.07, start + .015); gain.gain.exponentialRampToValueAtTime(.001, start + .3); osc.connect(gain); gain.connect(audio.destination); osc.start(start); osc.stop(start + .31); }); } catch { /* Sound is optional. */ }
  }
  function celebrate(evolved) {
    const device = $('device'); device.classList.remove('happy'); void device.offsetWidth; device.classList.add('happy'); setTimeout(() => device.classList.remove('happy'), 700);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let i = 0; i < (evolved ? 60 : 24); i++) { const piece = document.createElement('i'); piece.className = 'confetti'; piece.style.left = Math.random() * 100 + '%'; piece.style.background = ['#c5ec69', '#b9a0e2', '#f2a0ad', '#f5d06a'][i % 4]; piece.style.animationDelay = Math.random() * .35 + 's'; $('celebration').append(piece); setTimeout(() => piece.remove(), 2300); }
    }
    chime();
  }
  document.querySelectorAll('[data-amount]').forEach(button => button.addEventListener('click', () => { $('amount').value = button.dataset.amount; $('amount').focus(); }));
  $('save-form').addEventListener('submit', event => {
    event.preventDefault(); const amount = Math.round(Number($('amount').value) * 100);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 10000000000 || !Number.isSafeInteger(total() + amount)) { $('form-message').textContent = 'Enter a valid positive amount up to $100,000,000.'; return; }
    const before = level(); state.entries.push({ id: window.crypto?.randomUUID?.() || Date.now() + '-' + Math.random(), amount, date: new Date().toISOString() }); persist(); render();
    const evolved = level() > before; $('amount').value = '';
    $('speech').textContent = evolved ? `Hello, ${names[level()]} era! Look at us grow. ♡` : ['You showed up for your future. ♡', 'Small steps. Big little dreams. ✧', 'That’s a little more room to grow!'][state.entries.length % 3];
    notify(evolved ? `Pip evolved into the ${names[level()]}! ${money(amount)} saved.` : `${money(amount)} saved. Pip is rooting for you!`);
    celebrate(evolved);
  });
  $('edit-goal').addEventListener('click', () => { $('goal-title').value = state.name; $('goal-amount').value = state.goal / 100; $('goal-dialog').showModal(); });
  document.querySelector('.close-dialog').addEventListener('click', () => $('goal-dialog').close());
  $('goal-dialog').addEventListener('click', event => { if (event.target === $('goal-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
  $('goal-title').addEventListener('input', () => $('goal-title').setCustomValidity(''));
  $('goal-form').addEventListener('submit', event => { event.preventDefault(); const name = $('goal-title').value.trim(), goal = Math.round(Number($('goal-amount').value) * 100); if (!name) { $('goal-title').setCustomValidity('Give your dream a name.'); $('goal-title').reportValidity(); return; } if (!Number.isSafeInteger(goal) || goal < 100 || goal > 10000000000) return; state.name = name; state.goal = goal; persist(); render(); $('goal-dialog').close(); $('speech').textContent = 'A fresh dream. Let’s grow together. ♡'; notify('Goal updated. Pip’s stage now reflects your new target.'); });
  $('sound').addEventListener('click', () => { state.sound = !state.sound; persist(); render(); chime(); });
  $('pet-button').addEventListener('click', () => { $('speech').textContent = ['I’m proud of your little steps. ♡', 'Your pace is a good pace. ✧', 'We’ve got this. One day at a time.'][Math.floor(Math.random() * 3)]; celebrate(false); });
  render();
})();
