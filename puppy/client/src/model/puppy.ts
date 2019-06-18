import * as Matter from 'matter-js';
import * as api from './api';
import { myRender } from './render';
const Bodies = Matter.Bodies;
const Engine = Matter.Engine;
const Runner = Matter.Runner;
const Render = myRender(Matter.Render);
const Constraint = Matter.Constraint;
const MouseConstraint = Matter.MouseConstraint;
const Mouse = Matter.Mouse;
const World = Matter.World;
const Common = Matter['Common'];

export type Code = {
  world: any,
  bodies: any[],
  main: (Matter, Arare2) => void;
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
  //  private width: number;
  //  private height: number;
  private runner: Matter.Runner;
  private engine: Matter.Engine;
  private render: Matter.Render;
  private canvas: HTMLCanvasElement;

  //  private debug_mode: boolean;

  private vars: {};
  private main: (Matter, Arare2) => void;
  private rules: PuppyRule[];

  private DefaultRenderOptions: () => Matter.IRenderDefinition;

  public constructor() {
    this.init();
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

  public set_window_size(width: number, height: number) {

    // this.canvas.setAttribute('width', this.width.toString());
    // this.canvas.setAttribute('height', this.height.toString());
    // this.render.options.width = this.width;
    // this.render.options.height = this.height;
  }

  public start() {
    // console.log("start");
    this.runner.enabled = true;
    this.main(Matter, this);
  }

  public pause() {
    // console.log("pause");
    this.runner.enabled = false;
  }

  public init() {
    if (this.engine) {
      World.clear(this.engine.world, false);
      Engine.clear(this.engine);
      // this.engine = null;
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
    this.runner = Runner.create({});
    let canvas = document.getElementById('puppy-screen');
    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    console.log('FIXME', width, height);
    let render = {
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
    this.vars = {};
    this.rules = [];
  }

  public ready() {
    Runner.run(this.runner, this.engine); /*物理エンジンを動かす */
    Render.run(this.render); /* 描画開始 */
    this.runner.enabled = false; /*初期位置を描画したら一度止める */

    // FIXME
  }

  public debug() {
    // let background = 'rgba(0, 0, 0, 0)';
    // const render = this.render;
    // if (this.debug_mode) {
    //   render.options.wireframes = false;
    //   render.options['showPositions'] = false;
    //   render.options['showMousePositions'] = false;
    //   render.options['showVelocity'] = false;
    //   render.options['showAngleIndicator'] = false;
    //   render.options['showPositions'] = false;
    //   render.options['showBounds'] = false;
    //   render.options['background'] = background;
    //   this.debug_mode = false;
    // } else {
    //   render.options.wireframes = true;
    //   render.options['showPositions'] = true;
    //   render.options['showMousePositions'] = true;
    //   render.options['showVelocity'] = true;
    //   render.options['showAngleIndicator'] = true;
    //   render.options['showPositions'] = true;
    //   background = render.options['background'];
    //   render.options['background'] = 'rgba(0, 0, 0, 0)';
    //   this.debug_mode = true;
    // }
  }

  private loadWorld(world: any) {
    /* 描画サイズを自動拡大/縮小を設定する */
    Render['lookAt'](this.render, {
      min: { x: 0, y: 0 },
      max: {
        x: world.width || 1000,
        y: world.height || 1000,
      },
    });
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
      /*
      Events.on(mouseConstraint, 'mousedown', function(event) {
        var mousePosition = event.mouse.position;
        console.log('mousedown at ' + mousePosition.x + ' ' + mousePosition.y);
        //shakeScene(engine);
      });

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
          const body = newBody(data.shape, data);
          if (data.name) {
            this.vars[data.name] = body;
          }
          if (body.id) {
            bodies.push(body);
          }
        }
        /*  else {
          if(data.x && data.y) {
            data.deref = data.deref || defaultDeref;
            vars.push(data);
          }
        }*/
      }
      World.add(this.engine.world, bodies);
    }
    if (code.errors) {
      // TODO
      // editor にエラー情報をフィードバックする
    }
    this.main = code.main || ((Matter: any, arare: Code) => { });
    this.ready();
  }

  public compile(code: string) {
    api.compile(code).then(() => {
      this.load(window['PuppyVMCode']);
    });
  }

  // Puppy APIs

  public newMatter(shape: string, options: {}) {
    const body = newBody(shape, options);
    World.add(this.engine.world, [body]);
    return body;
  }

  public print(text: string) {  // FIXME
    const x = 1000;
    const y = Math.random() * 1000;
    const body = Bodies.rectangle(
      x, y, 20, 20,
      {
        render: { fillStyle: 'rgba(33, 39, 98, 0)' },
        isStatic: true,
        isSensor: true,
      });
    body['name'] = 'コメント';
    body['value'] = text;
    World.add(this.engine.world, [body]);
    const commentRule = {
      matchFunc: part => part.name === 'コメント',
      actionFunc: (body, engine) => {
        const px = 1000 - 100 * engine.timing.timestamp * 0.003;
        Matter.Body.setPosition(body, { x: px, y: body.position.y });
      },
    };
    this.rules = [commentRule];
  }

}

/* shapeFunc 物体の形状から物体を生成する関数 */

const shapeFuncMap: { [key: string]: (options: {}) => Matter.Body } = {
  circle(options: {}) {
    let radius = options['radius'] || 25;
    if (options['width']) {
      radius = options['width'] / 2;
    }
    const x = options['position']['x'] || 500;
    const y = options['position']['y'] || 500;
    return Bodies.circle(x, y, radius, options);
  },
  rectangle(options: {}) {
    const x = options['position']['x'] || 500;
    const y = options['position']['y'] || 500;
    return Bodies.rectangle(x, y, options['width'] || 100, options['height'] || 100, options);
  },
  polygon(options: {}) {
    const x = options['position']['x'] || 500;
    const y = options['position']['y'] || 500;
    let radius = options['radius'] || 25;
    if (options['width']) {
      radius = options['width'] / 2;
    }
    return Matter.Bodies.polygon(x, y, options['sides'] || 5, radius, options);
  },
  trapezoid(options: {}) {
    const x = options['position']['x'] || 500;
    const y = options['position']['y'] || 500;
    return Matter.Bodies.trapezoid(x, y, options['width'] || 100, options['height'] || 100, options['slope'] || 0.5, options);
  },
  unknown(options: {}) {
    let radius = options['radius'] || 25;
    if (options['width']) {
      radius = options['width'] / 2;
    }
    const x = options['position']['x'] || 500;
    const y = options['position']['y'] || 500;
    return Bodies.circle(x, y, radius, options);
  },
};

const newBody = (shape: string, options: {}) =>
  shape in shapeFuncMap ? shapeFuncMap[shape](options) : shapeFuncMap['unknown'](options);

export const puppy: Puppy = new Puppy();
