import sys
from collections import namedtuple
from pegpy.tpeg import grammar, generate, STDLOG
import hashlib
import puppytypes as ts

# 文法を直したいときは
# pegpy/grammar/puppy.tpeg を編集する

peg = grammar('puppy2.tpeg')
parser = generate(peg)

const = True
mutable = False
Symbol = namedtuple('Symbol', 'target local types')


def pushenv(env, key, val):
    p = env.get(key, None)
    env[key] = val
    return p


def popenv(env, key, prev):
    if prev == None:
        del env[key]
    else:
        env[key] = prev

# print(t.tag)
# for label, subtree in t:
#   print(label, subtree)


def Source(env, t, out):
    for _, subtree in t:
        out.append(env['@indent'])
        conv(env, subtree, out)
        emitAutoYield(env, out)
    return ts.Void


def emitAutoYield(env, out):
    if '@yield' in env and not '@local' in env:
        out.append(f"; yield {env['@yield']};\n")
        del env['@yield']
    else:
        out.append('\n')


def ClassDecl(env, t, out):
    name = t['name'].asString()
    argNum = 1
    if 'extends' in t:
        extends = t["extends"].asString()
        argNum += 1
        out.append(
            f'puppy.vars["{name}"] = class extends puppy.vars["{extends}"] ')
    else:
        out.append(f'puppy.vars["{name}"] = class')
    env['@class'] = name
    for i, (_, sub) in enumerate(t.subs()):
        if i < argNum:
            continue
        print(sub)
        conv(env, sub, out)
    return ts.Void


def switchName(env, name):
    return localName(name) if '@local' in env else globalName(name)


def globalName(name):
    return f"puppy.vars['{name}']"


def isGlobalName(name):
    return name.startwith('puppy.vars[')


def emitDeclName(env, name, out):
    if '@local' in env:
        jsname = localName(name)
        if name in env and env[name].target == jsname:
            out.append(f'{jsname} = ')
        else:
            out.append(f'var {jsname} = ')
    elif '@class' in env:
        jsname = localName(name)
        out.append(f'{jsname} = ')
    else:
        jsname = globalName(name)
        out.append(f'{jsname} = ')
    return jsname


UNICODE_NAME = {}


def localName(name):
    if name in UNICODE_NAME:
        return UNICODE_NAME[name]
    for c in name:
        if ord(c) > 127:
            uid = len(UNICODE_NAME)
            UNICODE_NAME[name] = f'_uu{uid}/*{name}*/'
            return UNICODE_NAME[name]
    return name


def FuncDecl(env, t, out):
    name = t['name'].asString()
    jsname = emitDeclName(env, name, out)
    lenv = env.copy()
    types = [ts.Type()]
    voidCheck = str(types[0])
    out.append('(')
    for _, p in t['params']:
        pname = p['name'].asString()
        if(len(types) > 1):
            out.append(f',{pname}')
        else:
            out.append(pname)
        ty = ts.parseOf(p['type'], pwarn) if 'type' in p else ts.Type()
        types.append(ty)
        lenv[pname] = Symbol(localName(pname), mutable, ty)
    out.append(") => ")
    env[name] = lenv[name] = Symbol(jsname, mutable, tuple(types))
    lenv['@local'] = types[0]  # return type
    conv(lenv, t['body'], out)
    if voidCheck == str(types[0]):
        types[0] = ts.Void
    return ts.Void


def Return(env, t, out):
    if not '@local' in env:
        pwarn(env, t, 'ここで return文は使えません')
        return ts.Void
    out.append('return')
    ret = env['@local']
    if 'expr' in t:
        if ret == ts.Void:
            pwarn(env, t['expr'], 'この返値は無視されます')
            return ts.Void
        out.append(' ')
        check(ret, env, t['expr'], out, f'{ts.msg(ret)}を返すようにしてください')
        return ts.Void
    if not ts.matchType(ts.Void, ret):
        perror(env, t, f'{ts.msg(ret)}を返すようにしてください')
    return ts.Void


def FuncExpr(env, t, out):
    lenv = env.copy()
    types = [ts.Type()]
    voidCheck = str(types[0])
    out.append("(")
    for _, p in t['params']:
        pname = p.asString()
        ty = ts.Type()
        if(len(types) > 1):
            out.append(f',{pname}')
        else:
            out.append(pname)
        types.append(ty)
        lenv[pname] = Symbol(localName(pname), mutable, ty)
    out.append(") => ")
    lenv['@local'] = types[0]  # return type
    conv(lenv, t['body'], out)
    if voidCheck == str(types[0]):
        types[0] = ts.Void
    return tuple(types)


