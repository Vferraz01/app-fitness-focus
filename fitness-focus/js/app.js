const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='prumo_v1'; // chave mantida para não perder dados já salvos
const ymd=d=>d.toLocaleDateString('sv-SE');
let S={profile:{sexo:'m',idade:30,peso:75,altura:175,ativ:1.55,obj:'manter'},plan:[],wp:{goal:'hipertrofia',loc:'academia',days:4},diet:{},water:{}};
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
S.rem=S.rem||{on:false,iv:30};S.dd=S.dd||{};S.best=S.best||{};S.e1=S.e1||{};S.bd=S.bd||{};S.menu=S.menu||{};
let cref=null,ct=0,ready=false,first=true;
const setSync=m=>{const e=$('#sync');if(e)e.textContent=m};
const save=()=>{S._ts=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(cref&&ready){clearTimeout(ct);ct=setTimeout(push,1200);setSync('Salvando…')}};
function push(){if(!cref)return;cref.set({json:JSON.stringify(S),ts:S._ts||(S._ts=Date.now())}).then(()=>setSync('☁️ Salvo na sua conta'),()=>setSync('Falha ao sincronizar; dados salvos só neste aparelho'))}
let date=ymd(new Date()),lm='Almoço';
const TABS=[['inicio','🏠','Início'],['treino','🏋️','Treino'],['evolucao','📈','Evolução'],['dieta','🍽️','Dieta'],['agua','💧','Água'],['perfil','👤','Perfil']];
const MEALS=['Café da manhã','Almoço','Lanche','Jantar','Ceia'];
// exercícios: nome, grupo, local (a=academia, o=ar livre, b=ambos)
const EX=[['Supino reto','peito','a'],['Supino inclinado','peito','a'],['Crucifixo','peito','a'],['Flexão de braço','peito','o'],['Flexão inclinada','peito','o'],['Flexão declinada','peito','o'],
['Puxada frontal','costas','a'],['Remada curvada','costas','a'],['Remada baixa','costas','a'],['Barra fixa','costas','o'],['Remada australiana','costas','o'],['Superman no solo','costas','o'],
['Agachamento livre','pernas','a'],['Leg press','pernas','a'],['Cadeira extensora','pernas','a'],['Mesa flexora','pernas','a'],['Stiff','pernas','a'],['Elevação pélvica','pernas','a'],
['Agachamento com peso do corpo','pernas','o'],['Afundo','pernas','o'],['Agachamento búlgaro','pernas','o'],['Elevação pélvica no solo','pernas','o'],['Panturrilha no degrau','pernas','o'],['Agachamento com salto','pernas','o'],
['Desenvolvimento com halteres','ombros','a'],['Elevação lateral','ombros','a'],['Elevação frontal','ombros','a'],['Flexão pike','ombros','o'],['Elevação lateral com mochila','ombros','o'],['Remada alta com mochila','ombros','o'],
['Rosca direta','braços','a'],['Tríceps pulley','braços','a'],['Rosca martelo','braços','a'],['Tríceps testa','braços','a'],['Mergulho no banco','braços','o'],['Barra fixa supinada','braços','o'],['Flexão diamante','braços','o'],
['Abdominal na máquina','core','a'],['Prancha','core','b'],['Elevação de pernas','core','b'],['Abdominal canivete','core','o'],
['Esteira','cardio','a'],['Bicicleta ergométrica','cardio','a'],['Corrida','cardio','o'],['Pular corda','cardio','b'],['Burpee','cardio','b'],['Polichinelo','cardio','o']];
const FOODS=[['Arroz cozido',128,2.5,28,.2],['Feijão cozido',76,4.8,14,.5],['Frango grelhado',159,32,0,2.5],['Ovo cozido',155,13,1.1,11],['Carne bovina magra grelhada',219,32,0,9],['Tilápia grelhada',128,26,0,2.7],['Batata-doce cozida',77,.6,18,.1],['Pão francês',300,8,58,3.1],['Aveia em flocos',394,14,67,8.5],['Banana',89,1.1,23,.3],['Maçã',52,.3,14,.2],['Leite integral',61,3.2,4.7,3.3],['Iogurte natural',61,3.5,4.7,3.3],['Whey protein',400,80,8,6],['Pasta de amendoim',588,25,20,50],['Azeite de oliva',884,0,0,100],['Arroz integral cozido',124,2.6,25.8,1],['Macarrão cozido',158,5.8,30.9,.9],['Pão integral',253,9.4,49.9,3.4],['Batata inglesa cozida',52,1.2,11.9,0],['Mandioca cozida',125,.6,30.1,.3],['Queijo minas frescal',264,17.4,3.2,20.2],['Queijo cottage',98,11,3.4,4.3],['Atum em conserva',116,25.5,0,.8],['Salmão grelhado',206,22,0,12],['Tofu',76,8.1,1.9,4.8],['Lentilha cozida',116,9,20,.4],['Grão-de-bico cozido',164,8.9,27.4,2.6],['Brócolis cozido',35,2.4,7.2,.4],['Alface',15,1.4,2.9,.2],['Tomate',18,.9,3.9,.2],['Cenoura cozida',35,.8,8.2,.2],['Abobrinha cozida',15,1.1,2.7,.4],['Mamão papaia',43,.5,11,.3],['Laranja',47,.9,11.8,.1],['Morango',32,.7,7.7,.3],['Abacate',160,2,8.5,14.7],['Amêndoas',579,21,22,50],['Iogurte grego natural',97,9,3.9,5],['Leite desnatado',35,3.4,5,.1]];
const GOALS={hipertrofia:['Ganho de massa',4,'8–12',75],forca:['Força',5,'3–6',120],emagrecimento:['Emagrecimento',3,'12–15',40],resistencia:['Resistência',3,'15–20',30]};
const TPL={full:['Corpo todo',{peito:1,costas:1,pernas:2,ombros:1,core:1}],upper:['Superiores',{peito:2,costas:2,ombros:1,braços:2}],lower:['Inferiores',{pernas:4,core:1}],push:['Empurrar',{peito:2,ombros:2}],pull:['Puxar',{costas:3,braços:2}],legs:['Pernas',{pernas:4,core:1}]};
Object.assign(TPL,{chest:['Peito',{peito:3,braços:1}],back:['Costas',{costas:3,braços:1}],sa:['Ombros e braços',{ombros:2,braços:3}],sh:['Ombros',{ombros:3,core:1}],arms:['Braços',{braços:4}]});
const SPLIT={2:['full','full'],3:['full','full','full'],4:['upper','lower','upper','lower'],5:['push','pull','legs','upper','lower'],6:['push','pull','legs','push','pull','legs']};

function calc(){const p=S.profile,tmb=10*p.peso+6.25*p.altura-5*p.idade+(p.sexo==='m'?5:-161),tdee=tmb*p.ativ;
 const kcal=Math.round(tdee*(p.obj==='perder'?.8:p.obj==='ganhar'?1.1:1)),prot=Math.round(p.peso*(p.obj==='perder'?2:p.obj==='ganhar'?1.8:1.6)),fat=Math.round(p.peso*.9),
 carb=Math.max(0,Math.round((kcal-prot*4-fat*9)/4)),agua=Math.round(p.peso*(p.ativ<1.4?35:p.ativ<1.7?40:45)/50)*50;
 return{tmb:Math.round(tmb),tdee:Math.round(tdee),kcal,prot,fat,carb,agua:S.profile.aguaM>0?S.profile.aguaM:agua,aguaSug:agua}}

function gen(){const{goal,loc,days}=S.wp,[,sets,reps,rest]=GOALS[goal],cnt={},L='ABCDEF';
 S.plan=STR[S.wp.strat].s(days).map((t,i)=>{const[nm,gs]=TPL[t],items=[];
  for(const g in gs){const pool=EX.filter(e=>e[1]===g),o=cnt[g]||0;let n=0;
   for(let k=0;n<gs[g]&&k<pool.length;k++){const e=pool[(o+k)%pool.length];if(!items.some(x=>x.n===e[0])){items.push({n:e[0],s:sets,r:reps,rest,done:false});n++}}
   cnt[g]=o+gs[g]}
  if(goal==='emagrecimento'||goal==='resistencia'){const c=EX.filter(e=>e[1]==='cardio');items.push({n:c[i%c.length][0],s:1,r:'15–20 min',rest:0,done:false})}
  return{name:'Dia '+L[i]+' · '+nm,items}});save()}

