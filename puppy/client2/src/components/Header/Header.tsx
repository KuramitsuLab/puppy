import React from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { CourseShape } from '../../modules/course';

export type HeaderProps = {
  course: CourseShape;
};

const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  return (
    <div className="Header" id="puppy-header">
      <Navbar bg="white" variant="light" expand="lg">
        <Navbar.Brand href="#home">
          <img
            src="./image/puppyLogo.png"
            width="25"
            height="25"
            className="d-inline-block align-top"
          />
          {' Puppy'}
        </Navbar.Brand>
        <Nav className="mr-auto">
          <NavDropdown title={props.course.title} id="nav-dropdown-courses">
            {[props.course.title].map(title => (
              <NavDropdown
                title={title}
                id="nav-dropdown-pages"
                drop="right"
                key={title}
              >
                {props.course.list.map(
                  (page: { path: string; title: string }, i: number) => (
                    <NavDropdown.Item href={`#${i}`} key={i}>
                      {page.title}
                    </NavDropdown.Item>
                  )
                )}
              </NavDropdown>
            ))}
          </NavDropdown>
        </Nav>
      </Navbar>
    </div>
  );
};

export default Header;
