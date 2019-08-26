import React, { useEffect } from 'react';
import * as marked from 'marked';
import { Card, Col, Row } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronRight,
  faChevronLeft,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

import { Puppy } from '../../vm/vm';

import { CourseShape } from '../../modules/course';

import './Course.css';
import './github-markdown.css';

type CourseProps = {
  course: CourseShape;
  coursePath: string;
  puppy: Puppy | null;
  page: number;
  content: string;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  setCode: (code: string) => void;
  setContent: (content: string) => void;
  setCourse: (course: CourseShape) => void;
  fetchContent: (coursePath: string, path: string) => void;
  fetchSample: (
    puppy: Puppy | null,
    coursePath: string,
    page: number,
    path: string
  ) => void;
  fetchSetting: (coursePath: string) => void;
};

const Course: React.FC<CourseProps> = (props: CourseProps) => {
  useEffect(() => {
    if (props.course.list.length !== 0) {
      props.fetchContent(props.coursePath, props.course.list[props.page].path);
      props.fetchSample(
        props.puppy,
        props.coursePath,
        props.page,
        props.course.list[props.page].path
      );
    }
  }, [props.page, props.coursePath, props.course]);

  useEffect(() => {
    props.fetchSetting(props.coursePath);
  }, [props.coursePath]);

  return (
    <div
      id="puppy-course"
      style={{ visibility: props.visible ? 'visible' : 'hidden' }}
    >
      <Card className="course-all">
        <Card.Header className="course-header">
          <Row>
            <button
              className="close-button"
              onClick={() => props.setVisible(false)}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </Row>
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
              __html: marked(props.content),
            }}
          ></div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Course;
