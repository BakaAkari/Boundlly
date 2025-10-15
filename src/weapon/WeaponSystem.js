import { AssaultRifle } from './weapons/AssaultRifle.js';
import { Shotgun } from './weapons/Shotgun.js';
import { Sniper } from './weapons/Sniper.js';

export class WeaponSystem {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;
    
    // 创建所有武器
    this.weapons = [
      new AssaultRifle(camera, scene),
      new Shotgun(camera, scene),
      new Sniper(camera, scene)
    ];
    
    this.currentWeaponIndex = 0;
    this.currentWeapon = this.weapons[0];
    
    // 射击状态
    this.isShooting = false;
    this.mouseDown = false;
    
    // 显示当前武器
    this.switchWeapon(0);
    this.updateWeaponUI();
  }

  switchWeapon(index) {
    // 隐藏当前武器
    if (this.currentWeapon) {
      this.currentWeapon.hide();
    }
    
    // 切换武器
    this.currentWeaponIndex = index;
    this.currentWeapon = this.weapons[index];
    
    // 显示新武器
    this.currentWeapon.show();
    this.updateWeaponUI();
  }

  nextWeapon() {
    const nextIndex = (this.currentWeaponIndex + 1) % this.weapons.length;
    this.switchWeapon(nextIndex);
  }

  previousWeapon() {
    const prevIndex = (this.currentWeaponIndex - 1 + this.weapons.length) % this.weapons.length;
    this.switchWeapon(prevIndex);
  }

  startShooting() {
    this.mouseDown = true;
  }

  stopShooting() {
    this.mouseDown = false;
  }

  shoot(asteroids, otherPlayers) {
    return this.currentWeapon.shoot(asteroids, otherPlayers);
  }

  reload() {
    this.currentWeapon.reload();
  }

  update(delta, time) {
    // 更新所有武器
    this.weapons.forEach(weapon => {
      weapon.update(delta, time);
    });
    
    // 自动连发
    if (this.mouseDown && this.currentWeapon.canShoot()) {
      this.isShooting = true;
    }
  }

  updateWeaponUI() {
    const weaponElement = document.getElementById('weapon-name');
    const ammoElement = document.getElementById('ammo');
    
    if (weaponElement) {
      weaponElement.textContent = `武器: ${this.currentWeapon.name}`;
    }
    
    if (ammoElement) {
      if (this.currentWeapon.isReloading) {
        ammoElement.textContent = `弹药: 装填中...`;
      } else {
        ammoElement.textContent = `弹药: ${this.currentWeapon.ammo}/${this.currentWeapon.totalAmmo}`;
      }
    }
  }

  getCurrentWeapon() {
    return this.currentWeapon;
  }
}

