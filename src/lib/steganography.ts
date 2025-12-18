// Steganography utilities for hiding messages in images

const DELIMITER = "####END####";

// Simple XOR encryption with password
function encryptMessage(message: string, password: string): string {
  let encrypted = "";
  for (let i = 0; i < message.length; i++) {
    const charCode = message.charCodeAt(i) ^ password.charCodeAt(i % password.length);
    encrypted += String.fromCharCode(charCode);
  }
  return btoa(encrypted); // Base64 encode for safe binary handling
}

function decryptMessage(encrypted: string, password: string): string {
  try {
    const decoded = atob(encrypted); // Base64 decode
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

// Convert string to binary
function stringToBinary(str: string): string {
  return str.split('').map(char => 
    char.charCodeAt(0).toString(2).padStart(8, '0')
  ).join('');
}

// Convert binary to string
function binaryToString(binary: string): string {
  const bytes = binary.match(/.{1,8}/g) || [];
  return bytes.map(byte => String.fromCharCode(parseInt(byte, 2))).join('');
}

// Encode message into image
export async function encodeMessage(
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

        // Encrypt and prepare message
        const encryptedMessage = encryptMessage(message, password);
        const fullMessage = encryptedMessage + DELIMITER;
        const binaryMessage = stringToBinary(fullMessage);

        // Check if image can hold the message
        const maxBits = (data.length / 4) * 3; // RGB channels only (skip alpha)
        if (binaryMessage.length > maxBits) {
          reject(new Error(`Message too large. Max ${Math.floor(maxBits / 8)} characters.`));
          return;
        }

        // Encode message in LSB of RGB channels
        let bitIndex = 0;
        for (let i = 0; i < data.length && bitIndex < binaryMessage.length; i += 4) {
          // Red channel
          if (bitIndex < binaryMessage.length) {
            data[i] = (data[i] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
            bitIndex++;
          }
          // Green channel
          if (bitIndex < binaryMessage.length) {
            data[i + 1] = (data[i + 1] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
            bitIndex++;
          }
          // Blue channel
          if (bitIndex < binaryMessage.length) {
            data[i + 2] = (data[i + 2] & 0xFE) | parseInt(binaryMessage[bitIndex], 2);
            bitIndex++;
          }
          // Skip alpha channel (i + 3)
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

// Decode message from image
export async function decodeMessage(
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

        // Extract bits from LSB of RGB channels
        let binaryMessage = '';
        for (let i = 0; i < data.length; i += 4) {
          binaryMessage += (data[i] & 1).toString();      // Red
          binaryMessage += (data[i + 1] & 1).toString();  // Green
          binaryMessage += (data[i + 2] & 1).toString();  // Blue
        }

        // Convert to string and find delimiter
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

// Get image capacity info
export async function getImageCapacity(imageFile: File): Promise<{ maxChars: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const totalPixels = img.width * img.height;
        const maxBits = totalPixels * 3; // 3 bits per pixel (RGB)
        const maxChars = Math.floor(maxBits / 8) - 50; // Reserve space for delimiter
        resolve({ maxChars, width: img.width, height: img.height });
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(imageFile);
  });
}
