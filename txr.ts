// Enums

enum txr_token {
  eof = 0, // <end of file>
  op = 1, // + - * / % div
  par_open = 2, // (
  par_close = 3, // )
  number = 4, // 37
  ident = 5, // some
}

function txr_print_tokens(tkns: any): string[] { // TODO: remove any
  const result: string[] = [];

  for (let i = 0; i < tkns.length; i++) {
    const tk = tkns[i];
    switch (tk[0]) {
      case txr_token.eof:       result.push("END OF FILE"); break;
      case txr_token.par_open:  result.push("OPEN PAREN"); break;
      case txr_token.par_close: result.push("CLOSE PAREN"); break;
      case txr_token.number:    result.push(`NUMBER ( ${tk[2]} )`); break;
      case txr_token.ident:     result.push(`IDENTIFIER ( ${tk[2]} )`); break;

      case txr_token.op: {
        let op = '';
        switch (tk[2]) {
          case txr_op.add:  op = "ADD"; break;
          case txr_op.sub:  op = "SUBTRACT"; break;
          case txr_op.mul:  op = "MULTIPLY"; break;
          case txr_op.fdiv: op = "DIVIDE"; break;
          case txr_op.idiv: op = "INTEGER DIVIDE"; break;
          case txr_op.fmod: op = "MODULO"; break;
          default:          op = "UNKNOWN"; break;
        }
        result.push(op);
      } break;

      default: result.push("UNKNOWN TOKEN "+ tk[0]); break;
    }
  }
  
  return result;
}

// function txr_print_tokens(tkns: token[]): string[] {
//   const lookup: {[index: number]: string} = {};
//   lookup[txr_token.eof]        = "END OF FILE";
//   lookup[txr_token.par_open]   = "OPEN PAREN";
//   lookup[txr_token.par_close]  = "CLOSE PAREN";
//   lookup[txr_token.op]         = "OPERATOR";
//   lookup[txr_token.number]     = "NUMBER";
//   lookup[txr_token.ident]      = "IDENTIFIER";

//   const op_lookup: {[index: number]: string} = {};
//   op_lookup[txr_op.mul]  = "MULTIPLY";
//   op_lookup[txr_op.fdiv] = "FLOAT DIVISION";
//   op_lookup[txr_op.fmod] = "MODULO";
//   op_lookup[txr_op.idiv] = "INT DIVISION";
//   op_lookup[txr_op.add]  = "ADDITION";
//   op_lookup[txr_op.sub]  = "SUBTRACTION";
//   op_lookup[txr_op.maxp] = "MAX PRIORITY";

//   const result = [];
//   for (let i = 0; i < tkns.length; i++) {
//     const tk = tkns[i];
//     //if (typeof tk[2] !==  'number') continue;
//     const val = tk[2] ? `, ${(tk[0] === txr_token.op ? (typeof tk[2] === 'number' ? `"${op_lookup[tk[2]]}"` : 'ILLEGAL') : tk[2])}` : '';
//     const tkname = typeof tk[0] === 'number' ? lookup[tk[0]] : "UNKNOWN TOKEN";
//     result.push(`Token("${tkname}"${val})`);
//   }
//   return result;
// }
enum txr_op {
  mul  = 0x01, // *
  fdiv = 0x02, // /
  fmod = 0x03, // %
  idiv = 0x04, // div
  add  = 0x10, // +
  sub  = 0x11, // -
  maxp = 0x20 // maximum priority
}
enum txr_node {
    number = 1, // (number)
    ident = 2, // (name)
    unop = 3, // (unop, node)
    binop = 4, // (binop, a, b)
}
function txr_print_ast(ast: any): any { //TODO: remove any
  const result: string[] = [];
  
  for (let i = 0; i < ast.length; i++) {
  const element = ast[i];
  let typ;
    if (Array.isArray(element)) {
      result.push(txr_print_ast(element));
    } else {
      if (i === 0) {
        typ = element;
        switch (element) {
          case txr_node.number:
            result.push("NUMBER");
            result.push(ast[2]);
            break;

          case txr_node.ident:
            result.push("IDENTIFIER");
            result.push(ast[2]);
            break;

          case txr_node.unop: //Should be impossible
            // result.push("SINGLE OPERAND");
            // switch (ast[2]) {
            //   default: result.push(ast[2]);
            // }
            break;

          case txr_node.binop:
            switch (ast[2]) {
              case txr_op.add: result.push("ADD"); break;
              case txr_op.sub: result.push("SUBTRACT"); break;
              case txr_op.fdiv: result.push("FLOAT DIVISION"); break;
              case txr_op.idiv: result.push("INTEGER DIVISION"); break;
              case txr_op.fmod: result.push("MODULO"); break;
              case txr_op.mul: result.push("MULTIPLY"); break;
              default: result.push("UNKNOWN OPERATION "+ast[2]); break;
            }
            break;

          default: result.push(`UNKNOWN: ${element} | ${i}`); break;
        }
      } else if (i === 1) {

      } else {
        
      }
    }
  }

  return result;
}
enum txr_unop {
    negate = 1, // -value
}
enum txr_build_flag {
    no_ops = 1,
}

