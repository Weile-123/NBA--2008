const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_TIMEOUT = 120000;
const CREDENTIALS_PATH = process.env.CLOUDBASE_CREDENTIALS_PATH
  ? path.resolve(process.env.CLOUDBASE_CREDENTIALS_PATH)
  : path.join(ROOT, 'credentials.json');

class CloudBaseMcpClient {
  constructor(command = process.env.CLOUDBASE_MCP_BIN || (() => {
    const localCommand = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'cloudbase-mcp.cmd' : 'cloudbase-mcp');
    return fs.existsSync(localCommand) ? localCommand : 'cloudbase-mcp';
  })()) {
    this.command = command;
    this.nextId = 1;
    this.pending = new Map();
    this.stdoutBuffer = '';
  }

  async start() {
    const useShell = process.platform === 'win32' && /\.(cmd|bat)$/i.test(this.command);
    this.child = spawn(this.command, [], {
      cwd: ROOT,
      env: process.env,
      shell: useShell,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    this.child.stdout.setEncoding('utf8');
    this.child.stdout.on('data', (chunk) => this.onStdout(chunk));
    this.child.stderr.setEncoding('utf8');
    this.child.stderr.on('data', (chunk) => {
      if (process.env.CLOUDBASE_MCP_DEBUG === '1') process.stderr.write(chunk);
    });
    this.child.on('error', (error) => this.rejectAll(error));
    this.child.on('exit', (code) => this.rejectAll(new Error(`CloudBase MCP 已退出（${code}）`)));

    await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'legendary-career-deployer', version: '1.0.0' },
    });
    this.notify('notifications/initialized', {});
    return this;
  }

  onStdout(chunk) {
    this.stdoutBuffer += chunk;
    while (true) {
      const newline = this.stdoutBuffer.indexOf('\n');
      if (newline < 0) break;
      const line = this.stdoutBuffer.slice(0, newline).trim();
      this.stdoutBuffer = this.stdoutBuffer.slice(newline + 1);
      if (!line) continue;
      let message;
      try { message = JSON.parse(line); } catch { continue; }
      if (message.id == null || !this.pending.has(message.id)) continue;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      clearTimeout(pending.timer);
      if (message.error) pending.reject(new Error(message.error.message || JSON.stringify(message.error)));
      else pending.resolve(message.result);
    }
  }

  rejectAll(error) {
    for (const pending of this.pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pending.clear();
  }

  send(message) {
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  request(method, params = {}, timeout = DEFAULT_TIMEOUT) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} 调用超时`));
      }, timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.send({ jsonrpc: '2.0', id, method, params });
    });
  }

  notify(method, params = {}) {
    this.send({ jsonrpc: '2.0', method, params });
  }

  listTools() {
    return this.request('tools/list');
  }

  callTool(name, args, timeout = DEFAULT_TIMEOUT) {
    return this.request('tools/call', { name, arguments: args }, timeout);
  }

  async login() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const result = await this.callTool('auth', {
      action: 'login_by_api_key',
      apiKey: credentials.apiKey,
      apiKeyEnvId: credentials.envId,
    });
    if (result?.isError) throw new Error(readToolText(result) || 'CloudBase MCP 鉴权失败');
  }

  close() {
    if (!this.child) return;
    this.child.stdin.end();
    setTimeout(() => this.child?.kill(), 300).unref();
  }
}

function readToolText(result) {
  return (result?.content || []).filter((item) => item.type === 'text').map((item) => item.text).join('\n');
}

async function createClient() {
  return new CloudBaseMcpClient().start();
}

async function cli() {
  const client = await createClient();
  try {
    if (process.argv[2] === 'call') {
      await client.login();
      const result = await client.callTool(process.argv[3], JSON.parse(process.argv[4] || '{}'));
      process.stdout.write(`${readToolText(result) || JSON.stringify(result, null, 2)}\n`);
      if (result?.isError) process.exitCode = 1;
      return;
    }
    const tools = await client.listTools();
    const requested = new Set(process.argv.slice(2));
    const selected = (tools.tools || []).filter((tool) => requested.size === 0 || requested.has(tool.name));
    const compact = process.env.CLOUDBASE_MCP_SCHEMA_SUMMARY === '1';
    const output = selected.map(({ name, description, inputSchema }) => compact ? {
      name,
      actions: inputSchema?.properties?.action?.enum || [],
      fields: Object.keys(inputSchema?.properties || {}),
      required: inputSchema?.required || [],
    } : { name, description, inputSchema });
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } finally {
    client.close();
  }
}

module.exports = { createClient, readToolText };

if (require.main === module) {
  cli().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