const DESC={'Supino reto':'Deitado no banco, desça a barra até o peito e empurre até estender os cotovelos, mantendo as escápulas juntas.','Supino inclinado':'Mesmo movimento do supino, com o banco inclinado (30–45°), enfatizando a parte superior do peito.','Crucifixo':'Com os cotovelos levemente flexionados, abra os braços em arco até sentir o peito alongar e feche juntando as mãos.','Flexão de braço':'Mãos na largura dos ombros e corpo alinhado; desça o peito perto do chão e empurre de volta.','Flexão inclinada':'Mãos apoiadas em banco ou degrau; versão mais leve da flexão, boa para iniciantes.','Flexão declinada':'Pés elevados em um banco; desça o peito até quase tocar o chão. Trabalha mais a parte superior do peito e os ombros.','Puxada frontal':'Puxe a barra até a altura do queixo levando os cotovelos para baixo e para trás, sem balançar o tronco.','Remada curvada':'Tronco inclinado e coluna neutra; puxe a barra em direção ao abdômen e desça com controle.','Remada baixa':'Sentado no cabo, puxe o triângulo até o abdômen juntando as escápulas, sem jogar o tronco para trás.','Barra fixa':'Pendurado na barra, puxe o corpo até o queixo passar da barra e desça devagar até estender os braços.','Remada australiana':'Deitado sob uma barra baixa, com o corpo reto, puxe o peito até a barra. Quanto mais em pé o corpo, mais fácil.','Superman no solo':'De bruços, eleve braços e pernas ao mesmo tempo, segure 2 s e desça. Fortalece lombar e costas.','Agachamento livre':'Barra apoiada nas costas e pés na largura dos ombros; desça até as coxas ficarem paralelas ao chão, joelhos alinhados aos pés.','Leg press':'Pés na plataforma na largura dos ombros; flexione os joelhos até cerca de 90° e empurre sem travar os joelhos.','Cadeira extensora':'Sentado, estenda os joelhos até esticar as pernas e desça devagar. Foco no quadríceps.','Mesa flexora':'Deitado, flexione os joelhos levando o calcanhar ao glúteo e retorne com controle. Foco na parte de trás da coxa.','Stiff':'Joelhos levemente flexionados, desça a barra rente às pernas levando o quadril para trás e suba contraindo os glúteos.','Elevação pélvica':'Costas apoiadas no banco e barra sobre o quadril; suba o quadril até alinhar tronco e coxas, contraindo o glúteo.','Agachamento com peso do corpo':'Pés na largura dos ombros; sente para trás como em uma cadeira, peito aberto, e volte empurrando o chão.','Afundo':'Dê um passo à frente e desça até os dois joelhos formarem cerca de 90°; empurre de volta e alterne as pernas.','Agachamento búlgaro':'Pé de trás apoiado em um banco; desça com a perna da frente até a coxa ficar paralela ao chão.','Elevação pélvica no solo':'Deitado, pés no chão e joelhos dobrados; suba o quadril contraindo o glúteo e desça sem apoiar no chão.','Panturrilha no degrau':'Com a ponta dos pés no degrau, suba o máximo que puder e desça alongando o calcanhar abaixo do degrau.','Agachamento com salto':'Agache e salte de forma explosiva, aterrissando com os joelhos flexionados para amortecer.','Desenvolvimento com halteres':'Sentado ou em pé, empurre os halteres da altura dos ombros até acima da cabeça e desça com controle.','Elevação lateral':'Braços ao lado do corpo, eleve os halteres até a altura dos ombros com os cotovelos levemente flexionados.','Elevação frontal':'Eleve o halter à frente do corpo até a altura dos ombros e desça devagar, sem balançar o tronco.','Flexão pike':'Quadril elevado, corpo em V invertido; flexione os cotovelos levando a cabeça em direção ao chão. Foco nos ombros.','Elevação lateral com mochila':'Segure a mochila com carga pela alça e eleve o braço para o lado até a altura do ombro.','Remada alta com mochila':'Segure a mochila à frente e puxe-a rente ao corpo até o peito, com os cotovelos acima das mãos.','Rosca direta':'Cotovelos junto ao corpo, flexione os braços levando a barra aos ombros e desça sem balançar.','Tríceps pulley':'Cotovelos fixos ao lado do corpo, empurre a barra para baixo até estender os braços e volte devagar.','Rosca martelo':'Pegada neutra, com as palmas voltadas uma para a outra; flexione o cotovelo levando o halter ao ombro.','Tríceps testa':'Deitado, flexione os cotovelos levando a barra em direção à testa e estenda sem abrir os cotovelos.','Mergulho no banco':'Mãos apoiadas no banco atrás do corpo; flexione os cotovelos até cerca de 90° e estenda. Foco no tríceps.','Barra fixa supinada':'Barra fixa com as palmas voltadas para você; puxe até o queixo passar da barra. Trabalha bíceps e costas.','Flexão diamante':'Mãos juntas formando um losango sob o peito; faça a flexão com os cotovelos junto ao corpo. Foco no tríceps.','Abdominal na máquina':'Flexione o tronco contraindo o abdômen, sem puxar com os braços, e retorne devagar.','Prancha':'Apoiado nos antebraços e nas pontas dos pés, corpo reto da cabeça aos calcanhares, abdômen contraído.','Elevação de pernas':'Deitado ou pendurado, eleve as pernas até cerca de 90° sem arquear a lombar e desça com controle.','Abdominal canivete':'Deitado, eleve ao mesmo tempo tronco e pernas tentando tocar os pés e retorne devagar.','Esteira':'Ajuste ritmo e inclinação para manter um esforço moderado, ainda conseguindo falar frases curtas; postura ereta.','Bicicleta ergométrica':'Banco na altura do quadril; pedale em ritmo constante, mantendo a coluna ereta.','Corrida':'Passadas leves e respiração regular; comece em ritmo confortável e aumente aos poucos.','Pular corda':'Pule com os pés juntos usando só o movimento dos punhos, aterrissando na ponta dos pés.','Burpee':'Agache, estenda as pernas para trás, faça uma flexão, volte e salte com os braços para cima.','Polichinelo':'Salte abrindo pernas e braços acima da cabeça e volte à posição inicial em ritmo constante.'};
const exDone=x=>{const l=x.log||[];return x.s>0&&Array.from({length:x.s},(_,j)=>l[j]&&l[j].d).every(Boolean)};
const setRows=(x,di,i)=>Array.from({length:x.s},(_,j)=>{const g=(x.log||[])[j]||{},a=`data-d="${di}" data-i="${i}" data-j="${j}"`;return`<div class="set${g.d?' on':''}"><input type="checkbox" data-f="sd" ${a}${g.d?' checked':''} aria-label="Série ${j+1} feita"><span>Série ${j+1}${g.d?` <small style="color:${g.xp>0?'var(--ok)':'var(--warn)'}">${g.xp>0?'+'+r1(g.xp)+' pts':'carga leve: 0 pts'}</small>`:''}</span><input type="number" min="0" inputmode="numeric" data-f="sl" data-k="r" ${a} placeholder="${esc(x.r)}" value="${g.r??''}" aria-label="${isC(x)?'Tempo em minutos':'Repetições feitas'}">${isC(x)?(isDist(x)?`<input type="number" min="0" step="0.1" data-f="sl" data-k="w" ${a} placeholder="km" value="${g.w??''}" aria-label="Distância em km">`:'<span></span>'):`<input type="number" min="0" step="0.5" data-f="sl" data-k="w" ${a} placeholder="kg" value="${g.w??''}" aria-label="Carga em kg">`}</div>`}).join('');
const mn=s=>{const[a,b]=(s||'0:0').split(':');return +a*60+ +b};
const hm=m=>{m=((Math.round(m)%1440)+1440)%1440;return String(m/60|0).padStart(2,'0')+':'+String(m%60).padStart(2,'0')};
const aw=()=>{const p=S.profile,a=mn(p.acorda||'07:00'),s=mn(p.dorme||'23:00');return{a,s,len:((s-a+1440)%1440)||1440}};
const paceF=h=>{const w=aw(),m=(h*60-w.a+1440)%1440;return m>w.len?((m-w.len)<(1440-w.len)/2?1:0):m/w.len};
const timeRow=()=>`<div class="row" style="margin-top:8px"><div><label>Horário em que acorda</label><input type="time" data-f="pr" data-k="acorda" value="${S.profile.acorda||'07:00'}"></div><div><label>Horário em que dorme</label><input type="time" data-f="pr" data-k="dorme" value="${S.profile.dorme||'23:00'}"></div></div>`;
let nextAt=0;
function armRem(){nextAt=S.rem.on?Date.now()+S.rem.iv*6e4:0}
const remN=()=>Math.max(1,Math.floor(aw().len/S.rem.iv));
const remAmt=()=>Math.round(calc().agua/remN()/10)*10;
function tick(){if(!S.rem.on||Date.now()<nextAt)return;nextAt=Date.now()+S.rem.iv*6e4;const n=new Date(),w=aw();if(((n.getHours()*60+n.getMinutes()-w.a+1440)%1440)>w.len)return;const ml=remAmt(),t=$('#toast');
 t.innerHTML=`💧 Hora de beber água: ${ml} ml <button class="pri sm" data-act="addR" data-v="${ml}">Já bebi</button><button class="sm" data-act="hideT">Depois</button>`;t.hidden=false;
 try{if(window.Notification&&Notification.permission==='granted')new Notification('Hora de beber água',{body:ml+' ml'})}catch(e){}}
setInterval(tick,15000);
const wCfg=c=>{const w=aw(),on=S.rem.on,nx=new Date(nextAt);
 return`<div class="card"><h3 style="margin-bottom:8px">Meta e lembretes</h3><div class="row"><div><label>Meta diária (ml)</label><input type="number" min="500" step="50" data-f="aguaM" value="${c.agua}"></div><div style="flex:0 0 auto"><button class="sm" data-act="aguaSug">Usar sugerida (${c.aguaSug} ml)</button></div></div>${timeRow()}
 <div class="row" style="margin-top:8px"><div><label>Lembrar a cada</label><select data-f="rem">${opts([[15,'15 min'],[30,'30 min'],[45,'45 min'],[60,'1 hora']],S.rem.iv)}</select></div><div style="flex:0 0 auto"><button class="${on?'':'pri'}" data-act="remOn">${on?'Desativar lembretes':'Ativar lembretes'}</button></div></div>
 <p class="msg">Você fica acordado por ${Math.floor(w.len/60)} h ${w.len%60} min: são ${remN()} lembretes de ${remAmt()} ml para chegar a ${c.agua} ml.${on?' Próximo aviso às '+hm(nx.getHours()*60+nx.getMinutes())+'.':''}</p>
 <p class="sub" style="margin:4px 0 0;font-size:14px">Os avisos funcionam com o site aberto; lembretes em segundo plano dependem do app instalado.</p></div>`};
const NAMES={3:['Café da manhã','Almoço','Jantar'],4:['Café da manhã','Almoço','Lanche','Jantar'],5:MEALS,6:['Café da manhã','Lanche da manhã','Almoço','Lanche da tarde','Jantar','Ceia']};
const TG={};
['Frango grelhado','Carne bovina magra grelhada','Tilápia grelhada','Salmão grelhado','Atum em conserva'].forEach(n=>TG[n]='M');
['Leite integral','Leite desnatado','Iogurte natural','Iogurte grego natural','Queijo minas frescal','Queijo cottage','Whey protein'].forEach(n=>TG[n]='L');
const fd=n=>FOODS.find(f=>f[0]===n);
const dietOk=n=>{const d=S.profile.dieta||'onivoro',t=TG[n]||'';return d==='vegetariano'?t!=='M':d==='semlactose'?t!=='L':true};
const mk=(n,g,role)=>{const f=fd(n),r=g/100;return{n,g,role,k:f[1]*r,p:f[2]*r,c:f[3]*r,f:f[4]*r}};
const rg=(g,s)=>Math.round(g/s)*s,cl=(v,a,b)=>Math.min(b,Math.max(a,v));
const fruitG=n=>({'Banana':100,'Maçã':130}[n]||150);
const addD=(d,n)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return ymd(x)};
const note=m=>{const t=$('#toast');t.innerHTML=esc(m)+' <button class="sm" data-act="hideT">Ok</button>';t.hidden=false};
const POOLS=g=>{const L=g==='perder',G=g==='ganhar';return{
 prot:L?['Frango grelhado','Tilápia grelhada','Atum em conserva','Ovo cozido','Tofu','Frango grelhado']:G?['Carne bovina magra grelhada','Frango grelhado','Salmão grelhado','Ovo cozido','Tilápia grelhada','Tofu']:['Frango grelhado','Carne bovina magra grelhada','Tilápia grelhada','Salmão grelhado','Ovo cozido','Tofu'],
 carb:L?['Batata-doce cozida','Arroz integral cozido','Batata inglesa cozida','Mandioca cozida']:G?['Arroz cozido','Macarrão cozido','Batata-doce cozida','Arroz cozido','Mandioca cozida']:['Arroz cozido','Batata-doce cozida','Arroz integral cozido','Macarrão cozido','Mandioca cozida'],
 leg:['Feijão cozido','Lentilha cozida','Feijão cozido','Grão-de-bico cozido'],
 veg:['Brócolis cozido','Cenoura cozida','Abobrinha cozida','Brócolis cozido'],
 cafeP:L?['Ovo cozido','Queijo cottage','Iogurte grego natural','Whey protein']:['Ovo cozido','Queijo minas frescal','Iogurte grego natural','Queijo cottage','Whey protein'],
 cafeC:L?['Pão integral','Aveia em flocos']:G?['Pão francês','Aveia em flocos','Pão integral']:['Pão integral','Aveia em flocos','Pão francês'],
 fruit:['Banana','Maçã','Mamão papaia','Laranja','Morango'],
 snkP:L?['Iogurte grego natural','Whey protein','Queijo cottage','Ovo cozido']:['Iogurte grego natural','Whey protein','Queijo minas frescal','Queijo cottage','Ovo cozido'],
 snkC:['Aveia em flocos','Pão integral','Banana'],
 ceiaP:['Queijo cottage','Iogurte grego natural','Whey protein','Ovo cozido','Tofu']}};