def Yield(env, t, out):
    if '@local' in env:
        pwarn(env, t, '関数内で yield 文は使えません')
        return
    out.append(f'yield {t.pos()[2]}')
    return ts.Void


def Continue(env, t, out):
    if '@inloop' in env:
        pwarn(env, t, 'continue は、for文内でのみ使えます')
        return
    out.append('continue')
    return ts.Void


def Break(env, t, out):
    if '@inloop' in env:
        pwarn(env, t, 'break は、for文内でのみ使えます')
        return
    out.append('break')
    return ts.Void


def Pass(env, t, out):
    return ts.Void


def TrueExpr(env, t, out):
    out.append("true")
    return ts.Bool


def FalseExpr(env, t, out):
    out.append('false')
    return ts.Bool


def Int(env, t, out):
    out.append(t.asString())
    return ts.Int


def Double(env, t, out):
    out.append(t.asString())
    return ts.Float


def String(env, t, out):
    v = t.asString()[1:-1]
    out.append(repr(v))
    return ts.String


def Char(env, t, out):
    v = t.asString()[1:-1]
    out.append(repr(v))
    return ts.String


def List(env, t, out):
    ty = ts.Type()
    out.append('[')
    for _, sub in t:
        ty = check(ty, env, sub, out, '全ての要素を同じ型に揃えてください')
        out.append(',')
    out.append(']')
    return ts.Type(f'list[{ty}]')


def Tuple(env, t, out):
    subs = t.subs()
    if len(subs) > 2:
        pwarn(env, t, 'リストは[ ]で囲みましょう')
        return List(env, t, out)
    if len(subs) == 1:
        out.append('(')
        ty = conv(env, subs[0][1], out)
        out.append(')')
        return ty
    else:
        out.append('{ x: ')
        check(ty, env, subs[0][1], out, 'ベクトルの要素は数値です')
        out.append(', y: ')
        check(ty, env, subs[1][1], out, 'ベクトルの要素は数値です')
        out.append('}')
        return ts.Vec


def Data(env, t, out):
    out.append('{')
    for _, sub in t:
        conv(env, sub, out)
        out.append(',')
    out.append('}')
    return ts.Object


def KeyValue(env, t, out):
    conv(env, t['name'], out)
    out.append(': ')
    conv(env, t['value'], out)
    return ts.Void


OPS = {
    '+': 'Add', '＋': 'Add',
    '-': 'Sub', 'ー': 'Sub',
    '*': 'Mul', '＊': 'Mul', '×': 'Mul',
    '**': 'Pow', '＊＊': 'Pow', '*＊': 'Pow', '＊*': 'Pow',
    '/': 'Div', '／': 'Div', '÷': 'Div',
    '//': 'TrueDiv', '／／': 'TrueDiv', '／/': 'TrueDiv', '/／': 'TrueDiv',
    '%': 'Mod', '％': 'Mod',
    '<': 'Lt', '＜': 'Lt',
    '<=': 'Lte', '＜＝': 'Lte', '<＝': 'Lte', '＜=': 'Lte',
    '>': 'Gt', '＞': 'Gt',
    '>=': 'Gte', '＞＝': 'Gte', '>＝': 'Gte', '＞=': 'Gte',
    '==': 'Eq', '＝＝': 'Eq', '=＝': 'Eq', '＝=': 'Eq',
    '!=': 'Ne', '！＝': 'Ne', '!＝': 'Ne', '！=': 'Ne',
    'in': 'In', '∈': 'In',
}

OPSFMT = {
    'Add': '({}+{})',
    'Sub': '({}-{})',
    'Mul': 'puppy.anyMul({},{})',
    'Div': '({}/{})',
    'TrueDiv': '(({}/{})|0)',
    'Mod': '({}%{})',
    'Eq': '{}==={}',
    'Ne': '{}!=={}',
    'Lt': '{}<{}',
    'Lte': '{}<={}',
    'Gt': '{}>{}',
    'Gte': '{}>={}',
    'In': 'puppy.anyIn({}, {})',

    'numberMul': '({}*{})',
    'listAdd': '({}).concat({})',
    'numberPow': 'Math.pow({},{})',
    'objectEq': '({}).id === ({}).id',
    'objectNe': '({}).id !== ({}).id',
}


