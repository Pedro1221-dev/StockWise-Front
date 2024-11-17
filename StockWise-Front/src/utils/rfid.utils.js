// utils/rfid.utils.js

/**
 * Gera uma tag RFID aleatória com o formato KWxxxxxxxx
 * @returns {string} Tag RFID gerada
 */
export function generateRandomTag() {
    const prefix = 'KW';
    const numbers = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + numbers;
}

/**
 * Valida se uma tag RFID está no formato correto
 * @param {string} tag - Tag RFID a validar
 * @returns {boolean} True se válida
 */
export function validateRFIDTag(tag) {
    return /^KW\d{8}$/.test(tag);
}