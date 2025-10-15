import { BaseWeapon } from '../BaseWeapon.js';

export class Sniper extends BaseWeapon {
  constructor(camera, scene) {
    super(camera, scene, {
      name: '狙击枪',
      ammo: 5,
      totalAmmo: 25,
      fireRate: 60, // 每分钟60发
      damage: 50,
      reloadTime: 2500,
      recoil: 0.2,
      modelConfig: {
        bodySize: { x: 0.08, y: 0.08, z: 0.6 },
        color: 0x1a4d2e
      }
    });
  }
}

