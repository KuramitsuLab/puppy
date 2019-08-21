import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import Course from '../components/Course/Course';
import { QueryParams } from '../index';
import { setContent, setCourse, CourseShape } from '../modules/course';
import { setCode } from '../modules/editor';
import { fetchContent, fetchSample, fetchSetting } from '../modules/operations';

const mapStateToProps = (
  state: ReduxState,
  ownProps: { qs: QueryParams; hash: string }
) => ({
  course: state.course.course,
  puppy: state.puppy.puppy,
  coursePath: ownProps.qs.course ? ownProps.qs.course : 'Puppy',
  page: ownProps.hash !== '' ? parseInt(ownProps.hash.substr(1)) : 0,
  content: state.course.content,
  visible: state.course.visible,
});

const mapDispathToProps = (dispatch: (action: ReduxActions) => void) => ({
  setContent: (content: string) => dispatch(setContent(content)),
  setCourse: (course: CourseShape) => dispatch(setCourse(course)),
  setCode: (code: string) => dispatch(setCode(code)),
  fetchContent: fetchContent(dispatch),
  fetchSample: fetchSample(dispatch),
  fetchSetting: fetchSetting(dispatch),
});

const CourseContainer = connect(
  mapStateToProps,
  mapDispathToProps
)(Course);

export default CourseContainer;
