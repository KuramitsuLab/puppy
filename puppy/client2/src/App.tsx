import React from 'react';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './containers/Header';
import Editor from './containers/Editor';
import PuppyScreen from './containers/PuppyScreen';
import Course from './containers/Course';
import Input from './containers/Input';
import { QueryParams } from './index';

type AppProps = { qs: QueryParams; hash: string };

const App: React.FC<AppProps> = (props: AppProps) => {
  return (
    <div className="App">
      <Container className="container">
        <Header />
        <Input />
        <Row id="main-row">
          <Col id="left-col" xs={6}>
            <Course qs={props.qs} hash={props.hash} />
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
