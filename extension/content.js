(() => {
  if (globalThis.__readFromHere) return;
  globalThis.__readFromHere = true;
  const SKIP = 'nav,aside,footer,header,script,style,noscript,button,input,textarea,select,[contenteditable="true"],[role="navigation"],[role="complementary"],[aria-hidden="true"],[data-rfh-ui]';
  const SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,figcaption,td,th,dt,dd,div';
  let nextId = 0, blocks = new Map(), ids = new WeakMap(), highlight = null, disconnectReader = null;
  const clean = text => text.replace(/\s+/g, ' ').trim();
  function visible(element) {
    if (element.closest(SKIP) || !element.getClientRects().length) return false;
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.visibility !== 'collapse';
  }
  function rootFor(anchor) {
    if (anchor) return anchor.closest('article,main,[role="main"]') || document.body;
    const roots = [...document.querySelectorAll('article,main,[role="main"]')].filter(visible);
    return roots.sort((a,b) => b.innerText.length - a.innerText.length)[0] || document.body;
  }
  function collect(root) {
    const candidates = [...root.querySelectorAll(SELECTOR)].filter(el => {
      if (!visible(el)) return false;
      // Prefer the innermost semantic block to avoid reading nested content twice.
      if (el.matches('div')) {
        if (el.querySelector(SELECTOR)) return false;
        if (!clean(el.innerText || '')) return false;
      } else if (el.querySelector('p,li,pre,blockquote,td,th,dt,dd')) return false;
      return clean(el.innerText || '').length > 0;
    });
    return candidates;
  }
  function snapshot(anchor = null) {
    const root = rootFor(anchor);
    const candidates = collect(root);
    let start = 0;
    if (anchor) {
      start = candidates.findIndex(el => el === anchor || el.contains(anchor));
      if (start < 0) start = candidates.findIndex(el => Boolean(anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
      if (start < 0) return {title:document.title,url:location.href,blocks:[]};
    }
    blocks = new Map();
    const result = candidates.map(el => {
      if (!ids.has(el)) ids.set(el, `rfh-${++nextId}`);
      const id = ids.get(el);
      blocks.set(id, el);
      return {id, kind:el.tagName.toLowerCase(), text:clean(el.innerText)};
    });
    return {title:document.title,url:location.href,lang:document.documentElement.lang || '',startBlockId:result[start]?.id,blocks:result};
  }
  function makeBox(color) {
    const box = document.createElement('div');
    box.dataset.rfhUi = '';
    box.style.cssText = `position:fixed;z-index:2147483646;pointer-events:none;border:2px solid ${color};background:${color}18;border-radius:4px;box-sizing:border-box;display:none;`;
    document.documentElement.append(box);
    return box;
  }
  function place(box, el) {
    const rect = el.getBoundingClientRect();
    Object.assign(box.style, {display:'block',left:`${Math.max(0,rect.left-3)}px`,top:`${rect.top-3}px`,width:`${rect.width+6}px`,height:`${rect.height+6}px`});
  }
  // The connection lives exactly as long as the source is open in the reader panel.
  // Closing the panel or loading another tab removes these page listeners.
  chrome.runtime.onConnect.addListener(port => {
    if (port.name !== 'reader-page') return;
    disconnectReader?.();
    const box = makeBox('#2455da');
    const INTERACTIVE = 'a,button,input,textarea,select,label,summary,audio,video,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="textbox"],[role="menuitem"],[role="slider"],[role="checkbox"],[role="switch"]';
    let down = null, readerRoot = rootFor();
    const find = raw => {
      if (!(raw instanceof Element) || raw.closest(INTERACTIVE)) return null;
      const el = raw.closest('p,li,h1,h2,h3,h4,h5,h6,blockquote,pre,figcaption,img,td,th,dt,dd,div');
      if (!readerRoot.isConnected) readerRoot = rootFor();
      if (!el || !visible(el) || !readerRoot.contains(el)) return null;
      if (el.matches('div') && (el.querySelector(SELECTOR) || !clean(el.innerText || ''))) return null;
      return el;
    };
    const move = event => {
      const el = find(event.target);
      if (el && !event.buttons && getSelection()?.isCollapsed !== false) place(box,el);
      else box.style.display = 'none';
    };
    const pointerDown = event => { down = {x:event.clientX,y:event.clientY}; };
    const hide = () => { box.style.display = 'none'; };
    const click = event => {
      if (event.button !== 0 || event.detail > 1 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      if (getSelection()?.isCollapsed === false || (down && Math.hypot(event.clientX-down.x,event.clientY-down.y) > 6)) return;
      const el = find(event.target);
      if (!el) return;
      const page = snapshot(el);
      if (!page.blocks.length) return;
      hide();
      // Never cancel page events: links, controls, and normal text selection remain usable.
      try { port.postMessage({action:'page-clicked',page}); } catch { cleanup(); }
    };
    const cleanup = () => {
      document.removeEventListener('pointermove',move,true);
      document.removeEventListener('pointerdown',pointerDown,true);
      document.removeEventListener('pointerleave',hide,true);
      document.removeEventListener('click',click,true);
      removeEventListener('scroll',hide,true); removeEventListener('resize',hide);
      box.remove();
      if (disconnectReader === cleanup) {
        disconnectReader = null;
        highlight?.remove(); highlight = null; currentElement = null;
      }
    };
    disconnectReader = cleanup;
    port.onDisconnect.addListener(cleanup);
    document.addEventListener('pointermove',move,true);
    document.addEventListener('pointerdown',pointerDown,true);
    document.addEventListener('pointerleave',hide,true);
    document.addEventListener('click',click,true);
    addEventListener('scroll',hide,true); addEventListener('resize',hide);
  });
  let currentElement;
  const reposition = () => { if (highlight && currentElement?.isConnected) place(highlight,currentElement); };
  addEventListener('scroll',reposition,true); addEventListener('resize',reposition);
  chrome.runtime.onMessage.addListener((message,_sender,respond) => {
    if (message.target !== 'content') return;
    if (message.action === 'snapshot') respond(snapshot());
    if (message.action === 'selection') respond({title:document.title,url:location.href,lang:document.documentElement.lang,blocks:[{id:'selection',kind:'p',text:getSelection()?.toString() || ''}]});
    if (message.action === 'clear') { highlight?.remove(); highlight=null;currentElement=null;respond({ok:true}); }
    if (message.action === 'highlight') {
      const el = blocks.get(message.id);
      if (el?.isConnected) {
        currentElement = el;
        if (!highlight) highlight = makeBox('#2455da');
        if (message.follow) el.scrollIntoView({block:'center',behavior:'instant'});
        place(highlight,el);
      }
      respond({ok:true});
    }
  });
})();
