import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import Editor from '../components/Editor/Editor';
import { trancepile } from '../modules/operations';
import {
  setCode,
  setSize,
  setCodeEditor,
  setDecoration,
  setFontSize,
  setDiffStartLineNumber,
  CodeEditor,
} from '../modules/editor';
import { setIsLive } from '../modules/puppy';

const mapStateToProps = (
  state: ReduxState,
  ownProps: { coursePath: string; page: number }
) => ({
  width: state.editor.width,
  height: state.editor.height,
  codeEditor: state.editor.codeEditor,
  decoration: state.editor.decoration,
  theme: state.editor.theme,
  fontSize: state.editor.fontSize,
  code: state.editor.code,
  diffStartLineNumber: state.editor.diffStartLineNumber,
  puppy: state.puppy.puppy,
  isLive: state.puppy.isLive,
  coursePath: ownProps.coursePath,
  page: ownProps.page,
});

const mapDispatchToProps = (dispatch: (action: ReduxActions) => void) => ({
  setCode: (code: string) => dispatch(setCode(code)),
  setSize: (width: number, height: number) => dispatch(setSize(width, height)),
  setCodeEditor: (codeEditor: CodeEditor | null) =>
    dispatch(setCodeEditor(codeEditor)),
  setDecoration: (decoration: string[]) => dispatch(setDecoration(decoration)),
  setFontSize: (fontSize: number) => dispatch(setFontSize(fontSize)),
  setDiffStartLineNumber: (LineNumber: number | null) =>
    dispatch(setDiffStartLineNumber(LineNumber)),
  setIsLive: (isLive: boolean) => dispatch(setIsLive(isLive)),
  trancepile: trancepile(dispatch),
});

export const EditorContainer = connect(
  mapStateToProps,
  mapDispatchToProps
)(Editor);

export default EditorContainer;
