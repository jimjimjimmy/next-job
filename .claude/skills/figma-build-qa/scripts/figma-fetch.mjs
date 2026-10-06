#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import https from 'https';
import os from 'os';

const FIGMA_API_HOST = 'api.figma.com';

function expandUser(filePath) {
  if (filePath.startsWith('~')) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

const TOKEN = process.env.FIGMA_TOKEN || fs.readFileSync(expandUser('~/.config/figma/token'), 'utf8').trim();

function request(apiPath) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: FIGMA_API_HOST,
      path: `/v1${apiPath}`,
      method: 'GET',
      headers: {
        'X-Figma-Token': TOKEN,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function parseUrl(figmaUrl) {
  const match = figmaUrl.match(/\/design\/([a-zA-Z0-9]+)/);
  if (!match) throw new Error('Invalid Figma URL');

  const fileKey = match[1];
  const nodeMatch = figmaUrl.match(/node-id=([^&]+)/);
  const nodeId = nodeMatch ? decodeURIComponent(nodeMatch[1]) : null;

  return { fileKey, nodeId };
}

async function fetchNodes(fileKey, nodeId) {
  const encoded = encodeURIComponent(nodeId);
  const apiPath = `/files/${fileKey}/nodes?ids=${encoded}`;
  const result = await request(apiPath);

  if (result.err) throw new Error(`Figma API error: ${result.err}`);

  const node = result.nodes[nodeId];
  if (!node) throw new Error(`Node ${nodeId} not found`);

  console.log(JSON.stringify(node, null, 2));
}

async function fetchImage(fileKey, nodeId) {
  const encoded = encodeURIComponent(nodeId);
  const apiPath = `/images/${fileKey}?ids=${encoded}&format=png`;
  const result = await request(apiPath);

  if (result.err) throw new Error(`Figma API error: ${result.err}`);

  const imageUrl = result.images[nodeId];
  if (!imageUrl) throw new Error('No image URL returned');

  console.log(imageUrl);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  try {
    switch (command) {
      case 'url':
        const { fileKey, nodeId } = await parseUrl(args[0]);
        console.log(JSON.stringify({ fileKey, nodeId }, null, 2));
        break;

      case 'nodes':
        await fetchNodes(args[0], args[1]);
        break;

      case 'image':
        await fetchImage(args[0], args[1]);
        break;

      default:
        console.error(`Usage: figma-fetch <url|nodes|image> [fileKey] [nodeId]`);
        process.exit(1);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
