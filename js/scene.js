var isDragging = false;
var isSpinning = false;
var currentMesh = null;

const scene = new THREE.Scene();
scene.background = null;

const container = document.getElementById('threejs-container');

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0.5, 5.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x000000, 0);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
container.appendChild(renderer.domElement);


const ambientLight = new THREE.AmbientLight(0xffffff, 0.38);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
keyLight.position.set(4, 8, 5);
keyLight.castShadow = true;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffeedd, 0.75);
fillLight.position.set(-5, 1, 4);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xbbccff, 0.55);
rimLight.position.set(0, -3, -6);
scene.add(rimLight);

const pinkLight = new THREE.PointLight(0xF4A7B9, 0.9, 18);
pinkLight.position.set(-2, -1, 3);
scene.add(pinkLight);

var fillLight2 = new THREE.PointLight(0xffeedd, 1.5, 15);
fillLight2.position.set(-3, 3, 3);
scene.add(fillLight2);

var cafeLight = new THREE.PointLight(0xC1440E, 2, 10);
cafeLight.position.set(0, 3, 2);
cafeLight.visible = false;
scene.add(cafeLight);

var cafeLight2 = new THREE.PointLight(0xffb347, 1.5, 8);
cafeLight2.position.set(-2, 1, -1);
cafeLight2.visible = false;
scene.add(cafeLight2);

let lightOn = true;

var laptopMeshes = { lidParts: [], screenMesh: null, keys: [], keyMat: null };

const laptopShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0.0 },
    baseColor: { value: new THREE.Color(0xC4A882) }
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPos;
    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
      vViewPos = -mvPos.xyz;
      gl_Position = projectionMatrix * mvPos;
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 baseColor;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vViewPos;
    void main() {
      vec3 viewDir = normalize(vViewPos);
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
      float shimmer = sin(vUv.x * 18.0 + time) * sin(vUv.y * 12.0 + time * 0.6) * 0.05 + 0.95;
      vec3 col = baseColor * shimmer;
      col += fresnel * 0.35;
      gl_FragColor = vec4(col, 1.0);
    }
  `
});

function makeLaptopScreenTex() {
  const c = document.createElement('canvas');
  c.width = 640;
  c.height = 400;
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#080402';
  ctx.fillRect(0, 0, 640, 400);

  var bgGlow = ctx.createRadialGradient(200, 200, 20, 200, 200, 280);
  bgGlow.addColorStop(0, 'rgba(193,68,14,0.18)');
  bgGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bgGlow;
  ctx.fillRect(0, 0, 640, 400);

  ctx.strokeStyle = 'rgba(193,68,14,0.75)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(200, 200, 130, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(193,68,14,0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(200, 200, 108, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(245,230,200,0.55)';
  ctx.lineWidth = 2;
  for (var t = 0; t < 12; t++) {
    var angle = (t / 12) * Math.PI * 2 - Math.PI / 2;
    var inner = t % 3 === 0 ? 92 : 104;
    ctx.beginPath();
    ctx.moveTo(200 + Math.cos(angle) * inner, 200 + Math.sin(angle) * inner);
    ctx.lineTo(200 + Math.cos(angle) * 126, 200 + Math.sin(angle) * 126);
    ctx.stroke();
  }

  ctx.strokeStyle = '#C1440E';
  ctx.lineWidth = 3.5;
  var needleAngle = -0.42;
  ctx.beginPath();
  ctx.moveTo(200, 200);
  ctx.lineTo(200 + Math.cos(needleAngle) * 90, 200 + Math.sin(needleAngle) * 90);
  ctx.stroke();

  ctx.fillStyle = '#C1440E';
  ctx.beginPath();
  ctx.arc(200, 200, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(193,68,14,0.85)';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('9.2', 200, 198);

  ctx.fillStyle = 'rgba(245,230,200,0.55)';
  ctx.font = '14px Arial';
  ctx.fillText('BAR', 200, 280);

  ctx.fillStyle = 'rgba(245,230,200,0.48)';
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('TEMP', 385, 95);
  ctx.fillStyle = 'rgba(193,68,14,0.9)';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('93°C', 385, 130);

  ctx.fillStyle = 'rgba(245,230,200,0.48)';
  ctx.font = '11px Arial';
  ctx.fillText('SHOT', 385, 185);
  ctx.fillStyle = 'rgba(193,68,14,0.9)';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('25s', 385, 220);

  ctx.fillStyle = 'rgba(245,230,200,0.48)';
  ctx.font = '11px Arial';
  ctx.fillText('DOSE', 385, 275);
  ctx.fillStyle = 'rgba(193,68,14,0.9)';
  ctx.font = 'bold 30px Arial';
  ctx.fillText('18g', 385, 310);

  ctx.fillStyle = 'rgba(193,68,14,0.55)';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('● READY', 200, 350);

  return new THREE.CanvasTexture(c);
}


function buildLaptop() {
  laptopMeshes.lidParts = [];
  laptopMeshes.keys = [];
  laptopMeshes.screenMesh = null;
  laptopMeshes.keyMat = null;

  const group = new THREE.Group();

  const steelMat = new THREE.MeshStandardMaterial({ color: 0x909090, metalness: 0.92, roughness: 0.12 });
  const darkMat  = new THREE.MeshStandardMaterial({ color: 0x141010, metalness: 0.5,  roughness: 0.45 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x0a0806, metalness: 0.3,  roughness: 0.6  });

  const bodyGeo = new THREE.BoxGeometry(2.2, 1.55, 1.25);
  const body = new THREE.Mesh(bodyGeo, steelMat);
  group.add(body);

  const topCapGeo = new THREE.BoxGeometry(2.2, 0.08, 1.25);
  const topCap = new THREE.Mesh(topCapGeo, steelMat);
  topCap.position.set(0, 0.815, 0);
  group.add(topCap);

  const faceGeo = new THREE.BoxGeometry(2.05, 1.38, 0.06);
  const face = new THREE.Mesh(faceGeo, darkMat);
  face.position.set(0, 0, 0.655);
  group.add(face);

  var screenTex = makeLaptopScreenTex();
  const displayGeo = new THREE.BoxGeometry(0.72, 0.52, 0.02);
  const displayMat = new THREE.MeshStandardMaterial({
    map: screenTex, emissiveMap: screenTex,
    emissive: 0xffffff, emissiveIntensity: 0.7,
    roughness: 0.04
  });
  const display = new THREE.Mesh(displayGeo, displayMat);
  display.position.set(0.44, 0.3, 0.675);
  group.add(display);
  laptopMeshes.screenMesh = display;

  const btnMat = new THREE.MeshStandardMaterial({ color: 0xC1440E, metalness: 0.25, roughness: 0.55 });
  laptopMeshes.keyMat = btnMat;
  var btnGrid = [
    [-0.42, 0.28], [-0.20, 0.28], [0.02, 0.28],
    [-0.42, 0.06], [-0.20, 0.06], [0.02, 0.06],
    [-0.42,-0.16], [-0.20,-0.16], [0.02,-0.16]
  ];
  btnGrid.forEach(function(p) {
    var btnGeo = new THREE.CylinderGeometry(0.058, 0.058, 0.04, 20);
    var btn = new THREE.Mesh(btnGeo, btnMat);
    btn.position.set(p[0], p[1], 0.68);
    btn.rotation.x = Math.PI / 2;
    group.add(btn);
    laptopMeshes.keys.push(btn);
  });

  var indicatorMat = new THREE.MeshStandardMaterial({ color: 0xC1440E, emissive: 0xC1440E, emissiveIntensity: 0.6 });
  var indGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12);
  var indicator = new THREE.Mesh(indGeo, indicatorMat);
  indicator.position.set(0.56, -0.38, 0.678);
  indicator.rotation.x = Math.PI / 2;
  group.add(indicator);

  const mountMat = new THREE.MeshStandardMaterial({ color: 0x2C1A0E, metalness: 0.4, roughness: 0.6 });
  const mountGeo = new THREE.CylinderGeometry(0.28, 0.30, 0.15, 36);
  const mount = new THREE.Mesh(mountGeo, mountMat);
  mount.position.set(0, -0.60, 0.52);
  mount.rotation.x = Math.PI / 2;
  group.add(mount);

  const pfHandleGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.72, 14);
  const pfHandle = new THREE.Mesh(pfHandleGeo, mountMat);
  pfHandle.position.set(0.46, -0.60, 0.52);
  pfHandle.rotation.z = Math.PI / 2;
  group.add(pfHandle);

  const wandGeo = new THREE.CylinderGeometry(0.030, 0.030, 0.80, 14);
  const steamWand = new THREE.Mesh(wandGeo, laptopShaderMaterial);
  steamWand.position.set(-0.92, -0.18, 0.30);
  steamWand.rotation.x = 0;
  group.add(steamWand);

  const nozzleGeo = new THREE.CylinderGeometry(0.044, 0.030, 0.10, 14);
  const nozzle = new THREE.Mesh(nozzleGeo, steelMat);
  nozzle.position.set(-0.92, -0.58, 0.52);
  group.add(nozzle);

  const tankMat = new THREE.MeshPhysicalMaterial({
    color: 0x223344, metalness: 0.0, roughness: 0.04,
    transparent: true, opacity: 0.52, clearcoat: 1.0
  });
  const tankGeo = new THREE.BoxGeometry(0.68, 0.62, 0.58);
  const tank = new THREE.Mesh(tankGeo, tankMat);
  tank.position.set(-0.68, 0.72, -0.12);
  group.add(tank);

  const trayMat = new THREE.MeshStandardMaterial({ color: 0x606060, metalness: 0.88, roughness: 0.18 });
  const trayGeo = new THREE.BoxGeometry(1.85, 0.07, 0.88);
  const tray = new THREE.Mesh(trayGeo, trayMat);
  tray.position.set(0, -0.812, 0.18);
  group.add(tray);

  const grillMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9, roughness: 0.1 });
  for (var g = 0; g < 7; g++) {
    var grillGeo = new THREE.BoxGeometry(1.65, 0.025, 0.055);
    var grillMesh = new THREE.Mesh(grillGeo, grillMat);
    grillMesh.position.set(0, -0.772, -0.08 + g * 0.115);
    group.add(grillMesh);
  }

  const logoMat = new THREE.MeshStandardMaterial({ color: 0xC1440E, metalness: 0.2, roughness: 0.5 });
  const logoGeo = new THREE.BoxGeometry(0.32, 0.055, 0.015);
  const logo = new THREE.Mesh(logoGeo, logoMat);
  logo.position.set(0.44, -0.32, 0.685);
  group.add(logo);

  return group;
}


const modelData = {
  laptop: {
    build: function() { return buildLaptop(); },
    title: 'Espresso Machine',
    description: 'A procedural espresso machine built from BoxGeometry with a custom GLSL Fresnel shimmer shader on the steam wand. Features a Canvas 2D pressure gauge display, 9 cylindrical brew buttons, a portafilter mount, a translucent water tank, and a steel drip tray with grill bars.',
    facts: ['Body: BoxGeometry with steel MeshStandardMaterial', 'Display: Canvas 2D pressure gauge texture', 'Steam wand: GLSL Fresnel shimmer ShaderMaterial', 'Tank: MeshPhysical transparent clearcoat'],
    color: '#C1440E'
  },
  lipgloss: {
    title: 'Coffee Cup',
    description: 'A takeaway coffee cup built in Blender and loaded via GLTFLoader. DoubleSide materials applied to all faces. Interactive colour switcher, lid toggle, and straw extend controls.',
    facts: ['Mesh: GLB loaded via GLTFLoader', 'Material: DoubleSide on all faces', 'Shadows: castShadow + receiveShadow', 'Controls: colour, lid, straw'],
    color: '#C1440E'
  },
  moon: {
    title: 'BrewHaven Café',
    description: 'Step inside BrewHaven — a warm, intimate coffee shop where every detail tells a story. Built in Blender with custom materials, ambient lighting and interactive atmosphere controls.',
    facts: ['Built in Blender 5.1', 'Exported as glTF 2.0 GLB', 'DoubleSide materials for interior', 'Interactive glow and view controls'],
    color: '#C1440E'
  }
};

var currentMesh = null;
var currentModel = 'laptop';
// ---- UNCHANGED EXISTING FUNCTIONS — do not modify ----

function loadModel(name, event) {
  currentModel = name;
  if (currentMesh) scene.remove(currentMesh);
  var data = modelData[name];

  if (name === 'laptop') {
    currentMesh = new THREE.Group();
    scene.add(currentMesh);
    var machineLoader = new THREE.GLTFLoader();
    machineLoader.load('models/coffeemachine.glb', function(gltf) {
      if (currentMesh && currentMesh.parent) scene.remove(currentMesh);
      currentMesh = gltf.scene;
      currentMesh.scale.set(2, 2, 2);
      currentMesh.position.set(0, -1, 0);
      gltf.scene.traverse(function(child) {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(currentMesh);
      window.machineMesh = gltf.scene;
    });
  } else if (name === 'lipgloss') {
    currentMesh = new THREE.Group();
    scene.add(currentMesh);
    var cupLoader = new THREE.GLTFLoader();
    cupLoader.load('models/coffeecup.glb', function(gltf) {
      if (currentMesh && currentMesh.parent) scene.remove(currentMesh);
      currentMesh = gltf.scene;
      currentMesh.scale.set(1.2, 1.2, 1.2);
      currentMesh.position.set(0, -1.2, 0);
      gltf.scene.traverse(function(child) {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(currentMesh);
      window.cupMesh = gltf.scene;
    });
  } else if (name === 'moon') {
    currentMesh = new THREE.Group();
    scene.add(currentMesh);
    var cafeLoader = new THREE.GLTFLoader();
    cafeLoader.load('models/coffeeshop.glb', function(gltf) {
      if (currentMesh && currentMesh.parent) scene.remove(currentMesh);
      currentMesh = gltf.scene;
      currentMesh.scale.set(0.6, 0.6, 0.6);
      currentMesh.position.set(0, -1, 0);
      currentMesh.rotation.y = 0;
      currentMesh.rotation.x = 0;
      gltf.scene.traverse(function(child) {
        if (child.isMesh && child.material) {
          child.material.side = THREE.DoubleSide;
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(currentMesh);
      window.coffeeshopMesh = gltf.scene;
      scene.background = new THREE.Color(0xf5f0eb);
      var cafeAmbience = document.getElementById('cafe-audio');
      if (cafeAmbience) {
        cafeAmbience.currentTime = 0;
        cafeAmbience.play().catch(function(){});
        audioOn = true;
        var btn = document.getElementById('btn-audio');
        if (btn) { btn.textContent = '☕ Ambience: On'; btn.classList.add('active'); }
      }
    });
  } else {
    currentMesh = data.build();
    scene.add(currentMesh);
  }
  currentMesh.rotation.set(0, 0, 0);
  isSpinning = false;

  if (name === 'moon') {
    scene.background = new THREE.Color(0xf5f0eb);
    camera.position.set(0, 3, 10);
    camera.lookAt(0, 0, 0);
    cafeView = 0;
    cafeGlowOn = false;
    cafeLightsOn = true;
    cafeLight.visible = true;
    cafeLight2.visible = true;
    var btnPhase = document.getElementById('btn-phase');
    if (btnPhase) { btnPhase.textContent = 'View: Outside'; btnPhase.classList.remove('active'); }
    var btnGlow = document.getElementById('btn-glow');
    if (btnGlow) { btnGlow.textContent = 'Warm Glow: Off'; btnGlow.classList.remove('active'); }
    var btnLights = document.getElementById('btn-cafe-lights');
    if (btnLights) { btnLights.textContent = 'Lights: On'; btnLights.classList.remove('active'); }
  } else if (name === 'laptop') {
    scene.background = null;
    camera.position.set(0, 1, 5);
    camera.lookAt(0, 0, 0);
    cafeLight.visible = false;
    cafeLight2.visible = false;

    var cafeStop = document.getElementById('cafe-audio');
    if (cafeStop) { cafeStop.pause(); cafeStop.currentTime = 0; }
    var machineStop = document.getElementById('machine-audio');
    if (machineStop) { machineStop.pause(); machineStop.currentTime = 0; }
    var stirStop = document.getElementById('stir-audio');
    if (stirStop) { stirStop.pause(); stirStop.currentTime = 0; }
    audioOn = false;
    var btnAudio = document.getElementById('btn-audio');
    if (btnAudio) { btnAudio.textContent = '☕ Ambience: Off'; btnAudio.classList.remove('active'); }
  } else {
    scene.background = null;
    camera.position.set(0, 1, 5);
    camera.lookAt(0, 0, 0);
    cafeLight.visible = false;
    cafeLight2.visible = false;

      var cafeStop2 = document.getElementById('cafe-audio');
    if (cafeStop2) { cafeStop2.pause(); cafeStop2.currentTime = 0; }
    var machineStop = document.getElementById('machine-audio');
    if (machineStop) { machineStop.pause(); machineStop.currentTime = 0; }
    var stirStop = document.getElementById('stir-audio');
    if (stirStop) { stirStop.pause(); stirStop.currentTime = 0; }
    audioOn = false;
    var btnAudio2 = document.getElementById('btn-audio');
    if (btnAudio2) { btnAudio2.textContent = '☕ Ambience: Off'; btnAudio2.classList.remove('active'); }
  }

  wireframeOn = false;
  var btnWf = document.getElementById('btn-wireframe');
  if (btnWf) btnWf.classList.remove('active');
  var btnSpin = document.getElementById('btn-spin');
  if (btnSpin) btnSpin.classList.remove('active');

  ['laptop-controls', 'lipgloss-controls', 'moon-controls'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  var specific = document.getElementById(name + '-controls');
  if (specific) specific.style.display = 'block';

  document.getElementById('model-title').textContent = data.title;
  document.getElementById('model-description').textContent = data.description;

  document.querySelectorAll('.btn-product').forEach(function(b) {
    b.classList.remove('active');
  });
  if (event && event.target) event.target.classList.add('active');

  $('#product-media').fadeOut(150, function() {
    $(this).html(
      data.facts.map(function(f) {
        return '<li><span>—</span> ' + f + '</li>';
      }).join('')
    ).fadeIn(150);
  });
}

var wireframeOn = false;
function toggleWireframe() {
  wireframeOn = !wireframeOn;
  document.getElementById('btn-wireframe').classList.toggle('active', wireframeOn);
  if (currentMesh) {
    currentMesh.traverse(function(child) {
      if (child.isMesh && child.material) child.material.wireframe = wireframeOn;
    });
  }
}

function toggleLight() {
  lightOn = !lightOn;
  keyLight.visible = lightOn;
  fillLight.visible = lightOn;
  rimLight.visible = lightOn;
  pinkLight.visible = lightOn;
  document.getElementById('btn-light').classList.toggle('active', !lightOn);
}

var isSpinning = false;
function triggerAnimation() {
  isSpinning = !isSpinning;
  document.getElementById('btn-spin').classList.toggle('active', isSpinning);
}

// ---- NEW INTERACTIVE FUNCTIONS ----

var lidIsOpen = true;
var lidAnimating = false;

function toggleLid() {
  if (!laptopMeshes.lidParts.length || lidAnimating) return;
  lidAnimating = true;
  var targetBase = lidIsOpen ? 0.08 : -Math.PI * 0.33;
  var currentBase = laptopMeshes.lidParts[0].mesh.rotation.x - laptopMeshes.lidParts[0].offset;

  function step() {
    currentBase += (targetBase - currentBase) * 0.09;
    for (var i = 0; i < laptopMeshes.lidParts.length; i++) {
      laptopMeshes.lidParts[i].mesh.rotation.x = currentBase + laptopMeshes.lidParts[i].offset;
    }
    if (Math.abs(targetBase - currentBase) > 0.003) {
      requestAnimationFrame(step);
    } else {
      for (var j = 0; j < laptopMeshes.lidParts.length; j++) {
        laptopMeshes.lidParts[j].mesh.rotation.x = targetBase + laptopMeshes.lidParts[j].offset;
      }
      lidAnimating = false;
      lidIsOpen = !lidIsOpen;
      var btn = document.getElementById('btn-lid');
      if (btn) btn.textContent = lidIsOpen ? 'Close Lid' : 'Open Lid';
    }
  }
  step();
}


var screenGlowHigh = false;
function toggleScreenGlow() {
  if (!laptopMeshes.screenMesh) return;
  screenGlowHigh = !screenGlowHigh;
  laptopMeshes.screenMesh.material.emissiveIntensity = screenGlowHigh ? 1.8 : 0.4;
  var btn = document.getElementById('btn-screen');
  if (btn) {
    btn.textContent = screenGlowHigh ? 'Screen: Bright' : 'Screen: Dim';
    btn.classList.toggle('active', screenGlowHigh);
  }
}

var keyLightOn = false;
function toggleKeyboardLight() {
  keyLightOn = !keyLightOn;
  if (currentMesh) {
    currentMesh.traverse(function(child) {
      if (child.isMesh && child.material && child.material.color) {
        var c = child.material.color;
        if (Math.round(c.r * 255) === 0x8B && Math.round(c.g * 255) === 0x6B) {
          child.material.emissive = keyLightOn ? new THREE.Color(0xF4A7B9) : new THREE.Color(0x000000);
          child.material.emissiveIntensity = keyLightOn ? 0.9 : 0.0;
        }
      }
    });
  }
  var btn = document.getElementById('btn-keys');
  if (btn) {
    btn.textContent = keyLightOn ? 'Keys: On' : 'Keys: Off';
    btn.classList.toggle('active', keyLightOn);
  }
}

function changeGlossColour(hex) {
  if (!window.cupMesh) return;
  var colour = new THREE.Color(hex);
  window.cupMesh.traverse(function(child) {
    if (child.isMesh && child.material) {
      child.material.color = colour;
      child.material.needsUpdate = true;
    }
  });
}


function stirCoffee() {
  if (currentModel !== 'lipgloss') return;
  var stirAudio = document.getElementById('stir-audio');
  if (stirAudio) {
    stirAudio.currentTime = 0;
    stirAudio.play().catch(function(){});
  }
  var spins = 0;
  var maxSpins = 180;
  document.getElementById('btn-stir').textContent = 'Stirring... ☕';
  function doSpin() {
    if (!currentMesh) return;
    currentMesh.rotation.y += 0.05;
    spins++;
    if (spins < maxSpins) {
      requestAnimationFrame(doSpin);
    } else {
      document.getElementById('btn-stir').textContent = 'Stir Coffee ☕';
    }
  }
  doSpin();
}

var _isPouring = false;

function pourCoffee() {
  if (currentModel !== 'laptop' || _isPouring) return;
  _isPouring = true;

  var audio = document.getElementById('machine-audio');
  if (audio) {
    audio.loop = false;
    audio.currentTime = 0;
    audio.play().catch(function(){});
  }

  document.getElementById('btn-pour').textContent = '☕ Pouring...';

  setTimeout(function() {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    document.getElementById('btn-pour').textContent = '☕ Pour Coffee';
    _isPouring = false;
  }, 3000);
}

var cafeLightsOn = true;
function toggleCafeLights() {
  cafeLightsOn = !cafeLightsOn;
  cafeLight.visible = cafeLightsOn;
  cafeLight2.visible = cafeLightsOn;
  ambientLight.intensity = cafeLightsOn ? 0.38 : 0.05;
  document.getElementById('btn-cafe-lights').textContent = cafeLightsOn ? 'Lights: On' : 'Lights: Off';
  document.getElementById('btn-cafe-lights').classList.toggle('active', !cafeLightsOn);
}

var cafeGlowOn = false;

function toggleMoonGlow() {
  cafeGlowOn = !cafeGlowOn;
  cafeLight.intensity = cafeGlowOn ? 4 : 2;
  cafeLight2.intensity = cafeGlowOn ? 3 : 1.5;
  if (window.coffeeshopMesh) {
    window.coffeeshopMesh.traverse(function(child) {
      if (child.isMesh && child.material) {
        child.material.emissive = new THREE.Color(cafeGlowOn ? 0xC1440E : 0x000000);
        child.material.emissiveIntensity = cafeGlowOn ? 0.3 : 0;
        child.material.needsUpdate = true;
      }
    });
  }
  document.getElementById('btn-glow').textContent = cafeGlowOn ? 'Warm Glow: On' : 'Warm Glow: Off';
  document.getElementById('btn-glow').classList.toggle('active', cafeGlowOn);
}

var cafeView = 0;
function cycleMoonPhase() {
  cafeView = (cafeView + 1) % 3;
  if (cafeView === 0) {
    lerpCamera(4, 3, 8);
    document.getElementById('btn-phase').textContent = 'View: Outside';
    document.getElementById('btn-phase').classList.remove('active');
  } else if (cafeView === 1) {
    lerpCamera(0, 1, 4);
    document.getElementById('btn-phase').textContent = 'View: Counter';
    document.getElementById('btn-phase').classList.add('active');
  } else {
    lerpCamera(0, 6, 2);
    document.getElementById('btn-phase').textContent = 'View: Above';
    document.getElementById('btn-phase').classList.add('active');
  }
}

var laptopLidOpen = false;
var laptopLidAnimating = false;
function toggleLaptopLid() {
  if (!currentMesh || laptopLidAnimating) return;
  var lid = null;
  currentMesh.traverse(function(child) {
    if (!lid && child.material === laptopShaderMaterial) lid = child;
  });
  if (!lid) return;
  laptopLidAnimating = true;
  var target = laptopLidOpen ? 0.05 : -Math.PI * 0.35;
  var frames = 0;
  function step() {
    frames++;
    lid.rotation.x += (target - lid.rotation.x) * 0.09;
    if (frames < 60) {
      requestAnimationFrame(step);
    } else {
      lid.rotation.x = target;
      laptopLidAnimating = false;
      laptopLidOpen = !laptopLidOpen;
      var btn = document.getElementById('btn-lid');
      if (btn) btn.textContent = laptopLidOpen ? 'Steam Wand: Up' : 'Steam Wand: Down';
    }
  }
  step();
}

function lerpCamera(tx, ty, tz) {
  var frame = 0;
  var total = 60;
  function step() {
    frame++;
    camera.position.x += (tx - camera.position.x) * 0.08;
    camera.position.y += (ty - camera.position.y) * 0.08;
    camera.position.z += (tz - camera.position.z) * 0.08;
    camera.lookAt(0, 0, 0);
    if (frame < total) requestAnimationFrame(step);
  }
  step();
}

function resetCamera() {
  lerpCamera(0, 1, 6);
}

function setCameraView(view) {
  var positions = {
    front:   [0, 1, 6],
    side:    [6, 1, 0],
    top:     [0, 7, 1],
    closeup: [0, 0.5, 2.5]
  };
  var pos = positions[view];
  if (pos) lerpCamera(pos[0], pos[1], pos[2]);
}

var fogParticles = [];
for (var i = 0; i < 45; i++) {
  var geo = new THREE.SphereGeometry(Math.random() * 0.18 + 0.05, 6, 6);
  var mat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(
      0.92 + Math.random() * 0.06,
      0.78 + Math.random() * 0.10,
      0.82 + Math.random() * 0.08
    ),
    transparent: true,
    opacity: Math.random() * 0.035 + 0.008
  });
  var particle = new THREE.Mesh(geo, mat);
  particle.position.set(
    (Math.random() - 0.5) * 7,
    (Math.random() - 0.5) * 5,
    (Math.random() - 0.5) * 3 - 1
  );
  particle.userData.speed = Math.random() * 0.0018 + 0.0008;
  particle.userData.drift = (Math.random() - 0.5) * 0.001;
  scene.add(particle);
  fogParticles.push(particle);
}

function animate() {
  requestAnimationFrame(animate);

  if (isSpinning && currentMesh) {
    currentMesh.rotation.y += 0.02;
  }

  for (var j = 0; j < fogParticles.length; j++) {
    fogParticles[j].position.y += fogParticles[j].userData.speed;
    fogParticles[j].position.x += fogParticles[j].userData.drift;
    if (fogParticles[j].position.y > 3.5) {
      fogParticles[j].position.y = -3.5;
      fogParticles[j].position.x = (Math.random() - 0.5) * 7;
    }
  }

  laptopShaderMaterial.uniforms.time.value += 0.016;
  renderer.render(scene, camera);
}

window.addEventListener('resize', function() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

var _drag = false, _lx = 0, _ly = 0;
renderer.domElement.style.cursor = 'grab';
renderer.domElement.addEventListener('mousedown', function(e){
  _drag=true; _lx=e.clientX; _ly=e.clientY;
  renderer.domElement.style.cursor='grabbing';
});
window.addEventListener('mousemove', function(e){
  if(!_drag||!currentMesh) return;
  currentMesh.rotation.y += (e.clientX-_lx)*0.008;
  currentMesh.rotation.x += (e.clientY-_ly)*0.004;
  _lx=e.clientX; _ly=e.clientY;
});
window.addEventListener('mouseup', function(){
  _drag=false;
  renderer.domElement.style.cursor='grab';
});
renderer.domElement.addEventListener('wheel', function(e){
  e.preventDefault();
  camera.position.z = Math.max(2, Math.min(15, camera.position.z + e.deltaY*0.005));
},{passive:false});

loadModel('laptop', null);
animate();
