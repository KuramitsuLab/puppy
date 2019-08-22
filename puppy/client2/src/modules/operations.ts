import { setTheme, setCode, setMarker } from './editor';
import { CourseShape, setCourse, setContent } from './course';
import { setPuppy } from './puppy';
import { PuppyCode, Puppy, runPuppy, ErrorShape } from '../vm/vm';
import { ReduxActions } from '../store';

const session = window.sessionStorage;
const path = location.pathname;

const checkError = (
  dispatch: (action: ReduxActions) => void,
  code: PuppyCode
) => {
  let error_count = 0;
  const annos: ErrorShape[] = [];
  // editor.getSession().clearAnnotations();
  for (const e of code.errors) {
    if (e.type === 'error') {
      error_count += 1;
    }
    annos.push(e);
    // editor.getSession().setAnnotations(annos);
  }
  dispatch(setMarker(annos));
  if (error_count === 0) {
    dispatch(setTheme('vs'));
    return false;
  }
  dispatch(setTheme('error'));
  // editorPanel.style.backgroundColor = 'rgba(254,244,244,0.7)';
  return true;
};

export const trancepile = (dispatch: (action: ReduxActions) => void) => (
  puppy: Puppy | null,
  source: string,
  alwaysRun: boolean
) =>
  fetch('/api/compile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/text; charset=utf-8',
    },
    body: source,
  })
    .then((res: Response) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error(res.statusText);
    })
    .then((js: string) => {
      try {
        const code = Function(js)(); // Eval javascript code
        if (!checkError(dispatch, code)) {
          session.setItem(`/sample${path}`, source);
          dispatch(setPuppy(runPuppy(puppy!, code, alwaysRun)));
        }
      } catch (e) {
        // alert(`トランスパイルにしっぱいしています ${e}`);
        // editorPanel.style.backgroundColor = 'rgba(244,244,254,0.7)';
        console.log(js);
        console.log(`FAIL TO TRANSCOMPILE ${e}`);
        console.log(e);
      }
    })
    .catch((msg: string) => {
      alert(`Puppy is down!! ${msg}`);
    });

const loadFile: (path: string) => Promise<string> = path => {
  return fetch(path, {
    method: 'GET',
  })
    .then((res: Response) => {
      if (res.ok) {
        return res.text();
      }
      throw new Error(res.statusText);
    })
    .then((sample: string) => {
      return sample;
    });
};

export const fetchSetting = (dispath: (action: ReduxActions) => void) => (
  path: string
): Promise<void> =>
  loadFile(`/api/setting/${path}`)
    .then((s: string) => {
      return JSON.parse(s);
    })
    .then((course: CourseShape) => {
      dispath(setCourse(course));
    })
    .catch((msg: string) => {
      console.log(`ERR ${msg}`);
    });

export const fetchContent = (dispatch: (action: ReduxActions) => void) => (
  coursePath: string,
  path: string
): Promise<void> =>
  loadFile(`/api/problem/${coursePath}/${path}`).then((content: string) =>
    dispatch(setContent(content))
  );

export const fetchSample = (dispatch: (action: ReduxActions) => void) => (
  puppy: Puppy | null,
  coursePath: string,
  path: string
): Promise<void> =>
  loadFile(`/api/sample/${coursePath}/${path}`).then((sample: string) => {
    dispatch(setCode(sample));
    trancepile(dispatch)(puppy, sample, false);
  });
