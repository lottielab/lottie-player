import { Node, NodeType } from './parser';

export type SymbolMap = {
  [name in string]: number | boolean | ((...args: any) => number | boolean);
};

// @ts-ignore For now only the members of Math are built-in symbols.
const BuiltinSymbols: SymbolMap = Math;

function undefinedSymbol(name: string): never {
  throw new Error(`Symbol ${name} is not defined and not a built in symbol.`);
}

type UnaryOperator = (Node & { type: NodeType.UNARY_OPERATOR })['operator'];
type BinaryOperator = (Node & { type: NodeType.BINARY_OPERATOR })['operator'];

function evaluateUnary(operator: UnaryOperator, operand: number | boolean): number | boolean {
  switch (operator) {
    case '+':
      return +operand;
    case '-':
      return -operand;
    case '!':
      return !operand;
  }
}

function evaluateBinary(
  operator: BinaryOperator,
  left: number | boolean,
  right: number | boolean
): number | boolean {
  switch (operator) {
    case '+':
      // @ts-ignore
      return left + right;
    case '-':
      // @ts-ignore
      return left - right;
    case '*':
      // @ts-ignore
      return left * right;
    case '/':
      // @ts-ignore
      return left / right;
    case '^':
      // @ts-ignore
      return Math.pow(left, right);
    case '<':
      return left < right;
    case '<=':
      return left <= right;
    case '>':
      return left > right;
    case '>=':
      return left >= right;
    case '==':
      return left == right;
    case '&&':
      return left && right;
    case '||':
      return left || right;
  }
}

export function evaluate(expression: Node, userDefinedSymbols: SymbolMap): number | boolean {
  switch (expression.type) {
    case NodeType.NUMBER: {
      return expression.value;
    }

    case NodeType.IDENTIFIER: {
      const name = expression.name;
      const value = userDefinedSymbols[name] ?? BuiltinSymbols[name];
      if (value == undefined) undefinedSymbol(name);

      if (typeof value != 'boolean' && typeof value != 'number') {
        throw new Error(`Symbol ${name} is a function and must be used in a function call.`);
      }

      return value;
    }

    case NodeType.UNARY_OPERATOR: {
      const operand = evaluate(expression.operand, userDefinedSymbols);
      return evaluateUnary(expression.operator, operand);
    }

    case NodeType.BINARY_OPERATOR: {
      const left = evaluate(expression.left, userDefinedSymbols);
      const right = evaluate(expression.right, userDefinedSymbols);
      return evaluateBinary(expression.operator, left, right);
    }

    case NodeType.CONDITIONAL_OPERATOR: {
      const condition = evaluate(expression.condition, userDefinedSymbols);
      return condition
        ? evaluate(expression.thenBranch, userDefinedSymbols)
        : evaluate(expression.elseBranch, userDefinedSymbols);
    }

    case NodeType.FUNCTION_CALL: {
      const name = expression.name;
      const value = userDefinedSymbols[name] ?? BuiltinSymbols[name];
      if (value == undefined) undefinedSymbol(name);

      if (typeof value != 'function') {
        throw new Error(`Symbol ${name} has value ${value} and is not callable.`);
      }

      if (value.length != expression.operands.length) {
        throw new Error(
          `Expected ${value.length} operands for ${name}, received ${expression.operands.length}`
        );
      }

      const operands = expression.operands.map((operand) => evaluate(operand, userDefinedSymbols));

      return value.apply(null, operands);
    }
  }
}
