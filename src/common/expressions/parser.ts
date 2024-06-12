export const enum NodeType {
  NUMBER,
  IDENTIFIER,
  UNARY_OPERATOR,
  BINARY_OPERATOR,
  CONDITIONAL_OPERATOR,
  FUNCTION_CALL,
}

export type Node =
  | {
      type: NodeType.NUMBER;
      value: number;
    }
  | {
      type: NodeType.IDENTIFIER;
      name: string;
    }
  | {
      type: NodeType.UNARY_OPERATOR;
      operator: '+' | '-' | '!';
      operand: Node;
    }
  | {
      type: NodeType.BINARY_OPERATOR;
      operator: '+' | '-' | '*' | '/' | '^' | '<' | '<=' | '>' | '>=' | '==' | '&&' | '||';
      left: Node;
      right: Node;
    }
  | {
      type: NodeType.CONDITIONAL_OPERATOR;
      condition: Node;
      thenBranch: Node;
      elseBranch: Node;
    }
  | {
      type: NodeType.FUNCTION_CALL;
      name: string;
      operands: Node[];
    };

const enum Precedence {
  MINIMUM,
  SEPARATOR,
  LITERAL,
  CONDITIONAL,
  LOGICAL_OR,
  LOGICAL_AND,
  COMPARISON,
  ADDITIVE,
  MULTIPLICATIVE,
  POWER,
  LOGICAL_NEGATION,
  BRACKET,
}

interface Parser {
  peek: () => Token;
  pop: () => Token;
  parse: (minPrecedence: number) => Node;
}

type TokenPrimitive = {
  name: string;
  lbp: number;
  detect?: (s: string) => boolean;
  nud?: (p: Parser, token: Token) => Node;
  led?: (p: Parser, left: Node, token: Token) => Node;
};

type Token = TokenPrimitive & { value: string; position: number };

function parseError(token: Token): never {
  throw new Error(`Unexpected ${token.name} at position ${token.position}.`);
}

