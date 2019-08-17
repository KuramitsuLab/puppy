import React, { useState, useEffect } from 'react';
import * as marked from 'marked';
import { Card, Col, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';

import './Course.css';
import './github-markdown.css';

const loadFile: (path: string) => Promise<string> = path => {
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

type CourseProps = {
  problem: string;
};

const Course: React.FC<CourseProps> = (props: CourseProps) => {
  const [content, setContent] = useState(
    '# Hello World \n\n Rendered by **marked**'
  );

  useEffect(() => {
    loadFile(`api/problem${props.problem}`).then((con: string) =>
      setContent(con)
    );
  }, []);

  return (
    <div id="puppy-course">
      <Card className="course-all">
        <Card.Header className="course-header">
          <Row>
            <Col className="card-header-left" xs={4}>
              <a href="?problem=Left">
                <FontAwesomeIcon icon={faChevronLeft} />
                {' Left'}
              </a>
            </Col>
            <Col className="card-header-center" xs={4}></Col>
            <Col className="card-header-right" xs={4}>
              <a href="?problem=Right">
                {'Right '}
                <FontAwesomeIcon icon={faChevronRight} />
              </a>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="course-body">
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{
              __html: marked(content),
            }}
          ></div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Course;
