/* SHEMA — Explorador genealógico, módulo estático; não lê ou altera contas/progresso. */
(function(){
'use strict';
const data=window.ShemaGenealogyData;
const main=document.querySelector('main');
if(!data||!main)return;
const section=document.createElement('section');
section.className='screen';
section.id='genealogia';
section.setAttribute('aria-label','Árvore Genealógica Bíblica');
section.innerHTML=[
'<div class="sg-head"><div class="sg-ey">SHEMA · MUNDO BÍBLICO</div><h1>Árvore Genealógica <em>Bíblica.</em></h1>',
'<p>Descubra famílias, origens e linhagens narradas nas Escrituras. As genealogias de Mateus e Lucas têm percursos próprios.</p></div>',
'<div class="sg-toolbox"><label for="sg-view">Escolha a linhagem</label><select id="sg-view"></select>',
'<div class="sg-search"><label for="sg-search">Encontrar personagem nesta linhagem</label><input type="search" id="sg-search" placeholder="Ex.: Abraão, Davi, Maria..." autocomplete="off"></div>',
'<div class="sg-actions"><button id="sg-list-button" type="button" aria-pressed="false">☷ Lista de nomes</button>',
'<button id="sg-reset" type="button" title="Voltar ao início da árvore">⌖ Início</button>',
'<button id="sg-minus" type="button" aria-label="Diminuir zoom">−</button>',
'<button id="sg-plus" type="button" aria-label="Aumentar zoom">+</button></div></div>',
'<div class="sg-intro" role="status"><strong id="sg-view-title"></strong><p id="sg-view-description"></p><small id="sg-view-reference"></small></div>',
'<div id="sg-results" hidden aria-live="polite"></div>',
'<div id="sg-viewport" aria-label="Árvore com movimento e zoom" tabindex="0"><div id="sg-world">',
'<svg id="sg-lines" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"></svg>',
'<div id="sg-nodes"></div></div><div class="sg-hint">Arraste para explorar · use dois dedos para ampliar</div></div>',
'<div id="sg-list" hidden role="region" aria-label="Lista acessível de personagens"></div>',
'<div class="sg-foot"><strong>Sobre as fontes</strong><p>Os vínculos são identificados conforme as passagens citadas. Relações de criação, parentesco legal, clãs e homônimos não são convertidos em filiação biológica. Catálogo de linhas documentadas, não relação de todas as pessoas da Bíblia. Adaptação visual editorial independente, sem afiliação a terceiros.</p></div>',
'<aside id="sg-drawer" hidden role="dialog" aria-modal="true" aria-labelledby="sg-detail-title">',
'<button type="button" id="sg-close" class="sg-close" aria-label="Fechar detalhes">✕</button>',
'<div class="sg-detail-ey">FICHA BÍBLICA</div><h2 id="sg-detail-title"></h2><div id="sg-detail-sub"></div>',
'<div class="sg-detail-block"><b>Referência bíblica</b><p id="sg-detail-ref"></p></div>',
'<div class="sg-detail-block"><b>Identificação e contexto</b><p id="sg-detail-context"></p></div>',
'<div class="sg-detail-block sg-detail-warning"><b>Conexão messiânica · leitura teológica</b><p id="sg-detail-messianic"></p></div>',
'<div class="sg-detail-block"><b>Família / relação registrada</b><div id="sg-detail-relations"></div></div>',
'<div class="sg-detail-block sg-detail-warning"><b>Cuidados textuais e variantes</b><p id="sg-detail-note"></p></div>',
'<button type="button" id="sg-detail-go" class="sg-detail-exit">Voltar à árvore</button></aside>'
].join('');
main.append(section);
const style=document.createElement('style');
style.id='shema-genealogia-style';
style.textContent=[
'#genealogia{--sg-paper:#f4efe6;--sg-card:#fcf9f2;--sg-ink:#2e2822;--sg-terracotta:#a75034;--sg-muted:#6b6055;color:#f0e6d6}',
'#genealogia .sg-head{text-align:center;margin:10px 0 20px}',
'#genealogia .sg-ey{font-size:11px;letter-spacing:.2em;color:#d9ae66;font-weight:800}',
'#genealogia .sg-head h1{font:normal clamp(26px,7vw,38px)/1.2 Georgia,serif;margin:12px auto;color:#f3e5d2}',
'#genealogia .sg-head h1 em{font-style:italic;color:#e3bd7c}',
'#genealogia .sg-head p{font:14px/1.7 system-ui,sans-serif;color:#bdae9b;max-width:550px;margin:auto}',
'#genealogia .sg-toolbox{background:#231c15;border:1px solid #54432d;border-radius:18px;padding:15px;display:grid;gap:11px}',
'#genealogia .sg-toolbox label{color:#ddc8a5;font:700 12px system-ui}',
'#genealogia .sg-toolbox select,#genealogia .sg-toolbox input{width:100%;background:#120f0c;border:1px solid #745c3c;border-radius:11px;padding:11px 12px;color:#f5eada;font:14px system-ui;min-height:45px}',
'#genealogia .sg-search{display:grid;gap:6px}',
'#genealogia .sg-actions{display:flex;gap:8px;flex-wrap:wrap}',
'#genealogia .sg-actions button{padding:9px 12px;min-height:42px;border:1px solid #8c7048;background:#35291c;color:#f6dca7;border-radius:10px;font:bold 13px system-ui;cursor:pointer}',
'#genealogia .sg-actions button[aria-pressed=true]{background:#d4ac63;color:#24170b}',
'#genealogia .sg-intro{padding:16px 7px 12px}',
'#genealogia .sg-intro strong{font:normal 24px Georgia,serif;color:#f1d498}',
'#genealogia .sg-intro p{font:13px/1.65 system-ui;color:#c9bca9;margin:6px 0}',
'#genealogia .sg-intro small{font:12px system-ui;color:#e3ba6c}',
'#genealogia #sg-viewport{height:min(68vh,720px);min-height:390px;position:relative;overflow:hidden;touch-action:none;cursor:grab;border:2px solid #927049;border-radius:16px;background-color:var(--sg-paper);background-image:radial-gradient(#bcaa9535 1px,transparent 1px);background-size:17px 17px;box-shadow:inset 0 0 35px #38221018}',
'#genealogia #sg-viewport:active{cursor:grabbing}',
'#genealogia #sg-world{position:absolute;top:0;left:0;transform-origin:top left;will-change:transform}',
'#genealogia #sg-lines,#genealogia #sg-nodes{position:absolute;top:0;left:0}',
'#genealogia #sg-lines{pointer-events:none;overflow:visible}',
'#genealogia .sg-link{fill:none;stroke:#685443;stroke-width:2;stroke-dasharray:5 4}',
'#genealogia .sg-link.special{stroke:var(--sg-terracotta);stroke-width:3;stroke-dasharray:4 5}',
'#genealogia .sg-person{position:absolute;transform:translateX(-50%);width:156px;min-height:70px;cursor:pointer;border:2px solid #514030;border-radius:10px;background:var(--sg-card);color:var(--sg-ink);padding:9px;box-shadow:4px 4px 0 #514030;text-align:center;font:700 13px/1.25 system-ui;user-select:none}',
'#genealogia .sg-person small{display:block;margin-top:6px;color:var(--sg-muted);font-size:10px;font-weight:500;line-height:1.3}',
'#genealogia .sg-person.featured{border-color:#b48028;background:#fff1d5;box-shadow:4px 4px 0 #b48028}',
'#genealogia .sg-person:focus-visible,#genealogia button:focus-visible{outline:3px solid #d3a33d;outline-offset:2px}',
'#genealogia .sg-hint{position:absolute;bottom:8px;left:8px;right:8px;text-align:center;color:#695646;background:#fcf7e5db;padding:8px;border-radius:8px;font:11px system-ui;pointer-events:none}',
'#genealogia #sg-list,#genealogia #sg-results{max-height:330px;overflow:auto;border:1px solid #695034;border-radius:13px;background:#231b14;margin:10px 0;padding:9px;display:grid;gap:6px}',
'#genealogia #sg-list[hidden],#genealogia #sg-results[hidden],#genealogia #sg-drawer[hidden]{display:none!important}',
'#genealogia .sg-item{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;text-align:left;background:#17120d;color:#f0e4d1;border:1px solid #58412c;border-radius:9px;padding:11px 12px;min-height:42px;font:13px system-ui}',
'#genealogia .sg-item small{font:10px system-ui;color:#d4aa6b}',
'#genealogia .sg-foot{margin:15px 0 28px;padding:15px;border-left:3px solid #b58d4f;color:#cbbb9e;background:#201911;border-radius:12px;font:12px/1.65 system-ui}',
'#genealogia .sg-foot strong{color:#e7c68d;font-size:14px}',
'#genealogia .sg-foot p{margin:6px 0 0}',
'#genealogia #sg-drawer{position:fixed;z-index:9001;top:0;right:0;bottom:0;width:min(440px,100vw);overflow:auto;background:#f9f2e7;color:#2a211a;padding:65px 22px 32px;border-left:3px solid #8a5e33;box-shadow:-15px 0 80px #0009}',
'#genealogia .sg-close{position:absolute;top:18px;right:18px;background:none;border:0;font-size:24px;color:#39271c;padding:7px;min-width:40px}',
'#genealogia .sg-detail-ey{font:700 10px system-ui;letter-spacing:.2em;color:#ac613d}',
'#genealogia #sg-drawer h2{font:normal 30px Georgia,serif;color:#2a211a;margin:8px 0}',
'#genealogia #sg-detail-sub{color:#9b563a;font:italic 16px Georgia,serif;margin:0 0 20px}',
'#genealogia .sg-detail-block{border-left:4px solid #59412f;background:#f0e6d8;border-radius:8px;padding:13px 15px;margin:11px 0}',
'#genealogia .sg-detail-block b{font:800 11px system-ui;letter-spacing:.06em;text-transform:uppercase;color:#725d4c}',
'#genealogia .sg-detail-block p{font:14px/1.65 system-ui;margin:6px 0;color:#312822}',
'#genealogia .sg-detail-block button{display:block;background:#fffaf3;border:1px solid #a08d73;color:#33251a;margin-top:8px;border-radius:7px;padding:8px 10px;width:100%;text-align:left;font:13px system-ui}',
'#genealogia .sg-detail-warning{border-color:#b56745;background:#f9e7dd}',
'#genealogia .sg-detail-exit{background:#51351e;color:#fff7ea;padding:12px 16px;border:0;border-radius:10px;width:100%;margin-top:14px;font:700 14px system-ui}',
'@media(max-width:430px){.navin button[data-s="genealogia"]{font-size:8.5px!important}#genealogia .sg-toolbox{padding:12px}#genealogia .sg-head{margin-top:2px}#genealogia #sg-viewport{height:60vh}}'
].join('');
document.head.append(style);
const nav=document.querySelector('.nav .navin');
if(nav&&!nav.querySelector('[data-s="genealogia"]')){
 const b=document.createElement('button');
 b.type='button';b.dataset.s='genealogia';b.innerHTML='<span aria-hidden="true">🌳</span>Árvore';
 b.addEventListener('click',function(){if(typeof go==='function')go('genealogia');requestAnimationFrame(function(){resizeFocus();});});
 nav.insertBefore(b,nav.querySelector('[data-s="profile"]'));
}
const $=id=>section.querySelector('#'+id),stage=$('sg-viewport'),world=$('sg-world'),svg=$('sg-lines'),layer=$('sg-nodes');
const ns='http://www.w3.org/2000/svg';
let active=data.views[0], positions=new Map(),scale=1,px=0,py=0,firstVisible=false,lastFocused=null,detailId=null,listOpen=false,worldHeight=0,worldWidth=0;
const panel=$('sg-drawer');
data.views.forEach(v=>{const opt=document.createElement('option');opt.value=v.id;opt.textContent=v.title; $('sg-view').append(opt);});
function option(klass,text){const e=document.createElement('span');if(klass)e.className=klass;e.textContent=text;return e;}
function setText(id,text){$(id).textContent=text||'';}
function clamp(x,lo,hi){return Math.max(lo,Math.min(hi,x));}
function layout(){
 const all=new Map(active.nodes.map(n=>[n.id,n]));
 const kids=new Map(active.nodes.map(n=>[n.id,[]]));
 active.links.forEach(e=>{if(kids.has(e.from)&&all.has(e.to))kids.get(e.from).push(e.to);});
 const roots=active.nodes.filter(n=>!n.parent||!all.has(n.parent));
 let leaf=0,depthMax=0;
 function visit(id,depth,seen){
  if(seen.has(id))return;
  seen.add(id);depthMax=Math.max(depthMax,depth);
  const family=kids.get(id)||[];
  if(!family.length){positions.set(id,{x:120+leaf++*188,y:110+depth*117});}
  else{family.forEach(child=>visit(child,depth+1,new Set(seen)));
    const xs=family.map(child=>positions.get(child)?.x).filter(Number.isFinite);
    positions.set(id,{x:xs.length?(Math.min(...xs)+Math.max(...xs))/2:120+leaf++*188,y:110+depth*117});}
 }
 positions.clear();
 roots.forEach(root=>{visit(root.id,0,new Set());leaf++;});
 worldWidth=Math.max(600,leaf*188+130);
 worldHeight=(depthMax+1)*117+170;
 world.style.width=worldWidth+'px';world.style.height=worldHeight+'px';
 svg.setAttribute('width',worldWidth);svg.setAttribute('height',worldHeight);
 layer.style.width=worldWidth+'px';layer.style.height=worldHeight+'px';
 const fragment=document.createDocumentFragment();
 active.nodes.forEach(n=>{
  const p=positions.get(n.id);if(!p)return;
  const b=document.createElement('button');b.type='button';b.className='sg-person';
  if(['Jesus','Deus','Adão','Abraão','Davi','Noé','Moisés'].includes(n.name))b.classList.add('featured');
  b.style.left=p.x+'px';b.style.top=p.y+'px';b.setAttribute('aria-label',n.name+'. '+n.ref+'. Abrir detalhes.');
  b.append(option('',n.name));
  if(n.mother)b.append(option('','')); // node card distinguishes named mother without inventing new ancestry
  const sub=document.createElement('small');sub.textContent=n.sub||n.mother&&'Mãe: '+n.mother||'Abrir ficha';b.append(sub);
  b.addEventListener('click',function(e){e.stopPropagation();detail(n);});
  fragment.append(b);
 });
 layer.replaceChildren(fragment);
 const paths=document.createDocumentFragment();
 active.links.forEach(link=>{
  const a=positions.get(link.from),b=positions.get(link.to);if(!a||!b)return;
  const p=document.createElementNS(ns,'path');
  const x1=a.x,y1=a.y+70,x2=b.x,y2=b.y;
  const dy=(y2-y1)*.5;
  p.setAttribute('d','M '+x1+' '+y1+' C '+x1+' '+(y1+dy)+' '+x2+' '+(y2-dy)+' '+x2+' '+y2);
  p.setAttribute('class','sg-link'+(link.type==='filiação'||link.type==='filiação / sequência genealógica'||link.type==='sequência genealógica'?'':' special'));
  paths.append(p);
 });svg.replaceChildren(paths);
}
function transform(){world.style.transform='translate('+px+'px,'+py+'px) scale('+scale+')';}
function centerNode(id,resetScale){
 const p=positions.get(id);if(!p)return;
 if(resetScale)scale=stage.clientWidth<430?.7:.95;
 const rect=stage.getBoundingClientRect();
 const rootX=p.x,rootY=p.y+30;
 px=rect.width*.5-rootX*scale;py=44-rootY*scale;
 transform();lastFocused=id;
}
function resizeFocus(){if(stage.clientWidth)centerNode(lastFocused||active.nodes[0].id,!firstVisible);firstVisible=true;}
function render(){
 setText('sg-view-title',active.title);
 setText('sg-view-description',active.summary);
 setText('sg-view-reference',active.ref+' · '+active.nodes.length+' registros nesta visualização');
 lastFocused=active.nodes[0]?.id;layout();
 $('sg-list').hidden=true;listOpen=false;$('sg-list-button').setAttribute('aria-pressed','false');
 $('sg-results').hidden=true;$('sg-search').value='';
 if(stage.clientWidth)centerNode(lastFocused,true);
}
function viewById(id){active=data.views.find(v=>v.id===id)||data.views[0];firstVisible=false;render();}
function detail(n){
 detailId=n.id;
 setText('sg-detail-title',n.name);
 setText('sg-detail-sub',n.sub||'Personagem / família nas Escrituras');
 setText('sg-detail-ref',n.ref||active.ref);
 const generic='Registro da linhagem “'+active.title+'”. Consulte o trecho citado para o contexto narrativo e os detalhes da geração.';
 const note=data.details[n.name];
 setText('sg-detail-context',(note?note[0]+'. '+note[2]:generic)+(n.kind==='agrupamento'?' Este cartão representa um grupo, não um ancestral individual.':''));
 setText('sg-detail-messianic',data.messianic?.[n.name]||'Não foi indicada conexão messiânica específica para esta pessoa nos trechos tratados. Não completar essa lacuna por suposição.');
 const rel=$('sg-detail-relations');rel.replaceChildren();
 const current=active.nodes.find(x=>x.id===n.id);
 if(current?.parent){const par=active.nodes.find(x=>x.id===current.parent);
  if(par){const p=document.createElement('p');p.textContent='Ligação anterior: '+par.name+' · '+current.relation;rel.append(p);}}
 if(n.mother){const p=document.createElement('p');p.textContent='Mãe registrada: '+n.mother;rel.append(p);}
 if(n.spouse){const p=document.createElement('p');p.textContent='Cônjuge: '+n.spouse;rel.append(p);}
 const kids=active.links.filter(l=>l.from===n.id).map(l=>active.nodes.find(x=>x.id===l.to)).filter(Boolean);
 if(kids.length){rel.append(option('','Pessoas relacionadas / descendência:'));
  kids.forEach(ch=>{const b=document.createElement('button');b.type='button';b.textContent=ch.name+' · '+ch.ref;b.addEventListener('click',()=>{centerNode(ch.id,false);detail(ch);});rel.append(b);});}
 if(!rel.childNodes.length)rel.textContent='O trecho consultado não atribui parentesco adicional nesta visualização.';
 setText('sg-detail-note',n.note||(n.name==='José'||n.name==='Jesus'?'Mateus e Lucas preservam qualificações diferentes. Veja as duas árvores separadamente.': 'Não há observação adicional no trecho documentado; nomes repetidos não implicam a mesma pessoa.'));
 panel.hidden=false;$('sg-close').focus();
}
function close(){panel.hidden=true;detailId=null;}
function chooseView(){viewById($('sg-view').value);}
$('sg-view').addEventListener('change',chooseView);
$('sg-reset').addEventListener('click',()=>{centerNode(active.nodes[0].id,true);});
function zoom(f){const next=clamp(scale*f,.22,2.6);const cx=stage.clientWidth*.5,cy=stage.clientHeight*.5;px=cx-(cx-px)*(next/scale);py=cy-(cy-py)*(next/scale);scale=next;transform();}
$('sg-minus').addEventListener('click',()=>zoom(1/1.25));
$('sg-plus').addEventListener('click',()=>zoom(1.25));
$('sg-close').addEventListener('click',close);$('sg-detail-go').addEventListener('click',close);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!panel.hidden)close();});
function results(query){
 const q=query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
 const matches=q?active.nodes.filter(n=>n.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)).slice(0,40):[];
 const wrap=$('sg-results');wrap.replaceChildren();
 if(!q){wrap.hidden=true;return;}
 if(!matches.length)wrap.append(option('','Não foram encontrados nomes nesta linhagem. Tente outra seleção.'));
 matches.forEach(n=>{const b=document.createElement('button');b.className='sg-item';b.type='button';b.append(option('',n.name),option('',n.ref));b.addEventListener('click',()=>{centerNode(n.id,false);wrap.hidden=true;detail(n);});wrap.append(b);});
 wrap.hidden=false;
}
$('sg-search').addEventListener('input',e=>results(e.target.value));
$('sg-list-button').addEventListener('click',()=>{
 listOpen=!listOpen;$('sg-list').hidden=!listOpen;$('sg-list-button').setAttribute('aria-pressed',String(listOpen));
 if(!listOpen)return;
 const out=$('sg-list');out.replaceChildren();
 active.nodes.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='sg-item';b.append(option('',n.name),option('',n.ref));b.addEventListener('click',()=>{centerNode(n.id,false);detail(n);});out.append(b);});
});
let pointers=new Map(),lastMid=null,lastDistance=null;
stage.addEventListener('pointerdown',e=>{
 if(e.target.closest('.sg-person'))return;
 stage.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 lastMid=null;lastDistance=null;
});
stage.addEventListener('pointermove',e=>{
 if(!pointers.has(e.pointerId))return;
 const prev=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===1){px+=e.clientX-prev.x;py+=e.clientY-prev.y;transform();return;}
 if(pointers.size===2){const a=Array.from(pointers.values()),mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};
  const distance=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);
  if(lastDistance&&lastMid){const next=clamp(scale*distance/lastDistance,.22,2.6);const bounds=stage.getBoundingClientRect();const sx=mid.x-bounds.left,sy=mid.y-bounds.top;
    px=sx-(sx-px)*(next/scale)+(mid.x-lastMid.x);py=sy-(sy-py)*(next/scale)+(mid.y-lastMid.y);scale=next;}
  lastDistance=distance;lastMid=mid;transform();
 }
});
function release(e){pointers.delete(e.pointerId);lastMid=null;lastDistance=null;}
stage.addEventListener('pointerup',release);stage.addEventListener('pointercancel',release);stage.addEventListener('lostpointercapture',release);
stage.addEventListener('wheel',e=>{e.preventDefault();const rect=stage.getBoundingClientRect();const x=e.clientX-rect.left,y=e.clientY-rect.top;const next=clamp(scale*(e.deltaY>0?.89:1.12),.22,2.6);px=x-(x-px)*(next/scale);py=y-(y-py)*(next/scale);scale=next;transform();},{passive:false});
stage.addEventListener('keydown',e=>{
 if(e.key==='ArrowLeft')px+=60;else if(e.key==='ArrowRight')px-=60;else if(e.key==='ArrowDown')py-=60;else if(e.key==='ArrowUp')py+=60;else return;
 e.preventDefault();transform();
});
window.addEventListener('resize',()=>{if(section.classList.contains('active'))resizeFocus();});
render();
window.ShemaGenealogy=Object.freeze({select:id=>{$('sg-view').value=id;chooseView();if(typeof go==='function')go('genealogia');resizeFocus();},getViews:()=>data.views.map(v=>({id:v.id,name:v.title,nodes:v.nodes.length}))});
})();