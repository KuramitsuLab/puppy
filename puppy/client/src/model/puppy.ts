import * as Matter from 'matter-js';
import * as api from './api';
import { myRender } from './render';
import { shapeFuncMap, ShapeOptions, isShapeOptions, Circle, Rectangle, Polygon, Trapezoid, Label, PuppyShapeBase } from './shape';

const Bodies = Matter.Bodies;
const Engine = Matter.Engine;
const Runner = Matter.Runner;
const Render = myRender(Matter.Render);
const Constraint = Matter.Constraint;
const MouseConstraint = Matter.MouseConstraint;
const Mouse = Matter.Mouse;
const World = Matter.World;
const Bounds = Matter.Bounds;
const Vertices = Matter.Vertices;
const Detector = Matter['Detector'];
const Common = Matter['Common'];

export type Code = {
  world: any,
  bodies: any[],
  main: (Matter, puppy: Puppy) => IterableIterator<void>;
  errors?: {}[],
  rules?: any,
};

// (Puppy, {}) -> (number, number, number) -> any
export class Puppy {
  private runner: Matter.Runner;
  private engine: Matter.Engine;
  private render: Matter.Render;
  private canvas: HTMLCanvasElement;

  // private debug_mode: boolean;

  private width: number;    /* world.width */
  private height: number;   /* world.height */
  private vars: {};
  private main: (Matter, puppy: Puppy) => IterableIterator<void>;
  private isRestart: boolean = false;
  private isStep: boolean = false;

  private eachUpdate: (time: number) => void;

