import React from 'react';
// import logo from './logo.svg';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './components/Header/Header';
import Editor from './components/Editor/Editor';
import PuppyScreen from './components/Puppy/PuppyScreen';

const App: React.FC = () => {
  return (
    <div className="App">
      <Container className="container">
        <Header />
        <Row id="main-row">
          <Col id="left-col" xs={6}>
            <PuppyScreen />
          </Col>
          <Col id="right-col" xs={6}>
            <Editor />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default App;
