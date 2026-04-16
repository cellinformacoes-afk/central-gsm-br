const unlocktool = require('./unlocktool');
const androidmultitool = require('./androidmultitool');
const tsmtool = require('./tsmtool');
const tfmtool = require('./tfmtool');
const unlockprice = require('./unlockprice');

const drivers = {
  'UNLOCK TOOL ': unlocktool,
  'UNLOCK TOOL 24H': unlocktool,
  'ANDROID MULTI TOOL': androidmultitool,
  'ANDROID MULTI TOOL 24h': androidmultitool,
  'Android Multi Tool (TESTE)': androidmultitool,
  'TSM TOOL ': tsmtool,
  'TSM TOOL 24h': tsmtool,
  'TFM TOOL': tfmtool,
  'TFM TOOL PRO': tfmtool,
  'UNLOCKPRICE': unlockprice,
};

function getDriver(serviceTitle) {
  const title = serviceTitle.toUpperCase().trim();
  
  if (title.includes('UNLOCK TOOL')) return drivers['UNLOCK TOOL '];
  if (title.includes('ANDROID MULTI TOOL') || title.includes('ANDROIDMULTITOOL')) return drivers['ANDROID MULTI TOOL'];
  if (title.includes('TSM TOOL')) return drivers['TSM TOOL '];
  if (title.includes('TFM TOOL')) return drivers['TFM TOOL'];
  if (title.includes('UNLOCKPRICE')) return drivers['UNLOCKPRICE'];
  
  return drivers[title] || null;
}

module.exports = { getDriver };
