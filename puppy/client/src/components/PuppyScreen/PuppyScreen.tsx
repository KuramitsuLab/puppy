import React from 'react';
import { Puppy } from '../../vm/vm';
import { Button } from 'react-bootstrap';
import './PuppyScreen.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faExpand,
  faBookOpen,
  faBook,
} from '@fortawesome/free-solid-svg-icons';

type PuppyFooterProps = {
  isCourseVisible: boolean;
  setIsCourseVisible: (visible: boolean) => void;
  code: string;
  puppy: Puppy | null;
  trancepile: (puppy: Puppy | null, code: string, alwaysRun: boolean) => void;
};

const PuppyFooter: React.FC<PuppyFooterProps> = (props: PuppyFooterProps) => {
  const fullscreen = () => {
    if (props.puppy != null) {
      const canvas = props.puppy.getCanvas();
      if (canvas) {
        // FIXME
        if (canvas['webkitRequestFullscreen']) {
          canvas['webkitRequestFullscreen'](); // Chrome15+, Safari5.1+, Opera15+
        } else if (canvas['mozRequestFullScreen']) {
          canvas['mozRequestFullScreen'](); // FF10+
        } else if (canvas['msRequestFullscreen']) {
          canvas['msRequestFullscreen'](); // IE11+
        } else if (canvas['requestFullscreen']) {
          canvas['requestFullscreen'](); // HTML5 Fullscreen API仕様
        } else {
          // alert('ご利用のブラウザはフルスクリーン操作に対応していません');
          return;
        }
      }
    }
  };
  return (
    <div id="puppy-footer">
      <Button onClick={() => props.trancepile(props.puppy, props.code, true)}>
        <FontAwesomeIcon icon={faPlay} />
        {' Play'}
      </Button>
      <Button onClick={fullscreen}>
        <FontAwesomeIcon icon={faExpand} />
      </Button>
      <Button onClick={() => props.setIsCourseVisible(!props.isCourseVisible)}>
        <FontAwesomeIcon icon={props.isCourseVisible ? faBook : faBookOpen} />
      </Button>
    </div>
  );
};

export type PuppyScreenProps = PuppyFooterProps & {
  setSize: (width: number, height: number) => void;
};

let timer: NodeJS.Timeout | null = null;

const PuppyScreen: React.FC<PuppyScreenProps> = (props: PuppyScreenProps) => {
  addEventListener('resize', () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(function() {
      const w = document.getElementById('puppy-screen')!.clientWidth;
      const h = document.getElementById('puppy-screen')!.clientHeight;
      props.setSize(w, h);
    }, 300);
  });

  return (
    <>
      <div id="puppy-screen"></div>
      <PuppyFooter
        isCourseVisible={props.isCourseVisible}
        setIsCourseVisible={props.setIsCourseVisible}
        code={props.code}
        puppy={props.puppy}
        trancepile={props.trancepile}
      />
    </>
  );
};

export default PuppyScreen;