def Infix(env, t, out):
    op = t['name'].asString()
    if op in OPS:
        op = OPS[op]
    else:
        perror(env, t['name'], f'{op}？ 未対応の演算子です。')
        return emitUndefined(env, t['name'], out)
    out1 = []
    out2 = []
    ty1 = check(ts.binaryFirst(op), env, t['left'], out1)
    ty2 = check(ts.binarySecond(op, ty1), env, t['right'], out2)
    left,  right = ''.join(out1), ''.join(out2)
    ty = ts.typeBinary(env, t['op'], op, ty1, ty2, perror)
    key = ts.typeKey(ty1, op)
    if key in OPSFMT:
        out.append(OPSFMT[key].format(left, right))
    else:
        out.append(OPSFMT[op].format(left, right))
    return ty


OPS1 = {
    '+': '+', '＋': '+',
    '-': '-', 'ー': '-',
    '!': '!', 'not': '!',
}


def Unary(env, t, out):
    op = t['name'].asString()
    if op in OPS1:
        op = OPS1[op]
    else:
        perror(env, t['name'], f'{op}？ 未対応の演算子です。')
        return emitUndefined(env, t['name'], out)
    out.append(f'{op}(')
    ty = check(ts.unaryPrefix(op), env, t['expr'], out)
    out.append(')')
    return ty


IMPORT_MATH = {
    'pi': Symbol('3.14159', const, ts.Float),
    'sin': Symbol('Math.sin', const, ts.MathFuncType),
    'cos': Symbol('Math.cos', const, ts.MathFuncType),
    'tan': Symbol('Math.tan', const, ts.MathFuncType),
    'sqrt': Symbol('Math.sqrt', const, ts.MathFuncType),
    'log': Symbol('Math.log', const, ts.MathFuncType),
    'log10': Symbol('Math.log10', const, ts.MathFuncType),

    'pow': Symbol('Math.pow', const, ts.Math2FuncType),
    'hypot': Symbol('Math.hypot', const, ts.Math2FuncType),
    'gcd': Symbol('puppy.gcd', const, ts.Math2FuncType),
}

BUILDIN = {
    'math.': IMPORT_MATH,
    'print': Symbol('puppy.print', const, (ts.Void, 'any', ts.EmptyOption)),
    # 返値, 引数.. None はなんでもいい
    'len': Symbol('puppy.len', const, (ts.Int, 'list|str')),
    # 可変長引数
    'range': Symbol('puppy.range', const, (ts.ListInt, ts.Int, ts.Int_, ts.Int_)),
    # append
    '.append': Symbol('puppy.append', const, (ts.Void, ts.ListA, ts.A)),
    # クラス
    '.setPosition': Symbol('puppy.setPosition', const, (ts.Void, ts.Matter, ts.Int, ts.Int)),
    'World': Symbol('world', const, ts.MatterTypes),
    'Circle': Symbol('Circle', const, ts.MatterTypes),
    'Rectangle': Symbol('Rectangle', const, ts.MatterTypes),
    'Polygon': Symbol('Polygon', const, ts.MatterTypes),
    'Ball': Symbol('Circle', const, (ts.Matter, ts.Int, ts.Int, {'restitution': 1.0})),
    'Block': Symbol('Rectangle', const, (ts.Matter, ts.Int, ts.Int, {'isStatic': 'true'})),
}


def Name(env, t, out):
    name = t.asString()
    if name in env:
        var = env[name]
        out.append(var.target)
        return var.types
    else:
        out.append(name)
        perror(env, t, f'変数名 {name} は一度も定義されていません')
        return ts.Type()


def VarDecl(env, t, out):
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
            newvar = localName(name)
            out.append(f'var {newvar}')
        elif '@class' in env:
            newvar = localName(name)
            out.append(newvar)
        else:
            newvar = globalName(name)
            out.append(newvar)
    else:
        ty = conv(env, t['left'], out)
    out.append(' = ')
    # 左辺値から型推論する
    if ty is None:
        ty = ts.Type()
    ty = check(ty, env, t['right'], out)
    if newvar != None:
        env[name] = Symbol(newvar, mutable, ty)
    return ts.Void


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
    'width': ts.Int,
    'height': ts.Int,
    'image': ts.String,
    'strokeStyle': ts.String,
    'lineWidth': ts.Int,
    'fillStyle': ts.String,
    'restitution': ts.Float,  # float と int は同じ
    'angle': ts.Float,
    'friction': ts.Float,
    'frictionStatic': ts.Float,
    'airFriction': ts.Float,
    'torque': ts.Float,
    'stiffness': ts.Float,
    'isSensor': ts.Bool,
    'damping': ts.Float,
    'font': ts.String,
    'fontColor': ts.String,
    'clicked': (ts.Void, ts.Matter),
    'move': (ts.Void, ts.Matter, ts.Int),
}


