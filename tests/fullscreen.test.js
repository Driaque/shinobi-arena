import test from 'node:test';
import assert from 'node:assert/strict';
import {createFullscreen} from '../apps/web/fullscreen.js';
function fixture(){
 const node=()=>Object.assign(new EventTarget(),{dataset:{},style:{values:{},setProperty(k,v){this.values[k]=v;}},classList:{values:new Set(),toggle(k,on){if(on)this.values.add(k);else this.values.delete(k);}},setAttribute(k,v){this[k]=v;}});
 const element=node(),button=node(),doc=node(),win=node();doc.documentElement=node();win.innerHeight=390;win.matchMedia=()=>({matches:false});win.screen={orientation:{}};let notices=[],transitions=0;
 return {element,button,doc,win,notices,start(){return createFullscreen({element,button,documentRef:doc,windowRef:win,onTransition:()=>transitions++,notice:msg=>notices.push(msg)});},get transitions(){return transitions;}};
}
test('supported fullscreen is called during activation and can exit cleanly',async()=>{
 const f=fixture();let called=false;f.doc.fullscreenEnabled=true;f.element.requestFullscreen=()=>{called=true;f.doc.fullscreenElement=f.element;return Promise.resolve();};f.doc.exitFullscreen=async()=>{f.doc.fullscreenElement=null;};const controller=f.start();const pending=controller.toggle();assert.ok(called);await pending;assert.equal(f.element.dataset.screenMode,'native');assert.equal(f.button.textContent,'Exit view');await controller.toggle();assert.equal(f.element.dataset.screenMode,'window');assert.equal(f.button['aria-pressed'],'false');
});
test('missing or rejected native fullscreen produces a visible reversible play view',async()=>{
 for(const rejected of [false,true]){const f=fixture();if(rejected)f.element.requestFullscreen=()=>Promise.reject(new Error('denied'));const c=f.start();await c.toggle();assert.equal(f.element.dataset.screenMode,'expanded');assert.ok(f.element.classList.values.has('play-view'));assert.match(f.notices[0],/address bar/);await c.toggle();assert.equal(f.element.dataset.screenMode,'window');assert.equal(f.button.disabled,false);}
});
test('prefixed fullscreen and external fullscreen exit are recognized',async()=>{
 const f=fixture();f.element.webkitRequestFullscreen=async()=>{f.doc.webkitFullscreenElement=f.element;};f.doc.webkitExitFullscreen=async()=>{f.doc.webkitFullscreenElement=null;};const c=f.start();await c.toggle();assert.equal(f.element.dataset.screenMode,'native');f.doc.webkitFullscreenElement=null;f.doc.dispatchEvent(new Event('webkitfullscreenchange'));assert.equal(f.element.dataset.screenMode,'window');
});
test('Escape exits fallback and visual viewport height sizes the play area',async()=>{
 const f=fixture();f.win.visualViewport=Object.assign(new EventTarget(),{height:320});const c=f.start();await c.toggle();assert.equal(f.element.style.values['--play-height'],'320px');const event=new Event('keydown');event.code='Escape';f.doc.dispatchEvent(event);assert.equal(f.element.dataset.screenMode,'window');
});
test('orientation lock failure keeps native fullscreen active without an unhandled rejection',async()=>{
 const f=fixture();f.win.matchMedia=()=>({matches:true});f.win.screen.orientation.lock=()=>Promise.reject(new Error('unsupported'));f.element.requestFullscreen=async()=>{f.doc.fullscreenElement=f.element;};const c=f.start();await c.toggle();assert.equal(f.element.dataset.screenMode,'native');assert.match(f.notices[0],/Rotate/);assert.equal(f.button.disabled,false);
});
