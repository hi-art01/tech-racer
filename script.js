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
const rhetorisiserView = document.querySelector('#rhetorisiserView');
const rhetorisiserInput = document.querySelector('#rhetorisiserInput');
const rhetorisiserOutput = document.querySelector('#rhetorisiserOutput');
const extractStatus = document.querySelector('#extractStatus');
const copyResultButton = document.querySelector('#copyResultButton');
let words = [], index = 0, timer = null, paused = false;

function getWords() { return input.value.trim().split(/\s+/).filter(Boolean); }
function updateCount() { const count = getWords().length; wordCount.textContent = `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'}`; }
function updateSlider() { const percent = ((speedInput.value - 100) / 400) * 100; speedValue.textContent = speedInput.value; speedInput.style.background = `linear-gradient(90deg, var(--accent) ${percent}%, #30343e ${percent}%)`; }
function showWord() { if (index >= words.length) return finish(); const start = Math.max(0, index - 2); const end = Math.min(words.length, index + 4); wordStream.innerHTML = words.slice(start, end).map((word, offset) => { const distance = start + offset - index; const state = distance === 0 ? 'active' : Math.abs(distance) === 1 ? 'near' : distance > 0 ? 'future' : 'far'; return `<span class="stream-word ${state}">${escapeHtml(word)}</span>`; }).join(''); wordStream.style.animation = 'none'; void wordStream.offsetWidth; wordStream.style.animation = 'streamIn .22s ease-out'; progressText.textContent = `${(index + 1).toLocaleString()} / ${words.length.toLocaleString()} words`; const percent = Math.round(((index + 1) / words.length) * 100); progressPercent.textContent = `${percent}%`; progressBar.style.width = `${percent}%`; }
function escapeHtml(value) { return value.replace(/[&<>'"]/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[character])); }
function nextWord() { const wpm = Number(speedInput.value); readerSpeed.textContent = `${wpm} WPM`; showWord(); index += 1; timer = setTimeout(nextWord, 60000 / wpm); }
function start() { words = getWords(); if (!words.length) { input.focus(); input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 450); return; } setupView.hidden = true; readerView.hidden = false; index = 0; paused = false; pauseLabel.textContent = 'Pause'; readerSpeed.textContent = `${speedInput.value} WPM`; nextWord(); }
function finish() { clearTimeout(timer); timer = null; paused = true; wordStream.innerHTML = '<span class="stream-word active">Finished</span>'; pauseLabel.textContent = 'Replay'; progressBar.style.width = '100%'; progressPercent.textContent = '100%'; }
function togglePause() { if (!words.length) return; if (index >= words.length) { index = 0; paused = false; pauseLabel.textContent = 'Pause'; nextWord(); return; } paused = !paused; clearTimeout(timer); pauseLabel.textContent = paused ? 'Resume' : 'Pause'; if (!paused) nextWord(); }
function restart() { clearTimeout(timer); index = 0; paused = false; pauseLabel.textContent = 'Pause'; nextWord(); }
function back() { clearTimeout(timer); timer = null; readerView.hidden = true; setupView.hidden = false; }
input.addEventListener('input', updateCount); speedInput.addEventListener('input', updateSlider); startButton.addEventListener('click', start); pauseButton.addEventListener('click', togglePause); document.querySelector('#restartButton').addEventListener('click', restart); document.querySelector('#backButton').addEventListener('click', back); document.querySelector('#readerSpeedButton').addEventListener('click', back);
fileInput.addEventListener('change', () => { const file = fileInput.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = e => { input.value = e.target.result; updateCount(); }; reader.readAsText(file); });
document.addEventListener('keydown', e => { if (e.code === 'Space' && (!setupView.hidden || !rhetorisiserView.hidden)) return; if (e.code === 'Space' && !readerView.hidden) { e.preventDefault(); togglePause(); } if (e.key.toLowerCase() === 'r' && !readerView.hidden) restart(); if (e.key === 'Escape' && !readerView.hidden) back(); if (e.key === 'Escape' && !rhetorisiserView.hidden) document.querySelector('#toolBackButton').click(); });
updateCount(); updateSlider();

function isBoldElement(element) {
  const weight = element.style.fontWeight;
  return element.tagName === 'B' || element.tagName === 'STRONG' || weight === 'bold' || weight === 'bolder' || Number(weight) >= 600;
}

function isHighlightedElement(element) {
  const style = element.style;
  const background = style.backgroundColor || style.background || element.getAttribute('bgcolor') || style.getPropertyValue('mso-highlight');
  return element.tagName === 'MARK' || Boolean(background && background !== 'transparent' && background !== 'none');
}

const allowedPasteTags = new Set(['A','B','BLOCKQUOTE','BR','CODE','DEL','DIV','EM','I','LI','MARK','OL','P','S','SMALL','SPAN','STRIKE','STRONG','SUB','SUP','U','UL']);
const allowedPasteStyles = new Set(['background-color','color','font-family','font-size','font-style','font-weight','text-decoration','text-decoration-color','text-decoration-line','vertical-align']);
function sanitizePastedNode(node) {
  if (node.nodeType === Node.TEXT_NODE) return document.createTextNode(node.nodeValue);
  if (node.nodeType !== Node.ELEMENT_NODE || ['SCRIPT','STYLE','IFRAME','OBJECT','SVG'].includes(node.tagName)) return null;
  const source = node;
  const isBlock = /^(ADDRESS|ARTICLE|BLOCKQUOTE|DIV|H[1-6]|LI|P|PRE|TR)$/.test(source.tagName);
  const tag = isBlock ? 'div' : allowedPasteTags.has(source.tagName) ? source.tagName.toLowerCase() : 'span';
  const clean = document.createElement(tag);
  if (tag === 'a' && /^(https?:|mailto:)/i.test(source.getAttribute('href') || '')) clean.setAttribute('href', source.getAttribute('href'));
  for (const declaration of (source.getAttribute('style') || '').split(';')) {
    const colon = declaration.indexOf(':');
    if (colon < 0) continue;
    const property = declaration.slice(0, colon).trim().toLowerCase();
    const value = declaration.slice(colon + 1).trim();
    if (allowedPasteStyles.has(property) && value && !/url\s*\(|expression\s*\(/i.test(value)) clean.style.setProperty(property, value);
  }
  if (source.getAttribute('bgcolor') && !clean.style.backgroundColor) clean.style.backgroundColor = source.getAttribute('bgcolor');
  for (const child of source.childNodes) {
    const safeChild = sanitizePastedNode(child);
    if (safeChild) clean.appendChild(safeChild);
  }
  if (isBoldElement(source) && !['B','STRONG'].includes(tag.toUpperCase()) && !clean.style.fontWeight) clean.style.fontWeight = 'bold';
  if (isHighlightedElement(source) && tag !== 'mark' && !clean.style.backgroundColor) clean.style.backgroundColor = '#ffe58a';
  return clean;
}

function insertPastedContent(event) {
  event.preventDefault();
  const html = event.clipboardData.getData('text/html');
  const fragment = document.createDocumentFragment();
  if (html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    for (const child of parsed.body.childNodes) {
      const safe = sanitizePastedNode(child);
      if (safe) fragment.appendChild(safe);
    }
  } else {
    const lines = event.clipboardData.getData('text/plain').split(/\r?\n/);
    lines.forEach((line, index) => {
      if (index) fragment.append(document.createElement('br'));
      fragment.append(document.createTextNode(line));
    });
  }

  rhetorisiserInput.focus();
  const selection = window.getSelection();
  const range = selection && selection.rangeCount ? selection.getRangeAt(0) : document.createRange();
  if (!rhetorisiserInput.contains(range.commonAncestorContainer)) {
    range.selectNodeContents(rhetorisiserInput);
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(fragment);
  range.collapse(false);
  if (selection) {
    selection.removeAllRanges();
    selection.addRange(range);
  }
  rhetorisiserInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function getEmphasizedText(root) {
  let text = '';
  const blockTags = new Set(['ADDRESS', 'ARTICLE', 'BLOCKQUOTE', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'P', 'PRE', 'TR']);

  function visit(node, emphasized) {
    if (node.nodeType === Node.TEXT_NODE) {
      if (emphasized) text += node.nodeValue;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node;
    if (element.tagName === 'BR') {
      text += '\n';
      return;
    }
    const keep = emphasized || isBoldElement(element) || isHighlightedElement(element);
    const isBlock = blockTags.has(element.tagName);
    if (isBlock && text && !text.endsWith('\n')) text += '\n';
    for (const child of element.childNodes) visit(child, keep);
    if (isBlock && text && !text.endsWith('\n')) text += '\n';
  }

  visit(root, false);
  return text.replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function getEmphasizedContent(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  const preservedSeparators = new Set();
  const emphasizedText = textNode => {
    for (let element = textNode.parentElement; element && element !== root; element = element.parentElement) {
      if (isBoldElement(element) || isHighlightedElement(element)) return true;
    }
    return false;
  };
  for (let i = 0; i < textNodes.length; i += 1) {
    if (textNodes[i].nodeValue.trim()) continue;
    let previous = i - 1, next = i + 1;
    while (previous >= 0 && !textNodes[previous].nodeValue.trim()) previous -= 1;
    while (next < textNodes.length && !textNodes[next].nodeValue.trim()) next += 1;
    if (previous >= 0 && next < textNodes.length && emphasizedText(textNodes[previous]) && emphasizedText(textNodes[next])) preservedSeparators.add(textNodes[i]);
  }
  function extract(node, inheritedEmphasis) {
    if (node.nodeType === Node.TEXT_NODE) {
      return (inheritedEmphasis || preservedSeparators.has(node)) && node.nodeValue ? document.createTextNode(node.nodeValue) : null;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return null;

    const element = node;
    if (element.tagName === 'BR') return document.createElement('br');

    const emphasized = inheritedEmphasis || isBoldElement(element) || isHighlightedElement(element);
    const clone = element.cloneNode(false);
    for (const child of element.childNodes) {
      const extracted = extract(child, emphasized);
      if (extracted) clone.appendChild(extracted);
    }
    return clone.childNodes.length ? clone : null;
  }

  const content = document.createDocumentFragment();
  for (const child of root.childNodes) {
    const extracted = extract(child, false);
    if (extracted) content.append(extracted);
  }
  return content;
}

document.querySelector('#openRhetorisiser').addEventListener('click', () => {
  setupView.hidden = true;
  readerView.hidden = true;
  rhetorisiserView.hidden = false;
});
document.querySelector('#toolBackButton').addEventListener('click', () => {
  rhetorisiserView.hidden = true;
  setupView.hidden = false;
});
rhetorisiserInput.addEventListener('paste', insertPastedContent);
rhetorisiserInput.addEventListener('input', () => {
  rhetorisiserOutput.replaceChildren();
  copyResultButton.disabled = true;
  extractStatus.textContent = 'Click Rhetorisise to extract';
});
document.querySelector('#extractButton').addEventListener('click', () => {
  rhetorisiserOutput.replaceChildren(getEmphasizedContent(rhetorisiserInput));
  const outputText = rhetorisiserOutput.innerText.trim();
  const count = outputText ? outputText.split(/\s+/).length : 0;
  copyResultButton.disabled = !count;
  extractStatus.textContent = count ? `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'} kept — edit if needed` : 'No bold or highlighted text found';
});
rhetorisiserOutput.addEventListener('input', () => {
  const text = rhetorisiserOutput.innerText.trim();
  const count = text ? text.split(/\s+/).length : 0;
  copyResultButton.disabled = !count;
  extractStatus.textContent = count ? `${count.toLocaleString()} ${count === 1 ? 'word' : 'words'} — edited result` : 'Result is empty';
});
copyResultButton.addEventListener('click', async () => {
  try {
    const plainText = rhetorisiserOutput.innerText.trim();
    const html = rhetorisiserOutput.innerHTML;
    if (navigator.clipboard.write && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plainText], { type: 'text/plain' })
      })]);
    } else {
      await navigator.clipboard.writeText(plainText);
    }
    extractStatus.textContent = 'Copied to clipboard';
  } catch {
    extractStatus.textContent = 'Copy failed; select and copy the result manually';
  }
});