enum txr_action {
  number = 1, // (value): push(value)
  ident = 2, // (name): push(self[name])
  unop = 3, // (unop): push(-pop())
  binop = 4, // (op): a = pop(); b = pop(); push(binop(op, a, b))
}


type token = (number | string)[];
type node = (string | number | token | node)[];
type action = any[]; //TODO Fix this

//Globals
var txr_log = false;
var txr_error: string = '';
var txr_parse_tokens: token[] = [];

var txr_build_node: node = [];
var txr_build_pos = 0;

var txr_compile_list: action[] = [];




function txr_throw(err: string, pos: number | string): boolean {
  txr_error = `${err} at position ${pos}`;
  if (txr_log) console.log(txr_error);
  return true;
}

function txr_throw_at(error: string, tk: token): boolean {
  if (tk[0] === txr_token.eof) return txr_throw(error, '<EOF>');
  return txr_throw(error, tk[1]);
}

function txr_parse(src: string): boolean {
  const out = txr_parse_tokens;
  out.length = 0; //Clears the array

  src = src.replace(/\s/g,'');
  let i = 0;
  while (i < src.length) {
    const start = i;
    let char  = src[i++];

    switch (char) {
      case '(': out.push([txr_token.par_open, start]); break; //TODO: Attempt to use Algebraic DataTypes instead
      case ')': out.push([txr_token.par_close, start]); break;

      // Anatomy of a Token
      // [TOKEN_TYPE, TOKEN_POS, TOKEN_VALUE]
      // TOKEN_TYPE   —— Could be Operator, Identifier, Number, etc.
      // TOKEN_POS    —— The Token's position in the source code for error checking
      // TOKEN_VALUE  —— The value of the token if applicable, e.g. the operator type, or a Number or String value
      case '+': out.push([txr_token.op, start, txr_op.add]); break;
      case '-': out.push([txr_token.op, start, txr_op.sub]); break;
      case '*': out.push([txr_token.op, start, txr_op.mul]); break;
      case '/': out.push([txr_token.op, start, txr_op.fdiv]); break;
      case '%': out.push([txr_token.op, start, txr_op.fmod]); break;

      default: {
        const isDigit = (char: string): boolean => /[0-9]/.test(char);


        if (isDigit) {
          while (i < src.length) {
            char = src[i];
            if (!isDigit(char)) break;
            i++;
          }
          const val = parseInt(src.slice(start, i));
          out.push([txr_token.number, start, val]);
        } else if (/[a-zA-Z_]/.test(char)) { //Could be neater
          console.log('Hello');
          while (i < src.length) {
            char = src[i];
            if (/[a-zA-Z_0-9]/.test(char)) i++;
            else break;
          }
          const name = src.slice(start, i);
          console.log(name)
          switch (name) {
            case 'mod': out.push([txr_token.op, start, txr_op.fmod]); break;
            case 'div': out.push([txr_token.op, start, txr_op.fdiv]); break;
            default: out.push([txr_token.ident, start, name]); break;
          }
        } else {
          out.length = 0;
          return txr_throw(`Unexpected character "${char}"`, start);
        }
      } break;
    }
  }

  out.push([txr_token.eof, src.length]);

  if (txr_log) {
    console.log('TOKENS:');
    console.group();
      console.log(txr_print_tokens(txr_parse_tokens));
    console.groupEnd();
  }

  return false;
}

