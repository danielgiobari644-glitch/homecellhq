// HomeCell Vanilla JS Main Entry Point
import { initUI, checkRoute } from './ui.js';
import './style.css';

function mountApp() {
  const appElement = document.getElementById('app');
  if (appElement) {
    initUI(appElement);
    checkRoute();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

window.addEventListener('popstate', () => {
  checkRoute();
});


