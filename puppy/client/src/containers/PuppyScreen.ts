import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import { setVisible } from '../modules/course';
import { setSize } from '../modules/puppy';
import { trancepile } from '../modules/operations';
import PuppyScreen from '../components/PuppyScreen/PuppyScreen';

const mapStateToProps = (state: ReduxState) => ({
  isCourseVisible: state.course.visible,
  code: state.editor.code,
  puppy: state.puppy.puppy,
});

const mapDispatchToProps = (dispatch: (action: ReduxActions) => void) => ({
  setIsCourseVisible: (visible: boolean) => dispatch(setVisible(visible)),
  setSize: (width: number, height: number) => dispatch(setSize(width, height)),
  trancepile: trancepile(dispatch),
});

const PuppyScreenContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(PuppyScreen);

export default PuppyScreenContainer;
