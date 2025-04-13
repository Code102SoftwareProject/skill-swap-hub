import CryptoJS from "crypto-js";

/**
 * Secret key used for encryption/decryption.
 * SECURITY NOTE: Ideally, this should be stored in environment variables,
 * with a strong randomly generated value in production.
 */
const secretKey: string = process.env.M_KEY || "secretKey";

/**
 * Encrypts a message using AES encryption.
 * 
 * @param message - The plaintext message to encrypt
 * @returns Base64-encoded encrypted string
 * 
 * The function adds a prefix to the message before encryption to allow
 * verification during decryption that the content was properly encrypted.
 */
export const encryptMessage = (message: string) => {
    // Add a prefix to clearly identify encrypted content when decrypted
    const prefixedMessage = `ENCRYPTED:${message}`;
    // Use AES encryption and return the Base64-encoded result
    return CryptoJS.AES.encrypt(prefixedMessage, secretKey).toString();
};

/**
 * Decrypts an encrypted message.
 * 
 * @param cipherText - The encrypted text to decrypt
 * @returns The decrypted message or the original input if decryption fails
 * 
 * This function includes multiple validations to safely handle various edge cases:
 * - Invalid inputs (empty strings, non-strings)
 * - Non-encrypted content mistakenly passed to the function
 * - Corrupted encrypted data
 */
export const decryptMessage = (cipherText: string) => {
    try {
        // Check if the input is valid (not empty and is a string)
        if (!cipherText || typeof cipherText !== 'string') {
            // Return the original input if validation fails
            return cipherText;
        }
        
        // Validate the input format - encrypted content should be Base64
        // This prevents unnecessary decryption attempts on plaintext
        if (!cipherText.match(/^[A-Za-z0-9+/=]+$/)) {
            return cipherText; // Not a valid Base64 string, likely not encrypted
        }
        
        // Attempt to decrypt the cipherText
        const wordArray = CryptoJS.AES.decrypt(cipherText, secretKey);
        
        // Verify that decryption produced actual content
        if (wordArray.sigBytes <= 0) {
            return cipherText; // No valid decrypted content, return original
        }
        
        // Convert the decrypted bytes to a UTF-8 string
        try {
            const decrypted = wordArray.toString(CryptoJS.enc.Utf8);
            
            // If conversion resulted in an empty string, likely not properly encrypted
            if (!decrypted) {
                return cipherText;
            }
            
            // Verify our encryption prefix is present (confirms this was encrypted by our system)
            if (decrypted.startsWith('ENCRYPTED:')) {
                return decrypted.substring(10); // Remove the prefix and return actual message
            }
            
            // Handle legacy data that might not have the prefix
            return decrypted;
        } catch (utf8Error) {
            // Log specific UTF-8 decoding errors for debugging
            // console.error("UTF-8 decoding error:", utf8Error);
            return cipherText;
        }
    } catch (error) {
        // Catch and log any other decryption errors
        // console.error("Decryption error:", error);
        // Return the original input if any part of decryption fails
        return cipherText;
    }
};
