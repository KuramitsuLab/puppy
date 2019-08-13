import React, { useState } from 'react';
// import logo from './logo.svg';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './components/Header/Header';
import Editor from './components/Editor/Editor';
import PuppyScreen from './components/Puppy/PuppyScreen';
import Course from './components/Course/Course';

const App: React.FC = () => {
  const [isCourse, setIsCourse] = useState(true);
  return (
    <div className="App">
      <Container className="container">
        <Header />
        <Row id="main-row">
          <Col id="left-col" xs={6}>
            {isCourse ? <Course /> : null}
            <PuppyScreen isCourse={isCourse} setIsCourse={setIsCourse} />
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