def GetExpr(env, t, out):
    name = t['name'].asString()
    pkgname = t['recv'].asString() + '.'
    if pkgname in env:  # math.pi のような定数
        penv = env[pkgname]
        if name in penv:
            vari = penv[name]
            out.append(vari.target)
            return vari.types
        else:
            perror(env, t['name'], f'{pkgname}{name}？ タイプミスしてませんか？')
            out.append('undefined')
            return ts.Type()
    check(ts.Matter, env, t['recv'], out)
    out.append('.')
    if not name in KEYWORDS:
        pwarn(env, t['name'], f'{name}？ タイプミスしてませんか？')
        out.append(name)
        return ts.Type()
    else:
        name = KEYWORDS[name]
        out.append(name)
        return KEYWORDTYPES[name]


def IndexExpr(env, t, out):
    ty = check('list|str', env, t['recv'], out)
    out.append('[')
    check(ts.Int, env, t['index'], out)
    out.append(']')
    return ts.typeOfSeq(ty)


def MethodExpr(env, t, out):
    name = t['name'].asString()
    pkgname = t['recv'].asString() + '.'
    if pkgname in env:
        penv = env[pkgname]
        if name in penv:
            vari = penv[name]
            name = vari.target
            types = vari.types
            out.append(name)
            out.append('(')
            args = [name] + [y for x, y in t['params'].subs()]
            emitArguments(env, t['name'], args, types, '', out)
            return types[0]
        else:
            perror(env, t['name'], f'{pkgname}{name}？ タイプミスしていませんか？')
            out.append('null')
            return None
    methodname = '.' + name
    if methodname in env:
        vari = env[methodname]
        types = vari.types
        out.append(vari.target)
        out.append('(')
        args = [name, t['recv']] + [y for x, y in t['params'].subs()]
        emitArguments(env, t['name'], args, types, '', out)
        return types[0]
    else:
        perror(env, t['name'], f'本当にメソッド名 {name} が正しいか確認してください')
        out.append('null')
        return None


def ApplyExpr(env, t, out):
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

    if ts.isMatterFunc(types):
        outter = pushenv(env, '@funcname', name)
        out.append(f'puppy.newMatter(new puppy.vars["{name}"](')
        args = [y for x, y in t.subs()]
        emitArguments(env, t['name'], args, types, '', out)
        out.append(')')
        env['@yield'] = trace(env, t)
        env['@oid'] += 1
        popenv(env, '@funcname', outter)
    else:
        out.append(name)
        out.append('(')
        args = [y for x, y in t.subs()]
        emitArguments(env, t['name'], args, types, '', out)
        if name == 'puppy.print':
            env['@yield'] = trace(env, t)
            env['@oid'] += 1
    return types[0]


def guess_Matter(env, name, t):
    return ('Circle', ts.MatterTypes)


def scope(env, key, val, f):
    outer = pushenv(env, key, val)
    res = f()
    popenv(env, key, outer)
    return res


def emitArguments(env, t, args, types, prev, out):
    tidx = 1
    kargs = None
    options = None
    types = ts.unique(types)
    while tidx < len(types):
        if ts.isOption(types[tidx]):
            kargs = args[tidx:]
            options = types[tidx]
            break
        if tidx < len(args):
            out.append(prev)
            check(types[tidx], env, args[tidx], out)
            tidx += 1
            prev = ','
        else:
            if not ts.isOmittable(types[tidx]):
                perror(env, t, f'必要な引数が足りません')
            out.append(')')
            return
    if kargs != None:
        out.append(prev)
        out.append('{')
        used_keys = {}
        for sub in kargs:
            if sub.tag == 'KeywordArgument':
                KeywordArgument(env, sub, out, used_keys)
            elif sub.tag == 'NLPSymbol':
                NLPSymbol(env, sub, out, used_keys)
            else:
                pwarn(env, sub, 'この引数は使われません')
        for k in types[tidx]:
            if k not in used_keys:
                out.append(f"'{k}': {options[k]},")
        out.append(f"'trace': {trace(env, t)},")
        out.append(f"'oid': {env['@oid']},")
        out.append('}')
    out.append(')')


