import sys
from collections import namedtuple
from pegpy.tpeg import grammar, generate, STDLOG
import hashlib
import puppytypes as ts
import nobuai as nlp

peg = grammar('puppy2.tpeg')
parser = generate(peg)

const = True
mutable = False
Symbol = namedtuple('Symbol', 'target local types')


class Env(object):
    __slots__ = ['env', 'stacks']

    def __init__(self, env):
        self.env = env.env if isinstance(env, Env) else env
        self.stacks = []

    def __enter__(self):
        return self

    def __getitem__(self, key):
        return self.env[key] if key in self.env else None

    def __setitem__(self, key, value):
        if not key.startswith('@@'):
            self.stacks.append((key, self.env.get(key, None)))
        self.env[key] = value

    def set(self, key, value):
        self.env[key] = value

    def __delitem__(self, key):
        del self.env[key]

    def __contains__(self, key):
        return key in self.env

    def __exit__(self, ex_type, ex_value, trace):
        #print("exit: ", ex_type, ex_value, trace)
        for stack in self.stacks:
            key, value = stack
            if value is None:
                del self.env[key]
            else:
                self.env[key] = value

def Source(env: Env, t, out):
    for _, subtree in t:
        out.append(env['@indent'])
        conv(env, subtree, out)
        emitAutoYield(env, out)
    return ts.Void


def emitAutoYield(env: Env, out):
    if '@@yield' in env and '@local' not in env:
        out.append(f"; yield {env['@@yield']};\n")
        del env['@@yield']
    else:
        out.append('\n')


def ClassDecl(env: Env, t, out):
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


def switchName(env: Env, name):
    return localName(name) if '@local' in env else globalName(name)


def globalName(name):
    return f"puppy.vars['{name}']"


def isGlobalName(name):
    return name.startwith('puppy.vars[')


def emitDeclName(env: Env, name, out):
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


def FuncDecl(env: Env, t, out):
    name = t['name'].asString()
    jsname = emitDeclName(env, name, out)
    with Env(env) as lenv:
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
        lenv['@local'] = types[0]  # return type
        env[name] = Symbol(jsname, mutable, tuple(types))
        conv(lenv, t['body'], out)
        if voidCheck == str(types[0]):
            types[0] = ts.Void
    return ts.Void


def Return(env: Env, t, out):
    if '@local' not in env:
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


def FuncExpr(env: Env, t, out):
    with Env(env) as lenv:
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


def Yield(env: Env, t, out):
    if '@local' in env:
        pwarn(env, t, '関数内で yield 文は使えません')
        return
    out.append(f'yield {t.pos()[2]}')
    return ts.Void


def Continue(env: Env, t, out):
    if '@inloop' in env:
        pwarn(env, t, 'continue は、for文内でのみ使えます')
        return
    out.append('continue')
    return ts.Void


def Break(env: Env, t, out):
    if '@inloop' in env:
        pwarn(env, t, 'break は、for文内でのみ使えます')
        return
    out.append('break')
    return ts.Void


def Pass(env: Env, t, out):
    return ts.Void


def TrueExpr(env: Env, t, out):
    out.append("true")
    return ts.Bool


def FalseExpr(env: Env, t, out):
    out.append('false')
    return ts.Bool


def Int(env: Env, t, out):
    out.append(t.asString())
    return ts.Int


def Double(env: Env, t, out):
    out.append(t.asString())
    return ts.Float


def String(env: Env, t, out):
    v = t.asString()[1:-1]
    out.append(repr(v))
    return ts.String


def Char(env: Env, t, out):
    v = t.asString()[1:-1]
    out.append(repr(v))
    return ts.String


def List(env: Env, t, out):
    ty = ts.Type()
    out.append('[')
    for _, sub in t:
        ty = check(ty, env, sub, out, '全ての要素を同じ型に揃えてください')
        out.append(',')
    out.append(']')
    return ts.Type(f'list[{ty}]')


