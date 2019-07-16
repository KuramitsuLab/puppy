import sys
from collections import namedtuple
from pegpy.tpeg import grammar, generate, STDLOG

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


def FuncDecl(env, t, indent, out):
    name = t['name'].asString()
    out.append('const ' + name + " = (")
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
        lenv[pname] = VarInfo(pname, localname(pname), True, ty)
    out.append(") => ")
    env[name] = VarInfo(name, localname(name), True, types)
    lenv[name] = env[name]
    lenv['@local'] = name
    conv(lenv, t['body'], indent, out)
    return None


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
        lenv[pname] = VarInfo(pname, localname(pname), True, None)
    out.append(") => ")
    lenv['lambda'] = VarInfo('lambda', '', True, types)
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
    return 'int'


def Double(env, t, indent, out):
    out.append(t.asString())
    return 'int'


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
        ty = check(ty, env, sub, indent, out, '全ての要素を同じ型{ty}に揃えてください')
        out.append(',')
    out.append(']')
    return 'list' if ty == None else f'list[{ty}]'


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


VarInfo = namedtuple('VarInfo', 'source target local types')
EmptyOption = {}
MatterTypes = ('matter', 'int', 'int', EmptyOption)


def isMatter(types):
    return len(types) == 4 and types[0] == 'matter' and types[1] == 'int' and types[2] == 'int' and isinstance(types[3], dict)


def Name(env, t, indent, out):
    name = t.asString()
    if name in env:
        var = env[name]
        out.append(var.target)
    else:
        out.append(name)
        perror(t, f'変数名{name}は未定義です')


def VarDecl(env, t, indent, out):
    left = t['left']
    target = None
    ty = None
    if left.tag == 'Name':
        name = left.asString()
        if name in env:
            vari = env[name]
            ty = vari.types
            out.append(vari.target)
        else:
            target = localname(
                name) if '@local' in env else f"puppy.vars['{name}']"
            out.append(target)
    else:
        ty = conv(env, t['left'], indent, out)
    out.append(' = ')
    ty = check(ty, env, t['right'], indent, out)
    if target is not None:
        env[name] = VarInfo(name, target, '@local' in env, ty)


def localname(name):
    return name


def pushenv(env, key, val):
    p = env.get(key, None)
    env[key] = val
    return p


def popenv(env, key, prev):
    if prev == None:
        del env[key]
    else:
        env[key] = prev


def ApplyExpr(env, t, indent, out):
    name = t['name'].asString()
    if name in env:
        aname = name + '@' + str(len(t.subs())-1)
        if aname in env:
            vari = env[aname]
            print(aname, vari)
        else:
            vari = env[name]
        name = vari.target
        types = vari.types
    else:
        _, types = guess_Matter(env, name, t)

    if name == 'world':
        set_World(env, t, types[-1])
        return 'matter'

    outter = pushenv(env, '@funcname', name)
    if isMatter(types):
        out.append(f'puppy.newMatter(new puppy.vars["{name}"](')
        emit_Args(env, t, types, '', indent, out)
        out.append(')')
        env['@yield'] = t.pos()[2]  # linenum
    else:
        out.append(name)
        emit_Args(env, t, types, '(', indent, out)
        if name == 'puppy.print':
            env['@yield'] = t.pos()[2]  # linenum
    popenv(env, '@funcname', outter)
    return types[0]


def guess_Matter(env, name, t):
    return ('Circle', MatterTypes)


def emit_Args(env, t, types, prev, indent, out):
    tidx = 1
    args = [y for x, y in t.subs()]
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
        out.append(f"'linenum': {t.pos()[2]},")
        out.append('}')
    out.append(')')


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
    'width': 'int',
    'height': 'int',
    'image': 'str',
    'strokeStyle': 'str',
    'lineWidth': 'int',
    'fillStyle': 'str',
    'restitution': 'int',  # float と int は同じ
    'angle': 'int',
    'friction': 'int',
    'frictionStatic': 'int',
    'airFriction': 'int',
    'torque': "int",
    'stiffness': 'int',
    'isSensor': 'bool',
    'damping': 'int',
    'font': 'str',
    'fontStyle': 'str',
    'clicked': (None, 'matter'),
}


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


