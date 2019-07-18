import * as Matter from 'matter-js';

const Bodies = Matter.Bodies;
const Common = Matter['Common'];

export type PuppyShape = 'circle' | 'rectangle' | 'trapezoid' | 'polygon' | 'label';
export type CollisionFunc = ({ }, { }) => void;
export type ClickedFunc = ({ }) => void;

export type ShapeOptions = {
  // Matter Options
  id?: number,
  type?: string,
  label?: string,
  parts?: [],
  plugin?: {},
  angle?: number,
  position: {
    x: number,
    y: number,
  },
  width?: number,
  height?: number,
  force?: {
    x: number,
    y: number,
  },
  torque?: number,
  positionImpulse?: { x?: number, y?: number },
  constraintImpulse?: { x?: number, y?: number, angle?: number },
  totalContacts?: number,
  speed?: number,
  angularSpeed?: number,
  velocity?: { x: number, y: number },
  angularVelocity?: number,
  isSensor?: boolean,
  isStatic?: boolean,
  isSleeping?: boolean,
  motion?: number,
  sleepThreshold?: number,
  density?: number,
  restitution?: number,
  friction?: number,
  frictionStatic?: number,
  frictionAir?: number,
  collisionFilter?: {
    category: number,
    mask: number,
    group: number,
  },
  slop?: number,
  timeScale?: number,
  visible?: boolean,
  fillStyle?: string,
  opacity?: boolean,
  sprite?: {
    xScale?: number,
    yScale?: number,
    xOffset?: number,
    yOffset?: number,
  },
  lineWidth?: number

  // Puppy Options
  shape: PuppyShape,
  radius?: number,
  slope?: number,
  sides?: number,
  image?: string,
  collisionStart?: CollisionFunc,
  collisionEnd?: CollisionFunc,
  collisionActive?: CollisionFunc,
  clicked?: ClickedFunc,
};

export const isShapeOptions = (obj: {}) => ('shape' in obj) && ('position' in obj) && ('x' in obj['position']) && ('y' in obj['position']);

export class PuppyShapeBase implements ShapeOptions {

  shape: PuppyShape = 'circle';
  position: {
    x: number,
    y: number,
  };

  constructor(x: number, y: number, options = {}) {
    Object.assign(this, options);
    this.position = { x, y };
  }
}

export class Circle extends PuppyShapeBase { shape: PuppyShape = 'circle'; }

export class Rectangle extends PuppyShapeBase { shape: PuppyShape = 'rectangle'; }

export class Polygon extends PuppyShapeBase { shape: PuppyShape = 'polygon'; }

export class Trapezoid extends PuppyShapeBase { shape: PuppyShape = 'trapezoid'; }

export class Label extends PuppyShapeBase { shape: PuppyShape = 'label'; }

const flatten = (part) => {
  console.log(part);
  Object.keys(part.render).forEach((key) => {
    if (!(key in part)) {
      console.log(`key ${key}`);
      part[key] = part.render[key];
    }
  });
};

const colorScheme = {
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

export const initWorld = (world: {}) => {
  if (!world['width']) {
    world['width'] = 1000;
  }
  if (!world['height']) {
    world['height'] = world['width'];
  }
  if (!world['foreground']) {
    // FIXME background から設定されるようにする
    world['foreground'] = 'black';
  }
  if (world['colorScheme']) {
    const sc = world['colorScheme'];
    if (typeof (sc) === 'string') {
      if (sc in colorScheme) {
        world['colorScheme'] = colorScheme[sc];
      }
      else {
        world['colorScheme'] = colorScheme['pop'];
      }
    }
    console.log(world['colorScheme']);
  } else {
    // http://www.hp-stylelink.com/news/2013/07/20130708.php
    // のぶちゃんが puppy っぽい色を選んだ
    const sc = Common.choose(['pop', 'casual', 'bright', 'fairytale', 'fresh', 'boy', 'girl', 'japan']);
    world['colorScheme'] = colorScheme[sc];
    console.log(`color ${sc} ${world['colorScheme']}`);
  }
  return world;
};

/* shapeFunc 物体の形状から物体を生成する関数 */
export const shapeFuncMap: { [key in PuppyShape]: (world: {}, options: ShapeOptions) => Matter.Body } = {
  circle(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      radius: _options.width ? _options.width / 2 : (_options.height ? _options.height / 2 : 25),
      fillStyle: Common.choose(world['colorScheme']),
      visible: true,
    };
    const options = Common.extend({}, defaultOptions, _options);
    // width, height をセットしないと、texture が貼れない
    if (!options.width) {
      options.width = options.radius * 2;
    }
    if (!options.height) {
      options.height = options.radius * 2;
    }
    return Bodies.circle(options.position.x, options.position.y, options.radius, options);
  },
  rectangle(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      width: 100,
      height: 100,
      visible: true,
      fillStyle: _options.isStatic ? 'black' : Common.choose(world['colorScheme']),
    };
    const options = Common.extend({}, defaultOptions, _options);
    return Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, options);
  },
  polygon(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      sides: 5,
      radius: 25,
      visible: true,
      fillStyle: _options.isStatic ? 'gray' : Common.choose(world['colorScheme']),
    };
    const options = Common.extend({}, defaultOptions, { radius: _options.width ? _options.width / 2 : defaultOptions.radius }, _options);
    return Bodies.polygon(options.position.x, options.position.y, options.sides, options.radius, options);
  },
  trapezoid(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      width: 100,
      height: 100,
      slope: 0.5,
      visible: true,
      fillStyle: _options.isStatic ? 'gray' : Common.choose(world['colorScheme']),
    };
    const options = Common.extend({}, defaultOptions, _options);
    return Bodies.trapezoid(options.position.x, options.position.y, options.width, options.height, options.slope, options);
  },
  label(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      width: 100,
      height: 100,
      isSensor: true,
      isStatic: true,
      fillStyle: 'rgba(255, 255, 255, 0)',
      fontColor: Common.choose(world['colorScheme']),
      visible: true,
      collisionFilter: {
        category: 0x0001,
        mask: 0x00000000,
        group: 3,
      },
    };
    const options = Common.extend({}, defaultOptions, _options);
    return Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, options);
  },
};
