const dotaconstantsProvider = require('./dotaconstantsProvider');
const datawrapperProvider = require('./datawrapperProvider');

function getConfiguredProviderName(env = process.env) {
  return String(env.DOTA_DATA_PROVIDER || 'dotaconstants').trim().toLowerCase();
}

function getActiveDataProvider(env = process.env) {
  const providerName = getConfiguredProviderName(env);
  if (providerName === 'dotaconstants') {
    return dotaconstantsProvider;
  }

  if (providerName === 'datawrapper') {
    return datawrapperProvider;
  }

  throw new Error(`Unsupported DOTA_DATA_PROVIDER: ${providerName}`);
}

module.exports = {
  getActiveDataProvider,
  getConfiguredProviderName
};
