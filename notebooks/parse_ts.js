// parse_ts.js
const { parse } = require('@typescript-eslint/typescript-estree');

const code = process.argv[2];  // Get TypeScript code passed as a command line argument

// Parse the TypeScript code
const ast = parse(code, {
  loc: true,
  range: true,
  comment: true,
  tokens: true,
});

// Output the AST as a JSON string
console.log(JSON.stringify(ast));