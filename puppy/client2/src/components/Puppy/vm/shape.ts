import * as Matter from 'matter-js';

const Bodies = Matter.Bodies;
const Composite = Matter.Composite;
const Common = Matter['Common'];

import { Puppy } from './vm'; // eslint-disable-line no-unused-vars

export type PuppyShape =
  | 'circle'
  | 'rectangle'
  | 'trapezoid'
  | 'polygon'
  | 'label';
export type CollisionFunc = (obj1: {}, obj2: {}) => void;
export type ClickedFunc = (obj: {}) => void;

export type PuppyConstructor = (puppy: Puppy, options: Shape) => Matter.Body;

export type Shape = {
  position?: {
    x: number;
    y: number;
  };
  isSensor?: boolean;
  isStatic?: boolean;
  width?: number;
  height?: number;

  angle?: number;
  interia?: number;
  density?: number;
  restitution?: number;
  friction?: number;
  frictionStatic?: number;
  frictionAir?: number;
  collisionFilter?: {
    category: number;
    mask: number;
    group: number;
  };
  slop?: number;
  timeScale?: number;
  visible?: boolean;
  fillStyle?: string;
  opacity?: number;
  lineWidth?: number;
  strokeStyle?: string;

  // Puppy Options
  base?: string;
  shape?: PuppyShape;
  column?: number;
  row?: number;
  radius?: number;
  slope?: number;
  sides?: number;
  image?: string;
  created?: number;
};

// const flatten = part => {
//   console.log(part);
//   Object.keys(part.render).forEach(key => {
//     if (!(key in part)) {
//       console.log(`key ${key}`);
//       part[key] = part.render[key];
//     }
//   });
// };

const convColor = (puppy: Puppy, color: any) => {
  if (Array.isArray(color)) {
    color = Common.choose(color);
  }
  if (typeof color === 'number') {
    const list: [string] = puppy.world!.colorScheme;
    return list[color % list.length];
  }
  return color;
};

export const PropertyMap: {} = {
  radius: (puppy: Puppy, options: Shape, value: any) => {
    options.radius = value;
    if (options.base === 'circle') {
      options.width = value * 2;
      options.height = value * 2;
    }
  },
  width: (puppy: Puppy, options: Shape, value: any) => {
    options.width = value;
    if (options.base === 'circle') {
      options.radius = value / 2;
      options.height = value;
    }
  },
  height: (puppy: Puppy, options: Shape, value: any) => {
    options.height = value;
    if (options.base === 'circle') {
      options.radius = value / 2;
      options.width = value;
    }
  },
  fillStyle: (puppy: Puppy, options: Shape, value: any) => {
    options.fillStyle = convColor(puppy, value);
  },
};

export const setShapeProperty = (
  puppy: Puppy,
  options: Shape,
  key: string,
  value: any
) => {
  if (key in PropertyMap) {
    PropertyMap[key](puppy, options, value);
  } else {
    options[key] = value;
  }
  return value;
};

const checkShapeProperty = (
  puppy: Puppy,
  options: Shape,
  key: string,
  value?: any
) => {
  if (options[key]) {
    return setShapeProperty(puppy, options, key, options[key]);
  }
  if (value) {
    return setShapeProperty(puppy, options, key, value);
  }
  return undefined;
};

/* constructor functions */

const circle = (puppy: Puppy, options: Shape) => {
  Object.assign(options, {
    base: 'circle',
    visible: true,
  });
  checkShapeProperty(puppy, options, 'height');
  checkShapeProperty(puppy, options, 'width');
  checkShapeProperty(puppy, options, 'radius', 25);
  checkShapeProperty(
    puppy,
    options,
    'fillStyle',
    Common.choose(puppy.world!.colorScheme)
  );
  return Bodies.circle(
    options.position!.x,
    options.position!.y,
    options.radius!,
    options
  );
};

