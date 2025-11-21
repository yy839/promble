
import { GoogleGenAI, Modality } from "@google/genai";
import { LessonPlan, SearchParams, SubjectType } from "../types";

const getSystemInstruction = (subject: SubjectType) => {
  const isScience = subject === SubjectType.SCIENCE;

  return `
You are a K-6 Education Expert & SVG Physics Engine. Create a lesson plan in JSON.

**Rules:**
1. Phases: Activation -> Conflict -> Scaffolding -> Internalization.
2. Language: Chinese (Simple, Warm).
3. **Subject Handling:**
   - **ARTS (文科):** Include "scenario" (vivid scene ~60 words) AND "visualData" (Mind Map).
   - **SCIENCE (理科):** 
     1. "visualData" in steps MUST be a **Logic Flowchart** (Structure).
     2. You MUST generate "simulationData" at the ROOT level.
     
     **PHYSICS LOGIC VALIDATOR (CRITICAL):**
     - **Comparison Rule:** If Object A is physically "Faster" than Object B, Object A's 'duration' MUST be SMALLER than Object B's.
     - **Water Flow (流水):** 
        - Downstream (顺流) = FAST (Duration: ~2-3s, Easing: 'linear').
        - Upstream (逆流) = SLOW (Duration: ~6-8s, Easing: 'linear').
     - **Gravity/Slope (坡度):**
        - Steep/Cycloid Curve = FASTEST (Duration: ~2s, Easing: 'easeIn').
        - Straight Slope = MEDIUM (Duration: ~4s, Easing: 'easeIn').
        - Flat Surface = SLOWEST or Stops (Easing: 'easeOut').
     - **Friction (摩擦力):**
        - Smooth Surface (Ice) = FAST (Duration: ~2s).
        - Rough Surface (Sand) = SLOW (Duration: ~6s).

     **Simulation Canvas Specs:**
     - 100x60 coordinate system (viewBox -10 -10 120 80).
     - **Colors (SCI Palette):**
       - #1e3a8a (Navy) - Static structures, axes.
       - #0e7490 (Teal) - Comparison paths.
       - #f59e0b (Amber) - Active object 1.
       - #64748b (Slate) - Active object 2 (Comparison).

**Output JSON Structure:**
{
  "topic": "string",
  "grade": "string",
  "subject": "string",
  "summary": "string",
  ${isScience ? `"simulationData": {
    "title": "Experiment Name",
    "description": "Short explanation.",
    "elements": [
       { "id": "river_flow", "type": "path", "d": "M10,30 L90,30", "color": "#e2e8f0", "label": "River" },
       { "id": "boat_fast", "type": "circle", "r": 4, "color": "#f59e0b", "x": 10, "y": 25, "label": "Downstream (顺流)" },
       { "id": "boat_slow", "type": "circle", "r": 4, "color": "#64748b", "x": 10, "y": 35, "label": "Upstream (逆流)" }
    ],
    "animations": [
       { "targetId": "boat_fast", "action": "moveTo", "toX": 90, "toY": 25, "duration": 3, "delay": 0, "easing": "linear" },
       { "targetId": "boat_slow", "action": "moveTo", "toX": 60, "toY": 35, "duration": 8, "delay": 0, "easing": "linear" }
    ]
  },` : ''}
  "steps": [
    {
      "stepNumber": 1,
      "phaseName": "Activation",
      "cognitiveGoal": "...",
      "teacherScript": "...",
      "studentExpectedResponse": "...",
      ${!isScience ? '"scenario": "Scene description...",' : ''}
      "visualData": {
        "type": "${isScience ? 'flowchart' : 'mindmap'}",
        "nodes": [{ "id": "1", "label": "Concept", "group": 1 }],
        "links": []
      }
    }
  ]
}`;
};

export const generateLessonPlan = async (params: SearchParams): Promise<LessonPlan> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY is missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Create Scaffolding Lesson for:
    Grade: ${params.grade}
    Subject: ${params.subject}
    Concept: "${params.concept}"
    
    Generate 4 steps.
    ${params.subject === SubjectType.SCIENCE 
      ? 'For Science: Provide a Logic Flowchart inside steps. CRITICAL: Generate a high-quality "simulationData" at the root. Strictly follow the PHYSICS LOGIC VALIDATOR rules for realistic durations.' 
      : 'For Arts: Provide a Scenario description and a Mind Map inside steps.'}
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction: getSystemInstruction(params.subject),
      responseMimeType: "application/json",
      temperature: 0.3, // Lower temperature for more consistent logic
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as LessonPlan;
  }
  
  throw new Error("Failed to generate content");
};

// --- TTS Logic ---

export const generateSpeech = async (text: string, character: 'cute' | 'donald'): Promise<AudioBuffer> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API_KEY is missing");
  
    const ai = new GoogleGenAI({ apiKey });
    
    // Voice Mapping
    // Puck: Higher pitched, energetic (Good for 'Cute')
    // Fenrir: Deeper, rougher (Closest approximation to a 'character' voice like Donald, though not exact)
    const voiceName = character === 'cute' ? 'Puck' : 'Fenrir';
  
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName },
            },
        },
      },
    });
  
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");

    // Decode logic
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    const audioBuffer = await decodeAudioData(
      decode(base64Audio),
      outputAudioContext,
      24000,
      1
    );
    
    return audioBuffer;
};

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
