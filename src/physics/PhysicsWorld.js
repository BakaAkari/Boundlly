import * as CANNON from 'cannon-es';

export class PhysicsWorld {
  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, 0, 0); // 太空中无重力
    
    // 设置求解器
    this.world.solver.iterations = 10;
    this.world.solver.tolerance = 0.01;
    
    // 设置碰撞检测
    this.world.broadphase = new CANNON.NaiveBroadphase();
    this.world.allowSleep = true;
    
    // 固定时间步长
    this.fixedTimeStep = 1.0 / 60.0;
    this.maxSubSteps = 3;
    
    // 创建物理材质
    this.createMaterials();
  }

  createMaterials() {
    // 玩家材质
    this.playerMaterial = new CANNON.Material('player');
    
    // 关卡材质
    this.levelMaterial = new CANNON.Material('level');
    
    // 小行星材质
    this.asteroidMaterial = new CANNON.Material('asteroid');
    
    // 创建材质间的接触材质
    // 玩家与关卡碰撞
    const playerLevelContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.levelMaterial,
      {
        friction: 0.5,
        restitution: 0.1,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(playerLevelContact);
    
    // 玩家与小行星碰撞
    const playerAsteroidContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.asteroidMaterial,
      {
        friction: 0.3,
        restitution: 0.4,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(playerAsteroidContact);
    
    // 小行星与关卡碰撞
    const asteroidLevelContact = new CANNON.ContactMaterial(
      this.asteroidMaterial,
      this.levelMaterial,
      {
        friction: 0.8,
        restitution: 0.2,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(asteroidLevelContact);
    
    // 玩家与玩家碰撞
    const playerPlayerContact = new CANNON.ContactMaterial(
      this.playerMaterial,
      this.playerMaterial,
      {
        friction: 0.1,
        restitution: 0.3,
        contactEquationStiffness: 1e8,
        contactEquationRelaxation: 3
      }
    );
    this.world.addContactMaterial(playerPlayerContact);
    
    console.log('✓ 物理材质和碰撞规则已创建');
  }

  update(delta) {
    this.world.step(this.fixedTimeStep, delta, this.maxSubSteps);
  }

  addBody(body) {
    this.world.addBody(body);
  }

  removeBody(body) {
    this.world.removeBody(body);
  }
}

