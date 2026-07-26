import crypto from "crypto";

export const encrypt = (text: string) => {
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY || 'a-very-secret-key-that-is-32-bytes-long'), Buffer.from('initialization-vector'));
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decrypt = (encryptedText: string) => {
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY || 'a-very-secret-key-that-is-32-bytes-long'), Buffer.from('initialization-vector'));
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
