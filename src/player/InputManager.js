export class InputManager {
  constructor() {
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      up: false,
      down: false,
      boost: false,
      barrelRollLeft: false,
      barrelRollRight: false
    };

    this.setupKeyboardEvents();
  }

  setupKeyboardEvents() {
    document.addEventListener('keydown', (event) => {
      this.handleKeyDown(event);
    });

    document.addEventListener('keyup', (event) => {
      this.handleKeyUp(event);
    });
  }

  handleKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = true;
        break;
      case 'KeyS':
        this.keys.backward = true;
        break;
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'Space':
        this.keys.up = true;
        break;
      case 'KeyC':
        this.keys.down = true;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = true;
        break;
      case 'KeyQ':
        this.keys.barrelRollLeft = true;
        break;
      case 'KeyE':
        this.keys.barrelRollRight = true;
        break;
    }
  }

  handleKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.keys.forward = false;
        break;
      case 'KeyS':
        this.keys.backward = false;
        break;
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.up = false;
        break;
      case 'KeyC':
        this.keys.down = false;
        break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.keys.boost = false;
        break;
      case 'KeyQ':
        this.keys.barrelRollLeft = false;
        break;
      case 'KeyE':
        this.keys.barrelRollRight = false;
        break;
    }
  }

  isMoving() {
    return (
      this.keys.forward ||
      this.keys.backward ||
      this.keys.left ||
      this.keys.right ||
      this.keys.up ||
      this.keys.down
    );
  }
}

