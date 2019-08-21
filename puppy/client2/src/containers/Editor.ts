import { connect } from 'react-redux';
import { ReduxState, ReduxActions } from '../store';
import Editor from '../components/Editor/Editor';
import {
  setCode,
  setSize,
  setCodeEditor,
  setDecoration,
  setFontSize,
  CodeEditor,
} from '../modules/editor';

const mapStateToProps = (state: ReduxState) => ({
  width: state.editor.width,
  height: state.editor.height,
  codeEditor: state.editor.codeEditor,
  decoration: state.editor.decoration,
  fontSize: state.editor.fontSize,
  code: state.editor.code,
});

const mapDispathToProps = (dispath: (action: ReduxActions) => void) => ({
  setCode: (code: string) => dispath(setCode(code)),
  setSize: (width: number, height: number) => dispath(setSize(width, height)),
  setCodeEditor: (codeEditor: CodeEditor | null) =>
    dispath(setCodeEditor(codeEditor)),
  setDecoration: (decoration: string[]) => dispath(setDecoration(decoration)),
  setFontSize: (fontSize: number) => dispath(setFontSize(fontSize)),
});

export const EditorContainer = connect(
  mapStateToProps,
  mapDispathToProps
)(Editor);

export default EditorContainer;
