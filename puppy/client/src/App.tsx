import React from 'react';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './containers/Header';
import Editor from './containers/Editor';
import PuppyScreen from './containers/PuppyScreen';
import Course from './containers/Course';
import Input from './containers/Input';
import Version from './containers/Version';
import { QueryParams } from './index';

type AppProps = { qs: QueryParams; hash: string };

const App: React.FC<AppProps> = (props: AppProps) => {
  const coursePath = props.qs.course ? props.qs.course : 'PuppyCourse';
  const page = props.hash !== '' ? parseInt(props.hash.substr(1)) : 0;
  return (
    <div className="App">
      <Container className="container">
        <Header />
        <Input />
        <Version />
        <Row id="main-row">
          <Col id="left-col" xs={6}>
            <Course coursePath={coursePath} page={page} />
            <PuppyScreen />
          </Col>
          <Col id="right-col" xs={6}>
            <Editor coursePath={coursePath} page={page} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default App;