function txr_build(): boolean {
  txr_build_pos = 0;
  if (txr_build_expr(0)) return true;
  if (txr_build_pos < txr_parse_tokens.length - 1) return txr_throw_at('Trailing data', txr_parse_tokens[txr_build_pos]);

  if (txr_log) {
    console.log('AST:');
    console.group();
      console.dir(txr_print_ast(txr_build_node), {depth: null});
    console.groupEnd();
  }

  return false;
}

function txr_build_expr(flags: number): boolean {
  let tk = txr_parse_tokens[txr_build_pos++];

  switch (tk[0]) {

    // Anatomy of an AST Node
    // [NODE_TYPE, TOKEN_POS, ??????]
    // NODE_TYPE    —— Similar to token type, however Parens form expressions which themselves form child nodes
    // TOKEN_POS    —— The position of the token that became this node for error handling
    // NODE_VALUE   —— A singular value e.g. a number????
    // NODE_VALUE2  —— Either another value, or further nodes?????

    case txr_token.number: txr_build_node = [txr_node.number, tk[1], tk[2]]; break;
    case txr_token.ident:  txr_build_node = [txr_node.ident, tk[1], tk[2]]; break;
    case txr_token.par_open:
      if (txr_build_expr(0)) return true;
      tk = txr_parse_tokens[txr_build_pos++];
      if (tk[0] !== txr_token.par_close) return txr_throw_at(`Expected a ')'`, tk);
      break;

    case txr_token.op:
      switch (tk[2]) {
        case txr_op.add:
          if (txr_build_expr(txr_build_flag.no_ops)) return true;
          break;
        
        case txr_op.sub:
          if (txr_build_expr(txr_build_flag.no_ops)) return true;
          txr_build_node = [txr_node.unop, tk[1], txr_unop.negate, txr_build_node];
          break;
        
        default: return txr_throw_at('Unexpected Token', tk);
      }
      break;

    default: return txr_throw_at('Unexpected Token', tk);
  }

  if ((flags & txr_build_flag.no_ops) === 0) {
    tk = txr_parse_tokens[txr_build_pos];
    if (tk[0] === txr_token.op) {
      txr_build_pos++;
      if (txr_build_ops(tk)) return true;
    }
  }

  return false;
}

function txr_build_ops(first: token): boolean {
  let tk: token;
  const nodes = [txr_build_node];
  const ops = [first];

  while (true) {
    if (txr_build_expr(txr_build_flag.no_ops)) return true;

    nodes.push(txr_build_node);
    tk = txr_parse_tokens[txr_build_pos];

    if (tk[0] !== txr_token.op) break;

    txr_build_pos++;
    ops.push(tk);

    //if (txr_log) console.log(nodes, ops);
  }
  const pmax = (txr_op.maxp >> 4);
  let pri = 0;
  while (pri < pmax) {
    for (let i = 0; i < ops.length; i++) {
      tk = ops[i];
      const op_pri = (typeof tk[2] === 'number' ? tk[2] : -99);
      if (op_pri === -99) return txr_throw_at('Illegitmate operator priority', tk);
      
      if ((op_pri >> 4) !== pri) continue;
      nodes[i] = [txr_node.binop, tk[1], tk[2], nodes[i], nodes[i + 1]];
      nodes.splice(i + 1, 1);
      ops.splice(i, 1);
      i--;
    }
    pri++;
  }
  txr_build_node = nodes[0];

  // console.log('NODES:');
  // console.group();
  //   console.log(nodes);
  // console.groupEnd();

  // console.log('OPS:');
  // console.group();
  //   console.log(ops);
  // console.groupEnd();
  
  return false;
}

function txr_compile(src: string): action[] | undefined {
  if (txr_parse(src)) return undefined;
  if (txr_build()) return undefined;

  const out = txr_compile_list;
  out.length = 0;
  if (txr_compile_expr(txr_build_node)) return undefined;

  const arr: action[] = [...out];
  out.length = 0;

  if (txr_log) {
    console.log('BYTECODE:');
    console.group();
      console.log(txr_print_bytecode(arr))
    console.groupEnd();
  }
  return arr;
}

