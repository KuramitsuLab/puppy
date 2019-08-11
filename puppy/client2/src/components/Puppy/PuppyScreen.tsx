import React, { useState } from 'react';
// import { Engine, World, Bodies, Render } from 'matter-js';
import { Button } from 'react-bootstrap';
import './PuppyScreen.css';

import { puppy, trancepiler } from '../Editor/Editor';

const PuppyFooter: React.FC = () => {
  const onClick = () => {
    trancepiler(true);
  };
  return (
    <div className="puppy-footer">
      <Button onClick={onClick}>Run</Button>
    </div>
  );
};

const PuppyScreen: React.FC = () => {
  const [, setState] = useState({});

  let timer: NodeJS.Timeout | null = null;
  addEventListener('resize', () => {
    clearTimeout(timer!);
    timer = setTimeout(function() {
      const w = document.getElementById('left-col')!.clientWidth;
      const h = document.getElementById('left-col')!.clientHeight;
      if (puppy) {
        puppy.resize(w, h);
      }
      setState({});
    }, 300);
  });

  return (
    <>
      <div id="puppy-screen" style={{ width: '100%', height: '100%' }}></div>
      <PuppyFooter />
    </>
  );
};

export default PuppyScreen;
