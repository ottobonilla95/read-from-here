import {generateSpeech} from './providers.js';

export class ReaderPlayer {
  constructor({native, audio = new Audio(), settings, key, onChange = () => {}, onPassage = () => {}, onWord = () => {}, synthesize = generateSpeech}) {
    Object.assign(this, {native,audio,settings,key,onChange,onPassage,onWord,synthesize});
    this.queue=[];this.index=0;this.phase='idle';this.want=false;this.token=0;this.cache=new Map();this.url=null;this.pending=false;this.nativePaused=false;
    this.audio.preservesPitch=true;
  }
  state(phase,error='') {this.phase=phase;this.onChange({phase,index:this.index,total:this.queue.length,error});}
  releaseAudio() {this.audio.pause();this.audio.onended=null;this.audio.onerror=null;this.audio.removeAttribute('src');this.audio.load();if(this.url) URL.revokeObjectURL(this.url);this.url=null;}
  cancel() {
    this.token++;this.want=false;this.pending=false;this.controller?.abort();this.controller=null;this.native.stop();this.nativePaused=false;this.releaseAudio();
  }
  load(queue,index=0) {this.cancel();this.queue=queue;this.index=Math.max(0,Math.min(index,queue.length-1));this.state(queue.length?'ready':'idle');}
  stop() {this.cancel();this.state(this.queue.length?'ready':'idle');}
  clearCache(){this.cache.clear();}
  async toggle(){if(this.want){this.pause();return;}await this.play();}
  async play() {
    if(!this.queue.length)return;
    this.want=true;
    if(this.phase==='ended')this.index=0;
    if(this.nativePaused){this.native.resume();this.nativePaused=false;this.state('playing');return;}
    if(this.pending){this.state('loading');return;}
    if(this.audio.getAttribute('src')){
      const token=this.token;
      this.state('playing');
      try{await this.audio.play();}catch(error){if(token===this.token){if(!this.want&&error.name==='AbortError')this.state('paused');else this.fail(error);}}
      return;
    }
    await this.run();
  }
  pause() {
    this.want=false;
    if(this.settings().provider==='browser' && this.phase==='playing'){this.native.pause();this.nativePaused=true;}
    this.audio.pause();this.state('paused');
  }
  seek(index,autoplay=this.want) {
    if(!this.queue.length)return;
    this.cancel();this.index=Math.max(0,Math.min(index,this.queue.length-1));this.state('ready');
    this.onPassage(this.queue[this.index],this.index);
    if(autoplay)return this.play();
  }
  setSpeed(speed) {
    this.audio.playbackRate=speed;
    if(this.settings().provider==='browser' && (this.phase==='playing'||this.nativePaused)) {
      const playing=this.want;this.seek(this.index,playing);
      return true;
    }
    return false;
  }
  advance(token) {
    if(token!==this.token||!this.want)return;
    this.releaseAudio();
    if(this.index>=this.queue.length-1){this.want=false;this.state('ended');return;}
    this.index++;void this.run();
  }
  fail(error) {this.want=false;this.state('error',error.message || String(error));}
  async run() {
    const item=this.queue[this.index];if(!item)return;
    const token=++this.token, settings=this.settings();
    this.onPassage(item,this.index);
    this.state('loading');
    if(settings.provider==='browser') {
      this.state('playing');
      try{
        this.native.speak(item.text,{voice:settings.voices.browser,rate:settings.speed,lang:settings.lang,onEvent:event=>{
          if(token!==this.token)return;
          if(event.type==='word'&&Number.isInteger(event.charIndex))this.onWord(item,event);
          if(event.type==='end')this.advance(token);
          else if(event.type==='error')this.fail(new Error(event.errorMessage||'This browser voice could not play. Choose another voice.'));
          else if(event.type==='interrupted'||event.type==='cancelled'){this.want=false;this.nativePaused=false;this.state('ready');}
        }});
      }catch(error){if(token===this.token)this.fail(error);}
      return;
    }
    const config={provider:settings.provider,voice:settings.voices[settings.provider],model:settings.models[settings.provider],text:item.text};
    const cacheId=JSON.stringify(config);
    const controller=new AbortController();this.controller=controller;this.pending=true;
    const timer=setTimeout(()=>controller.abort(new Error('Voice generation took too long. Try again or choose another provider.')),60000);
    try {
      let blob=this.cache.get(cacheId);
      if(!blob){
        const key=await this.key(settings.provider);
        if(token!==this.token)return;
        blob=await this.synthesize({...config,key,signal:controller.signal});
        if(token!==this.token)return;
        this.cache.set(cacheId,blob);
        // Keep a small in-memory cache; never save study text or generated audio to disk.
        while(this.cache.size>12)this.cache.delete(this.cache.keys().next().value);
      }
      if(token!==this.token)return;
      this.pending=false;this.releaseAudio();this.url=URL.createObjectURL(blob);this.audio.src=this.url;this.audio.playbackRate=this.settings().speed;
      this.audio.onended=()=>this.advance(token);
      this.audio.onerror=()=>{if(token===this.token){this.releaseAudio();this.fail(new Error('The audio could not be played. Try another voice or provider.'));}};
      if(this.want){this.state('playing');await this.audio.play();}else this.state('paused');
    } catch(error) {
      if(token!==this.token)return;
      if(!this.want&&error.name==='AbortError'){this.state('paused');return;}
      this.pending=false;this.releaseAudio();this.fail(error);
    } finally {clearTimeout(timer);if(token===this.token)this.controller=null;}
  }
}
