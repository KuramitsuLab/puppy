export class ParseTree {
  public tag: string;
  public urn: any;
  public inputs: string;
  public spos: number;
  public epos: number;
  public nodes: [string, ParseTree][];

  public constructor(tag: string, spos: number, epos: number, child: any) {
    this.tag = tag;
    this.urn = child;
    this.inputs = '';
    this.spos = spos;
    this.epos = epos;
    this.nodes = ParseTree.empties;
  }

  static empties: [string, ParseTree][] = [];

  protected setup(urn: string, inputs: string) {
    if (this.urn !== null) {
      const nodes: [string, ParseTree][] = [];
      var entry: Merge = this.urn;
      while (entry !== null) {
        nodes.push([entry.edge, entry.child.setup(urn, inputs)]);
        entry = entry.prev;
      }
      this.nodes = nodes.reverse();
    }
    this.urn = urn;
    this.inputs = inputs;
    var t: any = this;
    for (var i = 0; i < this.nodes.length; i += 1) {
      t[i] = this.nodes[i][1];
      if (this.nodes[i][0] !== '') {
        t[this.nodes[i][0]] = this.nodes[i][1];
      }
    }
    return this;
  }

  public is(tag: string) {
    return this.tag === tag;
  }

  public isError() {
    return this.tag === 'err';
  }

  public subs() {
    const subs: ParseTree[] = [];
    for (var i = 0; i < this.nodes.length; i += 1) {
      subs.push(this.nodes[i][1]);
    }
    return subs;
  }

  public size() {
    return this.nodes.length;
  }

  public contains(edge: string) {
    for (var i = 0; i < this.nodes.length; i += 1) {
      if (this.nodes[i][0] === edge) return true;
    }
    return false;
  }

  public get(index: any) {
    return (this as any)[index];
  }

  public tokenize(index?: any, defstr?: string) {
    if (index === undefined) {
      return this.inputs.substring(this.spos, this.epos);
    }
    const child = (this as any)[index];
    if (child === undefined) {
      return defstr || '';
    }
    return child.tokenize();
  }

  private pos(pos: number) {
    const s = this.inputs;
    pos = Math.min(pos, s.length);
    var row = 0;
    var col = 0;
    for (var i = 0; i <= pos; i += 1) {
      if (s.charCodeAt(i) == 10) {
        row += 1;
        col = 0;
      } else {
        col += 1;
      }
    }
    return [pos, row, col];
  }

  public begin() {
    return this.pos(this.spos);
  }

  public end() {
    return this.pos(this.spos);
  }

  public length() {
    return this.epos - this.spos;
  }

  public toString() {
    const sb: string[] = [];
    this.strOut(sb);
    return sb.join('');
  }

  protected strOut(sb: string[]) {
    sb.push('[#');
    sb.push(this.tag);
    for (const node of this.nodes) {
      sb.push(node[0] === '' ? ' ' : ` ${node[0]}=`);
      node[1].strOut(sb);
    }
    if (this.nodes.length == 0) {
      const s = this.inputs.substring(this.spos, this.epos);
      sb.push(" '");
      sb.push(s);
      sb.push("'");
    }
    sb.push(']');
  }
}

class Merge {
  public prev: any;
  public edge: string;
  public child: ParseTree;

  public constructor(prev: any, edge: string, child: ParseTree) {
    this.prev = prev;
    this.edge = edge;
    this.child = child;
  }
}

class ParserContext {
  public urn: string;
  public inputs: String;
  public pos: number;
  public epos: number;
  public head_pos: number;
  public ast: any;
  public state: State | null;
  public memos: Memo[];
  public constructor(urn: string, inputs: string, pos: number, epos: number) {
    this.urn = urn;
    this.inputs = inputs;
    this.pos = pos;
    this.epos = epos;
    this.head_pos = pos;
    this.ast = null;
    this.state = null;
    this.memos = [];
    for (var i = 0; i < 1789; i++) {
      this.memos.push(new Memo());
    }
  }
}

const EMPTY = (_px: ParserContext) => {
  return true;
};

const _pEmpty = () => {
  return EMPTY;
};

const ANY = (px: ParserContext) => {
  if (px.pos < px.epos) {
    px.pos += 1;
    return true;
  }
  return false;
};

const pAny = () => {
  return ANY;
};

const pChar = (text: string) => {
  const text_length = text.length;

  return (px: ParserContext) => {
    if (px.inputs.startsWith(text, px.pos)) {
      px.pos += text_length;
      return true;
    }
    return false;
  };
};

const find_codemax = (chars: string, ranges: string[]) => {
  var code = 0;
  for (var i = 0; i < chars.length; i += 1) {
    code = Math.max(chars.charCodeAt(i), code);
  }
  for (const range of ranges) {
    code = Math.max(range.charCodeAt(0), code);
    code = Math.max(range.charCodeAt(1), code);
  }
  return code;
};

const set_bitmap = (bitmap: Uint8Array, c: number) => {
  const n = (c / 8) | 0;
  const mask = 1 << (c % 8 | 0);
  //console.log(n);
  //console.log(bitmap[n])
  bitmap[n] |= mask;
  //console.log(bitmap);
};

const pRange = (chars: string, ranges: string[]) => {
  const codemax = find_codemax(chars, ranges) + 1;
  const bitmap = new Uint8Array(((codemax / 8) | 0) + 1);
  bitmap[0] = 2;
  for (var i = 0; i < chars.length; i += 1) {
    set_bitmap(bitmap, chars.charCodeAt(i));
  }
  for (const range of ranges) {
    for (var c = range.charCodeAt(0); c <= range.charCodeAt(1); c += 1) {
      set_bitmap(bitmap, c);
    }
  }
  //console.log(`bitmap ${ bitmap.length } `)
  return (px: ParserContext) => {
    if (px.pos < px.epos) {
      const c = px.inputs.charCodeAt(px.pos);
      const n = (c / 8) | 0;
      const mask = 1 << (c % 8 | 0);
      if (n < bitmap.length && (bitmap[n] & mask) === mask) {
        px.pos += 1;
        return true;
      }
    }
    return false;
  };
};

