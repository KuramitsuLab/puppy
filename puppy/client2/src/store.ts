import { Action, createStore, combineReducers } from 'redux';
import editor, { EditorState, EditorActions } from './modules/editor';
import course, { CourseState, CourseActions } from './modules/course';
import puppy, { PuppyState, PuppyActions } from './modules/puppy';

const allReducers = combineReducers({
  editor,
  course,
  puppy,
});

export const store = createStore(allReducers);

export type ReduxState = {
  editor: EditorState;
  course: CourseState;
  puppy: PuppyState;
};

export type ReduxActions =
  | PuppyActions
  | EditorActions
  | CourseActions
  | Action;
