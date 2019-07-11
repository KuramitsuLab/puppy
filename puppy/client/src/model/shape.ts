import * as Matter from 'matter-js';

const Bodies = Matter.Bodies;
const Common = Matter['Common'];

export type PuppyShape = 'circle' | 'rectangle' | 'trapezoid' | 'polygon' | 'label';
export type CollisionFunc = ({}, {}) => void;
export type ClickedFunc = ({}) => void;

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

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type DefaultOptions = Omit<ShapeOptions, 'position'>;

export const defaultOptionsMap: { [key in PuppyShape]: DefaultOptions} = {
  circle: {
    shape: 'circle',
    radius: 25,
  },
  rectangle: {
    shape: 'rectangle',
    width: 100,
    height: 100,
  },
  polygon: {
    shape: 'polygon',
    sides: 5,
    radius: 25,
  },
  trapezoid: {
    shape: 'trapezoid',
    width: 100,
    height: 100,
    slope: 0.5,
  },
  label: {
    shape: 'label',
    width: 100,
    height: 100,
    isSensor: true,
    isStatic: true,
    fillStyle: 'rgba(255, 255, 255, 0)',
  },
};

/* shapeFunc 物体の形状から物体を生成する関数 */
export const shapeFuncMap: { [key in PuppyShape]: (options: ShapeOptions) => Matter.Body } = {
  circle(_options: ShapeOptions) {
    const defaultOptions = defaultOptionsMap[_options.shape];
    const options = Common.extend({}, defaultOptions, { radius: _options.width ? _options.width / 2 : defaultOptions.radius }, _options);
    return Bodies.circle(options.position.x, options.position.y, options.radius, options);
  },
  rectangle(_options: ShapeOptions) {
    const options = Common.extend({}, defaultOptionsMap[_options.shape], _options);
    return Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, options);
  },
  polygon(_options: ShapeOptions) {
    const defaultOptions = defaultOptionsMap[_options.shape];
    const options = Common.extend({}, defaultOptions, { radius: _options.width ? _options.width / 2 : defaultOptions.radius }, _options);
    return Bodies.polygon(options.position.x, options.position.y, options.sides, options.radius, options);
  },
  trapezoid(_options: ShapeOptions) {
    const options = Common.extend({}, defaultOptionsMap[_options.shape], _options);
    return Bodies.trapezoid(options.position.x, options.position.y, options.width, options.height, options.slope, options);
  },
  label(_options: ShapeOptions) {
    const options = Common.extend({}, defaultOptionsMap[_options.shape], _options);
    return Bodies.rectangle(options.position.x, options.position.y, options.width, options.height, options);
  },
};
