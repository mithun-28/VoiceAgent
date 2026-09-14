import dotenv from 'dotenv';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {AccessToken,LiveKitAPI,} from 'livekit-server-sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, '..', '.env.local'),
});

const PORT = 3000;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const livekitApi = new LiveKitAPI({host: LIVEKIT_URL,apiKey: LIVEKIT_API_KEY,secret: LIVEKIT_API_SECRET,});

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  throw new Error(
    'Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET in .env.local',
  );
}

const uiDirectory = path.join(__dirname, '..', 'test-ui');

function serveFile(
  res: http.ServerResponse,
  fileName: string,
  contentType: string,
) {
  const filePath = path.join(uiDirectory, fileName);

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(500, {
        'Content-Type': 'text/plain',
      });

      res.end('Failed to load file.');

      return;
    }

    res.writeHead(200, {
      'Content-Type': contentType,
    });

    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {

  // ----------------------------------------
  // Token endpoint
  // ----------------------------------------

  if (req.url === '/token' && req.method === 'GET') {

    try {

      const roomName = `test-room-${Date.now()}`;
      const participantIdentity = 'user-1';
    

      const token = new AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        {
          identity: participantIdentity,
          ttl: '1h',
        },
      );

      token.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: true,
        canSubscribe: true,
      });

      const participantToken =
        await token.toJwt();
    const dispatch = await livekitApi.agentDispatch.createDispatch(roomName,'my-agent',);
    console.log(`Agent dispatched: ${dispatch.id}`,);
    res.writeHead(200, {'Content-Type': 'application/json',});
    res.end(JSON.stringify({serverUrl: LIVEKIT_URL,roomName,participantToken,}),);
      return;

    } catch (error) {

      console.error(error);

      res.writeHead(500, {
        'Content-Type': 'application/json',
      });

      res.end(
        JSON.stringify({
          error: 'Failed to create LiveKit token',
        }),
      );

      return;
    }
  }


  // ----------------------------------------
  // Local testing page
  // ----------------------------------------

  if (req.url === '/' && req.method === 'GET') {

    serveFile(
      res,
      'index.html',
      'text/html; charset=utf-8',
    );

    return;
  }


  // ----------------------------------------
  // JavaScript
  // ----------------------------------------

  if (req.url === '/app.js' && req.method === 'GET') {

    serveFile(
      res,
      'app.js',
      'application/javascript',
    );

    return;
  }


  // ----------------------------------------
  // CSS
  // ----------------------------------------

  if (req.url === '/style.css' && req.method === 'GET') {

    serveFile(
      res,
      'style.css',
      'text/css',
    );

    return;
  }


  // ----------------------------------------
  // Not found
  // ----------------------------------------

  res.writeHead(404, {
    'Content-Type': 'application/json',
  });

  res.end(
    JSON.stringify({
      error: 'Not found',
    }),
  );
});


server.listen(PORT, () => {

  console.log(
    `LiveKit test server running at http://localhost:${PORT}`,
  );

});