function genMeal(type,t,sd,goal){const P=POOLS(goal),it=[],add=(n,g,r)=>{if(n&&g>0)it.push(mk(n,g,r))},
 pk=(a,o)=>{const l=a.filter(dietOk);return l.length?l[(sd+o)%l.length]:null},
 pg=(n,rem,mn,mx)=>{const w=n==='Whey protein';return cl(rg(Math.max(0,rem)/(fd(n)[2]||.1)*100,w?5:10),w?20:mn,w?60:Math.min(mx,{'Ovo cozido':150,'Tofu':250}[n]||mx))},
 cg=(n,rem,mn,mx)=>cl(rg(Math.max(0,rem)/(fd(n)[3]||1)*100,5),mn,mx),left=k=>t[k]-sum(it)[k];
 if(type==='main'){add(pk(P.leg,0),goal==='perder'?80:goal==='ganhar'?120:100,'L');add(pk(P.veg,1),goal==='perder'?120:100,'V');add('Alface',50,'V');
  const pr=pk(P.prot,2);if(pr)add(pr,pg(pr,left('p'),60,300),'P');
  const cr=pk(P.carb,3);add(cr,cg(cr,left('c'),40,450),'C');
  add('Azeite de oliva',cl(Math.round(left('f')),3,goal==='perder'?8:15),'O')}
 else if(type==='cafe'){const fr=pk(P.fruit,1);add(fr,fruitG(fr),'F');
  const pr=pk(P.cafeP,0);if(pr)add(pr,pg(pr,left('p'),50,300),'P');
  const cr=pk(P.cafeC,2);add(cr,cg(cr,left('c'),30,200),'C')}
 else if(type==='snack'){const fr=pk(P.fruit,0);add(fr,fruitG(fr),'F');
  if(goal!=='perder')add('Pasta de amendoim',goal==='ganhar'?25:12,'N');
  const sp=pk(P.snkP,1);if(sp)add(sp,pg(sp,left('p'),50,300),'P');
  if(left('c')>20){const cr=pk(P.snkC,2);if(cr&&cr!==fr)add(cr,cg(cr,left('c'),20,120),'C')}}
 else{const pr=pk(P.ceiaP,0);if(pr)add(pr,pg(pr,t.p,50,300),'P');
  const fr=pk(P.fruit,3);add(fr,fruitG(fr),'F');
  if(left('c')>15)add('Aveia em flocos',cg('Aveia em flocos',left('c'),15,60),'C')}
 return it}
const sigOf=(c,n)=>[c.kcal,c.prot,c.carb,c.fat,n,S.profile.obj,S.profile.dieta||'onivoro',S.profile.acorda||'',S.profile.dorme||''].join('|');
function genMenu(dt,vv){const c=calc(),n=S.profile.refs||5,w=aw(),nm=NAMES[n],t0=w.a+30,t1=w.a+w.len-150,st=(t1-t0)/(n-1),wt=nm.map(x=>/Lanche|Ceia/.test(x)?.7:1.2),sw=wt.reduce((a,b)=>a+b,0),goal=S.profile.obj||'manter',dn=Math.floor(new Date(dt+'T12:00:00')/864e5);
 const meals=nm.map((x,i)=>{const s=wt[i]/sw,type=/Café/.test(x)?'cafe':/Almoço|Jantar/.test(x)?'main':/Ceia/.test(x)?'ceia':'snack',t={k:c.kcal*s,p:c.prot*s,c:c.carb*s,f:c.fat*s},seed=dn+vv*7+i*3;
  return{name:x,time:hm(t0+st*i),type,t,seed,items:genMeal(type,t,seed,goal)}});
 for(let r=0;r<3;r++){const tk=sum(meals.flatMap(m=>m.items)).k,f=cl(c.kcal/(tk||1),.7,1.4);if(Math.abs(f-1)<.04)break;
  meals.forEach(m=>m.items=m.items.map(e=>e.role==='C'?mk(e.n,cl(rg(e.g*f,5),30,450),'C'):e))}
 return{sig:sigOf(c,n),n,vv,meals}}
const mealPlan=c=>{const n=S.profile.refs||5,w=aw(),nm=NAMES[n],t0=w.a+30,t1=w.a+w.len-150,st=(t1-t0)/(n-1),wt=nm.map(x=>/Lanche|Ceia/.test(x)?.7:1.2),sw=wt.reduce((a,b)=>a+b),
 mu=S.menu[date],ok=mu&&mu.n===n,stale=ok&&mu.sig!==sigOf(c,n),T=ok?sum(mu.meals.flatMap(m=>m.items)):null;
 return`<div class="card"><h3 style="margin-bottom:8px">Plano de refeições</h3><div class="row"><div><label>Refeições por dia</label><select data-f="pr" data-k="refs">${opts([3,4,5,6].map(v=>[v,v]),n)}</select></div></div>
 <div class="row" style="margin-top:8px"><button class="pri" data-act="genMenu">${ok?'Gerar outro cardápio':'Gerar cardápio do dia'}</button><button data-act="genWeek">Gerar 7 dias</button>${mu?'<button data-act="clrMenu">Apagar cardápio</button>':''}</div>
 ${stale||(mu&&!ok)?'<p class="msg" style="color:var(--warn)">O perfil ou o número de refeições mudou desde que este cardápio foi gerado. Gere novamente para atualizar.</p>':''}
 ${T?`<p class="msg">Cardápio: ${Math.round(T.k)} kcal · P ${Math.round(T.p)} · C ${Math.round(T.c)} · G ${Math.round(T.f)} g<br><small style="color:var(--mu)">Meta: ${c.kcal} kcal · P ${c.prot} · C ${c.carb} · G ${c.fat} g. Quantidades em g, alimentos já cozidos ou prontos.${T.p<c.prot*.9?' A proteína ficou abaixo da meta: considere uma fonte extra (por exemplo, whey ou mais leguminosas).':''}</small></p>`:''}
 ${c.kcal<1400||S.profile.idade<18?'<p class="msg" style="color:var(--warn)">Sua meta calórica é baixa ou você tem menos de 18 anos: converse com um nutricionista antes de seguir um cardápio.</p>':''}
 ${nm.map((x,i)=>{const s=wt[i]/sw,m=ok?mu.meals[i]:null;
  if(!m)return`<div class="li"><span>${hm(t0+st*i)} · ${x}</span><small>~${Math.round(c.kcal*s)} kcal · P ${Math.round(c.prot*s)} · C ${Math.round(c.carb*s)} · G ${Math.round(c.fat*s)} g</small></div>`;
  const ms=sum(m.items);
  return`<div style="border-top:1px solid var(--bd);padding:8px 0"><div class="row" style="align-items:center"><b style="flex:1 1 140px">${m.time} · ${esc(m.name)}</b><small style="flex:0 1 auto;color:var(--mu)">${Math.round(ms.k)} kcal · P ${Math.round(ms.p)} · C ${Math.round(ms.c)} · G ${Math.round(ms.f)}</small></div>
  ${m.items.map(e=>`<div class="li" style="border:0;padding:3px 0"><span>${esc(e.n)}${e.n==='Ovo cozido'?` (≈${Math.max(1,Math.round(e.g/50))} un)`:''}</span><small>${e.g} g · ${Math.round(e.k)} kcal</small></div>`).join('')}
  <div class="row" style="margin-top:6px"><button class="sm${m.ids?'':' pri'}" data-act="${m.ids?'undoM':'regM'}" data-i="${i}">${m.ids?'Registrado ✓ (desfazer)':'Registrar refeição'}</button>${m.ids?'':`<button class="sm" data-act="swapM" data-i="${i}">Trocar</button>`}</div></div>`}).join('')}
 <p class="sub" style="margin:8px 0 0;font-size:14px">Intervalo de cerca de ${r1(st/60)} h entre refeições, do despertar até 2h30 antes de dormir. O cardápio usa suas metas, seu objetivo, sua preferência alimentar e seus horários (perfil).</p></div>`};
const sum=l=>l.reduce((a,e)=>({k:a.k+e.k,p:a.p+e.p,c:a.c+e.c,f:a.f+e.f}),{k:0,p:0,c:0,f:0});
const r1=n=>Math.round(n*10)/10;
const bar=(v,m,col)=>`<div class="bar"><i style="width:${Math.min(100,m?v/m*100:0)}%;background:${col}"></i></div>`;
const opts=(a,sel)=>a.map(([v,t])=>`<option value="${v}"${String(v)===String(sel)?' selected':''}>${esc(t)}</option>`).join('');

