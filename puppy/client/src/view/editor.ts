import * as ace from '../../node_modules/ace-builds/src-min-noconflict/ace.js';
// import * as solarized_light from '../../node_modules/ace-builds/src-min-noconflict/theme-solarized_light.js';
import * as python_mode from '../../node_modules/ace-builds/src-min-noconflict/mode-python.js';
// import * as js_mode from '../../node_modules/ace-builds/src-min-noconflict/mode-javascript.js';
import * as $ from 'jquery';

const editorState = {
  fontSize: 20,
};

export const setFontSize = (size: number) => {
  document.getElementById('editor').style.fontSize = `${size}px`;
};

export const fontPlus = () => {
  editorState.fontSize += 2;
  setFontSize(editorState.fontSize);
};

export const fontMinus = () => {
  editorState.fontSize = Math.max(8, editorState.fontSize - 2);
  setFontSize(editorState.fontSize);
};

export const editor = ace.edit('editor');
// editor.setTheme(solarized_light);
editor.getSession().setMode(new python_mode.Mode());
// editor.getSession().setMode(new js_mode.Mode());
editor.getSession().setUseWrapMode(true); /* 折り返しあり */
setFontSize(20);

$('.ace_gutter').css({ background: 'rgb(49,48,47)', color: 'white' });
