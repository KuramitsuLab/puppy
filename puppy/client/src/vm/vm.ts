import * as Matter from 'matter-js';
import { myRender } from './render';
import { initVars, Shape, PuppyConstructor } from './shape';
import {
  getInputValue,
  getDiffStartLineNumber,
  setCodeHighlight,
  resetCodeHighlight,
  getIsLive,
} from '../modules/operations';
import { chooseColorScheme } from './color';

// const Bodies = Matter.Bodies;
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

export type PuppyCode = {
  world: any;
  main: (puppy: any) => IterableIterator<number>;
  errors: ErrorLog[];
  code: string;
};

// export type ErrorShape = {
//   type: 'error' | 'info' | 'warning' | 'hint';
//   row: number;
//   col: number;
//   len: number;
//   text: string;
// };

export type ErrorLog = {
  type?: string;
  key: string;
  pos?: number;
  row?: number;
  col?: number;
  len?: number;
  subject?: string;
  code?: string;
  request?: Type;
  given?: Type;
};

class Type {
  public isOptional: boolean;
  public constructor(isOptional: boolean) {
    this.isOptional = isOptional;
  }

  public toString() {
    return '?';
  }

  public rtype(): Type {
    return this;
  }
  public psize() {
    return 0;
  }
  public ptype(_index: number): Type {
    return this;
  }

  // public equals(ty: Type, update: boolean): boolean {
  //   return false;
  // }

  public accept(_ty: Type, _update: boolean): boolean {
    return false;
  }

  public realType(): Type {
    return this;
  }

  public isPattern() {
    return false;
  }

  public hasAlpha(): boolean {
    return false;
  }

  public toVarType(_map: any): Type {
    return this;
  }
}

export type PuppySettings = {
  canvas: string;
  ftrace: (log: {}) => void;
  eachUpdate?: (time: number) => void;
};

type PuppyWorld = {
  background: string;
  width: number;
  height: number;
  viewWidth: number;
  viewHeight: number;
  view: { min: Matter.Vector; max: Matter.Vector };
  colorScheme: [string];

  opacity: number /* Default 1.0 */;

  font: string;
  gravity: Matter.Vector;
  density: number /* Default: 0.001 */;
  friction: number /* Default: 0.1 */;
  airFriction: number /* Default: 0.01 */;
  frictionStatic: number /* Default: 0.5 */;
  motion: number /* Default: 0 */;
  restitution: number /* 0 */;
};

// (Puppy, {}) -> (number, number, number) -> any
export class Puppy {
  private settings: PuppySettings;
  public code: any;
  public world: PuppyWorld | null;

  public interval: number;
  public waitRestart: boolean;
  public isExecuting: boolean;

  private runner: Matter.Runner | null;
  private engine: Matter.Engine | null;
  private render: Matter.Render | null;
  private canvas: HTMLCanvasElement | null;

  // private debug_mode: boolean;

  private vars: {};

  // new puppy
  public constructor(settings: PuppySettings, code: any, waitStart = false) {
    this.settings = settings;
    this.code = code;
    this.world = null;
    this.interval = 500;
    this.waitRestart = waitStart;
    this.isExecuting = false;
    this.runner = null;
    this.engine = null;
    this.render = null;
    this.canvas = null;
    this.vars = {};
  }

  private initCode() {
    const code = this.code;
    const width = code.world['width'] || 1000;
    const height = code.world['height'] || 1000;
    const vwidth = code.world['viewWidth'] || width;
    const vheight = code.world['viewHeight'] || height;
    const pos: Matter.Vector = code.world['position'] || { x: 0, y: 0 };
    this.code = code;
    this.world = {
      width,
      height,
      viewWidth: vwidth,
      viewHeight: vheight,
      background: code.world['background'] || 'white',
      gravity: code.world['gravitiy'] || { x: 0.0, y: 1.0 },
      colorScheme: chooseColorScheme(code.world['colorScheme'] || ''),
      opacity: code.world['opacity'] || 1.0,
      font: code.world['font'] || "bold 60px 'Arial'",
      view: code.world['view'] || {
        min: pos,
        max: { x: pos.x + vwidth, y: pos.y + vheight },
      },
      density: code.world['density'] || 0.001,
      friction: code.world['friction'] || 0.1,
      airFriction: code.world['airFriction'] || 0.01,
      frictionStatic: code.world['frictionStatic'] || 0.5,
      motion: code.world['motion'] || 0,
      restitution: code.world['restitution'] || 0,
    };
  }

