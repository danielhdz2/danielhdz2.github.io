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

function newGame(){stones=[];turn=0;endN=1;score=[0,0];ang=0;spin=0;st='aim';beep(660,.1);}
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
  const sweep=(cur.t==0&&K.b)||(cur.t==1&&cpuSweep());
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
  if(turn>=8)scoreEnd();else if(turn%2==0)st='aim';else{st='cpu';tm=50;}
}
function scoreEnd(){
  const l=stones.filter(s=>s.alive&&Math.hypot(s.x-CX,s.y-BY)<R+36)
    .sort((a,b)=>Math.hypot(a.x-CX,a.y-BY)-Math.hypot(b.x-CX,b.y-BY));
  if(!l.length)msg='SIN PUNTOS';
  else{const t=l[0].t;let n=0;while(n<l.length&&l[n].t==t)n++;score[t]+=n;msg=(t?'AMARILLO':'ROJO')+' +'+n;}
  st='end';tm=170;beep(520,.2);
}
function nextEnd(){
  if(endN>=3){st='over';beep(784,.4);return;}
  endN++;stones=[];turn=0;ang=0;spin=0;st='aim';
}
function update(){
  tick++;
  for(const k in K)if(!K[k])P[k]=0;
  if(st=='title'){if(pr('s')||pr('a'))newGame();return;}
  if(st=='over'){if(pr('s'))st='title';return;}
  if(st=='end'){if(--tm<=0)nextEnd();return;}
  if(st=='aim'){
    if(K.l)ang=Math.max(-.35,ang-.01);if(K.r)ang=Math.min(.35,ang+.01);
    if(pr('u'))spin=Math.min(1,spin+1);if(pr('d'))spin=Math.max(-1,spin-1);
    if(pr('a')){st='charge';pw=0;pd=1;}
  }else if(st=='charge'){
    pw+=.018*pd;if(pw>=1){pw=1;pd=-1}if(pw<=0){pw=0;pd=1}
    if(!K.a)launch(0,1+pw*1.9,ang,spin);
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
  circ(s.x,s.y,R,'#8c8c9a');circ(s.x,s.y,R-1.5,s.t?'#ffd23f':'#e63946');
  g.fillStyle='#fff';g.fillRect(Math.round(s.x)-2,Math.round(s.y)-2,2,2);
}
function box(y,h){g.fillStyle='#000';g.fillRect(24,y,208,h);g.strokeStyle='#fff';g.lineWidth=1;g.strokeRect(24.5,y+.5,207,h-1);}
function draw(){
  g.fillStyle='#1d2b53';g.fillRect(0,0,256,224);
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
    stone({x:CX,y:OY,t:0});
  }
  // HUD izquierda
  T('ROJO',4,10,'#e63946');T(String(score[0]),4,22,'#fff',12);
  T('AMAR',4,44,'#ffd23f');T(String(score[1]),4,56,'#fff',12);
  T('TANDA',4,82,'#9fd3f0');T(endN+'/3',4,94,'#fff');
  T('GIRO',4,118,'#9fd3f0');T(spin<0?'<<':spin>0?'>>':'--',4,130,'#fff');
  T('TURNO',4,156,'#9fd3f0');T(turn%2==0?'TU':'CPU',4,168,turn%2==0?'#e63946':'#ffd23f');
  // HUD derecha
  const rl=4-stones.filter(s=>s.t==0).length,yl=4-stones.filter(s=>s.t==1).length;
  T('QUEDAN',202,10,'#9fd3f0',7);
  for(let i=0;i<4;i++){if(i<rl)stone({x:212,y:30+i*12,t:0});if(i<yl)stone({x:236,y:30+i*12,t:1});}
  T('POT',208,92,'#9fd3f0');
  g.fillStyle='#2b2b33';g.fillRect(220,106,16,90);
  const p=st=='charge'?pw:0;
  g.fillStyle=p>.8?'#e63946':p>.45?'#ffd23f':'#52c27a';g.fillRect(222,194-p*86,12,p*86);
  g.strokeStyle='#fff';g.strokeRect(220.5,106.5,15,89);
  if(st=='aim')T('A',CX,OY+10,'#1d2b53',8,'center');
  if(st=='move'&&cur&&cur.t==0)T('B: BARRER',CX,214,'#1d2b53',8,'center');
  if(st=='cpu')T('TURNO CPU',CX,214,'#1d2b53',8,'center');
  if(st=='end'){box(88,48);T('FIN DE TANDA '+endN,CX,98,'#9fd3f0',8,'center');T(msg,CX,116,'#fff',8,'center');}
  if(st=='over'){
    box(78,68);T('FIN DEL JUEGO',CX,88,'#9fd3f0',8,'center');
    const w=score[0]>score[1]?'GANASTE!':score[0]<score[1]?'PERDISTE':'EMPATE';
    T(w,CX,106,score[0]>score[1]?'#52c27a':'#e63946',12,'center');
    T(score[0]+' - '+score[1],CX,124,'#fff',8,'center');
  }
}
let last=0,acc=0;
function loop(t){acc=Math.min(acc+t-last,100);last=t;while(acc>=16.67){update();acc-=16.67;}draw();requestAnimationFrame(loop);}
requestAnimationFrame(t=>{last=t;loop(t)});
