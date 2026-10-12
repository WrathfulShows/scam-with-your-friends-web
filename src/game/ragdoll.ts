export interface Joint { x:number;y:number;z:number;px:number;py:number;pz:number }
export interface Ragdoll { joints:Joint[] }
export const bones:[number,number,number][]=[[0,1,.45],[1,2,.48],[1,3,.38],[1,4,.38],[3,5,.62],[4,6,.62],[2,7,.70],[2,8,.70],[3,4,.76],[7,8,.32]];
export function makeRagdoll():Ragdoll {const positions=[[0,1.8,0],[0,1.35,0],[0,.87,0],[-.38,1.35,0],[.38,1.35,0],[-.45,.75,0],[.45,.75,0],[-.16,.17,0],[.16,.17,0]];return {joints:positions.map(([x,y,z],i)=>({x,y,z,px:x+(i%2?.012:-.012),py:y+.01,pz:z-.045}))};}
export function stepRagdoll(r:Ragdoll,dt:number){
 for(const p of r.joints){const x=p.x,y=p.y,z=p.z;p.x+=(p.x-p.px)*.97;p.y+=(p.y-p.py)*.97-9.8*dt*dt;p.z+=(p.z-p.pz)*.97;p.px=x;p.py=y;p.pz=z;}
 for(let pass=0;pass<8;pass++){
  for(const[a,b,length]of bones){const p=r.joints[a],q=r.joints[b],dx=q.x-p.x,dy=q.y-p.y,dz=q.z-p.z,d=Math.hypot(dx,dy,dz)||.001,k=(d-length)/d*.5;p.x+=dx*k;p.y+=dy*k;p.z+=dz*k;q.x-=dx*k;q.y-=dy*k;q.z-=dz*k;}
  for(const p of r.joints){if(p.y<.12){p.y=.12;p.px=p.x-(p.x-p.px)*.45;p.pz=p.z-(p.z-p.pz)*.45;}p.x=Math.max(-1.5,Math.min(1.5,p.x));p.z=Math.max(-1.5,Math.min(1.5,p.z));}
 }
}
