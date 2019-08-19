import React, { useState } from 'react';
// import logo from './logo.svg';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './components/Header/Header';
import Editor from './components/Editor/Editor';
import PuppyScreen from './components/Puppy/PuppyScreen';
import Course from './components/Course/Course';

type QueryParams = {
  course?: string;
};

type AppProps = { qs: QueryParams; hash: string };

const App: React.FC<AppProps> = (props: AppProps) => {
  const [isCourse, setIsCourse] = useState(true);
  const [code, setCode] = useState('');
  return (
    <div className="App">
      <Container className="container">
        <Header />
        <Row id="main-row">
          <Col id="left-col" xs={6}>
            <div style={{ visibility: isCourse ? 'visible' : 'hidden' }}>
              <Course
                course={props.qs.course ? props.qs.course : 'Puppy'}
                page={props.hash !== '' ? parseInt(props.hash.substr(1)) : 0}
                setCode={setCode}
              />
            </div>
            <PuppyScreen
              isCourse={isCourse}
              setIsCourse={setIsCourse}
              code={code}
            />
          </Col>
          <Col id="right-col" xs={6}>
            <Editor code={code} setCode={setCode} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default App;
