/* 自然科共用圖片（SVG）。
   ・「圖片標記」題（type:'label'）的圖一定要用 viewBox 0 0 100 140，spots 的 x 用 0~100、y 用 0~140。
   ・其他題型的 img 可以是任何比例。
   ・有些是函式，可以在題庫裡帶參數產生不同的圖（例如石蕊試紙結果、試管顏色）。 */
(function(){
const BG='#fbf8ef',INK='#33302a',MUTE='#7a7466';
const S=(w,h,b)=>`<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" font-family="-apple-system,'PingFang TC','Noto Sans TC',sans-serif"><rect width="${w}" height="${h}" fill="${BG}"/>${b}</svg>`;
const T=(x,y,s,t,c,w)=>`<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" fill="${c||INK}"${w?' font-weight="700"':''}>${t}</text>`;
const COL={red:'#f2a3ab',blue:'#93b3ea',toRed:'#e8566c',toBlue:'#4f7fd8',pink:'#e5508f',purple:'#8a5bb5',teal:'#2fa8a0',clear:'#d8eef6'};

/* ---------- 水溶液 ---------- */
/* 一組石蕊試紙：redTurn=紅色試紙是否變藍；blueTurn=藍色試紙是否變紅 */
function litmus(name,redTurn,blueTurn){
  const strip=(x,base,tip,lab)=>`<rect x="${x}" y="20" width="22" height="70" rx="3" fill="${base}" stroke="#b9b2a2"/><rect x="${x}" y="62" width="22" height="28" rx="3" fill="${tip}"/><circle cx="${x+11}" cy="70" r="5" fill="#ffffff" opacity=".45"/>${T(x+11,104,9,lab)}`;
  return S(150,112,`${T(75,13,11,name,INK,1)}${strip(28,COL.red,redTurn?COL.toBlue:COL.red,'紅色試紙')}${strip(100,COL.blue,blueTurn?COL.toRed:COL.blue,'藍色試紙')}`);
}
/* 一排試管：list=[[標籤,顏色],...] */
function tubes(list,title){
  const w=list.length*52+20;
  const t=list.map(([lab,c],i)=>{const x=20+i*52;return `<path d="M${x} 22 v62 a13 13 0 0 0 26 0 v-62" fill="#ffffff" stroke="#8d8676" stroke-width="1.6"/><path d="M${x+1} 56 v28 a12 12 0 0 0 24 0 v-28 z" fill="${c}"/><rect x="${x-3}" y="18" width="32" height="5" rx="2" fill="#cfc8b8"/>${T(x+13,118,11,lab,INK,1)}`}).join('');
  return S(w,title?138:126,t+(title?T(w/2,134,9,title,MUTE):''));
}
/* 燒杯 */
const beaker=(x,y,w,h,c,lab)=>`<path d="M${x} ${y} v${h} a6 6 0 0 0 6 6 h${w-12} a6 6 0 0 0 6 -6 v-${h}" fill="#ffffff" stroke="#8d8676" stroke-width="1.5"/><path d="M${x+1} ${y+h*.35} v${h*.65} a5 5 0 0 0 5 5 h${w-12} a5 5 0 0 0 5 -5 v-${h*.65} z" fill="${c}"/>${lab?T(x+w/2,y+h+18,10,lab):''}`;
/* LED 電路 */
function led(lit,name){
  const glow=lit?`<circle cx="100" cy="22" r="16" fill="#ffe36b" opacity=".55"/>`:'';
  return S(200,140,`${glow}<path d="M93 30 a7 7 0 0 1 14 0 v10 h-14 z" fill="${lit?'#ffd23a':'#e7e2d6'}" stroke="#8d8676"/><line x1="96" y1="40" x2="96" y2="48" stroke="#555"/><line x1="104" y1="40" x2="104" y2="48" stroke="#555"/>
  <rect x="20" y="40" width="40" height="18" rx="3" fill="#3b3b3b"/><rect x="60" y="45" width="4" height="8" fill="#3b3b3b"/>${T(40,53,9,'電池','#fff')}
  <polyline points="64,49 96,49" fill="none" stroke="#c0392b" stroke-width="2"/><polyline points="20,49 10,49 10,80 84,80 84,118" fill="none" stroke="#2c3e50" stroke-width="2"/><polyline points="104,48 116,48 116,118" fill="none" stroke="#c0392b" stroke-width="2"/>
  ${beaker(70,86,62,40,COL.clear)}${T(165,70,11,name,INK,1)}${T(165,88,10,lit?'LED 亮了':'LED 不亮',lit?'#b07d00':MUTE)}`);
}
/* pH 色帶 */
function ph(v,name){
  const cs=['#d7263d','#e5532b','#ef7d2a','#f2a22b','#e9c43b','#c9cf3f','#9ccf54','#63bd5b','#3fae86','#3a9bb5','#3f7fc9','#4b63c4','#5a4db8','#5d3aa4','#572c8c'];
  const seg=cs.map((c,i)=>`<rect x="${10+i*12}" y="40" width="12" height="18" fill="${c}"/>${T(16+i*12,72,8,i)}`).join('');
  const mx=10+v*12;
  return S(200,96,`${T(100,16,11,name||'pH 值',INK,1)}${seg}<path d="M${mx} 38 l-5 -9 h10 z" fill="${INK}"/>${T(mx,26,10,'pH '+v,INK,1)}${T(28,90,9,'← 酸性',COL.toRed)}${T(100,90,9,'7 中性',MUTE)}${T(172,90,9,'鹼性 →',COL.toBlue)}`);
}

/* ---------- 力與運動 ---------- */
/* 斜坡滑落：hs=[高度…]，ds=[長尾夾移動距離…] */
function ramps(hs,ds){
  const r=hs.map((h,i)=>{const x=20+i*150,y=110;const top=y-h*4;const clip=x+80+ds[i]*4;return `<polygon points="${x},${y} ${x},${top} ${x+70},${y}" fill="#e9d9b7" stroke="#8d8676"/><circle cx="${x+6}" cy="${top-5}" r="5" fill="#e1a33a"/><rect x="${clip}" y="${y-10}" width="8" height="10" fill="#555"/>${T(x-2,top-12,10,h+' 公分')}${T(x+70,y+18,10,'甲乙丙'[i]+'：長尾夾移動 '+ds[i]+' 公分')}`}).join('');
  return S(150*hs.length+20,140,`<line x1="0" y1="110" x2="${150*hs.length+20}" y2="110" stroke="#8d8676"/>${r}`);
}
/* 模擬拔河：左右彈簧秤讀數 */
function tug(l,r){
  const scale=(x,flip,v)=>`<rect x="${x}" y="40" width="54" height="18" rx="9" fill="#f3efe4" stroke="#8d8676"/>${T(x+27,53,10,v+' 公克重',INK,1)}`;
  return S(240,100,`<line x1="12" y1="49" x2="228" y2="49" stroke="#8d8676" stroke-width="1.5"/>${scale(20,0,l)}${scale(166,1,r)}<rect x="113" y="44" width="14" height="10" rx="4" fill="none" stroke="#2c79c9" stroke-width="3"/>${T(120,30,10,'迴紋針（手放開前）')}${T(47,80,10,'左側彈簧秤')}${T(193,80,10,'右側彈簧秤')}`);
}
/* 硬幣在不同材質上滑行 */
function coins(a,b){
  const lane=(y,lab,fill,d)=>`<rect x="40" y="${y}" width="190" height="26" fill="${fill}" stroke="#8d8676"/><circle cx="${48+d*1.6}" cy="${y+13}" r="8" fill="#d9a441" stroke="#9c7420"/>${T(20,y+17,10,lab,INK,1)}${T(48+d*1.6,y+42,9,d+' 公分')}`;
  return S(250,128,`${lane(16,'甲',a[1],a[0])}${lane(72,'乙',b[1],b[0])}<line x1="40" y1="6" x2="40" y2="120" stroke="#c0392b"/>`);
}
/* 彈簧伸長折線圖：pts=[[總重量,伸長長度]…] */
function springGraph(pts,unitW){
  const X=g=>30+g*1.6,Y=c=>120-c*9;
  const grid=[0,20,40,60,80,100].map(g=>`<line x1="${X(g)}" y1="120" x2="${X(g)}" y2="20" stroke="#e5dfcf"/>${T(X(g),132,8,g)}`).join('')+[0,2,4,6,8,10].map(c=>`<line x1="30" y1="${Y(c)}" x2="${X(100)}" y2="${Y(c)}" stroke="#e5dfcf"/>${T(22,Y(c)+3,8,c)}`).join('');
  const line=`<polyline points="${pts.map(p=>X(p[0])+','+Y(p[1])).join(' ')}" fill="none" stroke="#2c79c9" stroke-width="2"/>`+pts.map(p=>`<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3" fill="#2c79c9"/>`).join('');
  return S(220,150,`${grid}${line}${T(120,146,8,'砝碼總重量（公克重）')}<text x="8" y="70" font-size="8" fill="${INK}" transform="rotate(-90 8 70)" text-anchor="middle">伸長長度（公分）</text>`);
}

/* ---------- 天空 ---------- */
/* 竿影：影子朝向 dir（'東','西','南','北','東北','東南','西北','西南'），畫成俯視圖 */
function shadow(dir,len){
  const A={北:-90,東北:-45,東:0,東南:45,南:90,西南:135,西:180,西北:-135}[dir];const L=len||40;
  const ex=100+L*Math.cos(A*Math.PI/180),ey=70+L*Math.sin(A*Math.PI/180);
  return S(200,140,`<circle cx="100" cy="70" r="58" fill="#eef4e6" stroke="#b8c7a8"/>${T(100,8+0,10,'北',INK,1)}${T(100,138,10,'南',INK,1)}${T(190,74,10,'東',INK,1)}${T(10,74,10,'西',INK,1)}<line x1="100" y1="70" x2="${ex.toFixed(1)}" y2="${ey.toFixed(1)}" stroke="#4a4a4a" stroke-width="6" stroke-linecap="round" opacity=".75"/><circle cx="100" cy="70" r="4" fill="#b5651d"/>${T(100,92,8,'竿子',MUTE)}`);
}
/* 日出位置：三個太陽在東方地平線 */
const sunrise=S(220,120,`<rect x="0" y="80" width="220" height="40" fill="#cfe3c0"/><line x1="0" y1="80" x2="220" y2="80" stroke="#7d9a6a"/>${[[40,'甲'],[110,'乙'],[180,'丙']].map(([x,l])=>`<circle cx="${x}" cy="72" r="11" fill="#f5b234"/>${T(x,58,11,l,INK,1)}`).join('')}${T(20,100,10,'北',INK,1)}${T(110,100,10,'東',INK,1)}${T(200,100,10,'南',INK,1)}${T(110,114,8,'（面向東方看日出）',MUTE)}`);
/* 星等 */
function stars(list){
  const w=list.length*70+10;
  return S(w,110,`<rect width="${w}" height="110" fill="#1d2440"/>${list.map(([n,m],i)=>{const x=40+i*70;const r=Math.max(2,9-m*2.2);return `<circle cx="${x}" cy="45" r="${r}" fill="#fff6c8"/>${T(x,82,10,n,'#e8e6f5',1)}${T(x,98,9,m+' 等','#b7b5d6')}`}).join('')}`);
}

/* ---------- 燃燒與生鏽 ---------- */
const candle=(x,y)=>`<rect x="${x-6}" y="${y}" width="12" height="34" fill="#f6f1e2" stroke="#b9b2a2"/><line x1="${x}" y1="${y}" x2="${x}" y2="${y-4}" stroke="#333"/>`;
const flame=(x,y,s)=>`<path d="M${x} ${y-14*s} q${7*s} ${9*s} 0 ${14*s} q${-7*s} ${-5*s} 0 ${-14*s}" fill="#ffb02e"/><path d="M${x} ${y-8*s} q${3*s} ${5*s} 0 ${8*s} q${-3*s} ${-3*s} 0 ${-8*s}" fill="#fff0a8"/>`;
const jar=(x,y,w,h)=>`<path d="M${x} ${y+h} v-${h-10} q0 -10 10 -10 h${w-20} q10 0 10 10 v${h-10}" fill="#dfeff7" fill-opacity=".45" stroke="#7aa6bf" stroke-width="2"/>`;
/* 鋼絲絨球生鏽程度：lv 0~3 */
function wool(list){
  const w=list.length*80+10;
  return S(w,120,list.map(([lab,lv,cap],i)=>{const x=45+i*80;const rust=['#9aa0a6','#a8846a','#9b5a32','#7a3a17'][lv];let dots='';for(let k=0;k<lv*7;k++){const a=k*2.4,r=6+((k*7)%13);dots+=`<circle cx="${(x+r*Math.cos(a)).toFixed(1)}" cy="${(58+r*.8*Math.sin(a)).toFixed(1)}" r="2.6" fill="#8a3b12"/>`}
    return `<path d="M${x-28} 30 h56 l-6 56 h-44 z" fill="#ffffff" stroke="#8d8676"/><ellipse cx="${x}" cy="60" rx="20" ry="16" fill="${rust}"/>${[0,1,2,3,4].map(k=>`<path d="M${x-16+k*7} 50 q4 10 0 20" stroke="#6f7378" fill="none" opacity=".6"/>`).join('')}${dots}${T(x,104,11,lab,INK,1)}${cap?T(x,117,9,cap,MUTE):''}`}).join(''));
}

/* ---------- 圖片標記用（viewBox 0 0 100 140） ---------- */
const L=b=>S(100,140,b);
const F={
  litmus,tubes,led,ph,ramps,tug,coins,springGraph,shadow,stars,wool,
  sunrise,
  /* 溶解前後秤重 */
  scale:S(240,130,`${[[10,'溶解前'],[130,'溶解後']].map(([x,l],i)=>`<rect x="${x}" y="88" width="100" height="26" rx="4" fill="#5b6b7a"/><rect x="${x+28}" y="94" width="44" height="14" rx="2" fill="#d9f2d0"/>${T(x+50,105,10,i?'？':'214 g','#1d4d1d',1)}${beaker(x+30,40,40,40,COL.clear)}${i?'':`<path d="M${x+76} 74 l14 0 l-3 10 h-8 z" fill="#ffffff" stroke="#8d8676"/><circle cx="${x+83}" cy="72" r="4" fill="#f4f4f4" stroke="#bbb"/>`}${T(x+50,24,11,l,INK,1)}`).join('')}`),
  /* 三種蒸發方式 */
  evap:S(240,110,`<rect x="14" y="66" width="60" height="6" fill="#e6f4f9" stroke="#8d8676"/><ellipse cx="44" cy="64" rx="5" ry="2.5" fill="#9fd3e6"/>${T(44,92,11,'甲 玻璃片一滴',INK,1)}<path d="M92 58 h56 l-6 14 h-44 z" fill="#ffffff" stroke="#8d8676"/><rect x="96" y="63" width="48" height="6" fill="#9fd3e6"/>${T(120,92,11,'乙 淺盤',INK,1)}${beaker(178,24,44,48,'#9fd3e6')}${T(200,92,11,'丙 深杯',INK,1)}<circle cx="120" cy="22" r="10" fill="#f5b234"/>${T(120,106,8,'（三杯放在同一個地方，水量相同）',MUTE)}`),
  /* 標記：寶特瓶受力 */
  bottle:L(`<rect x="10" y="8" width="80" height="6" fill="#8d8676"/><path d="M50 14 q4 10 0 20 q-4 10 0 16" stroke="#c0392b" stroke-width="2" fill="none"/><path d="M42 50 h16 v8 q10 6 10 18 v40 q0 6 -6 6 h-24 q-6 0 -6 -6 v-40 q0 -12 10 -18 z" fill="#d6ecf5" stroke="#5b8aa6" stroke-width="1.5"/><line x1="70" y1="70" x2="70" y2="40" stroke="#2a9550" stroke-width="3"/><path d="M70 34 l-5 9 h10 z" fill="#2a9550"/><line x1="70" y1="92" x2="70" y2="126" stroke="#d2443f" stroke-width="3"/><path d="M70 132 l-5 -9 h10 z" fill="#d2443f"/>`),
  /* 標記：彈簧秤 */
  springScale:L(`<circle cx="50" cy="12" r="6" fill="none" stroke="#5b6b7a" stroke-width="3"/><rect x="34" y="20" width="32" height="88" rx="5" fill="#f2efe6" stroke="#5b6b7a" stroke-width="1.6"/>${[0,1,2,3,4,5,6,7,8].map(k=>`<line x1="36" y1="${30+k*9}" x2="${k%2?40:43}" y2="${30+k*9}" stroke="#5b6b7a"/>`).join('')}<path d="M50 24 ${[0,1,2,3,4,5,6,7].map(k=>`l${k%2?-7:7} 5`).join(' ')} l0 8" fill="none" stroke="#2c79c9" stroke-width="1.6"/><line x1="43" y1="72" x2="56" y2="72" stroke="#d2443f" stroke-width="2"/><line x1="50" y1="72" x2="50" y2="112" stroke="#5b6b7a" stroke-width="2"/><path d="M50 112 v8 a6 6 0 1 1 -6 6" fill="none" stroke="#5b6b7a" stroke-width="2.5"/>`),
  /* 標記：竿影與太陽高度角 */
  sunAngle:L(`<rect x="0" y="110" width="100" height="30" fill="#d9e8c8"/><line x1="0" y1="110" x2="100" y2="110" stroke="#7d9a6a"/><circle cx="90" cy="40" r="8" fill="#f5b234"/><line x1="20" y1="110" x2="90" y2="40" stroke="#e1a33a" stroke-dasharray="3 2"/><line x1="70" y1="110" x2="70" y2="60" stroke="#8a5a2b" stroke-width="3"/><line x1="20" y1="110" x2="70" y2="110" stroke="#444" stroke-width="5" opacity=".7"/><path d="M34 110 a14 14 0 0 0 -4 -10" fill="none" stroke="#d2443f" stroke-width="2"/>`),
  /* 標記：四季代表日太陽軌跡（面向南方） */
  sunPath:L(`<rect x="0" y="110" width="100" height="30" fill="#d9e8c8"/><line x1="0" y1="110" x2="100" y2="110" stroke="#7d9a6a"/><path d="M4 110 Q50 -30 96 110" fill="none" stroke="#e5532b" stroke-width="2"/><path d="M12 110 Q50 10 88 110" fill="none" stroke="#e1a33a" stroke-width="2"/><path d="M22 110 Q50 50 78 110" fill="none" stroke="#3f7fc9" stroke-width="2"/>${T(8,124,8,'東',INK,1)}${T(50,124,8,'南',INK,1)}${T(92,124,8,'西',INK,1)}${T(50,136,6,'（面向南方，看太陽一天的路線）',MUTE)}`),
  /* 標記：太陽系（由上往下離太陽愈來愈遠） */
  solar:L(`<circle cx="38" cy="-6" r="20" fill="#f5b234"/>${[[16,1.6,'#9a9a9a'],[26,2.6,'#e3c27a'],[37,2.8,'#3f8fd2'],[48,2.1,'#d8643a'],[64,7,'#d9b38c'],[86,6,'#e6cf95'],[106,4,'#7fd3d6'],[126,3.9,'#3f66d8']].map(([y,r,c],i)=>`<circle cx="38" cy="${y}" r="${r}" fill="${c}"/>${i===4?`<line x1="31" y1="${y-3}" x2="45" y2="${y-3}" stroke="#a9825d"/><line x1="31" y1="${y+2}" x2="45" y2="${y+2}" stroke="#a9825d"/>`:''}${i===5?`<ellipse cx="38" cy="${y}" rx="12" ry="3" fill="none" stroke="#b89c5e" stroke-width="1.5"/>`:''}<line x1="${42+r}" y1="${y}" x2="56" y2="${y}" stroke="#bbb" stroke-dasharray="1 1.5"/>`).join('')}`),
  /* 標記：北斗七星、仙后座找北極星 */
  polaris:L(`<rect width="100" height="140" fill="#1d2440"/>${[[12,118],[24,112],[34,108],[44,104],[52,96],[66,98],[62,110]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.2" fill="#fff6c8"/>`).join('')}<polyline points="12,118 24,112 34,108 44,104 52,96 66,98 62,110 44,104" fill="none" stroke="#8e95c4" stroke-width=".6"/><line x1="62" y1="110" x2="66" y2="98" stroke="#ffd56b" stroke-dasharray="2 2"/><line x1="66" y1="98" x2="52" y2="62" stroke="#ffd56b" stroke-dasharray="2 2"/><circle cx="52" cy="60" r="2.8" fill="#ffffff"/>${[[60,18],[68,26],[76,20],[84,28],[92,22]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.2" fill="#fff6c8"/>`).join('')}<polyline points="60,18 68,26 76,20 84,28 92,22" fill="none" stroke="#8e95c4" stroke-width=".6"/>`),
  /* 標記：空氣組成圓餅圖 */
  air:L(`<path d="M50 60 L50 22 A38 38 0 1 1 12.67 52.88 Z" fill="#9ec5e8" stroke="#fff"/><path d="M50 60 L12.67 52.88 A38 38 0 0 1 47.61 22.07 Z" fill="#f2a3ab" stroke="#fff"/><path d="M50 60 L47.61 22.07 A38 38 0 0 1 50 22 Z" fill="#c9c2b0"/>${T(50,118,8,'空氣的組成',INK,1)}`),
  /* 標記：燃燒三要素（圖示） */
  fire:L(`<polygon points="50,22 12,100 88,100" fill="#fff4dc" stroke="#e1a33a" stroke-width="2"/>${flame(50,72,1.6)}<rect x="40" y="6" width="20" height="5" rx="2" fill="#8a5a2b"/><rect x="42" y="12" width="16" height="5" rx="2" fill="#a26b35"/><path d="M4 108 q6 -4 12 0 t12 0 M4 114 q6 -4 12 0 t12 0" stroke="#5aa0d8" stroke-width="1.8" fill="none"/><rect x="80" y="100" width="5" height="22" rx="2.5" fill="#fff" stroke="#d2443f"/><rect x="81" y="108" width="3" height="13" fill="#d2443f"/><circle cx="82.5" cy="123" r="3.5" fill="#d2443f"/>`),
  /* 標記：製造與檢驗氧氣 */
  oxygen:L(`${jar(22,48,56,72)}<rect x="24" y="92" width="52" height="28" fill="#cfe9f5"/>${[[34,96],[46,100],[58,95],[64,103],[40,104]].map(([x,y])=>`<path d="M${x} ${y} q3 -6 6 0 z" fill="#f3e3b0" stroke="#c9b27a" stroke-width=".6"/>`).join('')}${[[36,86],[52,82],[60,88],[44,78]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.6" fill="none" stroke="#7aa6bf"/>`).join('')}<rect x="18" y="34" width="44" height="3" fill="#bfe0ee" stroke="#7aa6bf"/><line x1="86" y1="8" x2="66" y2="56" stroke="#8a5a2b" stroke-width="2"/><circle cx="66" cy="57" r="2.2" fill="#ff7a2e"/>`),
};
/* 蠟燭：一支蓋住、一支沒有 */
F.candleJar=S(220,130,`<rect x="0" y="112" width="220" height="18" fill="#e9d9b7"/>${candle(60,78)}${flame(60,74,.8)}${jar(30,44,60,68)}${T(60,128,10,'甲：用廣口瓶蓋住',INK,1)}${candle(160,78)}${flame(160,74,1)}${T(160,128,10,'乙：沒有蓋住',INK,1)}`);
/* 生鏽鋼絲絨球 vs 空瓶，伸入蠟燭 */
F.woolJar=S(220,130,`<rect x="0" y="112" width="220" height="18" fill="#e9d9b7"/>${jar(28,40,64,72)}<ellipse cx="60" cy="104" rx="16" ry="8" fill="#9b5a32"/>${candle(60,58)}${flame(60,54,.8)}${T(60,128,10,'甲：放生鏽的鋼絲絨球',INK,1)}${jar(128,40,64,72)}${candle(160,58)}${flame(160,54,.8)}${T(160,128,10,'乙：空的廣口瓶',INK,1)}`);
/* ---- 以下為「圖片標記」用（100×140） ---- */
const cupS=(x,y,lv)=>{const rust=['#9aa0a6','#a8846a','#9b5a32','#7a3a17'][lv];let d='';for(let k=0;k<lv*5;k++){const a=k*2.4,r=3+((k*7)%8);d+=`<circle cx="${(x+r*Math.cos(a)).toFixed(1)}" cy="${(y+r*.7*Math.sin(a)).toFixed(1)}" r="1.6" fill="#8a3b12"/>`}return `<path d="M${x-14} ${y-18} h28 l-3 32 h-22 z" fill="#ffffff" stroke="#8d8676"/><ellipse cx="${x}" cy="${y}" rx="10" ry="8" fill="${rust}"/>${d}`};
Object.assign(F,{
  /* 溶質、溶劑、水溶液 */
  soluteL:L(`<ellipse cx="26" cy="24" rx="14" ry="6" fill="#e8e3d6" stroke="#8d8676"/><line x1="40" y1="22" x2="50" y2="16" stroke="#8d8676" stroke-width="2"/>${[[20,21],[25,19],[30,21],[27,23],[22,24]].map(([x,y])=>`<rect x="${x}" y="${y}" width="3" height="3" fill="#ffffff" stroke="#bbb" stroke-width=".4"/>`).join('')}${T(26,10,8,'食鹽')}${beaker(58,16,30,26,COL.clear)}${T(73,10,8,'水')}<path d="M28 36 L42 66" stroke="#8d8676" stroke-width="1.2"/><path d="M72 50 L58 66" stroke="#8d8676" stroke-width="1.2"/><path d="M42 66 l-5 -2 l3 -4 z M58 66 l-4 -3 l5 -2 z" fill="#8d8676"/>${beaker(32,74,36,40,'#cfe3ee')}${T(50,132,8,'食鹽水')}`),
  /* 蒸發快慢 */
  evapL:L(`<circle cx="86" cy="12" r="7" fill="#f5b234"/><rect x="20" y="24" width="50" height="5" fill="#e6f4f9" stroke="#8d8676"/><ellipse cx="45" cy="22.5" rx="4" ry="2" fill="#9fd3e6"/>${T(45,40,7,'玻璃片上一滴')}<path d="M18 62 h54 l-6 12 h-42 z" fill="#ffffff" stroke="#8d8676"/><rect x="22" y="66" width="46" height="5" fill="#9fd3e6"/>${T(45,86,7,'淺盤')}${beaker(30,96,30,26,'#9fd3e6')}${T(45,136,7,'深杯')}`),
  /* 石蕊試紙結果（由上而下：鹼、酸、中） */
  litmusL:L(`${T(27,9,7,'紅色')}${T(55,9,7,'藍色')}${[[14,COL.toBlue,COL.blue],[58,COL.red,COL.toRed],[102,COL.red,COL.blue]].map(([y,r,b])=>`<rect x="20" y="${y}" width="14" height="32" rx="2" fill="${COL.red}" stroke="#b9b2a2"/><rect x="20" y="${y+18}" width="14" height="14" rx="2" fill="${r}"/><rect x="48" y="${y}" width="14" height="32" rx="2" fill="${COL.blue}" stroke="#b9b2a2"/><rect x="48" y="${y+18}" width="14" height="14" rx="2" fill="${b}"/>`).join('')}`),
  /* 紫色高麗菜汁（鹼、酸、中） */
  cabbageL:L(`${T(50,10,7,'滴入紫色高麗菜汁後')}${[[14,COL.teal],[42,COL.pink],[70,COL.purple]].map(([x,c])=>`<path d="M${x} 20 v66 a8 8 0 0 0 16 0 v-66" fill="#ffffff" stroke="#8d8676" stroke-width="1.2"/><path d="M${x+1} 50 v36 a7 7 0 0 0 14 0 v-36 z" fill="${c}"/>`).join('')}`),
  /* LED 電路 */
  circuitL:L(`<rect x="12" y="14" width="34" height="16" rx="3" fill="#3b3b3b"/><rect x="46" y="18" width="3" height="8" fill="#3b3b3b"/><path d="M74 16 a6 6 0 0 1 12 0 v8 h-12 z" fill="#ffd23a" stroke="#8d8676"/><circle cx="80" cy="16" r="11" fill="#ffe36b" opacity=".45"/><polyline points="49,22 76,22 76,24" fill="none" stroke="#c0392b" stroke-width="1.6"/><polyline points="12,22 6,22 6,70 40,70 40,104" fill="none" stroke="#2c3e50" stroke-width="1.6"/><polyline points="84,24 84,40 60,40 60,104" fill="none" stroke="#c0392b" stroke-width="1.6"/>${beaker(24,82,52,40,COL.clear)}`),
  /* 位能、動能 */
  energyL:L(`<polygon points="4,36 4,120 96,120" fill="#e9d9b7" stroke="#8d8676"/><circle cx="10" cy="30" r="6" fill="#e1a33a"/><circle cx="88" cy="112" r="6" fill="#e1a33a"/><line x1="70" y1="112" x2="80" y2="112" stroke="#e1a33a" stroke-width="1.5"/><line x1="66" y1="108" x2="78" y2="108" stroke="#e1a33a" stroke-width="1"/><line x1="0" y1="120" x2="100" y2="120" stroke="#8d8676"/>`),
  /* 四種力 */
  forceL:L(`<line x1="50" y1="4" x2="50" y2="136" stroke="#e5dfcf"/><line x1="2" y1="70" x2="98" y2="70" stroke="#e5dfcf"/><path d="M12 14 v18 a13 13 0 0 0 26 0 v-18 h-8 v18 a5 5 0 0 1 -10 0 v-18 z" fill="#d2443f"/><rect x="12" y="14" width="8" height="6" fill="#9aa0a6"/><rect x="30" y="14" width="8" height="6" fill="#9aa0a6"/><rect x="18" y="52" width="14" height="6" rx="3" fill="none" stroke="#2c79c9" stroke-width="1.6"/><line x1="25" y1="50" x2="25" y2="47" stroke="#2c79c9" stroke-dasharray="1 1"/><line x1="56" y1="12" x2="96" y2="12" stroke="#8a5a2b" stroke-width="2"/><line x1="76" y1="12" x2="76" y2="20" stroke="#2a9550"/><circle cx="76" cy="26" r="6" fill="#d2443f"/><line x1="76" y1="36" x2="76" y2="56" stroke="#33302a" stroke-width="1.5"/><path d="M76 60 l-3 -6 h6 z" fill="#33302a"/><line x1="28" y1="96" x2="28" y2="130" stroke="#8d8676" stroke-width="2"/>${[0,90,180,270].map(a=>`<polygon points="28,96 ${28+16*Math.cos((a+15)*Math.PI/180)},${96+16*Math.sin((a+15)*Math.PI/180)} ${28+16*Math.cos((a-15)*Math.PI/180)},${96+16*Math.sin((a-15)*Math.PI/180)}" fill="#9ec5e8" stroke="#5b8aa6" stroke-width=".6"/>`).join('')}<path d="M4 84 q4 -3 8 0 M4 90 q4 -3 8 0" stroke="#5aa0d8" fill="none"/><rect x="74" y="98" width="20" height="20" fill="#d9b38c" stroke="#8a5a2b"/><circle cx="60" cy="108" r="5" fill="#f1c9a5" stroke="#b98a62"/><line x1="65" y1="108" x2="73" y2="108" stroke="#33302a" stroke-width="1.5"/><path d="M74 108 l-5 -3 v6 z" fill="#33302a"/>`),
  /* 摩擦力：砂紙（上）、卡紙（下） */
  frictionL:L(`${T(50,12,7,'用相同力量推出硬幣')}<line x1="10" y1="20" x2="10" y2="120" stroke="#c0392b"/><rect x="10" y="30" width="72" height="22" fill="#c9b48a"/>${Array.from({length:40},(_,k)=>`<circle cx="${12+(k*13)%70}" cy="${32+(k*7)%18}" r=".8" fill="#8a7650"/>`).join('')}<circle cx="24" cy="41" r="6" fill="#d9a441" stroke="#9c7420"/><rect x="10" y="88" width="72" height="22" fill="#f4eedd" stroke="#d9d0bb"/><circle cx="72" cy="99" r="6" fill="#d9a441" stroke="#9c7420"/>`),
  /* 日出位置（面向東方） */
  sunriseL:L(`<rect x="0" y="90" width="100" height="50" fill="#cfe3c0"/><line x1="0" y1="90" x2="100" y2="90" stroke="#7d9a6a"/>${[16,50,84].map(x=>`<path d="M${x-9} 90 a9 9 0 0 1 18 0 z" fill="#f5b234"/>`).join('')}${T(10,132,8,'北',INK,1)}${T(50,132,8,'東',INK,1)}${T(90,132,8,'南',INK,1)}${T(50,20,7,'面向東方看日出')}`),
  /* 生鏽程度 */
  rustL:L(`${T(50,14,7,'蓋緊杯口一天後')}${cupS(18,60,1)}${cupS(50,60,0)}${cupS(82,60,3)}`),
});
window.SC_FIGS=F;
})();
