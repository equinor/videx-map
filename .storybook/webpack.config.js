module.exports = ({ config }) => {
  config.module.rules.push({
    test: /\.(ts|tsx)$/,
    use: [
      {
        loader: require.resolve('ts-loader'),
      },
    ],
  });
  config.resolve.extensions.push('.ts', '.tsx');
  config.resolve.extensions.push('.js', '.jsx');
  return config;
  };