const pMany = (match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    var pos = px.pos;
    var ast = px.ast;
    while (match(px) && px.pos > pos) {
      pos = px.pos;
      ast = px.ast;
    }
    px.head_pos = Math.max(px.pos, px.head_pos);
    px.pos = pos;
    px.ast = ast;
    return true;
  };
};

const pMany1 = (match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    if (match(px)) {
      var pos = px.pos;
      var ast = px.ast;
      while (match(px) && px.pos > pos) {
        pos = px.pos;
        ast = px.ast;
      }
      px.head_pos = Math.max(px.pos, px.head_pos);
      px.pos = pos;
      px.ast = ast;
      return true;
    }
    return false;
  };
};

const pAnd = (match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    if (match(px)) {
      px.head_pos = Math.max(px.pos, px.head_pos);
      px.pos = pos;
      return true;
    }
    return false;
  };
};

const pNot = (match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    const ast = px.ast;
    if (match(px)) {
      px.head_pos = Math.max(px.pos, px.head_pos);
      px.pos = pos;
      px.ast = ast;
      return false;
    }
    return true;
  };
};

const pOption = (match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    const ast = px.ast;
    if (!match(px)) {
      px.head_pos = Math.max(px.pos, px.head_pos);
      px.pos = pos;
      px.ast = ast;
    }
    return true;
  };
};

const pSeq = (...matches: ((px: ParserContext) => boolean)[]) => {
  return (px: ParserContext) => {
    for (const match of matches) {
      if (!match(px)) {
        return false;
      }
    }
    return true;
  };
};

const pSeq2 = (
  match: (px: ParserContext) => boolean,
  match2: (px: ParserContext) => boolean
) => {
  return (px: ParserContext) => {
    return match(px) && match2(px);
  };
};

const pSeq3 = (
  match: (px: ParserContext) => boolean,
  match2: (px: ParserContext) => boolean,
  match3: (px: ParserContext) => boolean
) => {
  return (px: ParserContext) => {
    return match(px) && match2(px) && match3(px);
  };
};

const pOre = (...matches: ((px: ParserContext) => boolean)[]) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    const ast = px.ast;
    for (const match of matches) {
      if (match(px)) {
        return true;
      }
      px.head_pos = Math.max(px.pos, px.head_pos);
      px.pos = pos;
      px.ast = ast;
    }
    return false;
  };
};

const pOre2 = (
  match: (px: ParserContext) => boolean,
  match2: (px: ParserContext) => boolean
) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    const ast = px.ast;
    if (match(px)) {
      return true;
    }
    px.head_pos = Math.max(px.pos, px.head_pos);
    px.pos = pos;
    px.ast = ast;
    return match2(px);
  };
};

const pRef = (peg: any, name: string) => {
  if (peg[name]) {
    return peg[name];
  }
  return (px: ParserContext) => {
    return peg[name](px);
  };
};

class Memo {
  public key: number;
  public constructor() {
    this.key = -1;
  }
}

const pNode = (
  match: (px: ParserContext) => boolean,
  tag: string,
  shift: number
) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    px.ast = null;
    if (match(px)) {
      px.ast = new ParseTree(tag, pos + shift, px.pos, px.ast);
      return true;
    }
    return false;
  };
};

//def Merge(prev, edge, child):
//return (prev, edge, child)

const pEdge = (edge: string, match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    const ast = px.ast;
    if (match(px)) {
      px.ast = new Merge(ast, edge, px.ast);
      return true;
    }
    return false;
  };
};

const pFold = (
  edge: string,
  match: (px: ParserContext) => boolean,
  tag: string,
  shift: number
) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    px.ast = new Merge(null, edge, px.ast);
    if (match(px)) {
      px.ast = new ParseTree(tag, pos + shift, px.pos, px.ast);
      return true;
    }
    return false;
  };
};

const _pAbs = (match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    const ast = px.ast;
    if (match(px)) {
      px.ast = ast;
      return true;
    }
    return false;
  };
};

const _pSkipErr = () => {
  return (px: ParserContext) => {
    px.pos = Math.min(px.head_pos, px.epos);
    return true;
  };
};

class State {
  public sid: number;
  public value: any;
  public prev: State | null;
  public constructor(sid: number, value: any, prev: State | null) {
    this.sid = sid;
    this.value = value;
    this.prev = prev;
  }
}

const getstate = (state: State | null, sid: number) => {
  while (state !== null) {
    if (state.sid === sid) {
      return state;
    }
    state = state.prev;
  }
  return null;
};

const pSymbol = (sid: number, match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    const pos = px.pos;
    if (match(px)) {
      px.state = new State(sid, px.inputs.substring(pos, px.pos), px.state);
      return true;
    }
    return false;
  };
};

const _pExists = (sid: number) => {
  return (px: ParserContext) => {
    return getstate(px.state, sid) !== null;
  };
};

const pMatch = (sid: number) => {
  return (px: ParserContext) => {
    const state = getstate(px.state, sid);
    if (state !== null) {
      if (px.inputs.startsWith(state.value, px.pos)) {
        px.pos += (state.value as string).length;
        return true;
      }
    }
    return false;
  };
};

const pScope = (match: (px: ParserContext) => boolean) => {
  return (px: ParserContext) => {
    const state = px.state;
    const res = match(px);
    px.state = state;
    return res;
  };
};