const rectangle = (puppy: Puppy, options: Shape) => {
  Object.assign(options, {
    base: 'rectangle',
    visible: true,
  });
  checkShapeProperty(puppy, options, 'width', 100);
  checkShapeProperty(puppy, options, 'height', 100);
  checkShapeProperty(
    puppy,
    options,
    'fillStyle',
    options.isStatic ? 'black' : Common.choose(puppy.world!.colorScheme)
  );
  return Bodies.rectangle(
    options.position!.x,
    options.position!.y,
    options.width!,
    options.height!,
    options
  );
};

const polygon = (puppy: Puppy, options: Shape) => {
  Object.assign(options, {
    base: 'polygon',
    visible: true,
  });
  const sides = checkShapeProperty(puppy, options, 'sides', 5);
  checkShapeProperty(puppy, options, 'height');
  checkShapeProperty(puppy, options, 'width');
  checkShapeProperty(puppy, options, 'radius', 25);
  return Bodies.polygon(
    options.position!.x,
    options.position!.y,
    sides,
    options.radius!,
    options
  );
};

const label = (puppy: Puppy, options: Shape) => {
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
  checkShapeProperty(puppy, options, 'width', 10);
  checkShapeProperty(puppy, options, 'height', 10);
  checkShapeProperty(
    puppy,
    options,
    'fontColor',
    Common.choose(puppy.world!.colorScheme)
  );
  checkShapeProperty(puppy, options, 'fillStyle', 'rgba(255, 255, 255, 0)');
  return Bodies.rectangle(
    options.position!.x,
    options.position!.y,
    options.width!,
    options.height!,
    options
  );
};

const drop = (puppy: Puppy, options: Shape) => {
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
  checkShapeProperty(puppy, options, 'height');
  checkShapeProperty(puppy, options, 'width');
  checkShapeProperty(puppy, options, 'radius', 10);
  checkShapeProperty(puppy, options, 'fillStyle', 0);
  checkShapeProperty(puppy, options, 'opacity', 0.8);
  return Bodies.circle(
    options.position!.x,
    options.position!.y,
    options.radius!,
    options
  );
};

const pendulum = (puppy: Puppy, options: Shape) => {
  const separation = 1.9;
  const column = checkShapeProperty(puppy, options, 'column', 5);
  const width = checkShapeProperty(
    puppy,
    options,
    'width',
    puppy.world!.viewWidth / 2
  );
  const height = checkShapeProperty(
    puppy,
    options,
    'height',
    puppy.world!.viewWidth / 2
  );
  const size = width / (column * 2);
  const xx = options.position!.x - width / 2;
  const yy = options.position!.y - height / 2;
  const newtonsCradle = Matter.Composite.create({
    label: 'Newtons Cradle',
  });
  for (let i = 0; i < column; i += 1) {
    const _options = {
      visible: true,
      fillStyle: Common.choose(puppy.world!.colorScheme),
      inertia: options.interia || Infinity,
      restitution: options.restitution || 1,
      friction: options.friction || 0,
      frictionAir: options.frictionAir || 0.0001,
      slop: options.slop || 1,
    };
    const circle = Matter.Bodies.circle(
      xx + i * (size * separation),
      yy + height,
      size,
      _options
    );
    const constraint = Matter.Constraint.create({
      pointA: {
        x: xx + i * (size * separation),
        y: yy,
      },
      bodyB: circle,
      render: {
        visible: true,
        lineWidth: options.lineWidth! | 1,
        strokeStyle: options.strokeStyle || 'gray',
      },
    });
    Composite['addBody'](newtonsCradle, circle);
    Composite['addConstraint'](newtonsCradle, constraint);
  }
  console.log(newtonsCradle);
  console.log(newtonsCradle['parts']);
  return newtonsCradle;
};

export const initVars = (vars: {}) => {
  Object.assign(vars, {
    Circle: circle,
    Rectangle: rectangle,
    Polygon: polygon,
    Label: label,
    Drop: drop,
    Pendulum: pendulum,
  });
  return vars;
};

/* shapeFunc 物体の形状から物体を生成する関数 */

