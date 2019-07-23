__package__ = 'puppytypes'

VARID = 0
VARS = {}


def initTypeVars():
    global VARS
    VARS = {}


def newTypeVar():
    global VARID
    VARID += 1
    return '_' + str(VARID)


def unique(t, a=newTypeVar(), b=newTypeVar()):
    if isinstance(t, tuple):
        return tuple([unique(x, a, b) for x in t])
    elif isinstance(t, dict) or isinstance(t, str):
        return t
    else:
        if '$a' in t.name or '$b' in t.name:
            return Type(t.name.replace('$a', a).replace('$b', a))
        return t


def setVarType(v, t):
    if t.startswith('_'):  # 両方とも型変数
        ts = {v, t}
        if v in VARS:
            ts |= VARS[v]
        if t in VARS:
            ts |= VARS[t]
        ts = tuple(ts)
        for x in ts:
            VARS[x] = ts
        return
    if v in VARS:
        for x in VARS[v]:
            VARS[x] = t
    else:
        VARS[v] = t


def matchVarType(pat, vat):
    if pat.startswith('_'):
        setVarType(pat, vat)
        return (pat, vat) if vat.startswith('_') else (pat, pat)
    if vat.startswith('_'):
        setVarType(vat, pat)
        return (pat, pat)
    if pat.startswith('list[') and vat.startswith('list['):
        res = matchVarType(pat[5:-1], vat[5:-1])
        if res is not None:
            return (f'list[{res[0]}]', f'list[{res[1]}]')
    return None


def strType(pat):
    if isinstance(pat, tuple) or isinstance(pat, list):
        return '(' + ','.join(map(strType, pat[1:])) + ')=>'+strType(pat[0])
    if isinstance(pat, Type):
        pat = pat.name
    if pat is None:
        return 'None(FIXME)'
    if pat.startswith('list['):
        return f'list[{strType(pat[5:-1])}]'
    if pat in VARS:
        ts = VARS[pat]
        if isinstance(ts, str):
            return ts
    return pat


class Type:
    __slots__ = ['name']

    def __init__(self, name='__'):
        self.name = name
        if '__' in name:
            self.name = name.replace('__', newTypeVar())

    def __str__(self):
        return strType(self.name)

    def __repr__(self):
        return strType(self.name)

    def __eq__(self, a):
        return self.__str__() == str(a)

    def match(self, given):
        pats, vat = str(self), str(given)
        if pats.endswith('?'):
            pats = pats[:-1]
        for pat in pats.split('|'):
            if pat == vat:
                return True
        res = matchVarType(pat, vat)
        if res is None:
            return False
        self.name = res[0]
        given.name = res[1]
        return True


def matchType(t, t2):
    if isinstance(t, str):
        if t == 'any':
            return True
        res = False
        for u in t.split('|'):
            u2 = str(t2)
            if u2.startswith(u):
                return True
            if '_' in u2:
                res = True
        return res
    if isinstance(t, Type) and isinstance(t2, Type):
        return t.match(t2)
    if isinstance(t, tuple) and isinstance(t2, tuple) and len(t) == len(t2):
        for p, p2 in zip(t, t2):
            if not matchType(p, p2):
                return False
        return True
    return False


Void = Type('void')
Vec = Type('vec')
Bool = Type('bool')
Bool_ = Type('bool?')
Int = Type('number')
Int_ = Type('number?')
Float = Int
Float_ = Int_
String = Type('str')
String_ = Type('str?')
Object = Type('object')
Matter = Type('object')
Matter_ = Type('object?')
ListInt = Type('list[number]')
#ListListMatter = Type('list[list[object]]')
ListA = Type('list[$a]')
A = Type('$a')
ListB = Type('list[$b]')
B = Type('$b')

'''
t = Type()
t2 = Type('list[number]')
print(t.match(ListInt), t)

f = unique((A, ListA, B))
print(f)
print(f[1].match(ListListMatter))
print(f[0].match(f[2]))
print(strType(f))
'''

EmptyOption = {}
MatterTypes = (Matter, Int, Int, EmptyOption)
MathFuncType = (Float, Float)  # Float->Float
Math2FuncType = (Float, Float, Float)  # (Float,Float)->Float


def isOption(ty):
    return isinstance(ty, dict)


def isFuncType(ty):
    return isinstance(ty, tuple) or isinstance(ty, list)


def isOmittable(ty):
    return isinstance(ty, Type) and ty.name.endswith('?')


def isMatterFunc(types):
    return len(types) == 4 and types[0] == Matter and types[1] == Int and types[2] == Int and isinstance(types[3], dict)


def typeOfSeq(ty):
    if isinstance(ty, Type) and ty == String:
        return String
    name = '__'
    if isinstance(ty, Type) and ty.name.startswith('list['):
        name = ty.name[5:-1]
    return Type(name)


def unaryPrefix(op):
    if op == '!':
        return Bool
    return Int


def binaryFirst(op):
    if op in 'Sub|TrueDiv|Mod|Pow':
        return Int
    if op in 'Lte|Gte':
        return 'number|str'
    if op in 'Add|Mul':
        return 'number|list|str'
    return 'any'


def binarySecond(op, ty):
    if op in 'Sub|Mul|TrueDiv|Mod|Pow':
        return Int
    if op in 'Add|Lte|Gte|Eq|Ne':
        return ty
    if op == 'In':
        return Type(f'list[{ty}]')
    return 'any'


def typeBinary(env, t, op, ty, ty2, perror):
    if op in 'Lte|Gte|Eq|Ne':
        if not matchType(ty, ty2):
            perror(env, t, f'{op}の両辺は同じ種類でなければなりません.')
        return Bool
    if op in 'Sub|Mul|TrueDiv|Mod|Pow':
        return Int
    if op in 'Add|Mul':
        return ty
    if op == 'In':
        return Bool
    return ty2


def isUntyped(ty):
    if not isinstance(ty, str):
        ty = strType(ty)
    return '_' in ty


def typeKey(ty, suffix=''):
    if isinstance(ty, tuple):
        if isMatterFunc(ty):
            return f'class{suffix}'
        return f'func{suffix}'
    ty = str(ty)
    if ty.startswith('list['):
        return f'list{suffix}'
    if isUntyped(ty):
        return f'any{suffix}'
    return f'{ty}{suffix}'


TYPEDICT = {
    'bool': Bool,
    'int': Int,
    'float': Float,
    'string': String,
    'str': String,
    'list[int]': Int,
    'object': Matter,
}


def parseOf(t, pwarn):
    name = t.asString()
    if name in TYPEDICT:
        return TYPEDICT[name]
    elif name == 'list':
        return Type('list[__]')
    else:
        pwarn(t, f'{name}？ タイプミスしてませんか？')
        return Type()


def msg(ty):
    if isinstance(ty, tuple):
        if isMatterFunc(ty):
            return '物体クラス'
        return f'関数{strType(ty)}'
    ty = str(ty)
    if ty == 'number':
        return '数値'
    if ty == 'string':
        return '文字列'
    if ty == 'object':
        return 'オブジェクト（物体）'
    if ty == 'bool':
        return '論理値'
    if ty.startswith('list'):
        return f'リスト({ty})'
    return f'{ty}型の値'
