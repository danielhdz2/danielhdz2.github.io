const cv=document.getElementById('c'),g=cv.getContext('2d');
const CX=128,BY=48,OY=196,R=6,A=0.012,HOG=140;
const K={l:0,r:0,u:0,d:0,a:0,b:0,s:0},P={};
const map={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d',Space:'a',KeyX:'a',KeyZ:'b',ShiftLeft:'b',Enter:'s'};
addEventListener('keydown',e=>{const k=map[e.code];if(k){K[k]=1;e.preventDefault()}});
addEventListener('keyup',e=>{const k=map[e.code];if(k){K[k]=0;e.preventDefault()}});
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();K[k]=1});
  ['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>K[k]=0));});
const pr=k=>K[k]&&!P[k]?(P[k]=1,true):false;
let AC;function beep(f,d,ty){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),v=AC.createGain();o.type=ty||'square';o.frequency.value=f;v.gain.value=.04;o.connect(v);v.connect(AC.destination);o.start();o.stop(AC.currentTime+d)}catch(e){}}

let st='title',stones=[],turn=0,endN=1,score=[0,0],ang=0,spin=0,pw=0,pd=1,cur=null,tm=0,msg='',mt=0,tick=0;
const speck=Array.from({length:70},(_,i)=>[64+(i*37%126),(i*53%220),i%3]);