export type ShapeOptions = {
  // Matter Options
  id?: number;
  type?: string;
  label?: string;
  parts?: [];
  plugin?: {};
  angle?: number;
  interia?: number;
  position: {
    x: number;
    y: number;
  };
  width?: number;
  height?: number;
  force?: {
    x: number;
    y: number;
  };
  torque?: number;
  positionImpulse?: { x?: number; y?: number };
  constraintImpulse?: { x?: number; y?: number; angle?: number };
  totalContacts?: number;
  speed?: number;
  angularSpeed?: number;
  velocity?: { x: number; y: number };
  angularVelocity?: number;
  isSensor?: boolean;
  isStatic?: boolean;
  isSleeping?: boolean;
  motion?: number;
  sleepThreshold?: number;
  density?: number;
  restitution?: number;
  friction?: number;
  frictionStatic?: number;
  frictionAir?: number;
  collisionFilter?: {
    category: number;
    mask: number;
    group: number;
  };
  slop?: number;
  timeScale?: number;
  visible?: boolean;
  fillStyle?: string;
  opacity?: number;
  sprite?: {
    xScale?: number;
    yScale?: number;
    xOffset?: number;
    yOffset?: number;
  };
  lineWidth?: number;
  strokeStyle?: string;

  // Puppy Options
  base?: string;
  shape?: PuppyShape;
  column?: number;
  row?: number;
  radius?: number;
  slope?: number;
  sides?: number;
  image?: string;
  created?: number;
  collisionStart?: CollisionFunc;
  collisionEnd?: CollisionFunc;
  collisionActive?: CollisionFunc;
  clicked?: ClickedFunc;
};

// export const isShapeOptions = (obj: {}) => ('shape' in obj) && ('position' in obj) && ('x' in obj['position']) && ('y' in obj['position']);

export class PuppyShapeBase implements ShapeOptions {
  shape: PuppyShape = 'circle';
  position: {
    x: number;
    y: number;
  };

  constructor(x: number, y: number, options = {}) {
    Object.assign(this, options);
    this.position = { x, y };
  }
}

export class Circle extends PuppyShapeBase {
  shape: PuppyShape = 'circle';
}

export class Rectangle extends PuppyShapeBase {
  shape: PuppyShape = 'rectangle';
}

export class Polygon extends PuppyShapeBase {
  shape: PuppyShape = 'polygon';
}

export class Trapezoid extends PuppyShapeBase {
  shape: PuppyShape = 'trapezoid';
}

export class Label extends PuppyShapeBase {
  shape: PuppyShape = 'label';
}

export const shapeFuncMap: {
  [key in PuppyShape]: (world: {}, options: ShapeOptions) => Matter.Body;
} = {
  circle(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      radius: _options.width
        ? _options.width / 2
        : _options.height
        ? _options.height / 2
        : 25,
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
    return Bodies.circle(
      options.position.x,
      options.position.y,
      options.radius,
      options
    );
  },
  rectangle(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      width: 100,
      height: 100,
      visible: true,
      fillStyle: _options.isStatic
        ? 'black'
        : Common.choose(world['colorScheme']),
    };
    const options = Common.extend({}, defaultOptions, _options);
    return Bodies.rectangle(
      options.position.x,
      options.position.y,
      options.width,
      options.height,
      options
    );
  },
  polygon(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      sides: 5,
      radius: 25,
      visible: true,
      fillStyle: _options.isStatic
        ? 'gray'
        : Common.choose(world['colorScheme']),
    };
    const options = Common.extend(
      {},
      defaultOptions,
      { radius: _options.width ? _options.width / 2 : defaultOptions.radius },
      _options
    );
    return Bodies.polygon(
      options.position.x,
      options.position.y,
      options.sides,
      options.radius,
      options
    );
  },
  trapezoid(world: {}, _options: ShapeOptions) {
    const defaultOptions = {
      width: 100,
      height: 100,
      slope: 0.5,
      visible: true,
      fillStyle: _options.isStatic
        ? 'gray'
        : Common.choose(world['colorScheme']),
    };
    const options = Common.extend({}, defaultOptions, _options);
    return Bodies.trapezoid(
      options.position.x,
      options.position.y,
      options.width,
      options.height,
      options.slope,
      options
    );
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
    return Bodies.rectangle(
      options.position.x,
      options.position.y,
      options.width,
      options.height,
      options
    );
  },
};
