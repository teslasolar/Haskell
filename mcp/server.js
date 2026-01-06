#!/usr/bin/env node
/**
 * KONOMI:HASKELL MCP Server
 * Model Context Protocol for AI agent integration
 */
const fs = require('fs');
const { execSync, spawn } = require('child_process');

const MCP = {
  name: 'konomi-haskell',
  version: '1.0.0',

  // Tool definitions
  tools: [
    {
      name: 'haskell_run',
      description: 'Execute Haskell source code',
      inputSchema: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'Haskell source code' }
        },
        required: ['src']
      }
    },
    {
      name: 'haskell_eval',
      description: 'Evaluate a Haskell expression',
      inputSchema: {
        type: 'object',
        properties: {
          expr: { type: 'string', description: 'Haskell expression' }
        },
        required: ['expr']
      }
    },
    {
      name: 'haskell_type',
      description: 'Get the type of a Haskell expression',
      inputSchema: {
        type: 'object',
        properties: {
          expr: { type: 'string', description: 'Haskell expression' }
        },
        required: ['expr']
      }
    },
    {
      name: 'haskell_compile',
      description: 'Compile Haskell to AST, Core, STG, or assembly',
      inputSchema: {
        type: 'object',
        properties: {
          src: { type: 'string', description: 'Haskell source' },
          target: { type: 'string', enum: ['ast', 'core', 'stg', 'asm'], default: 'ast' }
        },
        required: ['src']
      }
    },
    {
      name: 'konomi_block',
      description: 'Get KONOMI block by 3D coordinate',
      inputSchema: {
        type: 'object',
        properties: {
          x: { type: 'integer' },
          y: { type: 'integer' },
          z: { type: 'integer' }
        },
        required: ['x', 'y', 'z']
      }
    },
    {
      name: 'konomi_template',
      description: 'Render a KONOMI atomic template',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Template name' },
          params: { type: 'object', description: 'Template parameters' }
        },
        required: ['name']
      }
    }
  ],

  // Block coordinate map
  blocks: {
    '0,0,0': { path: 'root', url: '/' },
    '1,0,0': { path: 'meta', url: '/meta/' },
    '1,0,1': { path: 'legend', url: '/legend/' },
    '1,1,0': { path: 'primitives', url: '/primitives/' },
    '1,1,1': { path: 'types', url: '/types/' },
    '1,2,0': { path: 'expressions', url: '/expressions/' },
    '1,2,1': { path: 'lists', url: '/lists/' },
    '1,3,0': { path: 'hof', url: '/hof/' },
    '1,3,1': { path: 'typeclasses', url: '/typeclasses/' },
    '1,4,0': { path: 'monads', url: '/monads/' },
    '1,4,1': { path: 'io', url: '/io/' },
    '1,5,0': { path: 'modules', url: '/modules/' },
    '1,5,1': { path: 'advanced', url: '/advanced/' },
    '3,0,0': { path: 'core', url: '/core/' },
    '3,0,1': { path: 'core/blocks', url: '/core/blocks/' },
    '3,1,0': { path: 'core/templates', url: '/core/templates/' },
    '3,1,1': { path: 'core/compiler', url: '/core/compiler/' },
    '4,0,0': { path: 'api', url: '/api/' },
    '4,0,1': { path: 'cli', url: '/cli/' },
    '4,1,0': { path: 'mcp', url: '/mcp/' }
  },

  // Tool handlers
  handlers: {
    haskell_run: async ({ src }) => {
      const tmp = `/tmp/mcp_${Date.now()}.hs`;
      fs.writeFileSync(tmp, src);
      try {
        const output = execSync(`runghc ${tmp} 2>&1`, { timeout: 30000 }).toString();
        fs.unlinkSync(tmp);
        return { output };
      } catch (e) {
        fs.unlinkSync(tmp);
        return { error: e.message, output: e.stdout?.toString() || '' };
      }
    },

    haskell_eval: async ({ expr }) => {
      try {
        const output = execSync(`ghci -e '${expr.replace(/'/g, "'\"'\"'")}'  2>&1`, { timeout: 10000 }).toString();
        return { value: output.trim(), type: 'inferred' };
      } catch (e) {
        return { error: e.message };
      }
    },

    haskell_type: async ({ expr }) => {
      try {
        const output = execSync(`ghci -e ':t ${expr}' 2>&1`, { timeout: 10000 }).toString();
        return { type: output.trim() };
      } catch (e) {
        return { error: e.message };
      }
    },

    haskell_compile: async ({ src, target = 'ast' }) => {
      if (target === 'ast') {
        return { result: MCP.parse(src) };
      }

      const flags = { core: '-ddump-simpl', stg: '-ddump-stg', asm: '-ddump-asm' };
      const tmp = `/tmp/mcp_${Date.now()}.hs`;
      fs.writeFileSync(tmp, src);
      try {
        const output = execSync(`ghc ${flags[target] || ''} ${tmp} 2>&1`).toString();
        fs.unlinkSync(tmp);
        return { result: output };
      } catch (e) {
        return { error: e.message };
      }
    },

    konomi_block: async ({ x, y, z }) => {
      const key = `${x},${y},${z}`;
      const block = MCP.blocks[key];
      if (block) {
        return { ...block, coord: [x, y, z] };
      }
      return { error: 'Block not found', coord: [x, y, z] };
    },

    konomi_template: async ({ name, params = {} }) => {
      const templates = {
        nav: (p) => `<a href="${p.to}">${p.label}</a>`,
        code: (p) => `<pre>${p.src}</pre>`,
        block: (p) => `<div data-coord="${p.coord}">B[${p.coord.join('][')}]</div>`
      };
      if (templates[name]) {
        return { html: templates[name](params) };
      }
      return { error: `Template not found: ${name}` };
    }
  },

  // Simple parser
  parse(src) {
    const ast = { type: 'Module', decls: [] };
    for (const line of src.split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('--')) continue;
      if (t.startsWith('module ')) ast.name = t.match(/module\s+(\w+)/)?.[1];
      else if (t.startsWith('import ')) ast.decls.push({ type: 'Import', module: t.split(/\s+/)[1] });
      else if (t.includes(' :: ')) {
        const [n, s] = t.split(' :: ');
        ast.decls.push({ type: 'TypeSig', name: n.trim(), sig: s });
      }
      else if (t.includes(' = ')) {
        const [l, r] = t.split(' = ');
        ast.decls.push({ type: 'FnDef', name: l.split(/\s/)[0], body: r });
      }
    }
    return ast;
  },

  // MCP protocol handling
  async handleMessage(msg) {
    const { method, params, id } = msg;

    if (method === 'initialize') {
      return { capabilities: { tools: {} } };
    }
    if (method === 'tools/list') {
      return { tools: MCP.tools };
    }
    if (method === 'tools/call') {
      const handler = MCP.handlers[params.name];
      if (handler) {
        const result = await handler(params.arguments || {});
        return { content: [{ type: 'text', text: JSON.stringify(result) }] };
      }
      return { error: { code: -1, message: 'Unknown tool' } };
    }

    return { error: { code: -32601, message: 'Method not found' } };
  },

  // Start server (stdio)
  start() {
    let buffer = '';

    process.stdin.on('data', async (chunk) => {
      buffer += chunk.toString();

      while (true) {
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd < 0) break;

        const header = buffer.slice(0, headerEnd);
        const lenMatch = header.match(/Content-Length: (\d+)/);
        if (!lenMatch) break;

        const len = parseInt(lenMatch[1]);
        const bodyStart = headerEnd + 4;
        if (buffer.length < bodyStart + len) break;

        const body = buffer.slice(bodyStart, bodyStart + len);
        buffer = buffer.slice(bodyStart + len);

        try {
          const msg = JSON.parse(body);
          const result = await MCP.handleMessage(msg);
          const response = JSON.stringify({ jsonrpc: '2.0', id: msg.id, result });
          process.stdout.write(`Content-Length: ${response.length}\r\n\r\n${response}`);
        } catch (e) {
          const err = JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: e.message } });
          process.stdout.write(`Content-Length: ${err.length}\r\n\r\n${err}`);
        }
      }
    });

    process.stderr.write('KONOMI:HASKELL MCP Server started\n');
  }
};

// Export for testing, start if run directly
if (require.main === module) {
  MCP.start();
}
module.exports = MCP;