def KeywordArgument(env, t, out, used_keys=None):
    if used_keys is None:
        pwarn(env, t, 'キーワード引数は物体のオプションのみ使えます')
        return conv(env, t['value'], out)
    name = t['name'].asString()
    if not name in KEYWORDS:
        pwarn(env, t['name'], f'{name}？ タイプミスしてませんか？')
    else:
        if name != KEYWORDS[name]:
            pinfo(env, t, f'{name} => {KEYWORDS[name]}')
        name = KEYWORDS[name]
    out2 = []
    scope(env, '@key', name, lambda: check(
        KEYWORDTYPES.get(name, 'any'), env, t['value'], out2))
    value = ''.join(out2)
    emitOption(env, t['name'], name, value, out, used_keys)
    return ts.Void


def emitOption(env, t, key, value, out, used_keys):
    if key in used_keys:
        pwarn(env, t, f'{key}は重複！！．こちらは無視することにします')
        return
    used_keys[key] = key
    out.append("'" + key + "': " + value + ',')
    addLives(env, key, value, trace(env, t))


def NLPSymbol(env, t, out, used_keys=None):
    phrase = t.asString()
    if '@funcname' in env:
        k = env.get('@key', '')
        k, v = nobuKeyVal(env['@funcname'], k, phrase)
        out.append(f"'{k}': {v},")
        options = env.get('@options', ts.EmptyOption)
        if k in options:
            del options[k]
        return ts.Void
    v = nlpExpr(env.get('@target', ''), phrase)
    out.append(v)


def nobuKeyVal(funcname, key='unknown', phrase='"?"'):
    return (key, phrase)


def nlpExpr(varname, phrase='"?"'):
    return phrase


def IfStmt(env, t, out):
    out.append('if (')
    check(ts.Bool, env, t['cond'], out)
    out.append(') ')
    conv(env, t['then'], out)
    if 'else' in t:
        out.append('else ')
        conv(env, t['else'], out)
    return ts.Void


def ForStmt(env, t, out):
    if(t['each'].tag == 'Name'):
        name = t['each'].asString()
    else:
        perror(env, t['each'], '変数名が欲しいところです')
        return ts.Void
    out.append(f'for (let {name} of ')
    ty = check(ts.Type('list[__]'), env,
               t['list'], out, msg='ここはリストでなければなりません')
    out.append(')')
    ty = ts.typeOfSeq(ty)
    outer = pushenv(env, name, Symbol(localName(name), True, ty))
    outer2 = pushenv(env, '@inloop', True)
    conv(env, t['body'], out)
    popenv(env, name, outer)
    popenv(env, '@inloop', outer2)
    return ts.Void


INDENT = '\t'


def Block(env, t, out):
    out.append('{\n')
    indent = env['@indent']
    nested = INDENT + indent
    pushenv(env, '@indent', nested)
    for _, subtree in t:
        out.append(nested)
        conv(env, subtree, out)
        emitAutoYield(env, out)
    popenv(env, '@indent', indent)
    out.append(indent + '}\n')
    return ts.Void


def emitUndefined(env, t, out):
    out.append('undefined')
    return ts.Type()


func = globals()


def conv(env, t, out):
    if t.tag in func:
        return func[t.tag](env, t, out)
    else:
        perror(env, t, f'未実装のコード{t.tag}です。')
        print('@Debug[conv]', t.asString(), t)
        out.append('undefined')
        return ts.Type()


# World
WORLD = {
    'width': '1000',
    'height': '1000',
    'mouse':  'true',
    'background':  "'white'",
}


def static_value(env, t):
    out = []
    conv(env, t, out)
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


def check(ret, env, t, out, msg=None):
    vat = conv(env, t, out)
    if ret is None or vat is None:
        print('@DEBUG[check]', t.asString(), ret, vat)
        return vat
    if not ts.matchType(ret, vat):
        print('@TypeError', ts.strType(ret), ts.strType(vat))
        if msg != None:
            perror(env, t, msg)
        else:
            val = t.asString()
            perror(env, t, f'型エラー: {val}のところは{ts.msg(ret)}')
            #raise StopIteration()
    return vat


