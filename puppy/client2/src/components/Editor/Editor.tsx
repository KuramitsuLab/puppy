import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';
import * as monacoEditor from 'monaco-editor'; // eslint-disable-line no-unused-vars
import './Editor.css';

type CodeEditor = monacoEditor.editor.IStandaloneCodeEditor;

const zenkaku =
  '[！　”＃＄％＆’（）＊＋，－．／：；＜＝＞？＠［＼￥］＾＿‘｛｜｝～￣' +
  'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ' +
  'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ' +
  '１２３４５６７８９０' +
  '｡｢｣､･ｦｧｨｩｪｫｬｭｮｯｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾉﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝﾞﾟ]';

const Editor: React.FC = () => {
  const [code, setCode] = useState('');
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);
  const [codeEditor, setCodeEditor]: [
    CodeEditor | null,
    React.Dispatch<React.SetStateAction<CodeEditor | null>>
  ] = useState(null as CodeEditor | null);
  const [decoration, setDecoration]: [
    string[],
    React.Dispatch<React.SetStateAction<string[]>>
  ] = useState([] as string[]);

  const editorOptions = {
    selectOnLineNumbers: true,
    fontSize: 30,
    wordWrap: 'on' as 'on',
  };

  let timer: NodeJS.Timeout;

  addEventListener('resize', () => {
    clearTimeout(timer!);
    timer = setTimeout(function() {
      setWidth(document.getElementById('right-col')!.clientWidth);
      setHeight(document.getElementById('right-col')!.clientHeight);
    }, 300);
  });

  useEffect(() => {
    setWidth(document.getElementById('right-col')!.clientWidth);
    setHeight(document.getElementById('right-col')!.clientHeight);
  });

  const codeOnChange = (code: string) => {
    setCode(code);
    if (codeEditor) {
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
    }
  };

  const editorDidMount = (editor: CodeEditor) => {
    setCodeEditor(editor);
  };

  return (
    <MonacoEditor
      width={width}
      height={height}
      language="python"
      value={code}
      options={editorOptions}
      onChange={codeOnChange}
      editorDidMount={editorDidMount}
    />
  );
};

export default Editor;
