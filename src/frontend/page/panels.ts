import { querySelector, yieldArray } from '../../lib';

interface ButtonCallback {
  [key: string]: (target: HTMLElement) => void;
}

function showPanel(id: string) {
  const div = querySelector('#' + id);
  if (div.style.display === 'block') {
    hideSidebar();
  } else {
    showSidebar();
    document.querySelectorAll(`[data-panel="${id}"]`).forEach(btn => {
      btn.classList.add('active');
    });
    div.style.display = 'block';
    const tabButtons = querySelector("#sidebar .tab_buttons");
    tabButtons.querySelectorAll("button").forEach(el => {
      if (!el.classList.contains('close_panel')) {
        el.parentElement?.removeChild(el);
      }
    });

    tabButtons?.prepend(...Array.from(div.children).map(node => {
      if (node.tagName === 'BUTTON') {
        const btn = node.cloneNode(true) as HTMLButtonElement;
        wireButton(btn);
        return btn;
      }
    }).filter(node => node !== undefined) as Node[]);
  }
}

document.querySelectorAll<HTMLElement>('.buttons > *').forEach(el => {
  wireButton(el);
});

function wireButton(el: HTMLElement) {
  el.addEventListener('click', (e) => {
    const el = e.target as HTMLElement;
    const callbackName = el.dataset['callback'];
    if (callbackName !== undefined) {
      const callback = buttonCallbacks[callbackName];
      if (callback === undefined) {
        console.error('Bad button callback ', callbackName, el);
        return;
      }
      callback(el);
    }
    const panelName = el.dataset['panel'];
    if (panelName !== undefined) {
      showPanel(panelName);
    }
  });
}

function resetSidebar() {
  document.querySelectorAll<HTMLLIElement>('#sidebar>ul>li').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll<HTMLDivElement>('#sidebar>div').forEach(el => {
    el.style.display = 'none';
  });
}

function hideSidebar() {
  resetSidebar();
  querySelector('#sidebar').classList.add('collapsed');
}

function showSidebar() {
  resetSidebar();
  querySelector('#sidebar').classList.remove('collapsed');
}

/** Mapping of functions, referenced via data-callback HTML attributes */
export const buttonCallbacks: ButtonCallback = {  
  hideSidebar,
  download: () => {
    const data = Array.from(yieldArray(window.VIEW.getPackets()));
    const blob = new Blob(data, { type: 'application/json' });
    const el = window.document.createElement('a');
    el.href = window.URL.createObjectURL(blob);
    el.download = 'data.json';
    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
    window.URL.revokeObjectURL(el.href);
  }
}