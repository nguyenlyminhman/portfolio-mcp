module.exports = {
  apps: [
    {
      name: 'nekofolio-api',
      script: 'dist/main.js',
      cwd: '/home/ec2-user/apps/nekofolio-api',
      env_file: '.env',
    },
  ],
};