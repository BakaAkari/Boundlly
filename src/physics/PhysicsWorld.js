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

