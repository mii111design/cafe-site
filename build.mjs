import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function url(v){try{const u=new URL(v);return u.protocol==='https:'?u.href:''}catch{return ''}}
export function rich(v){
 const allowed=new Set('p br h2 h3 h4 strong b em i u s ul ol li blockquote pre code a img hr figure figcaption'.split(' '));
 return String(v??'').split(/(<[^>]*>)/g).map(t=>{
  if(!t.startsWith('<'))return esc(t).replace(/&amp;(amp|lt|gt|quot|#39|nbsp);/g,'&$1;');
  const m=t.match(/^<(\/?)\s*([a-z0-9]+)\b/i);if(!m||!allowed.has(m[2].toLowerCase()))return '';
  const tag=m[2].toLowerCase();if(m[1])return ['img','br','hr'].includes(tag)?'':'</'+tag+'>';
  const attr=n=>t.match(new RegExp('\\s'+n+'\\s*=\\s*(?:"([^"<>]*)"|\'([^\'<>]*)\')','i'))?.slice(1).find(x=>x!==undefined)??'';
  if(tag==='a')return url(attr('href'))?'<a href="'+esc(url(attr('href')))+'" target="_blank" rel="noopener noreferrer">':'<a>';
  if(tag==='img')return url(attr('src'))?'<img src="'+esc(url(attr('src')))+'" alt="'+esc(attr('alt'))+'" loading="lazy">':'';
  return '<'+tag+'>';
 }).join('');
}
async function get(endpoint){
 const r=await fetch('https://hearth-cafe.microcms.io/api/v1/'+endpoint,{headers:{'X-MICROCMS-API-KEY':process.env.MICROCMS_API_KEY},signal:AbortSignal.timeout(30000)});
 if(!r.ok)throw Error(endpoint.split('?')[0]+' の取得失敗 ('+r.status+')。API名・公開状態・GET権限を確認してください。');
 return r.json();
}
export async function build(fixture){
 let news=[],calendar;
 if(fixture)({news,calendar}=fixture);
 else{
  if(!process.env.MICROCMS_API_KEY)throw Error('GitHub Secrets に MICROCMS_API_KEY を登録してください。');
  let offset=0,total;
  do{const p=await get('news?limit=100&offset='+offset+'&orders=-publishedAt');
   if(!Array.isArray(p.contents))throw Error('news はリスト形式にしてください。');
   news.push(...p.contents);total=p.totalCount;offset+=p.contents.length;if(!p.contents.length)break;
  }while(offset<total);
  calendar=await get('calendar');
 }
 if(typeof calendar?.month!=='string'||!url(calendar.image?.url))throw Error('営業カレンダーの month・image を入力して公開してください。');
 for(const n of news)if(typeof n.title!=='string'||typeof n.body!=='string')throw Error('お知らせのフィールドIDは title・body・image にしてください。');
 const rows=news.map(n=>{
  const d=new Date(n.publishedAt),date=isNaN(d)?'':new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  return '<details class="cms-news-item"><summary><time>'+esc(date)+'</time><span>'+esc(n.title)+'</span><span class="cms-plus" aria-hidden="true">＋</span></summary><div class="cms-news-body">'+(url(n.image?.url)?'<img src="'+esc(url(n.image.url))+'" alt="'+esc(n.title)+'" loading="lazy">':'')+rich(n.body)+'</div></details>';
 }).join('');
 const newsHTML='<section class="section cms-news" id="news"><div class="section-heading"><p class="kicker">NEWS</p><h2>お知らせ</h2></div><div class="cms-news-list">'+(rows||'<p>現在公開中のお知らせはありません。</p>')+'</div></section>';
 const calendarHTML='<section class="section cms-calendar" id="calendar"><div class="section-heading"><p class="kicker">OPENING CALENDAR</p><h2>営業カレンダー</h2><p>'+esc(calendar.month)+'</p></div><a class="cms-calendar-link" href="'+esc(url(calendar.image.url))+'" target="_blank" rel="noopener noreferrer" aria-label="営業カレンダーを別タブで拡大"><img src="'+esc(url(calendar.image.url))+'" alt="'+esc(calendar.month)+'の営業カレンダー" loading="lazy"><span>画像を拡大する ↗</span></a>'+(calendar.note?'<p class="cms-calendar-note">'+esc(calendar.note)+'</p>':'')+'</section>';
 let html=await readFile(path.join(root,'index.html'),'utf8');
 if(!html.includes('<!-- CMS_NEWS -->')||!html.includes('<!-- CMS_CALENDAR -->'))throw Error('index.html のCMS表示位置がありません。');
 html=html.replace('<!-- CMS_NEWS -->',()=>newsHTML).replace('<!-- CMS_CALENDAR -->',()=>calendarHTML);
 const out=path.join(root,'dist');await mkdir(out,{recursive:true});
 for(const f of ['style.css','script.js','recruit.html','.nojekyll','assets'])await cp(path.join(root,f),path.join(out,f),{recursive:true});
 await writeFile(path.join(out,'index.html'),html);
 console.log('作成完了: お知らせ '+news.length+'件・営業カレンダー');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))build().catch(e=>{console.error(e.message);process.exitCode=1});


