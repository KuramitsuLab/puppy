import { Action } from 'redux';
import * as monacoEditor from 'monaco-editor';
export type CodeEditor = monacoEditor.editor.IStandaloneCodeEditor;
import { ErrorLog } from '../vm/vm';

enum EditorActionTypes {
  SET_SIZE = 'SET_SIZE',
  SET_CODE = 'SET_CODE',
  SET_CODEEDITOR = 'SET_CODEEDITOR',
  SET_FONTSIZE = 'SET_FONTSIZE',
  SET_DECORATION = 'SET_DECORATION',
  SET_MARKER = 'SET_MARKER',
  SET_THEME = 'SETTHEME',
  SET_DIFFSTARTLINENUMBER = 'SET_DIFFSTARTLINENUMBER',
}

interface SetSizeAction extends Action {
  type: EditorActionTypes.SET_SIZE;
  payload: {
    width: number;
    height: number;
  };
}

export const setSize = (width: number, height: number): SetSizeAction => ({
  type: EditorActionTypes.SET_SIZE,
  payload: {
    width,
    height,
  },
});

interface SetCodeAction extends Action {
  type: EditorActionTypes.SET_CODE;
  payload: {
    code: string;
  };
}

export const setCode = (code: string): SetCodeAction => ({
  type: EditorActionTypes.SET_CODE,
  payload: {
    code,
  },
});

interface SetCodeEditorAction extends Action {
  type: EditorActionTypes.SET_CODEEDITOR;
  payload: {
    codeEditor: CodeEditor | null;
  };
}

export const setCodeEditor = (
  codeEditor: CodeEditor | null
): SetCodeEditorAction => ({
  type: EditorActionTypes.SET_CODEEDITOR,
  payload: {
    codeEditor,
  },
});

interface SetFontSizeAction extends Action {
  type: EditorActionTypes.SET_FONTSIZE;
  payload: {
    value: number;
  };
}

export const setFontSize = (value: number): SetFontSizeAction => ({
  type: EditorActionTypes.SET_FONTSIZE,
  payload: {
    value,
  },
});

interface SetDecorationAction extends Action {
  type: EditorActionTypes.SET_DECORATION;
  payload: {
    decoration: string[];
  };
}

export const setDecoration = (decoration: string[]): SetDecorationAction => ({
  type: EditorActionTypes.SET_DECORATION,
  payload: {
    decoration,
  },
});

interface SetMarkerAction extends Action {
  type: EditorActionTypes.SET_MARKER;
  payload: {
    markers: monacoEditor.editor.IMarkerData[];
  };
}

const type2severity = (type: 'error' | 'info' | 'warning' | 'hint') => {
  switch (type) {
    case 'error':
      return monacoEditor.MarkerSeverity.Error;
    case 'info':
      return monacoEditor.MarkerSeverity.Info;
    case 'warning':
      return monacoEditor.MarkerSeverity.Warning;
    case 'hint':
      return monacoEditor.MarkerSeverity.Hint;
  }
};

export const setMarker = (markers: ErrorLog[]): SetMarkerAction => ({
  type: EditorActionTypes.SET_MARKER,
  payload: {
    markers: markers.map(marker => ({
      severity: type2severity(marker.type as
        | 'error'
        | 'info'
        | 'warning'
        | 'hint'),
      startLineNumber: marker.row! + 1,
      startColumn: marker.col!,
      endLineNumber: marker.row! + 1,
      endColumn: marker.col! + marker.len!,
      message: marker.key,
    })),
  },
});

interface SetThemeAction extends Action {
  type: EditorActionTypes.SET_THEME;
  payload: {
    theme: string;
  };
}

export const setTheme = (theme: string): SetThemeAction => ({
  type: EditorActionTypes.SET_THEME,
  payload: {
    theme,
  },
});

interface SetDiffStartLineNumber extends Action {
  type: EditorActionTypes.SET_DIFFSTARTLINENUMBER;
  payload: {
    startLineNumber: number | null;
  };
}

export const setDiffStartLineNumber = (startLineNumber: number | null) => ({
  type: EditorActionTypes.SET_DIFFSTARTLINENUMBER,
  payload: {
    startLineNumber,
  },
});

export type EditorActions =
  | SetCodeAction
  | SetSizeAction
  | SetCodeEditorAction
  | SetFontSizeAction
  | SetDecorationAction
  | SetMarkerAction
  | SetThemeAction
  | SetDiffStartLineNumber;

export type EditorState = {
  width: number;
  height: number;
  code: string;
  codeEditor: CodeEditor | null;
  theme: string;
  fontSize: number;
  decoration: string[];
  markers: monacoEditor.editor.IMarkerData[];
  diffStartLineNumber: number | null;
};

const initialState: EditorState = {
  width: 500,
  height: 500,
  code: '',
  codeEditor: null,
  theme: 'vs',
  fontSize: 30,
  decoration: [],
  markers: [],
  diffStartLineNumber: null,
};

export const editorReducer = (state = initialState, action: EditorActions) => {
  switch (action.type) {
    case EditorActionTypes.SET_SIZE:
      return {
        ...state,
        width: action.payload.width,
        height: action.payload.height,
      };
    case EditorActionTypes.SET_CODE:
      return { ...state, code: action.payload.code };
    case EditorActionTypes.SET_CODEEDITOR:
      return { ...state, codeEditor: action.payload.codeEditor };
    case EditorActionTypes.SET_FONTSIZE:
      return { ...state, fontSize: action.payload.value };
    case EditorActionTypes.SET_DECORATION:
      return { ...state, decoration: action.payload.decoration };
    case EditorActionTypes.SET_MARKER:
      monacoEditor.editor.setModelMarkers(
        state.codeEditor!.getModel()!,
        'puppy',
        action.payload.markers
      );
      return {
        ...state,
        codeEditor: state.codeEditor,
        markers: action.payload.markers,
      };
    case EditorActionTypes.SET_THEME:
      return { ...state, theme: action.payload.theme };
    case EditorActionTypes.SET_DIFFSTARTLINENUMBER:
      return { ...state, diffStartLineNumber: action.payload.startLineNumber };
    default:
      return state;
  }
};

export default editorReducer;
