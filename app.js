'use strict';
const $ = id => document.getElementById(id);
const STORE = {words:'sprachwerk_v2_words', history:'sprachwerk_v2_history',theme:'sprachwerk_v2_theme'};
const names={de:'Deutsch',en:'Englisch',fr:'Französisch',es:'Spanisch',it:'Italienisch',nl:'Niederländisch',pt:'Portugiesisch',pl:'Polnisch',tr:'Türkisch',uk:'Ukrainisch'};
const samples={de:'Guten Morgen! Schön, dass du hier bist.',en:'Good morning! It is nice to see you.',fr:'Bonjour ! Je suis heureux de vous voir.',es:'¡Buenos días! Me alegro de verte.',it:'Buongiorno! È bello vederti.',nl:'Goedemorgen! Fijn je te zien.',pt:'Bom dia! É bom ver você.',pl:'Dzień dobry! Miło cię widzieć.',tr:'Günaydın! Seni görmek güzel.',uk:'Доброго ранку! Радий тебе бачити.'};
const pairs={
'de|en':{'hallo':'Hello','danke':'Thank you','guten morgen':'Good morning','auf wiedersehen':'Goodbye','ich liebe dich':'I love you','wie geht es dir':'How are you','das ist ein test':'This is a test'},
'en|de':{'hello':'Hallo','thank you':'Danke','good morning':'Guten Morgen','goodbye':'Auf Wiedersehen','i love you':'Ich liebe dich','how are you':'Wie geht es dir','this is a test':'Das ist ein Test'},
'de|fr':{'hallo':'Bonjour','danke':'Merci','guten morgen':'Bonjour','auf wiedersehen':'Au revoir'},
'de|es':{'hallo':'Hola','danke':'Gracias','guten morgen':'Buenos días','auf wiedersehen':'Adiós'},
'de|it':{'hallo':'Ciao','danke':'Grazie','guten morgen':'Buongiorno'},
'de|nl':{'hallo':'Hallo','danke':'Dank je','guten morgen':'Goedemorgen'},
'de|pt':{'hallo':'Olá','danke':'Obrigado','guten morgen':'Bom dia'},
'de|pl':{'hallo':'Cześć','danke':'Dziękuję','guten morgen':'Dzień dobry'},
'de|tr':{'hallo':'Merhaba','danke':'Teşekkür ederim','guten morgen':'Günaydın'},
'de|uk':{'hallo':'Привіт','danke':'Дякую','guten morgen':'Доброго ранку'}
};
function load(key){try{let x=JSON.parse(localStorage.getItem(key)||'[]');return Array.isArray(x)?x:[]}catch{return []}}
function save(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{status('Lokales Speichern ist in diesem Browser deaktiviert.',true);return false}}
let words=load(STORE.words),history=load(STORE.history);
function status(msg,error=false){$('statusText').textContent=msg;$('status').classList.toggle('error',error)}
function counts(){$('chars').textContent=$('source').value.length.toLocaleString('de-DE')+' / 10.000 Zeichen';$('words').textContent=($('result').value.trim().match(/\S+/g)||[]).length+' Wörter'}
function clearResult(){$('result').value='';$('resultInfo').textContent='Bereit';counts()}
$('source').addEventListener('input',()=>{clearResult();counts();detectHint();if($('mode').value==='online'&&$('source').value.length>450)status('Langer Text: für die Online-Übersetzung werden mehrere Anfragen benötigt.')});
$('to').value='en';$('mode').value='offline';
$('from').addEventListener('change',()=>{clearResult();detectHint()});$('to').addEventListener('change',clearResult);
$('swap').addEventListener('click',()=>{const f=$('from').value,t=$('to').value,s=$('source').value,r=$('result').value;$('from').value=t;$('to').value=f;$('source').value=r||s;$('result').value=r?s:'';counts();status('Sprachen getauscht.')});
$('paste').addEventListener('click',async()=>{try{const txt=await navigator.clipboard.readText();$('source').value=txt.slice(0,10000);clearResult();counts();detectHint();status(txt.length>10000?'Eingefügt; auf 10.000 Zeichen gekürzt.':'Text eingefügt.')}catch{status('Zwischenablage nicht zugänglich – mit Strg+V einfügen.',true)}});
$('reverse').addEventListener('click',()=>{if(!$('result').value.trim()){status('Noch keine Übersetzung vorhanden.',true);return}const f=$('from').value;$('from').value=$('to').value;$('to').value=f;$('source').value=$('result').value;$('result').value='';counts();detectHint();status('Übersetzung als neuer Ausgangstext übernommen.')});
$('clear').addEventListener('click',()=>{$('source').value='';clearResult();counts();$('source').focus();status('Eingabe geleert.')});
$('sample').addEventListener('click',()=>{$('source').value=samples[$('from').value];clearResult();counts();status('Beispieltext eingefügt.')});
function speak(id,lang){const t=$(id).value.trim();if(!t){status('Es gibt noch keinen Text zum Vorlesen.',true);return}if(!('speechSynthesis' in window)){status('Dieser Browser unterstützt keine Sprachausgabe.',true);return}speechSynthesis.cancel();let utterance=new SpeechSynthesisUtterance(t);utterance.lang=lang;utterance.rate=.96;speechSynthesis.speak(utterance)}
$('speakSource').addEventListener('click',()=>speak('source',$('from').value));$('speakResult').addEventListener('click',()=>speak('result',$('to').value));
$('copy').addEventListener('click',async()=>{if(!$('result').value){status('Noch keine Übersetzung zum Kopieren.',true);return}try{await navigator.clipboard.writeText($('result').value);status('Übersetzung in die Zwischenablage kopiert.')}catch{$('result').focus();$('result').select();status('Text markiert – bitte mit Strg+C kopieren.')}});
function download(content,name,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
$('download').addEventListener('click',()=>{if(!$('result').value){status('Noch keine Übersetzung für den Download.',true);return}download($('result').value,'sprachwerk-uebersetzung.txt','text/plain;charset=utf-8')});
$('mode').addEventListener('change',()=>{const offline=$('mode').value==='offline';$('modeNote').textContent=offline?'Mini-Wortschatz: nur wenige Beispielsätze':'Online-Texte werden an MyMemory übertragen';clearResult();status(offline?'Offline-Modus aktiv. Es werden keine Übersetzungsanfragen an Server gesendet.':'Online-Modus aktiv. Text wird erst beim Klick auf „Übersetzen“ gesendet.')});
function detectHint(){const t=$('source').value.trim();let guess='';if(t.length>=12){if(/[іїєґ]/i.test(t))guess='Ukrainisch';else if(/[ąćęłńóśźż]/i.test(t))guess='Polnisch';else if(/[ğışİ]/i.test(t))guess='Türkisch';else if(/[ñ¿¡]/.test(t))guess='Spanisch';else if (/[äöüß]/i.test(t))guess='Deutsch';else if (/\b(the|and|you|with|this|are)\b/i.test(t))guess='Englisch';else if (/\b(le|les|vous|avec|une)\b/i.test(t))guess='Französisch';else if (/\b(der|die|das|und|ich|nicht)\b/i.test(t))guess='Deutsch'}$('detectHint').textContent=guess?'Sprachtipp (unverbindlich): '+guess:'Sprachtipp: '+(t?'keine sichere Vermutung':'noch kein Text')}
function decodeHTML(s){const el=document.createElement('textarea');el.innerHTML=s;return el.value}
// Online-Text wird zu Satz- oder Wortgrenzen in maximal 420 Zeichen lange Anfragen zerlegt.
function splitText(input,max=420){
 const chunks=[];let remaining=input;
 while(remaining.length){
  if(remaining.length<=max){chunks.push(remaining);break}
  let cut=-1;
  for(const marker of ['\n','。','! ','? ','. ','; ', ',']){
   const at=remaining.lastIndexOf(marker,max);
   if(at>Math.floor(max*.35)){cut=at+marker.length;break}
  }
  if(cut<1)cut=max;
  chunks.push(remaining.slice(0,cut));remaining=remaining.slice(cut);
 }
 return chunks.filter(Boolean);
}
let running=false;
async function translate(){
 if(running)return;
 const input=$('source').value, text=input.trim(),f=$('from').value,t=$('to').value;
 if(!text){status('Gib zunächst einen Text ein.',true);return}
 if(f===t){$('result').value=text;$('resultInfo').textContent='Identischer Sprachcode';counts();status('Beide Sprachen sind gleich – Text wurde übernommen.');return}
 if($('mode').value==='offline'){
  const norm=text.toLocaleLowerCase().replace(/[.!?]+$/,'').trim(),hit=pairs[f+'|'+t]?.[norm];
  $('result').value=hit||'';$('resultInfo').textContent='Offline · Demo';counts();
  status(hit?'Offline-Demo: Übersetzung aus lokalem Mini-Wortschatz.':'Kein Treffer im Offline-Demo-Wortschatz. Probiere „Hallo“ oder „Danke“ auf Deutsch.',!hit);return;
 }
 const chunks=splitText(text);if(chunks.length>30){status('Zu viele Teilabschnitte. Bitte einen kürzeren Text verwenden.',true);return}
 running=true;const button=$('translate');button.disabled=true;
 const originalButton=button.innerHTML;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),60000);
 try{
  const outputs=[];
  for(let i=0;i<chunks.length;i++){
   button.textContent='Übersetze '+(i+1)+' / '+chunks.length+' …';
   status('Online-Übertragung an MyMemory: Abschnitt '+(i+1)+' von '+chunks.length+'.');
   const q=chunks[i].trim();if(!q){outputs.push(chunks[i]);continue}
   const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair='+encodeURIComponent(f+'|'+t);
   const response=await fetch(url,{signal:controller.signal});if(!response.ok)throw Error('HTTP '+response.status);
   const data=await response.json();
   if(Number(data.responseStatus)!==200||typeof data.responseData?.translatedText!=='string'||!data.responseData.translatedText.trim())throw Error(data.responseDetails||'Keine Übersetzung verfügbar');
   outputs.push(decodeHTML(data.responseData.translatedText));
  }
  $('result').value=outputs.join(' ').trim();$('resultInfo').textContent='MyMemory · Online · '+chunks.length+' Abschnitt(e)';counts();
  status('Übersetzung fertig. '+chunks.length+' Abschnitt(e) verarbeitet. Bei langen Texten Übergänge und Fachbegriffe prüfen.');
 }catch(e){clearResult();status('Übersetzung fehlgeschlagen: '+(e.name==='AbortError'?'Zeitüberschitung':e.message)+'. Es wurde kein Teilergebnis übernommen.',true)}
 finally{clearTimeout(timeout);running=false;button.disabled=false;button.innerHTML=originalButton}
}
$('translate').addEventListener('click',translate);
function updateSource(t){$('source').value=t.slice(0,10000);clearResult();counts();detectHint()}
$('trimText').addEventListener('click',()=>{updateSource($('source').value.replace(/[\t ]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim());status('Abstände bereinigt.')});
$('sentenceCase').addEventListener('click',()=>{const t=$('source').value.toLocaleLowerCase().replace(/(^|[.!?]\s+|\n)([a-zäöü])/g,(m,p,c)=>p+c.toLocaleUpperCase('de-DE'));updateSource(t);status('Satzanfänge angepasst. Eigennamen bitte prüfen.')});
$('copyOriginal').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('source').value);status('Original kopiert.')}catch{status('Kopieren nicht möglich.',true)}});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();translate()}});
const tabs=['translate','glossary','history'];function tab(name){tabs.forEach(n=>{const active=n===name;$('view-'+n).hidden=!active;$('tab-'+n).classList.toggle('is-active',active);$('tab-'+n).setAttribute('aria-selected',String(active))})}tabs.forEach(n=>$('tab-'+n).addEventListener('click',()=>tab(n)));
function renderWords(){const q=$('glossarySearch').value.toLocaleLowerCase().trim();$('glossaryList').replaceChildren();$('glossaryCount').textContent=words.length;const list=words.map((x,i)=>({...x,i})).filter(x=>(x.a+' '+x.b).toLocaleLowerCase().includes(q));if(!list.length){const p=document.createElement('p');p.className='empty';p.textContent=words.length?'Keine passenden Einträge.':'Dein Wörterbuch ist noch leer.';$('glossaryList').append(p)}for(const item of list){const row=document.createElement('div');row.className='entry';const name=document.createElement('span');name.textContent=item.a+' → '+item.b;const del=document.createElement('button');del.textContent='Löschen';del.setAttribute('aria-label','Eintrag löschen: '+item.a);del.addEventListener('click',()=>{words.splice(item.i,1);save(STORE.words,words);renderWords()});row.append(name,del);$('glossaryList').append(row)}}
$('glossaryForm').addEventListener('submit',e=>{e.preventDefault();const a=$('term').value.trim(),b=$('meaning').value.trim();if(!a||!b)return;if(words.length>=200){status('Wörterbuch-Limit: maximal 200 Einträge.',true);return}words.push({a,b});save(STORE.words,words);$('glossaryForm').reset();renderWords();$('term').focus()});$('glossarySearch').addEventListener('input',renderWords);
$('exportGlossary').addEventListener('click',()=>{if(!words.length){status('Wörterbuch ist leer.',true);return}const csv='\uFEFFBegriff;Übersetzung\r\n'+words.map(w=>[w.a,w.b].map(s=>'"'+s.replaceAll('"','""')+'"').join(';')).join('\r\n');download(csv,'sprachwerk-woerterbuch.csv','text/csv;charset=utf-8')});
function renderHistory(){$('historyList').replaceChildren();if(!history.length){const p=document.createElement('p');p.className='empty';p.textContent='Hier erscheinen Übersetzungen, die du selbst über „Merken“ gespeichert hast.';$('historyList').append(p)}history.forEach((item,i)=>{const row=document.createElement('div');row.className='entry';const label=document.createElement('span');const text=document.createElement('strong');text.textContent=item.source.slice(0,120)+' → '+item.result.slice(0,120);const meta=document.createElement('small');meta.textContent=names[item.from]+' → '+names[item.to]+' · '+item.date;label.append(text,meta);const buttons=document.createElement('div');buttons.className='button-pack';const restore=document.createElement('button');restore.textContent='Öffnen';restore.addEventListener('click',()=>{$('from').value=item.from;$('to').value=item.to;$('source').value=item.source;$('result').value=item.result;counts();tab('translate')});const del=document.createElement('button');del.textContent='✕';del.setAttribute('aria-label','Eintrag löschen');del.addEventListener('click',()=>{history.splice(i,1);save(STORE.history,history);renderHistory()});buttons.append(restore,del);row.append(label,buttons);$('historyList').append(row)})}
$('favorite').addEventListener('click',()=>{const source=$('source').value.trim(),result=$('result').value.trim();if(!source||!result){status('Übersetze zuerst einen Text, um ihn zu merken.',true);return}history.unshift({source,result,from:$('from').value,to:$('to').value,date:new Date().toLocaleDateString('de-DE')});history=history.slice(0,40);save(STORE.history,history);renderHistory();status('Übersetzung nur in diesem Browser gespeichert.')});$('exportHistory').addEventListener('click',()=>{if(!history.length){status('Noch keine gespeicherten Übersetzungen.',true);return}download(JSON.stringify(history,null,2),'sprachwerk-verlauf.json','application/json;charset=utf-8')});$('clearHistory').addEventListener('click',()=>{if(!history.length)return;if(confirm('Alle lokal gemerkten Übersetzungen löschen?')){history=[];save(STORE.history,history);renderHistory()}});
try{if(localStorage.getItem(STORE.theme)==='dark')document.body.classList.add('dark')}catch{}$('theme').addEventListener('click',()=>{document.body.classList.toggle('dark');try{localStorage.setItem(STORE.theme,document.body.classList.contains('dark')?'dark':'light')}catch{}});
renderWords();renderHistory();counts();detectHint();

