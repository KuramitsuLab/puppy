import { Action } from 'redux';

enum VersionActionTypes {
  SET_VERSION_SHOW = 'SET_VERSION_SHOW',
}

interface SetShowAction extends Action {
  type: VersionActionTypes.SET_VERSION_SHOW;
  payload: {
    show: boolean;
  };
}

export const setShow = (show: boolean): SetShowAction => ({
  type: VersionActionTypes.SET_VERSION_SHOW,
  payload: {
    show,
  },
});

export type VersionActions = SetShowAction;

export type VersionState = {
  show: boolean;
};

const initialState: VersionState = {
  show: false,
};

const VersionReducer = (state = initialState, action: VersionActions) => {
  switch (action.type) {
    case VersionActionTypes.SET_VERSION_SHOW:
      return { ...state, show: action.payload.show };
    default:
      return state;
  }
};

export default VersionReducer;
