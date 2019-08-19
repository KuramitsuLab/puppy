import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monacoEditor from 'monaco-editor';
import './Editor.css';
import { PuppyCode, Puppy, runPuppy } from '../Puppy/vm/vm';

import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';
import { SetState } from '../../react-app-env';

type CodeEditor = monacoEditor.editor.IStandaloneCodeEditor;

const zenkaku =
  '[！　”＃＄％＆’（）＊＋，－．／：；＜＝＞？＠［＼￥］＾＿‘｛｜｝～￣' +
  'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ' +
  'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ' +
  '１２３４５６７８９０' +
  '｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾉﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ]';

export let puppy: Puppy | null = null;

const session = window.sessionStorage;
const path = location.pathname;

const checkError = (code: PuppyCode) => {
  let error_count = 0;
  const annos: any[] = [];
  // editor.getSession().clearAnnotations();
  for (const e of code.errors) {
    if (e['type'] === 'error') {
      error_count += 1;
    }
    annos.push(e);
    // editor.getSession().setAnnotations(annos);
  }
  if (error_count === 0) {
    return false;
  }
  // editorPanel.style.backgroundColor = 'rgba(254,244,244,0.7)';
  return true;
};

export const trancepile = (source: string, alwaysRun: boolean) =>
  fetch('/api/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/text; charset=utf-8',
    },
    body: source,
  })
    .then((res: Response) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error(res.statusText);
    })
    .then((js: string) => {
      try {
        const code = Function(js)(); // Eval javascript code
        if (!checkError(code)) {
          session.setItem(`/sample${path}`, source);
          puppy = runPuppy(puppy!, code, alwaysRun);
        }
      } catch (e) {
        // alert(`トランスパイルにしっぱいしています ${e}`);
        // editorPanel.style.backgroundColor = 'rgba(244,244,254,0.7)';
        console.log(js);
        console.log(`FAIL TO TRANSCOMPILE ${e}`);
        console.log(e);
      }
    })
    .catch((msg: string) => {
      alert(`Puppy is down!! ${msg}`);
    });

type EditorFooterProps = {
  setFontSize: SetState<number>;
  fontSize: number;
};

const EditorFooter: React.FC<EditorFooterProps> = (
  props: EditorFooterProps
) => {
  const fontPlus = () => {
    props.setFontSize(props.fontSize + 3);
  };
  const fontMinus = () => {
    props.setFontSize(Math.max(12, props.fontSize - 3));
  };
  return (
    <div id="editor-footer">
      <Button onClick={fontPlus}>
        <FontAwesomeIcon icon={faPlus} />
      </Button>
      <Button onClick={fontMinus}>
        <FontAwesomeIcon icon={faMinus} />
      </Button>
    </div>
  );
};

type EditorProps = {
  code: string;
  setCode: SetState<string>;
};

const Editor: React.FC<EditorProps> = (props: EditorProps) => {
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [codeEditor, setCodeEditor] = useState(null as CodeEditor | null);
  const [decoration, setDecoration] = useState([] as string[]);
  const [fontSize, setFontSize] = useState(30);

  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize,
    wordWrap: 'on' as 'on',
  };

  let resizeTimer: NodeJS.Timeout;
  let editorTimer: NodeJS.Timeout | null;

  addEventListener('resize', () => {
    clearTimeout(resizeTimer!);
    resizeTimer = setTimeout(function() {
      setWidth(document.getElementById('right-col')!.clientWidth);
      setHeight(document.getElementById('right-col')!.clientHeight);
    }, 300);
  });

  useEffect(() => {
    setWidth(document.getElementById('right-col')!.clientWidth);
    setHeight(document.getElementById('right-col')!.clientHeight);
  });

  const checkZenkaku = (codeEditor: CodeEditor) => {
    const zenkakuRanges = codeEditor
      .getModel()!
      .findMatches(zenkaku, true, true, false, null, false);
    const decos: monacoEditor.editor.IModelDeltaDecoration[] = zenkakuRanges.map(
      (match: monacoEditor.editor.FindMatch) => ({
        range: match.range,
        options: { inlineClassName: 'zenkakuClass' },
      })
    );
    setDecoration(codeEditor.deltaDecorations(decoration, decos));
  };

  const codeOnChange = (new_code: string) => {
    props.setCode(new_code);
    if (codeEditor) {
      checkZenkaku(codeEditor);
    }
    if (editorTimer) {
      clearTimeout(editorTimer);
      editorTimer = null;
    }
    editorTimer = setTimeout(() => {
      trancepile(new_code, false);
    }, 1000);
  };

  const editorDidMount = (editor: CodeEditor) => {
    setCodeEditor(editor);
  };

  return (
    <div id="puppy-editor">
      <MonacoEditor
        width={width}
        height={height}
        language="python"
        value={props.code}
        options={editorOptions}
        onChange={codeOnChange}
        editorDidMount={editorDidMount}
      />
      <EditorFooter setFontSize={setFontSize} fontSize={fontSize} />
    </div>
  );
};

export default Editor;
