// Independently extracted painted components; no whole-scene overlay.
// Effects use source-image coordinates, sharing the exact tree transform and occlusion mask.
function hollowMask(){ctx.beginPath();ctx.moveTo(405,215);ctx.bezierCurveTo(378,237,376,274,402,310);ctx.bezierCurveTo(432,291,440,245,405,215);ctx.closePath()}
function lightLevel(t,i,seed=0){return .34+.22*Math.sin(t*(.43+i*.047)+i*2.399+seed)+.11*Math.sin(t*.173+i*4.73+seed*.3)}
function drawHollowLights(t,seed){ctx.save();hollowMask();ctx.clip();const wall=ctx.createRadialGradient(405,282,1,405,282,42);wall.addColorStop(0,'#bac78420');wall.addColorStop(1,'#b8cb7100');ctx.fillStyle=wall;ctx.fillRect(373,217,70,98);
 const dots=[[398,258],[414,266],[391,278],[407,286],[418,282],[402,299]];for(let i=0;i<dots.length;i++){const a=lightLevel(t,i,seed*.001),x=dots[i][0]+(i%3===0?Math.sin(t*.21+i)*1.2:0),y=dots[i][1]+(i%3===0?Math.sin(t*.28+i)*1.5:0);ctx.globalAlpha=a;const g=ctx.createRadialGradient(x,y,0,x,y,9);g.addColorStop(0,'#deed9c9c');g.addColorStop(.28,'#cadb7760');g.addColorStop(1,'#adc96800');ctx.fillStyle=g;ctx.fillRect(x-9,y-9,18,18);ctx.fillStyle='#e6edb8';ctx.beginPath();ctx.ellipse(x,y,.7,1.05,.2,0,Math.PI*2);ctx.fill()}ctx.restore()}
const WATER_CHANNELS=[{poly:[[257,195],[289,196],[307,209],[317,252],[322,342],[335,382],[309,384],[280,366],[267,323]],points:[[270,196],[285,250],[293,320],[315,382]],width:28,speed:54},{poly:[[285,384],[317,390],[339,410],[358,456],[376,470],[348,480],[329,443],[307,410]],points:[[294,386],[317,409],[337,447],[362,474]],width:22,speed:42},{poly:[[345,474],[371,474],[393,496],[412,526],[384,529],[370,501]],points:[[350,477],[371,490],[380,509],[399,527]],width:17,speed:33}];
function waterMask(c){ctx.beginPath();c.poly.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath()}
function waterPoint(c,p){const q=Math.min(2.999,p*3),i=Math.floor(q),u=q-i,a=c.points[i],b=c.points[i+1];return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u]}
function drawForestWater(t){for(let n=0;n<WATER_CHANNELS.length;n++){const c=WATER_CHANNELS[n],length=c.points[3][1]-c.points[0][1];ctx.save();waterMask(c);ctx.clip();ctx.fillStyle='#8fc9c89c';ctx.fill();
 for(let i=0;i<20;i++){const p=((t*(c.speed+i%4*3)/length+i*.6180339+n*.17)%1+1)%1,at=waterPoint(c,p),end=waterPoint(c,Math.min(.999,p+.09)),side=((i*7)%17/17-.5)*c.width;ctx.globalAlpha=Math.min(1,p*14,(1-p)*14)*(.36+i%3*.09);ctx.strokeStyle=i%3?'#c2e3dc':'#eff1d8';ctx.lineWidth=i%4===0?1.7:.75;ctx.beginPath();ctx.moveTo(at[0]+side,at[1]);ctx.quadraticCurveTo(at[0]+side+1.2,(at[1]+end[1])*.5,end[0]+side,end[1]);ctx.stroke()}
 // Small painted foam strokes are clipped before they reach the foreground rocks.
 for(let i=0;i<5;i++){const p=(t*.45+i*.2)%1,at=c.points[3];ctx.globalAlpha=Math.sin(p*Math.PI)*.25;ctx.strokeStyle='#d1e8df';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(at[0]+(i-2)*4,at[1]-2-p*5,2+p*4,.8+p,0,0,Math.PI);ctx.stroke()}ctx.restore()}
 // Soft local spray, bounded to the final impact pool; no whole-tree haze.
 ctx.save();ctx.beginPath();ctx.ellipse(385,514,25,12,0,0,Math.PI*2);ctx.clip();for(let i=0;i<3;i++){const p=(t*.13+i/3)%1;ctx.globalAlpha=Math.sin(p*Math.PI)*.12;const g=ctx.createRadialGradient(383+p*8,518-p*8,0,383+p*8,518-p*8,10+p*12);g.addColorStop(0,'#d4ece2');g.addColorStop(1,'#d4ece200');ctx.fillStyle=g;ctx.fillRect(350,490,65,40)}ctx.restore()}
