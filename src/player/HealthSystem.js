export class HealthSystem {
  constructor(onRespawnCallback = null) {
    this.maxHealth = 100;
    this.currentHealth = 100;
    this.isDead = false;
    
    // 回复相关
    this.regenRate = 3; // 每秒回复3点
    this.regenDelay = 5; // 5秒延迟
    this.timeSinceLastDamage = 0;
    
    // 回调函数
    this.onRespawnCallback = onRespawnCallback;
    
    // UI元素
    this.createUI();
  }

  createUI() {
    // 创建血量条容器
    const healthBarContainer = document.createElement('div');
    healthBarContainer.id = 'health-bar-container';
    healthBarContainer.style.cssText = `
      position: fixed;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      width: 300px;
      height: 30px;
      background: rgba(0, 0, 0, 0.5);
      border: 2px solid #fff;
      border-radius: 5px;
      overflow: hidden;
      z-index: 1000;
    `;
    
    // 血量条
    const healthBar = document.createElement('div');
    healthBar.id = 'health-bar';
    healthBar.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(to right, #ff0000, #ff6b6b);
      transition: width 0.3s ease;
    `;
    
    // 血量文字
    const healthText = document.createElement('div');
    healthText.id = 'health-text';
    healthText.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-weight: bold;
      font-size: 16px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    healthText.textContent = `${this.currentHealth} / ${this.maxHealth}`;
    
    healthBarContainer.appendChild(healthBar);
    healthBarContainer.appendChild(healthText);
    document.body.appendChild(healthBarContainer);
    
    // 死亡屏幕
    const deathScreen = document.createElement('div');
    deathScreen.id = 'death-screen';
    deathScreen.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.3);
      display: none;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      z-index: 2000;
      cursor: pointer;
    `;
    
    const deathText = document.createElement('div');
    deathText.style.cssText = `
      font-size: 48px;
      color: white;
      font-weight: bold;
      text-shadow: 4px 4px 8px rgba(0, 0, 0, 0.8);
      margin-bottom: 20px;
    `;
    deathText.textContent = '你已阵亡';
    
    const respawnText = document.createElement('div');
    respawnText.style.cssText = `
      font-size: 24px;
      color: white;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    `;
    respawnText.textContent = '点击屏幕重生';
    
    deathScreen.appendChild(deathText);
    deathScreen.appendChild(respawnText);
    document.body.appendChild(deathScreen);
    
    // 点击重生
    deathScreen.addEventListener('click', () => {
      if (this.onRespawnCallback) {
        this.onRespawnCallback();
      } else {
        this.respawn();
      }
    });
  }

  takeDamage(amount) {
    if (this.isDead) return;
    
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.timeSinceLastDamage = 0;
    
    this.updateUI();
    
    // 检查是否死亡
    if (this.currentHealth <= 0) {
      this.die();
    } else {
      // 受伤闪红效果
      this.showDamageEffect();
    }
  }

  heal(amount) {
    if (this.isDead) return;
    
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
    this.updateUI();
  }

  die() {
    this.isDead = true;
    this.currentHealth = 0;
    this.updateUI();
    
    // 显示死亡屏幕
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
      deathScreen.style.display = 'flex';
    }
  }

  respawn() {
    this.isDead = false;
    this.currentHealth = this.maxHealth;
    this.timeSinceLastDamage = 0;
    this.updateUI();
    
    // 隐藏死亡屏幕
    const deathScreen = document.getElementById('death-screen');
    if (deathScreen) {
      deathScreen.style.display = 'none';
    }
    
    return true; // 返回true表示重生成功
  }

  update(delta) {
    if (this.isDead) return;
    
    // 更新上次受伤时间
    this.timeSinceLastDamage += delta;
    
    // 如果5秒内没有受伤，开始回复
    if (this.timeSinceLastDamage >= this.regenDelay && this.currentHealth < this.maxHealth) {
      const regenAmount = this.regenRate * delta;
      this.heal(regenAmount);
    }
  }

  updateUI() {
    const healthBar = document.getElementById('health-bar');
    const healthText = document.getElementById('health-text');
    
    if (healthBar) {
      const percentage = (this.currentHealth / this.maxHealth) * 100;
      healthBar.style.width = `${percentage}%`;
      
      // 根据血量改变颜色
      if (percentage > 60) {
        healthBar.style.background = 'linear-gradient(to right, #00ff00, #66ff66)';
      } else if (percentage > 30) {
        healthBar.style.background = 'linear-gradient(to right, #ffaa00, #ffcc66)';
      } else {
        healthBar.style.background = 'linear-gradient(to right, #ff0000, #ff6b6b)';
      }
    }
    
    if (healthText) {
      healthText.textContent = `${Math.ceil(this.currentHealth)} / ${this.maxHealth}`;
    }
  }

  showDamageEffect() {
    // 创建红色闪烁效果
    const damageOverlay = document.createElement('div');
    damageOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 0, 0, 0.3);
      pointer-events: none;
      z-index: 1500;
      animation: fadeOut 0.3s ease;
    `;
    
    // 添加动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(damageOverlay);
    
    // 0.3秒后移除
    setTimeout(() => {
      damageOverlay.remove();
    }, 300);
  }

  getHealth() {
    return this.currentHealth;
  }

  getMaxHealth() {
    return this.maxHealth;
  }

  isAlive() {
    return !this.isDead;
  }
}