const STR={full:{n:'Corpo todo (full body)',d:[2,3,4],s:d=>Array(d).fill('full'),t:'Todos os grupos musculares em cada treino.'},
ul:{n:'Superiores e inferiores',d:[2,4,6],s:d=>Array.from({length:d},(_,i)=>i%2?'lower':'upper'),t:'Alterna treinos de parte superior do corpo e de pernas.'},
ppl:{n:'Empurrar, puxar e pernas',d:[3,6],s:d=>Array.from({length:d},(_,i)=>['push','pull','legs'][i%3]),t:'Empurrar (peito, ombros), puxar (costas, bíceps) e pernas.'},
hib:{n:'Híbrido: empurrar, puxar, pernas + superiores e inferiores',d:[5],s:()=>['push','pull','legs','upper','lower'],t:'Combina os dois modelos anteriores para chegar a 5 dias.'},
grp:{n:'Peito, costas, pernas e braços (por grupo)',d:[4,5],s:d=>d===4?['chest','back','legs','sa']:['chest','back','legs','sh','arms'],t:'Um grupo muscular principal por dia, no estilo de divisão clássica.'}};
const FQ={full:d=>d,ul:d=>d/2,ppl:d=>d/3,hib:()=>2,grp:()=>1};
const BL={rec:'Recomendada',ok:'Possível',low:'Menos indicada'};
function rate(g,k,d){const f=FQ[k](d);
 if(f<2)return g==='hipertrofia'?['ok','Possível se o volume semanal por músculo for alto; treinar 1× por semana tende a ser menos eficiente.']:['low','Menos indicada: cada músculo é treinado só 1× por semana.'];
 if(g!=='hipertrofia'&&(k==='ppl'||k==='grp'||k==='hib'))return['ok','Boa opção, mas ocupa mais tempo e não há vantagem comprovada para este objetivo.'];
 return['rec','Recomendada: cada músculo é treinado 2× ou mais por semana.']}
function vI(){const w=S.wp,av=Object.keys(STR).filter(k=>STR[k].d.includes(w.days));
 if(!av.includes(w.strat))w.strat=av.find(k=>rate(w.goal,k,w.days)[0]==='rec')||av[0];
 const g=GOALS[w.goal];
 return`<h2>Início</h2><p class="sub">Defina seu objetivo, quantos dias treina por semana e a estratégia de divisão dos treinos.</p>
 <div class="card"><div class="row"><div><label>Objetivo do treino</label><select aria-label="Objetivo" data-f="wp" data-k="goal">${opts(Object.entries(GOALS).map(([k,v])=>[k,v[0]]),w.goal)}</select></div>
 <div><label>Dias por semana</label><select aria-label="Dias" data-f="wp" data-k="days">${opts([2,3,4,5,6].map(n=>[n,n]),w.days)}</select></div></div>
 <p class="msg" style="color:var(--mu)">Prescrição inicial: ${g[1]} séries de ${g[2]} repetições, descanso de ${g[3]} s${w.goal==='emagrecimento'||w.goal==='resistencia'?', com cardio no fim do treino':''}.</p></div>
 <div class="card"><h3>Estratégia da semana</h3><p class="sub" style="margin:2px 0 0">Opções disponíveis para ${w.days} dias, com a indicação para o seu objetivo.</p>
 ${av.map(k=>{const[r,tx]=rate(w.goal,k,w.days);return`<label class="opt"><input type="radio" name="st" data-f="wp" data-k="strat" value="${k}"${k===w.strat?' checked':''}><span><b>${STR[k].n}</b> <span class="pill ${r}">${BL[r]}</span><small>${STR[k].t}</small><small>${tx}</small></span></label>`}).join('')}
 <div style="margin-top:12px"><button class="pri" data-act="gen">Gerar treino</button></div><p class="sub" style="margin:8px 0 0;font-size:14px">${S.plan.length?'Gerar um novo treino substitui o atual.':'Depois de gerar, você ajusta tudo na aba Treino.'}</p></div>
 <div class="card ev"><details><summary>O que dizem os estudos</summary>
 <p><b>Hipertrofia.</b> Uma meta-análise de 2016 associou treinar o músculo mais de 1× por semana a ganhos maiores. Revisões posteriores mostram que, com o volume semanal igualado, a frequência e o tipo de divisão (corpo todo ou dividido) não mudam de forma relevante o ganho de massa.</p>
 <p><b>Força.</b> Frequências maiores deram mais força, mas o efeito vem principalmente do maior volume semanal; com volume igual não há diferença significativa. Frequência alta é uma forma prática de acumular volume.</p>
 <p><b>Emagrecimento e resistência.</b> Não encontrei estudos que relacionem esses objetivos a uma divisão específica. A indicação aqui usa critérios práticos: tempo disponível, recuperação e regularidade, com cardio ao final.</p>
 <p><b>Na prática:</b> o objetivo influencia mais o volume, a carga e o descanso do que a estratégia. Por isso as indicações acima priorizam treinar cada músculo ao menos 2× por semana e escolher o que cabe na sua rotina.</p>
 <p style="color:var(--mu);font-size:14px">Referências: Schoenfeld, Ogborn e Krieger (2016, Sports Medicine); Grgic et al. (2018, Sports Medicine); Ralston et al. (2018, Sports Medicine Open); Grgic, Schoenfeld e Latella (2019, J Sci Med Sport); Ramos-Campo et al. (2024, J Strength Cond Res).</p></details></div>`}
const GRP=Object.fromEntries(EX.map(e=>[e[0],e[1]]));
const MN_OLD={peito:'Peito',costas:'Costas',ombros:'Ombros',braços:'Braços',core:'Core (abdômen)',pernas:'Pernas'};
const LV=[{n:'Sem treino',c:'#9ca3af',m:0},{n:'Iniciante',c:'#38bdf8',m:1},{n:'Básico',c:'#34d399',m:25},{n:'Intermediário',c:'#facc15',m:70},{n:'Avançado',c:'#fb923c',m:160},{n:'Elite',c:'#c026d3',m:300}];
let selM='peito',evoArm=false;
const LEG={quadriceps:['pernas'],biceps:['braços']},dv=(d,g)=>(d[g]||0)+(LEG[g]||[]).reduce((a,k)=>a+(d[k]||0),0);const tot=g=>Object.values(S.dd).reduce((a,d)=>a+dv(d,g),0);
const lvl=x=>LV.reduce((a,l,i)=>x>=l.m?i:a,0);
function award(x,g){const gr=(gmOf(x),x.gm||FM(x.n));
 if(g.xp&&g.gr){const o=S.dd[g.dt];if(o)o[g.gr]=Math.max(0,(o[g.gr]||0)-g.xp)}g.xp=0;
 if(!g.d||!gr||gr==='cardio')return;
 const b0=lvl(tot(gr)),p=pts(x,g);
 
 const dt=ymd(new Date());S.dd[dt]=S.dd[dt]||{};S.dd[dt][gr]=(S.dd[dt][gr]||0)+p;g.xp=p;g.gr=gr;g.dt=dt;
 const a=lvl(tot(gr));if(a>b0){const t=$('#toast');t.innerHTML=`🎉 ${MN[gr]} subiu para ${LV[a].n}! <button class="sm" data-act="hideT">Ok</button>`;t.hidden=false}}