def GetExpr(env, t, indent, out):
    conv(env, t['recv'], indent, out)
    out.append('.')
    name = t['name'].asString()
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
    check('int', env, t['index'], indent, out)
    out.append(']')
    return ty


def IfStmt(env, t, indent, out):
    out.append('if (')
    conv(env, t['cond'], indent, out)
    out.append(') ')
    conv(env, t['then'], indent, out)
    if 'else' in t:
        out.append('else ')
        conv(env, t['else'], indent, out)


def ForStmt(env, t, indent, out):
    # FIXME 変数
    if(t['each'].tag == 'Name'):
        name = t['each'].asString()
    else:
        perror(t['each'], '変数名が欲しいところです')
        return
    out.append(f'for (var {name} of ')
    ty = check('list', env, t['list'], indent, out, msg='ここはリストでなければなりません')
    out.append(')')
    if ty != None and ty.startswith('list'):
        ty = ty[5:-1]
    outer = pushenv(env, name, VarInfo(name, localname(name), True, ty))
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
    global WORLD
    args = [y for x, y in t.subs()]
    WORLD['width'] = static_value(env, args[1])
    WORLD['height'] = static_value(env, args[2])
    for k in options:
        WORLD[k] = options[k]
    for arg in args[3:]:
        if arg.tag == 'KeywordArgument':
            k = arg['name'].asString()
            v = static_value(env, arg['value'])
            WORLD[k] = v
    print(WORLD)

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


def puppyVMCode(main):
    global WORLD, ERROR
    world = []
    for k in WORLD:
        world.append(f"     '{k}': {WORLD[k]},")
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
    preview = main.replace('yield', '//yield')
    return f'''
window['PuppyVMCode'] = {{
  world: {{
{world}
  }},
  bodies: [],
  preview: function(Matter,puppy){{
{preview}
  }},
  main: function*(Matter,puppy){{
{main}
  }},
  errors: [
{error}
  ]
}}
'''


def transpile(s, errors=[]):
    global ERROR
    t = parser(s)
    STDLOG.dump(t)  # debug
    ERROR = errors
    if t.tag == 'err':
        perror(t, '構文エラーです. 文法を確認しましょう')
        return puppyVMCode('')
    # start transpile
    env = {
        'print': VarInfo('print', 'puppy.print', False, [None, None, EmptyOption]),
        # 返値, 引数.. None はなんでもいい
        'len': VarInfo('len', 'puppy.len', False, ['int', None]),
        # 可変長引数
        'range@3': VarInfo('range', 'puppy.range3', False, ['list[int]', 'int', 'int', 'int']),
        'range@2': VarInfo('range', 'puppy.range2', False, ['list[int]', 'int', 'int']),
        'range': VarInfo('range', 'puppy.range', False, ['list[int]', 'int']),
        'World': VarInfo('World', 'world', False, MatterTypes),
        'Circle': VarInfo('Circle', 'Circle', False, MatterTypes),
        'Rectangle': VarInfo('Rectangle', 'Rectangle', False, MatterTypes),
        'Polygon': VarInfo('Polygon', 'Polygon', False, MatterTypes),
        'Ball': VarInfo('Ball', 'Circle', False, ['matter', 'int', 'int', {'restitution': 1.0}]),
        'Block': VarInfo('Block', 'Rectangle', False, ['matter', 'int', 'int', {'isStatic': 'true'}]),
    }
    indent = INDENT  # ''
    out = []
    conv(env, t, indent, out)
    code = puppyVMCode(''.join(out))
    print(code)
    return code

# main スクリプト


if __name__ == "__main__":
    source = '''lambda x,y: print("こんにちは、のぶちゃん")\n'''
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            source = f.read()
    code = transpile(source)
    print(code)

__package__ = 'puppy'
