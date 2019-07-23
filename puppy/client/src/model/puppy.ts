import * as Matter from 'matter-js';
import * as api from './api';
import { myRender } from './render';
import { shapeFuncMap, ShapeOptions, isShapeOptions, Circle, Rectangle, Polygon, Trapezoid, Label, PuppyShapeBase } from './shape';
import { selectLine } from '../view/editor';

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
  shapeFuncMap?: { [key: string]: (ctx: Puppy, options: {}) => (x: number, y: number, index: number) => any },
};

export class PuppyRule {
  public matchFunc: (part: any) => boolean;
  public actionFunc: (body: Matter.Body, engine: Matter.Engine) => void;
}

// (Puppy, {}) -> (number, number, number) -> any
export class Puppy {
  // private width: number;
  // private height: number;
  private runner: Matter.Runner;
  private engine: Matter.Engine;
  private render: Matter.Render;
  private canvas: HTMLCanvasElement;

  // private debug_mode: boolean;

  private vars: {};
  private main: (Matter, puppy: Puppy) => IterableIterator<number>;
  private rules: PuppyRule[];
  private isRestart: boolean = false;
  private isStep: boolean = false;

  // private DefaultRenderOptions: () => Matter.IRenderDefinition;

  public constructor() {
    this.init();
  }

  public requestFullScreen() {
    if (this.canvas) { // FIXME
      if (this.canvas['webkitRequestFullscreen']) {
        this.canvas['webkitRequestFullscreen'](); // Chrome15+, Safari5.1+, Opera15+
      } else if (this.canvas['mozRequestFullScreen']) {
        this.canvas['mozRequestFullScreen'](); // FF10+
      } else if (this.canvas['msRequestFullscreen']) {
        this.canvas['msRequestFullscreen'](); // IE11+
      } else if (this.canvas['requestFullscreen']) {
        this.canvas['requestFullscreen'](); // HTML5 Fullscreen API仕様
      } else {
        // alert('ご利用のブラウザはフルスクリーン操作に対応していません');
        return;
      }
    }
  }

  public resize(width: number, height: number) {
    const w = Math.min(width, height);
    const h = Math.max(width, height);
    this.canvas.setAttribute('width', w.toString());
    this.canvas.setAttribute('height', h.toString());
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
    let prevline = 0;
    for await (const linenum of this.main(Matter, this)) {
      selectLine(prevline, linenum);
      prevline = linenum;
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

  public start() {
    // console.log("start");
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
    // init
    this.engine = Engine.create();
    Matter.Events.on(this.engine, 'beforeUpdate', (event: Matter.IEventTimestamped<Matter.Engine>) => {
      const bodies = Matter.Composite.allBodies(this.engine.world);
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
    const canvas = document.getElementById('puppy-screen');
    const width = Math.min(canvas.clientWidth, canvas.clientHeight);
    const height = Math.min(canvas.clientWidth, canvas.clientHeight);
    const render = {
      /* Matter.js の変な仕様 canvas に 描画領域が追加される */
      // element: document.getElementById('canvas'),
      element: canvas,
      engine: this.engine,
      options: {
        /* オブジェクトが枠線のみになる */
        width,
        height,
        background: 'rgba(0, 0, 0, 0)',
        wireframes: false,
      },
    };
    this.render = Render.create(render);
    this.canvas = this.render.canvas;
    //
    this.vars = {
      Circle,
      Rectangle,
      Label,
      Polygon,
      Trapezoid,
      PuppyObject: PuppyShapeBase,
    };
    this.rules = [];
  }

  public async ready() {
    Runner.run(this.runner, this.engine); /*物理エンジンを動かす */
    Render.run(this.render); /* 描画開始 */
    this.runner.enabled = false; /*初期位置を描画したら一度止める */
    // FIXME
  }

  private loadWorld(world: any) {
    this.engine.world.bounds = {
      min: { x: 0, y: 0 },
      max: {
        x: world.width || 1000,
        y: world.height || 1000,
      },
    };
    /* 描画サイズを自動拡大/縮小を設定する */
    Render['lookAt'](this.render, this.engine.world.bounds);
    /* 重力を設定する */
    const engine = this.engine;
    if (world.gravity) {
      engine.world.gravity = world.gravity;
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
    /* マウス */
    if (world.mouse) {
      const mouse = Mouse.create(this.render.canvas);
      const constraintOptions = {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: world.mouseStiffness || 0.2,  /* 剛性 */
      };
      constraintOptions['render'] = {
        visible: world.mouseVisible || false,
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
      /*

      // an example of using mouse events on a mouse
      Events.on(mouseConstraint, 'mouseup', function(event) {
        var mousePosition = event.mouse.position;
        console.log('mouseup at ' + mousePosition.x + ' ' + mousePosition.y);
      });

      // an example of using mouse events on a mouse
      Events.on(mouseConstraint, 'startdrag', function(event) {
        console.log('startdrag', event);
      });

      // an example of using mouse events on a mouse
      Events.on(mouseConstraint, 'enddrag', function(event) {
        console.log('enddrag', event);
      });
      */
    }
  }

  public load(code: Code) {
    this.init();
    if (code.world) {
      // 世界の再設定を行う
      this.loadWorld(code.world);
    }
    // 物体の情報をアップデートする
    if (code.bodies) {
      const bodies = [];
      for (const data of code.bodies) {
        if (data.shape && data.position) {
          const body = this.newBody(data);
          if (data.name) {
            this.vars[data.name] = body;
          }
          if (body.id) {
            bodies.push(body);
          }
        }
      }
      World.add(this.engine.world, bodies);
    }
    this.main = code.main || (function* (Matter: any, puppy: Puppy) { });
    this.ready();
  }

  public preview() {

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
    const _options: ShapeOptions = Common.extend({ shape: 'label', position: { x: 1000, y: Math.random() * 1000 } }, options);
    const body = this.newMatter(_options);
    body['value'] = text;
    World.add(this.engine.world, [body]);
    const invokedTime = this.engine.timing.timestamp;
    const commentRule = {
      matchFunc: part => part.id === body.id,
      actionFunc: (body, engine) => {
        const px = 1000 - 100 * (engine.timing.timestamp - invokedTime) * 0.003;
        Matter.Body.setPosition(body, { x: px, y: body.position.y });
      },
    };
    this.rules.push(commentRule);
  }

  public len(x:[]) {
    return x.length;
  }

  public map(func: any,lst: number[]){
    return Array.from(lst,func)           //funcがダメ
  }


}

export const puppy: Puppy = new Puppy();
