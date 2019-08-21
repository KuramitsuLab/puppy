import { setBackground, setCode } from './editor';
import { CourseShape, setCourse, setContent } from './course';
import { setPuppy } from './puppy';
import { PuppyCode, Puppy, runPuppy } from '../components/Puppy/vm/vm';
import { ReduxActions } from '../store';

const session = window.sessionStorage;
const path = location.pathname;

const checkError = (
  dispath: (action: ReduxActions) => void,
  code: PuppyCode
) => {
  let error_count = 0;
  const annos: any[] = [];
  // editor.getSession().clearAnnotations();
  for (const e of code.errors) {
    if (e['type'] === 'error') {
      error_count += 1;
    }
    annos.push(e);
    // editor.getSession().setAnnotations(annos);
  }
  if (error_count === 0) {
    return false;
  }
  dispath(setBackground('rgba(254,244,244,0.7)'));
  // editorPanel.style.backgroundColor = 'rgba(254,244,244,0.7)';
  return true;
};

export const trancepile = (dispath: (action: ReduxActions) => void) => (
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
        if (!checkError(dispath, code)) {
          session.setItem(`/sample${path}`, source);
          setPuppy(runPuppy(puppy!, code, alwaysRun));
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

export const fetchContent = (dispath: (action: ReduxActions) => void) => (
  coursePath: string,
  path: string
): Promise<void> =>
  loadFile(`/api/problem/${coursePath}/${path}`).then((content: string) =>
    dispath(setContent(content))
  );

export const fetchSample = (dispath: (action: ReduxActions) => void) => (
  coursePath: string,
  path: string
): Promise<void> =>
  loadFile(`/api/sample/${coursePath}/${path}`).then((sample: string) => {
    dispath(setCode(sample));
  });
