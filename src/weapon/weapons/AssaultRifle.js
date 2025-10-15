import { BaseWeapon } from '../BaseWeapon.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class AssaultRifle extends BaseWeapon {
  constructor(camera, scene) {
    super(camera, scene, {
      name: '突击步枪',
      ammo: 30,
      totalAmmo: 120,
      fireRate: 600, // 每分钟600发
      damage: 20,
      reloadTime: 1500,
      recoil: 0.05,
      modelConfig: {
        bodySize: { x: 0.1, y: 0.1, z: 0.4 },
        color: 0x333333,
        useExternalModel: false, // 设为true启用外部模型
        modelPath: '/models/assault_rifle.glb' // 模型路径
      }
    });
    
    // 如果需要加载外部模型
    if (this.modelConfig.useExternalModel) {
      this.loadExternalModel();
    }
  }

  loadExternalModel() {
    const loader = new GLTFLoader();
    
    loader.load(
      this.modelConfig.modelPath,
      (gltf) => {
        // 移除默认模型
        this.gunGroup.clear();
        
        // 添加加载的模型
        const model = gltf.scene;
        model.scale.set(0.1, 0.1, 0.1); // 调整缩放
        model.position.set(0, 0, 0);
        model.rotation.set(0, Math.PI, 0); // 调整朝向
        
        this.gunGroup.add(model);
        
        // 重新添加枪口火焰和光源
        this.gunGroup.add(this.muzzleFlash);
        this.gunGroup.add(this.muzzleLight);
        
        console.log('突击步枪模型加载成功');
      },
      (progress) => {
        console.log(`加载进度: ${(progress.loaded / progress.total * 100).toFixed(2)}%`);
      },
      (error) => {
        console.error('模型加载失败，使用默认模型', error);
      }
    );
  }
}

