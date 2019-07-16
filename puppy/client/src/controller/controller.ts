import { puppy } from '../model/puppy';
import { editor, terminal, fontPlus, fontMinus, checkZenkaku } from '../view/editor';
import { exitFullscreen, getFullscreen } from '../view/screen';
import * as marked from 'marked';

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

document.getElementById('font-plus').onclick = () => {
  fontPlus();
};

document.getElementById('font-minus').onclick = () => {
  fontMinus();
};

document.getElementById('extend').onclick = () => {
  puppy.requestFullScreen();
};

/** */

const path = location.pathname;
let page: {} = null;
const gallery = null;

const loadFile: (path: string) => Promise<string> = (path) => {
  return fetch(path, {
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

const submitBuild: (path: string) => Promise<string> = (path) => {
  return fetch(`/build${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/text; charset=utf-8',
    },
    body: editor.getValue(),
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((output: string) => {
    return output;
  });
};

document.getElementById('build').onclick = () => {
  submitBuild(path).then((data: string) => {
    console.log(data);
    const doc = terminal.getValue() + '\n' + data;
    terminal.setValue(doc, -1);
    terminal.resize(true);
    // terminal.scrollToLine(50, true, true, function () { });
    // terminal.gotoLine(50, 10, true);
  }).catch((msg: string) => {
    const doc = terminal.getValue() + '\n' + `${msg}`;
    terminal.setValue(doc, -1);
  });
};

document.getElementById('clear').onclick = () => {
  terminal.setValue('', 0);
};

const transpile: (code: string) => Promise<void> = (code) => {
  const oldCode = window['PuppyVMCode'];
  window['PuppyVMCode'] = undefined;
  return fetch('/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/text; charset=utf-8',
    },
    body: code,
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((js: string) => {
    Function(js)(); // Eval javascript code
    if (!window['PuppyVMCode']) {
      console.log(window['PuppyVMCode']);
      window['PuppyVMCode'] = oldCode;
      throw new Error("Don\'t exist PuppyVMCode in window.");
    }
  },
  ).catch((msg: string) => {
    console.log(msg);
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
    // if (editor.getValue() === '') {
    //   loadFile(`/sample${path}`).then((text) => {
    //     editor.setValue(text);
    //   });
    // }
    if (page['type'] === 'puppy') {
      editor.getSession().clearAnnotations();
      transpile(editor.getValue()).then(() => {
        const errors: [] = window['PuppyVMCode']['errors'];
        console.log(window['PuppyVMCode']);
        let error_count = 0;
        const annos = [];
        for (const e of errors) {
          if (e['type'] === 'error') {
            error_count += 1;
          }
          annos.push(e);
          console.log(e);
        }
        editor.getSession().setAnnotations(annos);
        console.log(`size ${errors.length} ${error_count}`);
        if (error_count == 0) {
          puppy.load(window['PuppyVMCode']);
        }
      });
    }
    checkZenkaku();
    // buttonInactivate('pause');
    // buttonActivate('play');
  },                 400);
});

// window.onload = () => {

let fullscreen = false;
function resizeMe() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const toph = document.getElementById('top').clientHeight;
  console.log('resizeMe', w, h, fullscreen, getFullscreen());
  const ed = document.getElementById('editor');
  ed.style.height = `${(h - toph - 1)}px`;
  const tm = document.getElementById('terminal');
  tm.style.height = `${(h - toph - 1)}px`;
  const dc = document.getElementById('problem');
  dc.style.height = `${(h - toph - 1)}px`;
  const pp = document.getElementById('puppy-screen');
  pp.style.height = `${(h - toph - 1)}px`;
  const gl = document.getElementById('gallery');
  gl.style.height = `${(h - toph - 1)}px`;
  editor.resize();
  terminal.resize();
  if (getFullscreen() != null) {
    fullscreen = true;
  }
  if (fullscreen) {
    puppy.resize(w, h);
    fullscreen = false;
  } else {
    puppy.resize(w / 2, (h - toph - 1));
  }
}
resizeMe();
window.onresize = resizeMe;

loadSetting(path).then((jsonstr: string) => {
  console.log(jsonstr);
  page = JSON.parse(jsonstr);
  if (page['type'] === 'sumomo') {
    const doc = document.getElementById('name');
    doc.innerHTML = 'Sumomo';
  }
  else {
    loadFile('/gallery').then((data: string) => {
      const doc = document.getElementById('gallery');
      doc.innerHTML = data;
    }).catch((msg: string) => {
      console.error(msg);
    });
  }
  // else {
  //   const doc = document.getElementById('name');
  //   doc.innerHTML = 'Puppy';
  // }
  if (page[path]) {
    const doc = document.getElementById('page-title');
    doc.innerHTML = page[path].title;
  }
  showSilde(page['viewmode']);
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
  page['viewmode'] = viewlist[(index + viewlist.length + n) % viewlist.length];
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
  return pages[(index + pages.length + shift) % pages.length] || pages[0];
};

document.getElementById('base').onclick = () => {
  if (path.startsWith('/Puppy')) {
    location.href = '/ITPP/01A';
  }
  else {
    location.href = '/Puppy/Welcome';
  }
};

document.getElementById('next-page').onclick = () => {
  location.href = getPagePath(+1);
};

document.getElementById('prev-page').onclick = () => {
  location.href = getPagePath(-1);
};

document.getElementById('run').onclick = () => {
  console.log(page['type']);
  if (page['type'] === 'puppy') {
    showSilde('puppy-view');
    puppy.load(window['PuppyVMCode']);
    puppy.start();
  }
};
