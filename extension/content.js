(() => {
  if (globalThis.__readFromHere) return;
  globalThis.__readFromHere = true;
  const SKIP = 'nav,aside,footer,header,script,style,noscript,button,input,textarea,select,[contenteditable="true"],[role="navigation"],[role="complementary"],[aria-hidden="true"],[data-rfh-ui]';
  const SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,figcaption,td,th,dt,dd,div';
  let nextId = 0, blocks = new Map(), ids = new WeakMap(), highlight = null;
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
  let host=null,shadow=null,cleanupClicks=null;
  const send=(action,extra={})=>chrome.runtime.sendMessage({target:'background',action,...extra});
  for(const [file,weight] of [['Regular','400'],['Bold','700']]){const font=new FontFace('ReadFromHere',`url('${chrome.runtime.getURL(`assets/AtkinsonHyperlegible-${file}.ttf`)}')`,{weight});document.fonts.add(font);void font.load().catch(()=>{});}
  const icon=name=>`<img src="${chrome.runtime.getURL(`assets/tabler/${name}.svg`)}" alt="" aria-hidden="true">`;
  function showToolbar(){
    if(host)return;
    host=document.createElement('rfh-reader');host.dataset.rfhUi='';
    host.style.cssText='all:initial!important;position:fixed!important;left:50%!important;bottom:24px!important;transform:translateX(-50%)!important;z-index:2147483647!important;width:min(360px,calc(100vw - 24px))!important;height:auto!important;display:block!important;color-scheme:light!important;';
    shadow=host.attachShadow({mode:'open'});
    shadow.innerHTML=`<style>

      :host{font:16px/1 ReadFromHere,system-ui,sans-serif;color:#182846}*{box-sizing:border-box}button{font:inherit;border:0;cursor:pointer;display:grid;place-items:center;flex:none;padding:0;color:#182846}button:focus-visible{outline:3px solid #2455da;outline-offset:4px}button:disabled{opacity:.4;cursor:default}button:hover:enabled{background:#e6edff}img{width:22px;height:22px;display:block;pointer-events:none}.toolbar{font:16px/1 ReadFromHere,system-ui,sans-serif;color:#182846;width:100%;height:72px;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 18px;background:#fff;border-radius:24px;box-shadow:0 6px 24px #18284626,0 2px 6px #1828460d}.play{width:52px;height:52px;border-radius:50%;background:#2455da;color:#fff}.play:hover:enabled{background:#1944b5}.play img{width:25px;height:25px;filter:brightness(0) invert(1)}.speed{display:flex;align-items:center;gap:10px}.speed button{width:32px;height:32px;border-radius:50%;background:#f1f3f7}.speed button img{width:20px;height:20px}.value{font-size:19px;font-variant-numeric:tabular-nums;min-width:56px;text-align:center}.settings{height:32px;width:45px;border-left:1px solid #dce3ef;border-radius:0;background:transparent;padding-left:16px}.settings img{width:25px;height:25px}.notice{background:#fff;color:#92243e;border-radius:12px;box-shadow:0 4px 16px #18284620;padding:12px 16px;margin:0 0 10px;font:14px/1.4 ReadFromHere,system-ui,sans-serif;overflow-wrap:anywhere}[hidden]{display:none!important}.sr-only{position:absolute;width:1px;height:1px;clip-path:inset(50%);overflow:hidden;white-space:nowrap}
      @media(max-width:340px){.toolbar{gap:8px;padding:10px 12px;height:68px}.play{width:46px;height:46px}.speed{gap:6px}.settings{width:38px;padding-left:10px}.value{min-width:48px;font-size:17px}}
    </style><p class="notice" id="notice" role="status" hidden></p><div class="toolbar" role="region" aria-label="Read from here"><button class="play" id="play" aria-label="Play" title="Play" disabled>${icon('player-play')}</button><div class="speed" role="group" aria-label="Playback speed"><button id="slower" aria-label="Slower" title="Slower">${icon('minus')}</button><output class="value" id="speed" aria-label="Playback speed" aria-live="polite">1×</output><button id="faster" aria-label="Faster" title="Faster">${icon('plus')}</button></div><button class="settings" id="settings" aria-label="Voice settings" title="Voice settings">${icon('adjustments-horizontal')}</button><span class="sr-only" id="status" role="status">Ready to listen</span></div>`;
    document.documentElement.append(host);
    shadow.getElementById('play').addEventListener('click',()=>{void send('toggle');});
    shadow.getElementById('slower').addEventListener('click',()=>{void send('speed',{delta:-1});});
    shadow.getElementById('faster').addEventListener('click',()=>{void send('speed',{delta:1});});
    shadow.getElementById('settings').addEventListener('click',()=>{void send('settings');});
    enableClicks();
  }
  function hideToolbar(){cleanupClicks?.();cleanupClicks=null;clearHighlight();host?.remove();host=null;shadow=null;}
  function updateState(state){
    if(!shadow)return;
    const playing=state.phase==='playing'||state.phase==='loading';
    const play=shadow.getElementById('play');
    play.setAttribute('aria-label',playing?'Pause':'Play');play.title=playing?'Pause':'Play';play.disabled=!state.total;
    play.firstElementChild.src=chrome.runtime.getURL(`assets/tabler/player-${playing?'pause':'play'}.svg`);
    shadow.getElementById('speed').textContent=`${Number(state.speed.toFixed(2))}×`;
    shadow.getElementById('slower').disabled=state.speed<=.5;shadow.getElementById('faster').disabled=state.speed>=3;
    shadow.getElementById('status').textContent={ready:'Ready to listen',playing:'Listening',loading:'Preparing your voice',paused:'Paused',ended:'Finished',error:'Playback stopped'}[state.phase]||'Ready to listen';
    const notice=shadow.getElementById('notice');notice.hidden=!state.error;notice.textContent=state.error||'';
  }
  function enableClicks(){
    const box=makeBox('#2455da');
    const INTERACTIVE='a,button,input,textarea,select,label,summary,audio,video,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="textbox"],[role="menuitem"],[role="slider"],[role="checkbox"],[role="switch"],[data-rfh-ui]';
    let down=null,readerRoot=rootFor();
    const find=raw=>{
      if(!(raw instanceof Element)||raw.closest(INTERACTIVE))return null;
      const el=raw.closest('p,li,h1,h2,h3,h4,h5,h6,blockquote,pre,figcaption,img,td,th,dt,dd,div');
      if(!readerRoot.isConnected)readerRoot=rootFor();
      if(!el||!visible(el)||!readerRoot.contains(el))return null;
      if(el.matches('div')&&(el.querySelector(SELECTOR)||!clean(el.innerText||'')))return null;
      return el;
    };
    const hide=()=>{box.style.display='none';};
    const move=event=>{const el=find(event.target);if(el&&!event.buttons&&getSelection()?.isCollapsed!==false)place(box,el);else hide();};
    const pointerDown=event=>{down={x:event.clientX,y:event.clientY};};
    const click=event=>{
      if(event.button!==0||event.detail>1||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey)return;
      if(getSelection()?.isCollapsed===false||(down&&Math.hypot(event.clientX-down.x,event.clientY-down.y)>6))return;
      const el=find(event.target);if(!el)return;
      const page=snapshot(el);if(!page.blocks.length)return;
      hide();void send('jump',{page});
    };
    document.addEventListener('pointermove',move,true);document.addEventListener('pointerdown',pointerDown,true);document.addEventListener('pointerleave',hide,true);document.addEventListener('click',click,true);
    addEventListener('scroll',hide,true);addEventListener('resize',hide);
    cleanupClicks=()=>{document.removeEventListener('pointermove',move,true);document.removeEventListener('pointerdown',pointerDown,true);document.removeEventListener('pointerleave',hide,true);document.removeEventListener('click',click,true);removeEventListener('scroll',hide,true);removeEventListener('resize',hide);box.remove();};
  }
  const passageName='read-from-here-passage',wordName='read-from-here-word';
  const highlightStyle=document.createElement('style');highlightStyle.dataset.rfhUi='';
  highlightStyle.textContent=`::highlight(${passageName}){background:#e6edff;color:inherit}::highlight(${wordName}){background:#2455da;color:white}`;
  document.documentElement.append(highlightStyle);
  let currentElement=null;
  function clearHighlight(){CSS.highlights?.delete(passageName);CSS.highlights?.delete(wordName);highlight?.remove();highlight=null;currentElement=null;}
  function textMap(el){
    const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),map=[];let text='',node,pending=null;
    while((node=walker.nextNode())){
      if(!visible(node.parentElement))continue;
      for(let i=0;i<node.textContent.length;i++){
        const char=node.textContent[i];
        if(/\s/.test(char)){if(text&&!pending)pending={node,offset:i};continue;}
        if(pending){text+=' ';map.push(pending);pending=null;}
        text+=char;map.push({node,offset:i});
      }
    }
    return {text,map};
  }
  function rangeFor(map,start,end){const first=map[start],last=map[end-1];if(!first||!last)return null;const range=new Range();range.setStart(first.node,first.offset);range.setEnd(last.node,last.offset+1);return range;}
  function highlightPassage(message){
    const el=blocks.get(message.id);if(!el?.isConnected||!host)return;
    currentElement=el;
    if(message.follow)el.scrollIntoView({block:'center',behavior:'instant'});
    if(CSS.highlights&&typeof Highlight!=='undefined'){
      const {text,map}=textMap(el),start=text.indexOf(message.text);
      let passageStart=0,passageEnd=message.text.length;
      if(Number.isInteger(message.charIndex)){
        const sentence=[...new Intl.Segmenter(undefined,{granularity:'sentence'}).segment(message.text)].find(part=>part.index<=message.charIndex&&part.index+part.segment.length>message.charIndex);
        if(sentence){passageStart=sentence.index;passageEnd=sentence.index+sentence.segment.trimEnd().length;}
      }
      let range=start>=0?rangeFor(map,start+passageStart,start+passageEnd):null;
      if(!range){range=new Range();range.selectNodeContents(el);}
      CSS.highlights.set(passageName,new Highlight(range));CSS.highlights.delete(wordName);
      if(start>=0&&Number.isInteger(message.charIndex)){
        const remaining=message.text.slice(message.charIndex),length=message.charLength||remaining.match(/^\S+/)?.[0].length||1;
        const word=rangeFor(map,start+message.charIndex,start+Math.min(message.text.length,message.charIndex+length));
        if(word)CSS.highlights.set(wordName,new Highlight(word));
      }
    }else{
      if(!highlight)highlight=makeBox('#2455da');place(highlight,el);
    }
  }
  const reposition=()=>{if(highlight&&currentElement?.isConnected)place(highlight,currentElement);};
  addEventListener('scroll',reposition,true);addEventListener('resize',reposition);
  addEventListener('pagehide',()=>{hideToolbar();void send('close').catch(()=>{});});
  chrome.runtime.onMessage.addListener((message,_sender,respond)=>{
    if(message.target!=='content')return;
    if(message.action==='toggle-toolbar'){if(host){hideToolbar();respond({visible:false});}else{showToolbar();respond({visible:true,page:snapshot()});}}
    if(message.action==='hide-toolbar'){hideToolbar();respond({ok:true});}
    if(message.action==='state'){updateState(message.state);respond({ok:true});}
    if(message.action==='highlight'){highlightPassage(message);respond({ok:true});}
    if(message.action==='snapshot')respond(snapshot());
    if(message.action==='clear'){clearHighlight();respond({ok:true});}
  });
})();
