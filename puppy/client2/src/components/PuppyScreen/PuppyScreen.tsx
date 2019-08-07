import React, { useState, useEffect } from 'react';
import { Engine, World, Bodies, Render } from 'matter-js';

const engine = Engine.create();

World.add(engine.world, [
  Bodies.rectangle(320, 460, 480, 20, {
    isStatic: true, //固定する
    render: {
      fillStyle: '#977559', // 塗りつぶす色: CSSの記述法で指定
      strokeStyle: 'rgba(0, 0, 0, 0)', // 線の色: CSSの記述法で指定
      lineWidth: 0
    }
  })
]);

Engine.run(engine);

let render: Render | null = null;
let canvas: HTMLElement | null = null;

const PuppyScreen: React.FC = () => {
  const [height, setHeight] = useState(500);
  const [width, setWidth] = useState(500);

  addEventListener('resize', () => {
    canvas!.setAttribute('width', width.toString());
    canvas!.setAttribute('height', height.toString());
    setWidth(document.getElementById('left-col')!.clientWidth);
    setHeight(document.getElementById('left-col')!.clientHeight);
  });

  useEffect(() => {
    const w = document.getElementById('left-col')!.clientWidth;
    const h = document.getElementById('left-col')!.clientHeight;
    setWidth(w);
    setHeight(h);
    const renderOptions = {
      element: document.getElementById('puppy-screen')!,
      engine: engine,
      options: {
        width: w,
        height: h,
        background: 'white'
      }
    };
    if (render) {
      Render.stop(render);
      render.canvas.remove();
      render.textures = {};
    }
    render = Render.create(renderOptions);
    canvas = render.canvas;
    Render.run(render!);
  }, []);

  return <div id="puppy-screen"></div>;
};

export default PuppyScreen;