const NEU_OLD='<rect x="74" y="64" width="52" height="108" rx="18"/><circle cx="100" cy="32" r="18"/><rect x="93" y="48" width="14" height="18" rx="5"/><rect x="78" y="166" width="44" height="30" rx="12"/><ellipse cx="36" cy="198" rx="6" ry="9"/><ellipse cx="164" cy="198" rx="6" ry="9"/><ellipse cx="82" cy="364" rx="14" ry="7"/><ellipse cx="118" cy="364" rx="14" ry="7"/>';
const SH='<ellipse cx="64" cy="78" rx="15" ry="12"/><ellipse cx="136" cy="78" rx="15" ry="12"/>',AR='<ellipse cx="48" cy="114" rx="10" ry="28"/><ellipse cx="152" cy="114" rx="10" ry="28"/><ellipse cx="40" cy="168" rx="8" ry="24"/><ellipse cx="160" cy="168" rx="8" ry="24"/>',LG='<ellipse cx="84" cy="232" rx="17" ry="46"/><ellipse cx="116" cy="232" rx="17" ry="46"/><ellipse cx="83" cy="320" rx="11" ry="36"/><ellipse cx="117" cy="320" rx="11" ry="36"/>';
const FRONT_OLD={peito:'<ellipse cx="85" cy="96" rx="16" ry="14"/><ellipse cx="115" cy="96" rx="16" ry="14"/>',core:'<rect x="85" y="112" width="30" height="54" rx="12"/>',ombros:SH,braços:AR,pernas:LG};
const BACK_OLD={costas:'<path d="M78 70h44l6 36-4 60H76l-4-60z"/>',ombros:SH,braços:AR,pernas:'<ellipse cx="88" cy="190" rx="16" ry="16"/><ellipse cx="112" cy="190" rx="16" ry="16"/>'+LG};
const FM=n=>{const g=GRP[n];if(g==='pernas')return /Panturrilha/.test(n)?'panturrilha':/pélvica/.test(n)?'gluteos':/flexora|Stiff/.test(n)?'posterior':'quadriceps';if(g==='braços')return /Tríceps|Mergulho|diamante/.test(n)?'triceps':'biceps';return g};
const MN={peito:'Peito',costas:'Costas e trapézio',ombros:'Ombros (deltoides)',biceps:'Bíceps e antebraço',triceps:'Tríceps e antebraço',core:'Abdômen e oblíquos',quadriceps:'Quadríceps',posterior:'Posterior de coxa',gluteos:'Glúteos',panturrilha:'Panturrilhas'};
const LR=s=>s+'<g transform="matrix(-1 0 0 1 200 0)">'+s+'</g>';
const NEU_O2='<path d="M64 70L136 70L124 168L76 168Z"/><circle cx="100" cy="30" r="17"/><rect x="93" y="46" width="14" height="20" rx="5"/><path d="M76 166L124 166L121 200C110 206 90 206 79 200Z"/><path d="M72 196L128 196L124 282L76 282Z"/><path d="M76 280L124 280L119 354L81 354Z"/><ellipse cx="33" cy="206" rx="6" ry="10"/><ellipse cx="167" cy="206" rx="6" ry="10"/><ellipse cx="80" cy="364" rx="13" ry="7"/><ellipse cx="120" cy="364" rx="13" ry="7"/>';
const DL='<path d="M52 92C47 78 56 64 72 68C80 72 79 84 76 94C68 100 57 100 52 92Z"/>',UA='<path d="M52 96C47 108 47 124 51 134L64 134C68 122 70 108 72 98C66 100 58 100 52 96Z"/>',FA='<path d="M50 138C46 154 42 172 38 192L48 196C54 180 60 160 64 138Z"/>',CF='<path d="M75 286C70 306 73 330 79 350L89 350C93 330 93 306 89 286Z"/>';
const FRONT_O2={costas:LR('<path d="M95 52L64 70L78 76L97 64Z"/>'),ombros:LR(DL),peito:LR('<path d="M99 76L82 76C74 80 73 96 79 105C86 111 95 109 99 105Z"/>'),biceps:LR(UA+FA),core:LR('<path d="M91 112h8v12h-8zM91 126h8v12h-8zM91 140h8v12h-8zM91 154h8v13h-8z"/><path d="M90 110L78 108C74 124 76 148 82 166L89 166Z"/>'),quadriceps:LR('<path d="M72 198C65 220 66 250 74 276L82 276C80 250 80 222 82 198Z"/><path d="M84 198C82 222 83 250 86 272L94 272C97 248 97 220 95 198Z"/>'),panturrilha:LR(CF)};
const BACK_O2={costas:LR('<path d="M99 54L66 72L80 86L99 112Z"/><path d="M80 88L99 114L99 164L83 168C72 146 72 108 80 88Z"/><path d="M76 80L88 84L86 98L74 94Z"/>'),ombros:LR(DL),triceps:LR(UA+FA),gluteos:LR('<path d="M99 168L80 170C74 180 76 200 86 206C94 208 99 200 99 190Z"/>'),posterior:LR('<path d="M76 208C68 226 70 254 78 276L96 276C98 252 98 226 96 210C90 214 82 212 76 208Z"/>'),panturrilha:LR(CF)};
const DLT='<path d="M64 68C52 68 46 82 49 98C56 101 66 99 73 92C76 82 75 72 64 68Z"/>',FRM='<path d="M50 138C46 150 43 166 40 188L44 190C47 172 51 156 54 140Z"/><path d="M55 140C52 156 48 172 45 191L49 194C54 178 59 158 63 139Z"/>',ARM='<path d="M52 98C46 110 47 124 51 134L57 133C56 122 56 110 58 100Z"/><path d="M59 100C58 110 58 122 58 133L64 132C67 122 68 108 69 98Z"/>';
const NEU='<ellipse cx="100" cy="30" rx="15" ry="19"/><rect x="92" y="46" width="16" height="22" rx="6"/><path d="M64 68L136 68L124 168L76 168Z"/><path d="M76 166L124 166L122 200C110 208 90 208 78 200Z"/><path d="M70 196L130 196L125 284L75 284Z"/><path d="M75 280L125 280L119 354L81 354Z"/>'+LR('<path d="M52 94L74 98L64 138L50 198L35 196L47 138Z"/><ellipse cx="33" cy="206" rx="6" ry="10"/><ellipse cx="80" cy="283" rx="7" ry="7"/><ellipse cx="80" cy="364" rx="13" ry="7"/>');
const FRONT={costas:LR('<path d="M96 54L62 68L76 76L94 66Z"/><path d="M96 48L89 54L93 68L98 62Z"/>'),ombros:LR(DLT),peito:LR('<path d="M97 70L77 74C72 80 74 88 80 92L98 88Z"/><path d="M98 90L80 94C77 102 82 110 90 112L98 110Z"/>'),biceps:LR(ARM+FRM),core:LR('<path d="M91 114h8v11h-8zM91 127h8v11h-8zM91 140h8v11h-8zM92 153h7v12h-7z"/><path d="M89 112L80 114C76 128 79 148 85 166L90 166Z"/>'),quadriceps:LR('<path d="M72 200C66 222 66 252 76 276L84 276C82 250 82 224 84 202Z"/><path d="M85 202C83 226 84 252 86 274L92 274C94 252 95 226 94 202Z"/><path d="M95 230C97 250 96 266 91 280L86 280C90 266 93 248 95 230Z"/><path d="M99 202L96 204C94 222 95 236 97 246L99 246Z"/>'),panturrilha:LR('<path d="M78 290C76 310 78 332 82 350L87 350C88 330 87 308 85 290Z"/><path d="M88 288C93 304 92 326 88 346L87 346C88 328 88 308 86 290Z"/>')};
const BACK={costas:LR('<path d="M99 48L66 68L80 80L99 76Z"/><path d="M99 80L80 84L90 108L99 122Z"/><path d="M76 82L92 84L90 100L72 98C72 92 74 86 76 82Z"/><path d="M72 100L90 102L86 110L70 106Z"/><path d="M70 108L88 112L97 124L97 166L84 170C74 148 68 124 70 108Z"/>'),ombros:LR(DLT),triceps:LR(ARM+FRM),gluteos:LR('<path d="M99 166L78 168C72 174 72 186 78 192L99 186Z"/><path d="M99 188L80 194C76 204 82 214 92 214C97 212 99 206 99 200Z"/>'),posterior:LR('<path d="M74 216C68 236 70 258 78 278L86 278C85 256 86 236 86 216Z"/><path d="M87 216C87 238 88 258 90 278L96 278C98 256 97 234 96 218Z"/>'),panturrilha:LR('<path d="M76 288C72 304 74 322 80 334L86 332C87 316 87 302 85 288Z"/><path d="M87 288C91 302 94 318 92 334L86 336C87 318 88 302 87 288Z"/><path d="M80 337L92 337C92 344 90 350 88 352L83 352C81 350 80 344 80 337Z"/>')};
const BWF=[[/Flexão diamante|Flexão de braço/,.64],[/Flexão inclinada/,.5],[/Flexão declinada/,.75],[/Flexão pike/,.6],[/Barra fixa/,1],[/Remada australiana/,.6],[/Mergulho/,.6],[/peso do corpo/,.7],[/Afundo/,.6],[/búlgaro/,.65],[/no solo|Superman/,.5],[/degrau/,.8],[/salto/,.7],[/Prancha|Abdominal canivete|Elevação de pernas/,.4]];
function pts(x,g){const dt=ymd(new Date()),r=Math.min(+g.r||parseInt(x.r)||10,12),f=(BWF.find(b=>b[0].test(x.n))||[])[1],L=(f?f*(S.profile.peso||70):0)+(+g.w||0);
 if(!(L>0))return .5;
 const e=L*(1+r/30),ref=S.e1[x.n]||0;let p=1;
 if(ref>0){const q=e/ref;p=q<.6?0:Math.min(1,q);if(e>ref*1.005&&S.bd[x.n]!==dt){p+=1;S.bd[x.n]=dt}}
 if(e>ref)S.e1[x.n]=e;return p}
