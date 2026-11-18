'use strict';
// Keep old bookmarks to the converter and its integrations working.
if (['#converter','#integrations','#comparison'].includes(location.hash)) {
  location.replace('converter.html'+location.search+location.hash);
}
const wipe = document.getElementById('demo-wipe');
wipe.addEventListener('input', () => {
  document.getElementById('hero-demo').style.setProperty('--split', wipe.value+'%');
  wipe.setAttribute('aria-valuetext', wipe.value+' percent original');
});

const chapters = [
  [0, 'Install the browser extension'],
  [19.42, 'Convert and compare images'],
  [66.08, 'Export from Photoshop'],
  [92.50, 'Use the Canva editor app']
];
const lesson = document.getElementById('lesson');
const chapterList = document.getElementById('chapters');
for (const [seconds, name] of chapters) {
  const link = document.createElement('button');
  const time = document.createElement('time');
  time.textContent = Math.floor(seconds/60)+':'+String(Math.floor(seconds%60)).padStart(2,'0');
  link.append(time, document.createTextNode(name));
  link.addEventListener('click', () => {
    lesson.currentTime = seconds;
    lesson.play().catch(() => lesson.focus());
  });
  chapterList.append(link);
}
