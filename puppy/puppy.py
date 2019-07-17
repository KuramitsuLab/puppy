import sys
from collections import namedtuple
from pegpy.tpeg import grammar, generate, STDLOG
import hashlib

# 文法を直したいときは
# pegpy/grammar/puppy.tpeg を編集する

peg = grammar('puppy2.tpeg')
parser = generate(peg)


# print(t.tag)
# for label, subtree in t:
#   print(label, subtree)


def Source(env, t, indent, out):
    for _, subtree in t:
        out.append(indent)
        conv(env, subtree, indent, out)
        out.append('\n')
        auto_yield(env, indent, out)


def auto_yield(env, indent, out):
    if '@yield' in env and not '@local' in env:
        out.append(f"{indent}yield {env['@yield']};\n")
        del env['@yield']


def ClassDecl(env, t, indent, out):
    name = t['name'].asString()
    argNum = 1
    if 'extends' in t:
        extends = t["extends"].asString()
        argNum += 1
        out.append(
            f'puppy.vars["{name}"] = class extends puppy.vars["{extends}"] ')
    else:
        out.append(f'puppy.vars["{name}"] = class')
    env['@local'] = name
    for i, (_, sub) in enumerate(t.subs()):
        if i < argNum:
            continue
        print(sub)
        conv(env, sub, indent, out)
    return 'class'


def globalname(name):
    return f"puppy.vars['{name}']"


def localname(name):
    return name


def FuncDecl(env, t, indent, out):
    name = t['name'].asString()
    out.append(f'{globalname(name)} = (')
    lenv = env.copy()
    types = [None]
    for _, p in t['params']:
        pname = p['name'].asString()
        if(len(types) > 1):
            out.append(f',{pname}')
        else:
            out.append(pname)
        ty = p['type'].asString() if 'type' in p else None
        if ty is not None:
            out.append(f'/*{ty}*/')
        types.append(ty)
        lenv[pname] = VarInfo(localname(pname), True, ty)
    out.append(") => ")
    env[name] = lenv[name] = VarInfo(globalname(name), False, types)
    lenv['@local'] = name
    conv(lenv, t['body'], indent, out)
    return None


def Return(env, t, indent, out):
    if not '@local' in env:
        pwarn(t, 'ここで return は使えません')
        return
    vari = env[env['@local']]
    types = vari.types
    out.append('return')
    if 'expr' in t:
        if types[0] == 'void':
            pwarn(t['expr'], 'この返値は無視されます')
            return None
        out.append(' ')
        ty = check(types[0], env, t['expr'], indent,
                   out, f'{types[0]}型の値を返すようにしてください')
        types[0] = ty
    elif types[0] == 'None' or types[0] == 'void':
        types[0] = 'void'
    else:
        perror(t, f'{types[0]}型の値を返すようにしてください')
    return None


def FuncExpr(env, t, indent, out):
    out.append("(")
    lenv = env.copy()
    types = [None]
    for _, p in t['params']:
        pname = p.asString()
        if(len(types) > 1):
            out.append(f',{pname}')
        else:
            out.append(pname)
        types.append(None)
        lenv[pname] = VarInfo(localname(pname), True, None)
    out.append(") => ")
    lenv['lambda'] = VarInfo('', True, types)
    lenv['@local'] = 'lambda'
    conv(lenv, t['body'], indent, out)
    return types


def Yield(env, t, indent, out):
    if '@local' in env:
        pwarn(t, '関数内で yield は使えません')
        return
    out.append(f'yield {t.pos()[2]}')
    return None


def Continue(env, t, indent, out):
    if '@inloop' in env:
        pwarn(t, 'continue は、for文内でのみ使えます')
        return
    out.append('continue')
    return None


def Break(env, t, indent, out):
    if '@inloop' in env:
        pwarn(t, 'break は、for文内でのみ使えます')
        return
    out.append('break')
    return None


def Pass(env, t, indent, out):
    return None


def TrueExpr(env, t, indent, out):
    out.append("true")
    return 'bool'


def FalseExpr(env, t, indent, out):
    out.append('false')
    return 'bool'


def Int(env, t, indent, out):
    out.append(t.asString())
    return 'num'


