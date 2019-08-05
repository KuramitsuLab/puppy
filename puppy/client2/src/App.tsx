import React from 'react';
// import logo from './logo.svg';
import './App.css';
import { Button } from 'react-bootstrap';

const App: React.FC = () => {
  return (
    <div className="App">
      <div id="puppy-screen"></div>
      <div id="editor"></div>
      <Button>Click Me!</Button>
    </div>
  );
};

export default App;
