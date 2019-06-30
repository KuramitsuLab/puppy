import { puppy } from '../model/puppy';
import { getSample } from '../model/api';
import { editor, fontPlus, fontMinus } from '../view/editor';
import { exitFullscreen, getFullscreen } from '../view/screen';
import { buttonActivate, buttonInactivate } from '../view/button';

let timer = null;
editor.on('change', (cm, obj) => {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  timer = setTimeout(() => {
    puppy.compile(editor.getValue());
    buttonInactivate('pause');
    buttonActivate('play');
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

window.onload = resizeMe;
window.onclick = resizeMe;

document.getElementById('play').onclick = () => {
  puppy.dynamic_start();
  buttonInactivate('play');
  buttonActivate('pause');
};

document.getElementById('pause').onclick = () => {
  puppy.pause();
  buttonInactivate('pause');
  buttonActivate('play');
};

document.getElementById('reload').onclick = () => {
  puppy.load(window['PuppyVMCode']);
  buttonInactivate('pause');
  buttonActivate('play');
};

document.getElementById('debug').onclick = () => {
  puppy.debug();
};

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

getSample('ppy/sample.ppy').then((sample: string) => {
  editor.setValue(sample);
  puppy.compile(editor.getValue());
}).catch((msg: string) => {
  console.error(msg);
});
