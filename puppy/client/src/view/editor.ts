import * as ace from '../../node_modules/ace-builds/src-min-noconflict/ace.js';
import * as python_mode from '../../node_modules/ace-builds/src-min-noconflict/mode-python.js';

const editorState = {
  fontSize: 18,
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

ace.require('ace/ext/language_tools');
const Range4 = ace.require('ace/range').Range;

export const editor = ace.edit('editor');
editor.getSession().setMode(new python_mode.Mode());
editor.getSession().setUseWrapMode(true); /* 折り返しあり */
// https://github.com/ajaxorg/ace/wiki/Embedding---API
// editor.setOptions({
//   enableBasicAutocompletion: true,
//   enableSnippets: true,
//   enableLiveAutocompletion: false,
// });
setFontSize(18);

// editor.commands.addCommand({
//   name: 'myCommand',
//   bindKey: { win: 'Ctrl-M', mac: 'Command-M' },
//   exec(editor) {
//     console.log(editor.session.getTextRange(editor.getSelectionRange()));
//   },
// });

// editor.getSession().selection.on('changeCursor', () => {
//   console.log(editor.selection.getCursor());
//   console.log(editor.getSelectionRange());
// });

let markers = [];
const zenkaku = '！　”＃＄％＆’（）＊＋，－．／：；＜＝＞？＠［＼￥］＾＿‘｛｜｝～￣'
  + 'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ'
  + 'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'
  + '１２３４５６７８９０'
  + '｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾉﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ';

export const checkZenkaku = () => {
  const lines: [string] = editor.getSession().getDocument().getAllLines();
  if (markers.length > 0) {
    for (const m of markers) {
      editor.session.removeMarker(m);
    }
    markers = [];
  }
  for (let i = 0; i < lines.length; i += 1) {
    const s = lines[i];
    for (let c = 0; c < s.length; c += 1) {
      const ch = s.charCodeAt(c);
      if (ch > 127 && zenkaku.search(s[c]) > 0) {
        const p = new Range4(i, c, i, c + 1);
        console.log(`${s}: ${i},${c}, ${p}`);
        const m = editor.session.addMarker(p, 'utf8', 'text');
        markers.push(m);
      }
    }
  }
};

// document.getElementsByClassName('ace_gutter')[0].setAttribute('style', 'background: rgb(49, 48, 47); color: white;');

export const terminal = ace.edit('terminal');
terminal.setReadOnly(true);
terminal.renderer.setShowGutter(false);
terminal.setOption('showLineNumbers', false);

const runmarkers = [];
export const selectLine = (start: number, end :number) => {
  if (runmarkers.length > 0) {
    for (const m of runmarkers) {
      editor.session.removeMarker(m);
    }
  }
  runmarkers.push(editor.session.addMarker(new Range4(start, 0, end, 0), 'running-line', 'line'));
};

export const removeLine = () => {
  for (const m of runmarkers) {
    editor.session.removeMarker(m);
  }
};

/**
function resizeAce() {
  return $('#editor').height($(window).height());
};
//listen for changes
$(window).resize(resizeAce);
//set initially
resizeAce(); */

/*
var annotations = [
        {
            row: 2,
            type: "error",
            text: "error message"
        }
];

var editor = ace.edit("editor");
editor.getSession().setAnnotations(annotations);
*/
