(function () {
  'use strict';
  OS.i18n.restore();
  OS.renderDock();
  OS.renderDesktop();
  OS.emit('windows');

  function welcome() {
    const back = OS.h(`<div class="modal-back welcome-back" data-notr>
      <div class="dialog welcome">
        <img class="dlg-icon" src="icons/redstar.png">
        <div class="dlg-main">
          <div class="dlg-title">Welcome to Red Star OS 3.0 - fan recreation</div>
          <div class="dlg-msg">
            <p>This is just a cool fan project: a recreation of the Red Star OS 3.0 desktop in HTML, CSS and JavaScript, made by
              <a href="https://github.com/adrenaline91" target="_blank" rel="noopener noreferrer">github.com/adrenaline91</a>.</p>
            <p><b>Work in progress:</b> not all the features of the real Red Star OS are here yet. I'm still working on it.</p>
            <p>It is a tech and curiosity project only. It has no political purpose and is not meant to offend, provoke or support any country, government or people.</p>
            <p class="welcome-small">Not affiliated with the Korea Computer Center or any official organization. Icons and wallpapers belong to their respective owners.</p>
          </div>
          <div class="dlg-btns"><button class="btn default">Got it!</button></div>
        </div>
      </div>
    </div>`);
    document.getElementById('overlay-layer').appendChild(back);
    const close = () => {
      OS.store.set('welcomed', true);
      back.remove();
      document.removeEventListener('keydown', key, true);
    };
    const key = e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', key, true);
    back.querySelector('.btn').addEventListener('click', close);
    setTimeout(() => back.querySelector('.btn').focus(), 0);
  }

  const firstVisit = !OS.store.get('welcomed', false);
  const start = firstVisit
    ? welcome
    : () => OS.launch('browser', { x: 0, y: 27, w: 945, h: 689 });
  if (/[?&]nosplash\b/.test(location.search)) start();
  else OS.boot(start);
})();