const eList=()=>{const a=Object.entries(S.e1).sort((a,b)=>b[1]-a[1]).slice(0,10);return a.length?`<div class="card"><h3 style="margin-bottom:6px">Força estimada por exercício</h3>${a.map(([n,v])=>`<div class="li"><span>${esc(n)}</span><b>${Math.round(v)} kg</b></div>`).join('')}<p class="sub" style="margin:6px 0 0;font-size:14px">Carga estimada para 1 repetição máxima, considerando carga e repetições. É ela que define se cada série conta e se você evoluiu.</p></div>`:''};
const IMG='assets/anatomia.webp';
const ZN={"ombros": ["1032,199 1029,204 1030,213 1020,245 1024,250 1029,279 1054,287 1072,298 1077,299 1078,261 1076,251 1070,245 1070,232 1062,218 1054,209 1042,201", "315,198 276,202 265,208 253,220 240,248 236,280 240,280 276,298 296,297 299,285 299,250 308,241 323,214 323,211", "793,194 780,198 767,205 758,214 751,225 745,241 741,263 741,282 744,302 748,302 774,287 795,281 799,277 802,250 806,247 797,213 798,203", "500,195 494,202 493,214 510,246 518,253 519,270 522,282 521,299 536,297 557,281 562,281 566,285 575,284 576,263 574,252 569,237 559,220 547,209 528,202 519,196 510,193"], "peito": ["300,250 300,285 297,298 317,313 360,322 382,322 404,319 450,322 494,314 513,305 520,297 521,282 518,270 517,253 509,246 494,216 489,213 449,206 412,213 401,213 369,206 324,213 309,241"], "core": ["514,306 508,307 494,315 450,323 432,323 409,320 382,323 360,323 319,315 308,308 300,313 295,362 311,393 314,420 311,452 313,485 309,501 313,505 320,507 374,507 398,520 409,520 439,507 487,507 494,505 500,499 510,483 506,459 501,451 498,429 501,391 512,371 521,372 525,388 527,388 527,378 520,344 518,321"], "biceps": ["559,281 536,298 520,300 515,304 519,321 521,344 528,378 528,396 537,415 539,424 541,453 537,465 558,507 564,509 571,521 589,564 594,564 595,549 620,549 615,513 615,472 608,439 599,419 586,397 583,387 581,344 574,318 576,285 566,286", "240,281 237,281 238,315 234,316 229,321 226,330 222,387 216,393 205,411 192,437 184,471 184,491 181,495 175,525 169,541 169,545 173,550 190,556 194,561 202,561 205,558 251,480 257,463 259,450 266,435 269,408 279,387 286,363 293,362 299,313 305,308 305,305 296,298 274,298"], "quadriceps": ["311,514 302,522 300,548 294,574 288,620 287,715 289,718 289,739 292,760 302,798 303,809 311,814 350,821 357,819 376,797 380,782 388,731 396,702 398,687 407,686 409,689 411,712 415,729 419,770 435,810 440,815 447,817 477,817 484,815 494,807 506,775 514,741 520,694 522,613 516,568 511,546 509,518 504,514 495,511 435,511 428,513 411,527 404,527 395,519 380,511 320,511"], "costas": ["881,95 863,109 865,126 869,133 868,156 856,166 836,176 795,192 795,197 799,203 798,213 806,239 806,248 803,250 799,278 801,282 800,293 802,295 794,369 795,372 803,373 817,408 822,439 819,479 841,483 867,474 876,474 882,481 907,496 914,504 919,505 925,495 945,482 950,475 965,475 984,482 1003,480 999,433 1004,404 1015,382 1020,366 1033,365 1025,305 1025,296 1027,294 1026,283 1028,277 1023,250 1020,248 1020,241 1029,213 1030,197 986,178 962,175 961,167 946,155 945,129 948,122 949,110 956,106 956,104 946,96"], "triceps": ["1029,281 1027,283 1028,294 1025,297 1033,356 1034,378 1047,414 1049,436 1059,455 1062,470 1068,478 1072,479 1072,493 1076,501 1109,548 1122,573 1128,574 1140,571 1149,564 1150,545 1140,504 1136,497 1136,479 1132,455 1128,441 1115,420 1107,411 1102,409 1104,398 1098,389 1095,379 1094,358 1091,354 1091,338 1087,325 1075,300 1054,288", "799,281 774,288 745,305 745,315 739,332 739,337 742,338 742,371 735,372 735,384 732,393 725,405 725,409 719,414 710,432 703,454 700,476 699,524 694,554 731,554 742,531 759,503 767,484 774,454 782,438 783,415 789,397 794,372 794,356 799,326 800,303 802,300"], "gluteos": ["819,480 819,494 803,552 798,584 799,605 816,639 833,648 851,651 888,650 904,646 904,637 907,632 919,633 920,644 943,648 1005,646 1008,644 1021,644 1029,626 1027,618 1026,582 1020,550 1003,490 1003,481 984,483 965,476 950,476 945,483 925,496 919,505 914,505 907,497 882,482 875,474 841,484"], "posterior": ["920,645 919,673 922,705 934,759 939,803 949,822 973,852 982,853 995,849 1014,840 1014,824 1028,777 1027,764 1032,754 1034,742 1037,692 1021,645 965,649 943,649", "808,640 799,650 791,679 790,696 792,724 797,754 806,794 817,824 817,836 834,850 840,852 863,854 883,849 888,846 890,785 904,706 906,682 904,648 888,651 851,652 833,649 815,639"], "panturrilha": ["833,852 817,857 816,877 806,908 805,940 831,1052 834,1074 862,1074 868,1058 871,1037 872,994 881,975 885,960 884,926 876,897 876,882 881,872 882,865 862,855", "991,850 950,868 959,890 959,899 953,926 952,950 957,973 967,990 969,1018 975,1048 976,1063 985,1073 1007,1074 1011,1073 1013,1041 1017,1036 1032,950 1032,924 1028,903 1016,871 1016,859 999,850", "465,849 436,857 437,869 427,913 428,942 439,969 440,993 447,1027 447,1049 441,1074 472,1074 476,1066 493,997 508,923 507,888 496,857", "314,846 299,849 288,877 282,902 282,928 286,954 290,961 289,979 302,1046 303,1074 340,1073 336,1052 338,1022 346,990 348,970 356,956 361,942 363,912 356,875 357,861 323,847"]};
function anatSvg(st){return`<svg viewBox="100 0 1130 1199" width="100%" style="display:block" role="img" aria-label="Anatomia muscular com o nível de cada músculo"><image href="${IMG}" x="0" y="0" width="1312" height="1199"/>`+Object.entries(ZN).map(([g,ps])=>{const[c,s,t,l,n]=st(g);return`<g data-act="mus" data-g="${g}" fill="${n?c:'#fff'}" fill-opacity="${n?(t?1:.8):0}" stroke="${s?'var(--ac)':'none'}" stroke-width="${s?3:0}" stroke-linejoin="round" style="cursor:pointer;mix-blend-mode:${n?'color':'normal'}" role="button" aria-label="${l}">${ps.map(p=>`<polygon points="${p}"/>`).join('')}</g>`}).join('')+'</svg>'}
function vE(){const td=ymd(new Date()),dd=S.dd,gs=Object.keys(MN),T=tot,tdy=g=>dv(dd[td]||{},g),tp=gs.reduce((a,g)=>a+tdy(g),0),
 wk=g=>{let s=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);s+=dv(dd[ymd(d)]||{},g)}return s},
 sh=(g,mk)=>`<g data-act="mus" data-g="${g}" fill="${LV[lvl(T(g))].c}" stroke="${g===selM?'var(--ac)':tdy(g)>0?'var(--tx)':'#6b2f2a'}" stroke-width="${g===selM||tdy(g)>0?2.4:.8}" style="cursor:pointer" role="button" aria-label="${MN[g]}, ${LV[lvl(T(g))].n}">${mk}${mk.replace(/<(path|ellipse)/g,'<$1 fill="url(#shd)" stroke="none" pointer-events="none"')}</g>`,
 part=(M)=>`<g fill="#ead2c0" stroke="#c9a994" stroke-width="1">${NEU}</g>`+Object.entries(M).map(([g,mk])=>sh(g,mk)).join('');
 const x=T(selM),l=lvl(x),nx=LV[l+1],pc=nx?(x-LV[l].m)/(nx.m-LV[l].m):1;
 return`<h2>Evolução muscular</h2><p class="sub">Cada série marcada no Treino soma pontos ao músculo trabalhado. Toque em um músculo da ilustração para ver os detalhes.</p>
 <div class="card">${anatSvg(g=>[LV[lvl(T(g))].c,g===selM,tdy(g)>0,MN[g]+', '+LV[lvl(T(g))].n,lvl(T(g))>0])}
 <div class="row" style="justify-content:center;gap:10px;margin-top:6px">${LV.map((v,i)=>`<span style="flex:0 0 auto;font-size:13px"><i style="display:inline-block;width:11px;height:11px;border-radius:50%;background:${v.c};vertical-align:-1px"></i> ${i} · ${v.n}</span>`).join('')}</div>
 <p class="sub" style="text-align:center;margin:8px 0 0;font-size:14px">Cor mais intensa = músculo trabalhado hoje (${r1(tp)} pontos hoje)</p></div>
 <div class="card"><div class="row" style="align-items:center"><h3>${MN[selM]}</h3><span class="pill" style="flex:0 0 auto;background:${LV[l].c};color:#101a2e">Nível ${l} · ${LV[l].n}</span></div><div style="margin-top:8px">${bar(pc,1,LV[l].c)}</div>
 <p class="msg">${nx?`Faltam ${r1(nx.m-x)} pontos para o nível ${nx.n}.`:'Nível máximo atingido.'}</p>
 <div class="stats"><div><b>${r1(x)}</b><span>pontos acumulados</span></div><div><b>${r1(wk(selM))}</b><span>pontos nos últimos 7 dias</span></div><div><b>${r1(tdy(selM))}</b><span>pontos hoje</span></div></div></div>
 <div class="card">${gs.map(g=>{const v=T(g),k=lvl(v);return`<div class="li" data-act="mus" data-g="${g}" style="cursor:pointer"><span style="flex:1"><b>${MN[g]}</b> <small>Nível ${k} · ${LV[k].n}</small>${bar(v-LV[k].m,LV[k+1]?LV[k+1].m-LV[k].m:1,LV[k].c)}</span><small>${r1(v)} pts</small></div>`}).join('')}</div>
 ${eList()}<div class="card ev"><details><summary>Como o nível é calculado</summary>
 <p>Cada série concluída gera pontos para o músculo do exercício conforme a força que você demonstrou nela. O app estima sua carga máxima para 1 repetição (1RM) a partir da carga e das repetições (fórmula de Epley, contando no máximo 12 repetições) e compara com o melhor que você já registrou naquele exercício. Série com pelo menos 60% desse melhor vale de 0,6 a 1 ponto; abaixo disso, a carga é leve demais e vale 0. Bater um novo recorde de força no exercício rende +1 ponto extra, uma vez por exercício a cada dia. Assim, só aumentar repetições com carga muito leve não faz o nível subir. Em exercícios com o peso do corpo, o app soma uma fração do seu peso (do perfil) à carga extra. Sem carga informada, a série vale 0,5.</p>
 <p>Pontos para cada nível: ${LV.slice(1).map((v,i)=>`${i+1} ${v.n} (${v.m}+)`).join(' · ')}. Desmarcar uma série devolve os pontos dela.</p>
 <p>A evolução fica salva neste aparelho e continua mesmo ao gerar outro treino ou limpar as marcações. Cardio não pontua. Exercícios que você adiciona contam para o grupo muscular indicado no próprio exercício (o app sugere um pelo nome e você pode trocar); sem grupo definido, não pontuam. Músculos auxiliares não são contados. Essa escala é uma estimativa de apoio, não uma medida científica de força ou massa.</p></details></div>
 <button data-act="evoReset">${evoArm?'Toque de novo para zerar tudo':'Zerar evolução'}</button>`}
