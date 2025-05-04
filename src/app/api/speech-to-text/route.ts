import { NextResponse } from 'next/server';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { SpeechClient, protos } from '@google-cloud/speech';
import { IncomingMessage } from 'http';

// Define the runtime to use Node.js for processing uploads
export const runtime = 'nodejs';

// To use formidable with Next.js App Router, we need to disable the default body parser
export const config = {
  api: {
    bodyParser: false,
  },
};

// Define the type for form parsing result
interface ParseFormResult {
  fields: formidable.Fields;
  files: formidable.Files;
}

// This function parses the incoming form data
const parseForm = async (req: IncomingMessage): Promise<ParseFormResult> => {
  return new Promise((resolve, reject) => {
    // Make sure the upload directory exists
    const uploadDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Create formidable form instance
    const form = formidable({
      multiples: true,
      uploadDir: uploadDir,
      keepExtensions: true
    });
    
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });
};

// This function handles the POST request
export async function POST(req: any) {
  try {
    // Parse the form data
    const { fields, files } = await parseForm(req);
    
    // Get the audio file - handle both new and old formidable versions
    const audioFile = files.audio && Array.isArray(files.audio) ? files.audio[0] : files.audio;
    if (!audioFile) {
      throw new Error('No audio file provided');
    }
    
    // Get the user ID
    const userId = fields.userId ? 
      (Array.isArray(fields.userId) ? fields.userId[0] : fields.userId) : 
      null;
    
    // Read the file into a buffer - handle both new and old formidable versions
    const filePath = audioFile.filepath || (audioFile as any).path;
    const audioBuffer = fs.readFileSync(filePath);
    
    // Send the audio data to Google Cloud Speech-to-Text service
    const transcription = await sendToGoogleSpeechToText(audioBuffer, userId);
    
    // Clean up the temporary file
    fs.unlinkSync(filePath);
    
    // Return the transcription
    return NextResponse.json({ 
      success: true, 
      text: transcription 
    });
    
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Failed to process speech to text' },
      { status: 500 }
    );
  }
}

// This function sends the audio to Google Cloud Speech-to-Text service
async function sendToGoogleSpeechToText(audioBuffer: Buffer, userId: any) {
  try {
    // Initialize Google Cloud Speech-to-Text client
    const client = new SpeechClient();
    
    // Configure the request
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    
    const config = {
      encoding: protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    };
    
    const request = {
      audio: audio,
      config: config,
    };
    
    // Log user ID for tracking
    console.log(`Processing audio transcription for user: ${userId}`);
    
    // Make the API call to Google Cloud Speech-to-Text
    const [response] = await client.recognize(request);
    
    // Extract and combine the transcription results
    const transcription = response.results
      ?.map((result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => 
        result.alternatives && result.alternatives.length > 0 
          ? result.alternatives[0].transcript || '' 
          : '')
      .join('\n') || '';
      
    return transcription;
    
  } catch (error) {
    console.error("Google Speech-to-Text service error:", error);
    throw new Error("Failed to transcribe audio");
  }
}