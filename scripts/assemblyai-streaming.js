// AssemblyAI real-time streaming transcription script
// Usage: node scripts/assemblyai-streaming.js
// Requires: npm install assemblyai stream node-record-lpcm16 dotenv

import { Readable } from 'stream';
import { AssemblyAI } from 'assemblyai';
import recorder from 'node-record-lpcm16';
import dotenv from 'dotenv';

dotenv.config(); // Loads .env file into process.env

const run = async () => {
  const apiKey = process.env.ASSEMBLY_AI;
  if (!apiKey) {
    console.error('Error: ASSEMBLY_AI API key not found in environment variables.');
    process.exit(1);
  }

  const client = new AssemblyAI({
    apiKey,
  });

  const transcriber = client.streaming.transcriber({
    sampleRate: 16_000,
    formatTurns: true
  });

  transcriber.on('open', ({ id }) => {
    console.log(`Session opened with ID: ${id}`);
  });

  transcriber.on('error', (error) => {
    console.error('Error:', error);
  });

  transcriber.on('close', (code, reason) =>
    console.log('Session closed:', code, reason),
  );

  transcriber.on('turn', (turn) => {
    if (!turn.transcript) return;
    console.log('Turn:', turn.transcript);
  });

  try {
    console.log('Connecting to streaming transcript service');
    await transcriber.connect();

    console.log('Starting recording');
    const recording = recorder.record({
      channels: 1,
      sampleRate: 16_000,
      audioType: 'wav',
    });

    Readable.toWeb(recording.stream()).pipeTo(transcriber.stream());

    process.on('SIGINT', async function () {
      console.log();
      console.log('Stopping recording');
      recording.stop();

      console.log('Closing streaming transcript connection');
      await transcriber.close();

      process.exit();
    });
  } catch (error) {
    console.error(error);
  }
};

run(); 