const forestSites=[[-330,1],[420,0],[1610,1],[2770,0],[3900,1],[4930,0],[6100,1],[7550,0],[9020,1]],roadTiles=new Map();
function roadGap(x,pad=0){return ROUTE.some(e=>(e.type==='jump'||e.type==='flight')&&x>=e.x-pad&&x<=e.x+e.width+pad)}
const roadProfile=[38,42,47,56,54,54,55,54,57,56,54,53,53,51,43,40];
function paintedSurface(s){const p=Math.max(0,Math.min(14.999,s/100)),i=Math.floor(p);return roadProfile[i]+(roadProfile[i+1]-roadProfile[i])*(p-i)}
function roadTile(id){if(roadTiles.has(id))return roadTiles.get(id);const c=document.createElement('canvas');c.width=1024;c.height=1200;const g=c.getContext('2d'),im=images['v5-road'],scale=.78;
 // Preserve pixel scale in both axes. Narrow slices translate to the shared road height.
 for(let x=0;x<1024;x+=2){const wx=id*1024+x;if(roadGap(wx+1))continue;let s=((wx/scale)%2960+2960)%2960,rev=s>1480;s=rev?2960-s:s;const sy=paintedSurface(s),y=terrain(wx)-sy*scale;g.save();g.translate(x,y);if(rev){g.translate(2.4,0);g.scale(-1,1)}g.drawImage(im,s,0,2.4/scale,im.height,0,0,2.4,im.height*scale);g.restore()}
 roadTiles.set(id,c);if(roadTiles.size>8)roadTiles.delete(roadTiles.keys().next().value);return c}
function drawVineRoad(cam){for(let id=Math.floor(cam/1024);id<=Math.floor((cam+1280)/1024);id++)ctx.drawImage(roadTile(id),id*1024-cam,0);
 for(let i=Math.floor(cam/1070)-1;i<=Math.ceil((cam+1280)/1070);i++){const wx=i*1070+190;if(roadGap(wx,160))continue;const im=images['v5-root'],w=190,h=w*im.height/im.width;ctx.drawImage(im,wx-cam-w*.5,terrain(wx)+42,w,h)}
 for(const e of ROUTE.filter(e=>e.type==='jump'||e.type==='flight'))for(const wx of[e.x,e.x+e.width])if(wx>cam-10&&wx<cam+1290){ctx.strokeStyle='#bdd09b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(wx-cam,terrain(wx)+4);ctx.lineTo(wx-cam,terrain(wx)+58);ctx.stroke()}
}
function forestLayers(cam,t,front){ctx.save();
 if(front){for(let i=Math.floor(cam*1.06/1050)-1;i<=Math.ceil((cam*1.06+1280)/1050);i++){const x=i*1050-cam*1.06,im=images['v5-bough'+(Math.abs(i)%2)],w=480,h=w*im.height/im.width;ctx.drawImage(im,x,-h+105,w,h)}ctx.restore();return}
 for(const[wx,type]of forestSites){const x=wx-cam*.68,w=type?900:930,im=images['v5-tree'+type],h=w*im.height/im.width;if(x<-w||x>1280)continue;const y=790-h-(terrain(game.x)-505)*.07;ctx.drawImage(im,x,y,w,h);
 ctx.save();ctx.translate(x,y);ctx.scale(w/im.width,h/im.height);if(type===0)drawForestWater(t);else drawHollowLights(t,wx);ctx.restore();
 }
 for(const wx of[620,2490,4470]){const x=wx-cam*.4;if(x<-260||x>1280)continue;const g=ctx.createLinearGradient(x,0,x+180,450);g.addColorStop(0,'#f1edb619');g.addColorStop(1,'#b9dfcf00');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+45,0);ctx.lineTo(x+270,450);ctx.lineTo(x+160,450);ctx.fill()}
 ctx.restore();
}


