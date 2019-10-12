import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import { setShow } from '../modules/version';
import Version from '../components/Version/Version';

const mapStateToProps = (state: ReduxState) => ({
  show: state.version.show,
});

const mapDispatchToProps = (dispatch: (action: ReduxActions) => void) => ({
  setShow: (show: boolean) => dispatch(setShow(show)),
});

const VersionContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Version);

export default VersionContainer;
