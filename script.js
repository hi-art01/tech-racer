const input = document.querySelector('#documentInput');
const fileInput = document.querySelector('#fileInput');
const wordCount = document.querySelector('#wordCount');
const speedInput = document.querySelector('#speedInput');
const speedValue = document.querySelector('#speedValue');
const startButton = document.querySelector('#startButton');
const setupView = document.querySelector('#setupView');
const readerView = document.querySelector('#readerView');
const wordStream = document.querySelector('#wordStream');
const pauseButton = document.querySelector('#pauseButton');
const pauseLabel = document.querySelector('#pauseLabel');
const progressText = document.querySelector('#progressText');
const progressPercent = document.querySelector('#progressPercent');
const progressBar = document.querySelector('#progressBar');
const readerSpeed = document.querySelector('#readerSpeed');
let words = [], index = 0, timer = null, paused = false;

function getWords() { return input.value.trim().split(/\s+/).filter(Boolean); }
function updateCount() { const count = getWords().length; wordCount.textContent = `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'}`; }
function updateSlider() { const percent = ((speedInput.value - 100) / 400) * 100; speedValue.textContent = speedInput.value; speedInput.style.background = `linear-gradient(90deg, var(--accent) ${percent}%, #30343e ${percent}%)`; }
function showWord() { if (index >= words.length) return finish(); const start = Math.max(0, index - 2); const end = Math.min(words.length, index + 4); wordStream.innerHTML = words.slice(start, end).map((word, offset) => { const distance = start + offset - index; const state = distance === 0 ? 'active' : Math.abs(distance) === 1 ? 'near' : distance > 0 ? 'future' : 'far'; return `<span class="stream-word ${state}">${escapeHtml(word)}</span>`; }).join(''); wordStream.style.animation = 'none'; void wordStream.offsetWidth; wordStream.style.animation = 'streamIn .22s ease-out'; progressText.textContent = `${(index + 1).toLocaleString()} / ${words.length.toLocaleString()} words`; const percent = Math.round(((index + 1) / words.length) * 100); progressPercent.textContent = `${percent}%`; progressBar.style.width = `${percent}%`; }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character])); }
function nextWord() { showWord(); index += 1; timer = setTimeout(nextWord, 60000 / Number(speedInput.value)); }
function start() { words = getWords(); if (!words.length) { input.focus(); input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 450); return; } setupView.hidden = true; readerView.hidden = false; index = 0; paused = false; pauseLabel.textContent = 'Pause'; readerSpeed.textContent = `${speedInput.value} WPM`; nextWord(); }
function finish() { clearTimeout(timer); timer = null; paused = true; wordStream.innerHTML = '<span class="stream-word active">Finished</span>'; pauseLabel.textContent = 'Replay'; progressBar.style.width = '100%'; progressPercent.textContent = '100%'; }
function togglePause() { if (!words.length) return; if (index >= words.length) { index = 0; paused = false; pauseLabel.textContent = 'Pause'; nextWord(); return; } paused = !paused; clearTimeout(timer); pauseLabel.textContent = paused ? 'Resume' : 'Pause'; if (!paused) nextWord(); }
function restart() { clearTimeout(timer); index = 0; paused = false; pauseLabel.textContent = 'Pause'; nextWord(); }
function back() { clearTimeout(timer); timer = null; readerView.hidden = true; setupView.hidden = false; }
input.addEventListener('input', updateCount); speedInput.addEventListener('input', updateSlider); startButton.addEventListener('click', start); pauseButton.addEventListener('click', togglePause); document.querySelector('#restartButton').addEventListener('click', restart); document.querySelector('#backButton').addEventListener('click', back); document.querySelector('#readerSpeedButton').addEventListener('click', back);
fileInput.addEventListener('change', () => { const file = fileInput.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = e => { input.value = e.target.result; updateCount(); }; reader.readAsText(file); });
document.addEventListener('keydown', e => { if (e.code === 'Space' && !setupView.hidden) return; if (e.code === 'Space') { e.preventDefault(); togglePause(); } if (e.key.toLowerCase() === 'r' && !readerView.hidden) restart(); if (e.key === 'Escape' && !readerView.hidden) back(); });
updateCount(); updateSlider();
