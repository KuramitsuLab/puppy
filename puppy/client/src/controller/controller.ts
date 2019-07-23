import { puppy, loadPuppy, Code } from '../model/puppy';
import { editor, terminal, fontPlus, fontMinus, checkZenkaku } from '../view/editor';
import { exitFullscreen, getFullscreen } from '../view/screen';
import * as marked from 'marked';

const path = location.pathname;
const session = window.sessionStorage;

let page: {} = null;

const getPagePath = (shift: number) => {
  const pages = page['list'];
  let index = 0;
  for (let i = 0; i < pages.length; i += 1) {
    if (pages[i] === path) {
      index = i;
    }
  }
  return pages[(index + pages.length + shift) % pages.length] || pages[0];
};

const showView = (mode: string) => {
  const slides = document.getElementsByClassName('mySlides');
  page['viewmode'] = null;
  for (let i = 0; i < slides.length; i += 1) {
    // console.log(`${i} ${slides[i].id}`);
    if (slides[i].id === mode) {
      slides[i]['style'].display = 'block';
      page['viewmode'] = mode;
    } else {
      slides[i]['style'].display = 'none';
    }
  }
  // console.log(`viewmode ${page['viewmode']}`);
  if (page['viewmode'] == null) {
    slides[0]['style'].display = 'block';
    page['viewmode'] = page['viewlist'][0];
  }
  session.setItem('viewmode', page['viewmode']);
};

const shiftView = (n: number) => {
  const viewmode = page['viewmode'];
  const viewlist: [string] = page['viewlist'];
  let index = 0;
  for (let i = 0; i < viewlist.length; i += 1) {
    if (viewlist[i] === viewmode) {
      index = i;
    }
  }
  return viewlist[(index + viewlist.length + n) % viewlist.length];
};

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

/* setting */

const initPage = () => {
  const page_json = session.getItem('/settings/');
  console.log(`${page_json}`);
  if (page_json) {
    page = JSON.parse(page_json);
  } else {
    loadFile(`/setting${path}`).then((s: string) => {
      page = JSON.parse(s);
      session.setItem('/settings/', s);
    }).catch((msg: string) => {
      console.log(`ERR ${msg}`);
    });
  }
  const doc = document.getElementById('problem');
  loadFile(`/problem${path}`).then((s: string) => {
    doc.innerHTML = marked(s);
  }).catch((msg: string) => {
    doc.innerHTML = `ERR ${msg}`;
  });
  const source = session.getItem(`/sample${path}`);
  if (source) {
    editor.setValue(source, -1);
  } else {
    loadFile(`/sample${path}`).then((s: string) => {
      editor.setValue(s, -1);
      session.setItem(`/sample${path}`, s);
    }).catch((msg: string) => {
      editor.setValue(`#ERR ${msg}`, -1);
    });
  }
  if (page['type'] === 'sumomo') {
    const doc = document.getElementById('name');
    doc.innerHTML = 'Sumomo';
  } else {
    const doc = document.getElementById('gallery');
    loadFile('/gallery').then((s: string) => {
      doc.innerHTML = s;
    }).catch((msg: string) => {
      doc.innerHTML = `ERR ${msg}`;
    });
  }
  if (page[path]) {
    const doc = document.getElementById('page-title');
    doc.innerHTML = page[path].title;
  }
  showView(session.getItem('viewmode') || page['viewmode']);

  let slides = document.getElementsByClassName('next-view');
  for (let i = 0; i < slides.length; i += 1) {
    slides[i]['onclick'] = () => {
      showView(shiftView(+1));
    };
  }
  slides = document.getElementsByClassName('prev-view');
  for (let i = 0; i < slides.length; i += 1) {
    slides[i]['onclick'] = () => {
      showView(shiftView(-1));
    };
  }
};

/* event */

document.getElementById('base').onclick = () => {
  session.removeItem('/settings/');
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

/* puppy-view */

let puppyRunning = false;
const playPanel = document.getElementById('play-panel');
const togglePlay = (t: number) => {
  puppyRunning = true;
  if (((t % 100) | 0) === 0) {
    playPanel.innerHTML = `<i class="fa fa-pause"></i> ${(t / 100) | 0} `;
  }
};

const transpile: (code: string) => Promise<void> = (code) => {
  const oldCode: Code = window['PuppyVMCode'];
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
    try {
      Function(js)(); // Eval javascript code
    }
    catch (e) {
      // alert(`トランスパイルにしっぱいしています ${e}`);
      editorPanel.style.backgroundColor = 'rgba(244,244,254,0.7)';
      console.log(js);
      console.log('FIXME');
      console.log(e);
    }
    if (!window['PuppyVMCode']) {
      window['PuppyVMCode'] = oldCode;
    }
  },
  ).catch((msg: string) => {
    alert(`Puppy is down!! ${msg}`);
  });
};