def Double(env, t, indent, out):
    out.append(t.asString())
    return 'num'


def String(env, t, indent, out):
    out.append("'{}'".format(t.asString()))
    return 'str'


def Char(env, t, indent, out):
    out.append("'{}'".format(t.asString()))
    return 'str'


def List(env, t, indent, out):
    ty = None
    out.append('[')
    for _, sub in t:
        ty = check(ty, env, sub, indent, out, '全ての要素を同じ型に揃えてください')
        out.append(',')
    out.append(']')
    return 'list' if ty == None else f'list[{ty}]'


def Tuple(env, t, indent, out):
    ty = None
    subs = t.subs()
    if len(subs) > 2:
        pwarn(t, 'リストは[...]で書いてください')
        return List(env, t, indent, out)
    if len(subs) == 1:
        out.append('(')
        ty = conv(env, subs[0][1], indent, out)
        out.append(')')
        return ty
    else:
        out.append('{ x: ')
        check(ty, env, subs[0][1], indent, out, 'ベクトルの要素は数値です')
        out.append(', y: ')
        check(ty, env, subs[1][1], indent, out, 'ベクトルの要素は数値です')
        out.append('}')
        return 'vec'


def Data(env, t, indent, out):
    out.append('{')
    for _, sub in t:
        conv(env, sub, indent, out)
        out.append(',')
    out.append('}')


def KeyValue(env, t, indent, out):
    conv(env, t['name'], indent, out)
    out.append(': ')
    conv(env, t['value'], indent, out)


def Infix(env, t, indent, out):
    op = t['name'].asString()
    out.append('(')
    ty = conv(env, t['left'], indent, out)
    out.append(op)
    ty2 = conv(env, t['right'], indent, out)
    out.append(')')
    return typeInfixFIXME(env, ty, op, ty2)


CMP = ['<', '>', '=', '!=', '<=', '>=']


def typeInfixFIXME(env, ty, op, ty2):
    if op in CMP:
        return 'bool'
    return ty


# Variable


VarInfo = namedtuple('VarInfo', 'target local types')
EmptyOption = {}
MatterTypes = ('matter', 'num', 'num', EmptyOption)


def isMatter(types):
    return len(types) == 4 and types[0] == 'matter' and types[1] == 'num' and types[2] == 'num' and isinstance(types[3], dict)


def Name(env, t, indent, out):
    name = t.asString()
    if name in env:
        var = env[name]
        out.append(var.target)
    else:
        out.append(name)
        perror(t, f'変数名{name}は一度も定義されていません')


def VarDecl(env, t, indent, out):
    left = t['left']
    newvar = None
    ty = None
    if left.tag == 'Name':
        name = left.asString()
        if name in env:
            vari = env[name]
            ty = vari.types
            out.append(vari.target)
        elif '@local' in env:  # ローカルスコープなら
            newvar = localname(name)
            out.append(f'let {newvar}')
        else:
            newvar = globalname(name)
            out.append(newvar)
    else:
        ty = conv(env, t['left'], indent, out)
    out.append(' = ')
    # 左辺値から型推論する
    ty = check(ty, env, t['right'], indent, out)
    if newvar != None:
        env[name] = VarInfo(newvar, '@local' in env, ty)


def pushenv(env, key, val):
    p = env.get(key, None)
    env[key] = val
    return p


def popenv(env, key, prev):
    if prev == None:
        del env[key]
    else:
        env[key] = prev


IMPORT_MATH = {
    'pi': VarInfo('3.14159', False, 'num'),
    'sin': VarInfo('puppy.sin', False, ('num', 'num')),
}

BUILDIN = {
    'math.': IMPORT_MATH,
    'print': VarInfo('puppy.print', False, [None, None, EmptyOption]),
    # 返値, 引数.. None はなんでもいい
    'len': VarInfo('puppy.len', False, ['num', None]),
    # 可変長引数
    'range@3': VarInfo('puppy.range3', False, ['list[int]', 'num', 'num', 'num']),
    'range@2': VarInfo('puppy.range2', False, ['list[int]', 'num', 'num']),
    'range': VarInfo('puppy.range', False, ['list[int]', 'num']),
    'World': VarInfo('world', False, MatterTypes),
    'Circle': VarInfo('Circle', False, MatterTypes),
    'Rectangle': VarInfo('Rectangle', False, MatterTypes),
    'Polygon': VarInfo('Polygon', False, MatterTypes),
    'Ball': VarInfo('Circle', False, ['matter', 'num', 'num', {'restitution': 1.0}]),
    'Block': VarInfo('Rectangle', False, ['matter', 'num', 'num', {'isStatic': 'true'}]),
}

