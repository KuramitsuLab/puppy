import sys
from pegpy.tpeg import grammar, generate, STDLOG

# 文法を直したいときは
# pegpy/grammar/puppy.tpeg を編集する

peg = grammar('puppy.tpeg')
parser = generate(peg)

source = '''
print("こんにちは、のぶちゃん")
'''


puppyVMCode = lambda main: f'''
window['PuppyVMCode'] = {{
  world: {{
    'width': 1000,
    'height': 1000,
    'xGravity': 0.0,
    'yGravity': 0.05,
    'mouse': true,
  }},
  bodies: [],
  main: function*(Matter,puppy){{
{main}
  }},
  errors: []
}}
'''

# print(t.tag)
# for label, subtree in t:
#   print(label, subtree)


userwordopt = {}

def Source(t):
    s = ''
    for label, subtree in t:
        s += Indent(conv(subtree))
    return puppyVMCode(s)


def VarDecl(t):
    left = f"yield puppy.vars['{conv(t['left'])}']"
    right = conv(t['right'])
    return '{} = {}'.format(left, right)

def ForStmt(t):
    each = conv(t['each'])
    varlist = conv(t['list'])
    body = conv(t['body'])
    return 'for (var {} of {}){}'.format(each,varlist,body)


def FuncDecl(t):
    name = conv(t['name'])
    params = conv(t['params'])
    body = ""
    for label,subtree in t:    #仮
        if subtree.tag == "Block":
            body += conv(subtree)
    return "const {} = ({}) => {}\n".format(name,params,body)


def FuncParam(t):
    s = ""
    for i,(label,subtree) in enumerate(t):
        if i > 0:
            s += ","
        s += conv(subtree) 
    return s

optional = [
    'position',
    'Ball',
]

wordoptional = [
    'font',
    'color',
]

def KeywordArgument(t):
    name = conv(t['name'])
    value = conv(t['value'])
    if name in optional:
        return "'{}' : {{\n{}}},\n".format(name,Indent(value))
    if name in wordoptional:
        userwordopt[name] = value
        return ""
    return "'{}' : {},\n".format(name, value)
    

def Data(t):
    s = ''
    for label, subtree in t:
        s += conv(subtree)
    return s

def KeyValue(t):
    name = conv(t['name'])
    value = conv(t['value'])
    return "{} : {},\n".format(name, value)

def List(t):
    l = []
    for label, subtree in t:
        l.append(int(conv(subtree)))
    return l

def TrueExpr(t):
    return t.asString()

def FalseExpr(t):
    return t.asString()

def Name(t):
    return t.asString()

def Int(t):
    return t.asString()

def String(t):
    return "'{}'".format(t.asString())

def Char(t):
    return "'{}'".format(t.asString())


def WordOption():
    s = ""
    for i,w in enumerate(userwordopt):
        name = w
        value = userwordopt[w]
        if i != len(userwordopt)-1:
            s += "'{}' : {},".format(name, value)
        else:
            s += "'{}' : {}".format(name, value)
    userwordopt.clear()
    return ", {{{}}}".format(s)


def Indent(t):
    a = t.splitlines()
    s = ""
    for i in a:
        s += "    " + i + "\n"
    return s

MatterObjectNames = {
    "Ball" : 'puppy.newMatter("circle", ',
    "Rectangle" : 'puppy.newMatter("rectangle", ',
    "Circle" : 'puppy.newMatter("circle", '
}

MatterObjectArgs = [
    lambda subtree : "'position' : {{'x' : {}".format(conv(subtree)),
    lambda subtree : ", 'y': {}}},\n".format(conv(subtree)),
]

cheepna = {
    'print': 'puppy.print(',
}

def ApplyExpr(t):
    name = conv(t['name'])
    s = ""
    for cnt,(label, subtree) in enumerate(t):
        if subtree.tag == "Name":
            continue
        if name in MatterObjectNames and cnt <= 2:
            s += MatterObjectArgs[cnt-1](subtree)
            continue
        s += conv(subtree)
    if name == "print":
        s += WordOption()
    if name in MatterObjectNames:
        return "{}{{\n{}}});".format(MatterObjectNames[name],Indent(s))
    else:
        return "{}{});".format(cheepna[name],s)
    return s


def IfStmt(t):
    s = 'if ('
    s += conv(t['cond'])
    s += ')'
    s += conv(t['then'])
    if 'else' in t:
        s += 'else'
        s += conv(t['else'])
    return s


def Infix(t):
    s = conv(t['left']) + conv(t['name']) + conv(t['right'])
    return s


def Block(t):
    s = ''
    for label, subtree in t:
        s += conv(subtree) + '\n'
    return '{{\n{}}}'.format(Indent(s))

func = globals()


def conv(t):
    if t.tag in func:
        return func[t.tag](t)
    else:
        return str(t)


def transpile(s):
    t = parser(s)
    STDLOG.dump(t)  # debug
    return conv(t)

# main スクリプト

if __name__ == "__main__":
    if len(sys.argv) > 1:
        with open(sys.argv[1]) as f:
            source = f.read()
    code = transpile(source)
    print(code)

__package__ = 'puppy'
