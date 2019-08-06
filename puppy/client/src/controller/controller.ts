import { initPuppy, runPuppy, PuppyCode, Puppy, chooseColorScheme } from '../model/puppy';
import { editor, terminal, fontPlus, fontMinus, checkZenkaku } from '../view/editor';
import { getFullscreen } from '../view/screen';
import * as marked from 'marked';

const path = location.pathname;
const session = window.sessionStorage;
let page: {} = null;

const getCourse = () => {
  const path = location.pathname;
  const pos = path.lastIndexOf('/');
  if (pos > 0) {
    return path.substring(0, pos);
  }
  return path;
};

const getProblem = () => {
  return location.pathname;
};

const nextProblem = (shift: number) => {
  const path = location.pathname;
  const problems = page['list'];
  let index = 0;
  for (let i = 0; i < problems.length; i += 1) {
    console.log(`path ${problems[i]} ${path}`);
    if (problems[i] === path) {
      index = i;
    }
  }
  const pagepath = problems[(index + problems.length + shift) % problems.length] || problems[0];
  location.pathname = pagepath.startsWith('/') ? pagepath : `${getCourse()}/${pagepath}`;
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

const nextView = (n: number) => {
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

const onClick = (key: string, f: () => void) => {
  const slides = document.getElementsByClassName(key);
  for (let i = 0; i < slides.length; i += 1) {
    slides[i]['onclick'] = f;
  }
};

const initPage = () => {
  const course = getCourse();
  const page_json = session.getItem(`/settings/${course}`);
  chooseColorScheme('pop');
  if (page_json) {
    page = JSON.parse(page_json);
    loadPage(page);
  } else {
    loadFile(`/setting${path}`).then((s: string) => {
      page = JSON.parse(s);
      session.setItem(`/settings/${course}`, s);
      loadPage(page);
    }).catch((msg: string) => {
      console.log(`ERR ${msg}`);
      location.pathname = '/';
      return;
    });
  }
  const doc = document.getElementById('name');
  doc.innerHTML = course.substring(1);
  // if (page['type'] === 'sumomo') {
  //   const doc = document.getElementById('name');
  //   doc.innerHTML = 'Sumomo';
  // } else {
  //   // const doc = document.getElementById('gallery');
  //   // loadFile('/gallery').then((s: string) => {
  //   //   doc.innerHTML = s;
  //   // }).catch((msg: string) => {
  //   //   doc.innerHTML = `ERR ${msg}`;
  //   // });
  // }
  onClick('prev-problem', () => { nextProblem(-1); });
  onClick('next-problem', () => {
    showView('problem-view');
    nextProblem(+1);
  });
  onClick('prev-veiw', () => { showView(nextView(-1)); });
  onClick('next-veiw', () => { showView(nextView(+1)); });
};

const loadPage = (page: {}) => {
  const problem = getProblem();
  // if (page[problem]) {
  //   const doc = document.getElementById('page-title');
  //   doc.innerHTML = page[problem].title;
  // }
  const doc = document.getElementById('problem');
  loadFile(`/problem${problem}`).then((s: string) => {
    doc.innerHTML = marked(s);
  }).catch((msg: string) => {
    doc.innerHTML = `ERR ${msg}`;
  });
  const source = session.getItem(`/sample${problem}`);
  if (source) {
    editor.setValue(source, -1);
  } else {
    loadFile(`/sample${path}`).then((s: string) => {
      editor.setValue(s, -1);
      session.setItem(`/sample${problem}`, s);
    }).catch((msg: string) => {
      editor.setValue(`#ERR ${msg}`, -1);
    });
  }
  showView(session.getItem('viewmode') || page['viewmode']);
};

document.getElementById('prev-problem').onclick = () => nextProblem(-1);
document.getElementById('next-problem').onclick = () => nextProblem(+1);
document.getElementById('openbook').onclick = () => showView('problem-view');

/* event */

document.getElementById('base').onclick = () => {
  if (path.startsWith('/Puppy')) {
    location.href = '/ITPP/01A';
  }
  else {
    location.href = '/Puppy/Welcome';
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

/* puppy */

let puppy: Puppy = null;

const playPanel = document.getElementById('play-panel');
const togglePlay = (t: number) => {
  playPanel.innerHTML = `<i class="fa fa-pause"></i> ${t | 0} `;
};

const intent = {
  tick: [
    (log: {}) => {
      playPanel.innerHTML = `<i class="fa fa-pause"></i> ${log['tick'] | 0} `;
    },
  ],
};

const addIntent = (type: string, f: ({ }) => void) => {
  if (!intent['type']) {
    intent[type] = [f];
  }
  else {
    intent[type].push(f);
  }
};

const ftrace = (log: {}) => {
  if (log['intent']) {
    const fs = intent[log['intent']];
    if (fs) {
      for (let i = 0; i < fs.length; i += 1) {
        fs(log);
      }
    }
  }
};

initPuppy({
  canvas: 'puppy-screen',
  eachUpdate: togglePlay,
  ftrace,
});

document.getElementById('play').onclick = () => {
  if (puppy && puppy.isRunning()) {
    puppy.pause();
    playPanel.innerHTML = '<i class="fa fa-play"></i> Play ';
  } else {
    transpile(editor.getValue(), true);
  }
};

const checkError = (code: PuppyCode) => {
  let error_count = 0;
  const annos = [];
  editor.getSession().clearAnnotations();
  for (const e of code.errors) {
    if (e['type'] === 'error') {
      error_count += 1;
    }
    annos.push(e);
    editor.getSession().setAnnotations(annos);
  }
  if (error_count === 0) {
    return false;
  }
  editorPanel.style.backgroundColor = 'rgba(254,244,244,0.7)';
  return true;
};

const transpile: (source: string, alwaysRun: boolean) => Promise<void> = (source, alwaysRun) => {
  return fetch('/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/text; charset=utf-8',
    },
    body: source,
  }).then((res: Response) => {
    if (res.ok) {
      return res.text();
    }
    throw new Error(res.statusText);
  }).then((js: string) => {
    try {
      const code = Function(js)(); // Eval javascript code
      if (!checkError(code)) {
        session.setItem(`/sample${path}`, source);
        puppy = runPuppy(puppy, code, alwaysRun);
      }
    }
    catch (e) {
      // alert(`トランスパイルにしっぱいしています ${e}`);
      editorPanel.style.backgroundColor = 'rgba(244,244,254,0.7)';
      console.log(js);
      console.log(`FAIL TO TRANSCOMPILE ${e}`);
      console.log(e);
    }
  },
  ).catch((msg: string) => {
    alert(`Puppy is down!! ${msg}`);
  });
};

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
  }
};

/** */

document.getElementById('run').onclick = () => {
  console.log(page['type']);
  if (page['type'] === 'puppy') {
    showView('puppy-view');
    transpile(editor.getValue(), true);
  }
};

/* editor */

let timer = null;
let liveMode = false;
const editorPanel = document.getElementById('editor');
const livePanel = document.getElementById('live-toggle');

editor.on('change', (cm, obj) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  editorPanel.style.backgroundColor = 'rgba(255,255,255,0.7)';
  timer = setTimeout(() => {
    if (liveMode && page['type'] === 'puppy') {
      transpile(editor.getValue(), false);
    }
    checkZenkaku();
  },                 1000);
});

livePanel.onclick = () => {
  if (liveMode) {
    liveMode = false;
    livePanel.innerHTML = '<i class="fa fa-toggle-off" ></i>';
  }
  else {
    liveMode = true;
    livePanel.innerHTML = '<i class="fa fa-toggle-on" ></i>';
  }
};

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