KEYWORDS = {
    'width': 'width',
    'height': 'height',
    'image': 'image',
    'strokeStyle': 'strokeStyle',
    'lineWidth': 'lineWidth',
    'fillStyle': 'fillStyle',
    'restitution': 'restitution',
    'angle': 'angle',
    'friction': 'friction', 'frictionStatic': 'frictionStatic',
    'airFriction': 'airFriction',
    'torque': "torque",
    'stiffness': 'stiffness',
    'isSensor': 'isSensor',
    'damping': 'damping',
    'font': 'font',
    'fontStyle': 'fontStyle',
    'clicked': 'clicked',
    'isStatic': 'isStatic',

    # 日本語名
    '名前': 'name',
    '幅': 'width', '横幅': 'width', '縦': 'width',
    '高さ': 'height', '横': 'height',
    '傾き': 'angle',
    '質量': 'mass', '密度': 'density', '体積': 'area', '容積': 'area',
    '摩擦係数': 'friction', '静止摩擦係数': 'frictionStatic',
    '空気摩擦係数': 'airFriction',
    '反発係数': 'restitution', '跳ね返り係数': 'restitution', 'はねかえり係数': 'restitution',
    '回転力': "torque", 'トルク': "torque",
    '剛性': 'stiffness', 'ばね定数': 'stiffness',
    'センサー': 'isSensor',
    '減衰': 'damping',
    'フォント': 'font',
}

KEYWORDTYPES = {
    'width': 'num',
    'height': 'num',
    'image': 'str',
    'strokeStyle': 'str',
    'lineWidth': 'num',
    'fillStyle': 'str',
    'restitution': 'num',  # float と int は同じ
    'angle': 'num',
    'friction': 'num',
    'frictionStatic': 'num',
    'airFriction': 'num',
    'torque': "int",
    'stiffness': 'num',
    'isSensor': 'bool',
    'damping': 'num',
    'font': 'str',
    'fontStyle': 'str',
    'clicked': (None, 'matter'),
}


def GetExpr(env, t, indent, out):
    name = t['name'].asString()
    pkgname = t['recv'].asString() + '.'
    if pkgname in env:  # math.pi のような定数
        penv = env[pkgname]
        if name in penv:
            vari = penv[name]
            out.append(vari.target)
            return vari.types
        else:
            perror(t['name'], f'{pkgname}{name}？ タイプミスしてませんか？')
            out.append('null')
            return None
    conv(env, t['recv'], indent, out)
    out.append('.')
    if not name in KEYWORDS:
        pwarn(t['name'], f'{name}？ タイプミスしてませんか？')
        out.append(name)
        return None
    else:
        name = KEYWORDS[name]
        out.append(name)
        return KEYWORDTYPES[name]


def IndexExpr(env, t, indent, out):
    ty = check('list', env, t['recv'], indent, out)
    if ty != None and ty.startswith('list'):
        ty = ty[5:-1]
    out.append('[')
    check('num', env, t['index'], indent, out)
    out.append(']')
    return ty


def MethodExpr(env, t, indent, out):
    name = t['name'].asString()
    pkgname = t['recv'].asString() + '.'
    if pkgname in env:
        penv = env[pkgname]
        if name in penv:
            vari = penv[name]
            name = vari.target
            types = vari.types
            out.append(name)
            args = [name] + [y for x, y in t['params'].subs()]
            emit_Args(env, t['name'], args, types, '(', indent, out)
            return types[0]
        else:
            perror(t['name'], f'{pkgname}{name}？ タイプミスしていませんか？')
            out.append('null')
            return None
    methodname = '.' + name
    if methodname in env:
        vari = env[methodname]
        types = vari.types
        out.append(vari.target)
        args = [name, t['recv']] + [y for x, y in t['params'].subs()]
        emit_Args(env, t['name'], args, types, '(', indent, out)
        return types[0]
    else:
        perror(t['name'], f'本当にメソッド名 {name} が正しいか確認してください')
        out.append('null')
        return None


