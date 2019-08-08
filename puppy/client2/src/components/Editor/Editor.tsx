import React, { useState, useEffect } from 'react';
import MonacoEditor from 'react-monaco-editor';

const Editor: React.FC = () => {
  const [code, setCode] = useState('');
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);

  const options = {
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

  return (
    <MonacoEditor
      width={width}
      height={height}
      language="python"
      value={code}
      options={options}
      onChange={setCode}
      editorDidMount={editor => editor.focus()}
    />
  );
};

export default Editor;