def Tuple(env: Env, t, out):
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


def Data(env: Env, t, out):
    out.append('{')
    for _, sub in t:
        conv(env, sub, out)
        out.append(',')
    out.append('}')
    return ts.Object


def KeyValue(env: Env, t, out):
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


def Infix(env: Env, t, out):
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


def Unary(env: Env, t, out):
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

IMPORT_RANDOM = {
    'random': Symbol('Math.random', const, (ts.Int,)),
}

BUILDIN = {
    'math.': IMPORT_MATH,
    'random.': IMPORT_RANDOM,
    'input': Symbol('await puppy.input', const, (ts.String, ts.String_)),
    'print': Symbol('puppy.print', const, (ts.Void, 'any', ts.EmptyOption)),

    # 返値, 引数.. None はなんでもいい
    'len': Symbol('puppy.len', const, (ts.Int, 'list|str')),
    # 可変長引数
    'range': Symbol('puppy.range', const, (ts.ListInt, ts.Int, ts.Int_, ts.Int_)),
    # append
    '.append': Symbol('puppy.append', const, (ts.Void, ts.ListA, ts.A)),

    # random
    'int': Symbol('puppy.int', const, (ts.Int, 'bool|number|str')),
    'float': Symbol('puppy.float', const, (ts.Float, 'bool|number|str')),
    'str': Symbol('puppy.str', const, (ts.String, 'any')),
    'random': Symbol('Math.random', const, (ts.Int,)),

    # 物体メソッド
    '.setPosition': Symbol('puppy.setPosition', const, (ts.Void, ts.Matter, ts.Int, ts.Int)),
    '.applyForce': Symbol('puppy.applyForce', const, (ts.Void, ts.Matter, ts.Int, ts.Int, ts.Int, ts.Int)),
    '.rotate': Symbol('puppy.rotate', const, (ts.Void, ts.Matter, ts.Int, ts.Int_, ts.Int_)),
    '.scale': Symbol('puppy.scale', const, (ts.Void, ts.Matter, ts.Int, ts.Int, ts.Int_, ts.Int_)),
    '.setAngle': Symbol('puppy.setAngle', const, (ts.Void, ts.Matter, ts.Int)),
    '.setAngularVelocity': Symbol('puppy.setAngularVelocity', const, (ts.Void, ts.Matter, ts.Int)),
    '.setDensity': Symbol('puppy.setDensity', const, (ts.Void, ts.Matter, ts.Int)),
    '.setMass': Symbol('puppy.setMass', const, (ts.Void, ts.Matter, ts.Int)),
    '.setStatic': Symbol('puppy.setStatic', const, (ts.Void, ts.Matter, ts.Bool)),
    '.setVelocity': Symbol('puppy.setVelocity', const, (ts.Void, ts.Matter, ts.Int)),

    # クラス
    'World': Symbol('world', const, ts.MatterTypes),
    'Circle': Symbol('Circle', const, ts.MatterTypes),
    'Rectangle': Symbol('Rectangle', const, ts.MatterTypes),
    'Polygon': Symbol('Polygon', const, ts.MatterTypes),
    'Label': Symbol('Label', const, ts.MatterTypes),
    'Drop': Symbol('Drop', const, ts.MatterTypes),
    'Newton': Symbol('Pendulum', const, ts.MatterTypes),
    'Ball': Symbol('Circle', const, (ts.Matter, ts.Int, ts.Int, {'restitution': 1.0})),
    'Block': Symbol('Rectangle', const, (ts.Matter, ts.Int, ts.Int, {'isStatic': 'true'})),
}


def Name(env: Env, t, out):
    name = t.asString()
    if name in env:
        var = env[name]
        out.append(var.target)
        return var.types
    else:
        out.append(name)
        perror(env, t, f'変数名 {name} は一度も定義されていません')
        return ts.Type()


