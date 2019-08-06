import * as Matter from 'matter-js';
import * as api from './api';
import { myRender } from './render';
import { PuppyConstructor, Shape, initVars, setShapeProperty } from './shape';
import { selectLine, removeLine, editor } from '../view/editor';
import { SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS } from 'constants';
import { format } from 'path';

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

export type PuppyCode = {
  hash: string,
  world: any,
  bodies: any[],
  main: (puppy: Puppy) => IterableIterator<void>;
  diff?: (puppy: Puppy) => void;
  lives: {}[],
  lines: number[],
  errors: {}[],
};

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
  view: { min: Matter.Vector, max: Matter.Vector },
  colorScheme: [string];

  opacity: number; /* Default 1.0 */

  font: string;
  gravity: Matter.Vector;
  density: number; /* Default: 0.001 */
  friction: number; /* Default: 0.1 */
  airFriction: number; /* Default: 0.01 */
  frictionStatic: number; /* Default: 0.5 */
  motion: number; /* Default: 0 */
  restitution: number; /* 0 */

};

const PuppyColorScheme = {
  pop: ['#de9610', '#c93a40', '#fff001', '#d06d8c', '#65ace4', '#a0c238', '#56a764', '#d16b16', '#cc528b', '#9460a0', '#f2cf01', '#0074bf'],
  cute: ['#e2b2c0', '#fff353', '#a5d1f4', '#e4ad6d', '#d685b0', '#dbe159', '#7fc2ef', '#c4a6ca', '#eabf4c', '#f9e697', '#b3d3ac', '#eac7cd'],
  dynamic: ['#b80117', '#222584', '#00904a', '#edc600', '#261e1c', '#6d1782', '#8f253b', '#a0c238', '#d16b16', '#0168b3', '#b88b26', '#c30068'],
  gorgeous: ['#7d0f80', '#b08829', '#a03c44', '#018a9a', '#ab045c', '#391d2b', '#d5a417', '#546474', '#0f5ca0', '#d0b98d', '#d4c91f', '#c1541c'],
  casual: ['#7b9ad0', '#f8e352', '#c8d627', '#d5848b', '#e5ab47', '#e1cea3', '#51a1a2', '#b1d7e4', '#66b7ec', '#c08e47', '#ae8dbc', '#c3cfa9'],
  psychedelic: ['#b7007c', '#009b85', '#382284', '#e2c80f', '#009dc6', '#c4c829', '#95007e', '#d685b0', '#eee800', '#bf5116', '#b80e3b', '#0178bc'],
  bright: ['#fff001', '#cb5393', '#a0c238', '#d78114', '#00a5e7', '#cd5638', '#0168b3', '#d685b0', '#00984b', '#f2cf01', '#6bb6bb', '#a563a0'],
  fairytale: ['#cca9ca', '#9bcad0', '#dd9dbf', '#edef9c', '#aabade', '#f2dae8', '#c7ddae', '#a199c8', '#faede5', '#d5a87f', '#f7f06e', '#95bfe7'],
  heavy: ['#000000', '#998c69', '#5c002f', '#244765', '#814523', '#5e2a58', '#1a653c', '#6a6a68', '#bf7220', '#5f556e', '#84762f', '#872226'],
  impact: ['#c60019', '#fff001', '#1d4293', '#00984b', '#019fe6', '#c2007b', '#261e1c', '#7d0f80', '#dc9610', '#dbdf19', '#d685b0', '#a0c238'],
  street: ['#33476a', '#211917', '#6c7822', '#c2007b', '#44aeea', '#5e3032', '#d16b16', '#c8d627', '#9193a0', '#816945', '#c50030', '#0080c9'],
  cool: ['#b0d7f4', '#c0cbe9', '#eef0b1', '#44aeea', '#85beab', '#c4a6ca', '#f7f06e', '#c8d627', '#bcccd9', '#e4f0fc', '#f2dae8', '#6490cd'],
  elegant: ['#ae8dbc', '#e3b3cd', '#d6ddf0', '#e5d57d', '#82c0cd', '#afc7a7', '#834e62', '#6a9176', '#7f7eb8', '#a04e90', '#dbbc86', '#c4c829'],
  fresh: ['#70b062', '#c8d85b', '#f8e133', '#dbdf19', '#e3ab30', '#dd9dbf', '#a979ad', '#cd5638', '#399548', '#6bb6bb', '#f7f39c', '#9acce3'],
  warm: ['#c59f22', '#dd9b9d', '#ebcc00', '#d6d11d', '#8d4f42', '#d8836e', '#f8e469', '#cbb586', '#e4aa01', '#eac287', '#f2d8bf', '#a6658d'],
  soft: ['#f8e469', '#e7e0aa', '#d9de84', '#e4bd60', '#9ac29f', '#e3be87', '#edef9c', '#dd9b9d', '#b2d6d4', '#f5dfa6', '#ebeddf', '#e1d4e6'],
  man: ['#23466e', '#4d639f', '#dfe0d8', '#1d695f', '#9aadbe', '#844f30', '#934e61', '#7e9895', '#77aad7', '#848a96', '#a76535', '#7e8639'],
  woman: ['#7b0050', '#a8006d', '#bea620', '#a26c54', '#949b34', '#614983', '#cba777', '#de9610', '#bd8683', '#be87a6', '#bf5346', '#e1d0b4'],
  boy: ['#0168b3', '#66b7ec', '#afd0ef', '#88b83e', '#b8b2d6', '#6bb6bb', '#5e4694', '#f2cf01', '#c6e2f8', '#d5dbcf', '#7a8bc3', '#e8e6f3'],
  girl: ['#d06da3', '#c2d3ed', '#be91bc', '#c73576', '#f8e352', '#c8d627', '#e3b3cd', '#c6e0d5', '#e4ab5a', '#cb6c58', '#845d9e', '#82c0cd'],
  smart: ['#4d639f', '#356c92', '#c9ced1', '#dfd4be', '#92a1a6', '#a67b2d', '#bda5bb', '#2c4b79', '#d6d680', '#babea5', '#ebc175', '#3a614f'],
  light: ['#44aeea', '#b4cb32', '#b2b6db', '#b2d6d4', '#ebe9ae', '#0080c9', '#71b174', '#e4c4db', '#7da8db', '#eac39a', '#dbe585', '#6db5a9'],
  stylish: ['#58656e', '#bac1c7', '#487ca3', '#dfd4be', '#004679', '#c0542d', '#a44682', '#9599b2', '#d6d680', '#8eb4d9', '#6c5776', '#499475'],
  natural: ['#ba9648', '#87643e', '#c2b5d1', '#ba7d8c', '#b8ac60', '#797c85', '#f9ebd1', '#9cb1c2', '#81a47a', '#acb130', '#8b342a', '#acae98'],
  spring: ['#dd9cb4', '#eeea55', '#ebc061', '#b2d6d4', '#f2dae8', '#c9d744', '#b8b2d6', '#afd0ef', '#d7847e', '#f8e352', '#b3ce5b', '#cbacbe'],
  summer: ['#174e9e', '#68b8dd', '#d16b16', '#88b83e', '#f2cf01', '#019fe6', '#c60019', '#019c96', '#b0d7f4', '#fff001', '#0074bf', '#c83955'],
  fall: ['#ae3c22', '#902342', '#c59f22', '#7e8639', '#eabd00', '#a49e2e', '#ac5238', '#9f832f', '#ba7c6f', '#875f3b', '#bba929', '#786b4b'],
  winter: ['#a5aad4', '#6591b6', '#623d82', '#5f897b', '#858aa0', '#eff3f6', '#c2d3dd', '#4f616f', '#7f7073', '#42629f', '#674c51', '#b38da4'],
  japan: ['#c3003a', '#3a546b', '#d5a02e', '#918d43', '#787cac', '#604439', '#6f2757', '#c1541c', '#565d63', '#afc9ca', '#baaa52', '#e2b2c0'],
  euro: ['#bf541c', '#25a4b7', '#e4aa01', '#b2bfe1', '#ad438e', '#1d4293', '#b71232', '#e8e2be', '#b0bf30', '#6aa43e', '#6276b5', '#d7832d'],
  nordic: ['#149bdf', '#dbdf19', '#c97a2b', '#945141', '#9abca4', '#a5a79a', '#e6d9b9', '#eabd00', '#bf545e', '#86b070', '#665e51', '#b59a4d'],
  asian: ['#946761', '#b80040', '#4eacb8', '#7f1f69', '#c8b568', '#147472', '#1d518b', '#b1623b', '#95a578', '#b9b327', '#af508a', '#dab100'],
};

