// Original generative score: sparse felt-piano, breathy flute, harp and forest air.
// No sampled recordings or melodies from existing games.
class ForestScore{
 constructor(ac){this.ac=ac;this.master=ac.createGain();this.master.gain.value=0;this.master.connect(ac.destination);this.bus=ac.createGain();this.bus.gain.value=.5;this.bus.connect(this.master);const delay=ac.createDelay(1);delay.delayTime.value=.43;const fb=ac.createGain();fb.gain.value=.22;const damp=ac.createBiquadFilter();damp.frequency.value=2100;this.bus.connect(delay);delay.connect(damp);damp.connect(fb);fb.connect(delay);damp.connect(this.master);this.next=0;this.beat=0;this.enabled=false;this.progress=0;this.ending=false;}
 note(midi,start,len,volume,kind='piano'){
  const ac=this.ac,f=440*Math.pow(2,(midi-69)/12);const gain=ac.createGain(),filter=ac.createBiquadFilter();filter.type='lowpass';filter.frequency.value=kind==='flute'?1500:2400;filter.connect(gain);gain.connect(this.bus);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(volume,start+(kind==='flute'?.18:.015));gain.gain.exponentialRampToValueAtTime(.0001,start+len);
  const harmonics=kind==='flute'?[[1,1],[2,.08]]:[[1,1],[2,.22],[3,.055]];
  for(const [h,v] of harmonics){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*h;o.detune.value=kind==='flute'?Math.sin(midi)*2:0;g.gain.value=v;o.connect(g).connect(filter);o.start(start);o.stop(start+len+.08);o.onended=()=>{o.disconnect();g.disconnect()};}
  setTimeout(()=>{gain.disconnect();filter.disconnect()},Math.max(0,(start+len-ac.currentTime)*1000)+500);
 }
 update(active,progress,ending){const ac=this.ac;this.progress=progress;this.ending=ending;if(active!==this.enabled){this.enabled=active;this.master.gain.setTargetAtTime(active?.55:0,ac.currentTime,.3);if(active)this.next=ac.currentTime+.12}if(!active)return;
  const beatTime=60/72;while(this.next<ac.currentTime+.22){this.compose(this.beat++,this.next);this.next+=beatTime}
 }
 compose(beat,t){const bar=Math.floor(beat/4),step=beat%4;const chords=[[50,57,62,66],[47,54,59,62],[43,50,57,62],[45,52,59,64]],ch=chords[Math.floor(bar/2)%4];
  if(step===0){this.note(ch[0],t,3.1,.07);this.note(ch[2],t+.09,2.8,.027)}
  if(step===2&&!this.ending)this.note(ch[1]+12,t,2.2,.035);
  const melody=[74,null,78,76,null,69,74,null,81,null,78,74,76,null,69,null,71,74,null,78,76,null,74,null,69,null,66,69,74,null,null,null];
  const m=melody[beat%melody.length];if(m!==null&&(!this.ending||beat%4===0)){this.note(m,t+.035,beat%3===0?2.1:1.35,this.ending?.028:.044,bar%4<2?'piano':'flute')}
  if(this.progress>.35&&this.progress<.83&&step===3)this.note(ch[3]+12,t+.22,1.8,.018);
 }
}
window.ForestScore=ForestScore;
