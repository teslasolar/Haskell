#!/usr/bin/env node
/*! K:mcptest:1:102:k0:m1t2 !*/
/**
 * MCP Server Test
 * Tests MCP handlers directly without stdio protocol
 */
const MCP = require('./mcp/server.js');

async function test() {
  console.log('MCP Server Test\n');
  let pass = 0, fail = 0;

  const check = (name, ok) => {
    ok ? pass++ : fail++;
    console.log(`${ok ? '✓' : '✗'} ${name}`);
  };

  // Test initialize
  const init = await MCP.handleMessage({ method: 'initialize', id: 1 });
  check('initialize', init.capabilities !== undefined);

  // Test tools/list
  const list = await MCP.handleMessage({ method: 'tools/list', id: 2 });
  check('tools/list', list.tools?.length === 6);

  // Test konomi_block
  const block = await MCP.handleMessage({
    method: 'tools/call',
    params: { name: 'konomi_block', arguments: { x: 1, y: 0, z: 0 } },
    id: 3
  });
  const blockResult = JSON.parse(block.content[0].text);
  check('konomi_block(1,0,0) = meta', blockResult.path === 'meta');

  // Test konomi_block not found
  const block404 = await MCP.handleMessage({
    method: 'tools/call',
    params: { name: 'konomi_block', arguments: { x: 99, y: 99, z: 99 } },
    id: 4
  });
  const block404Result = JSON.parse(block404.content[0].text);
  check('konomi_block(99,99,99) = error', block404Result.error !== undefined);

  // Test haskell_compile (AST)
  const compile = await MCP.handleMessage({
    method: 'tools/call',
    params: { name: 'haskell_compile', arguments: { src: 'double x = x * 2', target: 'ast' } },
    id: 5
  });
  const compileResult = JSON.parse(compile.content[0].text);
  check('haskell_compile (ast)', compileResult.result?.decls?.length > 0);

  // Test konomi_template
  const tmpl = await MCP.handleMessage({
    method: 'tools/call',
    params: { name: 'konomi_template', arguments: { name: 'nav', params: { to: '/test/', label: 'Test' } } },
    id: 6
  });
  const tmplResult = JSON.parse(tmpl.content[0].text);
  check('konomi_template (nav)', tmplResult.html?.includes('href="/test/"'));

  // Test konomi_template (code)
  const code = await MCP.handleMessage({
    method: 'tools/call',
    params: { name: 'konomi_template', arguments: { name: 'code', params: { src: 'main = print 42' } } },
    id: 7
  });
  const codeResult = JSON.parse(code.content[0].text);
  check('konomi_template (code)', codeResult.html?.includes('main = print 42'));

  // Test konomi_template (block)
  const blockTmpl = await MCP.handleMessage({
    method: 'tools/call',
    params: { name: 'konomi_template', arguments: { name: 'block', params: { coord: [1,4,0] } } },
    id: 8
  });
  const blockTmplResult = JSON.parse(blockTmpl.content[0].text);
  check('konomi_template (block)', blockTmplResult.html?.includes('B[1][4][0]'));

  // Test unknown method
  const unknown = await MCP.handleMessage({ method: 'unknown/method', id: 9 });
  check('unknown method → error', unknown.error !== undefined);

  // Summary
  console.log(`\n${pass} passed, ${fail} failed`);
  return fail === 0;
}

test().then(ok => process.exit(ok ? 0 : 1));
