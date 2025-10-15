import { BaseWeapon } from '../BaseWeapon.js';
import * as THREE from 'three';

export class Shotgun extends BaseWeapon {
  constructor(camera, scene) {
    super(camera, scene, {
      name: '霰弹枪',
      ammo: 8,
      totalAmmo: 32,
      fireRate: 120, // 每分钟120发
      damage: 15, // 每颗弹丸伤害
      reloadTime: 2000,
      recoil: 0.15,
      modelConfig: {
        bodySize: { x: 0.12, y: 0.12, z: 0.5 },
        color: 0x4a3c28
      }
    });
    
    this.pelletCount = 8; // 每次发射8颗弹丸
  }

  performRaycast(asteroids, otherPlayers) {
    // 霰弹枪发射多个射线
    const hitResults = [];
    
    for (let i = 0; i < this.pelletCount; i++) {
      // 随机散布
      const spreadX = (Math.random() - 0.5) * 0.1;
      const spreadY = (Math.random() - 0.5) * 0.1;
      
      this.raycaster.setFromCamera(
        new THREE.Vector2(spreadX, spreadY), 
        this.camera
      );
      
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
            hitResults.push({
              type: 'player',
              playerId: hitPlayer.id,
              damage: this.damage
            });
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
            .multiplyScalar(30);
          
          asteroid.body.applyImpulse(
            { x: force.x, y: force.y, z: force.z },
            { x: hit.point.x, y: hit.point.y, z: hit.point.z }
          );
          
          this.createHitEffect(hit.point);
        }
      }
    }
    
    // 返回第一个玩家命中（如果有）
    return hitResults.find(r => r.type === 'player') || null;
  }
}

