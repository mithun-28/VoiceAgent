import {
  AgentSessionEventTypes,
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
  waitForParticipant,
} from '@livekit/agents';
import { audioEnhancement } from '@livekit/plugins-ai-coustics';
import { RoomEvent } from '@livekit/rtc-node';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
// import * as openai from '@livekit/agents-plugin-openai';
// import * as sarvam from '@livekit/agents-plugin-sarvam';

import { createAgent } from './agent.ts';
import { connectMongo } from './db/client.ts';
import { appendTurn, endSession, startSession } from './db/sessions.ts';

// --------------------------------------------------
// Load environment variables
// --------------------------------------------------

dotenv.config({
  path: '.env.local',
});

// --------------------------------------------------
// Sarvam API key
// --------------------------------------------------

const sarvamApiKey = process.env.sarvam_api_key;

if (!sarvamApiKey) {
  throw new Error('Missing sarvam_api_key in .env.local');
}

// --------------------------------------------------
// Max Agent
// --------------------------------------------------

export default defineAgent({
  entry: async (ctx) => {
    console.log('');
    console.log('======================================');
    console.log('Starting Max agent...');
    console.log('======================================');

    // ------------------------------------------------
    // Connect to LiveKit room
    // ------------------------------------------------

    await ctx.connect();

    console.log(`[LiveKit] Connected to room: ${ctx.room.name}`);

    // ------------------------------------------------
    // Each job runs in its own process — make sure
    // THIS process has a Mongo connection before we
    // touch sessions/memories, instead of assuming
    // main()'s connectMongo() finished in time.
    // ------------------------------------------------

    await connectMongo();

    // ------------------------------------------------
    // Wait for the user
    // ------------------------------------------------

    const user = await waitForParticipant({
      room: ctx.room,
      includeLocal: false,
    });

    const userId = user.identity;

    console.log(`[Memory] User identity: ${userId}`);

    // ------------------------------------------------
    // Open the session-memory record for this call
    // ------------------------------------------------

    // const sessionId = ctx.room.name;

    // await startSession(userId, sessionId);

    const sessionId = ctx.room.name;
    if (!sessionId) {
      throw new Error('[Session] LiveKit room name is missing.');
    }
    await startSession(userId, sessionId);
    console.log(`[Session] Started ${sessionId} for ${userId}`);
    ctx.room.on(RoomEvent.Disconnected, () => {
      endSession(sessionId).catch((error) => {
        console.error('[Session] Failed to close session:', error);
      });

      console.log(`[Session] Ended ${sessionId}`);
    });

    // ------------------------------------------------
    // Create AgentSession
    // ------------------------------------------------

    const session = new voice.AgentSession({
      // =================================================
      // CURRENT TESTING PIPELINE
      // =================================================
      //
      // LiveKit Inference
      //
      // No Google API key required here.
      //
      // =================================================

      stt: new inference.STT({
        model: 'deepgram/nova-3',
        language: 'en',
      }),

      llm: new inference.LLM({
        model: 'google/gemma-4-31b-it',
        modelOptions: {
          temperature: 0.4,
          max_completion_tokens: 500,
        },
      }),

      tts: new inference.TTS({
        model: 'inworld/inworld-tts-2',
        voice: 'Ashley',
      }),

      // =================================================
      // FINAL SARVAM PIPELINE
      // =================================================
      //
      // Keep this commented during testing.
      //
      // Uncomment these three and comment the
      // LiveKit Inference versions above when you
      // switch to Sarvam.
      //
      // =================================================

      /*
      stt: new sarvam.STT({
        languageCode: 'unknown',
        model: 'saaras:v3',
        mode: 'transcribe',
        apiKey: sarvamApiKey,
      }),

      llm: new openai.LLM({
        model: 'sarvam-105b-conversations',
        baseURL: 'https://api.sarvam.ai/v1',
        apiKey: sarvamApiKey,
        temperature: 0.7,
      }),

      tts: new sarvam.TTS({
        model: 'bulbul:v3',
        targetLanguageCode: 'ta-IN',
        speaker: 'shreya',
        pace: 1.0,
        temperature: 0.6,
        apiKey: sarvamApiKey,
      }),
      */

      // ------------------------------------------------
      // Turn handling
      // ------------------------------------------------

      turnHandling: {
        turnDetection: new inference.TurnDetector({
          version: 'v1-mini',
        }),

        interruption: {
          mode: 'adaptive',
        },

        preemptiveGeneration: {
          enabled: true,
        },
      },

      expressive: true,
    });

    // ------------------------------------------------
    // Record each turn into session memory
    // ------------------------------------------------

    session.on(AgentSessionEventTypes.ConversationItemAdded, (ev) => {
      if (ev.item.type !== 'message') {
        return;
      }

      appendTurn(sessionId, ev.item.role, ev.item.textContent ?? '').catch((error) => {
        console.error('[Session] Failed to save turn:', error);
      });
    });

    // ------------------------------------------------
    // Start session
    // ------------------------------------------------

    await session.start({
      agent: createAgent(userId),

      room: ctx.room,

      inputOptions: {
        audioEnabled: true,

        textEnabled: true,

        participantIdentity: userId,

        noiseCancellation: audioEnhancement({
          model: 'quailVfS',
        }),

        // ------------------------------------------------
        // Explicit text handler
        // ------------------------------------------------

        textInputCallback: async (session, event) => {
          const text = event.text.trim();

          if (!text) {
            return;
          }

          console.log(`[Text Input] ${event.participantIdentity ?? userId}: ${text}`);

          await session.interrupt();

          session.generateReply({
            userInput: text,
          });
        },
      },
    });

    console.log('[Agent] Session started successfully.');

    // ------------------------------------------------
    // Initial greeting
    // ------------------------------------------------

    session.generateReply({
      instructions: 'Greet the user briefly and introduce yourself as Max Mayfield.',
    });
  },
});

// --------------------------------------------------
// Start Max
// --------------------------------------------------

async function main() {
  try {
    console.log('[MongoDB] Connecting...');

    await connectMongo();

    console.log('[MongoDB] Ready.');

    console.log('[LiveKit] Starting worker...');

    await cli.runApp(
      new ServerOptions({
        agent: fileURLToPath(import.meta.url),

        agentName: 'my-agent',
      }),
    );
  } catch (error) {
    console.error('[Startup] Failed to start Max:', error);

    process.exit(1);
  }
}

main();