const TokenPrimitives = (() => {
  const tokenPrimitives: TokenPrimitive[] = [
    {
      name: 'number',
      lbp: Precedence.LITERAL,
      detect: (s: string) => /^([1-9]\d*|0)(\.\d*)?$/.test(s),
      nud: (_: Parser, token: Token) => ({
        type: NodeType.NUMBER,
        value: parseFloat(token.value),
      }),
    },
    {
      name: 'identifier',
      lbp: Precedence.LITERAL,
      detect: (s: string) => /^[_a-zA-Z][_a-zA-Z0-9]*(\.[a-zA-Z]+)*$/.test(s),
      nud: (_: Parser, token: Token) => ({
        type: NodeType.IDENTIFIER,
        name: token.value,
      }),
    },
    {
      // right associative
      name: '^',
      lbp: Precedence.POWER,
      led: (p: Parser, left: Node) => ({
        type: NodeType.BINARY_OPERATOR,
        operator: '^',
        left,
        right: p.parse(Precedence.POWER - 1),
      }),
    },
    {
      // unary only
      name: '!',
      lbp: Precedence.LOGICAL_NEGATION,
      nud: (p: Parser) => ({
        type: NodeType.UNARY_OPERATOR,
        operator: '!',
        operand: p.parse(Precedence.LOGICAL_NEGATION),
      }),
    },
    {
      name: 'conditional-operator',
      detect: (s: string) => s == '?',
      lbp: Precedence.CONDITIONAL,
      led: (p: Parser, left: Node) => {
        const thenBranch = p.parse(Precedence.CONDITIONAL - 1);
        const nextToken = p.pop();
        if (nextToken.name != ':') parseError(nextToken);
        const elseBranch = p.parse(Precedence.CONDITIONAL - 1);
        return {
          type: NodeType.CONDITIONAL_OPERATOR,
          condition: left,
          thenBranch,
          elseBranch,
        };
      },
    },
    {
      name: '(',
      lbp: Precedence.BRACKET,
      nud: (p: Parser) => {
        const expression = p.parse(Precedence.SEPARATOR);
        const nextToken = p.pop();
        if (nextToken.name != ')') parseError(nextToken);
        return expression;
      },
      led: (p: Parser, left: Node, token: Token) => {
        if (left.type != NodeType.IDENTIFIER) parseError(token);

        const operands: Node[] = [];
        if (p.peek().name == ')') {
          p.pop();
        } else {
          while (true) {
            operands.push(p.parse(Precedence.SEPARATOR));

            const nextToken = p.pop();
            if (nextToken.name == ')') break;
            if (nextToken.name == ',') continue;
            parseError(nextToken);
          }
        }

        return { type: NodeType.FUNCTION_CALL, name: left.name, operands };
      },
    },
    {
      name: 'end of input',
      lbp: Precedence.MINIMUM,
    },
  ];

  for (const operator of ['+', '-'] as const) {
    tokenPrimitives.push({
      name: operator,
      lbp: Precedence.ADDITIVE,
      nud: (p: Parser) => ({
        type: NodeType.UNARY_OPERATOR,
        operator,
        operand: p.parse(Precedence.ADDITIVE),
      }),
      led: (p: Parser, left: Node) => ({
        type: NodeType.BINARY_OPERATOR,
        operator,
        left,
        right: p.parse(Precedence.ADDITIVE),
      }),
    });
  }

  const binaryOperators = [
    ['*', Precedence.MULTIPLICATIVE],
    ['/', Precedence.MULTIPLICATIVE],
    ['<', Precedence.COMPARISON],
    ['<=', Precedence.COMPARISON],
    ['>', Precedence.COMPARISON],
    ['>=', Precedence.COMPARISON],
    ['==', Precedence.COMPARISON],
    ['&&', Precedence.LOGICAL_AND],
    ['||', Precedence.LOGICAL_OR],
  ] as const;
  for (const [operator, precedence] of binaryOperators) {
    tokenPrimitives.push({
      name: operator,
      lbp: precedence,
      led: (p: Parser, left: Node) => ({
        type: NodeType.BINARY_OPERATOR,
        operator,
        left,
        right: p.parse(precedence),
      }),
    });
  }

  for (const separator of [',', ')', ':'] as const) {
    tokenPrimitives.push({
      name: separator,
      lbp: Precedence.SEPARATOR,
    });
  }

  return tokenPrimitives;
})();

function tokenize(input: string): Token[] {
  const isWhitespace = /^\s*$/;
  const segments = input.split(/([+\-*/^(),?:!]|<=|>=|==|>(?!=)|<(?!=)|\|\||&&|\s+)/g);
  segments.push('end of input');

  let position = 0;
  const tokens: Token[] = [];
  for (const segment of segments) {
    const detected = TokenPrimitives.some((tokenPrimitive) => {
      const detect = tokenPrimitive.detect ?? ((s: string) => s == tokenPrimitive.name);
      if (detect(segment)) {
        tokens.push({ ...tokenPrimitive, value: segment, position });
        return true;
      }
    });

    if (!detected && !isWhitespace.test(segment)) {
      throw new Error(`Invalid token ${segment} at position ${position}`);
    }

    position += segment.length;
  }

  return tokens;
}

export function parse(input: string) {
  const tokens = tokenize(input);

  let tokenIndex = 0;

  const parser: Parser = {
    peek: () => tokens[tokenIndex],
    pop: () => tokens[tokenIndex++],
    parse: (minPrecedence) => {
      let currentToken = parser.pop();

      if (!currentToken.nud) parseError(currentToken);
      let left = currentToken.nud(parser, currentToken);

      while (parser.peek().lbp > minPrecedence) {
        currentToken = parser.pop();

        if (!currentToken.led) parseError(currentToken);
        left = currentToken.led(parser, left, currentToken);
      }

      return left;
    },
  };

  return parser.parse(Precedence.MINIMUM);
}
