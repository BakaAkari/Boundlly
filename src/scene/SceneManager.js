import * as THREE from 'three';

export class SceneManager {
  constructor(container) {
    this.container = container;
    
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLights();
    this.createSkybox();
    
    this.handleResize();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x000000, 50, 300);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
  }

  createLights() {
    // 环境光（提高强度以确保基础照明）
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    this.scene.add(ambientLight);

    // 太阳光源（强烈的黄白色方向光）
    const sunLight = new THREE.DirectionalLight(0xffffee, 2.5);
    sunLight.position.set(100, 50, 100);
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    // 添加太阳视觉对象（可选，让玩家看到太阳位置）
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffff88,
      fog: false
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.copy(sunLight.position);
    this.scene.add(sun);

    // 地球光源（蓝色点光源）
    const earthLight = new THREE.PointLight(0x4488ff, 1.5, 400);
    earthLight.position.set(-80, -30, -80);
    this.scene.add(earthLight);

    // 添加地球视觉对象
    const earthGeometry = new THREE.SphereGeometry(15, 32, 32);
    const earthMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x2244ff,
      fog: false
    });
    const earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.copy(earthLight.position);
    this.scene.add(earth);

    // 添加地球大气层效果
    const atmosphereGeometry = new THREE.SphereGeometry(16, 32, 32);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    atmosphere.position.copy(earthLight.position);
    this.scene.add(atmosphere);

    // 保存引用以便后续使用
    this.sunLight = sunLight;
    this.earthLight = earthLight;
  }

  createSkybox() {
    // 创建简单的星空背景
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      transparent: true,
      opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    this.scene.add(stars);

    // 添加渐变背景色
    this.scene.background = new THREE.Color(0x000511);
  }

  handleResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}

