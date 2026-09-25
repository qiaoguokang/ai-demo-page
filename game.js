'use strict';
const canvas=document.querySelector('#scene'),portrait=document.querySelector('#portrait'),pc=portrait.getContext('2d');let ctx=canvas.getContext('2d');
const $=s=>document.querySelector(s),game=new Journey(),images={};let loaded=false,muted=false,last=0,phase=0,pointer=null,audio=null,ambience=null,score=null,soundClock=0,lastMode='',lastAge=0;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
function load(name,file){return new Promise((resolve,reject)=>{const im=new Image;im.onload=()=>{images[name]=im;resolve()};im.onerror=()=>reject(new Error('无法读取 '+file));im.src='assets/'+file})}
const assets=[load('cloud','cloud-bank.png'),load('map0','map-0.webp'),load('map1','map-1.webp'),load('map2','map-2.webp'),load('forest','forest.webp'),load('middle','forest-middle.webp'),load('ending','forest-ending.webp'),load('original','forest-original.png'),load('branch','branch.png'),load('bark','bark.webp')];for(let i=0;i<8;i++)assets.push(load('boy'+i,'boy-'+i+'.png'));for(let i=0;i<9;i++)assets.push(load('dragon'+i,'dragon-'+i+'.png'));for(let i=0;i<3;i++)assets.push(load('crow'+i,'crow-'+i+'.png'));
Promise.all(assets).then(()=>{loaded=true;$('#start').disabled=false;$('#start').textContent='开始旅程';render(0);}).catch(e=>{$('#start').textContent='素材未加载完成';$('.intro').textContent=e.message+'，请刷新重试';});
function initAudio(){if(audio)return;try{audio=new(window.AudioContext||window.webkitAudioContext)();const buf=audio.createBuffer(1,audio.sampleRate*3,audio.sampleRate),d=buf.getChannelData(0);let n=0;for(let i=0;i<d.length;i++){n=(n+Math.random()*.03-.015)*.995;d[i]=n;}const s=audio.createBufferSource();s.buffer=buf;s.loop=true;const f=audio.createBiquadFilter();f.type='lowpass';f.frequency.value=750;ambience=audio.createGain();ambience.gain.value=0;s.connect(f).connect(ambience).connect(audio.destination);s.start()}catch{}}
function tone(freq=440,duration=.2,volume=.035,type='sine'){if(muted||!audio||game.paused)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.72,audio.currentTime+duration);g.gain.setValueAtTime(volume,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}
function start(){if(!loaded)return;initAudio();audio?.resume();if(audio&&!score)score=new ForestScore(audio);$('#sound').textContent=muted?'音 ♪':'音 ♫';$('#sound').setAttribute('aria-label',muted?'打开声音':'关闭声音');game.start();$('#cover').hidden=true;$('#endCover').hidden=true;last=performance.now()}
$('#start').onclick=start;$('#replay').onclick=()=>{game.reset();lastMode='';lastAge=0;start()};$('#pause').onclick=()=>game.command('pause');$('#resume').onclick=()=>game.command('pause');$('#sound').onclick=()=>{initAudio();audio?.resume();muted=!muted;$('#sound').textContent=muted?'音 ♪':'音 ♫';$('#sound').setAttribute('aria-label',muted?'打开声音':'关闭声音')};$('#companion').onclick=()=>{if(game.command('dragon'))tone(260,.4)};
window.addEventListener('keydown',e=>{if(e.repeat)return;if(['ArrowUp','ArrowDown',' ','f','F','Escape','p','P'].includes(e.key))e.preventDefault();if(game.mode==='ready'&&(e.key===' '||e.key==='Enter'))return start();if(e.key==='ArrowUp'||e.key===' ')game.command('jump');if(e.key==='ArrowDown')game.command('slide');if(e.key.toLowerCase()==='f')game.command('dragon');if(e.key==='Escape'||e.key.toLowerCase()==='p')game.command('pause')});
canvas.addEventListener('pointerdown',e=>{if(pointer)return;canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY,used:false}});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||pointer.used)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,limit=Math.max(15,canvas.getBoundingClientRect().height*.035);if(Math.abs(dy)>limit&&Math.abs(dy)>Math.abs(dx)*1.15){game.command(dy<0?'jump':'slide');pointer.used=true}});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>pointer=null);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game.mode!=='ready'&&game.mode!=='end')game.paused=true;pointer=null});window.addEventListener('blur',()=>{pointer=null;if(game.mode!=='ready'&&game.mode!=='end')game.paused=true});
function sprite(name,x,y,w,flip=false,angle=0,opacity=1){const im=images[name];if(!im)return;const h=w*im.height/im.width;ctx.save();ctx.globalAlpha*=opacity;ctx.translate(x,y);ctx.rotate(angle);ctx.scale(flip?-1:1,1);ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();return h}
function boy(index,x,y,scale=1,flip=false,angle=0){const widths=[66,54,65,78,33,51,98,57];return sprite('boy'+index,x,y,widths[index]*scale,flip,angle)}
function dragon(age,col,x,y,width,flip=false,angle=0){return sprite('dragon'+(age*3+col),x,y,width,flip,angle)}
function feedingDragon(age,bx,gy,t,nuzzle=false){
 const im=images['dragon'+age*3],w=[91,142,220][age],h=w*im.height/im.width;
 const bend=age===0?-.15:age===1?.22:.65;
 const a=bend*clamp((t-1)/1.4),hx=w*.7,hy=h*.64;
 const mouthX=hx+(.28*w)*Math.cos(a)+(.30*h)*Math.sin(a)-w/2;
 const mouthY=-h+hy+(.28*w)*Math.sin(a)-(.30*h)*Math.cos(a);
 const x=bx+24+mouthX+(nuzzle?-12:0);
 deformSprite(im,x,gy,w,{walk:0,distance:0,tuck:0,crouch:0,feed:a,facing:-1});
 if(t>2&&t<4.1){const p=clamp((t-2)/1.4);berry(mix(bx+23,x-mouthX,p),mix(gy-72,gy+mouthY,p)-Math.sin(p*Math.PI)*9,3)}
}
function ground(wx){return terrain(wx)}
function platform(cam,sky){
 const im=images.branch,sw=im.width,step=5,ratio=.75;
 for(let wx=Math.floor((cam-10)/step)*step;wx<cam+1290;wx+=step){
  if(ROUTE.some(e=>(e.type==='jump'||e.type==='flight')&&wx+step/2>=e.x&&wx+step/2<e.x+e.width))continue;
  let p=((wx/ratio)%(sw*2)+sw*2)%(sw*2),reverse=p>=sw,sx=Math.min(sw-9,Math.max(0,reverse?2*sw-p-9:p));
  const top=BRANCH_TOP[Math.round(sx)]||0;ctx.save();ctx.translate(wx-cam,ground(wx)-top*.55);if(reverse){ctx.translate(step+1,0);ctx.scale(-1,1)}ctx.drawImage(im,sx,0,8,im.height,0,0,step+1,im.height*.55);ctx.restore();
 }
 for(const e of ROUTE.filter(e=>e.type==='jump'||e.type==='flight')){for(const wx of [e.x,e.x+e.width]){if(wx<cam-10||wx>cam+1290)continue;ctx.fillStyle='#8ca47b';ctx.beginPath();ctx.ellipse(wx-cam,ground(wx)+37,4,34,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#47634e';ctx.lineWidth=1;ctx.stroke()}}
}
function flock(x,y,t,n=3,scale=1){for(let i=0;i<n;i++){const f=[0,1,2,1][Math.floor(t*7+i)%4],w=(i===1?61:46)*scale;const im=images['crow'+f],h=w*im.height/im.width;ctx.save();ctx.globalAlpha=i%3===0?.85:1;sprite('crow'+f,x+(i-(n-1)/2)*28,y+h*.48+Math.sin(i*2+t*2)*7,w);ctx.restore()}}
function berry(x,y,r=5){ctx.fillStyle='#a94856';ctx.strokeStyle='#513b48';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#416b4d';ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+2,y-r-5);ctx.stroke()}
function backdrop(cam,progress){
 const scale=900/724,total=2171*scale,pan=clamp((cam+365)/11310)*(total-1280);
 // Adjacent crops of one continuous painting. No opacity transitions or overlapping maps.
 ctx.fillStyle='#80c6dc';ctx.fillRect(0,0,1280,720);let offset=0;
 for(let i=0;i<3;i++){const im=images['map'+i],w=im.width*scale;ctx.drawImage(im,offset-pan,-35,w,900);offset+=w;}
 return progress;
}
function render(dt){if(!loaded)return;const progress=clamp(game.x/11020),cam=game.x-365,gy=ground(game.x),mode=game.mode,t=game.local;
 ctx.clearRect(0,0,1280,720);ctx.save();
 const cinema=['depart','empty','self','alone','end'].includes(mode),cinemaT=mode==='depart'?t:17;
 if(cinema){const zoom=1+.10*Math.sin(Math.PI*smooth(0,12,cinemaT));ctx.translate(640,360);ctx.scale(zoom,zoom);ctx.translate(-640,-360);}
 const sky=backdrop(cam,progress);platform(cam,sky);
 for(const e of ROUTE){let xx=e.x-cam;if(xx<-400||xx>1550)continue;
  if(e.type==='crow'&&!game.done.has(e.id)){flock(xx,ground(e.x)-73,phase,3);for(let i=0;i<5;i++){const cx=xx+260+i*150-(phase*42%240);sprite('crow'+[0,1,2,1][Math.floor(phase*6+i)%4],cx,185+Math.sin(i*3)*65,35+i%3*14,false,.05)}}
  if(e.type==='meal')fruitPlant(e,cam);
 }
 let bx=365,by=gy,di=game.age,dw=[91,142,220][di],dx=bx-[85,115,158][di],dy=ground(game.x-[85,115,158][di]);let index=4,drcol=0,flipD=false;
 const walking=mode==='play'||mode==='alone'&&t>1.5;
 if(walking){index=Math.floor(game.x/16)%2;by-=Math.sin(game.x/8)*1.2}
 if(mode==='play'&&game.action==='jump'){index=2;by=gy-game.height();dy=game.dragonPose().y}
 if(mode==='play'&&game.action==='slide'){index=3;dw*=.95;dy+=3}
 if(mode==='retry'){index=3;by+=Math.sin(clamp(t)*Math.PI)*15}
 if(mode==='meal'||mode==='ending'){
  const feedT=mode==='ending'?Math.min(t,6):t;index=feedT>1&&feedT<4.5?5:4;
  feedingDragon(di,bx,gy,feedT,mode==='ending'&&t>6);
  if(mode==='ending'&&t>6){ctx.save();ctx.globalAlpha=.3;const gl=ctx.createRadialGradient(bx+25,gy-85,0,bx+25,gy-85,60);gl.addColorStop(0,'#f9edbb');gl.addColorStop(1,'#f9edbb00');ctx.fillStyle=gl;ctx.fillRect(bx-40,gy-150,150,150);ctx.restore()}
 }
 else if(mode==='flight'){
  const p=clamp(t/game.current.duration);const lift=Math.sin(Math.PI*p)*[105,125,155][di];drcol=1+Math.floor(phase*5)%2;dy=gy-lift-32;dx=bx+8;
  if(di===0){flyingDragon(di,dx,dy,118,phase);index=6;by=dy+10;bx-=7;}
  else{const fw=[118,190,275][di];flyingDragon(di,dx,dy,fw,phase);index=7;by=dy-fw*.23;bx+=fw*.05;}
 }
 else if(mode==='farewell'){dx=bx+140;flyingDragon(2,dx,gy,220,0,.05,0,1);}
 else if(mode==='depart'){
  const p=departurePose(t,gy);if(t<13.5)flyingDragon(2,p.x,p.y,p.w,p.beat,p.spread,p.angle,p.facing);index=4;
 }
 else if(!['empty','self','alone','end'].includes(mode)){walkingDragon(game.dragonPose(),cam);}
 if(mode==='alone'&&t<1.5)boy(4,bx,by,1,true);else boy(index,bx,by,1,false,mode==='retry'?.05:0);
 if(progress>.85){
  // Clouds are spatial occluders. The dragon travels behind their solid lower bank.
  const cloudX=965+(1-progress)*2000;
  if(cinema&&cinemaT<13.5){const q=smooth(2,12,cinemaT);for(let i=0;i<3;i++)flyingDragon(2,850+i*48+(110-i*30)*q,170-i*18+(145+i*14)*q,25+i*4,phase+i,.8,-.1);}
  cloudBank(cloudX-145,245,260,87);cloudBank(cloudX+160,225,320,107);cloudBank(cloudX+20,285,520,174);
 }
 ctx.restore();
 // Foreground motes, subtle enough to keep the route readable.
 for(let i=0;i<28;i++){const x=((i*143.3-phase*(6+i%3*3))%1340+1340)%1340,y=70+(i*97%580)+Math.sin(phase*.6+i)*14;ctx.globalAlpha=.15+.25*(Math.sin(phase+i)*.5+.5);ctx.fillStyle='#fff4b7';ctx.beginPath();ctx.ellipse(x,y,i%4===0?3:1.4,1.4,.6,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
 if(mode==='meal'&&t>4.8&&game.current.stage>game.age){ctx.fillStyle=`rgba(228,244,222,${Math.sin((t-4.8)/1.2*Math.PI)*.7})`;ctx.fillRect(0,0,1280,720)}
 if(mode==='alone'&&t>5){ctx.fillStyle=`rgba(24,54,61,${clamp((t-5)/3)*.85})`;ctx.fillRect(0,0,1280,720)}
 ui();
}
function ui(){const mode=game.mode,e=game.next(),dist=e?e.x-game.x:999,btn=$('#companion');let hint='',caption='',label='与你同行',visible=1,ready=false,portraitBoy=false;
 if(mode==='play'&&dist<310&&dist>0){if(e.type==='jump')hint=e.tutorial?'↑ 向上划，跃过断木':'↑ 前方断木';if(e.type==='crow')hint=e.tutorial?'↓ 向下划，低身通过':'↓ 鸦群来了';if(e.type==='flight'){hint=game.canFly()?'轻触小龙，一起飞过去':'前方是裂谷';}}
 if(mode==='meal')caption=['它似乎很喜欢这里的果子。','不知不觉，它已能与你并肩。','这片森林，快要装不下它的翅膀了。'][game.current.stage];
 if(mode==='retry')hint='没关系，我们再试一次。';
 if(mode==='flight')caption=game.age===2?'再一起，飞过这片森林。':'';
 if(mode==='farewell'){label='去吧';ready=true}
 else if(mode==='depart'){label='';visible=1-clamp((game.local-12.5)/3)}
 else if(mode==='empty'){label='';visible=0}
 else if(mode==='self'){label='继续走吧';portraitBoy=true;visible=clamp(game.local/1.2);ready=true}
 else if(mode==='alone'||mode==='end'){portraitBoy=true;label='';visible=mode==='end'?0:1-clamp((game.local-4)/3)}
 else if(game.cooldown>0){label='歇一会儿 · '+Math.ceil(game.cooldown)+'s'}
 else if(game.canFly()){label='一起飞';ready=true}
 if(mode==='ending')label='';
 if(mode==='ready'){visible=0;caption='';hint=''}
 $('#hint').textContent=hint;$('#caption').textContent=caption;$('#companionLabel').textContent=label;btn.style.opacity=visible;btn.style.pointerEvents=visible>.5?'auto':'none';btn.classList.toggle('ready',ready);btn.setAttribute('aria-label',label||'小黑龙');
 $('#ring').style.background=game.cooldown>0?`conic-gradient(#deebbc ${360*(1-game.cooldown/8)}deg,transparent 0)`:'none';$('#ring').style.mask=game.cooldown>0?'radial-gradient(transparent 65%,#000 67%)':'none';
 pc.clearRect(0,0,100,100);const im=images[portraitBoy?'boy4':'dragon0'];if(im){if(portraitBoy)pc.drawImage(im,0,0,im.width,im.height*.35,13,4,74,85);else pc.drawImage(im,im.width*.48,0,im.width*.52,im.height*.66,7,8,88,83)}
 $('#pauseCover').hidden=!game.paused;$('#endCover').hidden=mode!=='end';$('#pause').style.visibility=mode==='ready'||mode==='end'?'hidden':'visible';
 $('#chapter').firstChild.nodeValue=game.age===0?'第一章 · 相伴':game.age===1?'第二章 · 长大':'第三章 · 向着天空';
 $('.small').textContent=mode==='end'?'谢谢你，陪它走过这片森林。':'林间有龙';
 if(ambience)ambience.gain.setTargetAtTime(!muted&&!game.paused&&mode!=='ready'&&mode!=='end'?.09:0,audio.currentTime,.2);
 if(score)score.update(!muted&&!game.paused&&mode!=='ready'&&mode!=='end',clamp(game.x/11020),['ending','farewell','depart','empty','self','alone'].includes(mode));
 if(mode!==lastMode){if(mode==='meal')tone(610,.3);if(mode==='flight')tone(200,.5,.025,'triangle');if(mode==='depart')tone(175,2,.035,'sine');lastMode=mode}
 if(game.age!==lastAge){tone(520,1);lastAge=game.age}
}
function frame(now){const dt=Math.min(.5,(now-last)/1000||0);last=now;if(!game.paused){phase+=dt;game.tick(dt);soundClock+=dt;if(!muted&&soundClock>.42&&game.mode==='play'){tone(100+Math.random()*30,.06,.008,'triangle');soundClock=0}}render(dt);requestAnimationFrame(frame)}requestAnimationFrame(frame);
window.forestGame={state:()=>game.snapshot(),action:n=>game.command(n)};
if(document.modelContext?.registerTool){for(const spec of [{name:'read_journey_state',description:'Read the current forest journey state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>game.snapshot()},{name:'perform_journey_action',description:'Perform a visible game action: start, jump, slide, dragon, or pause.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['start','jump','slide','dragon','pause']}},required:['action'],additionalProperties:false},execute:input=>{if(!input||!['start','jump','slide','dragon','pause'].includes(input.action))throw Error('Invalid action');if(input.action==='start')start();else game.command(input.action);return game.snapshot()}}]){try{Promise.resolve(document.modelContext.registerTool(spec)).catch(()=>{})}catch{}}}
