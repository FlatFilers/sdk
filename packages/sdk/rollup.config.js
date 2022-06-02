const injectProcessEnv = require('rollup-plugin-inject-process-env');
const { terser } = require('rollup-plugin-terser');

module.exports = (config) => {
  config.plugins = [
    ...config.plugins,
    injectProcessEnv({
      API_URL: process.env.API_URL,
      MOUNT_URL: process.env.MOUNT_URL,
    }),
    terser(),
  ];

  config.output.entryFileNames = '[name].js';
  // // https://rollupjs.org/guide/en/#external
  // // https://github.com/nrwl/nx/blob/703725491170af51afd8f4b8868a38a88af46b7f/packages/web/src/builders/package/package.impl.ts#L254https://github.com/nrwl/nx/blob/703725491170af51afd8f4b8868a38a88af46b7f/packages/web/src/builders/package/package.impl.ts#L254
  config.external = [];

  return config;
};
