// Steganography utilities for hiding messages in various media types

const DELIMITER = "####END####";

// Simple XOR encryption with password
function encryptMessage(message: string, password: string): string {
  let encrypted = "";
  for (let i = 0; i < message.length; i++) {
    const charCode = message.charCodeAt(i) ^ password.charCodeAt(i % password.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted);
}

function decryptMessage(encrypted: string, password: string): string {
  try {
    const decoded = atob(encrypted);
    let decrypted = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ password.charCodeAt(i % password.length);
      decrypted += String.fromCharCode(charCode);
    }
    return decrypted;
  } catch {
    throw new Error("Decryption failed - invalid key or corrupted data");
  }
}

function stringToBinary(str: string): string {
  return str.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
}

function binaryToString(binary: string): string {
  const bytes = binary.match(/.{1,8}/g) || [];
  return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
}

// ==================== IMAGE STEGANOGRAPHY ====================

export async function encodeImageMessage(
  imageFile: File,
  message: string,
  password: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const encryptedMessage = encryptMessage(message, password);
        const fullMessage = encryptedMessage + DELIMITER;
        const binaryMessage = stringToBinary(fullMessage);

        const maxBits = (data.length / 4) * 3;
        if (binaryMessage.length > maxBits) {
          reject(new Error(`Message too large. Max ${Math.floor(maxBits / 8)} characters.`));
          return;
        }

        let bitIndex = 0;
        for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i += 4) {
          if (bitIndex < binaryMessage.length) {
            data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
            bitIndex++;
          }
          if (bitIndex < binaryMessage.length) {
            data[i + 1] = (data[i + 1] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
            bitIndex++;
          }
          if (bitIndex < binaryMessage.length) {
            data[i + 2] = (data[i + 2] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
            bitIndex++;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

export async function decodeImageMessage(
  imageFile: File,
  password: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let binaryMessage = '';
        for (let i = 0; i < data.length; i += 4) {
          binaryMessage += (data[i] & 1).toString();
          binaryMessage += (data[i + 1] & 1).toString();
          binaryMessage += (data[i + 2] & 1).toString();
        }

        const extractedMessage = binaryToString(binaryMessage);
        const delimiterIndex = extractedMessage.indexOf(DELIMITER);
        
        if (delimiterIndex === -1) {
          reject(new Error('No hidden message found in this image'));
          return;
        }

        const encryptedMessage = extractedMessage.substring(0, delimiterIndex);
        
        try {
          const decryptedMessage = decryptMessage(encryptedMessage, password);
          resolve(decryptedMessage);
        } catch {
          reject(new Error('Invalid decryption key'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

export async function getImageCapacity(imageFile: File): Promise<{ maxChars: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const totalPixels = img.width * img.height;
        const maxBits = totalPixels * 3;
        const maxChars = Math.floor(maxBits / 8) - 50;
        resolve({ maxChars, width: img.width, height: img.height });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}

// ==================== AUDIO STEGANOGRAPHY (WAV) ====================

export async function encodeAudioMessage(
  audioFile: File,
  message: string,
  password: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);
        
        // Verify WAV format
        const riff = String.fromCharCode(dataView.getUint8(0), dataView.getUint8(1), dataView.getUint8(2), dataView.getUint8(3));
        if (riff !== 'RIFF') {
          reject(new Error('Invalid WAV file format'));
          return;
        }

        const encryptedMessage = encryptMessage(message, password);
        const fullMessage = encryptedMessage + DELIMITER;
        const binaryMessage = stringToBinary(fullMessage);

        // Find data chunk offset (usually at 44 for standard WAV)
        let dataOffset = 44;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Check if message fits
        const availableBits = (uint8Array.length - dataOffset);
        if (binaryMessage.length > availableBits) {
          reject(new Error(`Message too large. Max ${Math.floor(availableBits / 8)} characters.`));
          return;
        }

        // Encode message in LSB of audio samples
        for (let i = 0; i < binaryMessage.length; i++) {
          uint8Array[dataOffset + i] = (uint8Array[dataOffset + i] & 0xFE) | parseInt(binaryMessage[i], 2);
        }

        resolve(new Blob([uint8Array], { type: 'audio/wav' }));
      } catch (err) {
        reject(new Error('Failed to process audio file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(audioFile);
  });
}

export async function decodeAudioMessage(
  audioFile: File,
  password: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const dataOffset = 44;
        let binaryMessage = '';
        
        // Extract up to 100000 bits
        const maxBits = Math.min(100000, uint8Array.length - dataOffset);
        for (let i = 0; i < maxBits; i++) {
          binaryMessage += (uint8Array[dataOffset + i] & 1).toString();
        }

        const extractedMessage = binaryToString(binaryMessage);
        const delimiterIndex = extractedMessage.indexOf(DELIMITER);
        
        if (delimiterIndex === -1) {
          reject(new Error('No hidden message found in this audio'));
          return;
        }

        const encryptedMessage = extractedMessage.substring(0, delimiterIndex);
        
        try {
          const decryptedMessage = decryptMessage(encryptedMessage, password);
          resolve(decryptedMessage);
        } catch {
          reject(new Error('Invalid decryption key'));
        }
      } catch (err) {
        reject(new Error('Failed to process audio file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(audioFile);
  });
}

export async function getAudioCapacity(audioFile: File): Promise<{ maxChars: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);
        
        const sampleRate = dataView.getUint32(24, true);
        const dataSize = arrayBuffer.byteLength - 44;
        const duration = dataSize / sampleRate / 2; // Approximate duration
        const maxChars = Math.floor(dataSize / 8) - 50;
        
        resolve({ maxChars, duration });
      } catch {
        reject(new Error('Failed to analyze audio file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(audioFile);
  });
}

// ==================== VIDEO STEGANOGRAPHY ====================

export async function encodeVideoMessage(
  videoFile: File,
  message: string,
  password: string
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 0;
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      const encryptedMessage = encryptMessage(message, password);
      const fullMessage = encryptedMessage + DELIMITER;
      const binaryMessage = stringToBinary(fullMessage);

      const maxBits = (data.length / 4) * 3;
      if (binaryMessage.length > maxBits) {
        reject(new Error(`Message too large. Max ${Math.floor(maxBits / 8)} characters.`));
        return;
      }

      let bitIndex = 0;
      for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i += 4) {
        if (bitIndex < binaryMessage.length) {
          data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
          bitIndex++;
        }
        if (bitIndex < binaryMessage.length) {
          data[i + 1] = (data[i + 1] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
          bitIndex++;
        }
        if (bitIndex < binaryMessage.length) {
          data[i + 2] = (data[i + 2] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
          bitIndex++;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      // Export as PNG (first frame with hidden data)
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create video frame'));
        }
      }, 'image/png');

      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

export async function decodeVideoMessage(
  videoFile: File,
  password: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      video.currentTime = 0;
    };

    video.onseeked = () => {
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let binaryMessage = '';
      for (let i = 0; i < data.length; i += 4) {
        binaryMessage += (data[i] & 1).toString();
        binaryMessage += (data[i + 1] & 1).toString();
        binaryMessage += (data[i + 2] & 1).toString();
      }

      const extractedMessage = binaryToString(binaryMessage);
      const delimiterIndex = extractedMessage.indexOf(DELIMITER);
      
      if (delimiterIndex === -1) {
        URL.revokeObjectURL(video.src);
        reject(new Error('No hidden message found in this video'));
        return;
      }

      const encryptedMessage = extractedMessage.substring(0, delimiterIndex);
      
      try {
        const decryptedMessage = decryptMessage(encryptedMessage, password);
        URL.revokeObjectURL(video.src);
        resolve(decryptedMessage);
      } catch {
        URL.revokeObjectURL(video.src);
        reject(new Error('Invalid decryption key'));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

export async function getVideoCapacity(videoFile: File): Promise<{ maxChars: number; width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');

    video.onloadedmetadata = () => {
      const totalPixels = video.videoWidth * video.videoHeight;
      const maxBits = totalPixels * 3;
      const maxChars = Math.floor(maxBits / 8) - 50;
      resolve({ 
        maxChars, 
        width: video.videoWidth, 
        height: video.videoHeight,
        duration: video.duration
      });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video'));
    };

    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

// ==================== TEXT STEGANOGRAPHY ====================

export function encodeTextMessage(
  originalText: string,
  message: string,
  password: string
): string {
  const encryptedMessage = encryptMessage(message, password);
  const fullMessage = encryptedMessage + DELIMITER;
  const binaryMessage = stringToBinary(fullMessage);
  
  // Convert binary to whitespace (space = 0, tab = 1)
  const hiddenData = binaryMessage.replace(/0/g, ' ').replace(/1/g, '\t');
  
  return originalText + '\n' + hiddenData;
}

export function decodeTextMessage(
  encodedText: string,
  password: string
): string {
  const lines = encodedText.split('\n');
  const hiddenLine = lines[lines.length - 1];
  
  // Convert whitespace back to binary
  const binaryMessage = hiddenLine.replace(/ /g, '0').replace(/\t/g, '1');
  
  const extractedMessage = binaryToString(binaryMessage);
  const delimiterIndex = extractedMessage.indexOf(DELIMITER);
  
  if (delimiterIndex === -1) {
    throw new Error('No hidden message found in this text');
  }

  const encryptedMessage = extractedMessage.substring(0, delimiterIndex);
  
  try {
    return decryptMessage(encryptedMessage, password);
  } catch {
    throw new Error('Invalid decryption key');
  }
}

export function getTextCapacity(text: string): { maxChars: number; wordCount: number } {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  // Unlimited capacity for text steganography (limited only by file size)
  return { maxChars: 10000, wordCount };
}

// ==================== UNIFIED INTERFACE ====================

export type MediaType = 'image' | 'video' | 'audio' | 'text';

export async function encodeMessage(
  file: File | string,
  message: string,
  password: string,
  mediaType: MediaType
): Promise<Blob | string> {
  switch (mediaType) {
    case 'image':
      return encodeImageMessage(file as File, message, password);
    case 'video':
      return encodeVideoMessage(file as File, message, password);
    case 'audio':
      return encodeAudioMessage(file as File, message, password);
    case 'text':
      return encodeTextMessage(file as string, message, password);
    default:
      throw new Error('Unsupported media type');
  }
}

export async function decodeMessage(
  file: File | string,
  password: string,
  mediaType: MediaType
): Promise<string> {
  switch (mediaType) {
    case 'image':
      return decodeImageMessage(file as File, password);
    case 'video':
      return decodeVideoMessage(file as File, password);
    case 'audio':
      return decodeAudioMessage(file as File, password);
    case 'text':
      return decodeTextMessage(file as string, password);
    default:
      throw new Error('Unsupported media type');
  }
}
