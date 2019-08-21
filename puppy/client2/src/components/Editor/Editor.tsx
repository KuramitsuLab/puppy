import React, { useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monacoEditor from 'monaco-editor';
import './Editor.css';
import { PuppyCode, Puppy, runPuppy } from '../Puppy/vm/vm';

import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faMinus } from '@fortawesome/free-solid-svg-icons';

import { CodeEditor } from '../../modules/editor';

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
  setFontSize: (fontSize: number) => void;
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

export type EditorProps = {
  width: number;
  height: number;
  codeEditor: CodeEditor | null;
  decoration: string[];
  fontSize: number;
  code: string;
  setCode: (code: string) => void;
  setSize: (width: number, height: number) => void;
  setCodeEditor: (codeEditor: CodeEditor | null) => void;
  setDecoration: (decoration: string[]) => void;
  setFontSize: (fontSize: number) => void;
};

const Editor: React.FC<EditorProps> = (props: EditorProps) => {
  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: props.fontSize,
    wordWrap: 'on' as 'on',
  };

  let resizeTimer: NodeJS.Timeout;
  let editorTimer: NodeJS.Timeout | null;

  addEventListener('resize', () => {
    clearTimeout(resizeTimer!);
    resizeTimer = setTimeout(function() {
      props.setSize(
        document.getElementById('right-col')!.clientWidth,
        document.getElementById('right-col')!.clientHeight
      );
    }, 300);
  });

  useEffect(() => {
    props.setSize(
      document.getElementById('right-col')!.clientWidth,
      document.getElementById('right-col')!.clientHeight
    );
  }, []);

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
    props.setDecoration(codeEditor.deltaDecorations(props.decoration, decos));
  };

  const codeOnChange = (new_code: string) => {
    props.setCode(new_code);
    if (props.codeEditor) {
      checkZenkaku(props.codeEditor);
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
    props.setCodeEditor(editor);
  };

  return (
    <div id="puppy-editor">
      <MonacoEditor
        width={props.width}
        height={props.height}
        language="python"
        value={props.code}
        options={editorOptions}
        onChange={codeOnChange}
        editorDidMount={editorDidMount}
      />
      <EditorFooter setFontSize={props.setFontSize} fontSize={props.fontSize} />
    </div>
  );
};

export default Editor;