  private startCode() {
    this.engine = Engine.create();

    if (this.world!.gravity) {
      const engine = this.engine;
      window.addEventListener('deviceorientation', event => {
        const orientation = window.orientation || 0;
        const gravity = engine.world.gravity;
        if (orientation === 0) {
          gravity.x = Common.clamp(event.gamma!, -90, 90) / 90;
          gravity.y = Common.clamp(event.beta!, -90, 90) / 90;
        } else if (orientation === 180) {
          gravity.x = Common.clamp(event.gamma!, -90, 90) / 90;
          gravity.y = Common.clamp(-event.beta!, -90, 90) / 90;
        } else if (orientation === 90) {
          gravity.x = Common.clamp(event.beta!, -90, 90) / 90;
          gravity.y = Common.clamp(-event.gamma!, -90, 90) / 90;
        } else if (orientation === -90) {
          gravity.x = Common.clamp(-event.beta!, -90, 90) / 90;
          gravity.y = Common.clamp(event.gamma!, -90, 90) / 90;
        }
      });
    }
    Matter.Events.on(this.engine, 'beforeUpdate', () => {
      const time = this.engine!.timing.timestamp;
      if (this.settings.eachUpdate) {
        this.settings.eachUpdate(time);
      }
      const bodies = Matter.Composite.allBodies(this.engine!.world);
      for (let i = 0; i < bodies.length; i += 1) {
        const body: Matter.Body = bodies[i];
        if (body['move']) {
          body['move'](body, time);
        }
      }
    });
    Matter.Events.on(this.engine, 'collisionActive', event => {
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
    Matter.Events.on(this.engine, 'collisionStart', event => {
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
    Matter.Events.on(this.engine, 'collisionEnd', event => {
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
    this.runner = Runner.create({ isFixed: false });
    // render
    const canvas = document.getElementById(this.settings.canvas);
    let render_width = canvas!.clientWidth;
    let render_height =
      (canvas!.clientWidth * this.world!.height) / this.world!.width;
    if (render_height > canvas!.clientHeight) {
      render_height = canvas!.clientHeight;
      render_width =
        (canvas!.clientHeight * this.world!.width) / this.world!.height;
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
        background: this.world!.background,
        font: this.world!.font,
        wireframes: false,
      },
    };
    this.render = Render.create(render);
    this.canvas = this.render!.canvas;
    /* 描画サイズを自動拡大/縮小を設定する */
    Render['lookAt'](this.render, this.world!.view);
    /* マウス */
    const mouse = Mouse.create(this.render!.canvas);
    const constraintOptions = {
      pointA: { x: 0, y: 0 },
      pointB: { x: 0, y: 0 },
      stiffness: this.world!['mouseStiffness'] || 0.2 /* 剛性 */,
    };
    constraintOptions['render'] = {
      visible: false,
    };
    const mouseConstraint = MouseConstraint.create(this.engine, {
      mouse,
      constraint: Constraint.create(constraintOptions),
    });
    World.add(this.engine.world, mouseConstraint);
    this.render!['mouse'] = mouse;

    // an example of using mouse events on a mouse
    // const mouse = Mouse.create(this.element);
    // this.element.addEventListener('click', () => {
    //   const query = Query.point(Composite.allBodies(world), mouse.position)
    //   console.log(mouse.position);
    //   console.log(query);
    // });
    Matter.Events.on(mouseConstraint, 'mousedown', event => {
      const mouse = event.mouse;
      let body = event.sourcebody;
      const bodies = Matter.Composite.allBodies(this.engine!.world);
      for (let i = 0; i < bodies.length; i += 1) {
        body = bodies[i];
        if (
          Bounds.contains(body.bounds, mouse.position) &&
          Detector.canCollide(
            body.collisionFilter,
            mouseConstraint.collisionFilter
          )
        ) {
          for (
            let j = body.parts.length > 1 ? 1 : 0;
            j < body.parts.length;
            j += 1
          ) {
            const part = body.parts[j];
            if (
              part['clicked'] &&
              Vertices.contains(part.vertices, mouse.position)
            ) {
              part['clicked'](part);
              break;
            }
          }
        }
      }
    });
    //
    this.vars = initVars({});
    // this.main = code.main || (function* (Matter: any, puppy: Puppy) { });

    Runner.run(this.runner, this.engine); /*物理エンジンを動かす */
    Render.run(this.render); /* 描画開始 */
    // this.runner.enabled = false; /*初期位置を描画したら一度止める */
  }

  public dispose() {
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
      // this.render!.canvas = null;
      // this.render!.context = null;
      this.render.textures = {};
    }
  }

  // private DefaultRenderOptions: () => Matter.IRenderDefinition;

  public getCode() {
    return this.code;
  }

  public getCanvas() {
    return this.canvas;
  }

  public resize(width: number, height: number) {
    // console.log(`'resize width ${width} ${this.canvas.clientWidth} height ${height} ${this.canvas.clientHeight}`);
    let w = width;
    let h = (width * this.world!.viewHeight) / this.world!.viewWidth;
    if (h > height) {
      h = height;
      w = (height * this.world!.viewWidth) / this.world!.viewHeight;
    }
    this.canvas!.setAttribute('width', w.toString());
    this.canvas!.setAttribute('height', h.toString());
    // console.log('resize width {this.render.options.width} => {w} height {this.render.options.height} => {h}');
    this.render!.options.width = w;
    this.render!.options.height = h;
  }

  public async wait(msec) {
    await new Promise(resolve => setTimeout(resolve, msec));
  }

  public async waitForRun(interval) {
    while (this.waitRestart) {
      await this.wait(interval);
    }
    this.runner!.enabled = true;
  }

  public async execute_main() {
    const diffStartLineNumber = getDiffStartLineNumber();
    this.isExecuting = true;
    for await (const lineNumber of this.code.main(this)) {
      if (lineNumber < diffStartLineNumber && getIsLive()) {
        for (let i = 0; i < this.interval / this.runner!.delta; i += 1) {
          this.engine = Engine.update(this.engine!, undefined, undefined);
        }
      } else {
        setCodeHighlight(lineNumber, lineNumber);
        await this.waitForRun(1000);
        await this.wait(this.interval);
      }
    }
    this.isExecuting = false;
    resetCodeHighlight();
    // editor に依存するためNG
    // let prevline = 0;
    // const lines: [string] = editor.getSession().getDocument().getAllLines();
    // for await (const linenum of this.main(Matter, this)) {
    //   if (prevline == 0 || prevline >= linenum || lines[prevline] == '') {
    //     selectLine(linenum - 1, linenum);
    //   }
    //   else {
    //     selectLine(prevline, linenum);
    //   }
    //   prevline = linenum;
    //   if (this.isStep) {
    //     this.runner.enabled = false;
    //     this.isStep = false;
    //   } else {
    //     await this.wait(0.5);
    //   }
    //   await this.waitForRun(1);
    // }
    // removeLine();
    // if (this.isStep) {
    //   this.runner.enabled = true;
    //   this.isStep = false;
    // }
  }

  public isRunning() {
    return this.runner && this.runner.enabled;
  }

  public runCode() {
    this.initCode();
    this.dispose();
    this.startCode();
    this.runner!.enabled = !this.waitRestart;
    this.execute_main();
  }

  // public updateLiveCode(code: PuppyCode) {
  //   this.code = code;
  //   if (this.runner!.enabled) {
  //     if (code.diff) {
  //       this.initCode();
  //       console.log(`live diff now ${code.diff}`);
  //       code.diff(this);
  //       return true;
  //     }
  //     if (code.lives && code.lives.length > 0) {
  //       this.initCode();
  //       const bodies = Matter.Composite.allBodies(this.engine!.world);
  //       for (const body of bodies) {
  //         for (const live of code.lives) {
  //           if (body['oid'] === live[0]) {
  //             console.log(body);
  //             console.log(live);
  //             const name = live[1];
  //             console.log(`change ${name} ${body[name]} ${live[2]} ${live[3]}`);
  //             // if (body[name] === live[3] || live[3] == null) {
  //             setShapeProperty(this, body as Shape, name, live[2]);
  //             // }
  //           }
  //         }
  //       }
  //       return true;
  //     }
  //   }
  //   return false;
  // }

  public pause() {
    this.waitRestart = true;
    this.runner!.enabled = false;
  }

  public start() {
    if (this.isExecuting) {
      this.waitRestart = false;
    } else {
      this.runner!.enabled = true;
    }
  }

  public getTimeStamp() {
    return this.engine!.timing.timestamp;
  }

  // lives

  public ln(n: number) {
    return this.code.lines[n];
  }

  // Puppy APIs

  public new_ = (
    cons: PuppyConstructor,
    x: number,
    y: number,
    options: Shape
  ) => {
    if (!options.position) {
      options.position = { x, y };
    }
    const body: Matter.Body = cons(this, options);
    World.add(this.engine!.world, [body]);
    return body;
  };

  public Circle = (x: number, y: number, options: Shape) => {
    return this.new_(this.vars['Circle'], x, y, options);
  };

  public Rectangle = (x: number, y: number, options: Shape) => {
    return this.new_(this.vars['Rectangle'], x, y, options);
  };

  public Polygon = (x: number, y: number, options: Shape) => {
    return this.new_(this.vars['Polygon'], x, y, options);
  };

  public Label = (x: number, y: number, options: Shape) => {
    return this.new_(this.vars['Label'], x, y, options);
  };

  public World = (x: number, y: number, options: Partial<PuppyWorld>) => {
    if (this.engine && this.world) {
      this.world.viewWidth = x;
      this.world.viewHeight = y;
      const pos = this.world.view.min;
      this.world.view = {
        min: pos,
        max: { x: pos.x + x, y: pos.y + y },
      };
      this.resize(this.render!.options.width!, this.render!.options.height!);
      Render['lookAt'](this.render, this.world!.view);
      Object.keys(options).map((key: string) => {
        if (this.world && key in this.world) {
          if (key == 'background') {
            this.render!.options['background'] = options['background'];
          }
          this.world[key] = options[key];
        }
        if (this.engine && key in this.engine.world) {
          this.engine.world[key] = options[key];
        }
      });
    }
  };

  public async input(msg?: string) {
    this.runner!.enabled = false;
    const x = await getInputValue(msg ? msg : '');
    this.runner!.enabled = true;
    this.waitForRun(500);
    console.log(`input ${x}`);
    return x;
  }

  public async input0(console?: string) {
    this.runner!.enabled = false;
    const awaitForClick = target => {
      return new Promise(resolve => {
        // 処理A
        const listener = resolve; // 処理B
        target.addEventListener('click', listener, { once: true }); // 処理C
      });
    };
    const text = document.getElementById('inputtext') as HTMLInputElement;
    const f = async () => {
      const target = document.querySelector('#submitInput');
      let Text = '';
      document.getElementById('submitInput')!.onclick = () => {
        document.getElementById('myOverlay')!.style.display = 'none';
        Text = text.value;
        text.value = '';
      };
      await awaitForClick(target);
      return Text;
    };

    text.placeholder = console ? console : 'Input here';
    document.getElementById('myOverlay')!.style.display = 'block';
    const x = await f();
    this.runner!.enabled = true;
    this.waitForRun(500);
    return x;
  }

  public print(text: string, options = {}) {
    const width = this.world!.width;
    const _options: Shape = Common.extend(
      {
        shape: 'label',
        value: `${text}`,
        created: this.getTimeStamp(),
        move: (body, time: number) => {
          const px = width - 100 * (time - body['created']) * 0.003;
          Matter.Body.setPosition(body, { x: px, y: body.position.y });
          if (px < -1) {
            World.remove(this.engine!.world, body);
          }
        },
      },
      options
    );
    const x = this.world!.width;
    const y = this.world!.height * (Math.random() * 0.9 + 0.05);
    this.new_(this.vars['Label'], x, y, _options);
  }

  public trace(log: {}) {
    console.log(log);
    // this.settings.trace(log);
  }

  /* operator */

  public listAdd(x: [], y: []) {
    return x.concat(y);
  }

  public anyMul(x, y) {
    if (typeof x === 'string') {
      let s = '';
      for (let i = 0; i < y; i += 1) {
        s += x;
      }
      return s;
    }
    if (Array.isArray(x)) {
      let a: any[] = [];
      for (let i = 0; i < y; i += 1) {
        a = a.concat(x);
      }
      return a;
    }
    return x * y;
  }

  public anyIn(x: any, a: [any]) {
    return a.indexOf(x) >= 0;
  }

  /* built-in */

  public int(x: any) {
    if (typeof x === 'number') {
      return x | 0;
    }
    if (typeof x === 'string') {
      return Number.parseInt(x);
    }
    if (typeof x === 'boolean') {
      return x ? 1 : 0;
    }
    return x | 0;
  }

  public float(x: any) {
    if (typeof x === 'number') {
      return x;
    }
    if (typeof x === 'string') {
      return Number.parseFloat(x);
    }
    if (typeof x === 'boolean') {
      return x ? 1.0 : 0.0;
    }
    return x;
  }

  public str(x: any) {
    if (typeof x === 'boolean') {
      return x ? 'True' : 'False';
    }
    if (Array.isArray(x)) {
      return '[' + x.map(x => this.str(x)).join(', ') + ']';
    }
    return `${x}`;
  }

  public range(x: number, y?: number, z?: number) {
    let start = 0;
    let end = 0;
    let step = 1;
    if (y === undefined) {
      end = x;
    } else if (z !== undefined) {
      start = x;
      end = y;
      step = z === 0 ? 1 : z;
    } else {
      start = x;
      end = y;
    }
    const xs: number[] = [];
    if (start <= end) {
      if (step < 0) {
        step = -step;
      }
      for (let i = start; i < end; i += step) {
        xs.push(i);
        if (xs.length > 100000) {
          // safety break
          break;
        }
      }
    } else {
      if (step > 0) {
        step = -step;
      }
      for (let i = start; i > end; i += step) {
        xs.push(i);
        if (xs.length > 100000) {
          // safety break
          break;
        }
      }
    }
    return xs;
  }

  /* string/array (method) */

  public getindex(a: any, index: number) {
    if (typeof a === 'string') {
      return a.charAt((index + a.length) % a.length);
    }
    if (Array.isArray(a)) {
      return a[(index + a.length) % a.length];
    }
    return undefined;
  }

  public slice(a: any, x: number, y?: number) {
    if (typeof a === 'string') {
      if (y == undefined) {
        y = a.length;
      }
      return a.substr(x, y - x);
    }
    if (Array.isArray(a)) {
      if (y == undefined) {
        y = a.length;
      }
      return a.slice(x, y);
    }
    return undefined;
  }
  public find(s: string, sub: string) {
    return s.indexOf(sub);
  }

  public join(s: string, list: [string]) {
    return list.join(s);
  }
  /* list */

  public append(xs: any[], x: any) {
    xs.push(x);
  }

  public len(x: []) {
    return x.length;
  }

  public map(func: any, lst: number[]) {
    return Array.from(lst, func); // funcがダメ
  }

  /* Matter.Body */

  public setPosition(body: Matter.Body, x: number, y: number) {
    Matter.Body.setPosition(body, { x, y });
  }

  public applyForce(
    body: Matter.Body,
    x: number,
    y: number,
    fx: number,
    fy: number
  ) {
    Matter.Body.applyForce(body, { x, y }, { x: fx, y: fy });
  }

  public rotate(body: Matter.Body, angle: number, _x?: number, _y?: number) {
    Matter.Body.rotate(body, angle);
  }

  public scale(
    body: Matter.Body,
    sx: number,
    sy: number,
    _x?: number,
    _y?: number
  ) {
    Matter.Body.scale(body, sx, sy);
  }

  public setAngle(body: Matter.Body, angle: number) {
    Matter.Body.setAngle(body, angle);
  }

  public setVelocity(body: Matter.Body, x: number, y: number) {
    Matter.Body.setVelocity(body, { x, y });
  }

  public setAngularVelocity(body: Matter.Body, velocity: number) {
    Matter.Body.setAngularVelocity(body, velocity);
  }

  public setDensity(body: Matter.Body, density: number) {
    Matter.Body.setDensity(body, density);
  }

  public setMass(body: Matter.Body, mass: number) {
    Matter.Body.setMass(body, mass);
  }

  public setStatic(body: Matter.Body, flag: boolean) {
    Matter.Body.setStatic(body, flag);
  }
}

/* puppy controller */

let puppy_settings = {
  canvas: 'puppy-screen',
  ftrace: (_log: {}) => {},
};

export const initPuppy = (settings?: PuppySettings) => {
  if (settings) {
    puppy_settings = settings;
  }
};

export const runPuppy = (
  puppy: Puppy | null,
  code: PuppyCode,
  alwaysRun: boolean,
  waitStart = false
) => {
  if (puppy != null) {
    if (!alwaysRun && code) {
      // if (puppy.getCode().hash === code.hash) {
      //   return puppy;
      // }
      if (puppy.isRunning()) {
        // console.log(`lives ${code.lives}`);
        // console.log(`diff ${code.diff}`);
        // if (puppy.updateLiveCode(code)) {
        //   return puppy;
        // }
      }
    }
  }
  if (code) {
    if (puppy != null) {
      puppy.dispose();
    }
    const newpuppy = new Puppy(puppy_settings, code, waitStart);
    newpuppy.runCode();
    return newpuppy;
  }
  return null;
};
