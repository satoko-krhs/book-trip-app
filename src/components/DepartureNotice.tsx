import {useEffect,useRef,useState} from 'react';
import type {Departure} from '../lib/routing';
import {departureText} from '../lib/routing';
import Icon from './Icon';
export default function DepartureNotice({departure,dayNumber}:{departure:Departure;dayNumber:number}){
 const [message,setMessage]=useState(''),[manual,setManual]=useState(false);const input=useRef<HTMLInputElement>(null);
 const text=departureText(departure);
 useEffect(()=>{if(manual){input.current?.focus();input.current?.select();}},[manual]);
 async function copy(){
  try{if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');await navigator.clipboard.writeText(text);setManual(false);setMessage('出発日時をコピーしました。');}
  catch{setManual(true);setMessage('コピーを許可されていないため、下の日時を選択してCtrl+C（Macは⌘C）でコピーしてください。');}
 }
 return <div className="departure-notice"><p><Icon name="clock"/> Day {dayNumber}の出発日時：<strong>{text}</strong></p><button type="button" className="button small" onClick={copy}><Icon name="copy"/>出発日時をコピー</button><small>出発日時はGoogle Mapsへ自動設定されません。Google Mapsを開いた後、出発日時の設定が利用できる場合は、同じ日時を指定してください。</small>{message&&<p className="copy-message" role="status">{message}</p>}{manual&&<input ref={input} readOnly value={text} aria-label={`Day ${dayNumber}のコピー用出発日時`} onFocus={e=>e.currentTarget.select()}/>}</div>;
}
