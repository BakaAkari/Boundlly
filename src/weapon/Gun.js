import * as THREE from 'three';
import { gsap } from 'gsap';

export class Gun {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    this.raycaster = new THREE.Raycaster();
    
    this.ammo = 30;
    this.totalAmmo = 120;
    this.isReloading = false;
    
    this.createGunModel();
    this.updateAmmoUI();
  }

  createGunModel() {
    // 创建简单的枪械模型（两个立方体组成）
    const gunGroup = new THREE.Group();
    
    // 枪身
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 0, 0);
    gunGroup.add(body);
    
    // 枪管
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const barrelMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      metalness: 0.9,
      roughness: 0.1
    });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.03, -0.35);
    gunGroup.add(barrel);
    
    // 枪口火焰（初始隐藏）
    const flashGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      transparent: true,
      opacity: 0
    });
    this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.muzzleFlash.position.set(0, 0.03, -0.5);
    gunGroup.add(this.muzzleFlash);
    
    // 添加点光源（枪口光）
    this.muzzleLight = new THREE.PointLight(0xffaa00, 0, 5);
    this.muzzleLight.position.set(0, 0.03, -0.5);
    gunGroup.add(this.muzzleLight);
    
    // 为枪械添加专用光源（确保枪械始终被照亮）
    const gunLight = new THREE.PointLight(0xffffff, 1, 2);
    gunLight.position.set(0, 0.1, -0.2);
    gunGroup.add(gunLight);
    
    // 定位枪械（在相机前方右下角）
    gunGroup.position.set(0.15, -0.15, -0.3);
    
    // 将枪械添加到相机
    this.camera.add(gunGroup);
    this.gunGroup = gunGroup;
    
    // 确保相机被添加到场景
    if (!this.camera.parent) {
      this.scene.add(this.camera);
    }
  }

  shoot(asteroids) {
    if (this.ammo <= 0 || this.isReloading) {
      return;
    }
    
    this.ammo--;
    this.updateAmmoUI();
    
    // 后坐力动画
    gsap.to(this.gunGroup.position, {
      z: -0.25,
      duration: 0.05,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out'
    });
    
    // 枪口火焰
    this.showMuzzleFlash();
    
    // 射线检测
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    // 检测命中
    const meshes = asteroids.map(a => a.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      
      // 找到被击中的碎石
      const asteroid = asteroids.find(a => a.mesh === hit.object);
      if (asteroid) {
        // 应用冲击力
        const force = new THREE.Vector3()
          .copy(hit.point)
          .sub(asteroid.body.position)
          .normalize()
          .multiplyScalar(50);
        
        asteroid.body.applyImpulse(
          { x: force.x, y: force.y, z: force.z },
          { x: hit.point.x, y: hit.point.y, z: hit.point.z }
        );
        
        // 创建击中特效
        this.createHitEffect(hit.point);
      }
    }
    
    // 自动装填
    if (this.ammo === 0 && this.totalAmmo > 0) {
      this.reload();
    }
  }

  showMuzzleFlash() {
    // 显示枪口火焰
    this.muzzleFlash.material.opacity = 1;
    this.muzzleLight.intensity = 2;
    
    gsap.to(this.muzzleFlash.material, {
      opacity: 0,
      duration: 0.1
    });
    
    gsap.to(this.muzzleLight, {
      intensity: 0,
      duration: 0.1
    });
  }

  createHitEffect(position) {
    // 创建简单的击中粒子效果
    const particleCount = 10;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions.push(position.x, position.y, position.z);
      velocities.push(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0xff6600,
      size: 0.1,
      transparent: true,
      opacity: 1
    });
    
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    // 粒子动画
    gsap.to(material, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.scene.remove(particles);
        geometry.dispose();
        material.dispose();
      }
    });
  }

  reload() {
    if (this.isReloading || this.totalAmmo === 0) return;
    
    this.isReloading = true;
    
    setTimeout(() => {
      const needed = 30 - this.ammo;
      const toReload = Math.min(needed, this.totalAmmo);
      this.ammo += toReload;
      this.totalAmmo -= toReload;
      this.isReloading = false;
      this.updateAmmoUI();
    }, 1500);
  }

  updateAmmoUI() {
    const ammoElement = document.getElementById('ammo');
    if (ammoElement) {
      ammoElement.textContent = `弹药: ${this.ammo}/${this.totalAmmo}`;
    }
  }

  update(delta, time) {
    // 轻微的呼吸动画
    if (this.gunGroup) {
      this.gunGroup.position.y = -0.15 + Math.sin(time * 2) * 0.005;
    }
  }
}