  // new puppy
  public constructor(canvasid: string, code: Code) {
    this.width = code.world.width || 1000;
    this.height = code.world.height || this.width;
    this.engine = Engine.create();

    if (code.world.gravity) {
      const engine = this.engine;
      if (code.world.gravity) {
        engine.world.gravity = code.world.gravity;
        // ジャイロスコープ
        // デバイスの傾きで重力の向きを調整する
        // https://github.com/liabru/matter-js/blob/master/examples/gyro.js
        window.addEventListener('deviceorientation', (event) => {
          const orientation = window.orientation || 0;
          const gravity = engine.world.gravity;
          if (orientation === 0) {
            gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
            gravity.y = Common.clamp(event.beta, -90, 90) / 90;
          } else if (orientation === 180) {
            gravity.x = Common.clamp(event.gamma, -90, 90) / 90;
            gravity.y = Common.clamp(-event.beta, -90, 90) / 90;
          } else if (orientation === 90) {
            gravity.x = Common.clamp(event.beta, -90, 90) / 90;
            gravity.y = Common.clamp(-event.gamma, -90, 90) / 90;
          } else if (orientation === -90) {
            gravity.x = Common.clamp(-event.beta, -90, 90) / 90;
            gravity.y = Common.clamp(event.gamma, -90, 90) / 90;
          }
        });
      }
    }

    Matter.Events.on(this.engine, 'beforeUpdate', (event: Matter.IEventTimestamped<Matter.Engine>) => {
      const time = this.engine.timing.timestamp;
      if (this.eachUpdate) {
        this.eachUpdate(time);
      }
      const bodies = Matter.Composite.allBodies(this.engine.world);
      for (let i = 0; i < bodies.length; i += 1) {
        const body: Matter.Body = bodies[i];
        if (body['eachUpdate']) {
          body['eachUpdate'](body, time);
        }
      }
      /*
      for (const rule of this.rules) {
        for (let i = 0; i < bodies.length; i += 1) {
          const body: Matter.Body = bodies[i];
          for (let k = body.parts.length > 1 ? 1 : 0; k < body.parts.length; k += 1) {
            const part = body.parts[k];
            if (rule.matchFunc(part)) {
              rule.actionFunc(body, this.engine);
            }
          }
        }
      }
      */
    });
    Matter.Events.on(this.engine, 'collisionActive', (event) => {
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i += 1) {
        const pair = pairs[i];
        if (pair.bodyA['collisionActive']) {
          pair.bodyA['collisionActive'](pair.bodyA, pair.bodyB);
        }
        if (pair.bodyB['collisionActive']) {
          pair.bodyB['collisionActive'](pair.bodyB, pair.bodyA);
        }
      }
    });
    Matter.Events.on(this.engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i += 1) {
        const pair = pairs[i];
        if (pair.bodyA['collisionStart']) {
          pair.bodyA['collisionStart'](pair.bodyA, pair.bodyB);
        }
        if (pair.bodyB['collisionStart']) {
          pair.bodyB['collisionStart'](pair.bodyB, pair.bodyA);
        }
      }
    });
    Matter.Events.on(this.engine, 'collisionEnd', (event) => {
      const pairs = event.pairs;
      for (let i = 0; i < pairs.length; i += 1) {
        const pair = pairs[i];
        if (pair.bodyA['collisionEnd']) {
          pair.bodyA['collisionEnd'](pair.bodyA, pair.bodyB);
        }
        if (pair.bodyB['collisionEnd']) {
          pair.bodyB['collisionEnd'](pair.bodyB, pair.bodyA);
        }
      }
    });
    this.runner = Runner.create({});
    // render
    const canvas = document.getElementById(canvasid);
    let render_width = canvas.clientWidth;
    let render_height = canvas.clientWidth * this.height / this.width;
    if (render_height > canvas.clientHeight) {
      render_height = canvas.clientHeight;
      render_width = canvas.clientHeight * this.width / this.height;
    }
    const render = {
      /* Matter.js の変な仕様 canvas に 描画領域が追加される */
      // element: document.getElementById('canvas'),
      element: canvas,
      engine: this.engine,
      options: {
        /* オブジェクトが枠線のみになる */
        width: render_width,
        height: render_height,
        background: code.world.background || 'rgba(0, 0, 0, 0)',
        wireframes: false,
      },
    };
    this.render = Render.create(render);
    this.canvas = this.render.canvas;
    //
    this.engine.world.bounds = {
      min: { x: 0, y: 0 },
      max: {
        x: this.width,
        y: this.height,
      },
    };
    /* 描画サイズを自動拡大/縮小を設定する */
    Render['lookAt'](this.render, this.engine.world.bounds);
    /* マウス */
    if (code.world.mouse) {
      const mouse = Mouse.create(this.render.canvas);
      const constraintOptions = {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: code.world.mouseStiffness || 0.2,  /* 剛性 */
      };
      constraintOptions['render'] = {
        visible: code.world.mouseVisible || false,
      };
      const mouseConstraint = MouseConstraint.create(this.engine, {
        mouse,
        constraint: Constraint.create(constraintOptions),
      });
      World.add(this.engine.world, mouseConstraint);
      this.render['mouse'] = mouse;

      // an example of using mouse events on a mouse
      Matter.Events.on(mouseConstraint, 'mousedown', (event) => {
        const mouse = event.mouse;
        let body = event.sourcebody;
        const bodies = Matter.Composite.allBodies(this.engine.world);
        for (let i = 0; i < bodies.length; i += 1) {
          body = bodies[i];
          if (Bounds.contains(body.bounds, mouse.position)
            && Detector.canCollide(body.collisionFilter, mouseConstraint.collisionFilter)) {
            for (let j = body.parts.length > 1 ? 1 : 0; j < body.parts.length; j += 1) {
              const part = body.parts[j];
              if (part['clicked'] && Vertices.contains(part.vertices, mouse.position)) {
                part['clicked'](part);
                break;
              }
            }
          }
        }
      });
    }
    //
    this.vars = {
      Circle,
      Rectangle,
      Label,
      Polygon,
      Trapezoid,
      PuppyObject: PuppyShapeBase,
    };
    this.main = code.main || (function* (Matter: any, puppy: Puppy) { });

    Runner.run(this.runner, this.engine); /*物理エンジンを動かす */
    Render.run(this.render); /* 描画開始 */
    this.runner.enabled = false; /*初期位置を描画したら一度止める */
  }

  public dispose() {
    this.isRestart = false;
    if (this.engine) {
      World.clear(this.engine.world, false);
      Engine.clear(this.engine);
    }
    /* engineのアクティブ、非アクティブの制御を行う */
    if (this.runner) {
      Runner.stop(this.runner);
    }
    if (this.render) {
      Render.stop(this.render);
      this.render.canvas.remove();
      this.render.canvas = null;
      this.render.context = null;
      this.render.textures = {};
    }
  }

  // private DefaultRenderOptions: () => Matter.IRenderDefinition;

  public getCanvas() {
    return this.canvas;
  }

  // public requestFullScreen() {
  //   if (this.canvas) { // FIXME
  //     if (this.canvas['webkitRequestFullscreen']) {
  //       this.canvas['webkitRequestFullscreen'](); // Chrome15+, Safari5.1+, Opera15+
  //     } else if (this.canvas['mozRequestFullScreen']) {
  //       this.canvas['mozRequestFullScreen'](); // FF10+
  //     } else if (this.canvas['msRequestFullscreen']) {
  //       this.canvas['msRequestFullscreen'](); // IE11+
  //     } else if (this.canvas['requestFullscreen']) {
  //       this.canvas['requestFullscreen'](); // HTML5 Fullscreen API仕様
  //     } else {
  //       // alert('ご利用のブラウザはフルスクリーン操作に対応していません');
  //       return;
  //     }
  //   }
  // }

  public resize(width: number, height: number) {
    console.log(`'resize width ${width} ${this.canvas.clientWidth} height ${height} ${this.canvas.clientHeight}`);
    let w = width;
    let h = width * this.height / this.width;
    if (h > height) {
      h = height;
      w = height * this.width / this.height;
    }
    this.canvas.setAttribute('width', w.toString());
    this.canvas.setAttribute('height', h.toString());
    console.log('resize width {this.render.options.width} => {w} height {this.render.options.height} => {h}');
    this.render.options.width = w;
    this.render.options.height = h;
  }

  public async wait(sec) {
    await new Promise(resolve => setTimeout(resolve, sec * 1000));
  }

  public async waitForRun(interval) {
    while (!(this.runner.enabled || this.isStep)) {
      await this.wait(interval);
    }
  }

  public async execute_main() {
    for await (const _ of this.main(Matter, this)) {
      if (this.isStep) {
        this.runner.enabled = false;
        this.isStep = false;
      } else {
        await this.wait(0.5);
      }
      await this.waitForRun(1);
    }
    if (this.isStep) {
      this.runner.enabled = true;
      this.isStep = false;
    }
  }

  public start(updateEach = (t: number) => { }) {
    // console.log("start");
    this.eachUpdate = updateEach;
    this.runner.enabled = true;
    if (!this.isRestart) {
      this.isRestart = true;
      this.execute_main();
    }
  }

  public pause() {
    // console.log("pause");
    this.runner.enabled = false;
  }

  public step() {
    this.isStep = true;
    if (!this.isRestart) {
      this.isRestart = true;
      this.execute_main();
    }
  }

  public init() {
    this.isRestart = false;
    if (this.engine) {
      World.clear(this.engine.world, false);
      Engine.clear(this.engine);
    }
    /* engineのアクティブ、非アクティブの制御を行う */
    if (this.runner) {
      Runner.stop(this.runner);
    }
    if (this.render) {
      Render.stop(this.render);
      this.render.canvas.remove();
      this.render.canvas = null;
      this.render.context = null;
      this.render.textures = {};
    }
  }

  public async ready() {
    Runner.run(this.runner, this.engine); /*物理エンジンを動かす */
    Render.run(this.render); /* 描画開始 */
    this.runner.enabled = false; /*初期位置を描画したら一度止める */
    // FIXME
  }

  // Puppy APIs

  public newBody(_options: {}): Matter.Body {
    const max_x = this.engine.world.bounds['max']['x'];
    const max_y = this.engine.world.bounds['max']['y'];
    const options: ShapeOptions = Common.extend({ position: { x: max_x / 2, y: max_y / 2 } }, _options);
    options.shape = options.shape in shapeFuncMap ? options.shape : 'circle';
    const body = shapeFuncMap[options.shape](options);
    return body;
  }

  public newMatter(options: {}): Matter.Body {
    const body = this.newBody(options);
    World.add(this.engine.world, [body]);
    return body;
  }

  public newMatter2(shape: string, xx: number, yy: number, options: {}) {
    if (!options['position']) {
      options['position'] = { x: xx, y: yy };
    }

    options['shape'] = shape;
    const body = this.newBody(options);
    World.add(this.engine.world, [body]);
    return body;
  }

  public print(text: string, options = {}) {
    const width = this.width;
    const _options: ShapeOptions = Common.extend({
      shape: 'label',
      value: `${text}`,
      created: this.engine.timing.timestamp,
      position: { x: this.width, y: Math.random() * this.height },
      eachUpdate: (body, time: number) => {
        const px = width - 100 * (time - body['created']) * 0.003;
        Matter.Body.setPosition(body, { x: px, y: body.position.y });
      },
    },                                           options);
    const body = this.newMatter(_options);
    World.add(this.engine.world, [body]);
    // const commentRule = {
    //   matchFunc: part => part.id === body.id,
    //   actionFunc: (body, engine) => {
    //     const px = 1000 - 100 * (engine.timing.timestamp - invokedTime) * 0.003;
    //     Matter.Body.setPosition(body, { x: px, y: body.position.y });
    //   },
    // };
    // this.rules.push(commentRule);
  }

}

export let puppy: Puppy = null; // new Puppy();

export const loadPuppy = (canvasid: string, code: Code) => {
  const newpuppy = new Puppy(canvasid, code);
  if (puppy != null) {
    puppy.dispose();
  }
  puppy = newpuppy;
};
