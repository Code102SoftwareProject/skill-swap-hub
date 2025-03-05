import CryptoJS from "crypto-js";

const secretKey: string = process.env.M_KEY || "secretKey";

// Encrypt message
export const encryptMessage = (message: string) => {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
};

// Decrypt message
export const decryptMessage = (cipherText: string) => {
    try {
        // Check if the string is empty or not a valid input
        if (!cipherText || typeof cipherText !== 'string') {
            return cipherText;
        }
        
        const bytes = CryptoJS.AES.decrypt(cipherText, secretKey);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        
        // If decryption resulted in an empty string, it might not have been encrypted
        if (!decrypted) {
            return cipherText;
        }
        
        return decrypted;
    } catch (error) {
        console.error("Decryption error:", error);
        // Return the original text if decryption fails
        return cipherText;
    }
};
