import React, { useState, useEffect } from 'react';
// import logo from './logo.svg';
import './App.css';
import { Container, Row, Col } from 'react-bootstrap';
import Header from './components/Header/Header';
import Editor from './components/Editor/Editor';
import PuppyScreen from './components/Puppy/PuppyScreen';
import Course from './components/Course/Course';

export const loadFile: (path: string) => Promise<string> = path => {
  return fetch(path, {
    method: 'GET',
  })
    .then((res: Response) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error(res.statusText);
    })
    .then((sample: string) => {
      return sample;
    });
};

type QueryParams = {
  course?: string;
};

type AppProps = { qs: QueryParams; hash: string };

export type CourseShape = {
  title: string;
  list: {
    path: string;
    title: string;
  }[];
};

const App: React.FC<AppProps> = (props: AppProps) => {
  const [isCourse, setIsCourse] = useState(true);
  const [code, setCode] = useState('');
  const [course, setCourse] = useState({ title: '', list: [] } as CourseShape);
  const [coursePath, setCoursePath] = useState('Puppy');

  useEffect(() => {
    const path = props.qs.course ? props.qs.course : 'Puppy';
    setCoursePath(path);
    loadFile(`/api/setting/${path}`)
      .then((s: string) => {
        setCourse(JSON.parse(s) as CourseShape);
      })
      .catch((msg: string) => {
        console.log(`ERR ${msg}`);
      });
  }, [props.qs.course]);

  return (
    <div className="App">
      <Container className="container">
        <Header course={course} />
        <Row id="main-row">
          <Col id="left-col" xs={6}>
            <div style={{ visibility: isCourse ? 'visible' : 'hidden' }}>
              <Course
                course={course}
                coursePath={coursePath}
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
