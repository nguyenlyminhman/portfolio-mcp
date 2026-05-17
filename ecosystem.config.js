module.exports = {
  apps: [
    {
      name: 'nekofolio-api',

      script: 'dist/src/main.js',

      cwd: '/home/ubuntu/apps/nekofolio-api',

      instances: 1,
      exec_mode: 'fork',

      autorestart: true,

      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};