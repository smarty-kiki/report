/* ==========================================================================
   EQ RESEARCH DECK — 图表引擎 + 导航
   data-viz 属性驱动，纯 SVG，无外部依赖
   ========================================================================== */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const ACC='#B3121D';

function el(t,a){const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);return e;}
function css(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim();}
function nice(max,ticks){
  if(max<=0)return{step:1,top:1};
  const raw=max/ticks, p=Math.pow(10,Math.floor(Math.log10(raw))), n=raw/p;
  let m=1; if(n>5)m=10; else if(n>2.5)m=5; else if(n>2)m=2.5; else if(n>1)m=2;
  const step=m*p; return {step, top:Math.ceil(max/step)*step};
}
function fmt(v){
  const a=Math.abs(v);
  if(a>=1000)return (v/1000).toFixed(a>=10000?0:1).replace(/\.0$/,'')+'k';
  if(a>=100)return v.toFixed(0);
  if(a>=10)return v.toFixed(a%1?1:0);
  if(a>=1)return v.toFixed(a%1?1:0);
  return v.toFixed(2);
}
function txt(x,y,s,o={}){
  const t=el('text',{x,y,'text-anchor':o.anchor||'start','dominant-baseline':o.base||'auto',
    fill:o.fill||'#5B6472','font-size':o.size||12,'font-family':o.mono?'SF Mono,Menlo,monospace':'PingFang SC,Helvetica Neue,sans-serif',
    'font-weight':o.weight||400,'letter-spacing':o.ls||0});
  t.textContent=s; return t;
}
function build(cfg){
  const W=cfg.w||1000,H=cfg.h||400;
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'xMidYMid meet'});
  const acc=cfg.color||ACC, acc2=cfg.color2||'#2E3A48', muted='#C9D0DA';
  const pad={t:cfg.legend?46:18,r:cfg.padR||18,b:cfg.padB||46,l:cfg.padL||64};
  const iw=W-pad.l-pad.r, ih=H-pad.t-pad.b;
  const type=cfg.type||'line';
  const cats=cfg.cats||[];
  let series=cfg.series||[];
  if(cfg.data&&!series.length)series=[{name:'',data:cfg.data}];

  // ---- 值域 ----
  let vals=[];
  series.forEach(s=>vals=vals.concat(s.data.filter(v=>v!==null&&v!==undefined)));
  if(type==='stack'){
    cats.forEach((_,i)=>{let t=0;series.forEach(s=>t+=(s.data[i]||0));vals.push(t);});
  }
  let mn=Math.min(0,...vals), mx=Math.max(...vals);
  if(cfg.min!==undefined)mn=cfg.min;
  if(cfg.max!==undefined)mx=cfg.max;
  const sc=nice(mx-mn,cfg.ticks||4);
  let y0,yTop,step;
  if(cfg.min!==undefined&&cfg.max!==undefined){
    y0=cfg.min;yTop=cfg.max;step=(yTop-y0)/5;
  }else{
    const lo=cfg.min!==undefined?cfg.min:Math.min(0,mn);
    y0=Math.floor(lo/sc.step)*sc.step;
    yTop=Math.ceil(mx/sc.step)*sc.step;
    if(yTop<=y0)yTop=y0+sc.step;
    step=sc.step;
  }
  if(yTop===y0)yTop=y0+1;
  const Y=v=>pad.t+ih-((v-y0)/(yTop-y0||1))*ih;
  const X=i=>pad.l+(cats.length<=1?iw/2:(i/(cats.length-1))*iw);
  const Xb=i=>pad.l+(i+0.5)*(iw/Math.max(cats.length,1));

  // ---- 网格 ----
  const steps=Math.max(2,Math.round((yTop-y0)/step));
  for(let i=0;i<=steps;i++){
    const v=y0+i*step, y=Y(v);
    svg.appendChild(el('line',{x1:pad.l,x2:W-pad.r,y1:y,y2:y,
      stroke:i===0?'#98A1AE':'#EAEDF1','stroke-width':i===0?1:1}));
    svg.appendChild(txt(pad.l-12,y+4,fmt(v),{anchor:'end',size:11,mono:true,fill:'#8C94A1'}));
  }

  const drawLine=(s,si)=>{
    const color=s.color||(si===0?acc:acc2);
    if(cfg.area){
      let d='M'+X(0)+' '+Y(y0);
      s.data.forEach((v,i)=>{if(v!==null)d+=' L'+X(i)+' '+Y(v);});
      d+=' L'+X(s.data.length-1)+' '+Y(y0)+' Z';
      svg.appendChild(el('path',{d,fill:color,opacity:.10,stroke:'none'}));
    }
    let d='',started=false;
    s.data.forEach((v,i)=>{
      if(v===null||v===undefined){started=false;return;}
      d+=(started?' L':' M')+X(i)+' '+Y(v); started=true;
    });
    svg.appendChild(el('path',{d,fill:'none',stroke:color,'stroke-width':s.dash?2:2.6,
      'stroke-dasharray':s.dash?'7 5':'none','stroke-linejoin':'round','stroke-linecap':'round'}));
    s.data.forEach((v,i)=>{
      if(v===null||v===undefined)return;
      svg.appendChild(el('circle',{cx:X(i),cy:Y(v),r:cfg.dots===false?0:3.4,fill:'#fff',stroke:color,'stroke-width':2}));
      if(cfg.labelAll)svg.appendChild(txt(X(i),Y(v)-12,fmt(v),{anchor:'middle',size:11,mono:true,weight:600,fill:color}));
    });
  };

  const drawBar=(s,si)=>{
    const n=series.length, gw=iw/cats.length, bw=Math.min(cfg.bw||(gw*0.58/n),64);
    s.data.forEach((v,i)=>{
      const color=s.color||(si===0?acc:acc2);
      const x=Xb(i)-(n*bw)/2+si*bw+(bw*0.1), h=Math.abs(Y(v)-Y(y0));
      svg.appendChild(el('rect',{x,y:Math.min(Y(v),Y(y0)),width:bw*0.8,height:Math.max(h,1),fill:color,
        opacity:cfg.fade&&si>0?.75:1}));
      if(cfg.labelAll)svg.appendChild(txt(x+bw*0.4,Math.min(Y(v),Y(y0))-8,fmt(v),
        {anchor:'middle',size:11,mono:true,weight:600,fill:color}));
    });
  };

  const drawStack=(s,si)=>{
    const gw=iw/cats.length, bw=Math.min(cfg.bw||gw*0.52,90);
    s.data.forEach((v,i)=>{
      let base=0; for(let k=0;k<si;k++)base+=series[k].data[i]||0;
      const y1=Y(base), y2=Y(base+v);
      svg.appendChild(el('rect',{x:Xb(i)-bw/2,y:y2,width:bw,height:Math.max(y1-y2,0),
        fill:s.color||acc,opacity:s.op||1}));
      if(cfg.segLabel&&v){svg.appendChild(txt(Xb(i),y2+(y1-y2)/2+4,fmt(v),
        {anchor:'middle',size:10.5,mono:true,fill:'#fff',weight:600}));}
    });
  };

  const drawHBar=(s,si)=>{
    const n=series.length, gh=ih/cats.length, bh=Math.min(cfg.bw||(gh*0.6/n),34);
    s.data.forEach((v,i)=>{
      const color=s.color||(si===0?acc:acc2);
      const w=(Math.abs(v)/(yTop-y0))*iw;
      const y=pad.t+i*gh+gh/2-(n*bh)/2+si*bh;
      svg.appendChild(el('rect',{x:pad.l,y:y+bh*0.1,width:Math.max(w,1),height:bh*0.8,fill:color}));
      svg.appendChild(txt(pad.l+w+10,y+bh*0.5+4,cfg.valFmt?cfg.valFmt(v):fmt(v),
        {size:11.5,mono:true,weight:600,fill:'#3C444F'}));
    });
  };

  const drawDonut=(s)=>{
    const cx=W/2, cy=H/2, R=Math.min(iw,ih)/2-6, r=R*0.58;
    const tot=s.data.reduce((a,b)=>a+b,0); let a0=-Math.PI/2;
    const colors=cfg.colors||[acc,'#2E3A48','#8B95A3','#C9D0DA','#5A6472','#E3E7EC'];
    s.data.forEach((v,i)=>{
      const a1=a0+(v/tot)*Math.PI*2;
      const lg=(a1-a0)>Math.PI?1:0;
      const p=(rad,a)=>[cx+rad*Math.cos(a),cy+rad*Math.sin(a)];
      const [x1,y1]=p(R,a0),[x2,y2]=p(R,a1),[x3,y3]=p(r,a1),[x4,y4]=p(r,a0);
      svg.appendChild(el('path',{d:`M${x1} ${y1} A${R} ${R} 0 ${lg} 1 ${x2} ${y2} L${x3} ${y3} A${r} ${r} 0 ${lg} 0 ${x4} ${y4} Z`,
        fill:colors[i%colors.length],stroke:'#fff','stroke-width':2}));
      if(v/tot>0.06){
        const [lx,ly]=p((R+r)/2,a0+(a1-a0)/2);
        svg.appendChild(txt(lx,ly+5,(v/tot*100).toFixed(0)+'%',{anchor:'middle',size:12,mono:true,weight:700,fill:'#fff'}));
      }
      a0=a1;
    });
    if(cfg.center){svg.appendChild(txt(cx,cy-4,cfg.center,{anchor:'middle',size:26,mono:true,weight:700,fill:'#14161A'}));
      svg.appendChild(txt(cx,cy+22,cfg.centerSub||'',{anchor:'middle',size:11,fill:'#8C94A1'}));}
  };

  const drawWaterfall=(s)=>{
    let run=0; const gw=iw/cats.length, bw=Math.min(gw*0.56,86);
    s.data.forEach((v,i)=>{
      const isTotal=cfg.totals&&cfg.totals.includes(i);
      const yA=Y(isTotal?0:run), yB=Y(isTotal?v:run+v);
      const yTopPx=Math.min(yA,yB), h=Math.max(Math.abs(yB-yA),1);
      const color=isTotal?'#2E3A48':(v>=0?acc:'#1C7C54');
      svg.appendChild(el('rect',{x:Xb(i)-bw/2,y:yTopPx,width:bw,height:h,fill:color,opacity:isTotal?1:.9}));
      svg.appendChild(txt(Xb(i),yTopPx-9,(v>=0&&!isTotal?'+':'')+fmt(v),
        {anchor:'middle',size:11,mono:true,weight:600,fill:'#3C444F'}));
      if(!isTotal)run+=v;
    });
    // 连接线
    let r2=0;
    s.data.forEach((v,i)=>{
      if(i<cats.length-1){
        const isTotal=cfg.totals&&cfg.totals.includes(i);
        if(!isTotal)r2+=v;
        svg.appendChild(el('line',{x1:Xb(i)+bw/2,x2:Xb(i+1)-bw/2,y1:Y(isTotal?v:r2),y2:Y(isTotal?v:r2),
          stroke:'#B7BEC9','stroke-width':1,'stroke-dasharray':'3 3'}));
      }
    });
  };

  const drawRange=()=>{
    // 区间条形（估值区间）：series[0].data = [lo, hi], series[1] = 当前值
    const n=cats.length, gh=ih/n, bh=Math.min(gh*0.34,26);
    series.forEach((s,si)=>{
      s.data.forEach((v,i)=>{
        if(!Array.isArray(v))return;
        const x1=pad.l+((v[0]-y0)/(yTop-y0))*iw, x2=pad.l+((v[1]-y0)/(yTop-y0))*iw;
        const y=pad.t+i*gh+gh/2-bh/2+(si*bh*1.06);
        svg.appendChild(el('rect',{x:x1,y:y,width:Math.max(x2-x1,2),height:bh,fill:s.color||acc,opacity:.22}));
        svg.appendChild(el('rect',{x:x1,y:y+3,width:2.5,height:bh-6,fill:s.color||acc}));
        svg.appendChild(el('rect',{x:x2-2.5,y:y+3,width:2.5,height:bh-6,fill:s.color||acc}));
        if(s.mark!==undefined){}
      });
    });
    if(cfg.marks){cfg.marks.forEach(m=>{
      const x=pad.l+((m.v-y0)/(yTop-y0))*iw;
      svg.appendChild(el('line',{x1:x,x2:x,y1:pad.t,y2:pad.t+ih,stroke:m.color||'#14161A','stroke-width':1.6,'stroke-dasharray':'5 4'}));
      svg.appendChild(txt(x,pad.t-6,m.label,{anchor:'middle',size:11,weight:600,fill:m.color||'#14161A'}));
    });}
  };

  // ---- 分发 ----
  if(type==='line')series.forEach(drawLine);
  else if(type==='bar')series.forEach(drawBar);
  else if(type==='stack')series.forEach(drawStack);
  else if(type==='hbar'){series.forEach(drawHBar);}
  else if(type==='donut')drawDonut(series[0]);
  else if(type==='waterfall')drawWaterfall(series[0]);
  else if(type==='range')drawRange();

  // ---- X 轴标签 ----
  if(type!=='donut'){
    const skip=cats.length>9?Math.ceil(cats.length/8):1;
    cats.forEach((c,i)=>{
      if(i%skip)return;
      const x=(type==='hbar')?pad.l-10:(type==='line'?X(i):Xb(i));
      const y=(type==='hbar')?(pad.t+i*(ih/cats.length)+ih/cats.length/2+4):(H-pad.b+24);
      svg.appendChild(txt(x,y,c,{anchor:type==='hbar'?'end':'middle',size:11.5,fill:'#6B7482'}));
    });
  }

  // ---- 图例 ----
  if(cfg.legend&&type!=='donut'){
    let x=pad.l;
    series.forEach((s,i)=>{
      const nm=s.name||'';
      if(!nm)return;
      svg.appendChild(el('rect',{x,y:10,width:16,height:3,fill:s.color||(i===0?acc:acc2)}));
      svg.appendChild(txt(x+22,14,nm,{size:11.5,fill:'#5B6472'}));
      x+=Math.max(nm.length*13+42,90);
    });
  }
  // ---- 标注 ----
  if(cfg.notes)cfg.notes.forEach(n=>{
    svg.appendChild(txt(pad.l+((n.x||0)/100)*iw,(n.y||10)/100*ih+pad.t,n.t,
      {size:n.size||11.5,fill:n.fill||'#8C94A1',weight:n.weight||400,anchor:n.anchor||'start'}));
  });
  return svg;
}

