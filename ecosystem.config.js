module.exports = {
  apps: [
    {
      name: 'nekofolio-api',

      script: 'dist/src/main.js',

      cwd: '/home/ec2-user/apps/nekofolio-api',

      env_file: '.env',

      instances: 1,

      exec_mode: 'fork',

      autorestart: true,

      watch: false,

      max_memory_restart: '500M',

      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};