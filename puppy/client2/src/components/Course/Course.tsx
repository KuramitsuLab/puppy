import React, { useState, useEffect } from 'react';
import * as marked from 'marked';
import { Card, Col, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
} from '@fortawesome/free-solid-svg-icons';

import { SetState } from '../../react-app-env';
import { trancepile } from '../Editor/Editor';
import { loadFile, CourseShape } from '../../App';

import './Course.css';
import './github-markdown.css';

type CourseProps = {
  course: CourseShape;
  coursePath: string;
  page: number;
  setCode: SetState<string>;
};

const Course: React.FC<CourseProps> = (props: CourseProps) => {
  const [content, setContent] = useState(
    '# Hello World \n\n Rendered by **marked**'
  );

  const loadContent = (path: string) =>
    loadFile(`/api/problem/${props.coursePath}/${path}`).then(
      (content: string) => setContent(content)
    );

  const loadSample = (path: string) =>
    loadFile(`/api/sample/${props.coursePath}/${path}`).then(
      (content: string) => {
        props.setCode(content);
        trancepile(content, false);
      }
    );

  useEffect(() => {
    if (props.course.list.length !== 0) {
      loadContent(
        props.course.list[props.page % props.course.list.length].path
      );
      loadSample(props.course.list[props.page % props.course.list.length].path);
    }
  }, [props.page, props.coursePath, props.course]);

  return (
    <div id="puppy-course">
      <Card className="course-all">
        <Card.Header className="course-header">
          <Row>
            <Col className="card-header-left" xs={6}>
              {props.course.list &&
              props.course.list.length !== 0 &&
              props.page !== 0 ? (
                <a href={`#${props.page - 1}`}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                  {` ${props.course.list[props.page - 1].title}`}
                </a>
              ) : null}
            </Col>
            <Col className="card-header-right" xs={6}>
              {props.course.list &&
              props.course.list.length !== 0 &&
              props.page !== props.course.list.length - 1 ? (
                <a href={`#${props.page + 1}`}>
                  {`${props.course.list[props.page + 1].title} `}
                  <FontAwesomeIcon icon={faChevronRight} />
                </a>
              ) : null}
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
