import * as ace from '../../node_modules/ace-builds/src-min-noconflict/ace.js';
import * as python_mode from '../../node_modules/ace-builds/src-min-noconflict/mode-python.js';

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

export const addZenkaku = (r1: number, c1: number, r2: number, c2: number) => {
  editor.getSession().addMarker(new ace.Range(r1, c1, r2, c2), 'utf8', 'text');
};

document.getElementsByClassName('ace_gutter')[0].setAttribute('style', 'background: rgb(49, 48, 47); color: white;');
