import React, { useState } from 'react';
import MonacoEditor from 'react-monaco-editor';

const Editor: React.FC = () => {
  const [code, setCode] = useState('');

  return (
    <MonacoEditor
      width="800"
      height="600"
      language="python"
      value={code}
      onChange={setCode}
    />
  );
};

export default Editor;