def VarDecl(env: Env, t, out):
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
    'x': 'position.x', 'y': 'position.y',
    'width': 'width',
    'height': 'height',
    'restitution': 'restitution',
    'angle': 'angle', 'inertia': 'inertia',
    'mass': 'mass', 'density': 'density', 'area': 'area',
    'friction': 'friction', 'frictionStatic': 'frictionStatic',
    'airFriction': 'airFriction',
    'torque': 'torque',
    'stiffness': 'stiffness',
    'damping': 'damping',
    'isStatic': 'isStatic',
    'isSensor': 'isSensor',
    'clicked': 'clicked',
    'move': 'move',
    'opacity': 'opacity', 'alpha': 'opacity',
    'image': 'image', 'texture': 'image',
    'strokeStyle': 'strokeStyle',
    'lineWidth': 'lineWidth',
    'fillStyle': 'fillStyle', 'color': 'fillStyle',

    'font': 'font',
    'fontColor': 'fontColor',
    'textAlign': 'textAlign',
    'value': 'value',
    'capture': 'capture',

    # 日本語名
    '名前': 'name',
    '幅': 'width', '横幅': 'width', '横': 'width',
    '高さ': 'height', '縦': 'height',
    '傾き': 'angle',
    '質量': 'mass', '密度': 'density', '管制': 'inertia',
    '体積': 'area', '容積': 'area', '面積': 'area',
    '摩擦係数': 'friction', '静止摩擦係数': 'frictionStatic',
    '空気摩擦係数': 'airFriction',
    '摩擦': 'friction', '静止摩擦': 'frictionStatic', '空気摩擦': 'airFriction',
    '反発係数': 'restitution', '跳ね返り係数': 'restitution', 'はねかえり係数': 'restitution',
    '回転力': "torque", 'トルク': "torque",
    '剛性': 'stiffness', 'ばね定数': 'stiffness',
    'センサー': 'isSensor',
    '減衰': 'damping',
    'フォント': 'font',
    'フォント色': 'fontColor',
}

KEYWORDTYPES = {
    'width': ts.Int, 'height': ts.Int,
    'x': ts.Int, 'y': ts.Int,
    'image': ts.String,
    'strokeStyle': 'number|str',
    'lineWidth': ts.Int,
    'fillStyle': 'number|str',
    'restitution': ts.Float,  # float と int は同じ
    'angle': ts.Float,
    'position': ts.Matter,
    'mass': ts.Int, 'density': ts.Int, 'area': ts.Int,
    'friction': ts.Float, 'frictionStatic': ts.Float, 'airFriction': ts.Float,
    'torque': ts.Float, 'stiffness': ts.Float,
    'isSensor': ts.Bool,
    'isStatic': ts.Bool,
    'damping': ts.Float,
    'in': (ts.Void, ts.Matter, ts.Matter),
    'out': (ts.Void, ts.Matter, ts.Matter),
    'over': (ts.Void, ts.Matter, ts.Matter),
    'clicked': (ts.Void, ts.Matter),
    'move': (ts.Void, ts.Matter, ts.Int),
    'font': ts.String,
    'fontColor': 'number|str',
    'textAlign': ts.String,
    'value': 'bool|number|str',
    'capture': ('bool|number|str'),
}


def GetExpr(env: Env, t, out):
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
        return ts.newType(KEYWORDTYPES[name])


def IndexExpr(env: Env, t, out):
    ty = check('list|str', env, t['recv'], out)
    out.append('[')
    check(ts.Int, env, t['index'], out)
    out.append(']')
    return ts.typeOfSeq(ty)


def MethodExpr(env: Env, t, out):
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


