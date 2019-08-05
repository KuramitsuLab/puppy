import React from 'react';
// import logo from './logo.svg';
import './App.css';
import Header from './components/Header/Header';
import Main from './components/Main/Main';

const App: React.FC = () => {
  return (
    <div className="App">
      <Header />
      <Main />
    </div>
  );
};

export default App;
