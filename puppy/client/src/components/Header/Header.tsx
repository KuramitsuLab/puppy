import React, { useEffect } from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { CourseShape } from '../../modules/course';
import './Header.css';

export type HeaderProps = {
  course: CourseShape;
  courses: { [path: string]: CourseShape };
  fetchCourses: () => void;
  setShow: (show: boolean) => void;
};

const Header: React.FC<HeaderProps> = (props: HeaderProps) => {
  useEffect(() => {
    props.fetchCourses();
  }, []);
  return (
    <div className="Header" id="puppy-header">
      <Navbar bg="white" variant="light" expand="lg">
        <Navbar.Brand onClick={() => props.setShow(true)}>
          <img
            src="./image/logo.png"
            width="25"
            height="25"
            className="d-inline-block align-top"
          />
          {' Puppy'}
        </Navbar.Brand>
        <Nav className="mr-auto">
          <NavDropdown title={props.course.title} id="nav-dropdown-courses">
            {Object.keys(props.courses).map(course_path => {
              const course = props.courses[course_path];
              return (
                <NavDropdown
                  title={course.title}
                  id={`nav-dropdown-pages-${course.title}`}
                  drop="right"
                  key={course.title}
                >
                  {course.list.map(
                    (page: { path: string; title: string }, i: number) => (
                      <NavDropdown.Item
                        href={`?course=${course_path}#${i}`}
                        key={i}
                      >
                        {page.title}
                      </NavDropdown.Item>
                    )
                  )}
                </NavDropdown>
              );
            })}
          </NavDropdown>
        </Nav>
      </Navbar>
    </div>
  );
};

export default Header;
