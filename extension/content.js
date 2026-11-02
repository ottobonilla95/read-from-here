(() => {
  if (globalThis.__readFromHere) return;
  globalThis.__readFromHere = true;
  const SKIP = 'nav,aside,footer,header,script,style,noscript,button,input,textarea,select,[contenteditable="true"],[role="navigation"],[role="complementary"],[aria-hidden="true"],[data-rfh-ui]';
  const SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,figcaption,td,th,dt,dd,div';
  let nextId = 0, blocks = new Map(), ids = new WeakMap(), picker = null, highlight = null;
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
    let candidates = collect(root);
    if (anchor) {
      let start = candidates.findIndex(el => el === anchor || el.contains(anchor));
      if (start < 0) start = candidates.findIndex(el => Boolean(anchor.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING));
      if (start < 0) return {title:document.title,url:location.href,blocks:[]};
      candidates = candidates.slice(start);
    }
    blocks = new Map();
    const result = candidates.map(el => {
      if (!ids.has(el)) ids.set(el, `rfh-${++nextId}`);
      const id = ids.get(el);
      blocks.set(id, el);
      return {id, kind:el.tagName.toLowerCase(), text:clean(el.innerText)};
    });
    return {title:document.title,url:location.href,lang:document.documentElement.lang || '',blocks:result};
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
  function cancelPick() {
    if (!picker) return;
    document.removeEventListener('pointermove', picker.move, true);
    document.removeEventListener('click', picker.click, true);
    document.removeEventListener('keydown', picker.key, true);
    picker.box.remove(); picker.note.remove(); picker = null;
  }
  function pick() {
    cancelPick();
    const box = makeBox('#2455da');
    const note = document.createElement('div');
    note.dataset.rfhUi = '';
    note.textContent = 'Click a paragraph or image to start here. Press Esc to cancel.';
    note.style.cssText = 'position:fixed;z-index:2147483647;bottom:24px;left:50%;transform:translateX(-50%);max-width:85vw;background:#182846;color:white;padding:14px 20px;border-radius:10px;font:15px/1.5 system-ui;pointer-events:none;box-shadow:0 6px 24px #18284630;';
    document.documentElement.append(note);
    let target = null;
    const find = raw => raw instanceof Element ? raw.closest('p,li,h1,h2,h3,h4,h5,h6,blockquote,pre,figcaption,img,td,th,div') : null;
    const move = event => { target = find(event.target); if (target && visible(target)) place(box,target); else box.style.display='none'; };
    const click = event => {
      const el = find(event.target);
      if (!el || !visible(el)) return;
      event.preventDefault(); event.stopImmediatePropagation();
      const page = snapshot(el); cancelPick();
      chrome.runtime.sendMessage({target:'panel',action:'picked',page}).catch(() => {});
    };
    const key = event => { if (event.key === 'Escape') { cancelPick(); chrome.runtime.sendMessage({target:'panel',action:'pick-cancelled'}).catch(() => {}); } };
    picker = {box,note,move,click,key};
    document.addEventListener('pointermove',move,true);
    document.addEventListener('click',click,true);
    document.addEventListener('keydown',key,true);
  }
  let currentElement;
  const reposition = () => { if (highlight && currentElement?.isConnected) place(highlight,currentElement); };
  addEventListener('scroll',reposition,true); addEventListener('resize',reposition);
  chrome.runtime.onMessage.addListener((message,_sender,respond) => {
    if (message.target !== 'content') return;
    if (message.action === 'snapshot') respond(snapshot());
    if (message.action === 'selection') respond({title:document.title,url:location.href,lang:document.documentElement.lang,blocks:[{id:'selection',kind:'p',text:getSelection()?.toString() || ''}]});
    if (message.action === 'pick') {pick(); respond({ok:true});}
    if (message.action === 'cancel-pick') {cancelPick(); respond({ok:true});}
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