def ApplyExpr(env, t, indent, out):
    name = t['name'].asString()
    if name in env:
        vari = env[name]
        name = vari.target
        types = vari.types
        if name == 'world':
            set_World(env, t, types[-1])
            return 'matter'
    else:
        _, types = guess_Matter(env, name, t)

    if isMatter(types):
        outter = pushenv(env, '@funcname', name)
        out.append(f'puppy.newMatter(new puppy.vars["{name}"](')
        args = [y for x, y in t.subs()]
        emit_Args(env, t['name'], args, types, '', indent, out)
        out.append(')')
        env['@yield'] = t.pos()[2]  # linenum
        popenv(env, '@funcname', outter)
    else:
        out.append(name)
        args = [y for x, y in t.subs()]
        emit_Args(env, t['name'], args, types, '(', indent, out)
        if name == 'puppy.print':
            env['@yield'] = t.pos()[2]  # linenum
    return types[0]


def guess_Matter(env, name, t):
    return ('Circle', MatterTypes)


def emit_Args(env, t, args, types, prev, indent, out):
    tidx = 1
    kargs = None
    while tidx < len(types):
        if isinstance(types[tidx], dict):
            kargs = args[tidx:]
            break
        if tidx < len(args):
            out.append(prev)
            check(types[tidx], env, args[tidx], indent, out)
            tidx += 1
            prev = ','
        else:
            perror(t, f'必要な引数が足りません  {tidx} {args}')
            out.append(')')
            return
    if kargs != None:
        options = types[tidx].copy()
        outter = pushenv(env, '@options', options)
        out.append(prev)
        out.append('{')
        for sub in kargs:
            conv(env, sub, indent, out)
        for k in options:
            out.append(f"'{k}': {options[k]},")
        popenv(env, '@options', outter)
        out.append(f"'trace': {t.pos()[2]},")
        out.append('}')
    out.append(')')


def KeywordArgument(env, t, indent, out):
    name = t['name'].asString()
    if not '@options' in env:
        pwarn(t, f'キーワード引数{name}の使えない位置です')
        return conv(env, t['value'], indent, out)
    if not name in KEYWORDS:
        pwarn(t['name'], f'{name}？ タイプミスしてませんか？')
    else:
        if name != KEYWORDS[name]:
            pinfo(t, f'{name} => {KEYWORDS[name]}')
        name = KEYWORDS[name]
    out.append("'" + name + "': ")
    options = env.get('@options', EmptyOption)
    if name in options:
        del options[name]
    key = pushenv(env, '@key', name)
    check(KEYWORDTYPES.get(name, None), env, t['value'], indent, out)
    popenv(env, '@key', key)
    out.append(",")


def NLPSymbol(env, t, indent, out):
    phrase = t.asString()
    if '@funcname' in env:
        k = env.get('@key', '')
        k, v = nobuKeyVal(env['@funcname'], k, phrase)
        out.append(f"'{k}': {v},")
        options = env.get('@options', EmptyOption)
        if k in options:
            del options[k]
    else:
        v = nlpExpr(env.get('@target', ''), phrase)
        out.append(v)


def nobuKeyVal(funcname, key='unknown', phrase='"?"'):
    return (key, phrase)


def nlpExpr(varname, phrase='"?"'):
    return phrase


def IfStmt(env, t, indent, out):
    out.append('if (')
    conv(env, t['cond'], indent, out)
    out.append(') ')
    conv(env, t['then'], indent, out)
    if 'else' in t:
        out.append('else ')
        conv(env, t['else'], indent, out)


