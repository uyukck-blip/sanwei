import * as THREE from 'three';
import {FBXLoader} from './vendor/FBXLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
const $=id=>document.getElementById(id),host=$('canvasHost');
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(35,1,.01,100);
let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});}catch(e){$('loading').textContent='当前浏览器无法开启三维渲染，请使用支持 WebGL 的浏览器。';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=1.5;controls.maxDistance=10;controls.autoRotateSpeed=.6;controls.maxPolarAngle=Math.PI*.94;
scene.add(new THREE.HemisphereLight(0xfff9ed,0x737567,2.2));const key=new THREE.DirectionalLight(0xfff6e5,3);key.position.set(3,5,4);scene.add(key);const fill=new THREE.DirectionalLight(0xdbe6ff,1.3);fill.position.set(-4,1,-3);scene.add(fill);
const group=new THREE.Group();group.rotation.y=Math.PI/2;scene.add(group);
const originals=new Map();let missing=false,modelReady=false;
const manager=new THREE.LoadingManager();manager.onError=url=>{missing=true;console.warn('Missing model texture',url);};
// Missing external maps are handled explicitly; no placeholder historical texture is invented.
const loader=new FBXLoader(manager);
loader.load('./model.fbx',object=>{
 object.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
 const scale=2.6/Math.max(size.x,size.y,size.z);object.scale.multiplyScalar(scale);object.position.sub(center.multiplyScalar(scale));group.add(object);
 object.traverse(o=>{if(!o.isMesh)return;const mats=(Array.isArray(o.material)?o.material:[o.material]);mats.forEach(m=>{m.side=THREE.DoubleSide;});originals.set(o,o.material);});
 modelReady=true;reset();$('loading').style.display='none';
 setTimeout(()=>{let hasTexture=false;originals.forEach(mat=>(Array.isArray(mat)?mat:[mat]).forEach(m=>{if(m.map?.image)hasTexture=true;}));if(missing||!hasTexture){$('textureNote').textContent='当前未找到完整表面贴图，默认采用中性素模展示。补充 baked_albedo.jpg 与 baked_normal.jpg 后可还原材质。';$('original').disabled=true;$('original').title='需补充原始贴图';setMode('clay');}else{$('textureNote').textContent='模型表面材质来自所提供文件；光照仅用于辅助观察。';}},300);
},xhr=>{$('progress').textContent=xhr.total?Math.round(xhr.loaded/xhr.total*100)+'%':'读取模型中';},err=>{$('loading').textContent='模型未能载入，请刷新页面重试。';console.error(err);});
const clay=new THREE.MeshStandardMaterial({color:0xb6aa91,roughness:.82,metalness:0,side:THREE.DoubleSide});
const wire=new THREE.MeshBasicMaterial({color:0x586c5a,wireframe:true,side:THREE.DoubleSide});
function setMode(mode){originals.forEach((m,o)=>o.material=mode==='original'?m:mode==='clay'?clay:wire);['original','clay','wire'].forEach(id=>$(id).classList.toggle('active',id===mode));$('modeLabel').textContent={original:'原始材质',clay:'素模观察',wire:'结构线框'}[mode];}
['original','clay','wire'].forEach(id=>$(id).onclick=()=>setMode(id));
function reset(){controls.target.set(0,0,0);camera.position.set(0,.2,5.5);controls.update();}
$('reset').onclick=reset;$('rotate').onclick=()=>{controls.autoRotate=!controls.autoRotate;$('rotate').classList.toggle('active',controls.autoRotate);$('rotate').setAttribute('aria-pressed',String(controls.autoRotate));};
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{controls.autoRotate=false;$('rotate').classList.remove('active');$('rotate').setAttribute('aria-pressed','false');controls.target.set(0,0,0);camera.position.set(...({front:[0,.2,5.5],side:[5.5,.2,0],back:[0,.2,-5.5]}[b.dataset.view]));controls.update();});
$('full').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('viewer').requestFullscreen();}catch{$('full').textContent='浏览器不支持全屏';}};
new ResizeObserver(()=>{const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);}).observe(host);
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);});
window.__gallery={scene,camera,controls,get ready(){return modelReady;}};
