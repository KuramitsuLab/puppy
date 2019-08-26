import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import Course from '../components/Course/Course';
import {
  setContent,
  setCourse,
  CourseShape,
  setVisible,
} from '../modules/course';
import { setCode } from '../modules/editor';
import { fetchContent, fetchSample, fetchSetting } from '../modules/operations';

const mapStateToProps = (
  state: ReduxState,
  ownProps: { coursePath: string; page: number }
) => ({
  course: state.course.course,
  puppy: state.puppy.puppy,
  coursePath: ownProps.coursePath,
  page: ownProps.page,
  content: state.course.content,
  visible: state.course.visible,
});

const mapDispathToProps = (dispatch: (action: ReduxActions) => void) => ({
  setContent: (content: string) => dispatch(setContent(content)),
  setCourse: (course: CourseShape) => dispatch(setCourse(course)),
  setCode: (code: string) => dispatch(setCode(code)),
  setVisible: (visible: boolean) => dispatch(setVisible(visible)),
  fetchContent: fetchContent(dispatch),
  fetchSample: fetchSample(dispatch),
  fetchSetting: fetchSetting(dispatch),
});

const CourseContainer = connect(
  mapStateToProps,
  mapDispathToProps
)(Course);

export default CourseContainer;
