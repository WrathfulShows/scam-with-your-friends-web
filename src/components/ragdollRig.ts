import * as THREE from 'three';
import {bones,type Ragdoll} from '../game/ragdoll';
export function createRagdollRig(index:number){
 const root=new THREE.Group();const skin=new THREE.MeshStandardMaterial({color:'#bd946f'}),shirt=new THREE.MeshStandardMaterial({color:['#cb9f45','#698e9a','#a07491','#699474'][index%4]});
 const joints=Array.from({length:9},(_,i)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(i===0?.25:.12,10,8),skin);root.add(mesh);mesh.castShadow=true;return mesh;});
 const links=bones.slice(0,8).map(()=>{const mesh=new THREE.Mesh(new THREE.CylinderGeometry(.105,.12,1,8),shirt);root.add(mesh);mesh.castShadow=true;return mesh;});
 const axis=new THREE.Vector3(0,1,0);
 return {root,update(r:Ragdoll){r.joints.forEach((p,i)=>joints[i].position.set(p.x,p.y,p.z));links.forEach((mesh,i)=>{const[a,b]=bones[i],p=joints[a].position,q=joints[b].position,direction=q.clone().sub(p);mesh.position.copy(p).add(q).multiplyScalar(.5);mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(axis,direction.normalize());});}};
}