export const generate = (start: string) => {
  const match = grammar(start);
  if (match === undefined) {
    console.log(`undefined ${start}`);
    console.log(peg);
  }
  return (inputs: string, options?: any) => {
    const op = options === undefined ? {} : options;
    const pos = 0;
    const px = new ParserContext(
      op['urn'] || '(unknown source)',
      inputs,
      0,
      inputs.length
    );
    if (match(px)) {
      if (px.ast === null) {
        px.ast = new ParseTree('', pos, px.pos, null);
      }
    } else {
      px.ast = new ParseTree('err', px.head_pos, px.head_pos + 1, null);
    }
    return px.ast.setup(px.urn, inputs);
  };
};

let peg: any = null;

const grammar = (start: string) => {
  if (peg === null) {
    peg = {};
    peg['Source'] = pSeq3(
      pOption(pRef(peg, 'EOL')),
      pNode(
        pMany(pSeq2(pEdge('', pRef(peg, 'Statement')), pRef(peg, 'EOL'))),
        'Source',
        0
      ),
      pRef(peg, 'EOF')
    );
    peg['Block'] = pNode(
      pScope(
        pSeq3(
          pSymbol(0, pRef(peg, 'INDENT')),
          pOre2(
            pSeq3(
              pEdge('', pRef(peg, 'Statement')),
              pMany(pSeq2(pRef(peg, '";"'), pEdge('', pRef(peg, 'Statement')))),
              pOption(pRef(peg, '";"'))
            ),
            pSeq2(pRef(peg, '_'), pAnd(pRef(peg, 'EOL')))
          ),
          pMany(
            pSeq2(
              pMatch(0),
              pOre2(
                pSeq3(
                  pEdge('', pRef(peg, 'Statement')),
                  pMany(
                    pSeq2(pRef(peg, '";"'), pEdge('', pRef(peg, 'Statement')))
                  ),
                  pOption(pRef(peg, '";"'))
                ),
                pSeq2(pRef(peg, '_'), pAnd(pRef(peg, 'EOL')))
              )
            )
          )
        )
      ),
      'Block',
      0
    );
    peg['Statement'] = pOre(
      pRef(peg, 'ClassDecl'),
      pRef(peg, 'ImportDecl'),
      pRef(peg, 'FuncDecl'),
      pRef(peg, 'IfStmt'),
      pRef(peg, 'ForStmt'),
      pRef(peg, 'WhileStmt'),
      pRef(peg, 'Return'),
      pRef(peg, 'Yield'),
      pRef(peg, 'Break'),
      pRef(peg, 'Continue'),
      pRef(peg, 'VarDecl'),
      pRef(peg, 'Expression')
    );
    peg['ImportDecl'] = pOre2(
      pNode(
        pSeq3(
          pSeq2(pChar('import'), pRef(peg, 'S')),
          pEdge('name', pRef(peg, 'Name')),
          pOption(
            pSeq2(
              pSeq2(pChar('as'), pRef(peg, 'S')),
              pEdge('alias', pRef(peg, 'Name'))
            )
          )
        ),
        'ImportDecl',
        0
      ),
      pNode(
        pSeq(
          pSeq2(pChar('from'), pRef(peg, 'S')),
          pEdge('name', pRef(peg, 'Name')),
          pSeq2(pChar('import'), pRef(peg, 'S')),
          pEdge(
            'names',
            pOre2(
              pNode(
                pSeq2(
                  pEdge('', pRef(peg, 'Name')),
                  pMany(
                    pSeq3(
                      pChar(','),
                      pRef(peg, '_'),
                      pEdge('', pRef(peg, 'Name'))
                    )
                  )
                ),
                '',
                0
              ),
              pNode(pSeq2(pChar('*'), pRef(peg, '_')), '', 0)
            )
          )
        ),
        'FromDecl',
        0
      )
    );
    peg['ClassDecl'] = pNode(
      pSeq(
        pChar('class'),
        pRef(peg, 'S'),
        pRef(peg, '_'),
        pEdge('name', pRef(peg, 'Name')),
        pOption(
          pSeq(
            pChar('('),
            pRef(peg, '_'),
            pEdge('extends', pRef(peg, 'Name')),
            pChar(')'),
            pRef(peg, '_')
          )
        ),
        pChar(':'),
        pRef(peg, '_'),
        pOre2(pEdge('', pRef(peg, 'Block')), pEdge('', pRef(peg, 'Statement')))
      ),
      'ClassDecl',
      0
    );
    peg['FuncDecl'] = pNode(
      pSeq(
        pChar('def'),
        pRef(peg, 'S'),
        pRef(peg, '_'),
        pEdge('name', pRef(peg, 'Name')),
        pEdge('params', pRef(peg, 'FuncParams')),
        pChar(':'),
        pRef(peg, '_'),
        pEdge('body', pOre2(pRef(peg, 'Block'), pRef(peg, 'Statement')))
      ),
      'FuncDecl',
      0
    );
    peg['FuncParams'] = pNode(
      pSeq(
        pRef(peg, '"("'),
        pOption(pEdge('', pRef(peg, 'FuncParam'))),
        pMany(pSeq2(pRef(peg, '","'), pEdge('', pRef(peg, 'FuncParam')))),
        pRef(peg, '")"')
      ),
      'FuncParam',
      0
    );
    peg['FuncParam'] = pNode(
      pSeq2(
        pEdge('name', pRef(peg, 'Name')),
        pOption(
          pSeq3(pChar(':'), pRef(peg, '_'), pEdge('type', pRef(peg, 'Name')))
        )
      ),
      'Param',
      0
    );
    peg['Lambda'] = pNode(
      pSeq(
        pChar('lambda'),
        pOption(
          pSeq3(
            pRef(peg, 'S'),
            pRef(peg, '_'),
            pEdge('params', pRef(peg, 'LambdaParams'))
          )
        ),
        pChar(':'),
        pRef(peg, '_'),
        pEdge('body', pOre2(pRef(peg, 'Block'), pRef(peg, 'Statement')))
      ),
      'FuncExpr',
      0
    );
    peg['LambdaParams'] = pNode(
      pSeq2(
        pOption(pEdge('', pRef(peg, 'Name'))),
        pMany(pSeq2(pRef(peg, '","'), pEdge('', pRef(peg, 'Name'))))
      ),
      'Param',
      0
    );
    peg['Return'] = pNode(
      pSeq2(
        pChar('return'),
        pOption(
          pSeq3(
            pRef(peg, 'S'),
            pRef(peg, '_'),
            pEdge('expr', pRef(peg, 'Expression'))
          )
        )
      ),
      'Return',
      0
    );
    peg['Yield'] = pNode(pSeq2(pChar('yield'), pRef(peg, '_')), 'Yield', 0);
    peg['Pass'] = pNode(pSeq2(pChar('pass'), pRef(peg, '_')), 'Pass', 0);
    peg['Break'] = pNode(pSeq2(pChar('break'), pRef(peg, '_')), 'Break', 0);
    peg['Continue'] = pNode(
      pSeq2(pChar('continue'), pRef(peg, '_')),
      'Continue',
      0
    );
    peg['IfStmt'] = pNode(
      pSeq(
        pSeq2(pChar('if'), pRef(peg, 'S')),
        pRef(peg, '_'),
        pEdge('cond', pRef(peg, 'Expression')),
        pChar(':'),
        pRef(peg, '_'),
        pEdge('then', pOre2(pRef(peg, 'Block'), pRef(peg, 'Statement'))),
        pOption(
          pSeq(
            pOre2(pMatch(0), pRef(peg, 'NL')),
            pChar('else'),
            pRef(peg, '_'),
            pChar(':'),
            pRef(peg, '_'),
            pEdge('else', pOre2(pRef(peg, 'Block'), pRef(peg, 'Statement')))
          )
        )
      ),
      'IfStmt',
      0
    );
    peg['ForStmt'] = pNode(
      pSeq(
        pSeq2(pChar('for'), pRef(peg, 'S')),
        pRef(peg, '_'),
        pEdge('each', pRef(peg, 'Name')),
        pSeq2(pChar('in'), pRef(peg, 'S')),
        pRef(peg, '_'),
        pEdge('list', pRef(peg, 'Expression')),
        pChar(':'),
        pRef(peg, '_'),
        pEdge('body', pOre2(pRef(peg, 'Block'), pRef(peg, 'Statement')))
      ),
      'ForStmt',
      0
    );
    peg['WhileStmt'] = pNode(
      pSeq(
        pSeq2(pChar('while'), pRef(peg, 'S')),
        pRef(peg, '_'),
        pEdge('cond', pRef(peg, 'Expression')),
        pChar(':'),
        pRef(peg, '_'),
        pEdge('body', pOre2(pRef(peg, 'Block'), pRef(peg, 'Statement')))
      ),
      'WhileStmt',
      0
    );
    peg['VarDecl'] = pOre2(
      pNode(
        pSeq(
          pEdge('left', pRef(peg, 'LeftHand')),
          pChar('='),
          pRef(peg, '_'),
          pEdge('right', pRef(peg, 'Expression'))
        ),
        'VarDecl',
        0
      ),
      pRef(peg, 'SelfAssign')
    );
    peg['LeftHand'] = pSeq2(
      pRef(peg, 'Name'),
      pMany(
        pOre2(
          pFold(
            'recv',
            pSeq3(
              pRange('.', []),
              pRef(peg, '_'),
              pEdge('name', pRef(peg, 'Name'))
            ),
            'GetExpr',
            0
          ),
          pFold(
            'recv',
            pSeq3(
              pRef(peg, '"["'),
              pEdge('index', pRef(peg, 'Expression')),
              pRef(peg, '"]"')
            ),
            'IndexExpr',
            0
          )
        )
      )
    );
    peg['SelfAssign'] = pNode(
      pSeq3(
        pEdge('left', pRef(peg, 'LeftHand')),
        pEdge('name', pRef(peg, 'SelfAssignOp')),
        pEdge('right', pRef(peg, 'Expression'))
      ),
      'SelfAssign',
      0
    );
    peg['SelfAssignOp'] = pSeq2(
      pNode(
        pSeq2(
          pOre(
            pChar('<<'),
            pChar('>>'),
            pChar('**'),
            pChar('//'),
            pRange('+=*@/%&|^', [])
          ),
          pChar('=')
        ),
        '',
        0
      ),
      pRef(peg, '_')
    );
    peg['Expression'] = pSeq2(
      pRef(peg, 'Operator'),
      pOption(
        pFold(
          'then',
          pSeq(
            pChar('if'),
            pRef(peg, '_'),
            pEdge('cond', pRef(peg, 'Expression')),
            pChar('else'),
            pRef(peg, '_'),
            pEdge('else', pRef(peg, 'Expression'))
          ),
          'IfExpr',
          0
        )
      )
    );
    peg['Operator'] = pSeq2(
      pRef(peg, 'AndExpr'),
      pMany(
        pFold(
          'left',
          pSeq3(
            pRef(peg, 'OR'),
            pRef(peg, '_'),
            pEdge('right', pRef(peg, 'AndExpr'))
          ),
          'Or',
          0
        )
      )
    );
    peg['OR'] = pOre2(pChar('or'), pChar('||'));
    peg['AndExpr'] = pSeq2(
      pRef(peg, 'NotExpr'),
      pMany(
        pFold(
          'left',
          pSeq3(
            pRef(peg, 'AND'),
            pRef(peg, '_'),
            pEdge('right', pRef(peg, 'NotExpr'))
          ),
          'And',
          0
        )
      )
    );
    peg['AND'] = pOre2(pChar('and'), pChar('&&'));
    peg['NotExpr'] = pOre2(
      pNode(
        pSeq3(
          pRef(peg, 'NOT'),
          pRef(peg, '_'),
          pEdge('', pRef(peg, 'NotExpr'))
        ),
        'Not',
        0
      ),
      pRef(peg, 'EqExpr')
    );
    peg['NOT'] = pOre2(pSeq2(pChar('not'), pRef(peg, 'S')), pChar('!'));
    peg['EqExpr'] = pSeq2(
      pRef(peg, 'SumExpr'),
      pMany(
        pFold(
          'left',
          pSeq3(
            pEdge('name', pNode(pRef(peg, 'EQ'), 'Name', 0)),
            pRef(peg, '_'),
            pEdge('right', pRef(peg, 'SumExpr'))
          ),
          'Infix',
          0
        )
      )
    );
    peg['EQ'] = pOre(
      pSeq2(pChar('=='), pNot(pChar('='))),
      pSeq2(pChar('!='), pNot(pChar('='))),
      pSeq2(pChar('<='), pNot(pChar('='))),
      pSeq2(pChar('>='), pNot(pChar('='))),
      pSeq2(pChar('<'), pNot(pChar('<'))),
      pSeq2(pChar('>'), pNot(pChar('>'))),
      pSeq2(pChar('in'), pRef(peg, 'S')),
      pSeq2(pChar('is'), pRef(peg, 'S')),
      pSeq2(pChar('is not'), pRef(peg, 'S'))
    );
    peg['SumExpr'] = pSeq2(
      pRef(peg, 'ProdExpr'),
      pMany(
        pFold(
          'left',
          pSeq3(
            pEdge('name', pNode(pRef(peg, 'SUM'), 'Name', 0)),
            pRef(peg, '_'),
            pEdge('right', pRef(peg, 'ProdExpr'))
          ),
          'Infix',
          0
        )
      )
    );
    peg['SUM'] = pRange('+-|＋ー', []);
    peg['ProdExpr'] = pSeq2(
      pRef(peg, 'PowExpr'),
      pMany(
        pFold(
          'left',
          pSeq3(
            pEdge('name', pNode(pRef(peg, 'PROD'), 'Name', 0)),
            pRef(peg, '_'),
            pEdge('right', pRef(peg, 'PowExpr'))
          ),
          'Infix',
          0
        )
      )
    );
    peg['PROD'] = pOre(
      pChar('//'),
      pChar('<<'),
      pChar('>>'),
      pRange('*/%^&×÷', [])
    );
    peg['PowExpr'] = pSeq2(
      pRef(peg, 'UnaryExpr'),
      pMany(
        pFold(
          'left',
          pSeq3(
            pEdge('name', pNode(pChar('**'), 'Name', 0)),
            pRef(peg, '_'),
            pEdge('right', pRef(peg, 'UnaryExpr'))
          ),
          'Infix',
          0
        )
      )
    );
    peg['UnaryExpr'] = pOre2(
      pNode(
        pSeq3(
          pEdge('name', pNode(pRef(peg, 'PRE'), 'Name', 0)),
          pRef(peg, '_'),
          pEdge('expr', pRef(peg, 'UnaryExpr'))
        ),
        'Unary',
        0
      ),
      pRef(peg, 'SuffixExpr')
    );
    peg['PRE'] = pRange('+-~', []);
    peg['SuffixExpr'] = pSeq2(
      pRef(peg, 'Primary'),
      pMany(
        pOre(
          pFold(
            'recv',
            pSeq(
              pChar('.'),
              pRef(peg, '_'),
              pEdge('name', pRef(peg, 'Name')),
              pRef(peg, '"("'),
              pEdge('params', pRef(peg, 'Arguments')),
              pRef(peg, '__'),
              pRef(peg, '")"')
            ),
            'MethodExpr',
            0
          ),
          pFold(
            'recv',
            pSeq3(
              pRange('.', []),
              pRef(peg, '_'),
              pEdge('name', pRef(peg, 'Name'))
            ),
            'GetExpr',
            0
          ),
          pFold(
            'name',
            pSeq(
              pRef(peg, '"("'),
              pEdge('params', pRef(peg, 'Arguments')),
              pRef(peg, '__'),
              pRef(peg, '")"')
            ),
            'ApplyExpr',
            0
          ),
          pFold(
            'recv',
            pSeq(
              pRef(peg, '"["'),
              pOption(pEdge('left', pRef(peg, 'Expression'))),
              pChar(':'),
              pRef(peg, '_'),
              pOption(pEdge('right', pRef(peg, 'Expression'))),
              pRef(peg, '"]"')
            ),
            'Slice',
            0
          ),
          pFold(
            'recv',
            pSeq3(
              pRef(peg, '"["'),
              pEdge('index', pRef(peg, 'Expression')),
              pRef(peg, '"]"')
            ),
            'IndexExpr',
            0
          )
        )
      )
    );
    peg['Arguments'] = pNode(
      pSeq3(
        pOption(pSeq2(pEdge('', pRef(peg, 'Expression')), pNot(pChar('=')))),
        pMany(
          pSeq(
            pChar(','),
            pRef(peg, '__'),
            pEdge('', pRef(peg, 'Expression')),
            pNot(pChar('='))
          )
        ),
        pOption(pEdge('', pRef(peg, 'KeywordArgument')))
      ),
      'Arguments',
      0
    );
    peg['KeywordArgument'] = pNode(
      pSeq3(
        pOption(pSeq2(pChar(','), pRef(peg, '__'))),
        pEdge('', pRef(peg, 'Argument')),
        pMany(
          pSeq3(pChar(','), pRef(peg, '__'), pEdge('', pRef(peg, 'Argument')))
        )
      ),
      'Data',
      0
    );
    peg['Argument'] = pNode(
      pSeq(
        pEdge('name', pRef(peg, 'Name')),
        pChar('='),
        pRef(peg, '_'),
        pEdge('value', pRef(peg, 'Expression'))
      ),
      'KeyValue',
      0
    );
    peg['Primary'] = pOre(
      pRef(peg, 'GroupExpr'),
      pRef(peg, 'ListExpr'),
      pRef(peg, 'DataExpr'),
      pRef(peg, 'Lambda'),
      pRef(peg, 'Constant'),
      pRef(peg, 'Name')
    );
    peg['GroupExpr'] = pNode(
      pSeq(
        pRef(peg, '"("'),
        pEdge('', pRef(peg, 'Expression')),
        pMany(pSeq2(pRef(peg, '","'), pEdge('', pRef(peg, 'Expression')))),
        pRef(peg, '__'),
        pRef(peg, '")"')
      ),
      'Tuple',
      0
    );
    peg['ListExpr'] = pNode(
      pSeq(
        pRef(peg, '"["'),
        pOption(
          pSeq2(
            pEdge('', pRef(peg, 'Expression')),
            pMany(pSeq2(pRef(peg, '","'), pEdge('', pRef(peg, 'Expression'))))
          )
        ),
        pMany(pRef(peg, '","')),
        pRef(peg, '__'),
        pRef(peg, '"]"')
      ),
      'List',
      0
    );
    peg['DataExpr'] = pNode(
      pSeq(
        pRef(peg, '"{"'),
        pEdge('', pRef(peg, 'KeyValue')),
        pMany(pSeq2(pMany(pRef(peg, '","')), pEdge('', pRef(peg, 'KeyValue')))),
        pMany(pRef(peg, '","')),
        pRef(peg, '__'),
        pRef(peg, '"}"')
      ),
      'Data',
      0
    );
    peg['KeyValue'] = pNode(
      pSeq3(
        pEdge(
          'name',
          pOre(
            pRef(peg, 'Name'),
            pRef(peg, 'StringExpr'),
            pRef(peg, 'CharExpr')
          )
        ),
        pRef(peg, '":"'),
        pEdge('value', pRef(peg, 'Expression'))
      ),
      'KeyValue',
      0
    );
    peg['Name'] = pOre2(pRef(peg, 'Identifier'), pRef(peg, 'NLPSymbol'));
    peg['Identifier'] = pSeq2(
      pNode(
        pSeq2(pRange('', ['AZ', 'az']), pMany(pRange('_', ['AZ', 'az', '09']))),
        'Name',
        0
      ),
      pRef(peg, '_')
    );
    peg['NLPSymbol'] = pSeq2(
      pNode(
        pMany1(pOre(pRef(peg, 'HIRA'), pRef(peg, 'KATA'), pRef(peg, 'KANJI'))),
        'NLPSymbol',
        0
      ),
      pRef(peg, '_')
    );
    peg['Constant'] = pOre(
      pRef(peg, 'FormatString'),
      pRef(peg, 'LongString'),
      pRef(peg, 'StringExpr'),
      pRef(peg, 'CharExpr'),
      pRef(peg, 'Number'),
      pRef(peg, 'TrueExpr'),
      pRef(peg, 'FalseExpr'),
      pRef(peg, 'NullExpr')
    );
    peg['FormatString'] = pSeq3(
      pRange('Ff', []),
      pOre(
        pSeq3(
          pChar("'''"),
          pNode(pMany(pEdge('', pRef(peg, 'FormatContent3'))), 'Format', 0),
          pChar("'''")
        ),
        pSeq3(
          pChar("'"),
          pNode(pMany(pEdge('', pRef(peg, 'FormatContent1'))), 'Format', 0),
          pChar("'")
        ),
        pSeq3(
          pChar('"""'),
          pNode(pMany(pEdge('', pRef(peg, 'FormatContent3D'))), 'Format', 0),
          pChar('"""')
        ),
        pSeq3(
          pChar('"'),
          pNode(pMany(pEdge('', pRef(peg, 'FormatContent1D'))), 'Format', 0),
          pChar('"')
        )
      ),
      pRef(peg, '_')
    );
    peg['FormatContent3'] = pOre2(
      pSeq3(pChar('{'), pRef(peg, 'Expression'), pChar('}')),
      pNode(
        pMany(pSeq3(pNot(pChar("'''")), pNot(pChar('{')), pAny())),
        'StringPart',
        0
      )
    );
    peg['FormatContent1'] = pOre2(
      pSeq3(pChar('{'), pRef(peg, 'Expression'), pChar('}')),
      pNode(
        pMany(pSeq3(pNot(pChar("'")), pNot(pChar('{')), pAny())),
        'StringPart',
        0
      )
    );
    peg['FormatContent3D'] = pOre2(
      pSeq3(pChar('{'), pRef(peg, 'Expression'), pChar('}')),
      pNode(
        pMany(pSeq3(pNot(pChar('"""')), pNot(pChar('{')), pAny())),
        'StringPart',
        0
      )
    );
    peg['FormatContent1D'] = pOre2(
      pSeq3(pChar('{'), pRef(peg, 'Expression'), pChar('}')),
      pNode(
        pMany(pSeq3(pNot(pChar('"')), pNot(pChar('{')), pAny())),
        'StringPart',
        0
      )
    );
    peg['LongString'] = pOre2(
      pSeq(
        pChar("''"),
        pNode(
          pSeq3(
            pChar("'"),
            pMany(
              pOre(
                pRef(peg, 'ESCAPE'),
                pSeq2(pNot(pRange("\\'", [])), pAny()),
                pSeq2(pNot(pChar("'''")), pChar("'"))
              )
            ),
            pChar("'")
          ),
          'MultiString',
          0
        ),
        pChar("''"),
        pRef(peg, '_')
      ),
      pSeq(
        pChar('""'),
        pNode(
          pSeq3(
            pChar('"'),
            pMany(
              pOre(
                pRef(peg, 'ESCAPE'),
                pSeq2(pNot(pRange('\\"', [])), pAny()),
                pSeq2(pNot(pChar('"""')), pChar('"'))
              )
            ),
            pChar('"')
          ),
          'MultiString',
          0
        ),
        pChar('""'),
        pRef(peg, '_')
      )
    );
    peg['StringExpr'] = pSeq2(
      pNode(
        pSeq3(pChar('"'), pMany(pRef(peg, 'STRING_CONTENT')), pChar('"')),
        'String',
        0
      ),
      pRef(peg, '_')
    );
    peg['CharExpr'] = pSeq2(
      pNode(
        pSeq3(pChar("'"), pMany(pRef(peg, 'CHAR_CONTENT')), pChar("'")),
        'Char',
        0
      ),
      pRef(peg, '_')
    );
    peg['STRING_CONTENT'] = pOre2(
      pRef(peg, 'ESCAPE'),
      pSeq2(pNot(pRange('"\n\\', [])), pAny())
    );
    peg['CHAR_CONTENT'] = pOre2(
      pRef(peg, 'ESCAPE'),
      pSeq2(pNot(pRange("'\n\\", [])), pAny())
    );
    peg['ESCAPE'] = pOre(
      pSeq2(pChar('\\'), pRange('\'"\\bfnrt', [])),
      pSeq(
        pChar('\\'),
        pRange('', ['03']),
        pRange('', ['07']),
        pRange('', ['07'])
      ),
      pSeq3(pChar('\\'), pRange('', ['07']), pRange('', ['07'])),
      pSeq2(pChar('\\'), pRange('', ['07'])),
      pSeq(
        pChar('\\'),
        pRange('uU', []),
        pRef(peg, 'HEX'),
        pRef(peg, 'HEX'),
        pRef(peg, 'HEX'),
        pRef(peg, 'HEX')
      )
    );
    peg['IntExpr'] = pSeq2(
      pNode(
        pOre(
          pRef(peg, 'DECIMAL'),
          pRef(peg, 'HEXADECIMAL'),
          pRef(peg, 'BINARY'),
          pRef(peg, 'OCTAL')
        ),
        'Int',
        0
      ),
      pRef(peg, '_')
    );
    peg['DECIMAL'] = pOre2(
      pSeq2(pChar('0'), pNot(pRange('bBxX_', ['09']))),
      pSeq2(
        pRange('', ['19']),
        pMany(pSeq2(pMany(pChar('_')), pRef(peg, 'DIGIT')))
      )
    );
    peg['HEXADECIMAL'] = pSeq(
      pChar('0'),
      pRange('xX', []),
      pRef(peg, 'HEX'),
      pMany(pSeq2(pMany(pChar('_')), pRef(peg, 'HEX')))
    );
    peg['BINARY'] = pSeq(
      pChar('0'),
      pRange('bB', []),
      pRange('01', []),
      pMany(pSeq2(pMany(pChar('_')), pRange('01', [])))
    );
    peg['OCTAL'] = pSeq2(
      pChar('0'),
      pMany(pSeq2(pMany(pChar('_')), pRange('', ['07'])))
    );
    peg['DIGIT'] = pRange('', ['09']);
    peg['HEX'] = pRange('', ['af', 'AF', '09']);
    peg['LONG_SUFFIX'] = pRange('lL', []);
    peg['FloatExpr'] = pSeq2(
      pNode(pRef(peg, 'FLOAT'), 'Double', 0),
      pRef(peg, '_')
    );
    peg['FLOAT'] = pOre2(
      pSeq2(pRef(peg, 'FRACTION'), pOption(pRef(peg, 'EXPONENT'))),
      pSeq2(pMany1(pRef(peg, 'DIGIT')), pRef(peg, 'EXPONENT'))
    );
    peg['FRACTION'] = pOre2(
      pSeq(
        pNot(pChar('_')),
        pMany(pSeq2(pMany(pChar('_')), pRef(peg, 'DIGIT'))),
        pChar('.'),
        pRef(peg, 'DIGIT'),
        pMany(pSeq2(pMany(pChar('_')), pRef(peg, 'DIGIT')))
      ),
      pSeq(
        pRef(peg, 'DIGIT'),
        pMany(pSeq2(pMany(pChar('_')), pRef(peg, 'DIGIT'))),
        pChar('.'),
        pNot(pChar('.'))
      )
    );
    peg['EXPONENT'] = pSeq(
      pRange('eE', []),
      pOption(pRange('+-', [])),
      pRef(peg, 'DIGIT'),
      pMany(pSeq2(pMany(pChar('_')), pRef(peg, 'DIGIT')))
    );
    peg['Number'] = pOre2(pRef(peg, 'FloatExpr'), pRef(peg, 'IntExpr'));
    peg['TrueExpr'] = pSeq2(
      pNode(pSeq2(pRange('Tt', []), pChar('rue')), 'TrueExpr', 0),
      pRef(peg, '_')
    );
    peg['FalseExpr'] = pSeq2(
      pNode(pSeq2(pRange('Ff', []), pChar('alse')), 'FalseExpr', 0),
      pRef(peg, '_')
    );
    peg['NullExpr'] = pSeq2(
      pNode(pOre2(pChar('None'), pChar('null')), 'Null', 0),
      pRef(peg, '_')
    );
    peg['EOF'] = pNot(pAny());
    peg['NL'] = pOre2(pChar('\n'), pRef(peg, 'EOF'));
    peg['S'] = pRange(' \t\r\u3000、，', []);
    peg['_'] = pMany(
      pOre(pRef(peg, 'S'), pRef(peg, 'BLOCKCOMMENT'), pRef(peg, 'LINECOMMENT'))
    );
    peg['__'] = pMany(
      pOre(
        pRef(peg, 'S'),
        pChar('\n'),
        pRef(peg, 'BLOCKCOMMENT'),
        pRef(peg, 'LINECOMMENT')
      )
    );
    peg['SPC'] = pMany1(
      pOre(pRef(peg, 'S'), pRef(peg, 'BLOCKCOMMENT'), pRef(peg, 'LINECOMMENT'))
    );
    peg['BLOCKCOMMENT'] = pOre2(
      pSeq3(pChar('/*'), pMany(pSeq2(pNot(pChar('*/')), pAny())), pChar('*/')),
      pSeq3(pChar('(*'), pMany(pSeq2(pNot(pChar('*)')), pAny())), pChar('*)'))
    );
    peg['LINECOMMENT'] = pSeq2(
      pChar('#'),
      pMany(pSeq2(pNot(pRef(peg, 'NL')), pAny()))
    );
    peg['EOL'] = pSeq3(
      pRef(peg, '_'),
      pRef(peg, 'NL'),
      pMany(pSeq2(pRef(peg, '_'), pRef(peg, 'NL')))
    );
    peg['INDENT'] = pSeq2(pChar('\n'), pMany1(pRange(' \t', [])));
    peg['C'] = pOre(
      pRef(peg, 'HIRA'),
      pRef(peg, 'KATA'),
      pRef(peg, 'KANJI'),
      pRef(peg, 'MARK'),
      pRange('', ['ａｚ', 'ＡＺ', '０９'])
    );
    peg['HIRA'] = pRange('', ['ぁん']);
    peg['KATA'] = pRange('', ['ァヶ']);
    peg['KANJI'] = pRange('々〇〻ー', ['㐀䶵', '一龠']);
    peg['MARK'] = pRange('ー', []);
    peg['W'] = pRange('々〇〻ー', ['ァヶ', '㐀䶵', '一龠', 'ＡＺ']);
    peg['"{"'] = pSeq2(pRange('{｛', []), pRef(peg, '__'));
    peg['"}"'] = pSeq2(pRange('}｝', []), pRef(peg, '_'));
    peg['"["'] = pSeq2(pRange('[［【', []), pRef(peg, '__'));
    peg['"]"'] = pSeq2(pRange(']］】', []), pRef(peg, '_'));
    peg['"("'] = pSeq2(pRange('(（', []), pRef(peg, '__'));
    peg['")"'] = pSeq2(pRange(')）', []), pRef(peg, '_'));
    peg['"="'] = pSeq3(
      pRange('=＝', []),
      pNot(pRange('=＝', [])),
      pRef(peg, '_')
    );
    peg['"."'] = pSeq2(pRange('.．。', []), pRef(peg, '_'));
    peg['","'] = pSeq2(pRange(',、', []), pRef(peg, '_'));
    peg['";"'] = pMany1(pSeq2(pRange(';；', []), pRef(peg, '_')));
    peg['":"'] = pSeq2(pRange(':：', []), pRef(peg, '_'));
  }
  return peg[start];
};

