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
  main: function(Matter,puppy){{
{main}
  }},
  errors: []
}}
'''

# print(t.tag)
# for label, subtree in t:
#   print(label, subtree)


def Source(t):
    s = ''
    for label, subtree in t:
        s += Indent(conv(subtree))
    return puppyVMCode(s)


def VarDecl(t):
    left = f"puppy.vars['{conv(t['left'])}']"
    right = conv(t['right'])
    return '{} = {}'.format(left, right)

option = [
    'position',
    'Ball',
]

render = [
    'fillStyle',
    'strokeStyle',
    'lineWidth',
]

def KeywordArgument(t):
    name = conv(t['name'])
    value = conv(t['value'])
    if name in option:
        return "'{}' : {{\n{}}},\n".format(name,Indent(value))
    if name in render:
        return "'render' : {{\n'{}' : {},\n}},\n".format(name, value)  #renderを一回にしたい
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

def Name(t):
    return t.asString()

def Int(t):
    return t.asString()

def String(t):
    return "'{}'".format(t.asString())

def Indent(t):
    a = t.splitlines()
    s = ""
    for i in a:
        s += "    " + i + "\n"
    return s

cheepna = {
    'print': 'puppy.print(',
    'Ball': 'puppy.newMatter("circle", '
}


def ApplyExpr(t):
    name = conv(t['name'])
    s = ""
    for label, subtree in t:
        if subtree.tag == "Name":
            continue
        s += conv(subtree)      
    if name in cheepna:
        if name in option:
            return "{}{{\n{}}}),\n".format(cheepna[name],Indent(s))
        return "{}{}),\n".format(cheepna[name],s)
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
    s = '{' + '\n'
    for label, subtree in t:
        s += conv(subtree) + '\n'
    s += '}'
    return s

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
