(function(root){
'use strict';
const ROUTE=[
 {id:'meal1',x:390,type:'meal',stage:0},
 {id:'jump1',x:1300,type:'jump',width:74,tutorial:true},
 {id:'crow1',x:2150,type:'crow',tutorial:true},
 {id:'flight1',x:2920,type:'flight',width:310,duration:4,tutorial:true},
 {id:'meal2',x:3700,type:'meal',stage:1},
 {id:'jump2',x:4580,type:'jump',width:80},
 {id:'crow2',x:5450,type:'crow'},
 {id:'flight2',x:6360,type:'flight',width:410,duration:5},
 {id:'meal3',x:7360,type:'meal',stage:2},
 {id:'crow3',x:8690,type:'crow'},
 {id:'flight3',x:9920,type:'flight',width:610,duration:7},
 {id:'farewell',x:11020,type:'ending'}
];
function terrain(x){return 504+Math.sin(x*.0021)*48+Math.sin(x*.00063+.8)*27+Math.sin(x*.005)*9}
class Journey{
 constructor(){this.reset()}
 reset(){this.x=0;this.time=0;this.age=0;this.mode='ready';this.local=0;this.action='walk';this.actionTime=0;this.cooldown=0;this.done=new Set;this.current=null;this.paused=false;this.failures=0;this.buffer=null;this.notices=[];this.looked=false;this.lastSound='';this.dragonX=-85;this.dragonDistance=0;this.dragonMotion=null;this.dragonArmed=null;this.dragonLand=0;this.dragonVelocity=0;this.accumulator=0;}
 start(){if(this.mode==='ready')this.mode='play'}
 next(){return ROUTE.find(e=>!this.done.has(e.id))}
 height(){return this.action==='jump'?Math.sin(Math.PI*Math.min(1,this.actionTime/2.3))*92:0}
 canFly(){const e=this.next();return this.mode==='play'&&e?.type==='flight'&&this.cooldown<=0&&e.x-this.x<190&&e.x-this.x>0}
 command(name){
  if(name==='start'){this.start();return true}if(name==='pause'){if(this.mode!=='ready'&&this.mode!=='end')this.paused=!this.paused;return true}
  if(this.paused)return false;
  if(name==='dragon'){
   if(this.mode==='farewell'){this.mode='depart';this.local=0;return true}
   if(this.mode==='self'){this.mode='alone';this.local=0;return true}
   if(this.canFly()){this.current=this.next();this.mode='flight';this.local=0;this.flightFrom=this.x;this.action='ride';return true}return false;
  }
  if(this.mode!=='play')return false;
  if(name!=='jump'&&name!=='slide')return false;
  if(this.action!=='walk'){this.buffer={name,until:this.time+.15};return false}
  this.action=name;this.actionTime=0;this.lastSound=name;
  if(name==='jump'&&!this.dragonMotion&&!this.dragonArmed){const e=this.next();this.dragonArmed=e?.type==='jump'&&e.x-this.x<230?e:{x:this.dragonX+65,width:0,id:'free'};}
  return true;
 }
 fail(e){this.mode='retry';this.local=0;this.current=e;this.failures++;this.buffer=null;this.lastSound='fail'}
 tick(dt){
  if(this.paused||this.mode==='ready'||this.mode==='end')return;
  this.accumulator+=Math.max(0,Math.min(.5,dt));
  while(this.accumulator>=1/120-1e-10){this.accumulator-=1/120;this.step(1/120)}
 }
 dragonPose(){
  const m=this.dragonMotion,r=[91,142,220][this.age]/2;
  if(!m)return {x:this.dragonX,y:terrain(this.dragonX),height:0,tuck:0,crouch:this.dragonLand>0?Math.sin(Math.PI*this.dragonLand/.24)*.12:0,state:'walk',radius:r};
  if(m.t<.2)return {x:this.dragonX,y:terrain(this.dragonX),height:0,tuck:0,crouch:Math.sin(m.t/.2*Math.PI/2)*.14,state:'prepare',radius:r};
  const p=Math.min(1,(m.t-.2)/m.duration),lift=Math.sin(Math.PI*p)*m.height;
  return {x:this.dragonX,y:terrain(this.dragonX)-lift,height:lift,tuck:Math.sin(Math.PI*p)*.24,crouch:0,state:'air',radius:r};
 }
 updateDragon(dt){
  const old=this.dragonX;this.dragonLand=Math.max(0,this.dragonLand-dt);
  if(this.dragonMotion){const m=this.dragonMotion;m.t+=dt;const p=Math.max(0,Math.min(1,(m.t-.2)/m.duration));this.dragonX=m.from+(m.to-m.from)*(p*p*(3-2*p));
   if(p>=1){this.dragonMotion=null;this.dragonLand=.24;}
  }else{
   const offset=[85,115,158][this.age],target=this.x-offset;
   this.dragonX+=Math.max(0,Math.min(115*dt,(target-this.dragonX)*5*dt));
   const e=this.dragonArmed,r=[91,142,220][this.age]/2;
   if(e&&(e.id==='free'||this.dragonX+r>=e.x-42)){
    const from=this.dragonX,to=e.id==='free'?from+160:e.x+e.width+r+42;
    this.dragonMotion={from,to,t:0,duration:Math.max(1.65,(to-from)/110),height:Math.max(104,75+(to-from)*.15),event:e.id};this.dragonArmed=null;
   }
  }
  this.dragonVelocity=(this.dragonX-old)/dt;this.dragonDistance+=Math.abs(this.dragonX-old);
 }
 step(dt){
  if(this.paused||this.mode==='ready'||this.mode==='end')return;
  dt=Math.min(.05,Math.max(0,dt));this.time+=dt;this.local+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
  if(this.mode==='retry'){if(this.local>1.25){this.x=this.current.x-240;this.mode='play';this.action='walk';this.actionTime=0;this.cooldown=0;this.local=0;this.dragonX=this.x-[85,115,158][this.age];this.dragonMotion=null;this.dragonArmed=null}return}
  if(this.mode==='meal'){if(this.local>=6){this.age=this.current.stage;this.done.add(this.current.id);this.mode='play';this.local=0;this.action='walk'}return}
  if(this.mode==='flight'){
   const p=Math.min(1,this.local/this.current.duration);this.x=this.flightFrom+(this.current.x+this.current.width+100-this.flightFrom)*p;
   if(p>=1){this.done.add(this.current.id);this.mode='play';this.action='walk';this.cooldown=8;this.local=0;this.dragonX=this.x-[85,115,158][this.age];this.dragonMotion=null;this.lastSound='land'}return;
  }
  if(this.mode==='ending'){if(this.local>=10){this.mode='farewell';this.local=0;this.cooldown=0}return}
  if(this.mode==='depart'){if(this.local>=17){this.mode='empty';this.local=0}return}
  if(this.mode==='empty'){if(this.local>=2){this.mode='self';this.local=0}return}
  if(this.mode==='farewell'||this.mode==='self')return;
  if(this.mode==='alone'){if(this.local>1.5)this.x+=dt*44;if(this.local>=8){this.mode='end';this.local=0}return}
  this.actionTime+=dt;
  if(this.action==='jump'&&this.actionTime>=2.3||this.action==='slide'&&this.actionTime>=1.4){this.action='walk';this.actionTime=0;if(this.buffer&&this.buffer.until>=this.time)this.command(this.buffer.name);this.buffer=null;}
  const e=this.next();
  this.x+=78*dt;this.updateDragon(dt);
  if(!e)return;
  if(e.type==='meal'&&this.x>=e.x){this.current=e;this.mode='meal';this.local=0;this.action='feed';return}
  if(e.type==='ending'&&this.x>=e.x){this.current=e;this.mode='ending';this.local=0;return}
  if(e.type==='jump'){
   if(this.x+16>e.x&&this.x-16<e.x+e.width&&this.height()<15){this.fail(e);return}
   const pose=this.dragonPose();
   if(pose.x+pose.radius>e.x&&pose.x-pose.radius<e.x+e.width&&pose.height<16){this.fail(e);return}
   if(this.x>=e.x+e.width+18&&pose.x-pose.radius>=e.x+e.width)this.done.add(e.id);
  }
  if(e.type==='crow'){
   if(Math.abs(this.x-e.x)<29&&this.action!=='slide'){this.fail(e);return}
   if(this.x>e.x+45)this.done.add(e.id);
  }
  if(e.type==='flight'&&this.x>=e.x-5)this.fail(e);
 }
 snapshot(){return {mode:this.mode,position:Math.round(this.x),age:this.age,cooldown:+this.cooldown.toFixed(2),action:this.action,paused:this.paused,completed:[...this.done],next:this.next()?.type,failures:this.failures,time:+this.time.toFixed(2)}}
}
root.Journey=Journey;root.ROUTE=ROUTE;root.terrain=terrain;if(typeof module!=='undefined')module.exports={Journey,ROUTE,terrain};
})(typeof window!=='undefined'?window:globalThis);