const _example = (start: string, sample?: string) => {
  const parser = generate(start);
  const t = parser(sample || 'abc');
  console.log(`${start} ${sample}`);
  console.log(t.toString());
};

// example('Source',"from puppy import *\ndef cat_clicked(cat): print('Meaw')\ncat = Circle(500, 500, clicked=cat_clicked)\n")
// example('ClassDecl','class Ball(Circle):\n    width = 80\n    heigh = 80\n')
// example('Statement','class Ball(Circle):\n    width = 80\n    heigh = 80\n')
// example('FuncDecl','def succ(x):\n    #hoge\n    return x+1\n')
// example('Statement','def succ(x):\n    #hoge\n    return x+1\n')
// example('Lambda','lambda: print(1)')
// example('Lambda','lambda x: print(x)')
// example('Lambda','lambda x,y: print(x,y)')
// example('IfStmt','if A == 1 :\n    print(A)\n    #hoge\n    print(A, B)\n    A = Ball(跳ね返る)\nelse:\n    print(A, B)\n\n    A = 2\n')
// example('Statement','if A == 1 :\n    print(A)\n    #hoge\n    print(A, B)\n    A = Ball(跳ね返る)\nelse:\n    print(A, B)\n\n    A = 2\n')
// example('IfStmt','if A == 1 :\n    print(A)\nelse:\n    print(A, B)\n')
// example('Statement','if A == 1 :\n    print(A)\nelse:\n    print(A, B)\n')
// example('ForStmt','for x in [1,2,3]:\n    print(x)\n    print(x+1)\n')
// example('Statement','for x in [1,2,3]:\n    print(x)\n    print(x+1)\n')
// example('VarDecl','A = 1')
// example('Statement','A = 1')
// example('VarDecl','A += 1')
// example('Statement','A += 1')
// example('Expression','not 1 == 2')
// example('Expression','not 1 == 2 and 1 > 3')
// example('Expression','a[1:2]')
// example('Expression','a[1:]')
// example('Expression','a[:2]')
// example('Expression','Circle(500, 500)')
// example('Expression','Circle(500, 500, clicked=cat_clicked)')
// example('Expression','Circle(clicked=1, move=1)')
// example('Primary','(1,2) //')
// example('Expression','(1,2) //')
// example('Primary','(1)')
// example('Expression','(1)')
// example('Primary','[1,2,3]')
// example('Expression','[1,2,3]')
// example('Primary',"{ name: 'naruto', age: 17 }")
// example('Expression',"{ name: 'naruto', age: 17 }")
// example('Expression',"f'{a}+{1}'")
// example('Expression','world(\n    hoge=1,\n    hoge=1*2**2*3\n)\n')

// pegpy nezcc -g math.tpeg parser.ts > math.ts
// npx ts-node math.ts