def perror(env, t, msg):
    _, pos, raw, col = t.pos()
    env['@logs'].append(('error', pos, raw, col, msg))


def pwarn(env, t, msg):
    _, pos, raw, col = t.pos()
    env['@logs'].append(('warning', pos, raw, col, msg))


def pinfo(env, t, msg):
    _, pos, raw, col = t.pos()
    env['@logs'].append(('information', pos, raw, col, msg))


def trace(env, t):
    lines = env['@lines']
    linenum = t.pos()[2]
    if not linenum in lines:
        lines.append(linenum)
    return f'puppy.lines[{lines.index(linenum)}]'


def transpile(s, errors=[]):
    t = parser(s)
    # STDLOG.dump(t)  # debug
    env = BUILDIN.copy()
    env['@logs'] = errors
    env['@lines'] = []
    env['@lives'] = []
    env['@indent'] = ''
    if t.tag == 'err':
        env['@world'] = {}
        perror(env, t, '構文エラーです. 文法通り書けているか確認しましょう')
        return env, ''
    # start transpile
    env['@world'] = WORLD.copy()
    env['@oid'] = 1
    out = []
    conv(env, t, out)
    return env, ''.join(out)

# Live


prev_lives = []
prev_code = ''


def hasErrors(env):
    for e in env['@logs']:
        if e[0] == 'error':
            return True
    return False


def diffCode(prev, cur):
    prev = prev.split('\n')
    cur = cur.split('\n')
    plen, clen = len(prev), len(cur)
    start, end = 0, clen
    for i in range(min(plen, clen)):
        start = i
        if prev[i] != cur[i]:
            break
    prev, cur = prev[::-1], cur[::-1]
    for i in range(min(plen, clen)):
        end = i
        if prev[i] != cur[i]:
            break
    end = clen - end
    prev, cur = prev[::-1], cur[::-1]
    print('@diff', start, end, clen)
    #print('@diff', cur[start:end])
    nstart, nend = start, end
    for nstart in range(start, -1, -1):
        if not cur[nstart].startswith('\t'):
            break
    for nend in range(end, clen, 1):
        if not cur[nend-1].startswith('\t'):
            break
    print('@diff', nstart, nend, clen)
    diffcode = '\n'.join(cur[nstart:end])
    print('@diffcode\n', diffcode)
    return ''  # diffcode


def addLives(env, key, value, _trace):
    env['@lives'].append((env['@oid'], key, value, _trace))


def diffLives(prev, cur):
    pdb = {(t[0], t[1]): t for t in prev}
    lives = []
    for c in cur:
        key = (c[0], c[1])
        if key in pdb:
            p = pdb[key]
            if p[2] != c[2]:
                lives.append(f'\t[{c[0]}, "{c[1]}", {c[2]}, {p[2]}],\n')
        else:
            lives.append(f'\t[{c[0]}, "{c[1]}", {c[2]}, null],\n')
    if len(lives) > 1:
        print('@lives', lives)
        lives = []
    return lives


def puppyVMCode(env, main, diffcode, lives):
    W = env['@world']
    world = [f"     '{k}': {W[k]}," for k in W]
    world = '\n'.join(world)
    error = []
    for e in env['@logs']:
        row = e[2]-2 if e[3] == -1 else e[2]-1
        error.append(f'''
        {{
            'type': '{e[0]}',
            'row': {row},
            'text': {repr(e[4])}
        }},''')
    error = '\n'.join(error)
    lines = ','.join(map(str, env['@lines']))
    lives = ''.join(lives)
    if diffcode != '':
        diffcode = f'  update: function(Matter,puppy){{\n{diffcode}\n  }},'
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
{diffcode}
  main: function*(Matter,puppy){{
{main}
  }},
  lines: [{lines}],
  errors: [
{error}
  ]
}}
'''


def makeCode(s, errors=[]):
    global prev_code, prev_lives
    env, code = transpile(s, errors)
    diffcode, lives = '', []
    if not hasErrors(env):
        diffcode = diffCode(prev_code, code)
        lives = diffLives(prev_lives, env['@lives'])
        prev_code = code
        prev_lives = env['@lives']
    return puppyVMCode(env, code, diffcode, lives)

# test


# main スクリプト


if __name__ == "__main__":
    source = '''range(1,2,3**2).append(1+2)\n'''
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            source = f.read()
    code = makeCode(source)


__package__ = 'puppy'
