/* Shema V9 | Grupos opt-in. O servidor aplica todas as autorizacoes. */
(function () {
'use strict';
const env=window.ShemaEnvironment, profile=document.getElementById('profile');
if(!env||!profile)return;
const panel=document.createElement('section');
panel.className='card sl-panel';
panel.id='shemaLeaderPanel';
panel.innerHTML=[
'<div class="ey">LIDERANÇA · GRUPOS</div><h2>Grupos e acompanhamento</h2>',
'<p class="sl-muted">O líder vê apenas casas concluídas, XP e última sincronização. Reflexões, orações e marcações permanecem privadas.</p>',
'<p id="slStatus" class="sl-muted" role="status" aria-live="polite">Entre em sua conta do Shema.</p>',
'<div id="slArea" hidden>',
'<div class="sl-section"><h3>Participar de um grupo</h3>',
'<label>Código de convite <input id="slCode" maxlength="22" autocomplete="off" placeholder="Código informado pelo líder"></label>',
'<label>Seu nome no grupo <input id="slName" maxlength="60" autocomplete="nickname" placeholder="Nome de exibição"></label>',
'<label class="sl-consent"><input id="slConsent" type="checkbox"> Concordo que meu líder veja apenas minhas estatísticas de progresso. Posso sair do grupo a qualquer momento.</label>',
'<button type="button" class="btn secondary" id="slJoin">Entrar no grupo</button></div>',
'<div class="sl-section"><h3>Grupos dos quais participo</h3><div id="slJoined"></div></div>',
'<div class="sl-section" id="slLeaderArea" hidden><h3>Painel do Líder</h3>',
'<p class="sl-muted">A atividade reflete sincronizações na nuvem, não a frequência real de leitura.</p>',
'<label>Nome do novo grupo <input id="slGroupTitle" maxlength="80" placeholder="Ex.: Jovens Mergulhar"></label>',
'<button type="button" class="btn secondary" id="slCreate">Criar grupo</button>',
'<div id="slLeading"></div><div id="slDashboard" hidden><h3 id="slDashboardTitle"></h3>',
'<div id="slMetrics" class="sl-kpis"></div><div id="slParticipants"></div></div></div></div>'
].join('');
profile.append(panel);
const style=document.createElement('style');
style.textContent='.sl-panel{font-size:13px}.sl-panel h2{font-size:19px}.sl-panel h3{font-size:15px;margin:10px 0}.sl-panel .sl-muted{font-size:12px;color:var(--muted,#b8aa95);line-height:1.55}.sl-panel .sl-section{border-top:1px solid var(--line,#3c3022);padding-top:12px;margin-top:14px}.sl-panel label{display:block;font-size:12px;margin:11px 0;color:var(--muted,#b8aa95)}.sl-panel input:not([type=checkbox]){width:100%;padding:11px;margin-top:5px;color:#f9ead5;background:#17130f;border:1px solid #5a452e;border-radius:10px}.sl-panel .sl-consent{display:flex;align-items:flex-start;gap:9px;line-height:1.6}.sl-panel .sl-consent input{margin-top:4px;flex:none}.sl-panel .sl-row{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;border-bottom:1px solid #3c3022;padding:12px 0}.sl-panel .sl-row button{margin:0;padding:9px;width:auto;flex:none;font-size:12px}.sl-panel .sl-row p{margin:5px 0;font-size:11px;overflow-wrap:anywhere}.sl-panel .sl-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:10px 0}.sl-panel .sl-kpi{background:#201910;border:1px solid #45351e;border-radius:11px;padding:10px}.sl-panel .sl-kpi b{display:block;font-size:22px;color:#eaca89}.sl-panel .sl-kpi small{color:var(--muted,#b8aa95)}.sl-panel .sl-progress{background:#3d3021;height:7px;border-radius:20px;overflow:hidden}.sl-panel .sl-progress i{display:block;background:#d8af61;height:100%}.sl-panel .sl-code{font-family:monospace;user-select:all;letter-spacing:1px}.sl-panel [hidden]{display:none!important}@media(max-width:370px){.sl-panel .sl-row{flex-wrap:wrap}}';
document.head.append(style);
const $=id=>document.getElementById(id);
let seenId='',busy=false,state=null;
function session(){try{const s=JSON.parse(sessionStorage.getItem(env.accountPrefix+'sessao')||'null');return s&&s.user&&s.user.id&&s.access_token?s:null}catch{return null}}
function requireSession(){const s=session();if(!env.cloudEnabled)throw Error('A nuvem está desativada nesta versão.');if(!s)throw Error('Entre em sua conta na seção Minha conta e progresso.');if(Number(s.expires_at||0)<Date.now()+1500)throw Error('Sessão expirada. Entre novamente.');return s}
function status(msg,error){$('slStatus').textContent=msg;$('slStatus').style.color=error?'#eb9791':''}
async function rpc(method,params){const s=requireSession();const response=await fetch(env.url+'/rest/v1/rpc/'+method,{method:'POST',cache:'no-store',headers:{'apikey':env.publicKey,'Authorization':'Bearer '+s.access_token,'Content-Type':'application/json'},body:JSON.stringify(params||{})});let result=null;try{result=await response.json()}catch{}if(!response.ok)throw Error(result&&result.message||'Falha no servidor ('+response.status+')');return result}
async function act(task){if(busy)return;busy=true;panel.querySelectorAll('button').forEach(b=>b.disabled=true);try{await task()}catch(e){status('Não foi possível: '+e.message,true)}finally{busy=false;panel.querySelectorAll('button').forEach(b=>b.disabled=false)}}
function node(tag,text,cls){const n=document.createElement(tag);if(text!==undefined)n.textContent=String(text);if(cls)n.className=cls;return n}
function button(text,cb){const b=node('button',text,'btn secondary');b.type='button';b.addEventListener('click',cb);return b}
async function loadState(){state=await rpc('shema_group_state');render();status('Grupos atualizados.')}
function render(){if(!state)return;$('slLeaderArea').hidden=!state.isLeader;
const my=$('slJoined');my.replaceChildren();
if(!state.joined.length)my.append(node('p','Você ainda não participa de um grupo.','sl-muted'));
state.joined.forEach(g=>{const row=node('div',undefined,'sl-row'),col=node('div');col.append(node('strong',g.title),node('p','Nome exibido: '+g.name,'sl-muted'));row.append(col,button('Sair',()=>act(async()=>{if(!confirm('Sair do grupo '+g.title+'? Seu líder perderá acesso às suas estatísticas.'))return;await rpc('shema_group_leave',{p_group_id:g.id});await loadState()})));my.append(row)});
const lead=$('slLeading');lead.replaceChildren();
state.leading.forEach(g=>{const row=node('div',undefined,'sl-row'),col=node('div');col.append(node('strong',g.title),node('p','Convite: '+g.code,'sl-code'));row.append(col,button('Estatísticas',()=>act(()=>openStats(g))));lead.append(row)});
if(state.isLeader&&!state.leading.length)lead.append(node('p','Crie um grupo para começar.','sl-muted'))}
function kpi(parent,n,label){const box=node('div',undefined,'sl-kpi');box.append(node('b',n),node('small',label));parent.append(box)}
async function openStats(group){const data=await rpc('shema_group_overview',{p_group_id:group.id});$('slDashboard').hidden=false;$('slDashboardTitle').textContent='Acompanhamento · '+data.title;const out=$('slMetrics');out.replaceChildren();kpi(out,data.memberCount||0,'Participantes');kpi(out,data.synced7||0,'Sincronizações em 7 dias');kpi(out,data.synced30||0,'Sincronizações em 30 dias');kpi(out,Number(data.averageHouses||0).toFixed(1),'Média de casas concluídas');const list=$('slParticipants');list.replaceChildren();if(!data.members.length)list.append(node('p','Nenhum participante entrou no grupo.','sl-muted'));data.members.forEach(m=>{const row=node('div',undefined,'sl-row'),col=node('div');col.style.flex='1';const houses=Math.min(365,Math.max(0,Number(m.houses)||0));col.append(node('strong',m.name),node('p',houses+' de 365 casas · '+(Number(m.xp)||0)+' XP','sl-muted'));const bar=node('div',undefined,'sl-progress'),fill=node('i');fill.style.width=((houses/365)*100).toFixed(1)+'%';bar.append(fill);col.append(bar);const d=m.syncedAt&&new Date(m.syncedAt);col.append(node('p',d&&!Number.isNaN(d.getTime())?'Última sincronização: '+d.toLocaleDateString('pt-BR'):'Ainda sem progresso sincronizado','sl-muted'));row.append(col);list.append(row)})}
$('slJoin').addEventListener('click',()=>act(async()=>{if(!$('slConsent').checked)throw Error('Confirme seu consentimento para compartilhar as estatísticas.');await rpc('shema_group_join',{p_code:$('slCode').value.trim(),p_display_name:$('slName').value.trim()});$('slConsent').checked=false;$('slCode').value='';await loadState()}));
$('slCreate').addEventListener('click',()=>act(async()=>{await rpc('shema_group_create',{p_title:$('slGroupTitle').value.trim()});$('slGroupTitle').value='';await loadState()}));
function observe(){const s=session(),id=s&&s.user.id||'';if(id===seenId)return;seenId=id;state=null;$('slDashboard').hidden=true;$('slArea').hidden=!id||!env.cloudEnabled;if(!env.cloudEnabled){status('Acompanhamento indisponível: nuvem desativada.');return}if(!id){status('Entre em sua conta do Shema para acessar grupos.');return}status('Buscando seus grupos…');void act(loadState)}
window.addEventListener('focus',observe);document.addEventListener('visibilitychange',()=>{if(!document.hidden)observe()});setInterval(observe,3000);observe();
})();