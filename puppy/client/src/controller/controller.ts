import * as $ from 'jquery';
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
    buttonInactivate('#pause');
    buttonActivate('#play');
  },                 400);
});

let fullscreen = false;

function resizeMe() {
  const w = $(window).width();
  const h = $(window).height();
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

$(window).on('load', resizeMe);
$(window).on('resize', resizeMe);

$('#play').on('click', () => {
  puppy.start();
  buttonInactivate('#play');
  buttonActivate('#pause');
});

$('#pause').on('click', () => {
  puppy.pause();
  buttonInactivate('#pause');
  buttonActivate('#play');
});

$('#reload').on('click', () => {
  puppy.load(window['PuppyVMCode']);
  buttonInactivate('#pause');
  buttonActivate('#play');
});

$('#debug').on('click', () => {
  puppy.debug();
});

$('#font-plus').on('click', () => {
  fontPlus();
});

$('#font-minus').on('click', () => {
  fontMinus();
});

$(document).on('keydown', (evt) => {
  // KeyCode 27: ESC button
  if (evt.keyCode === 27) {
    exitFullscreen();
  }
});

$('#extend').on('click', () => {
  puppy.requestFullScreen();
});

getSample('ppy/sample.ppy').then((sample: string) => {
  editor.setValue(sample);
  puppy.compile(editor.getValue());
}).catch((msg: string) => {
  console.error(msg);
});
