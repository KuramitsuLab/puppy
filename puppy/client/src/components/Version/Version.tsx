import React from 'react';
import { Modal, Button } from 'react-bootstrap';

type VersionProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};

const Version: React.FC<VersionProps> = (props: VersionProps) => {
  return (
    <>
      <Modal show={props.show} onHide={() => props.setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Modal heading</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {"Woohoo, you're reading this text in a modal!"}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => props.setShow(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => props.setShow(false)}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

// render(<Example />);

export default Version;
