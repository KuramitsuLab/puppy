import React, { useState, useEffect } from 'react';
import { Engine, World, Bodies, Render } from 'matter-js';
import { Button } from 'react-bootstrap';
import './PuppyScreen.css';

const PuppyFooter: React.FC = () => {
  return (
    <div className="puppy-footer">
      <Button>Run</Button>
    </div>
  );
};

const engine = Engine.create();

World.add(engine.world, [
  Bodies.rectangle(320, 460, 480, 20, {
    isStatic: true, //固定する
    render: {
      fillStyle: '#977559', // 塗りつぶす色: CSSの記述法で指定
      strokeStyle: 'rgba(0, 0, 0, 0)', // 線の色: CSSの記述法で指定
      lineWidth: 0,
    },
  }),
]);

Engine.run(engine);

let render: Render | null = null;
let canvas: HTMLElement | null = null;

const PuppyScreen: React.FC = () => {
  const [, setState] = useState({});

  let timer: NodeJS.Timeout | null = null;
  addEventListener('resize', () => {
    clearTimeout(timer!);
    timer = setTimeout(function() {
      const w = document.getElementById('left-col')!.clientWidth;
      const h = document.getElementById('left-col')!.clientHeight;
      canvas!.setAttribute('width', w.toString());
      canvas!.setAttribute('height', h.toString());
      render!.options.width = w;
      render!.options.height = h;
      setState({});
    }, 300);
  });

  useEffect(() => {
    const w = document.getElementById('left-col')!.clientWidth;
    const h = document.getElementById('left-col')!.clientHeight;
    const renderOptions = {
      element: document.getElementById('puppy-screen')!,
      engine: engine,
      options: {
        width: w,
        height: h,
        background: 'white',
      },
    };
    if (render) {
      Render.stop(render);
      render.canvas.remove();
      render.textures = {};
    }
    render = Render.create(renderOptions);
    canvas = render.canvas;
    setState({});
    Render.run(render!);
  }, []);

  return (
    <>
      <div id="puppy-screen"></div>
      <PuppyFooter />
    </>
  );
};

export default PuppyScreen;
