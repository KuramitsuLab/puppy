import { Action } from 'redux';

export type CourseShape = {
  title: string;
  list: {
    path: string;
    title: string;
  }[];
};

enum CourseActionTypes {
  SET_CONTENT = 'SET_CONTENT',
  SET_COURSES = 'SET_COURCES',
  SET_COURSE = 'SET_COURSE',
  SET_VISIBLE = 'SET_VISIBLE',
}

interface SetContentAction extends Action {
  type: CourseActionTypes.SET_CONTENT;
  payload: {
    content: string;
  };
}

export const setContent = (content: string): SetContentAction => ({
  type: CourseActionTypes.SET_CONTENT,
  payload: {
    content,
  },
});

interface SetCoursesAction extends Action {
  type: CourseActionTypes.SET_COURSES;
  payload: {
    courses: { [path: string]: CourseShape };
  };
}

export const setCources = (courses: {
  [path: string]: CourseShape;
}): SetCoursesAction => ({
  type: CourseActionTypes.SET_COURSES,
  payload: {
    courses,
  },
});

interface SetCourseAction extends Action {
  type: CourseActionTypes.SET_COURSE;
  payload: {
    course: CourseShape;
  };
}

export const setCourse = (course: CourseShape): SetCourseAction => ({
  type: CourseActionTypes.SET_COURSE,
  payload: {
    course,
  },
});

interface SetVisibleAction extends Action {
  type: CourseActionTypes.SET_VISIBLE;
  payload: {
    visible: boolean;
  };
}

export const setVisible = (visible: boolean): SetVisibleAction => ({
  type: CourseActionTypes.SET_VISIBLE,
  payload: {
    visible,
  },
});

export type CourseActions =
  | SetContentAction
  | SetCoursesAction
  | SetCourseAction
  | SetVisibleAction;

export type CourseState = {
  content: string;
  courses: { [path: string]: CourseShape };
  course: CourseShape;
  coursePath: string;
  page: number;
  visible: boolean;
};

const initialState: CourseState = {
  content: '# Hello World \n\n Rendered by **marked**',
  courses: {},
  course: { title: '', list: [] },
  coursePath: '',
  page: 0,
  visible: true,
};

const courseReducer = (state = initialState, action: CourseActions) => {
  switch (action.type) {
    case CourseActionTypes.SET_CONTENT:
      return { ...state, content: action.payload.content };
    case CourseActionTypes.SET_COURSES:
      return { ...state, courses: action.payload.courses };
    case CourseActionTypes.SET_COURSE:
      return { ...state, course: action.payload.course };
    case CourseActionTypes.SET_VISIBLE:
      return { ...state, visible: action.payload.visible };
    default:
      return state;
  }
};

export default courseReducer;
