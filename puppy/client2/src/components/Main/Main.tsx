import React, { useEffect } from 'react';
import { Row, Col } from 'react-bootstrap';
import { Engine, World, Bodies } from 'matter-js';

const Main: React.FC = () => {
  useEffect(() => {
    const engine = Engine.create(document.getElementById('puppy-screen')!);

    World.add(engine.world, [
      Bodies.rectangle(320, 460, 480, 20, {
        isStatic: true, //固定する
        render: {
          fillStyle: '#977559', // 塗りつぶす色: CSSの記述法で指定
          strokeStyle: 'rgba(0, 0, 0, 0)', // 線の色: CSSの記述法で指定
          lineWidth: 0,
        },
      }),
    ]);

    Engine.run(engine);
  });

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