// V4: ausschließlich lokale Datei-Einlesung; Dateien werden nicht beim Import hochgeladen.
$('importText').addEventListener('click',()=>$('fileInput').click());
$('fileInput').addEventListener('change',async e=>{
 const f=e.target.files?.[0];if(!f)return;
 if(!/\.(txt|md|csv)$/i.test(f.name)){status('Bitte eine TXT-, MD- oder CSV-Datei auswählen.',true);return}
 if(f.size>1024*1024){status('Datei zu groß. Maximal 1 MB.',true);return}
 try{const content=await f.text();updateSource(content);status('Datei „'+f.name+'“ lokal geladen'+(content.length>10000?' (auf 10.000 Zeichen gekürzt)':'')+'.');}
 catch{status('Datei konnte nicht gelesen werden.',true)}
 e.target.value='';
});
$('downloadBoth').addEventListener('click',()=>{
 if(!$('result').value.trim()){status('Noch keine Übersetzung vorhanden.',true);return}
 download('SPRACHWERK 4.0\nOriginal ('+names[$('from').value]+'):\n'+$('source').value+'\n\nÜbersetzung ('+names[$('to').value]+'):\n'+$('result').value,'sprachwerk-original-und-uebersetzung.txt','text/plain;charset=utf-8');
});
$('mode').addEventListener('change',()=>{
 $('privacyAlert').innerHTML=$('mode').value==='offline'?'🔒 <strong>Offline-Demo:</strong> Kein Text wird für Übersetzungen versendet. Nur ein kleiner Beispielsatz-Wortschatz ist verfügbar.':'🌐 <strong>Online-Modus:</strong> Beim Übersetzen wird dein Text an MyMemory gesendet. Keine privaten oder vertraulichen Texte eingeben.';
 $('modeNote').textContent=$('mode').value==='offline'?'Mini-Wortschatz: nur wenige Beispielsätze':'MyMemory · längere Texte in Abschnitten · externe Datenübertragung';
});