function txr_compile_expr(q: any): boolean { // TODO: remove any
  const out: action[] = txr_compile_list;

  switch (q[0]) {
    case txr_node.number: out.push([txr_action.number, q[1], q[2]]); break;
    case txr_node.ident: out.push([txr_action.ident, q[1], q[2]]); break;

    case txr_node.unop:
      if (txr_compile_expr(q[3])) return true;
      out.push([txr_action.unop, q[1], q[2]]);
      break;
    
    case txr_node.binop:
      if (txr_compile_expr(q[3])) return true;
      if (txr_compile_expr(q[4])) return true;
      out.push([txr_action.binop, q[1], q[2]]);
      break;
    
    default: return txr_throw_at(`Cannot compile node of type ${q[0]}`, q);
  }

  return false;
}

function txr_exec(actions: action[]): any { // TODO: remove any
  const stack: any[] = []; //TODO: remove any
  let i = 0;
  while (i < actions.length) {
    const q = actions[i++];
    switch (q[0]) {
      // Anatomy of Bytecode Action [ACTION_TYPE, ]
      case txr_action.number: stack.push(q[2]); break;
      case txr_action.unop: stack.push(-stack.pop()); break;

      case txr_action.binop:
        const b = stack.pop();
        let a = stack.pop();
        switch (q[2]) {
          case txr_op.add: a += b; break;
          case txr_op.sub: a -= b; break;
          case txr_op.mul: a *= b; break;
          case txr_op.fdiv: a /= b; break;
          case txr_op.fmod: a = (b === 0 ? 0 : a % b); break;
          case txr_op.fdiv: a = (b === 0 ? 0 : Math.floor(a / b)); break;
          default: return txr_exec_exit(`Can't apply operator ${q[2]}`, q);
        }
        stack.push(a);
        break;

      case txr_action.ident: return txr_exec_exit('Variables are not yet implemented', q[2]);

      default: return txr_exec_exit(`Can't run action ${q[0]}`, q);
    }
  }

  const result = stack.pop();
  txr_error = '';

  return result;
}

function txr_print_bytecode(actions: action[]): any { // TODO: remove any
  const result: string[] = [];
  let i = 0;

  let n = 0;
  const push = (val: string): void => {
    result.push(`${n++}: ${val}`);
  }
  while (i < actions.length) {
    const q = actions[i++];
    switch (q[0]) {
      // Anatomy of Bytecode Action [ACTION_TYPE, ]
      case txr_action.number: push(`Push Number ${q[2]} onto stack`); break;
      case txr_action.unop: push(`Push Number -${q[2]} onto stack`); break;
      // case txr_action.unop: stack.push(-stack.pop()); break;

      case txr_action.binop: {
        push('Pop values A and B from stack');
        switch (q[2]) {
          case txr_op.add:  push('Add A to B'); break;
          case txr_op.sub:  push('Subtract B from A'); break;
          case txr_op.mul:  push('Multiply A by B'); break;
          case txr_op.fdiv: push('Divide A by B'); break;
          case txr_op.fmod: push('Get the remainder of dividing A by B'); break;
          case txr_op.fdiv: push('Integer divide A by B'); break;
          default: result.push('UNKNOWN ACTION'); break;
        }
        push('Push result onto stack');
      } break;

      case txr_action.ident: return txr_exec_exit('Variables are not yet implemented', q[2]);

      default: return txr_exec_exit(`Can't run action ${q[0]}`, q);
    }
  }
  push('Pop final result from stack and return')
  return result;
}

function txr_exec_exit(error: string, actn: action): boolean {
  return txr_throw_at(error, actn[1]);
}





txr_log = true;
const src = "2 * (5 + 5) - 1";

const code = txr_compile(src);
if (code) {
  const result = txr_exec(code);
  console.log("RESULT:", result);
}

module.exports = {
  log: txr_log,
  error: txr_error,
  parse: txr_parse,
  compile: txr_compile,
  exec: txr_exec,
}