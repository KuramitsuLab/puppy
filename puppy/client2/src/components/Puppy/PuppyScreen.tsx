import React, { useState } from 'react';
// import { Engine, World, Bodies, Render } from 'matter-js';
import { Button } from 'react-bootstrap';
import './PuppyScreen.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faExpand,
  faBookOpen,
  faBook,
} from '@fortawesome/free-solid-svg-icons';

import { puppy, trancepile } from '../Editor/Editor';
import { SetState } from '../../react-app-env';

type PuppyFooterProps = {
  isCourse: boolean;
  setIsCourse: SetState<boolean>;
  code: string;
};

const PuppyFooter: React.FC<PuppyFooterProps> = (props: PuppyFooterProps) => {
  const onClick = () => {
    trancepile(props.code, true);
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
      <Button variant="dark" onClick={() => props.setIsCourse(!props.isCourse)}>
        <FontAwesomeIcon icon={props.isCourse ? faBook : faBookOpen} />
      </Button>
    </div>
  );
};

type PuppyScreenProps = {
  isCourse: boolean;
  setIsCourse: SetState<boolean>;
  code: string;
};

const PuppyScreen: React.FC<PuppyScreenProps> = (props: PuppyScreenProps) => {
  const [, setState] = useState({});

  let timer: NodeJS.Timeout | null = null;
  addEventListener('resize', () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(function() {
      const w = document.getElementById('puppy-screen')!.clientWidth;
      const h = document.getElementById('puppy-screen')!.clientHeight;
      if (puppy) {
        puppy.resize(w, h);
      }
      setState({});
    }, 300);
  });

  return (
    <>
      <div id="puppy-screen"></div>
      <PuppyFooter
        isCourse={props.isCourse}
        setIsCourse={props.setIsCourse}
        code={props.code}
      />
    </>
  );
};

export default PuppyScreen;