def ApplyExpr(env: Env, t, out):
    name = t['name'].asString()
    if name in env:
        vari = env[name]
        name = vari.target
        types = vari.types
        if name == 'world':
            set_World(env, t, types[-1])
            return ts.Matter
    elif t['name'].tag == 'NLPSymbol':
        name, types = checkNLPMatter(env, name, t)
    else:
        perror(env, t['name'], f'タイプミス？ {name} 未定義な関数名です')
        return ts.Type()  # To avoid error

    if ts.isMatterFunc(types):
        with Env(env) as env:
            out.append(f'puppy.new_(puppy.vars["{name}"],')
            args = [y for x, y in t.subs()]
            emitArguments(env, t['name'], args, types, '', out)
            env['@@yield'] = trace(env, t)
            env['@@oid'] += 1
    else:
        out.append(name)
        out.append('(')
        args = [y for x, y in t.subs()]
        emitArguments(env, t['name'], args, types, '', out)
        if name == 'puppy.print':
            env['@@yield'] = trace(env, t)
            env['@@oid'] += 1
    return types[0]


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
                emitOption(env, t, k, options[k], out, used_keys)
        out.append(f"'trace': {trace(env, t)},")
        out.append(f"'oid': {env['@@oid']},")
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
    with Env(env) as env:
        env['@target'] = name
        if emitKey(env, t['name'], name, out, used_keys):
            conv(env, t['value'], out)
            out.append(',')
    return ts.Void

def checkNLPMatter(env, name, t):
    option = nlp.conv2(name, lambda x: pinfo(env, t, x))
    if not 'shape' in option:
        pwarn(env, t, 'はっきりと物体の形状を指定してください')
        option['shape'] = 'Circle'
        option['value'] = name
        option['font'] = '36px'
    return (option['shape'], (ts.Matter, ts.Int, ts.Int, option))

def NLPSymbol(env, t, out, used_keys=None):
    phrase = t.asString()
    if '@target' in env:
        option = nlp.conv2(f"{env['@target']}は{phrase}",
                           lambda x: pinfo(env, t, x))
        if len(option) == 1:
            val = option[option.keys()[0]]
            pinfo(env, t, f'{phrase}は{repr(val)}')
            return emitValue(env, val, out)
        else:
            pwarn(env, t, f'「{phrase}」は解釈できません')
            return emitUndefined(env, t, out)
    else:
        option = nlp.conv2(phrase, lambda x: pinfo(env, t, x))
        if len(option) == 0:
            pwarn(env, t, f'「{phrase}」は解釈できません')
            return ts.Void
        else:
            for key in option:
                emitOption(env, t, key, option[key], out, used_keys)
        return ts.Void

def emitKey(env, t, key, out, used_keys):
    key = KEYWORDS[key] if key in KEYWORDS else key
    if key in used_keys:
        pwarn(env, t, f'{key}の重複！！．こちらは無視します')
        return False
    used_keys[key] = key
    out.append("'" + key + "': ")
    return True

def emitOption(env, t, key, value, out, used_keys):
    if emitKey(env, t, key, out, used_keys):
        emitValue(env, value, out)
        out.append(',')