document.getElementById('play').onclick = () => {
  if (puppyRunning) {
    puppy.pause();
    playPanel.innerHTML = '<i class="fa fa-play"></i> Play ';
    puppyRunning = false;
  } else {
    loadPuppy('puppy-screen', window['PuppyVMCode']);
    puppy.start(togglePlay);
  }
};

// document.getElementById('pause').onclick = () => {
//   puppy.pause();
// };

// document.getElementById('step').onclick = () => {
//   puppy.step();
// };

document.getElementById('extend').onclick = () => {
  if (puppy != null) {
    const canvas = puppy.getCanvas();
    if (canvas) { // FIXME
      if (canvas['webkitRequestFullscreen']) {
        canvas['webkitRequestFullscreen'](); // Chrome15+, Safari5.1+, Opera15+
      } else if (this.canvas['mozRequestFullScreen']) {
        canvas['mozRequestFullScreen'](); // FF10+
      } else if (this.canvas['msRequestFullscreen']) {
        canvas['msRequestFullscreen'](); // IE11+
      } else if (this.canvas['requestFullscreen']) {
        canvas['requestFullscreen'](); // HTML5 Fullscreen API仕様
      } else {
        // alert('ご利用のブラウザはフルスクリーン操作に対応していません');
        return;
      }
    }
    // loadPuppy('puppy-screen', window['PuppyVMCode']);
    // puppy.start(togglePlay);
  }
};

/** */

document.getElementById('run').onclick = () => {
  console.log(page['type']);
  if (page['type'] === 'puppy') {
    showView('puppy-view');
    loadPuppy('puppy-screen', window['PuppyVMCode']);
    puppy.start(togglePlay);
  }
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
    const doc = `${terminal.getValue()}\n${data}`;
    terminal.setValue(doc, -1);
    terminal.resize(true);
    // terminal.scrollToLine(50, true, true, function () { });
    // terminal.gotoLine(50, 10, true);
  }).catch((msg: string) => {
    const doc = `${terminal.getValue()}\n${msg}`;
    terminal.setValue(doc, -1);
  });
};

document.getElementById('clear').onclick = () => {
  terminal.setValue('', 0);
};

/* editor */

let timer = null;
const editorPanel = document.getElementById('editor');

editor.on('change', (cm, obj) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  editorPanel.style.backgroundColor = 'rgba(255,255,255,0.7)';
  timer = setTimeout(() => {
    if (page['type'] === 'puppy') {
      let prevhash = '';
      if (window['PuppyVMCode']) {
        prevhash = window['PuppyVMCode']['hash'];
      }
      editor.getSession().clearAnnotations();
      transpile(editor.getValue()).then(() => {
        const code: Code = window['PuppyVMCode'];
        let error_count = 0;
        const annos = [];
        for (const e of code.errors) {
          if (e['type'] === 'error') {
            error_count += 1;
          }
          annos.push(e);
          editor.getSession().setAnnotations(annos);
        }
        // console.log(`PREV ${prevhash}`);
        if (error_count === 0) {
          if (code.hash === prevhash) {
            // console.log(`HASH ${code.hash}`);
            puppy['lines'] = code['lines'];
          }
          else {
            loadPuppy('puppy-screen', code);
            puppy.start(togglePlay);
            session.setItem(`/sample${path}`, editor.getValue());
          }
        }
        else {
          editorPanel.style.backgroundColor = 'rgba(254,244,244,0.7)';
        }
      });
    }
    checkZenkaku();
    // buttonInactivate('pause');
    // buttonActivate('play');
  },                 400);
});

document.getElementById('font-plus').onclick = () => {
  fontPlus();
};

document.getElementById('font-minus').onclick = () => {
  fontMinus();
};

// resize

let fullscreen = false;

function resizeMe() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const toph = document.getElementById('top').clientHeight;
  console.log('resize', w, h, fullscreen, getFullscreen());
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
    if (puppy != null) {
      puppy.resize(w, h);
    }
    fullscreen = false;
  } else {
    if (puppy != null) {
      puppy.resize(w / 2, (h - toph - 1));
    }
  }
}
initPage();
resizeMe();
window.onresize = resizeMe;
