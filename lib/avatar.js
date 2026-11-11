/* Arice 特戰隊員頭像：用代碼（x:…）存在學生資料的 av 欄位，畫面上即時畫成貼紙圖。學習島、勇者衝鋒、首頁共用。 */
(function(){
"use strict";
const OPT=[
 {key:'headgear',label:'頭部',items:[['cap','棒球帽'],['helmet','戰術頭盔'],['beanie','毛帽'],['hood','兜帽'],['none','不戴']]},
 {key:'nvg',label:'夜視鏡（戴頭盔時）',items:[['none','無'],['quad','四眼'],['dual','雙眼']]},
 {key:'headset',label:'戰術耳機',items:[['on','戴'],['off','不戴']]},
 {key:'camo',label:'頭盔迷彩',items:[['on','開'],['off','關']]},
 {key:'eyewear',label:'眼部',items:[['none','無'],['goggles','護目鏡'],['shades','墨鏡'],['glasses','圓眼鏡']]},
 {key:'cover',label:'臉部',items:[['none','無'],['balaclava','頭套'],['mask','半罩面罩'],['respirator','防毒面具'],['beard','鬍子'],['mustache','八字鬍']]},
 {key:'hair',label:'髮型',items:[['short','短髮'],['long','長髮'],['twin','雙馬尾'],['buzz','平頭'],['bald','光頭']]},
 {key:'expr',label:'表情',items:[['smile','微笑'],['grin','開心'],['wink','眨眼'],['happy','瞇眼笑'],['smug','得意'],['serious','嚴肅'],['shock','驚訝'],['blank','呆住']]},
 {key:'pose',label:'動作',items:[['idle','站好'],['thumb','比讚'],['wave','揮手']]},
];
const SW=[
 {key:'gear',label:'裝備顏色',items:[['#6b7a45','叢林綠'],['#4f5a3a','遊騎兵綠'],['#c2a477','沙漠'],['#3a3d42','夜戰黑'],['#858b90','城市灰'],['#34465f','海軍藍'],['#dfe3e6','雪地白']]},
 {key:'skin',label:'膚色',items:[['#ffe0c4','白皙'],['#f6cfa8','自然'],['#e3b48a','小麥'],['#c48d62','古銅'],['#8f5f3e','深色']]},
 {key:'hairColor',label:'髮色',items:[['#2a2420','黑'],['#5a3b26','棕'],['#c9a04a','金'],['#d6d8dc','銀'],['#f3f3f3','白'],['#b5523b','紅棕'],['#4a5a7a','藍灰']]},
 {key:'eye',label:'瞳色',items:[['#4a3424','深棕'],['#2f6fb0','藍'],['#d9a520','金'],['#3c8a5a','綠'],['#8a3c9a','紫'],['#b03030','紅']]},
 {key:'lens',label:'護目鏡鏡片',items:[['#ff8a2a','橘'],['#3fa7ff','藍'],['#6b7177','煙灰'],['#ffd23f','黃'],['#b84cff','紫']]},
];

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;
 if(amt<0){r*=1+amt;g*=1+amt;b*=1+amt}else{r+=(255-r)*amt;g+=(255-g)*amt;b+=(255-b)*amt}
 return`rgb(${r|0},${g|0},${b|0})`}
function cv(w){const c=document.createElement('canvas');c.width=c.height=w;return c}

const HX=256,HY=228,RX=122,RY=114,EY=HY+28,MY=HY+72,PI=Math.PI,TAU=PI*2,K='#26231f';

function drawAvatar(c,s){
 const W=Math.round(512*s),A=cv(W),a=A.getContext('2d');
 a.scale(s,s);a.lineJoin='round';a.lineCap='round';
 const rnd=mulberry32(c.seed||1);
 const g=c.gear,gd=shade(g,-.28),skin=c.skin,hc=c.hairColor;
 const P=()=>a.beginPath();
 const S=(fill,lw=5)=>{if(fill){a.fillStyle=fill;a.fill()}a.lineWidth=lw;a.strokeStyle=K;a.stroke()};
 const headPath=()=>{P();a.ellipse(HX,HY,RX,RY,0,0,TAU)};
 const bala=c.cover==='balaclava',hood=c.headgear==='hood',helmet=c.headgear==='helmet';
 const raised=c.pose!=='idle';

 // back hair
 if(!bala&&!hood){
  if(c.hair==='long'){P();a.moveTo(HX-RX-20,HY);a.ellipse(HX,HY,RX+20,RY+24,0,PI,TAU);a.lineTo(HX+RX+26,392);a.quadraticCurveTo(HX,420,HX-RX-26,392);a.closePath();S(hc)}
  if(c.hair==='twin'){for(const d of[-1,1]){P();a.ellipse(HX+d*(RX+34),HY+82,30,78,d*-.25,0,TAU);S(hc)}}
 }
 if(hood){P();a.ellipse(HX,HY+8,RX+30,RY+32,0,0,TAU);S(gd)}

 // body
 const glove=shade(g,-.5);
 P();a.ellipse(HX-104,404,30,54,.28,0,TAU);S(g);
 if(!raised){P();a.ellipse(HX+104,404,30,54,-.28,0,TAU);S(g)}
 P();a.roundRect(HX-98,316,196,164,[44,44,30,30]);S(g);
 P();a.roundRect(HX-76,334,152,136,18);S(gd);
 for(let i=0;i<3;i++){const x=HX-66+i*46;P();a.roundRect(x,394,40,58,8);S(shade(g,-.1),4);P();a.roundRect(x,394,40,18,7);S(shade(g,-.38),4)}
 P();a.roundRect(HX+16,350,48,30,5);S(shade(g,.3),4);
 P();a.moveTo(HX+26,358);a.lineTo(HX+40,370);a.lineTo(HX+54,358);a.lineWidth=4;a.strokeStyle=K;a.stroke();
 P();a.arc(HX-116,452,18,0,TAU);S(glove);
 if(!raised){P();a.arc(HX+116,452,18,0,TAU);S(glove)}
 else{
  P();a.ellipse(HX+132,340,28,56,-.75,0,TAU);S(g);
  const hx=HX+164,hy=290;
  if(c.pose==='thumb'){P();a.roundRect(hx-7,hy-42,15,34,7);S(glove,4);P();a.arc(hx,hy,22,0,TAU);S(glove);
   P();a.moveTo(hx-12,hy+2);a.lineTo(hx+14,hy+2);a.lineWidth=3;a.strokeStyle=K;a.stroke()}
  else{for(let k=0;k<4;k++){a.save();a.translate(hx,hy);a.rotate(-.5+k*.33);P();a.roundRect(-6,-46,12,30,6);S(glove,4);a.restore()}
   P();a.arc(hx,hy,22,0,TAU);S(glove);
   P();a.arc(hx,hy,48,-1.25,-.45);a.lineWidth=4;a.strokeStyle=K;a.stroke();
   P();a.arc(hx,hy,58,-1.15,-.6);a.stroke()}
 }

 // ears
 if(c.headset==='off'&&!hood&&!bala){for(const d of[-1,1]){P();a.ellipse(HX+d*(RX-2),HY+30,16,22,0,0,TAU);S(skin)}}

 // head
 headPath();S(skin);
 if(!bala){a.fillStyle='rgba(255,110,110,.32)';for(const d of[-1,1]){P();a.ellipse(HX+d*72,HY+64,18,9,0,0,TAU);a.fill()}}
 if(c.cover==='beard'){a.save();headPath();a.clip();P();a.ellipse(HX,HY+114,104,64,0,0,TAU);a.fillStyle=hc;a.fill();a.restore()}
 const covered=['balaclava','mask','respirator'].includes(c.cover);
 if(!covered)mouth();
 if(c.cover==='beard'||c.cover==='mustache'){P();a.moveTo(HX,MY-16);a.quadraticCurveTo(HX-22,MY-28,HX-44,MY-8);a.quadraticCurveTo(HX-22,MY-10,HX,MY-8);a.quadraticCurveTo(HX+22,MY-10,HX+44,MY-8);a.quadraticCurveTo(HX+22,MY-28,HX,MY-16);a.closePath();S(hc,4)}
 if(c.cover==='mask'){a.save();headPath();a.clip();
  P();a.moveTo(HX-RX-4,HY+66);a.quadraticCurveTo(HX,HY+50,HX+RX+4,HY+66);a.lineTo(HX+RX+4,HY+RY+6);a.lineTo(HX-RX-4,HY+RY+6);a.closePath();a.fillStyle='#2e3236';a.fill();
  a.strokeStyle='rgba(255,255,255,.18)';a.lineWidth=4;for(let i=-2;i<=2;i++){P();a.moveTo(HX+i*26,HY+70);a.lineTo(HX+i*26,HY+RY);a.stroke()}
  P();a.moveTo(HX-RX-4,HY+66);a.quadraticCurveTo(HX,HY+50,HX+RX+4,HY+66);a.lineWidth=5;a.strokeStyle=K;a.stroke();a.restore()}
 if(bala){headPath();a.fillStyle=g==='#dfe3e6'?'#3a3d42':shade(g,-.45);a.fill();P();a.roundRect(HX-92,EY-34,184,68,32);S(skin)}
 headPath();a.lineWidth=5;a.strokeStyle=K;a.stroke();

 // eyes
 if(!['goggles','shades'].includes(c.eyewear))eyes();

 // hair over forehead
 if(!bala){
  if(c.headgear==='none')hairTop(-6);
  else if(c.headgear==='cap')hairTop(2);
  else if(c.headgear==='beanie')hairTop(4);
  else if(hood)hairTop(-4);
 }

 // headgear
 if(c.headgear==='cap'){
  const cc=g==='#dfe3e6'?'#c9ced2':gd;
  P();a.ellipse(HX,HY-28,RX+8,RY+6,0,PI,TAU);a.closePath();S(cc);
  P();a.arc(HX,HY-146,7,0,TAU);S(cc,4);
  P();a.roundRect(HX-26,HY-98,52,32,7);S(shade(g,.3),4);
  P();a.moveTo(HX-14,HY-88);a.lineTo(HX,HY-76);a.lineTo(HX+14,HY-88);a.lineWidth=4;a.strokeStyle=K;a.stroke();
  P();a.moveTo(HX-RX-14,HY-30);a.quadraticCurveTo(HX,HY+6,HX+RX+14,HY-30);a.quadraticCurveTo(HX,HY-12,HX-RX-14,HY-30);a.closePath();S(shade(cc,-.2));
 }
 if(c.headgear==='beanie'){
  const bc=shade(g,-.15);
  P();a.ellipse(HX,HY-30,RX+10,RY+12,0,PI,TAU);a.closePath();S(bc);
  P();a.roundRect(HX-RX-14,HY-52,2*RX+28,40,18);S(shade(g,.05));
  a.strokeStyle='rgba(0,0,0,.22)';a.lineWidth=3;for(let x=HX-RX+4;x<HX+RX;x+=18){P();a.moveTo(x,HY-46);a.lineTo(x,HY-18);a.stroke()}
 }
 if(hood){
  P();a.moveTo(HX-RX-28,HY+60);a.lineTo(HX-RX-28,HY-2);a.ellipse(HX,HY-2,RX+28,RY+30,0,PI,TAU);a.lineTo(HX+RX+28,HY+60);a.lineTo(HX+RX-6,HY+60);
  a.quadraticCurveTo(HX+RX-2,HY-86,HX,HY-90);a.quadraticCurveTo(HX-RX+2,HY-86,HX-RX+6,HY+60);a.closePath();S(gd);
 }
 if(helmet){
  const hp=()=>{P();a.moveTo(HX-RX-16,HY+18);a.lineTo(HX-RX-16,HY-14);a.ellipse(HX,HY-14,RX+16,RY+22,0,PI,TAU);a.lineTo(HX+RX+16,HY+18);a.lineTo(HX+RX-14,HY+18);a.quadraticCurveTo(HX,HY-76,HX-RX+14,HY+18);a.closePath()};
  hp();a.fillStyle=g;a.fill();
  if(c.camo==='on'){a.save();hp();a.clip();const cols=[shade(g,-.25),shade(g,.18),shade(g,-.45)];
   for(let i=0;i<18;i++){P();a.ellipse(HX-150+rnd()*300,HY-150+rnd()*170,14+rnd()*22,9+rnd()*14,rnd()*PI,0,TAU);a.fillStyle=cols[i%3];a.fill()}a.restore()}
  hp();a.lineWidth=5;a.strokeStyle=K;a.stroke();
  for(const d of[-1,1]){P();a.roundRect(d<0?HX-RX-24:HX+RX+8,HY-50,16,46,4);S(shade(g,-.35),4)}
  if(c.nvg==='none'){P();a.roundRect(HX-34,HY-108,68,30,7);S(shade(g,-.15),4)}
 }

 // eyewear
 if(c.eyewear==='goggles'){
  a.save();P();a.ellipse(HX,HY,RX+8,RY+8,0,0,TAU);a.clip();P();a.rect(HX-RX-12,EY-13,2*RX+24,26);a.fillStyle='#2d2f31';a.fill();a.restore();
  P();a.roundRect(HX-94,EY-32,188,64,30);S('#2d2f31');
  const gr=a.createLinearGradient(0,EY-24,0,EY+24);gr.addColorStop(0,shade(c.lens,.35));gr.addColorStop(1,shade(c.lens,-.35));
  P();a.roundRect(HX-85,EY-24,170,48,23);a.fillStyle=gr;a.fill();
  a.strokeStyle='rgba(255,255,255,.75)';a.lineWidth=6;P();a.moveTo(HX-62,EY-8);a.lineTo(HX-46,EY-15);a.stroke();a.lineWidth=4;P();a.moveTo(HX-40,EY-9);a.lineTo(HX-32,EY-13);a.stroke();
 }
 if(c.eyewear==='shades'){
  for(const d of[-1,1]){P();a.moveTo(HX+d*80,EY-10);a.lineTo(HX+d*(RX-2),EY-14);a.lineWidth=5;a.strokeStyle=K;a.stroke();
   P();a.roundRect(HX+d*46-34,EY-22,68,46,18);S('#1f2226');
   a.strokeStyle='rgba(255,255,255,.6)';a.lineWidth=4;P();a.moveTo(HX+d*46-20,EY-6);a.lineTo(HX+d*46-10,EY-12);a.stroke()}
  P();a.moveTo(HX-12,EY-8);a.quadraticCurveTo(HX,EY-16,HX+12,EY-8);a.lineWidth=5;a.strokeStyle=K;a.stroke();
 }
 if(c.eyewear==='glasses'){
  for(const d of[-1,1]){P();a.arc(HX+d*46,EY+2,30,0,TAU);a.fillStyle='rgba(255,255,255,.14)';a.fill();a.lineWidth=5;a.strokeStyle=K;a.stroke()}
  P();a.moveTo(HX-16,EY-2);a.quadraticCurveTo(HX,EY-10,HX+16,EY-2);a.stroke();
 }

 // respirator
 if(c.cover==='respirator'){
  for(const d of[-1,1]){P();a.moveTo(HX+d*30,MY-10);a.lineTo(HX+d*(RX-4),HY+30);a.lineWidth=10;a.strokeStyle='#2a2d30';a.stroke()}
  for(const d of[-1,1]){P();a.arc(HX+d*56,MY+18,26,0,TAU);S('#585d62');P();a.arc(HX+d*56,MY+18,15,0,TAU);S('#3a3e42',4)}
  P();a.roundRect(HX-38,MY-30,76,62,24);S('#3d4146');
  a.strokeStyle='rgba(255,255,255,.25)';a.lineWidth=4;for(const y of[MY-8,MY+4,MY+16]){P();a.moveTo(HX-18,y);a.lineTo(HX+18,y);a.stroke()}
 }

 // headset
 if(c.headset==='on'&&!hood){
  if(!helmet){P();a.ellipse(HX,HY-8,RX+14,RY+40,0,PI*1.04,PI*1.96);a.lineWidth=16;a.strokeStyle=K;a.stroke();a.lineWidth=8;a.strokeStyle='#4a4e4a';a.stroke()}
  for(const d of[-1,1]){const x=d<0?HX-RX-30:HX+RX-10;P();a.roundRect(x,HY-8,40,78,16);S('#3d413d');P();a.roundRect(x+9,HY+4,22,54,10);a.fillStyle=g;a.fill()}
  if(c.cover!=='respirator'){P();a.moveTo(HX-RX-8,HY+64);a.quadraticCurveTo(HX-RX+6,HY+102,HX-44,HY+92);a.lineWidth=7;a.strokeStyle=K;a.stroke();P();a.arc(HX-40,HY+92,9,0,TAU);S('#3d413d',4)}
 }

 // night vision
 if(helmet&&c.nvg!=='none'){
  P();a.roundRect(HX-14,HY-82,28,36,6);S('#3b3e40',4);
  const quad=c.nvg==='quad',xs=quad?[-72,-24,24,72]:[-34,34],r=quad?22:26,w=quad?200:150;
  P();a.roundRect(HX-w/2,HY-146,w,52,18);S('#46494c');
  for(const x of xs){P();a.arc(HX+x,HY-120,r,0,TAU);S('#2f3234');
   const rg=a.createRadialGradient(HX+x-3,HY-123,1,HX+x,HY-120,r-8);rg.addColorStop(0,'#8dffbe');rg.addColorStop(1,'#0c3a22');
   P();a.arc(HX+x,HY-120,r-8,0,TAU);a.fillStyle=rg;a.fill();a.fillStyle='rgba(255,255,255,.85)';P();a.arc(HX+x-5,HY-126,3.5,0,TAU);a.fill()}
 }

 function hairTop(tip){
  if(c.hair==='bald'){if(c.headgear==='none'){a.fillStyle='rgba(255,255,255,.45)';P();a.ellipse(HX-42,HY-70,26,12,-.4,0,TAU);a.fill()}return}
  if(c.hair==='buzz'){if(c.headgear!=='none')return;P();a.moveTo(HX-RX-2,HY-4);a.ellipse(HX,HY-4,RX+2,RY+4,0,PI,TAU);a.quadraticCurveTo(HX,HY-90,HX-RX-2,HY-4);a.closePath();S(hc);return}
  P();a.moveTo(HX-RX-6,HY+50);a.lineTo(HX-RX-6,HY-6);a.ellipse(HX,HY-6,RX+6,RY+12,0,PI,TAU);a.lineTo(HX+RX+6,HY+50);a.lineTo(HX+RX-14,HY-8);
  const n=7,x0=HX+RX-14,step=(2*RX-28)/n;
  for(let i=0;i<n;i++){const xr=x0-step*i;a.lineTo(xr-step/2,HY+tip+(i%2?4:0));a.lineTo(xr-step,HY-36)}
  a.lineTo(HX-RX-6,HY+50);a.closePath();S(hc);
  a.strokeStyle='rgba(255,255,255,.35)';a.lineWidth=5;P();a.arc(HX-30,HY-40,60,PI*1.25,PI*1.45);a.stroke();
 }
 function eyes(){
  const e=c.expr;
  if(e==='serious'){for(const d of[-1,1]){P();a.moveTo(HX+d*24,EY-36);a.lineTo(HX+d*66,EY-46);a.lineWidth=6;a.strokeStyle=K;a.stroke()}}
  for(const d of[-1,1]){const x=HX+d*46;
   if(e==='happy'||(e==='wink'&&d>0)){P();a.arc(x,EY+12,18,PI*1.15,PI*1.85);a.lineWidth=6;a.strokeStyle=K;a.stroke();continue}
   if(e==='shock'){P();a.ellipse(x,EY,19,24,0,0,TAU);S('#ffffff');P();a.arc(x,EY+2,6,0,TAU);a.fillStyle=K;a.fill();continue}
   if(e==='blank'){P();a.ellipse(x,EY+2,7,9,0,0,TAU);a.fillStyle=K;a.fill();continue}
   P();a.ellipse(x,EY,20,26,0,0,TAU);a.fillStyle='#2b221c';a.fill();
   P();a.ellipse(x,EY+5,15,18,0,0,TAU);a.fillStyle=c.eye;a.fill();
   P();a.ellipse(x,EY+7,7,9,0,0,TAU);a.fillStyle='#1a1410';a.fill();
   a.fillStyle='#fff';P();a.arc(x+6,EY-8,6,0,TAU);a.fill();P();a.arc(x-6,EY+12,3,0,TAU);a.fill();
   P();a.ellipse(x,EY,22,28,0,PI*1.12,PI*1.88);a.lineWidth=6;a.strokeStyle='#1a1410';a.stroke();
   if(e==='smug'||e==='serious'){const cut=e==='smug'?-2:-12;a.save();P();a.ellipse(x,EY,24,30,0,0,TAU);a.clip();a.fillStyle=skin;a.fillRect(x-30,EY-34,60,cut+34);a.restore();
    P();a.moveTo(x-22,EY+cut);a.lineTo(x+22,EY+cut);a.lineWidth=6;a.strokeStyle=K;a.stroke()}
  }
 }
 function mouth(){
  const e=c.expr;a.lineWidth=5;a.strokeStyle=K;
  if(e==='grin'||e==='shock'){
   if(e==='shock'){P();a.ellipse(HX,MY+2,9,12,0,0,TAU);S('#7a2b2b');return}
   const mp=()=>{P();a.moveTo(HX-20,MY-6);a.quadraticCurveTo(HX,MY+30,HX+20,MY-6);a.closePath()};
   mp();a.fillStyle='#7a2b2b';a.fill();a.save();mp();a.clip();P();a.ellipse(HX,MY+14,12,8,0,0,TAU);a.fillStyle='#e8737a';a.fill();a.restore();mp();a.stroke();return}
  if(e==='happy'){for(const d of[-1,1]){P();a.arc(HX+d*8,MY-4,8,0,PI);a.stroke()}return}
  if(e==='smug'){P();a.moveTo(HX-14,MY-2);a.quadraticCurveTo(HX+2,MY+8,HX+18,MY-10);a.stroke();return}
  if(e==='serious'){P();a.moveTo(HX-12,MY);a.lineTo(HX+12,MY);a.stroke();return}
  if(e==='blank'){P();a.moveTo(HX-6,MY);a.lineTo(HX+6,MY);a.stroke();return}
  P();a.arc(HX,MY-10,14,.15*PI,.85*PI);a.stroke();
 }

 // sticker outline + shadow
 const sil=col=>{const B=cv(W),b=B.getContext('2d');b.drawImage(A,0,0);b.globalCompositeOperation='source-in';b.fillStyle=col;b.fillRect(0,0,W,W);return B};
 const Wt=sil('#ffffff'),Gr=sil('#cfd3cb'),O=cv(W),o=O.getContext('2d');
 const ring=(B,r)=>{for(let i=0;i<28;i++){const t=i/28*TAU;o.drawImage(B,Math.cos(t)*r,Math.sin(t)*r)}};
 ring(Gr,13*s);ring(Wt,11*s);ring(Wt,6*s);o.drawImage(A,0,0);
 const C=Math.round(384*s),F=cv(C),f=F.getContext('2d');f.shadowColor='rgba(0,0,0,.22)';f.shadowBlur=8*s;f.shadowOffsetY=3*s;f.drawImage(O,-64*s,-24*s);
 return F.toDataURL('image/png');
}


 /* ---------- 代碼：'x:' + 14 個選項索引 + 2 碼迷彩花紋 ---------- */
 var G=OPT.concat(SW);
 function enc(c){var s='x:';G.forEach(function(g){var i=g.items.findIndex(function(it){return it[0]===c[g.key]});s+=Math.max(0,i).toString(36)});var sd=((c.seed>>>0)%1296).toString(36);return s+(sd.length<2?'0'+sd:sd)}
 function dec(v){if(!ok(v))return null;var c={};for(var i=0;i<G.length;i++){var k=parseInt(v.charAt(2+i),36);var it=G[i].items[k];if(!it)return null;c[G[i].key]=it[0]}
  c.seed=parseInt(v.slice(2+G.length),36)+1;if(c.headgear!=='helmet')c.nvg='none';return c}
 function ok(v){return typeof v==='string'&&v.length===2+G.length+2&&v.slice(0,2)==='x:'&&/^[0-9a-z]+$/.test(v.slice(2))}

 function rcfg(r){var c={};G.forEach(function(g){c[g.key]=g.items[Math.floor(r()*g.items.length)][0]});
  if(c.headgear!=='helmet')c.nvg='none';else if(r()<.3)c.nvg='none';
  if(c.cover==='balaclava'&&r()<.5)c.eyewear='none';if(c.eyewear==='goggles'&&r()<.5)c.eyewear='none';
  c.seed=Math.floor(r()*1295);return c}
 var PRE=(function(){var r=mulberry32(20261112),out=[];out.push(enc({headgear:'helmet',nvg:'quad',headset:'on',camo:'on',eyewear:'none',cover:'none',hair:'short',expr:'grin',pose:'thumb',gear:'#6b7a45',skin:'#f6cfa8',hairColor:'#2a2420',eye:'#4a3424',lens:'#ff8a2a',seed:7}));
  while(out.length<24){var v=enc(rcfg(r));if(out.indexOf(v)<0)out.push(v)}return out})();

 var cache={};
 function url(v){if(!ok(v))return '';if(cache[v])return cache[v];var c=dec(v);if(!c)return '';try{cache[v]=drawAvatar(c,.5)}catch(e){return ''}return cache[v]}
 function html(v){var u=url(v);return u?'<img class="arav" src="'+u+'" alt="">':''}

 /* ---------- 自己做頭像的視窗 ---------- */
 var CSS='<style>.arav{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none}'
  +'#arav-ed{position:fixed;inset:0;z-index:100001;background:rgba(8,10,6,.72);display:grid;place-items:center;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));font-family:system-ui,-apple-system,"PingFang TC","Noto Sans TC",sans-serif;color:#e8ecdc}'
  +'#arav-ed .box{width:100%;max-width:820px;max-height:100%;overflow:auto;background:#1c2116;border:1px solid #3a4230;border-radius:22px;padding:18px;display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:18px;box-shadow:0 30px 80px rgba(0,0,0,.5)}'
  +'@media (max-width:640px){#arav-ed .box{grid-template-columns:minmax(0,1fr)}}'
  +'#arav-ed h2{margin:0 0 4px;font-size:22px}#arav-ed p{margin:0;color:#a6ae96;font-size:14px;line-height:1.6}'
  +'#arav-ed .pv{display:grid;gap:12px;align-content:start}'
  +'#arav-ed .stage{aspect-ratio:1;border-radius:18px;background:#dfe6d3;display:grid;place-items:center;overflow:hidden}'
  +'#arav-ed .stage img{width:100%;height:100%;object-fit:contain}'
  +'#arav-ed .bt{display:flex;flex-wrap:wrap;gap:8px}'
  +'#arav-ed button{font:inherit;cursor:pointer}'
  +'#arav-ed .b{min-height:46px;padding:0 16px;border-radius:14px;border:1px solid #3a4230;background:#272d20;color:#e8ecdc;font-size:16px;font-weight:700;flex:1}'
  +'#arav-ed .b.go{background:#ec8a3a;border-color:#ec8a3a;color:#1a1207}'
  +'#arav-ed .opts{display:grid;gap:12px;min-width:0}'
  +'#arav-ed .lbl{font-size:13px;font-weight:700;color:#a6ae96;margin-bottom:6px}'
  +'#arav-ed .chips{display:flex;flex-wrap:wrap;gap:6px}'
  +'#arav-ed .ch{min-height:38px;padding:0 13px;border-radius:999px;border:1px solid #3a4230;background:#262c1f;color:#e8ecdc;font-size:15px}'
  +'#arav-ed .ch[aria-pressed="true"]{background:#ec8a3a;border-color:#ec8a3a;color:#1a1207;font-weight:700}'
  +'#arav-ed .sw{width:36px;height:36px;border-radius:50%;border:2px solid #3a4230;padding:0}'
  +'#arav-ed .sw[aria-pressed="true"]{outline:3px solid #ec8a3a;outline-offset:2px}'
  +'#arav-ed button:focus-visible{outline:3px solid #ec8a3a;outline-offset:2px}</style>';
 function css(){if(document.getElementById('arav-css'))return;var d=document.createElement('div');d.id='arav-css';d.innerHTML=CSS;(document.head||document.body).appendChild(d)}
 function editor(cur,onSave){
  css();var c=dec(cur)||dec(PRE[0]);var old=document.getElementById('arav-ed');if(old)old.remove();
  var o=document.createElement('div');o.id='arav-ed';o.setAttribute('role','dialog');o.setAttribute('aria-label','自己做頭像');
  var h='<div class="box"><div class="pv"><div><h2>自己做頭像</h2><p>點下面的選項換裝備，滿意了按「用這個」。</p></div><div class="stage"><img alt="頭像預覽"></div>'
   +'<div class="bt"><button type="button" class="b" data-k="rand">🎲 隨機</button><button type="button" class="b" data-k="cancel">取消</button></div><button type="button" class="b go" data-k="save">用這個</button></div><div class="opts">';
  OPT.forEach(function(g){h+='<div><div class="lbl">'+g.label+'</div><div class="chips">'+g.items.map(function(it){return '<button type="button" class="ch" data-key="'+g.key+'" data-val="'+it[0]+'">'+it[1]+'</button>'}).join('')+'</div></div>'});
  SW.forEach(function(g){h+='<div><div class="lbl">'+g.label+'</div><div class="chips">'+g.items.map(function(it){return '<button type="button" class="sw" style="background:'+it[0]+'" aria-label="'+it[1]+'" title="'+it[1]+'" data-key="'+g.key+'" data-val="'+it[0]+'"></button>'}).join('')+'</div></div>'});
  o.innerHTML=h+'</div></div>';document.body.appendChild(o);
  var img=o.querySelector('.stage img');
  function sync(){o.querySelectorAll('[data-key]').forEach(function(b){b.setAttribute('aria-pressed',String(c[b.dataset.key]===b.dataset.val))});img.src=url(enc(c))}
  function close(){o.remove();document.removeEventListener('keydown',key,true)}
  function key(e){if(e.key==='Escape'){e.stopPropagation();close()}}
  document.addEventListener('keydown',key,true);
  o.addEventListener('click',function(e){e.stopPropagation();if(e.target===o){close();return}
   var b=e.target.closest('button');if(!b)return;
   if(b.dataset.key){c[b.dataset.key]=b.dataset.val;if(b.dataset.key==='headgear'&&c.headgear!=='helmet')c.nvg='none';if(b.dataset.key==='nvg'&&c.nvg!=='none')c.headgear='helmet';sync();return}
   if(b.dataset.k==='rand'){c=rcfg(Math.random);sync()}
   else if(b.dataset.k==='cancel')close();
   else if(b.dataset.k==='save'){var v=enc(c);close();if(onSave)onSave(v)}
  });
  sync();var f=o.querySelector('[data-k="save"]');if(f)f.focus({preventScroll:true});
 }
 if(document.body)css();else document.addEventListener('DOMContentLoaded',css);
 window.ARAV={ok:ok,url:url,html:html,presets:PRE,editor:editor};
})();
