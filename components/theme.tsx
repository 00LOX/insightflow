'use client';
import {useSyncExternalStore} from 'react';
const subscribe=(cb:()=>void)=>{window.addEventListener('themechange',cb);return()=>window.removeEventListener('themechange',cb)};
export function Theme(){const dark=useSyncExternalStore(subscribe,()=>document.documentElement.dataset.theme==='dark',()=>false);return <button className="icon-button" aria-label="切换明暗模式" onClick={()=>{const next=dark?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('theme',next);window.dispatchEvent(new Event('themechange'))}}>{dark?'☀':'◐'}</button>}
