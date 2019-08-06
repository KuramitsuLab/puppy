

import os
from subprocess import STDOUT, check_output
from pathlib import Path
from flask import Flask, render_template, send_file, request, Response
from puppy import makeCode


def getRootPath(subdir='data'):
    return Path(__file__).parent.absolute() / subdir


def ext():
    return 'py'


def uid():
    return 'kkuramitsu'


app = Flask(__name__, template_folder='client/static')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/<path:d>')
def dist(d):
    try:
        path = getRootPath() / 'p' / d  # / ('index.md')
        if path.exists():
            return render_template('index2.html', message=d)
        return send_file(f'client/static/{d}')
    except:
        return send_file('client/static/image/puppyLogo.png')
# sumomo


@app.route('/setting/<path:d>')
def dist_settings(d):
    if '/' in d:
        d = d.split('/')[0]
    path = getRootPath() / 'p' / d / ('setting.json')
    return send_file(str(path))


@app.route('/problem/<path:d>')
def dist_problem(d):
    path = getRootPath() / 'p' / d / ('index.md')
    return send_file(str(path))


@app.route('/sample/<path:d>')
def dist_sample(d):
    file = getRootPath() / 'u' / uid() / (d.replace('/', '-') + '.py')
    if file.exists():
        return send_file(str(file))
    path = getRootPath() / 'p' / d / ('sample.py')
    return send_file(str(path))


@app.route('/gallery')
def dist_gallery():
    ls = []
    for f in os.listdir(getRootPath('client/static/image')):
        ls.append(
            f'<div><img style="width: 100%" src="/image/{f}"></img><div class="caption">{f}</div></div>')
    return Response('\n'.join(ls), mimetype='text/html')


# judge

def getInputFile(problem='ITPP/01A', testCase=1):
    path = getRootPath(f'data/p/{problem}/{testCase}in.txt')
    return str(path) if path.exists() else None


def getOutputFile(problem='ITPP/01A', testCase=1):
    path = getRootPath(f'data/p/{problem}/{testCase}out.txt')
    return str(path) if path.exists() else None


def run_sumomo(submitted, problem='ITPP/01A', testCase=1):
    # submitted されたソースコードを保存する
    with open("main.py", "w", encoding="utf8") as f:
        f.write(submitted)
    #output = check_output(["python3", "./temp.py"], stderr=STDOUT, timeout=10)
    infile = getInputFile(problem, testCase)
    command = f'python3 main.py < {infile}'
    output = check_output(command, shell=True, stderr=STDOUT, timeout=10)
    return (command, output.decode("utf8"))


@app.route('/build/<path:d>', methods=['POST'])
def dist_build(d):
    source = request.data.decode("utf8")
    command, output = run_sumomo(source, d)
    with open("output.txt", "w", encoding="utf8") as f:
        f.write(f'$ {command}\n')
        f.write(output)
    return send_file("output.txt")


@app.route('/compile', methods=['POST'])
def transcompile():
    inputText = request.data
    return Response(makeCode(inputText.decode('utf-8'), []), mimetype='application/javascript')


'''

@app.route('/image/<path:d>')
def image_dist(d):
    return send_file('image', d)


@app.route('/audio/<path:d>')
def audio_dist(d):
    return send_static_file('audio', d)

@app.route('/js/<path:d>')
def js_dist(d):
    return send_static_file('js', d)

def send_static_file(path1, path2):
    return send_file(f'client/static/{path1}/{path2}')
'''


def main():
    app.run(host='0.0.0.0', port=8080, debug=True)


if __name__ == '__main__':
    main()