def ForStmt(env, t, indent, out):
    if(t['each'].tag == 'Name'):
        name = t['each'].asString()
    else:
        perror(t['each'], '変数名が欲しいところです')
        return
    out.append(f'for (let {name} of ')
    ty = check('list', env, t['list'], indent, out, msg='ここはリストでなければなりません')
    out.append(')')
    if ty != None and ty.startswith('list'):
        ty = ty[5:-1]
    outer = pushenv(env, name, VarInfo(localname(name), True, ty))
    outer2 = pushenv(env, '@inloop', True)
    conv(env, t['body'], indent, out)
    popenv(env, name, outer)
    popenv(env, '@inloop', outer2)


INDENT = '\t'


def Block(env, t, indent, out):
    out.append('{\n')
    nested = INDENT + indent
    for _, subtree in t:
        out.append(nested)
        conv(env, subtree, nested, out)
        out.append('\n')
        auto_yield(env, nested, out)
    out.append(indent + '}\n')


func = globals()


def conv(env, t, indent, out):
    if t.tag in func:
        return func[t.tag](env, t, indent, out)
    else:
        out.append(str(t))
        return None


# World
WORLD = {
    'width': '1000',
    'height': '1000',
    'mouse':  'true',
    'background':  "'white'",
}


def static_value(env, t):
    out = []
    conv(env, t, '', out)
    return ''.join(out)


def set_World(env, t, options):
    W = env['@world']
    args = [y for x, y in t.subs()]
    start = 0
    if len(args) > 1 and args[1].tag != 'KeywordArgument':
        W['width'] = static_value(env, args[1])
        start = 2
    if len(args) > 2 and args[2].tag != 'KeywordArgument':
        W['height'] = static_value(env, args[2])
        start = 3
    for k in options:
        W[k] = options[k]
    for arg in args[start:]:
        if arg.tag == 'KeywordArgument':
            k = arg['name'].asString()
            v = static_value(env, arg['value'])
            W[k] = v

# TypeChecker


def matchType(request, given):
    if request is None or given is None:
        return True
    return given.startswith(request)


def check(request, env, t, indent, out, msg=None):
    given = conv(env, t, indent, out)
    if not matchType(request, given):
        if msg != None:
            perror(t, msg)
        else:
            perror(t, f'悪名高き型エラーです (ヒント: 仕様上は{request} != コード上は{given})')
    return given


ERROR = []


def perror(t, msg):
    _, pos, raw, col = t.pos()
    ERROR.append(('error', pos, raw, col, msg))


def pwarn(t, msg):
    _, pos, raw, col = t.pos()
    ERROR.append(('warning', pos, raw, col, msg))


def pinfo(t, msg):
    _, pos, raw, col = t.pos()
    ERROR.append(('information', pos, raw, col, msg))


def puppyVMCode(env, main):
    global ERROR
    W = env['@world']
    world = []
    for k in W:
        world.append(f"     '{k}': {W[k]},")
    error = []
    for e in ERROR:
        row = e[2]-2 if e[3] == -1 else e[2]-1
        error.append(f'''
        {{
            'type': '{e[0]}',
            'row': {row},
            'text': "{e[4]}"
        }},''')
    world = '\n'.join(world)
    error = '\n'.join(error)
    lives = ''
    codehash = hashlib.sha256(world.encode() + main.encode()).hexdigest()
    return f'''
window['PuppyVMCode'] = {{
  hash: '{codehash}',
  world: {{
{world}
  }},
  bodies: [],
  lives: [
{lives}
  ],
  main: function*(Matter,puppy){{
{main}
  }},
  errors: [
{error}
  ]
}}
'''


def transpile(s, errors=[]):
    global WORLD, ERROR
    t = parser(s)
    STDLOG.dump(t)  # debug
    ERROR = errors
    if t.tag == 'err':
        perror(t, '構文エラーです. 文法通り書けているか確認しましょう')
        return puppyVMCode({'@world': {}}, '')
    # start transpile
    env = BUILDIN.copy()
    env['@world'] = WORLD.copy()
    env['@lives'] = []
    out = []
    conv(env, t, INDENT, out)
    code = puppyVMCode(env, ''.join(out))
    print(code)
    return code

# main スクリプト


if __name__ == "__main__":
    source = '''A = Ball(1,1,width=1000)\n'''
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            source = f.read()
    code = transpile(source)
    print(code)

__package__ = 'puppy'
