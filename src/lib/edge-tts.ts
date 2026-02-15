import { w3cwebsocket as W3CWebSocket } from 'websocket';
import { v4 as uuidv4 } from 'uuid';

const EDGE_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=6A5AA1D4EAFF4E9FB37E23D68491D6F4";

export async function generateSpeech(text: string, voice: string = 'hi-IN-MadhurNeural'): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const client = new W3CWebSocket(EDGE_URL);
        const requestIds = uuidv4().replace(/-/g, '');
        const audioChunks: Buffer[] = [];

        client.onopen = () => {
            const config = `X-Timestamp:${new Date().toString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}\r\n`;
            client.send(config);

            const request = `X-RequestId:${requestIds}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${new Date().toString()}Z\r\nPath:ssml\r\n\r\n<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xmlns:mstts='https://www.w3.org/2001/mstts' xml:lang='hi-IN'><voice name='${voice}'>${text}</voice></speak>`;
            client.send(request);
        };

        client.onmessage = (message) => {
            if (typeof message.data === 'string') {
                if (message.data.includes('Path:turn.end')) {
                    client.close();
                    resolve(Buffer.concat(audioChunks));
                }
            } else if (message.data instanceof Buffer) {
                // Binary audio data usually comes with headers. 
                // We need to strip the header? usually Edge TTS sends binary messages that are just audio?
                // Actually the protocol sends some text headers before binary.
                // Detailed implementation usually strips the first 2 bytes or looks for the binary marker.
                // For simplicity, let's look at a simpler npm package or assume standard behavior.

                // Standard Edge TTS binary message structure:
                // 2 bytes: header length (UInt16BE)
                // Header
                // Binary data

                const buffer = message.data as Buffer;
                const headerLength = buffer.readUInt16BE(0);
                const audioData = buffer.subarray(headerLength + 2);
                audioChunks.push(audioData);
            }
        };

        client.onerror = (error) => {
            reject(error);
        };

        client.onclose = () => {
            // resolve(Buffer.concat(audioChunks));
        };
    });
}
