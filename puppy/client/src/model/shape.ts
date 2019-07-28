import * as Matter from 'matter-js';

const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Common = Matter['Common'];

import { Puppy } from './puppy';

export type PuppyShape = 'circle' | 'rectangle' | 'trapezoid' | 'polygon' | 'label';
export type CollisionFunc = ({ }, { }) => void;
export type ClickedFunc = ({ }) => void;

export type PuppyConstructor = (puppy: Puppy, options: ShapeOptions) => Matter.Body;

export type ShapeOptions = {
  // Matter Options
  id?: number,
  type?: string,
  label?: string,
  parts?: [],
  plugin?: {},
  angle?: number,
  interia?: number,
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
  opacity?: number,
  sprite?: {
    xScale?: number,
    yScale?: number,
    xOffset?: number,
    yOffset?: number,
  },
  lineWidth?: number
  strokeStyle?: string,

  // Puppy Options
  base?: string,
  column?: number,
  row?: number,
  shape: PuppyShape,
  radius?: number,
  slope?: number,
  sides?: number,
  image?: string,
  created?: number,
  collisionStart?: CollisionFunc,
  collisionEnd?: CollisionFunc,
  collisionActive?: CollisionFunc,
  clicked?: ClickedFunc,
};

// export const isShapeOptions = (obj: {}) => ('shape' in obj) && ('position' in obj) && ('x' in obj['position']) && ('y' in obj['position']);

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

const convColor = (puppy: Puppy, color: any) => {
  if (Array.isArray(color)) {
    color = Common.choose(color);
  }
  if (typeof color === 'number') {
    const list: [string] = puppy.world.colorScheme;
    return list[color % list.length];
  }
  return color;
};

export const PropertyMap: {} = {
  radius: (puppy: Puppy, options: ShapeOptions, value: any) => {
    options.radius = value;
    if (options.base === 'circle') {
      options.width = value * 2;
      options.height = value * 2;
    }
  },
  width: (puppy: Puppy, options: ShapeOptions, value: any) => {
    options.width = value;
    if (options.base === 'circle') {
      options.radius = value / 2;
      options.height = value;
    }
  },
  height: (puppy: Puppy, options: ShapeOptions, value: any) => {
    options.height = value;
    if (options.base === 'circle') {
      options.radius = value / 2;
      options.width = value;
    }
  },
  fillStyle: (puppy: Puppy, options: ShapeOptions, value: any) => {
    options.fillStyle = convColor(puppy, value);
  },
};

export const setMatterProperty = (puppy: Puppy, options: ShapeOptions, key: string, value: any) => {
  if (key in PropertyMap) {
    PropertyMap[key](puppy, options, value);
  }
  else {
    options[key] = value;
  }
  return value;
};

const checkMatterProperty = (puppy: Puppy, options: ShapeOptions, key: string, value?: any) => {
  if (options[key]) {
    return setMatterProperty(puppy, options, key, options[key]);
  } if (value) {
    return setMatterProperty(puppy, options, key, value);
  }
  return undefined;
};

/* constructor functions */

const circle = (puppy: Puppy, options: ShapeOptions) => {
  Object.assign(options, {
    base: 'circle',
    visible: true,
  });
  checkMatterProperty(puppy, options, 'height');
  checkMatterProperty(puppy, options, 'width');
  checkMatterProperty(puppy, options, 'radius', 25);
  checkMatterProperty(puppy, options, 'fillStyle', Common.choose(puppy.world.colorScheme));
  return Bodies.circle(options.position.x, options.position.y, options.radius, options);
};

const rectangle = (puppy: Puppy, options: ShapeOptions) => {
  Object.assign(options, {
    base: 'rectangle',
    visible: true,
  });
  checkMatterProperty(puppy, options, 'width', 100);
  checkMatterProperty(puppy, options, 'height', 100);
  checkMatterProperty(puppy, options, 'fillStyle',
                      options.isStatic ? 'black' : Common.choose(puppy.world.colorScheme));
  return Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, options);
};

const label = (puppy: Puppy, options: ShapeOptions) => {
  Object.assign(options, {
    base: 'rectangle',
    isSensor: true,
    isStatic: true,
    visible: true,
    collisionFilter: {
      category: 0x0001,
      mask: 0x00000000,
      group: 3,
    },
  });
  console.log(options);
  checkMatterProperty(puppy, options, 'width', 100);
  checkMatterProperty(puppy, options, 'height', 100);
  checkMatterProperty(puppy, options, 'fontColor', Common.choose(puppy.world.colorScheme));
  checkMatterProperty(puppy, options, 'fillStyle', 'rgba(255, 255, 255, 0)');
  return Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, options);
};

const drop = (puppy: Puppy, options: ShapeOptions) => {
  Object.assign(options, {
    base: 'circle',
    isSensor: true,
    isStatic: true,
    visible: true,
    collisionFilter: {
      category: 0x0001,
      mask: 0x00000000,
      group: 3,
    },
    created: puppy.getTimeStamp(),
  });
  checkMatterProperty(puppy, options, 'height');
  checkMatterProperty(puppy, options, 'width');
  checkMatterProperty(puppy, options, 'radius', 10);
  checkMatterProperty(puppy, options, 'fillStyle', 0);
  checkMatterProperty(puppy, options, 'opacity', 0.8);
  return Bodies.circle(options.position.x, options.position.y, options.radius, options);
};

const pendulum = (puppy: Puppy, options: ShapeOptions) => {
  const separation = 1.9;
  const column = checkMatterProperty(puppy, options, 'column', 1);
  const width = checkMatterProperty(puppy, options, 'width', 200);
  const height = checkMatterProperty(puppy, options, 'height', 100);
  const size = width / (column * 2);
  const xx = options.position.x;
  const yy = options.position.y;
  const newtonsCradle = Matter.Composite.create({
    label: 'Newtons Cradle',
  });
  for (let i = 0; i < column; i += 1) {
    const circle = Matter.Bodies.circle(xx + i * (size * separation), yy + height,
                                        size, {
                                          inertia: options.interia || Infinity,
                                          restitution: options.restitution || 1,
                                          friction: options.friction || 0,
                                          frictionAir: options.frictionAir || 0.0001,
                                          slop: options.slop || 1,
                                        });
    const constraint = Matter.Constraint.create({
      pointA: {
        x: xx + i * (size * separation),
        y: yy,
      },
      bodyB: circle,
      render: {
        visible: true,
        lineWidth: options.lineWidth | 1,
        strokeStyle: options.strokeStyle || 'gray',
      },
    });
    Composite['addBody'](newtonsCradle, circle);
    Composite['addConstraint'](newtonsCradle, constraint);
  }
  return newtonsCradle;
};

export const setBuildInVariables = (vars: {}) => {
  Object.assign(vars, {
    Circle: circle,
    Rectangle: rectangle,
    //    Polygon: polygon,
    Label: label,
    Drop: drop,
    Pendulum: pendulum,
  });
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
