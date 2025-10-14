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
    // 太空中没有雾效果
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000 // 合理的裁剪面，背景物体不受限制
    );
    this.camera.position.set(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      logarithmicDepthBuffer: true // 对数深度缓冲，提高远距离精度
    });
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
    this.sunDirection = new THREE.Vector3(1, 0.5, 1).normalize(); // 太阳方向
    sunLight.position.set(
      this.sunDirection.x * 1000,
      this.sunDirection.y * 1000,
      this.sunDirection.z * 1000
    );
    sunLight.castShadow = true;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    this.scene.add(sunLight);

    // 创建背景太阳（不受深度影响）
    this.createBackgroundSun();
    
    // 创建背景地球（不受深度影响）
    this.createBackgroundEarth();
    
    // 保存引用
    this.sunLight = sunLight;
  }

  createBackgroundSun() {
    // 太阳视觉对象（背景层）
    const sunGeometry = new THREE.SphereGeometry(150, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffdd44,
      depthWrite: false,
      depthTest: false
    });
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.renderOrder = -1000; // 背景渲染
    this.scene.add(this.sun);
    
    // 太阳光晕
    const glowGeometry = new THREE.SphereGeometry(165, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false
    });
    this.sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.sunGlow.renderOrder = -1001;
    this.scene.add(this.sunGlow);
  }

  createBackgroundEarth() {
    // 地球视觉对象（背景层）
    const earthGeometry = new THREE.SphereGeometry(400, 64, 64);
    
    // 创建程序化地球纹理（模拟海洋和陆地）
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // 绘制海洋背景
    ctx.fillStyle = '#1a5f8a'; // 海洋蓝
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 添加随机"陆地"斑块
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 100 + 50;
      
      // 绿色/褐色陆地
      const landColor = Math.random() > 0.5 ? '#2d5016' : '#4a3c28';
      ctx.fillStyle = landColor;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // 创建纹理
    const earthTexture = new THREE.CanvasTexture(canvas);
    earthTexture.needsUpdate = true;
    
    const earthMaterial = new THREE.MeshBasicMaterial({ 
      map: earthTexture,
      depthWrite: false,
      depthTest: false
    });
    this.earth = new THREE.Mesh(earthGeometry, earthMaterial);
    this.earth.renderOrder = -900;
    this.scene.add(this.earth);

    // 添加云层
    const cloudGeometry = new THREE.SphereGeometry(404, 64, 64);
    
    // 创建云层纹理
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cloudCtx = cloudCanvas.getContext('2d');
    
    // 绘制随机云
    cloudCtx.fillStyle = 'transparent';
    cloudCtx.fillRect(0, 0, cloudCanvas.width, cloudCanvas.height);
    
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * cloudCanvas.width;
      const y = Math.random() * cloudCanvas.height;
      const size = Math.random() * 80 + 20;
      
      cloudCtx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
      cloudCtx.beginPath();
      cloudCtx.arc(x, y, size, 0, Math.PI * 2);
      cloudCtx.fill();
    }
    
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    
    const cloudMaterial = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      depthTest: false
    });
    this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.clouds.renderOrder = -899;
    this.scene.add(this.clouds);

    // 添加大气层效果
    const atmosphereGeometry = new THREE.SphereGeometry(420, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x6699ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
      depthWrite: false,
      depthTest: false
    });
    this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.atmosphere.renderOrder = -898;
    this.scene.add(this.atmosphere);
  }

  createSkybox() {
    // 创建星空背景
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false,
      depthWrite: false,
      depthTest: false
    });

    const starsVertices = [];
    for (let i = 0; i < 20000; i++) {
      const x = (Math.random() - 0.5) * 5000;
      const y = (Math.random() - 0.5) * 5000;
      const z = (Math.random() - 0.5) * 5000;
      starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(starsVertices, 3)
    );

    this.stars = new THREE.Points(starsGeometry, starsMaterial);
    this.stars.renderOrder = -1002;
    this.scene.add(this.stars);

    // 添加深空背景色
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
    // 更新背景对象位置（跟随相机，保持相对位置）
    const earthDirection = new THREE.Vector3(-0.6, -0.3, -0.6).normalize();
    const earthDistance = 1200; // 背景距离
    
    if (this.earth) {
      this.earth.position.copy(this.camera.position)
        .add(earthDirection.clone().multiplyScalar(earthDistance));
      this.earth.rotation.y += 0.0001; // 缓慢自转
    }
    
    if (this.clouds) {
      this.clouds.position.copy(this.earth.position);
      this.clouds.rotation.y += 0.00015; // 稍快旋转
    }
    
    if (this.atmosphere) {
      this.atmosphere.position.copy(this.earth.position);
    }
    
    // 更新太阳位置
    if (this.sun) {
      this.sun.position.copy(this.camera.position)
        .add(this.sunDirection.clone().multiplyScalar(3000));
    }
    
    if (this.sunGlow) {
      this.sunGlow.position.copy(this.sun.position);
    }
    
    // 星空跟随相机
    if (this.stars) {
      this.stars.position.copy(this.camera.position);
    }
    
    this.renderer.render(this.scene, this.camera);
  }
}

