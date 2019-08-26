import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import { setShow, setValue } from '../modules/input';
import Input, { InputState, InputHandler } from '../components/Input/Input';

const mapStateToProps = (state: ReduxState): InputState => ({
  show: state.input.show,
  value: state.input.value,
  placeholder: state.input.placeholder,
});

const mapDispatchToProps = (
  dispatch: (action: ReduxActions) => void
): InputHandler => ({
  setShow: (show: boolean) => dispatch(setShow(show)),
  setValue: (value: string) => dispatch(setValue(value)),
});

const InputContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Input);

export default InputContainer;
