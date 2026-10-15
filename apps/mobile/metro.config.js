const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Never let Metro read env files: they hold secrets (e.g. .env.icons.local) and would otherwise be
// picked up by the watcher and echoed in transform errors.
const { blockList } = config.resolver;
config.resolver.blockList = [
  ...(Array.isArray(blockList) ? blockList : blockList ? [blockList] : []),
  /\/\.env(\.[^/]*)?$/,
];

// Must stay the outermost wrapper.
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
