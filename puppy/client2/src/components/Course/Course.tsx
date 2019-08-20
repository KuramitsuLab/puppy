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
  course: string;
  page: number;
  setCode: SetState<string>;
};

type Course = {
  course: string;
  list: {
    path: string;
    title: string;
  }[];
};

const Course: React.FC<CourseProps> = (props: CourseProps) => {
  const [content, setContent] = useState(
    '# Hello World \n\n Rendered by **marked**'
  );

  const [course, setCourse] = useState({ course: '', list: [] } as Course);

  const loadContent = (path: string) =>
    loadFile(`/api/problem/${props.course}/${path}`).then((content: string) =>
      setContent(content)
    );

  const loadSample = (path: string) =>
    loadFile(`/api/sample/${props.course}/${path}`).then((content: string) => {
      props.setCode(content);
      trancepile(content, false);
    });

  useEffect(() => {
    loadFile(`/api/setting/${props.course}`)
      .then((s: string) => {
        const _course = JSON.parse(s) as Course;
        setCourse(_course);
        loadContent(_course.list[0].path);
        loadSample(_course.list[0].path);
      })
      .catch((msg: string) => {
        console.log(`ERR ${msg}`);
      });
  }, [props.course]);

  useEffect(() => {
    if (course.list.length !== 0) {
      loadContent(course.list[props.page % course.list.length].path);
      loadSample(course.list[props.page % course.list.length].path);
    }
  }, [props.page]);

  return (
    <div id="puppy-course">
      <Card className="course-all">
        <Card.Header className="course-header">
          <Row>
            <Col className="card-header-left" xs={6}>
              {course.list && course.list.length !== 0 && props.page !== 0 ? (
                <a href={`#${props.page - 1}`}>
                  <FontAwesomeIcon icon={faChevronLeft} />
                  {` ${course.list[props.page - 1].title}`}
                </a>
              ) : null}
            </Col>
            <Col className="card-header-right" xs={6}>
              {course.list &&
              course.list.length !== 0 &&
              props.page !== course.list.length - 1 ? (
                <a href={`#${props.page + 1}`}>
                  {`${course.list[props.page + 1].title} `}
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