function render(){
  document.querySelectorAll('.viz[data-viz]').forEach(box=>{
    if(box.dataset.done)return;
    let cfg;
    try{cfg=JSON.parse(box.getAttribute('data-viz'));}catch(e){console.warn('viz parse',e);return;}
    if(box.dataset.h)cfg.h=+box.dataset.h;
    if(box.dataset.w)cfg.w=+box.dataset.w;
    else if(box.clientWidth>80)cfg.w=Math.round(box.clientWidth);
    if(!cfg.h)cfg.h=Math.round((cfg.w||1000)*0.34);
    const root=css('--acc'); if(root&&!cfg.color)cfg.color=root;
    const a2=css('--acc2'); if(a2&&!cfg.color2)cfg.color2=a2;
    box.appendChild(build(cfg));
    box.dataset.done='1';
  });
}

// ---- 导航 ----
function nav(){
  const slides=[...document.querySelectorAll('.slide')];
  const rail=document.getElementById('rail');
  const hud=document.getElementById('hud');
  if(rail){
    slides.forEach((s,i)=>{
      const d=document.createElement('div'); d.className='dot';
      d.onclick=()=>s.scrollIntoView({behavior:'smooth',block:'start'});
      rail.appendChild(d);
    });
  }
  let cur=0;
  const io=new IntersectionObserver(es=>{
    es.forEach(e=>{if(e.isIntersecting){cur=slides.indexOf(e.target);
      if(rail)[...rail.querySelectorAll('.dot')].forEach((d,i)=>d.classList.toggle('on',i===cur));
      if(hud)hud.textContent=String(cur+1).padStart(3,'0')+' / '+slides.length;}});
  },{threshold:.45});
  slides.forEach(s=>io.observe(s));
  document.addEventListener('keydown',e=>{
    if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();
      slides[Math.min(cur+1,slides.length-1)].scrollIntoView({behavior:'smooth'});}
    if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();
      slides[Math.max(cur-1,0)].scrollIntoView({behavior:'smooth'});}
    if(e.key==='Home')slides[0].scrollIntoView({behavior:'smooth'});
    if(e.key==='End')slides[slides.length-1].scrollIntoView({behavior:'smooth'});
  });
}

// ---- 缩放适配 ----
function fit(){
  const vw=window.innerWidth-56, vh=window.innerHeight;
  const scale=Math.min(vw/1600, vh/900, 1.2);
  document.querySelectorAll('.slide').forEach(s=>{
    s.style.transform=`scale(${scale})`;
    s.style.marginBottom=(900*scale-900)+'px';
  });
}

document.addEventListener('DOMContentLoaded',()=>{render();nav();fit();
  window.addEventListener('resize',()=>{fit();});});
window.__deckRender=render;
})();
