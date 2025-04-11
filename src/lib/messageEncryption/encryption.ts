import CryptoJS from "crypto-js";

const secretKey: string = process.env.M_KEY || "secretKey";

// Encrypt message
export const encryptMessage = (message: string) => {
    // Add a prefix to clearly identify encrypted content
    const prefixedMessage = `ENCRYPTED:${message}`;
    return CryptoJS.AES.encrypt(prefixedMessage, secretKey).toString();
};

// Decrypt message
export const decryptMessage = (cipherText: string) => {
    try {
        // Check if the string is empty or not a valid input
        if (!cipherText || typeof cipherText !== 'string') {
            return cipherText;
        }
        
        // Add a simple validation to check if the input looks like an encrypted string
        if (!cipherText.match(/^[A-Za-z0-9+/=]+$/)) {
            return cipherText; // Not a valid Base64 string, likely not encrypted
        }
        
        // Check if bytes actually has content before trying to decode
        const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
        if (bytes.sigBytes <= 0) {
            return cipherText; // No valid decrypted content
        }
        
        // Safely try to convert to UTF-8, handle errors specifically
        try {
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            
            // If decryption resulted in an empty string, it might not have been encrypted
            if (!decrypted) {
                return cipherText;
            }
            
            // Check for our encryption prefix
            if (decrypted.startsWith('ENCRYPTED:')) {
                return decrypted.substring(10); // Remove the prefix
            }
            
            // No prefix found - handle old messages that might not have it
            return decrypted;
        } catch (utf8Error) {
            console.error("UTF-8 decoding error:", utf8Error);
            return cipherText;
        }
    } catch (error) {
        console.error("Decryption error:", error);
        // Return the original text if decryption fails
        return cipherText;
    }
};
