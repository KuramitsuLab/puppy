import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import Header from '../components/Header/Header';
import { fetchCourses } from '../modules/operations';
import { setShow } from '../modules/version';

const mapStateToProps = (state: ReduxState) => ({
  course: state.course.course,
  courses: state.course.courses,
});

const mapDispatchToProps = (dispathch: (action: ReduxActions) => void) => ({
  fetchCourses: fetchCourses(dispathch),
  setShow: (show: boolean) => dispathch(setShow(show)),
});

const HeaderContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Header);

export default HeaderContainer;
