import React, { useState } from 'react';
// import { Engine, World, Bodies, Render } from 'matter-js';
import { Button } from 'react-bootstrap';
import './PuppyScreen.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faExpand,
  faBookOpen,
} from '@fortawesome/free-solid-svg-icons';

import { puppy, trancepiler } from '../Editor/Editor';

const PuppyFooter: React.FC = () => {
  const onClick = () => {
    trancepiler(true);
  };
  return (
    <div id="puppy-footer">
      <Button variant="dark" onClick={onClick}>
        <FontAwesomeIcon icon={faPlay} />
        {' Play'}
      </Button>
      <Button variant="dark">
        <FontAwesomeIcon icon={faExpand} />
      </Button>
      <Button variant="dark">
        <FontAwesomeIcon icon={faBookOpen} />
      </Button>
    </div>
  );
};

const PuppyScreen: React.FC = () => {
  const [, setState] = useState({});

  let timer: NodeJS.Timeout | null = null;
  addEventListener('resize', () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
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
      <div id="puppy-screen"></div>
      <PuppyFooter />
    </>
  );
};

export default PuppyScreen;
