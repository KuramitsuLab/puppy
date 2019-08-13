import React from 'react';
import * as marked from 'marked';
import { Card } from 'react-bootstrap';

import './Course.css';
import './github-markdown.css';

const Course: React.FC = () => {
  return (
    <div id="puppy-course">
      <Card className="course-all">
        <Card.Header className="course-header">
          <p>Header</p>
        </Card.Header>
        <Card.Body className="course-body">
          <div
            className="markdown-body"
            dangerouslySetInnerHTML={{
              __html: marked('# Hello World \n\n Rendered by **marked**'),
            }}
          ></div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Course;
