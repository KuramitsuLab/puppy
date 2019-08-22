import { Action } from 'redux';

enum InputActionTypes {
  SET_VALUE = 'SET_VALUE',
  SET_SHOW = 'SET_SHOW',
  SET_PLACEHOLDER = 'SET_PLACEHOLDER',
}

interface SetValueAction extends Action {
  type: InputActionTypes.SET_VALUE;
  payload: {
    value: string;
  };
}

export const setValue = (value: string): SetValueAction => ({
  type: InputActionTypes.SET_VALUE,
  payload: {
    value,
  },
});

interface SetShowAction extends Action {
  type: InputActionTypes.SET_SHOW;
  payload: {
    show: boolean;
  };
}

export const setShow = (show: boolean): SetShowAction => ({
  type: InputActionTypes.SET_SHOW,
  payload: {
    show,
  },
});

interface SetPlaceholderAction extends Action {
  type: InputActionTypes.SET_PLACEHOLDER;
  payload: {
    placeholder: string;
  };
}

export const setPlaceholder = (placeholder: string): SetPlaceholderAction => ({
  type: InputActionTypes.SET_PLACEHOLDER,
  payload: {
    placeholder,
  },
});

export type InputActions =
  | SetValueAction
  | SetShowAction
  | SetPlaceholderAction;

export type InputState = {
  value: string;
  show: boolean;
  placeholder: string;
};

const initialState: InputState = {
  value: '',
  show: false,
  placeholder: '',
};

const InputReducer = (state = initialState, action: InputActions) => {
  switch (action.type) {
    case InputActionTypes.SET_VALUE:
      return { ...state, value: action.payload.value };
    case InputActionTypes.SET_SHOW:
      if (action.payload.show) {
        return { value: '', show: action.payload.show, placeholder: '' };
      } else {
        return { ...state, show: action.payload.show };
      }
    case InputActionTypes.SET_PLACEHOLDER:
      return { ...state, placeholder: action.payload.placeholder };
    default:
      return state;
  }
};

export default InputReducer;
