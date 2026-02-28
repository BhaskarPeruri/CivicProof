module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Exclude node_modules from source-map-loader to suppress warnings from
      // third-party packages (e.g. WalletConnect) that reference missing source files
      const sourceMapRule = webpackConfig.module.rules.find(
        (rule) =>
          rule &&
          typeof rule === 'object' &&
          (String(rule.loader || '').includes('source-map-loader') ||
            (rule.use && rule.use.some((u) => String(u.loader || u).includes('source-map-loader'))))
      );
      if (sourceMapRule) {
        sourceMapRule.exclude = /node_modules/;
      }
      return webpackConfig;
    },
  },
};
