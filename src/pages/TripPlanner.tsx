import {useEffect,useRef,useState} from 'react';
import bookData from '../data/books.json';
import type {Book,Day,Mode,Settings} from '../types';
import BookSelector from '../components/BookSelector';
import TripSettings from '../components/TripSettings';
import Itinerary from '../components/Itinerary';
import Icon from '../components/Icon';
import {createDays} from '../lib/itinerary';
import {parseTime} from '../lib/time';
import {applyMasterToDays,loadMasterSnapshot,MASTER_UPDATED_EVENT,STORAGE_KEY} from '../lib/master';
import {isValidDate,localDateISO} from '../lib/date';
const books=bookData as Book[];
export default function TripPlanner({active=true,onBookChange,onModeChange}:{active?:boolean;onBookChange?:(id:string)=>void;onModeChange?:(mode:Mode)=>void}){
 const [settings,setSettings]=useState<Settings>({bookId:'',origin:'',destination:'',duration:'one',startTime:'08:00',travelDate:localDateISO(),day1End:'',day2Start:'',day2Time:'09:00',mode:'transit'});
 const [masterState,setMasterState]=useState(loadMasterSnapshot);
 useEffect(()=>{onBookChange?.(settings.bookId);},[settings.bookId,onBookChange]);
 useEffect(()=>{onModeChange?.(settings.mode);},[settings.mode,onModeChange]);
 const [days,setDays]=useState<Day[]|null>(null),[errors,setErrors]=useState<{id:string;message:string}[]>([]);
 const errorSummary=useRef<HTMLDivElement>(null),previousPlan=useRef(false);
 useEffect(()=>{if(errors.length)errorSummary.current?.focus();},[errors]);
 const hasPlan=days!==null;
 useEffect(()=>{if(previousPlan.current!==hasPlan){document.getElementById(hasPlan?'itinerary-title':'trip-settings-title')?.focus();previousPlan.current=hasPlan;}},[hasPlan]);
 useEffect(()=>{
  if(!active)return;
  const refresh=()=>{const snapshot=loadMasterSnapshot();setMasterState(snapshot);setDays(current=>current?applyMasterToDays(current,snapshot.records):current);};
  const onStorage=(event:StorageEvent)=>{if(event.key===STORAGE_KEY||event.key===null)refresh();};
  refresh();window.addEventListener(MASTER_UPDATED_EVENT,refresh);window.addEventListener('storage',onStorage);
  return ()=>{window.removeEventListener(MASTER_UPDATED_EVENT,refresh);window.removeEventListener('storage',onStorage);};
 },[active]);
 function validationIssues(){const issues:{id:string;message:string}[]=[];if(!settings.bookId)issues.push({id:'book-botchan',message:'作品を選択してください。'});if(!settings.origin.trim())issues.push({id:'trip-origin',message:'出発地を入力してください。'});if(!settings.destination.trim())issues.push({id:'trip-destination',message:'帰着地を入力してください。'});if(!isValidDate(settings.travelDate))issues.push({id:'trip-date',message:'有効な旅行日を入力してください。'});if(parseTime(settings.startTime)===null)issues.push({id:'trip-start',message:'有効な出発時刻を入力してください。'});if(settings.duration==='two'&&parseTime(settings.day2Time)===null)issues.push({id:'trip-day2-time',message:'Day 2の有効な出発時刻を入力してください。'});return issues;}
 const visibleErrors=errors.length?validationIssues():[];
 function generate(e:React.FormEvent){e.preventDefault();const issues=validationIssues();setErrors(issues);if(issues.length)return;const snapshot=loadMasterSnapshot();setMasterState(snapshot);setDays(createDays(books.find(b=>b.id===settings.bookId)!,settings,snapshot.records));window.scrollTo({top:0,behavior:'instant'});}
 if(days)return <Itinerary book={books.find(b=>b.id===settings.bookId)!} settings={settings} masterMessage={masterState.message} days={days} setDays={setDays} onBack={()=>{setDays(null);window.scrollTo({top:0});}}/>;
 return <><section className="hero"><span className="eyebrow">読書からはじまる、小さな旅</span><div className="hero-line"><h1 id="planner-title" tabIndex={-1}>本の世界を、<br className="mobile-break"/>旅しよう。</h1><div className="hero-decoration" aria-hidden="true"><Icon name="book"/><span>········</span><Icon name="pin"/></div></div><p>お気に入りの物語から、あなただけの旅をつくる。</p><span className="hero-footnote">ページをめくる、その先の景色へ。</span><ol className="journey-steps" aria-label="旅程作成の流れ"><li><strong aria-hidden="true">1</strong>好きな作品を選ぶ</li><li><strong aria-hidden="true">2</strong>日程・出発地を決める</li><li><strong aria-hidden="true">3</strong>旅程を確認・調整する</li></ol></section><form noValidate onSubmit={generate} aria-label="旅程の作成">{visibleErrors.length>0&&<div className="error-box" role="alert" ref={errorSummary} tabIndex={-1} aria-labelledby="planner-error-title"><h2 id="planner-error-title">入力内容を確認してください</h2><ul>{visibleErrors.map(issue=><li key={issue.id}><button type="button" className="error-link" onClick={()=>document.getElementById(issue.id)?.focus()}>{issue.message}</button></li>)}</ul></div>}<section className="section"><div className="section-heading"><span className="step">01</span><div><h2 id="book-selection-title">旅のはじまりは、一冊の本から。</h2><p id="book-selection-help">旅したい作品を1つ選んでください。選んだ作品にはチェックが付きます。</p></div><span className="section-side">3作品から選択</span></div><BookSelector books={books} selected={settings.bookId} invalid={errors.length>0&&!settings.bookId} onSelect={id=>setSettings({...settings,bookId:id})}/>{errors.length>0&&!settings.bookId&&<p className="field-error" id="book-selection-error">入力エラー：作品を1つ選択してください。</p>}<p className="selection-status" role="status"><Icon name={settings.bookId?'check':'book'}/>{settings.bookId?`選択中：${books.find(book=>book.id===settings.bookId)?.title}`:'作品を選ぶと、次に旅の日程を設定できます。'}</p><p className="data-note">掲載地点は研修用の旅行候補地です。作品に直接登場する場所と断定するものではありません。</p></section><section className="section panel settings-panel"><div className="section-heading"><span className="step">02</span><div><h2 id="trip-settings-title" tabIndex={-1}>旅のかたちを、決めましょう。</h2><p>出発地・日程を設定します。「必須」の項目を入力してください。</p></div><Icon name="route"/></div><TripSettings value={settings} onChange={setSettings} book={books.find(b=>b.id===settings.bookId)} showErrors={errors.length>0}/></section><div className="generate-row"><p><Icon name="clock"/> あなたのペースで、物語の舞台へ。<small>滞在時間・移動時間はあとから編集できます。</small></p><button className="button primary generate" type="submit"><Icon name="route"/>旅程を作成する<Icon name="arrow"/></button></div></form></>;
}
