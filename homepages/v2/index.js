// Aggregates custom homepage configs by language for v2
// Export shape: { [langCode]: { categories, featured, portals?, meme?, ... } }

module.exports = {
  // Use ISO language code keys. Add more languages as needed.
  en: require('./odysee-en.js'),
};

