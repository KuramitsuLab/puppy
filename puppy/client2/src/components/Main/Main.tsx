import React from 'react';
import { Row, Col } from 'react-bootstrap';

const Main: React.FC = () => {
  return (
    <div className="Main">
      <Row>
        <Col>
          <div id="puppy-screen"></div>
        </Col>
        <Col>
          <div id="editor"></div>
        </Col>
      </Row>
    </div>
  );
};

export default Main;
