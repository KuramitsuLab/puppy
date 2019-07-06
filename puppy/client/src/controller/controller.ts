import { puppy } from '../model/puppy';
import { getSample } from '../model/api';
import { editor, fontPlus, fontMinus, addZenkaku } from '../view/editor';
import { exitFullscreen, getFullscreen } from '../view/screen';
// import { buttonActivate, buttonInactivate } from '../view/button';
import * as marked from 'marked';

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
  puppy.start();
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

/**
document.onkeydown = (evt) => {
  if (evt.keyCode === 27) {
    exitFullscreen();
  }
};
*/

document.getElementById('extend').onclick = () => {
  puppy.requestFullScreen();
};

/** */

const path = location.pathname;
let page: {} = null;

const loadSetting: (path: string) => Promise<string> = (path) => {
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

const loadSample: (path: string) => Promise<string> = (path) => {
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

const loadProblem: (path: string) => Promise<string> = (path) => {
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

let timer = null;

editor.on('change', (cm, obj) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(() => {
    console.log(`EDITOR CHANGE ${page['viewmode']}`);
    if (page['viewmode'] === 'puppy-view') {
      puppy.compile(editor.getValue());
    }
    check();
    // buttonInactivate('pause');
    // buttonActivate('play');
  },                 400);
});

const check = () => {
  addZenkaku(2, 3, 2, 8);
};

// window.onload = () => {
resizeMe();

loadSetting(path).then((jsonstr: string) => {
  console.log(jsonstr);
  page = JSON.parse(jsonstr);
  if (page['type']) {
    console.log(page['type']);
  }
  if (page[path]) {
    const doc = document.getElementById('page-title');
    doc.innerHTML = page[path].title;
  }

}).catch((msg: string) => {
  console.error(msg);
});

loadProblem(path).then((data: string) => {
  // console.log(data);
  const doc = document.getElementById('problem');
  doc.innerHTML = marked(data);
  // MathJax.Hub.Queue(['Typeset', MathJax.Hub, doc]);
}).catch((msg: string) => {
  console.error(msg);
});

loadSample(path).then((sample: string) => {
  // console.log(sample);
  editor.setValue(sample, -1);  // 行番号の先頭にする
}).catch((msg: string) => {
  console.error(msg);
});
// };

const showSilde = (mode: string) => {
  const slides = document.getElementsByClassName('mySlides');
  page['viewmode'] = null;
  for (let i = 0; i < slides.length; i++) {
    console.log(`${i} ${slides[i].id}`);
    if (slides[i].id === mode) {
      slides[i]['style'].display = 'block';
      page['viewmode'] = mode;
    } else {
      slides[i]['style'].display = 'none';
    }
  }
  console.log(`viewmode ${page['viewmode']}`);
  if (page['viewmode'] == null) {
    slides[0]['style'].display = 'block';
    page['viewmode'] = page['viewlist'][0];
  }
};

const shiftSlide = (n: number) => {
  const viewmode = page['viewmode'];
  const viewlist: [string] = page['viewlist'];
  let index = 0;
  for (let i = 0; i < viewlist.length; i++) {
    if (viewlist[i] === viewmode) {
      index = i;
    }
  }
  page['viewmode'] = viewlist[(index + n) % viewlist.length];
};

const setSlideButtons = () => {
  let slides = document.getElementsByClassName('next-view');
  for (let i = 0; i < slides.length; i++) {
    slides[i]['onclick'] = () => {
      shiftSlide(+1);
      showSilde(page['viewmode']);
    };
  }
  slides = document.getElementsByClassName('prev-view');
  for (let i = 0; i < slides.length; i++) {
    slides[i]['onclick'] = () => {
      shiftSlide(-1);
      showSilde(page['viewmode']);
    };
  }
};
setSlideButtons();

const getPagePath = (shift: number) => {
  const pages = page['list'];
  let index = 0;
  for (let i = 0; i < pages.length; i++) {
    if (pages[i] === path) {
      index = i;
    }
  }
  return pages[index + shift % pages.length];
};

document.getElementById('next-page').onclick = () => {
  location.href = getPagePath(+1);
};

document.getElementById('prev-page').onclick = () => {
  location.href = getPagePath(-1);
};