export const chooseColorScheme = (key: string) => {
  const cs = (key in PuppyColorScheme) ? PuppyColorScheme[key] : PuppyColorScheme[Common.choose(['pop',
    'cute', 'dynamic', 'gorgeous', 'casual',
    'psychedelic', 'bright',
    'fairytale', 'heavy', 'impact', 'street', 'cool',
    'elegant', 'fresh', 'warm', 'soft', 'man', 'woman',
    'boy', 'girl', 'smart', 'light', 'stylish', 'natural',
    'spring', 'summer', 'fall', 'winter',
    'japan', 'euro', 'nordic', 'asian'])];
  const targets = <HTMLCollectionOf<HTMLElement>>document.getElementsByClassName('btn');
  for (let i = 0; i < targets.length; i += 1) {
    targets[i].style.backgroundColor = cs[i % cs.length];
  }
  return cs;
};

// (Puppy, {}) -> (number, number, number) -> any
export class Puppy {
  private settings: PuppySettings;
  public code: PuppyCode;
  public world: PuppyWorld;

  private runner: Matter.Runner;
  private engine: Matter.Engine;
  private render: Matter.Render;
  private canvas: HTMLCanvasElement;

  // private debug_mode: boolean;

  private vars: {};

  // new puppy
  public constructor(settings: PuppySettings, code: PuppyCode) {
    this.settings = settings;
    this.code = code;
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

    if (this.world.gravity) {
      const engine = this.engine;
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
    Matter.Events.on(this.engine, 'beforeUpdate', (event: Matter.IEventTimestamped<Matter.Engine>) => {
      const time = this.engine.timing.timestamp;
      if (this.settings.eachUpdate) {
        this.settings.eachUpdate(time);
      }
      const bodies = Matter.Composite.allBodies(this.engine.world);
      for (let i = 0; i < bodies.length; i += 1) {
        const body: Matter.Body = bodies[i];
        if (body['move']) {
          body['move'](body, time);
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
    // render
    const canvas = document.getElementById(this.settings.canvas);
    let render_width = canvas.clientWidth;
    let render_height = canvas.clientWidth * this.world.height / this.world.width;
    if (render_height > canvas.clientHeight) {
      render_height = canvas.clientHeight;
      render_width = canvas.clientHeight * this.world.width / this.world.height;
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
        background: this.world.background,
        font: this.world.font,
        wireframes: false,
      },
    };
    this.render = Render.create(render);
    this.canvas = this.render.canvas;
    /* 描画サイズを自動拡大/縮小を設定する */
    Render['lookAt'](this.render, this.world.view);
    /* マウス */
    if (true) {
      const mouse = Mouse.create(this.render.canvas);
      const constraintOptions = {
        pointA: { x: 0, y: 0 },
        pointB: { x: 0, y: 0 },
        stiffness: this.world['mouseStiffness'] || 0.2,  /* 剛性 */
      };
      constraintOptions['render'] = {
        visible: false,
      };
      const mouseConstraint = MouseConstraint.create(this.engine, {
        mouse,
        constraint: Constraint.create(constraintOptions),
      });
      World.add(this.engine.world, mouseConstraint);
      this.render['mouse'] = mouse;

      // an example of using mouse events on a mouse
      // const mouse = Mouse.create(this.element);
      // this.element.addEventListener('click', () => {
      //   const query = Query.point(Composite.allBodies(world), mouse.position)
      //   console.log(mouse.position);
      //   console.log(query);
      // });
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
      this.render.canvas = null;
      this.render.context = null;
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
    let h = width * this.world.viewHeight / this.world.viewWidth;
    if (h > height) {
      h = height;
      w = height * this.world.viewWidth / this.world.viewHeight;
    }
    this.canvas.setAttribute('width', w.toString());
    this.canvas.setAttribute('height', h.toString());
    // console.log('resize width {this.render.options.width} => {w} height {this.render.options.height} => {h}');
    this.render.options.width = w;
    this.render.options.height = h;
  }

  public async wait(sec) {
    await new Promise(resolve => setTimeout(resolve, sec * 1000));
  }

  public async waitForRun(interval) {
    while (!this.runner.enabled) {
      await this.wait(interval);
    }
  }

  public async execute_main() {
    for await (const _ of this.code.main(this)) {
      await this.wait(0.5);
      await this.waitForRun(1);
    }
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
    this.runner.enabled = true;
    this.execute_main();
  }

  public updateLiveCode(code: PuppyCode) {
    this.code = code;
    if (this.runner.enabled) {
      if (code.diff) {
        this.initCode();
        console.log(`live diff now ${code.diff}`);
        code.diff(this);
        return true;
      }
      if (code.lives && code.lives.length > 0) {
        this.initCode();
        const bodies = Matter.Composite.allBodies(this.engine.world);
        for (const body of bodies) {
          for (const live of code.lives) {
            if (body['oid'] === live[0]) {
              console.log(body);
              console.log(live);
              const name = live[1];
              console.log(`change ${name} ${body[name]} ${live[2]} ${live[3]}`);
              // if (body[name] === live[3] || live[3] == null) {
              setShapeProperty(this, body as Shape, name, live[2]);
              // }
            }
          }
        }
        return true;
      }
    }
    return false;
  }

  public pause() {
    this.runner.enabled = false;
  }

  public getTimeStamp() {
    return this.engine.timing.timestamp;
  }

  // lives

  public ln(n: number) {
    return this.code.lines[n];
  }

  // Puppy APIs

  public new_ = (cons: PuppyConstructor, x: number, y: number, options: Shape) => {
    if (!options.position) {
      options.position = { x, y };
    }
    const body: Matter.Body = cons(this, options);
    World.add(this.engine.world, [body]);
    return body;
  }

  public async input(msg?: string) {
    const overlay = document.getElementById('myOverlay');
    const form = document.getElementById('input-form');
    // const formMsg = document.getElementById('input-message');
    const formText = document.getElementById('input-text') as HTMLInputElement;
    this.runner.enabled = false;

    const awaitForClick = target => {
      return new Promise(resolve => { // 処理A
        const listener = resolve;     // 処理B
        target.addEventListener('submit', listener, { once: true }); // 処理C
      });
    };
    const asyncInput = async () => {
      let text = '';
      form.onsubmit = () => {
        overlay.style.display = 'none';
        text = formText.value;
        formText.value = '';
        return false;
      };
      await awaitForClick(form);
      return text;
    };

    formText.placeholder = msg ? msg : '';
    overlay.style.display = 'block';
    const x = await asyncInput();
    this.runner.enabled = true;
    this.waitForRun(0.5);
    console.log(`input ${x}`);
    return x;
  }

  public async input0(console?: string) {
    this.runner.enabled = false;
    const awaitForClick = target => {
      return new Promise(resolve => { // 処理A
        const listener = resolve;     // 処理B
        target.addEventListener('click', listener, { once: true }); // 処理C
      });
    };
    const text = document.getElementById('inputtext') as HTMLInputElement;
    const f = async () => {
      const target = document.querySelector('#submitInput');
      let Text = '';
      document.getElementById('submitInput').onclick = () => {
        document.getElementById('myOverlay').style.display = 'none';
        Text = text.value;
        text.value = '';
      };
      await awaitForClick(target);
      return Text;
    };

    text.placeholder = console ? console : 'Input here';
    document.getElementById('myOverlay').style.display = 'block';
    const x = await f();
    this.runner.enabled = true;
    this.waitForRun(0.5);
    return x;
  }

  public print(text: string, options = {}) {
    const width = this.world.width;
    const _options: Shape = Common.extend({
      shape: 'label',
      value: this.str(text),
      created: this.getTimeStamp(),
      move: (body, time: number) => {
        const px = width - 100 * (time - body['created']) * 0.003;
        Matter.Body.setPosition(body, { x: px, y: body.position.y });
        if (px < -1) {
          World.remove(this.engine.world, body);
        }
      },
    },                                    options);
    const x = this.world.width;
    const y = this.world.height * (Math.random() * 0.9 + 0.05);
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
      let a = [];
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
      return '[' + x.map((x) => this.str(x)).join(', ') + ']';
    }
    return `${x}`;
  }

  public range(x: number, y?: number, z?: number) {
    let start = 0;
    let end = 0;
    let step = 1;
    if (y === undefined) {
      end = x;
    }
    else if (z !== undefined) {
      start = x;
      end = y;
      step = z === 0 ? 1 : z;
    }
    else {
      start = x;
      end = y;
    }
    const xs = [];
    if (start <= end) {
      if (step < 0) {
        step = -step;
      }
      for (let i = start; i < end; i += step) {
        xs.push(i);
        if (xs.length > 100000) { // safety break
          break;
        }
      }
    }
    else {
      if (step > 0) {
        step = -step;
      }
      for (let i = start; i > end; i += step) {
        xs.push(i);
        if (xs.length > 100000) { // safety break
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
    return Array.from(lst, func);           // funcがダメ
  }

  /* Matter.Body */

  public setPosition(body: Matter.Body, x: number, y: number) {
    Matter.Body.setPosition(body, { x, y });
  }

  public applyForce(body: Matter.Body, x: number, y: number, fx: number, fy: number) {
    Matter.Body.applyForce(body, { x, y }, { x: fx, y: fy });
  }

  public rotate(body: Matter.Body, angle: number, x?: number, y?: number) {
    Matter.Body.rotate(body, angle);
  }

  public scale(body: Matter.Body, sx: number, sy: number, x?: number, y?: number) {
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
  ftrace: (log: {}) => { },
};

export const initPuppy = (settings?: PuppySettings) => {
  if (settings) {
    puppy_settings = settings;
  }
};

export const runPuppy = (puppy: Puppy, code: PuppyCode, alwaysRun: boolean) => {
  if (puppy != null) {
    if (!alwaysRun && code) {
      if (puppy.getCode().hash === code.hash) {
        return puppy;
      }
      if (puppy.isRunning()) {
        // console.log(`lives ${code.lives}`);
        // console.log(`diff ${code.diff}`);
        if (puppy.updateLiveCode(code)) {
          return puppy;
        }
      }
    }
  }
  if (code) {
    if (puppy != null) {
      puppy.dispose();
    }
    const newpuppy = new Puppy(puppy_settings, code);
    newpuppy.runCode();
    return newpuppy;
  }
  return null;
};
