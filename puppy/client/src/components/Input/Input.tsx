import React from 'react';
import { Modal, Button, InputGroup, FormControl, Form } from 'react-bootstrap';

export type InputState = {
  show: boolean;
  value: string;
  placeholder: string;
};

export type InputHandler = {
  setShow: (show: boolean) => void;
  setValue: (value: string) => void;
};

export type InputProps = InputState & InputHandler;

const Input: React.FC<InputProps> = (props: InputProps) => {
  return (
    <Modal size="lg" show={props.show} centered>
      <Modal.Body>
        <Form id="puppy-input-form" onSubmit={() => props.setShow(false)}>
          <InputGroup className="mb-3">
            <FormControl
              placeholder={props.placeholder}
              value={props.value}
              onChange={e => props.setValue(e.target.value)}
            />
            <InputGroup.Append>
              <Button type="submit">送信する</Button>
            </InputGroup.Append>
          </InputGroup>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default Input;
