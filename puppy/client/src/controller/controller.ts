import { puppy } from '../model/puppy';
import { getSample } from '../model/api';
import { editor, fontPlus, fontMinus } from '../view/editor';
import { exitFullscreen, getFullscreen } from '../view/screen';
// import { buttonActivate, buttonInactivate } from '../view/button';
import * as marked from 'marked';

let timer = null;

editor.on('change', (cm, obj) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(() => {
    console.log('EDITOR CHANGE');
    puppy.compile(editor.getValue());
    // buttonInactivate('pause');
    // buttonActivate('play');
  },                 400);
});

let fullscreen = false;

function resizeMe() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  console.log('resizeMe', w, h, fullscreen, getFullscreen());
  if (getFullscreen() != null) {
    fullscreen = true;
  }
  if (fullscreen) {
    const min = Math.min(w, h);
    puppy.set_window_size(min, min);
    fullscreen = false;
  } else {
    if (w <= 800) {
      puppy.set_window_size(w, w);
    } else {
      const min = Math.min(w / 2, h);
      puppy.set_window_size(min, min);
    }
  }
}

// window.onload = resizeMe;
// window.onclick = resizeMe;

document.getElementById('play').onclick = () => {
  puppy.load(window['PuppyVMCode']);
  // puppy.start();
  // buttonInactivate('play');
  // buttonActivate('pause');
};

document.getElementById('pause').onclick = () => {
  puppy.pause();
  // buttonInactivate('pause');
  // buttonActivate('play');
};

document.getElementById('step').onclick = () => {
  puppy.step();
};

// document.getElementById('debug').onclick = () => {
//   puppy.debug();
// };

document.getElementById('font-plus').onclick = () => {
  fontPlus();
};

document.getElementById('font-minus').onclick = () => {
  fontMinus();
};

document.onkeydown = (evt) => {
  if (evt.keyCode === 27) {
    exitFullscreen();
  }
};

document.getElementById('extend').onclick = () => {
  puppy.requestFullScreen();
};

/** */

const path = location.pathname;
const setting: {} = null;

export const loadSetting: (path: string) => Promise<string> = (path) => {
  return fetch(`/setting${path}`, {
    method: 'GET',
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((sample: string) => {
    return sample;
  });
};

export const loadSample: (path: string) => Promise<string> = (path) => {
  return fetch(`/sample${path}`, {
    method: 'GET',
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((sample: string) => {
    return sample;
  });
};

export const loadProblem: (path: string) => Promise<string> = (path) => {
  return fetch(`/problem${path}`, {
    method: 'GET',
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((sample: string) => {
    return sample;
  });
};

// window.onload = () => {
resizeMe();

loadSetting(path).then((data: string) => {
  console.log(data);

}).catch((msg: string) => {
  console.error(msg);
});

loadProblem(path).then((data: string) => {
  console.log(data);
  const doc = document.getElementById('problem');
  doc.innerHTML = marked(data);
  // MathJax.Hub.Queue(['Typeset', MathJax.Hub, doc]);
}).catch((msg: string) => {
  console.error(msg);
});
loadSample(path).then((sample: string) => {
  console.log(sample);
  editor.setValue(sample);
}).catch((msg: string) => {
  console.error(msg);
});
// };