let od={};document.addEventListener('toggle',e=>{const t=e.target;if(t.dataset&&t.dataset.od)od[t.dataset.od]=t.open},true);
const GM_OPT=[['','Escolher grupo…'],['peito','Peito'],['costas','Costas'],['ombros','Ombros'],['biceps','Bíceps'],['triceps','Tríceps'],['core','Abdômen'],['quadriceps','Quadríceps'],['posterior','Posterior'],['gluteos','Glúteos'],['panturrilha','Panturrilha'],['cardio','Cardio']];
const GU=[['panturrilha',/panturrilha|g[eê]meos|s[oó]leo|calf/i],['cardio',/corrida|esteira|bicicleta|caminhada|ciclismo|nata[cç][aã]o|el[ií]ptico|trote|escada|corda|burpee|polichinelo|hiit|cardio|remo ergom/i],['triceps',/tr[ií]ceps|mergulho|paralela|testa|franc[eê]s/i],['biceps',/rosca|b[ií]ceps|martelo/i],['gluteos',/gl[uú]teo|p[eé]lvica|hip thrust|coice|abdu[cç][aã]o/i],['posterior',/stiff|flexora|leg curl|terra|romeno|good morning/i],['quadriceps',/agachamento|leg press|extensora|afundo|passada|hack|avan[cç]o|sissy/i],['core',/abdominal|prancha|core|obl[ií]quo|eleva[cç][aã]o de pernas|russian/i],['ombros',/desenvolvimento|ombro|militar|arnold|eleva[cç][aã]o (lateral|frontal)/i],['peito',/supino|crucifixo|flex[aã]o|peck|peitoral|crossover/i],['costas',/remada|puxada|barra fixa|pulldown|dorsal|serrote|encolhimento/i]];
const guess=n=>(GU.find(r=>r[1].test(n))||[''])[0];
const gmOf=x=>{if(x.gm===undefined&&!GRP[x.n])x.gm=guess(x.n);return x.gm||GRP[x.n]||''};
const isC=x=>gmOf(x)==='cardio';
const isDist=x=>isC(x)&&!/corda|burpee|polichinelo|hiit|salto/i.test(x.n);
const newEx=v=>{const gm=GRP[v]?undefined:guess(v),c=(gm||GRP[v])==='cardio';return{n:v,gm,s:c?1:3,r:c?'20 min':'10–12',rest:c?0:60,done:false}};
const custSel=(x,di,i)=>GRP[x.n]?'':`<select data-f="gm" data-d="${di}" data-i="${i}" aria-label="Grupo muscular" style="width:auto;padding:3px 6px">${opts(GM_OPT,gmOf(x))}</select>`;
function vT(){const w=S.wp;
 let h=`<h2>Treino</h2><p class="sub">Gere uma sugestão pelo seu objetivo ou monte o seu. Tudo pode ser editado depois.</p>
 <div class="card"><div class="row">
 <div style="flex:3 1 220px"><b>${GOALS[w.goal][0]}</b> · ${w.days} dias por semana<br><small class="sub">${STR[w.strat]?STR[w.strat].n:'Estratégia a definir'}</small></div>
 
 </div>
 <div class="row" style="margin-top:10px"><button data-act="goHome">Mudar objetivo e estratégia</button><button data-act="goEvo">Ver evolução muscular</button><button data-act="addDay">+ Montar do zero</button></div></div>
 <datalist id="exl">${EX.map(e=>`<option value="${esc(e[0])}">`).join('')}</datalist>`;
 if(!S.plan.length)return h+'<div class="empty">Nenhum treino ainda. Vá ao Início, escolha objetivo, dias e estratégia e toque em “Gerar treino”.</div>';
 S.plan.forEach((d,di)=>{const dn=d.items.filter(exDone).length;
  h+=`<details class="card day" data-od="d${di}"${(od['d'+di]===undefined?di===0:od['d'+di])?' open':''}><summary><span class="dn">${esc(d.name)}</span><span class="pill">${dn}/${d.items.length}</span><button class="x" data-act="mvDay" data-d="${di}" data-dir="-1" title="Mover dia para cima" aria-label="Mover dia para cima"${di===0?' disabled':''}>▲</button><button class="x" data-act="mvDay" data-d="${di}" data-dir="1" title="Mover dia para baixo" aria-label="Mover dia para baixo"${di===S.plan.length-1?' disabled':''}>▼</button></summary><div class="row" style="margin:8px 0;align-items:center"><input data-f="dn" data-d="${di}" value="${esc(d.name)}" aria-label="Nome do dia"><button class="x" data-act="delDay" data-d="${di}" title="Remover dia" style="flex:0 0 auto">✕</button></div>`;
  d.items.forEach((x,i)=>{h+=`<div class="ex${exDone(x)?' done':''}"><span class="nm">${esc(x.n)}${DESC[x.n]?`<details data-od="e${di}-${i}"${od['e'+di+'-'+i]?' open':''}><summary>Como fazer</summary>${esc(DESC[x.n])}</details>`:''}</span><button class="x" data-act="delEx" data-d="${di}" data-i="${i}" title="Remover">✕</button>
   <div class="cfg">Meta:<input type="number" min="1" data-f="ex" data-k="s" data-d="${di}" data-i="${i}" value="${x.s}" aria-label="Séries">séries ×<input class="r" data-f="ex" data-k="r" data-d="${di}" data-i="${i}" value="${esc(x.r)}" aria-label="Repetições">desc.<input type="number" min="0" step="5" data-f="ex" data-k="rest" data-d="${di}" data-i="${i}" value="${x.rest}" aria-label="Descanso em segundos">s${custSel(x,di,i)}</div>${setRows(x,di,i)}</div>`});
  h+=`<div class="row" style="margin-top:8px"><input id="nx${di}" list="exl" placeholder="Adicionar exercício (escolha ou digite)" style="flex:3 1 160px"><button data-act="addEx" data-d="${di}" style="flex:0 0 auto">Adicionar</button></div></details>`});
 return h+`<div class="row"><button data-act="addDay">+ Novo dia</button><button data-act="clrMarks">Limpar marcações</button><button data-act="clrPlan">Apagar treino</button></div>`}

function dateBar(){return`<div class="datebar"><button data-act="prevD" aria-label="Dia anterior">‹</button><input type="date" data-f="date" value="${date}"><button data-act="nextD" aria-label="Próximo dia">›</button></div>`}

function vD(){const c=calc(),L=S.diet[date]||[],t=sum(L),pc=t.k?t.p*4/t.k*100:0,cc=t.k?t.c*4/t.k*100:0,fc=t.k?t.f*9/t.k*100:0;
 const rem=c.kcal-t.k,notes=[];
 if(!L.length)notes.push('Registre sua primeira refeição para ver a análise do dia.');
 else{notes.push(rem>=0?`Restam ${Math.round(rem)} kcal para a meta do dia.`:`Você passou ${Math.round(-rem)} kcal da meta.`);
  if(t.p<c.prot*.8)notes.push(`Proteína abaixo da meta: faltam ${Math.round(c.prot-t.p)} g.`);else if(t.p>=c.prot)notes.push('Meta de proteína atingida.');
  if(t.f>c.fat*1.2)notes.push('Gordura acima do planejado; ajuste porções de óleos e frituras.');
  if(t.c>c.carb*1.2)notes.push('Carboidratos acima da meta do dia.')}
 let h=`<h2>Dieta</h2><div class="card"><div class="stats"><div><b>${Math.round(t.k)}</b><span>kcal consumidas de ${c.kcal}</span></div><div><b>${Math.round(rem)}</b><span>kcal restantes</span></div></div>
 <div style="margin-top:10px">${bar(t.k,c.kcal,rem<0?'var(--bad)':'var(--ac)')}</div>
 ${[['Proteína',t.p,c.prot,'var(--p)'],['Carboidratos',t.c,c.carb,'var(--c)'],['Gorduras',t.f,c.fat,'var(--f)']].map(([n,v,m,col])=>`<div class="mac"><div class="t"><span>${n}</span><span>${r1(v)} / ${m} g</span></div>${bar(v,m,col)}</div>`).join('')}
 <p class="sub" style="margin:8px 0 4px">Distribuição das calorias: proteína ${Math.round(pc)}% · carboidratos ${Math.round(cc)}% · gorduras ${Math.round(fc)}%</p>
 ${notes.map(n=>`<p class="msg">${esc(n)}</p>`).join('')}</div>
 ${mealPlan(c)}<div class="card"><h3 style="margin-bottom:8px">Adicionar alimento</h3><div class="row">
 <div><label>Refeição</label><select id="meal" data-f="meal">${opts(MEALS.map(m=>[m,m]),lm)}</select></div>
 <div><label>Alimento</label><select id="food" data-f="food">${FOODS.map((f,i)=>`<option value="${i}">${esc(f[0])}</option>`).join('')}<option value="-1">Outro (informar valores)</option></select></div>
 <div><label>Quantidade (g ou ml)</label><input id="grams" type="number" min="1" value="100"></div></div>
 <div id="cust" class="row" style="display:none;margin-top:8px"><div style="flex:2 1 150px"><label>Nome</label><input id="cn"></div><div><label>kcal/100 g</label><input id="ck" type="number" min="0"></div><div><label>Prot. g</label><input id="cp" type="number" min="0"></div><div><label>Carb. g</label><input id="cc" type="number" min="0"></div><div><label>Gord. g</label><input id="cf" type="number" min="0"></div></div>
 <div style="margin-top:10px"><button class="pri" data-act="addFood">Adicionar</button></div></div>`;
 MEALS.forEach(m=>{const l=L.filter(e=>e.meal===m);if(!l.length)return;const s=sum(l);
  h+=`<div class="card"><div class="row" style="align-items:center"><h3>${m}</h3><span class="sub" style="margin:0;text-align:right">${Math.round(s.k)} kcal · P ${r1(s.p)} · C ${r1(s.c)} · G ${r1(s.f)}</span></div>
  ${l.map(e=>`<div class="li"><span>${esc(e.name)} <small>${e.g} g</small><br><small>${Math.round(e.k)} kcal · P ${r1(e.p)} · C ${r1(e.c)} · G ${r1(e.f)}</small></span><button class="x" data-act="delFood" data-id="${e.id}" title="Remover">✕</button></div>`).join('')}</div>`});
 return h}

function vA(){const c=calc(),L=S.water[date]||[],ml=L.reduce((a,e)=>a+e.ml,0),pct=ml/c.agua,R=84,C=2*Math.PI*R;
 const st=pct>=1?['Meta atingida','var(--ok)']:pct>=.75?['Boa hidratação','var(--ok)']:pct>=.5?['Moderada','var(--warn)']:pct>=.25?['Baixa','var(--warn)']:['Muito baixa','var(--bad)'];
 let pace='';if(date===ymd(new Date())){const n=new Date(),hr=n.getHours()+n.getMinutes()/60,exp=Math.round(c.agua*paceF(hr)/50)*50;
  pace=ml>=exp?`Você está no ritmo: até agora o ideal seria cerca de ${exp} ml.`:`Pelo horário, o ideal já seria cerca de ${exp} ml. Faltam ${exp-ml} ml para acompanhar o ritmo.`}
 return`<h2>Hidratação</h2><div class="card" style="text-align:center"><div class="gauge"><svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label="${Math.round(pct*100)}% da meta de água"><circle cx="110" cy="110" r="${R}" fill="none" stroke="var(--bg)" stroke-width="18"/><circle cx="110" cy="110" r="${R}" fill="none" stroke="var(--w)" stroke-width="18" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-Math.min(1,pct))}" transform="rotate(-90 110 110)"/></svg>
 <div class="c"><b>${ml} ml</b><span class="sub" style="margin:0">de ${c.agua} ml (${Math.round(pct*100)}%)</span></div></div>
 <div style="font:700 20px var(--hd);color:${st[1]}">${st[0]}</div><p class="msg" style="color:var(--mu)">${pace}</p></div>
 <div class="card"><h3 style="margin-bottom:8px">Registrar consumo</h3><div class="row">${[150,250,350,500].map(v=>`<button data-act="addW" data-v="${v}">+${v} ml</button>`).join('')}</div>
 <div class="row" style="margin-top:8px"><input id="wc" type="number" min="1" placeholder="Outro valor em ml"><button class="pri" data-act="addWc" style="flex:0 0 auto">Registrar</button></div></div>
 <div class="card"><div class="row" style="align-items:center"><h3>Registros do dia</h3><button class="sm" data-act="undoW" style="flex:0 0 auto"${L.length?'':' disabled'}>Desfazer último</button></div>
 ${L.length?L.slice().reverse().map(e=>`<div class="li"><span>${e.ml} ml <small>às ${e.t}</small></span><button class="x" data-act="delW" data-id="${e.id}" title="Remover">✕</button></div>`).join(''):'<div class="empty">Nada registrado neste dia.</div>'}</div>
 ${wCfg(c)}
 <p class="sub">A meta é calculada pelo seu peso e nível de atividade (perfil). Em dias quentes ou de treino intenso, beba mais.</p>`}

