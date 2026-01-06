/*! K:3dworld:1:70:k0:w1o2 !*/
/**
 * KONOMI 3D World - Three.js Grid System
 * 1000x1000x1000 navigable space
 */
const WORLD = {
  // Grid dimensions
  SIZE: 1000,
  CELL: 10,  // Cell size in 3D units

  // Scene objects
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  raycaster: null,
  mouse: null,

  // Block meshes
  blocks: new Map(),

  // Current position
  position: { x: 0, y: 0, z: 0 },

  // Initialize Three.js
  init(container) {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);
    this.scene.fog = new THREE.Fog(0x0a0a0f, 100, 500);

    // Camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    this.camera.position.set(50, 50, 50);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 500;

    // Raycaster for clicking
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Lighting
    const ambient = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambient);

    const point = new THREE.PointLight(0x00ff88, 1, 200);
    point.position.set(50, 50, 50);
    this.scene.add(point);

    // Grid helper
    const grid = new THREE.GridHelper(200, 20, 0x00ff88, 0x1a1a2e);
    this.scene.add(grid);

    // Axis
    const axis = new THREE.AxesHelper(100);
    this.scene.add(axis);

    // Events
    window.addEventListener('resize', () => this.resize());
    this.renderer.domElement.addEventListener('click', (e) => this.onClick(e));
    this.renderer.domElement.addEventListener('mousemove', (e) => this.onHover(e));

    // Start render loop
    this.animate();

    return this;
  },

  // Create a block at coordinate
  createBlock(x, y, z, data = {}) {
    const key = `${x},${y},${z}`;
    if (this.blocks.has(key)) return this.blocks.get(key);

    // Determine block type and color
    const colors = {
      root: 0x00ff88,
      content: 0x4a9eff,
      academy: 0xffaa00,
      locked: 0x333344,
      ml: 0xff4488,
      ai: 0x8844ff,
      core: 0x44ffaa
    };

    const type = data.type || 'content';
    const color = colors[type] || colors.content;

    // Geometry based on content
    const size = data.size || 8;
    const geometry = new THREE.BoxGeometry(size, size, size);

    // Material with glow effect
    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: data.locked ? 0.3 : 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x * this.CELL, y * this.CELL, z * this.CELL);
    mesh.userData = { coord: [x, y, z], ...data };

    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
    );
    mesh.add(line);

    // Add label
    if (data.label) {
      this.addLabel(mesh, data.label);
    }

    this.scene.add(mesh);
    this.blocks.set(key, mesh);

    return mesh;
  },

  // Add floating label to block
  addLabel(mesh, text) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;

    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 24px monospace';
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(10, 2.5, 1);
    sprite.position.y = 6;
    mesh.add(sprite);
  },

  // Load blocks from KONOMI.MAP
  loadFromMap(map) {
    Object.entries(map).forEach(([path, [x, y, z]]) => {
      const type = path === 'root' ? 'root' :
                   path === 'academy' ? 'academy' :
                   path.startsWith('ml') ? 'ml' :
                   path.startsWith('ai') ? 'ai' :
                   path.startsWith('core') ? 'core' : 'content';

      this.createBlock(x, y, z, {
        path,
        label: path.split('/').pop(),
        type,
        url: `/${path}/`
      });
    });

    // Add connection lines
    this.addConnections();
  },

  // Add lines connecting related blocks
  addConnections() {
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff88,
      opacity: 0.3,
      transparent: true
    });

    // Connect adjacent blocks
    this.blocks.forEach((mesh, key) => {
      const [x, y, z] = key.split(',').map(Number);

      [[1,0,0], [0,1,0], [0,0,1]].forEach(([dx, dy, dz]) => {
        const neighborKey = `${x+dx},${y+dy},${z+dz}`;
        if (this.blocks.has(neighborKey)) {
          const neighbor = this.blocks.get(neighborKey);
          const geometry = new THREE.BufferGeometry().setFromPoints([
            mesh.position,
            neighbor.position
          ]);
          const line = new THREE.Line(geometry, material);
          this.scene.add(line);
        }
      });
    });
  },

  // Fly camera to coordinate
  flyTo(x, y, z, duration = 1000) {
    const target = new THREE.Vector3(x * this.CELL, y * this.CELL, z * this.CELL);
    const start = this.camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic

      this.camera.position.lerpVectors(start, target.clone().add(new THREE.Vector3(20, 20, 20)), eased);
      this.controls.target.lerpVectors(this.controls.target, target, eased);

      if (t < 1) requestAnimationFrame(animate);
    };
    animate();

    this.position = { x, y, z };
  },

  // Handle click on block
  onClick(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([...this.blocks.values()]);

    if (intersects.length > 0) {
      const block = intersects[0].object;
      const data = block.userData;

      if (data.locked) {
        this.showMessage('Complete more challenges to unlock!');
        return;
      }

      if (data.url) {
        // Zoom to block then navigate
        const [x, y, z] = data.coord;
        this.flyTo(x, y, z, 500);
        setTimeout(() => {
          window.location.href = data.url;
        }, 600);
      }
    }
  },

  // Handle hover
  onHover(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([...this.blocks.values()]);

    // Reset all blocks
    this.blocks.forEach(mesh => {
      mesh.material.emissiveIntensity = 0.2;
      mesh.scale.set(1, 1, 1);
    });

    // Highlight hovered
    if (intersects.length > 0) {
      const mesh = intersects[0].object;
      mesh.material.emissiveIntensity = 0.5;
      mesh.scale.set(1.1, 1.1, 1.1);
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  },

  // Show floating message
  showMessage(text) {
    const div = document.createElement('div');
    div.className = 'world-message';
    div.textContent = text;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 2000);
  },

  // Window resize
  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  },

  // Animation loop
  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();

    // Rotate blocks slightly
    this.blocks.forEach(mesh => {
      mesh.rotation.y += 0.002;
    });

    this.renderer.render(this.scene, this.camera);
  },

  // Generate coordinates in 1000³ space
  coordAt(index) {
    const x = index % this.SIZE;
    const y = Math.floor(index / this.SIZE) % this.SIZE;
    const z = Math.floor(index / (this.SIZE * this.SIZE));
    return [x, y, z];
  },

  // Index from coordinates
  indexAt(x, y, z) {
    return x + y * this.SIZE + z * this.SIZE * this.SIZE;
  }
};

if (typeof module !== 'undefined') module.exports = WORLD;