def emitValue(env, val, out):
    if isinstance(val, str):
        if (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
            out.append(val)
        else:
            out.append(repr(val))
        return ts.String
    if isinstance(val, bool):
        out.append('true' if val else 'false')
        return ts.Bool
    out.append(str(val))
    return ts.Int


def IfStmt(env: Env, t, out):
    out.append('if (')
    check(ts.Bool, env, t['cond'], out)
    out.append(') ')
    conv(env, t['then'], out)
    if 'else' in t:
        out.append('else ')
        conv(env, t['else'], out)
    return ts.Void


def ForStmt(env: Env, t, out):
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
    with Env(env) as env:
        env[name] = Symbol(localName(name), True, ty)
        env['inloop'] = True
        conv(env, t['body'], out)
    return ts.Void


INDENT = '\t'


def Block(env: Env, t, out):
    out.append('{\n')
    indent = env['@indent']
    nested = INDENT + indent
    with Env(env) as env:
        env['@indent'] = nested
        for _, subtree in t:
            out.append(nested)
            conv(env, subtree, out)
            emitAutoYield(env, out)
        out.append(indent + '}\n')
    return ts.Void


def emitUndefined(env: Env, t, out):
    out.append('undefined')
    return ts.Type()


func = globals()


def conv(env: Env, t, out):
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
    W = env['@@world']
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
    env['@@logs'].append(('error', pos, raw, col, msg))


def pwarn(env, t, msg):
    _, pos, raw, col = t.pos()
    env['@@logs'].append(('warning', pos, raw, col, msg))


def pinfo(env, t, msg):
    _, pos, raw, col = t.pos()
    env['@@logs'].append(('info', pos, raw, col, msg))


def trace(env, t):
    lines = env['@@lines']
    linenum = t.pos()[2]
    if not linenum in lines:
        lines.append(linenum)
    return f'puppy.ln({lines.index(linenum)})'


def transpile(s, errors=[]):
    t = parser(s)
    # STDLOG.dump(t)  # debug
    env = Env(BUILDIN.copy())
    env['@@logs'] = errors
    env['@@lines'] = []
    env['@@lives'] = []
    env['@indent'] = ''
    if t.tag == 'err':
        env['@@world'] = {}
        perror(env, t, '構文エラーです. 文法通り書けているか確認しましょう')
        return env, ''
    # start transpile
    env['@@world'] = WORLD.copy()
    env['@@oid'] = 1
    out = []
    conv(env, t, out)
    return env, ''.join(out)

# Live


prev_lives = []
prev_code = ''


def hasErrors(env):
    for e in env['@@logs']:
        if e[0] == 'error':
            return True
    return False


def diffCode(prev, cur):
    prev = prev.split('\n')
    cur = cur.split('\n')
    plen, clen = len(prev)-1, len(cur)-1  # 最後は空行
    print('@diff1', plen, clen)
    if plen >= clen:
        return ''
    print('@prev', prev)
    print('@cur', cur)
    for i in range(plen):
        if prev[i] != cur[i]:
            print('@', i, '\n', prev[i], '\n', cur[i])
            return ''
    nstart, nend = plen, clen
    print('@diff2', nstart, nend)
    for nstart in range(plen, -1, -1):
        if not cur[nstart].startswith('\t'):
            break
    print('@diff3', nstart, nend)
    diffcode = '\n'.join(cur[nstart:nend])
    diffcode = diffcode.replace('; yield', '; //yield')
    print('@diffcode', diffcode)
    return diffcode


def addLives(env, key, value, _trace):
    env['@@lives'].append((env['@@oid'], key, value, _trace))


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
    print('@@lives', lives)
    if len(lives) > 1:
        lives = []
    return lives


def puppyVMCode(env, main, diffcode, lives):
    W = env['@@world']
    world = [f"     '{k}': {W[k]}," for k in W]
    world = '\n'.join(world)
    error = []
    for e in env['@@logs']:
        row = e[2]-2 if e[3] == -1 else e[2]-1
        error.append(f'''
        {{
            'type': '{e[0]}',
            'row': {row},
            'text': {repr(e[4])}
        }},''')
    error = '\n'.join(error)
    lines = ','.join(map(str, env['@@lines']))
    lives = ''.join(lives)
    if diffcode != '':
        diffcode = f'  diff: function(puppy){{\n{diffcode}\n  }},'
    codehash = hashlib.sha256(world.encode() + main.encode()).hexdigest()
    return f'''
return {{
  hash: '{codehash}',
  world: {{
{world}
  }},
  bodies: [],
  lives: [
{lives}
  ],
{diffcode}
  main: async function*(puppy){{
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
    ''' disable live 
    if not hasErrors(env):
        diffcode = diffCode(prev_code, code)
        lives = diffLives(prev_lives, env['@@lives'])
        prev_code = code
        prev_lives = env['@@lives']
    '''
    code = puppyVMCode(env, code, diffcode, lives)
    print(code)
    return code

# test


# main スクリプト


if __name__ == "__main__":
    source = '''ガム(500,500,ぴょん,色は緑)\n'''
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            source = f.read()
    code = makeCode(source)


__package__ = 'puppy'