function vP(){const p=S.profile,c=calc(),I=(k,l,min)=>`<div><label>${l}</label><input type="number" min="${min}" data-f="pr" data-k="${k}" value="${p[k]}"></div>`;
 return`<h2>Perfil e metas</h2><p class="sub">Esses dados alimentam as metas de calorias, macros e água.</p><div class="card"><div class="row">
 <div><label>Sexo</label><select data-f="pr" data-k="sexo">${opts([['m','Masculino'],['f','Feminino']],p.sexo)}</select></div>${I('idade','Idade',10)}${I('peso','Peso (kg)',30)}${I('altura','Altura (cm)',100)}</div>
 <div class="row" style="margin-top:8px"><div><label>Atividade</label><select data-f="pr" data-k="ativ">${opts([[1.2,'Sedentário'],[1.375,'Leve (1–3 treinos/sem.)'],[1.55,'Moderado (3–5 treinos/sem.)'],[1.725,'Intenso (6–7 treinos/sem.)']],p.ativ)}</select></div>
 <div><label>Objetivo da dieta</label><select data-f="pr" data-k="obj">${opts([['perder','Perder gordura'],['manter','Manter peso'],['ganhar','Ganhar massa']],p.obj)}</select></div></div>
 <div class="row" style="margin-top:8px"><div><label>Preferência alimentar (usada no cardápio)</label><select data-f="pr" data-k="dieta">${opts([['onivoro','Sem restrição'],['vegetariano','Vegetariano'],['semlactose','Sem lactose']],p.dieta||'onivoro')}</select></div></div>${timeRow()}</div>
 <div class="card"><h3 style="margin-bottom:8px">Suas metas diárias</h3><div class="stats"><div><b>${c.kcal}</b><span>kcal</span></div><div><b>${c.prot} g</b><span>proteína</span></div><div><b>${c.carb} g</b><span>carboidratos</span></div><div><b>${c.fat} g</b><span>gorduras</span></div><div><b>${c.agua} ml</b><span>água</span></div></div>
 <p class="sub" style="margin:10px 0 0">Metabolismo basal ${c.tmb} kcal; gasto total estimado ${c.tdee} kcal (fórmula de Mifflin-St Jeor). São estimativas gerais, não substituem orientação de nutricionista ou médico.</p></div>`}

function render(){const V={evolucao:vE,inicio:vI,treino:vT,dieta:vD,agua:vA,perfil:vP};
 $('#main').innerHTML=(tab==='dieta'||tab==='agua'?dateBar():'')+V[tab]();
 $('#nav').innerHTML=TABS.map(([k,i,n])=>`<a href="#${k}" class="${k===tab?'on':''}"><span>${i}</span>${n}</a>`).join('');
 $('#sub').textContent=date===ymd(new Date())?'Treino, dieta e hidratação em um só lugar':'';}
let tab='inicio';
function route(){const h=location.hash.slice(1);tab=V_OK.includes(h)?h:'inicio';render()}
const V_OK=['evolucao','inicio','treino','dieta','agua','perfil'];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const shift=n=>{const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+n);date=ymd(d);render()};

document.addEventListener('change',e=>{const t=e.target,f=t.dataset.f;if(!f)return;const d=+t.dataset.d,i=+t.dataset.i,k=t.dataset.k;
 if(f==='wp'){S.wp[k]=k==='days'?+t.value:t.value;save();render()}
 else if(f==='pr'){S.profile[k]=['sexo','obj','dieta','acorda','dorme'].includes(k)?t.value:+t.value;armRem();save();render()}
 else if(f==='dn'){S.plan[d].name=t.value;save();render()}
 else if(f==='ex'){S.plan[d].items[i][k]=k==='r'?t.value:Math.max(0,+t.value||0);save();render()}
 else if(f==='sd'||f==='sl'){const x=S.plan[d].items[i],j=+t.dataset.j;x.log=x.log||[];const g=x.log[j]=x.log[j]||{};if(f==='sd')g.d=t.checked;else g[k]=t.value===''?'':+t.value;if(f==='sd'||g.d)award(x,g);save();if(f==='sd')render()}
 else if(f==='gm'){S.plan[d].items[i].gm=t.value;save();render()}
 else if(f==='aguaM'){S.profile.aguaM=+t.value||0;save();render()}
 else if(f==='rem'){S.rem.iv=+t.value;armRem();save();render()}
 else if(f==='meal')lm=t.value;
 else if(f==='food')$('#cust').style.display=t.value==='-1'?'flex':'none';
 else if(f==='date'&&t.value){date=t.value;render()}});

document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,d=+b.dataset.d,i=+b.dataset.i,id=b.dataset.id;
 if(a==='gen'){gen();location.hash='treino';return}
 else if(a==='addDay'){S.plan.push({name:'Dia '+'ABCDEFGH'[S.plan.length%8]+' · Novo',items:[]});save()}
 else if(a==='mvDay'){const j=d+(+b.dataset.dir);if(j<0||j>=S.plan.length)return;const op=k=>od['d'+k]===undefined?k===0:od['d'+k],o1=op(d),o2=op(j);
  [S.plan[d],S.plan[j]]=[S.plan[j],S.plan[d]];S.plan.forEach((x,k)=>{x.name=x.name.replace(/^Dia [A-H] · /,'Dia '+'ABCDEFGH'[k]+' · ')});
  const nod={};for(const k in od){const m=k.match(/^e(\d+)-(\d+)$/);if(m&&(+m[1]===d||+m[1]===j))nod['e'+(+m[1]===d?j:d)+'-'+m[2]]=od[k];else if(!/^d\d+$/.test(k))nod[k]=od[k]}
  nod['d'+d]=o2;nod['d'+j]=o1;od=nod;save()}
 else if(a==='genMenu'){const o=S.menu[date];if(o&&o.meals.some(m=>m.ids))return note('Desfaça o registro das refeições para gerar outro cardápio.');S.menu[date]=genMenu(date,o?(o.vv||0)+1:0);save()}
 else if(a==='genWeek'){let sk=0;for(let j=0;j<7;j++){const d2=addD(date,j),o=S.menu[d2];if(o&&o.meals.some(m=>m.ids)){sk++;continue}S.menu[d2]=genMenu(d2,o?(o.vv||0)+1:0)}save();if(sk)note('Dias com refeições já registradas foram mantidos.')}
 else if(a==='clrMenu'){delete S.menu[date];save()}
 else if(a==='regM'){const m=S.menu[date].meals[i],key=m.name.replace(/^Lanche.*/,'Lanche'),L2=S.diet[date]=S.diet[date]||[];m.ids=m.items.map(e=>{const id=uid();L2.push({id,meal:key,name:e.n,g:e.g,k:e.k,p:e.p,c:e.c,f:e.f});return id});save()}
 else if(a==='undoM'){const m=S.menu[date].meals[i];S.diet[date]=(S.diet[date]||[]).filter(x=>!(m.ids||[]).includes(x.id));delete m.ids;save()}
 else if(a==='swapM'){const m=S.menu[date].meals[i];m.seed+=11;m.items=genMeal(m.type,m.t,m.seed,S.profile.obj||'manter');save()}
 else if(a==='delDay'){S.plan.splice(d,1);save()}
 else if(a==='delEx'){S.plan[d].items.splice(i,1);save()}
 else if(a==='addEx'){const v=$('#nx'+d).value.trim();if(!v)return $('#nx'+d).focus();S.plan[d].items.push(newEx(v));save()}
 else if(a==='clrMarks'){S.plan.forEach(x=>x.items.forEach(y=>y.log=[]));save()}
 else if(a==='clrPlan'){S.plan=[];save()}
 else if(a==='addFood'){const g=+$('#grams').value,fi=+$('#food').value;if(!(g>0))return $('#grams').focus();
  const f=fi<0?[$('#cn').value.trim()||'Alimento',+$('#ck').value||0,+$('#cp').value||0,+$('#cc').value||0,+$('#cf').value||0]:FOODS[fi],r=g/100;
  (S.diet[date]=S.diet[date]||[]).push({id:uid(),meal:$('#meal').value,name:f[0],g,k:f[1]*r,p:f[2]*r,c:f[3]*r,f:f[4]*r});save()}
 else if(a==='delFood'){S.diet[date]=S.diet[date].filter(x=>x.id!==id);save()}
 else if(a==='addW'||a==='addWc'){const ml=a==='addW'?+b.dataset.v:+$('#wc').value;if(!(ml>0))return $('#wc').focus();
  (S.water[date]=S.water[date]||[]).push({id:uid(),ml:Math.round(ml),t:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});save()}
 else if(a==='addR'){const k=ymd(new Date());(S.water[k]=S.water[k]||[]).push({id:uid(),ml:+b.dataset.v,t:new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})});$('#toast').hidden=true;save()}
 else if(a==='hideT')$('#toast').hidden=true;
 else if(a==='goHome'){location.hash='inicio';return}
 else if(a==='goEvo'){location.hash='evolucao';return}
 else if(a==='mus')selM=b.dataset.g;
 else if(a==='evoReset'){if(!evoArm){evoArm=true;render();return}S.dd={};S.best={};evoArm=false;save()}
 else if(a==='remOn'){S.rem.on=!S.rem.on;armRem();if(S.rem.on)try{window.Notification&&Notification.permission==='default'&&Notification.requestPermission()}catch(e){}save()}
 else if(a==='aguaSug'){S.profile.aguaM=0;save()}
 else if(a==='undoW'){(S.water[date]||[]).pop();save()}
 else if(a==='delW'){S.water[date]=S.water[date].filter(x=>x.id!==id);save()}
 else if(a==='prevD')return shift(-1);
 else if(a==='nextD')return shift(1);
 render()});
addEventListener('hashchange',route);route();armRem();
setSync('Salvo só neste aparelho');
(async()=>{try{if(typeof claude==='undefined'){setSync('Salvo só neste aparelho');return}const[u,db]=await Promise.all([claude.use('user'),claude.use('db')]);
 if(!u||!db){setSync('Salvo só neste aparelho (abra no claude.ai com sua conta para sincronizar)');return}
 cref=db.collection('data/users/'+await u.id()).doc('state');
 cref.onSnapshot(s=>{const d=s.exists?s.data():null;
  if(!d||!d.json){ready=true;first=false;push();return}
  if(first||d.ts>(S._ts||0)){try{S=JSON.parse(d.json);S.rem=S.rem||{on:false,iv:30};S.dd=S.dd||{};S.best=S.best||{};S.e1=S.e1||{};S.bd=S.bd||{};S.menu=S.menu||{};S._ts=d.ts;localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}armRem();render();setSync('☁️ Sincronizado com sua conta')}
  else if(d.ts<(S._ts||0))push();else setSync('☁️ Salvo na sua conta');
  first=false;ready=true},()=>setSync('Falha ao sincronizar; dados salvos só neste aparelho'))}catch(e){setSync('Salvo só neste aparelho')}})();
