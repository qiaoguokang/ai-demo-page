// Continuous skin deformation: all vertices share the same pose, including joints.
function smooth(a,b,v){let t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t)}
function footCycle(distance,offset,stride){const p=((distance/(stride/.62)+offset)%1+1)%1;if(p<.62)return {x:stride*(.5-p/.62),y:0};const q=(p-.62)/.38;return {x:stride*(-.5+smooth(0,1,q)),y:-Math.sin(Math.PI*q)*stride*.36}}
const skinCanvas=document.createElement('canvas');
const skinGL=skinCanvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});
let skinProgram,skinBuffer,skinIndices;const skinTextures=new WeakMap();
if(skinGL){const gl=skinGL,shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh};skinProgram=gl.createProgram();gl.attachShader(skinProgram,shader(gl.VERTEX_SHADER,'attribute vec2 position;attribute vec2 texcoord;varying vec2 uv;void main(){gl_Position=vec4(position,0.0,1.0);uv=texcoord;}'));gl.attachShader(skinProgram,shader(gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D art;void main(){gl_FragColor=texture2D(art,uv);}'));gl.linkProgram(skinProgram);skinBuffer=gl.createBuffer();skinIndices=gl.createBuffer();}
function paintSkin(im,points,N,M,W,H,ox,oy){
 const gl=skinGL;if(!gl)return false;if(skinCanvas.width!==W||skinCanvas.height!==H){skinCanvas.width=W;skinCanvas.height=H}gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(skinProgram);
 let texture=skinTextures.get(im);if(!texture){texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);skinTextures.set(im,texture)}else gl.bindTexture(gl.TEXTURE_2D,texture);
 const vertices=new Float32Array(points.length*4);for(let i=0;i<points.length;i++){const p=points[i];vertices.set([(p.dst.x+ox)/W*2-1,1-(p.dst.y+oy)/H*2,p.src.x/im.width,p.src.y/im.height],i*4)}
 gl.bindBuffer(gl.ARRAY_BUFFER,skinBuffer);gl.bufferData(gl.ARRAY_BUFFER,vertices,gl.DYNAMIC_DRAW);for(const [name,offset]of [['position',0],['texcoord',8]]){const at=gl.getAttribLocation(skinProgram,name);gl.enableVertexAttribArray(at);gl.vertexAttribPointer(at,2,gl.FLOAT,false,16,offset)}
 const indices=[];for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+1,c=a+N+1,d=c+1;indices.push(a,b,c,b,d,c)}gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,skinIndices);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);return true;
}
function deformSprite(im,x,y,w,pose){const h=w*im.height/im.width,N=14,M=16,points=[];const W=Math.ceil(w*2.4),H=Math.ceil(h*1.8),ox=W/2,oy=H-12;
 for(let j=0;j<=M;j++)for(let i=0;i<=N;i++){const u=i/N,v=j/M;let px=(u-.5)*w,py=(v-1)*h;
  if(pose.flight){const wing=(1-smooth(.69,.84,u))*(smooth(.12,.32,u))*(1-smooth(.53,.7,v));py+=(.62-v)*h*wing*(1-pose.spread);px+=Math.sin(pose.beat)*wing*w*.045;py+=Math.sin(pose.beat)*wing*h*.26*pose.spread;const tail=(1-smooth(.13,.42,u));py+=Math.sin(pose.beat*.45+u*5)*h*.035*tail;}
  else{const leg=smooth(.69,.95,v)*smooth(.29,.40,u)*(1-smooth(.79,.86,u));const centers=[.42,.52,.68,.77],phases=[0,.5,.5,0];let dx=0,dy=0,total=0;for(let k=0;k<4;k++){const wt=Math.exp(-Math.pow((u-centers[k])/.045,2)),f=footCycle(pose.distance||0,phases[k],w*.35);dx+=wt*f.x;dy+=wt*f.y;total+=wt}if(total){px+=dx/total*leg*pose.walk;py+=dy/total*leg*pose.walk;}
   const bob=Math.sin((pose.distance||0)/(w*.35/.62)*Math.PI*4)*h*.014*pose.walk;
   py+=bob*(1-leg);const tail=(1-smooth(.12,.40,u));py+=Math.sin((pose.distance||0)*.06+u*5)*h*.027*tail*pose.walk;
   const head=smooth(.62,.82,u)*(1-smooth(.52,.69,v));py+=Math.sin((pose.distance||0)*.045)*h*.01*head*pose.walk;
   py-=pose.tuck*h*leg;px-=pose.tuck*w*.24*leg;py+=(1-v)*h*(pose.crouch||0);
   if(pose.worldX!==undefined)py+=(terrain(pose.worldX+px)-terrain(pose.worldX))*leg;
   if(pose.feed){const influence=smooth(.48,.78,u)*(1-smooth(.48,.80,v)),a=pose.feed*influence,cx=w*.20,cy=-h*.36,rx=px-cx,ry=py-cy;px=cx+rx*Math.cos(a)-ry*Math.sin(a);py=cy+rx*Math.sin(a)+ry*Math.cos(a);}
  }
  points.push({src:{x:u*im.width,y:v*im.height},dst:{x:px,y:py}});
 }
 const painted=paintSkin(im,points,N,M,W,H,ox,oy);ctx.save();ctx.translate(x,y);ctx.rotate(pose.angle||0);ctx.scale(pose.facing||1,1);if(painted)ctx.drawImage(skinCanvas,-ox,-oy);else ctx.drawImage(im,-w/2,-h,w,h);ctx.restore();
}
function walkingDragon(pose,cam){const w=[91,142,220][game.age];const walk=pose.state==='prepare'?1-smooth(0,.18,game.dragonMotion.t):pose.state==='walk'?Math.min(1,Math.abs(game.dragonVelocity)/78)*(1-smooth(0,.24,game.dragonLand)):0;deformSprite(images['dragon'+game.age*3],pose.x-cam,pose.y,w,{worldX:pose.x,distance:game.dragonDistance,walk,tuck:pose.tuck,crouch:pose.crouch});}
function flyingDragon(age,x,y,w,t,spread=1,angle=0,facing=1){deformSprite(images['dragon'+(age*3+1)],x,y,w,{flight:true,spread,beat:t*7.2,angle,facing})}
function fruitPlant(e,cam){const x=e.x-cam,y=ground(e.x),variant=e.stage,harvested=game.done.has(e.id)||(game.mode==='meal'&&game.current===e&&game.local>=1.8);
 ctx.save();ctx.translate(x,y);ctx.strokeStyle='#355949';ctx.lineWidth=variant===1?2.4:3.4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(60,8);if(variant===1){ctx.bezierCurveTo(93,-13,5,-19,34,-68);ctx.bezierCurveTo(50,-82,67,-39,23,-48)}else ctx.bezierCurveTo(64,-18,49,-51,25,-54-variant*5);ctx.stroke();
 if(variant===2){ctx.fillStyle='#294f43';ctx.beginPath();ctx.ellipse(59,8,17,8,-.1,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#769575';ctx.stroke()}
 for(let i=0;i<6;i++){const lx=32+i*4.5,ly=-52+i*8,side=i%2?1:-1;ctx.fillStyle=i%2?'#7b9d6d':'#537e5b';ctx.strokeStyle='#355d46';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(lx,ly);ctx.quadraticCurveTo(lx+side*22,ly-20,lx+side*24,ly-5);ctx.quadraticCurveTo(lx+side*12,ly+4,lx,ly);ctx.fill();ctx.stroke()}
 if(!harvested){const positions=variant===0?[[23,-54,5.5],[33,-46,4.2],[17,-44,4.5]]:variant===1?[[24,-49,5],[39,-59,4],[17,-39,3.8],[34,-40,4.4]]:[[26,-65,6],[14,-55,4.7],[33,-51,5.2]];for(const [bx,by,r]of positions){ctx.strokeStyle='#647648';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(29,-55-variant*4);ctx.quadraticCurveTo(bx+3,by-8,bx,by);ctx.stroke();berry(bx,by+3,r)}}ctx.restore();
}
function cloudBank(x,y,w,h){const im=images.cloud;ctx.drawImage(im,x-w/2,y-h*.5,w,h);}
function departurePose(t,gy){
 if(t<1.3)return {x:505,y:gy+Math.sin(t/1.3*Math.PI)*9,w:220,spread:smooth(0,1.3,t),angle:0,beat:t*.7,facing:1};
 const p=smooth(1.3,12.5,t);return {x:505+490*p,y:gy+(315-gy)*p-Math.sin(p*Math.PI)*155,w:220*(1-.73*p),spread:1,angle:-.3*Math.sin(p*Math.PI)+.10*p,beat:t<6?t-.39:5.61+(t-6)*.45,facing:1-.35*smooth(6,10,t)};
}
