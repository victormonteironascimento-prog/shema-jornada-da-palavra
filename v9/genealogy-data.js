/* SHEMA — Linhagens bíblicas, coletânea curada a partir do PDF fornecido pelo usuário.
  REFERÊNCIAS, NÃO TRANSCRIÇÕES de versões bíblicas.
  Mateus 1 e Lucas 3 preservados sem harmonização; nomes iguais em posições diferentes têm IDs distintos.
  O documento-fonte delimita explicitamente sua abrangência: não é cadastro de todos os personagens bíblicos.
*/
(function(){
'use strict';
const views=[];
function view(id,title,ref,summary){const v={id,title,ref,summary,nodes:[],links:[]};views.push(v);return v;}
function add(v,name,parent,ref,sub,opts){
 const id=v.id+'-'+v.nodes.length;
 const o=Object.assign({id,name,parent:parent||null,ref:ref||v.ref,sub:sub||'',mother:'',spouse:'',note:'',relation:'filiação',kind:'pessoa'},opts||{});
 v.nodes.push(o);
 if(parent)v.links.push({from:parent,to:id,type:o.relation});
 return id;
}
function chain(v,names,ref,opts){
 let prev=null;
 names.forEach((name,i)=>{const settings=opts&&opts(name,i)||{};prev=add(v,name,prev,ref,settings.sub||'',settings);});
 return prev;
}
function children(v,parent,names,ref,options){
 const out={};names.forEach(name=>out[name]=add(v,name,parent,ref,'',options&&options[name]||{}));return out;
}
// Mateus: genealogia régia e legal; a última seta NÃO é uma filiação biológica atribuída a José.
const m=view('mateus','Linhagem de Mateus','Mateus 1:1–17','De Abraão a Jesus, por Davi e Salomão. Sequência própria de Mateus; Jesus nasceu de Maria, esposa de José.');
chain(m,'Abraão|Isaque|Jacó|Judá|Perez|Esrom|Arão|Aminadabe|Naassom|Salmom|Boaz|Obede|Jessé|Davi|Salomão|Roboão|Abias|Asa|Josafá|Jorão|Uzias|Jotão|Acaz|Ezequias|Manassés|Amom|Josias|Jeconias|Salatiel|Zorobabel|Abiúde|Eliaquim|Azor|Sadoque|Aquim|Eliúde|Eleazar|Matã|Jacó|José|Jesus'.split('|'),m.ref,(name,i)=>({
 sub:name==='Jesus'?'Nascido de Maria':name==='José'?'Marido de Maria':name==='Davi'?'Rei de Israel':'',
 mother:({'Perez':'Tamar','Boaz':'Raabe','Obede':'Rute','Salomão':'Mulher de Urias','Jesus':'Maria'})[name]||'',
 relation:name==='Jesus'?'vínculo legal, não biológico':'filiação / sequência genealógica',
 note:name==='Jesus'?'Mateus 1:16 distingue José, marido de Maria, de Jesus nascido de Maria.':name==='Salomão'?'Mateus descreve sua mãe como a mulher que fora de Urias.':''
}));
// Lucas: sequência TEXTUAL de Jesus rumo a Deus, invertida aqui apenas para desenhar do início ao fim.
const l=view('lucas','Linhagem de Lucas','Lucas 3:23–38','Sequência própria de Lucas, com a ressalva “conforme se pensava” sobre Jesus e José; não é harmonizada com Mateus.');
const lucas='Jesus|José|Eli|Matate|Levi|Melqui|Janai|José|Matatias|Amós|Naum|Esli|Nagai|Maate|Matatias|Semei|José|Jodá|Joanã|Resa|Zorobabel|Salatiel|Neri|Melqui|Adi|Cosã|Elmadã|Er|Josué|Eliézer|Jorim|Matate|Levi|Simeão|Judá|José|Jonã|Eliaquim|Meleá|Mená|Matatá|Natã|Davi|Jessé|Obede|Boaz|Salá|Naassom|Aminadabe|Admim|Arni|Esrom|Perez|Judá|Jacó|Isaque|Abraão|Tera|Naor|Serugue|Ragaú|Faleque|Éber|Salá|Cainã|Arfaxade|Sem|Noé|Lameque|Metusalém|Enoque|Jarede|Maalalel|Cainã|Enos|Sete|Adão|Deus'.split('|').reverse();
chain(l,lucas,l.ref,(name,i)=>({
 sub:name==='Deus'?'Criador; não antepassado humano':name==='Jesus'?'Conforme se pensava, filho de José':name==='Natã'?'Ramo distinto de Salomão':'',
 relation:i===1?'criação — não filiação humana':name==='Jesus'?'vínculo descrito como “conforme se pensava”':'sequência genealógica',
 note:name==='Deus'?'Lucas termina a lista com Adão, de Deus; esta não é uma relação de geração humana.':name==='Jesus'?'Lucas 3:23 ressalva a atribuição de filiação a José.':name==='Cainã'?'Há mais de uma ocorrência desse nome na sequência. Nomes iguais permanecem distintos.':name==='Admim'||name==='Arni'?'Lucas 3:33 tem variantes textuais em diferentes tradições.':''
}));
const g=view('origens','Adão, Caim e Sete','Gênesis 4–5','Primeiras famílias; ramo de Caim distinguido do ramo de Sete. Relações apenas onde explícitas.');
const adam=add(g,'Adão',null,'Gênesis 2–5','Primeiro homem',{spouse:'Eva'});
add(g,'Abel',adam,'Gênesis 4:2,8–10','Irmão de Caim',{note:'Não há descendência narrada.'});
const caim=add(g,'Caim',adam,'Gênesis 4:1–22','Filho de Adão e Eva');
chainFrom(g,caim,'Enoque|Irade|Meujael|Metusael|Lameque'.split('|'),'Gênesis 4:17–22',function(last){
 const childrenL=children(g,last,'Jabal|Jubal|Tubalcaim|Naamá'.split('|'),'Gênesis 4:19–22');
 g.nodes.find(n=>n.id===last).spouse='Ada e Zilá';
 g.nodes.find(n=>n.id===childrenL.Jabal).mother='Ada';
 g.nodes.find(n=>n.id===childrenL.Jubal).mother='Ada';
 g.nodes.find(n=>n.id===childrenL.Tubalcaim).mother='Zilá';
 g.nodes.find(n=>n.id===childrenL.Naamá).mother='Zilá';
});
const sete=add(g,'Sete',adam,'Gênesis 4:25; 5:3','Linha de Sete');
const ng=chainFrom(g,sete,'Enos|Cainã|Maalaleel|Jarede|Enoque|Matusalém|Lameque|Noé'.split('|'),'Gênesis 5:6–32');
children(g,ng,'Sem|Cam|Jafé'.split('|'),'Gênesis 5:32');
function chainFrom(v,parent,names,ref,after){let p=parent;names.forEach(n=>p=add(v,n,p,ref));if(after)after(p);return p;}
const n=view('noe','Nações e famílias de Noé','Gênesis 10–11','Filhos e descendências nomeadas de Sem, Cam e Jafé. Povos e clãs são coletividades, não indivíduos.');
const no=add(n,'Noé',null,'Gênesis 10:1');
const noS=children(n,no,'Sem|Cam|Jafé'.split('|'),'Gênesis 10:1');
const j=children(n,noS.Jafé,'Gômer|Magogue|Madai|Javã|Tubal|Meseque|Tirás'.split('|'),'Gênesis 10:2');
children(n,j.Gômer,'Asquenaz|Rifate|Togarma'.split('|'),'Gênesis 10:3');
children(n,j.Javã,'Elisá|Társis|Quitim|Rodanim'.split('|'),'Gênesis 10:4',{'Rodanim':{note:'Também aparece a variante Dodanim.'}});
const ca=children(n,noS.Cam,'Cuxe|Mizraim|Pute|Canaã'.split('|'),'Gênesis 10:6');
const cx=children(n,ca.Cuxe,'Sebá|Havilá|Sabtá|Raamá|Sabtecá|Ninrode'.split('|'),'Gênesis 10:7–12');
children(n,cx.Raamá,'Sabá|Dedã'.split('|'),'Gênesis 10:7');
children(n,ca.Canaã,'Sidom|Hete'.split('|'),'Gênesis 10:15');
const sm=children(n,noS.Sem,'Elão|Assur|Arfaxade|Lude|Arã'.split('|'),'Gênesis 10:22');
children(n,sm.Arã,'Uz|Hul|Géter|Meseque'.split('|'),'Gênesis 10:23',{'Meseque':{note:'Variante: Más.'}});
const he=chainFrom(n,sm.Arfaxade,'Salá|Héber'.split('|'),'Gênesis 10:24');
children(n,he,'Pelegue|Joctã'.split('|'),'Gênesis 10:25');
const pat=view('patriarcas','Abraão e os patriarcas','Gênesis 11:27–32; 22:20–24; 25:1–34; 29–30; 35; 46','Ramos de Tera, Abraão, Ismael, Isaque e Jacó, com mães identificadas quando o texto as nomeia.');
const tera=add(pat,'Tera',null,'Gênesis 11:26–32');
const teraS=children(pat,tera,'Abraão|Naor|Harã'.split('|'),'Gênesis 11:26–27');
children(pat,teraS.Harã,'Ló|Milca|Iscá'.split('|'),'Gênesis 11:27–29');
const ab=children(pat,teraS.Abraão,'Ismael|Isaque|Zinrã|Jocsã|Medã|Midiã|Isbaque|Suá'.split('|'),'Gênesis 25:1–4,12–26',{
'Ismael':{mother:'Hagar'},'Isaque':{mother:'Sara'},'Zinrã':{mother:'Quetura'},'Jocsã':{mother:'Quetura'},'Medã':{mother:'Quetura'},'Midiã':{mother:'Quetura'},'Isbaque':{mother:'Quetura'},'Suá':{mother:'Quetura'}
});
children(pat,ab.Ismael,'Nebaiote|Quedar|Adbeel|Mibsão|Misma|Dumá|Massá|Hadade|Temá|Jetur|Nafis|Quedemá'.split('|'),'Gênesis 25:13–16');
children(pat,ab.Jocsã,'Sabá|Dedã'.split('|'),'Gênesis 25:3');
children(pat,ab.Midiã,'Efá|Éfer|Enoque|Abida|Elda'.split('|'),'Gênesis 25:4');
const isa=children(pat,ab.Isaque,'Esaú|Jacó'.split('|'),'Gênesis 25:19–30',{'Esaú':{mother:'Rebeca'},'Jacó':{mother:'Rebeca'}});
const sons=children(pat,isa.Jacó,'Rúben|Simeão|Levi|Judá|Issacar|Zebulom|Diná|Dã|Naftali|Gade|Aser|José|Benjamim'.split('|'),'Gênesis 29–30; 35:22–26');
Object.entries(sons).forEach(([name,id])=>{const p=pat.nodes.find(x=>x.id===id);p.mother='Rúben Simeão Levi Judá Issacar Zebulom Diná'.split(' ').includes(name)?'Lia':'Dã Naftali'.split(' ').includes(name)?'Bila':'Gade Aser'.split(' ').includes(name)?'Zilpa':'Raquel';});
children(pat,sons.José,'Manassés|Efraim'.split('|'),'Gênesis 41:50–52; 46:20',{'Manassés':{mother:'Azenate'},'Efraim':{mother:'Azenate'}});
const rv=view('rute','De Perez a Davi','Rute 4:18–22','Lista de gerações em Rute, preservando todos os elos explicitados no relato.');
chain(rv,'Perez|Hezrom|Rão|Aminadabe|Naassom|Salmom|Boaz|Obede|Jessé|Davi'.split('|'),rv.ref,(name)=>({
 mother:name==='Obede'?'Rute':'',spouse:name==='Boaz'?'Rute':'',
 note:name==='Obede'?'Filho de Boaz e Rute.':''}));
const lev=view('levitas','Levi, sacerdotes e Moisés','Êxodo 6:16–25; Números 26:57–61; 1 Crônicas 6:1–15','Principais famílias levíticas e linha sacerdotal; não representa todos os levitas registrados.');
const levi=add(lev,'Levi',null,'Êxodo 6:16');
const levS=children(lev,levi,'Gérson|Coate|Merari'.split('|'),'Êxodo 6:16');
children(lev,levS.Gérson,'Libni|Simei'.split('|'),'Êxodo 6:17');
children(lev,levS.Merari,'Mali|Musi'.split('|'),'Êxodo 6:19');
const co=children(lev,levS.Coate,'Anrão|Isar|Hebrom|Uziel'.split('|'),'Êxodo 6:18');
const am=children(lev,co.Anrão,'Arão|Moisés|Miriã'.split('|'),'Êxodo 6:20; Números 26:59',{'Arão':{mother:'Joquebede'},'Moisés':{mother:'Joquebede'},'Miriã':{mother:'Joquebede'}});
const ar=children(lev,am.Arão,'Nadabe|Abiú|Eleazar|Itamar'.split('|'),'Êxodo 6:23',{'Nadabe':{mother:'Eliseba'},'Abiú':{mother:'Eliseba'},'Eleazar':{mother:'Eliseba'},'Itamar':{mother:'Eliseba'}});
chainFrom(lev,ar.Eleazar,'Fineias|Abisua|Buqui|Uzi|Zeraías|Meraiote|Amarias|Aitube|Zadoque|Aimaás'.split('|'),'1 Crônicas 6:4–8');
const kr=view('reis','Casa de Davi e reis de Judá','1 Crônicas 3:1–24','Linha régia e filhos nomeados de Davi. A ordem é a de Crônicas, não um preenchimento de Mateus.');
const dav=add(kr,'Davi',null,'1 Crônicas 3:1–9','Rei de Israel');
const dk=children(kr,dav,'Amnom|Daniel|Absalão|Adonias|Sefatias|Itreão|Simeia|Sobabe|Natã|Salomão|Tamar'.split('|'),'1 Crônicas 3:1–9',{
'Amnom':{mother:'Ainoã'},'Daniel':{mother:'Abigail'},'Absalão':{mother:'Maaca'},'Adonias':{mother:'Hagite'},'Sefatias':{mother:'Abital'},'Itreão':{mother:'Eglá'},
'Simeia':{mother:'Bate-Seba'},'Sobabe':{mother:'Bate-Seba'},'Natã':{mother:'Bate-Seba'},'Salomão':{mother:'Bate-Seba'},'Tamar':{note:'É chamada irmã dos filhos de Davi.'}
});
const endR=chainFrom(kr,dk.Salomão,'Roboão|Abias|Asa|Josafá|Jeorão|Acazias|Joás|Amazias|Azarias|Jotão|Acaz|Ezequias|Manassés|Amom|Josias'.split('|'),'1 Crônicas 3:10–14');
const jos=children(kr,endR,'Joanã|Jeoaquim|Zedequias|Salum'.split('|'),'1 Crônicas 3:15');
const jeco=add(kr,'Jeconias',jos.Jeoaquim,'1 Crônicas 3:16');
const jec=children(kr,jeco,'Sealtiel|Malquirão|Pedaías|Senazar|Jecamias|Hosama|Nedabias'.split('|'),'1 Crônicas 3:17–18');
add(kr,'Zorobabel',jec.Pedaías,'1 Crônicas 3:19','',{note:'1 Crônicas 3 associa Zorobabel a Pedaías; Mateus e Lucas apresentam outras sequências.'});
const s=view('saul','Casa de Saul e Jônatas','1 Crônicas 8:33–40','Linhagem de Saul e descendentes de Jônatas, preservados na ordem desta passagem.');
chain(s,'Ner|Quis|Saul|Jônatas|Meribe-Baal|Mica'.split('|'),s.ref);
const saulId=s.nodes.find(n=>n.name==='Saul').id;
children(s,saulId,'Malquisua|Abinadabe|Esbaal'.split('|'),s.ref);
const micaId=s.nodes.find(n=>n.name==='Mica').id;
const ms=children(s,micaId,'Pitom|Meleque|Tareia|Acaz'.split('|'),s.ref);
const jeoada=add(s,'Jeoada',ms.Acaz,s.ref);
const jeS=children(s,jeoada,'Alemete|Azmavete|Zinri'.split('|'),s.ref);
const ae=chainFrom(s,jeS.Zinri,'Mosa|Bineá|Rafa|Eleasa|Azel'.split('|'),s.ref);
children(s,ae,'Azricão|Bocru|Ismael|Searias|Obadias|Hanã'.split('|'),s.ref);
const ev=view('evangelhos','Famílias dos Evangelhos','Lucas 1–2; Marcos 1, 6, 15; João 11; Mateus 1','Relações familiares narrativas. Famílias independentes são raízes distintas; não são inventadas conexões entre elas.');
const zac=add(ev,'Zacarias',null,'Lucas 1:5–25','Sacerdote',{spouse:'Isabel'});
add(ev,'João Batista',zac,'Lucas 1:57–63','Filho de Zacarias',{mother:'Isabel'});
const ze=add(ev,'Zebedeu',null,'Marcos 1:19–20');
children(ev,ze,'Tiago|João'.split('|'),'Marcos 1:19–20');
const sim=add(ev,'Simão de Cirene',null,'Marcos 15:21');
children(ev,sim,'Alexandre|Rufo'.split('|'),'Marcos 15:21');
const fam=add(ev,'Família de Betânia',null,'João 11:1–5','',{kind:'agrupamento',note:'Lázaro, Maria e Marta são irmãos, não filhos de uma pessoa nomeada.'});
children(ev,fam,'Lázaro|Maria (Betânia)|Marta'.split('|'),'João 11:1–5',{
'Lázaro':{relation:'irmãos — agrupamento familiar'},'Maria (Betânia)':{relation:'irmãos — agrupamento familiar'},'Marta':{relation:'irmãos — agrupamento familiar'}
});
const na=add(ev,'Alfeu',null,'Marcos 3:18');
add(ev,'Tiago (filho de Alfeu)',na,'Marcos 3:18');
// Contextos críticos, limitados às referências consultadas.
const details={
'Deus':['Criador','Lucas 3:38; Gênesis 1:1','Lucas encerra sua genealogia em Adão, de Deus. Deus não integra uma geração humana.'],
'Adão':['Origem da humanidade','Gênesis 2–5; Lucas 3:38','A linhagem de Sete e o ramo de Caim não devem ser confundidos.'],
'Noé':['Ancestral de Sem, Cam e Jafé','Gênesis 5:28–32; 10:1','As linhas de Gênesis 10 também apresentam povos e clãs.'],
'Abraão':['Patriarca','Gênesis 12; 17; 22; 25','Associado à promessa divina e às linhagens de Isaque, Ismael e filhos de Quetura.'],
'Isaque':['Filho de Abraão e Sara','Gênesis 21; 25','Pai dos gêmeos Esaú e Jacó, com Rebeca.'],
'Jacó':['Também chamado Israel','Gênesis 25; 29–35','Pai das tribos, com filhos de Lia, Raquel, Bila e Zilpa.'],
'Judá':['Filho de Jacó e Lia','Gênesis 29:35; 38; 49; Mateus 1','A linhagem de Perez é destacada na história de Rute.'],
'Boaz':['Marido de Rute','Rute 4:13–22; Mateus 1:5','Pai de Obede com Rute; aparece nas duas genealogias evangélicas.'],
'Davi':['Rei de Israel','1 Samuel 16; Rute 4:22; 1 Crônicas 3','Mateus segue Salomão; Lucas segue Natã.'],
'José':['Marido de Maria','Mateus 1:16–25; Lucas 3:23','Não interpretar a conexão com Jesus como paternidade biológica; Lucas traz “conforme se pensava”.'],
'Jesus':['O Cristo','Mateus 1:16; Lucas 3:23','Mateus diz que Jesus nasceu de Maria, mulher de José. Lucas qualifica a relação com José.'],
'Natã':['Filho de Davi','1 Crônicas 3:5; Lucas 3:31','Figura na sequência lucana em lugar de Salomão.'],
'Salomão':['Filho de Davi','1 Crônicas 3:5,10; Mateus 1:6–7','A genealogia de Mateus segue a linha régia de Salomão.'],
'Rute':['Mulher de Boaz','Rute 4:13–22; Mateus 1:5','Mãe de Obede, segundo Rute.'],
'Moisés':['Da família levítica','Êxodo 6:20; Números 26:59','Filho de Anrão e Joquebede, irmão de Arão e Miriã.'],
'Arão':['Sacerdote da família de Levi','Êxodo 6:20–25','Pai de Nadabe, Abiú, Eleazar e Itamar, com Eliseba.']
};
Object.freeze(views);
window.ShemaGenealogyData=Object.freeze({views,details});
})();