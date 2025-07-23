
// Patch pour éviter les erreurs de path.relative avec des valeurs undefined
const originalPath = require('path');

const safePath = {
  ...originalPath,
  relative: (from, to) => {
    // Éviter l'erreur "to argument must be of type string"
    if (typeof from !== 'string') from = '';
    if (typeof to !== 'string') to = '';
    
    // Si l'un des arguments est vide, retourner l'autre ou une chaîne vide
    if (!from && !to) return '';
    if (!from) return to;
    if (!to) return from;
    
    try {
      return originalPath.relative(from, to);
    } catch (error) {
      console.warn('⚠️ Erreur path.relative corrigée:', { from, to });
      return to || from || '';
    }
  }
};

module.exports = safePath;