const NE=10;
const EQ=[
  {c:'MX',n:'MEXICO',k:['#2fa84f','#e63946']},
  {c:'BR',n:'BRASIL',k:['#ffd23f','#2fa84f']},
  {c:'CO',n:'COLOMBIA',k:['#ffd23f','#3b6fd8']},
  {c:'PT',n:'PORTUGAL',k:['#e63946','#2fa84f']},
  {c:'CA',n:'CANADA',k:['#e63946','#f4f4f4']}
];
let tsel=0,TM=[0,1],TC=['#e63946','#ffd23f'];
function newGame(a,b){
  let c=b;
  if(c==null){do{c=Math.floor(Math.random()*TE.length)}while(c==tsel);}
  const p=a==null?tsel:a;
  TM=[p,c];TC[0]=TE[p].k[0];TC[1]=pick(TE[c].k,TC[0]);ne=NE;
  stones=[];turn=0;endN=1;score=[0,0];ang=0;spin=0;st='aim';beep(660,.1);saveGame();
}
/* ===== Campeonato mundial: 15 mejores paises del ranking de World Curling + Mexico ===== */
const WC=[
  {c:'CAN',n:'CANADA',k:['#e63946','#f4f4f4']},
  {c:'SUI',n:'SUIZA',k:['#f4f4f4','#e63946']},
  {c:'SWE',n:'SUECIA',k:['#ffd23f','#3b6fd8']},
  {c:'SCO',n:'ESCOCIA',k:['#3b6fd8','#f4f4f4']},
  {c:'USA',n:'EE.UU.',k:['#2a4fb5','#e63946']},
  {c:'ITA',n:'ITALIA',k:['#3fa7e8','#f4f4f4']},
  {c:'KOR',n:'COREA',k:['#f4f4f4','#3b6fd8']},
  {c:'JPN',n:'JAPON',k:['#f4f4f4','#e63946']},
  {c:'CHN',n:'CHINA',k:['#e63946','#ffd23f']},
  {c:'NOR',n:'NORUEGA',k:['#e63946','#2a4fb5']},
  {c:'GER',n:'ALEMANIA',k:['#2b2b33','#ffd23f']},
  {c:'CZE',n:'CHEQUIA',k:['#2a4fb5','#e63946']},
  {c:'AUS',n:'AUSTRALIA',k:['#ffd23f','#2fa84f']},
  {c:'EST',n:'ESTONIA',k:['#3b6fd8','#2b2b33']},
  {c:'ESP',n:'ESPAÑA',k:['#e63946','#ffd23f']},
  {c:'MEX',n:'MEXICO',k:['#2fa84f','#e63946']}
];
let ne=NE,md=0,mi=0,sel1=-1,TE=EQ,bk=null,cf=[],fw=[],ct=0;
/* ===== Sesion y partidas guardadas ===== */
let sname='',nm=[],np=0,sd=null,fl=0;
const CH='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',LAST='supercurling:last',KP='supercurling:save:';
function saveGame(){
  if(!sname)return;
  try{
    localStorage.setItem(KP+sname,JSON.stringify({v:1,md,TM,TC,ne,endN,turn,score,bk,st:st=='bracket'?'bracket':'play',
      stones:stones.map(o=>({x:o.x,y:o.y,vx:0,vy:0,t:o.t,alive:o.alive?1:0})),ts:Date.now()}));
    fl=60;
  }catch(e){}
}
function delSave(){try{localStorage.removeItem(KP+sname);}catch(e){}}
function loadGame(n){
  try{
    const d=JSON.parse(localStorage.getItem(KP+n)||'null'),ok=Number.isInteger;
    if(!d||d.v!==1||![0,1,2].includes(d.md))return null;
    const L=d.md==1?WC.length:EQ.length;
    if(!Array.isArray(d.TM)||d.TM.length!=2||!d.TM.every(i=>ok(i)&&i>=0&&i<L))return null;
    if(!Array.isArray(d.TC)||d.TC.length!=2||!d.TC.every(c=>/^#[0-9a-f]{6}$/i.test(c)))return null;
    if(!ok(d.ne)||!ok(d.endN)||!ok(d.turn)||d.turn<0||d.turn>7||d.endN<1||d.ne<1||d.ne>60)return null;
    if(!Array.isArray(d.score)||d.score.length!=2||!d.score.every(Number.isFinite))return null;
    if(!Array.isArray(d.stones)||d.stones.length>8||!d.stones.every(o=>[o.x,o.y].every(Number.isFinite)))return null;
    if(d.md==1){
      const b=d.bk;
      if(!b||!ok(b.me)||b.me<0||b.me>15||![16,8,4,2].includes((b.teams||[]).length)||!b.teams.every(i=>ok(i)&&i>=0&&i<16))return null;
      if(b.ph!='pre'&&b.ph!='post')return null;
      if(b.ph=='post'&&(!Array.isArray(b.res)||b.res.length!=b.teams.length/2||!b.res.every(r=>Array.isArray(r)&&r.length==2&&r.every(Number.isFinite))||!Array.isArray(b.next)||!b.next.every(i=>ok(i)&&i>=0&&i<16)))return null;
    }
    return d;
  }catch(e){return null;}
}
function applyLoad(d){
  md=d.md;TE=md==1?WC:EQ;TM=d.TM;TC=d.TC;ne=d.ne;endN=d.endN;turn=d.turn;score=d.score;
  stones=d.stones.map(o=>({x:o.x,y:o.y,vx:0,vy:0,t:o.t?1:0,spin:0,alive:o.alive?1:0}));
  bk=d.md==1?d.bk:null;ang=0;spin=0;cur=null;
  if(d.st=='bracket'&&bk)st='bracket';
  else if(turn%2==0||md==2)st='aim';else{st='cpu';tm=50;}
  beep(660,.1);
}
function delCh(){if(np>0){nm.splice(np-1,1);np--;}else if(nm.length)nm.splice(0,1);}
/* Teclado fisico: escribir el nombre (en esta pantalla X y Z no actuan como A/B) */
addEventListener('keydown',e=>{
  if(st!='name'||e.ctrlKey||e.metaKey||e.altKey)return;
  if(/^[a-z0-9]$/i.test(e.key)){
    const c=e.key.toUpperCase();
    if(np<nm.length)nm[np]=c;else if(nm.length<10)nm.push(c);else return;
    np=Math.min(np+1,Math.min(nm.length,9));
    beep(520,.03);e.preventDefault();e.stopImmediatePropagation();
  }else if(e.key=='Backspace'){delCh();e.preventDefault();}
},true);
const RN=['OCTAVOS DE FINAL','CUARTOS DE FINAL','SEMIFINAL','FINAL'];
function cd(a,b){const f=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const x=f(a),y=f(b);return Math.hypot(x[0]-y[0],x[1]-y[1],x[2]-y[2]);}
function pick(k,ref){return cd(k[0],ref)>110?k[0]:cd(k[1],ref)>110?k[1]:'#ff8a1f';}
function simMatch(a,b){
  const r=[0,0],p=1/(1+Math.exp(-(b-a)/9));let e=0;
  while(e<NE||r[0]==r[1]){r[Math.random()<p?0:1]+=1+(Math.random()<.35)+(Math.random()<.1);e++;}
  return r;
}
function myMatch(){for(let i=0;i<bk.teams.length/2;i++)if(bk.teams[2*i]==bk.me||bk.teams[2*i+1]==bk.me)return i;return -1;}
function bkStart(p){bk={me:p,teams:[0,15,7,8,4,11,3,12,2,13,5,10,6,9,1,14],res:[],next:[],ph:'pre',alive:true,champ:-1};}
function resolveRound(my){
  const n=bk.teams.length/2,mm=myMatch();bk.res=[];bk.next=[];
  for(let i=0;i<n;i++){
    const a=bk.teams[2*i],b=bk.teams[2*i+1];
    const r=(my&&i==mm)?(a==bk.me?[my[0],my[1]]:[my[1],my[0]]):simMatch(a,b);
    bk.res.push(r);bk.next.push(r[0]>r[1]?a:b);
  }
  if(!bk.next.includes(bk.me))bk.alive=false;
  bk.ph='post';
}
function bkEnd(){resolveRound([score[0],score[1]]);st='bracket';saveGame();beep(784,.3);}
function bkAdvance(){
  const n=bk.teams.length/2;
  if(bk.ph=='pre'){
    const i=myMatch();
    if(bk.alive&&i>=0){const o=bk.teams[2*i]==bk.me?bk.teams[2*i+1]:bk.teams[2*i];newGame(bk.me,o);}
    else resolveRound(null);
  }else if(n==1){bk.champ=bk.next[0];champInit();st='champ';delSave();}
  else{bk.teams=bk.next;bk.ph='pre';beep(660,.1);}
}
function champInit(){
  ct=0;fw=[];
  cf=Array.from({length:70},(_,i)=>({x:Math.random()*256,y:Math.random()*224,v:.5+Math.random()*1.2,o:i*7,c:['#ffd23f','#e63946','#52c27a','#9fd3f0','#f4f4f4','#ff8a1f'][i%6]}));
  [523,659,784,1047,784,1047,1319].forEach((f,i)=>setTimeout(()=>beep(f,.16),i*140));
}

function launch(t,v,a,sp){cur={x:CX,y:OY,vx:v*Math.sin(a),vy:-v*Math.cos(a),t,spin:sp,alive:1};stones.push(cur);st='move';mt=0;beep(220,.12,'triangle');}
function cpuThrow(){
  let tx=CX+Math.random()*24-12,ty=BY;
  const foes=stones.filter(s=>s.alive&&s.t==0&&Math.hypot(s.x-CX,s.y-BY)<42);
  const take=foes.length&&Math.random()<.5;
  if(take){const f=foes.sort((a,b)=>Math.hypot(a.x-CX,a.y-BY)-Math.hypot(b.x-CX,b.y-BY))[0];tx=f.x;ty=f.y;}
  const dx=tx-CX,dy=OY-ty,dist=Math.hypot(dx,dy);
  launch(1,Math.sqrt(2*A*dist)*(take?1.3:1)*(1+Math.random()*.1-.05),Math.atan2(dx,dy),0);
}
const cpuSweep=()=>cur&&cur.y>BY+12&&Math.hypot(cur.vx,cur.vy)<.9;

function step(){
  const sweep=((cur.t==0||md==2)&&K.b)||(cur.t==1&&md!=2&&cpuSweep());
  for(const s of stones){ if(!s.alive)continue;
    let sp=Math.hypot(s.vx,s.vy);
    if(sp>0){
      if(s===cur&&s.spin)s.vx+=s.spin*.0025*(sweep?.4:1);
      sp=Math.hypot(s.vx,s.vy);
      const n=Math.max(0,sp-A*(s===cur&&sweep?.5:1));
      s.vx*=n/sp;s.vy*=n/sp;
      if(n<.02)s.vx=s.vy=0;
    }
    s.x+=s.vx;s.y+=s.vy;
    if(s.x<66||s.x>190||s.y<14){s.alive=0;beep(110,.2,'sawtooth');}
  }
  for(let i=0;i<stones.length;i++)for(let j=i+1;j<stones.length;j++){
    const a=stones[i],b=stones[j];if(!a.alive||!b.alive)continue;
    let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<2*R&&d>0){
      const nx=dx/d,ny=dy/d,o=(2*R-d)/2;
      a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;
      const vn=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
      if(vn<0){const j2=-.95*vn;a.vx-=j2*nx;a.vy-=j2*ny;b.vx+=j2*nx;b.vy+=j2*ny;beep(880,.05);}
    }
  }
}
function finish(){
  stones.forEach(s=>{if(s.alive&&s.y>HOG)s.alive=0;});
  turn++;spin=0;
  if(turn>=8)scoreEnd();else if(turn%2==0||md==2)st='aim';else{st='cpu';tm=50;}
  if(turn<8)saveGame();
}
function scoreEnd(){
  const l=stones.filter(s=>s.alive&&Math.hypot(s.x-CX,s.y-BY)<R+36)
    .sort((a,b)=>Math.hypot(a.x-CX,a.y-BY)-Math.hypot(b.x-CX,b.y-BY));
  if(!l.length)msg='SIN PUNTOS';
  else{const t=l[0].t;let n=0;while(n<l.length&&l[n].t==t)n++;score[t]+=n;msg=TE[TM[t]].n+' +'+n;}
  st='end';tm=170;beep(520,.2);
}
function nextEnd(){
  if(endN>=ne){if(md==1&&score[0]==score[1])ne++;else{if(md==1)bkEnd();else{st='over';delSave();beep(784,.4);}return;}}
  endN++;stones=[];turn=0;ang=0;spin=0;st='aim';saveGame();
}
function update(){
  tick++;if(fl>0)fl--;
  for(const k in K)if(!K[k])P[k]=0;
  if(st=='title'){
    if(pr('s')||pr('a')){
      try{nm=(localStorage.getItem(LAST)||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,10).split('').filter(Boolean);}catch(e){nm=[];}
      np=Math.min(nm.length,9);st='name';beep(660,.1);
    }
    return;
  }
  if(st=='name'){
    if(pr('l')&&np>0){np--;beep(440,.04);}
    if(pr('r')||pr('a')){if(np<Math.min(nm.length,9)){np++;beep(440,.04);}}
    const u=pr('u'),d=pr('d');
    if(u||d){
      if(np>=nm.length)nm.push('A');
      else nm[np]=CH[(CH.indexOf(nm[np])+(u?1:CH.length-1))%CH.length];
      beep(520,.03);
    }
    if(pr('b'))delCh();
    if(pr('s')){
      if(nm.length){
        sname=nm.join('');
        try{localStorage.setItem(LAST,sname);}catch(e){}
        sd=loadGame(sname);mi=0;st='mode';beep(660,.1);
      }else beep(110,.15,'sawtooth');
    }
    return;
  }
  if(st=='mode'){
    const ni=sd?4:3;
    if(pr('u')){mi=(mi+ni-1)%ni;beep(440,.05);}
    if(pr('d')){mi=(mi+1)%ni;beep(440,.05);}
    if(pr('b')){st='name';return;}
    if(pr('s')||pr('a')){
      if(mi==3&&sd)applyLoad(sd);
      else{md=mi;TE=md==1?WC:EQ;tsel=md==1?WC.length-1:0;sel1=-1;st='team';beep(660,.1);}
    }
    return;
  }
  if(st=='team'){
    if(pr('l')||pr('u')){tsel=(tsel+TE.length-1)%TE.length;beep(440,.05);}
    if(pr('r')||pr('d')){tsel=(tsel+1)%TE.length;beep(440,.05);}
    if(pr('b')){st='mode';sel1=-1;return;}
    if(pr('s')||pr('a')){
      if(md==2){
        if(sel1<0){sel1=tsel;tsel=(tsel+1)%TE.length;beep(660,.1);}
        else if(tsel==sel1)beep(110,.15,'sawtooth');
        else newGame(sel1,tsel);
      }else if(md==1){bkStart(tsel);st='bracket';saveGame();beep(660,.1);}
      else newGame();
    }
    return;
  }
  if(st=='bracket'){if(pr('a')||pr('s')){bkAdvance();if(st=='bracket')saveGame();}return;}
  if(st=='champ'){
    ct++;
    for(const q of cf){q.y+=q.v;q.x+=Math.sin((tick+q.o)*.05)*.6;if(q.y>224){q.y=-4;q.x=Math.random()*256;}}
    if(ct%45==10){
      const x=40+Math.random()*176,y=30+Math.random()*60,col=['#ffd23f','#e63946','#52c27a','#9fd3f0','#f4f4f4'][Math.random()*5|0];
      for(let i=0;i<22;i++){const a=i/22*6.283,v=.8+Math.random()*1.4;fw.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:40,c:col});}
      beep(300+Math.random()*300,.12,'sawtooth');
    }
    for(const q of fw){q.x+=q.vx;q.y+=q.vy;q.vy+=.03;q.l--;}
    fw=fw.filter(q=>q.l>0);
    if(ct>90&&(pr('s')||pr('a')))st='title';
    return;
  }
  if(st=='over'){if(pr('s'))st='title';return;}
  if(st=='end'){if(--tm<=0)nextEnd();return;}
  if(st=='aim'){
    if(pr('s')){saveGame();beep(880,.1);}
    if(K.l)ang=Math.max(-.35,ang-.01);if(K.r)ang=Math.min(.35,ang+.01);
    if(pr('u'))spin=Math.min(1,spin+1);if(pr('d'))spin=Math.max(-1,spin-1);
    if(pr('a')){st='charge';pw=0;pd=1;}
  }else if(st=='charge'){
    pw+=.018*pd;if(pw>=1){pw=1;pd=-1}if(pw<=0){pw=0;pd=1}
    if(!K.a)launch(turn%2,1+pw*1.9,ang,spin);
  }else if(st=='cpu'){if(--tm<=0)cpuThrow();}
  else if(st=='move'){
    step();mt++;
    if(mt>1800)stones.forEach(s=>s.vx=s.vy=0);
    if(stones.every(s=>!s.alive||(s.vx==0&&s.vy==0)))finish();
  }
}
function T(s,x,y,c,z,al){g.font=(z||8)+"px 'Press Start 2P',monospace";g.fillStyle=c||'#fff';g.textAlign=al||'left';g.textBaseline='top';g.fillText(s,x,y);}
function circ(x,y,r,c){g.fillStyle=c;g.beginPath();g.arc(x,y,r,0,7);g.fill();}
function stone(s){
  g.fillStyle='rgba(0,40,80,.25)';g.beginPath();g.ellipse(s.x+1.5,s.y+2,R,R-1,0,0,7);g.fill();
  circ(s.x,s.y,R,'#8c8c9a');circ(s.x,s.y,R-1.5,s.col||TC[s.t]);
  g.fillStyle='#fff';g.fillRect(Math.round(s.x)-2,Math.round(s.y)-2,2,2);
}
function box(y,h){g.fillStyle='#000';g.fillRect(24,y,208,h);g.strokeStyle='#fff';g.lineWidth=1;g.strokeRect(24.5,y+.5,207,h-1);}
function draw(){
  g.fillStyle='#1d2b53';g.fillRect(0,0,256,224);
  if(st=='name'){
    T('NOMBRE DE SESION',CX,18,'#ffd23f',8,'center');
    T('HASTA 10 CARACTERES',CX,34,'#9fd3f0',7,'center');
    for(let i=0;i<10;i++){
      const x=38+i*18,y=84;
      g.fillStyle=i==np?'#3b6fd8':'#2b2b45';g.fillRect(x,y,16,22);
      if(nm[i])T(nm[i],x+8,y+7,'#fff',8,'center');
      else if(i==np&&(tick>>4&1))T('_',x+8,y+7,'#fff',8,'center');
      if(i==np){g.fillStyle='#ffd23f';g.fillRect(x,y+24,16,2);}
    }
    T('^ v: LETRA   < >: MOVER',CX,126,'#c2c2d6',7,'center');
    T('A: SIGUIENTE   B: BORRAR',CX,140,'#c2c2d6',7,'center');
    T('START: CONTINUAR',CX,166,'#fff',8,'center');
    T('TAMBIEN PUEDES ESCRIBIR',CX,192,'#9fd3f0',7,'center');
    T('CON EL TECLADO',CX,204,'#9fd3f0',7,'center');
    return;
  }
  if(st=='mode'){
    const it=['AMISTOSO','CAMPEONATO MUNDIAL','2 JUGADORES'],nmM=['AMISTOSO','MUNDIAL','2 JUGADORES'];
    const ds=['CONTRA LA CPU','16 EQUIPOS - ELIMINATORIA','MISMA PANTALLA, POR TURNOS'];
    if(sd){it.push('CONTINUAR PARTIDA');ds.push(nmM[sd.md]+' - '+(sd.bk&&sd.st=='bracket'?RN[Math.log2(8/(sd.bk.teams.length/2))]:'TANDA '+sd.endN+'/'+sd.ne));}
    T('MODO DE JUEGO',CX,10,'#ffd23f',8,'center');
    T('SESION: '+sname,CX,24,'#9fd3f0',7,'center');
    const n=it.length,sp=n>3?36:44,y0=n>3?46:62;
    it.forEach((t,i)=>{
      const y=y0+i*sp;
      if(i==mi){g.fillStyle='#3b6fd8';g.fillRect(20,y-8,216,sp-6);T('>',26,y,'#fff');}
      T(t,CX,y,i==mi?'#fff':'#9fd3f0',8,'center');T(ds[i],CX,y+14,'#c2c2d6',7,'center');
    });
    T('A: ELEGIR  B: CAMBIAR NOMBRE',CX,208,'#fff',7,'center');
    return;
  }
  if(st=='team'){
    T(md==2?(sel1<0?'JUGADOR 1: ELIGE EQUIPO':'JUGADOR 2: ELIGE EQUIPO'):md==1?'CAMPEONATO - ELIGE EQUIPO':'ELIGE TU EQUIPO',CX,10,'#ffd23f',8,'center');
    const rows=Math.min(7,TE.length),off=Math.max(0,Math.min(tsel-3,TE.length-rows));
    for(let j=0;j<rows;j++){
      const i=off+j,e=TE[i],y=30+j*22;
      if(i==tsel){g.fillStyle='#3b6fd8';g.fillRect(28,y-5,200,20);T('>',32,y+1,'#fff');}
      stone({x:56,y:y+5,t:0,col:e.k[0]});
      T(e.c,70,y+1,'#fff');T(e.n,104,y+1,i==tsel?'#fff':'#9fd3f0');
    }
    if(off>0)T('^',240,30,'#fff');
    if(off+rows<TE.length)T('v',240,150,'#fff');
    T('A: ELEGIR  B: VOLVER',CX,188,'#fff',8,'center');
    T(md==1?'16 EQUIPOS - MEXICO POR DEFECTO':md==2?'DEBEN SER EQUIPOS DISTINTOS':'RIVAL: AL AZAR',CX,204,'#9fd3f0',7,'center');
    return;
  }
  if(st=='bracket'){
    const n=bk.teams.length/2,post=bk.ph=='post',mm=myMatch(),sp=Math.min(22,Math.floor(150/n)),y0=30+Math.floor((150-n*sp)/2);
    T(RN[Math.log2(8/n)],CX,10,'#ffd23f',8,'center');
    for(let i=0;i<n;i++){
      const a=bk.teams[2*i],b=bk.teams[2*i+1],y=y0+i*sp,r=post?bk.res[i]:null;
      if(i==mm){g.fillStyle='#3b6fd8';g.fillRect(28,y-4,200,sp-1);}
      stone({x:44,y:y+4,t:0,col:WC[a].k[0]});stone({x:212,y:y+4,t:0,col:WC[b].k[0]});
      T(WC[a].c,58,y,!r||r[0]>r[1]?'#fff':'#6b6b88');
      T(WC[b].c,198,y,!r||r[1]>r[0]?'#fff':'#6b6b88',8,'right');
      T(r?r[0]+'-'+r[1]:'VS',CX,y,r?'#ffd23f':'#9fd3f0',8,'center');
    }
    if(!post)T(bk.alive?'A: JUGAR TU PARTIDO':'ELIMINADO - A: SEGUIR',CX,194,bk.alive?'#fff':'#e63946',8,'center');
    else{
      T(n==1?'A: VER AL CAMPEON':'A: SIGUIENTE FASE',CX,194,'#fff',8,'center');
      if(mm>=0)T(bk.alive?(n==1?'ERES EL CAMPEON!':'AVANZAS A LA SIGUIENTE FASE'):'TU EQUIPO QUEDO ELIMINADO',CX,208,bk.alive?'#52c27a':'#e63946',7,'center');
    }
    return;
  }
  if(st=='champ'){
    const cc=WC[bk.champ],by=Math.sin(tick*.08)*2;
    g.fillStyle='rgba(255,210,63,.13)';
    for(let i=0;i<12;i+=2){const a=tick*.012+i*Math.PI/6;g.beginPath();g.moveTo(CX,100);g.lineTo(CX+Math.cos(a)*320,100+Math.sin(a)*320);g.lineTo(CX+Math.cos(a+.27)*320,100+Math.sin(a+.27)*320);g.fill();}
    g.fillStyle='#d6ecf7';g.fillRect(0,172,256,52);
    [[100,22,'#3b6fd8'],[68,15,'#f4f4f4'],[38,9,'#e63946'],[12,3,'#f4f4f4']].forEach(r=>{g.fillStyle=r[2];g.beginPath();g.ellipse(CX,200,r[0],r[1],0,0,7);g.fill();});
    g.save();g.translate(0,by);
    g.fillStyle='#e0a419';g.fillRect(100,128,56,8);g.fillRect(106,120,44,8);g.fillRect(121,100,14,20);
    g.fillStyle='#ffd23f';g.beginPath();g.moveTo(98,56);g.lineTo(158,56);g.lineTo(148,98);g.lineTo(108,98);g.fill();
    g.fillStyle='#e0a419';g.beginPath();g.moveTo(128,56);g.lineTo(158,56);g.lineTo(148,98);g.lineTo(128,98);g.fill();
    g.fillStyle='#fff3b0';g.fillRect(106,60,4,26);g.fillStyle='#ffe27a';g.fillRect(96,52,64,5);
    g.strokeStyle='#ffd23f';g.lineWidth=4;
    g.beginPath();g.arc(98,70,11,Math.PI/2,Math.PI*1.5);g.stroke();
    g.beginPath();g.arc(158,70,11,-Math.PI/2,Math.PI/2);g.stroke();
    g.fillStyle=cc.k[0];g.fillRect(112,72,32,10);g.fillStyle=cc.k[1];g.fillRect(112,76,32,3);
    g.restore();
    const e=Math.min(1,ct/70),ee=1-Math.pow(1-e,3);
    stone({x:-12+74*ee,y:186,t:0,col:cc.k[0]});stone({x:268-74*ee,y:186,t:0,col:cc.k[0]});
    for(const q of cf){g.fillStyle=q.c;g.fillRect(q.x|0,q.y|0,2,3);}
    for(const q of fw){g.fillStyle=q.c;g.fillRect(q.x|0,q.y|0,2,2);}
    T('CAMPEON DEL MUNDO',CX,12,tick>>3&1?'#ffd23f':'#fff',12,'center');
    T(cc.n,CX,32,'#fff',14,'center');
    T(bk.me==bk.champ?'FELICIDADES!':'EL CAMPEON ES '+cc.c,CX,146,'#9fd3f0',8,'center');
    if(ct>90&&(tick>>5&1))T('PULSA START',CX,212,'#1d2b53',8,'center');
    return;
  }
  if(st=='title'){
    circ(CX,160,44,'#3b6fd8');circ(CX,160,30,'#f4f4f4');circ(CX,160,16,'#e63946');circ(CX,160,5,'#f4f4f4');
    stone({x:CX+30,y:132,t:0});stone({x:CX-34,y:176,t:1});
    T('SUPER',CX,26,'#ffd23f',20,'center');T('CURLING',CX,54,'#e63946',20,'center');
    T('16-BIT EDITION',CX,82,'#9fd3f0',8,'center');
    if(tick>>5&1)T('PULSA START',CX,112,'#fff',8,'center');
    T('A: LANZAR  B: BARRER',CX,206,'#c2c2d6',8,'center');
    return;
  }
  // paneles laterales
  g.fillStyle='#14141c';g.fillRect(0,0,58,224);g.fillRect(198,0,58,224);
  // hielo
  g.fillStyle='#d6ecf7';g.fillRect(64,0,128,224);
  g.fillStyle='#bfdcee';for(const p of speck)g.fillRect(p[0],p[1],2+p[2],1);
  // paredes
  g.fillStyle='#6b4f3a';g.fillRect(58,0,6,224);g.fillRect(192,0,6,224);
  g.fillStyle='#8f6d52';g.fillRect(58,0,2,224);g.fillRect(192,0,2,224);
  // casa
  circ(CX,BY,36,'#3b6fd8');circ(CX,BY,24,'#f4f4f4');circ(CX,BY,12,'#e63946');circ(CX,BY,4,'#f4f4f4');
  g.fillStyle='rgba(60,90,130,.55)';g.fillRect(64,BY,128,1);g.fillRect(CX,0,1,OY);
  g.fillStyle='#3b6fd8';g.fillRect(64,HOG,128,2);g.fillStyle='#8c8c9a';g.fillRect(CX-10,OY+R+2,20,2);
  // piedras
  for(const s of stones)if(s.alive)stone(s);
  // guía de apuntado
  if(st=='aim'||st=='charge'){
    g.fillStyle='#1d2b53';
    for(let d=14;d<110;d+=9)g.fillRect(Math.round(CX+Math.sin(ang)*d),Math.round(OY-Math.cos(ang)*d),2,2);
    stone({x:CX,y:OY,t:turn%2});
  }
  // HUD izquierda
  T(TE[TM[0]].c,4,10,TC[0]);T(String(score[0]),4,22,'#fff',12);
  T(TE[TM[1]].c,4,44,TC[1]);T(String(score[1]),4,56,'#fff',12);
  T('TANDA',4,82,'#9fd3f0');T(endN+'/'+ne,4,94,'#fff');
  T('GIRO',4,118,'#9fd3f0');T(spin<0?'<<':spin>0?'>>':'--',4,130,'#fff');
  T('TURNO',4,156,'#9fd3f0');T(md==2?'J'+(turn%2+1):turn%2==0?'TU':'CPU',4,168,TC[turn%2]);
  // HUD derecha
  const rl=4-stones.filter(s=>s.t==0).length,yl=4-stones.filter(s=>s.t==1).length;
  T('QUEDAN',202,10,'#9fd3f0',7);
  for(let i=0;i<4;i++){if(i<rl)stone({x:212,y:30+i*12,t:0});if(i<yl)stone({x:236,y:30+i*12,t:1});}
  T('POT',208,92,'#9fd3f0');
  g.fillStyle='#2b2b33';g.fillRect(220,106,16,90);
  const p=st=='charge'?pw:0;
  g.fillStyle=p>.8?'#e63946':p>.45?'#ffd23f':'#52c27a';g.fillRect(222,194-p*86,12,p*86);
  g.strokeStyle='#fff';g.strokeRect(220.5,106.5,15,89);
  if(st=='aim')T(md==2?'J'+(turn%2+1)+': A':'A',CX,OY+10,'#1d2b53',8,'center');
  if(st=='move'&&cur&&(cur.t==0||md==2))T('B: BARRER',CX,214,'#1d2b53',8,'center');
  if(st=='cpu')T('TURNO CPU',CX,214,'#1d2b53',8,'center');
  if(fl>0)T('PARTIDA GUARDADA',CX,2,'#1d2b53',8,'center');
  if(st=='end'){box(88,48);T('FIN DE TANDA '+endN,CX,98,'#9fd3f0',8,'center');T(msg,CX,116,'#fff',8,'center');}
  if(st=='over'){
    box(78,68);T('FIN DEL JUEGO',CX,88,'#9fd3f0',8,'center');
    const w=md==2?(score[0]>score[1]?'GANA J1':score[0]<score[1]?'GANA J2':'EMPATE'):(score[0]>score[1]?'GANASTE!':score[0]<score[1]?'PERDISTE':'EMPATE');
    T(w,CX,106,md==2?'#ffd23f':score[0]>score[1]?'#52c27a':'#e63946',12,'center');
    T(score[0]+' - '+score[1],CX,124,'#fff',8,'center');
  }
}
let last=0,acc=0;
function loop(t){acc=Math.min(acc+t-last,100);last=t;while(acc>=16.67){update();acc-=16.67;}draw();requestAnimationFrame(loop);}
requestAnimationFrame(t=>{last=t;loop(t)});
