import * as THREE from 'three';
import { gsap } from 'gsap';

export class BaseWeapon {
  constructor(camera, scene, config) {
    this.camera = camera;
    this.scene = scene;
    
    // 武器配置
    this.name = config.name || '未命名';
    this.ammo = config.ammo || 30;
    this.maxAmmo = config.ammo || 30;
    this.totalAmmo = config.totalAmmo || 120;
    this.fireRate = config.fireRate || 600; // 每分钟射速
    this.damage = config.damage || 20;
    this.reloadTime = config.reloadTime || 1500;
    this.recoil = config.recoil || 0.05;
    
    // 射击间隔（毫秒）
    this.fireInterval = 60000 / this.fireRate;
    this.lastFireTime = 0;
    
    this.isReloading = false;
    this.raycaster = new THREE.Raycaster();
    
    // 保存模型配置
    this.modelConfig = config.modelConfig;
    
    this.createModel(config.modelConfig);
  }

  createModel(modelConfig) {
    // 基础枪械模型
    this.gunGroup = new THREE.Group();
    
    // 枪身
    const bodyGeometry = new THREE.BoxGeometry(
      modelConfig.bodySize.x,
      modelConfig.bodySize.y,
      modelConfig.bodySize.z
    );
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: modelConfig.color,
      metalness: 0.8,
      roughness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.gunGroup.add(body);
    
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
    this.gunGroup.add(barrel);
    
    // 枪口火焰
    const flashGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffaa00,
      transparent: true,
      opacity: 0
    });
    this.muzzleFlash = new THREE.Mesh(flashGeometry, flashMaterial);
    this.muzzleFlash.position.set(0, 0.03, -0.5);
    this.gunGroup.add(this.muzzleFlash);
    
    // 枪口光源
    this.muzzleLight = new THREE.PointLight(0xffaa00, 0, 5);
    this.muzzleLight.position.set(0, 0.03, -0.5);
    this.gunGroup.add(this.muzzleLight);
    
    // 武器专用光源
    const gunLight = new THREE.PointLight(0xffffff, 1, 2);
    gunLight.position.set(0, 0.1, -0.2);
    this.gunGroup.add(gunLight);
    
    // 定位
    this.gunGroup.position.set(0.15, -0.15, -0.3);
    this.gunGroup.renderOrder = 0;
    
    // 添加到相机
    this.camera.add(this.gunGroup);
    this.gunGroup.visible = false;
    
    // 确保相机在场景中
    if (!this.camera.parent) {
      this.scene.add(this.camera);
    }
  }

  canShoot() {
    const now = Date.now();
    return !this.isReloading && 
           this.ammo > 0 && 
           (now - this.lastFireTime >= this.fireInterval);
  }

  shoot(asteroids, otherPlayers = []) {
    if (!this.canShoot()) return null;
    
    this.ammo--;
    this.lastFireTime = Date.now();
    
    // 后坐力
    this.applyRecoil();
    
    // 枪口火焰
    this.showMuzzleFlash();
    
    // 射线检测
    const hitResult = this.performRaycast(asteroids, otherPlayers);
    
    // 自动装填
    if (this.ammo === 0 && this.totalAmmo > 0) {
      this.reload();
    }
    
    return hitResult;
  }

  performRaycast(asteroids, otherPlayers) {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    let hitResult = null;
    
    // 检测玩家
    if (otherPlayers && otherPlayers.length > 0) {
      const playerMeshes = otherPlayers.map(p => p.group);
      const playerIntersects = this.raycaster.intersectObjects(playerMeshes, true);
      
      if (playerIntersects.length > 0) {
        const hit = playerIntersects[0];
        const hitPlayer = otherPlayers.find(p => 
          p.group === hit.object || p.group === hit.object.parent
        );
        
        if (hitPlayer) {
          this.createHitEffect(hit.point);
          hitResult = {
            type: 'player',
            playerId: hitPlayer.id,
            damage: this.damage
          };
          return hitResult;
        }
      }
    }
    
    // 检测小行星
    const meshes = asteroids.map(a => a.mesh);
    const intersects = this.raycaster.intersectObjects(meshes);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const asteroid = asteroids.find(a => a.mesh === hit.object);
      if (asteroid) {
        const force = new THREE.Vector3()
          .copy(hit.point)
          .sub(asteroid.body.position)
          .normalize()
          .multiplyScalar(50);
        
        asteroid.body.applyImpulse(
          { x: force.x, y: force.y, z: force.z },
          { x: hit.point.x, y: hit.point.y, z: hit.point.z }
        );
        
        this.createHitEffect(hit.point);
      }
    }
    
    return hitResult;
  }

  applyRecoil() {
    gsap.to(this.gunGroup.position, {
      z: -0.25,
      duration: this.recoil,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out'
    });
  }

  showMuzzleFlash() {
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
    const particleCount = 10;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < particleCount; i++) {
      positions.push(position.x, position.y, position.z);
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
    if (this.isReloading || this.totalAmmo === 0 || this.ammo === this.maxAmmo) return;
    
    this.isReloading = true;
    
    setTimeout(() => {
      const needed = this.maxAmmo - this.ammo;
      const toReload = Math.min(needed, this.totalAmmo);
      this.ammo += toReload;
      this.totalAmmo -= toReload;
      this.isReloading = false;
    }, this.reloadTime);
  }

  show() {
    if (this.gunGroup) {
      this.gunGroup.visible = true;
    }
  }

  hide() {
    if (this.gunGroup) {
      this.gunGroup.visible = false;
    }
  }

  update(delta, time) {
    // 呼吸动画
    if (this.gunGroup && this.gunGroup.visible) {
      this.gunGroup.position.y = -0.15 + Math.sin(time * 2) * 0.005;
    }
  }
}

