import { Action, createStore, combineReducers } from 'redux';
import editor, { EditorState, EditorActions } from './modules/editor';
import course, { CourseState, CourseActions } from './modules/course';
import puppy, { PuppyState, PuppyActions } from './modules/puppy';
import input, { InputState, InputActions } from './modules/input';
import version, { VersionState, VersionActions } from './modules/version';

const allReducers = combineReducers({
  editor,
  course,
  puppy,
  input,
  version,
});

export const store = createStore(allReducers);

export type ReduxState = {
  editor: EditorState;
  course: CourseState;
  puppy: PuppyState;
  input: InputState;
  version: VersionState;
};

export type ReduxActions =
  | PuppyActions
  | EditorActions
  | CourseActions
  | InputActions
  | VersionActions
  | Action;

export default store;
