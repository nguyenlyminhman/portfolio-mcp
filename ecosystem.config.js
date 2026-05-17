module.exports = {
  apps: [
    {
      name: 'nekofolio-api',

      script: 'dist/src/main.js',

      cwd: '/home/ec2-user/apps/nekofolio-api',

      // Đọc .env từ thư mục gốc của app
      env_file: '.env',

      instances: 1,

      // fork phù hợp với 1 instance; chuyển sang cluster nếu scale sau này
      exec_mode: 'fork',

      autorestart: true,

      // Tự restart nếu app crash, với delay tăng dần để tránh restart loop
      restart_delay: 3000,
      max_restarts: 10,

      watch: false,

      max_memory_restart: '500M',

      // Graceful shutdown: cho phép app hoàn thành request đang xử lý
      // trước khi PM2 kill process (dùng cho zero-downtime reload)
      kill_timeout: 5000,
      listen_timeout: 8000,

      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },

      // Cấu hình log — giúp debug khi health check fail sau deploy
      out_file: '/home/ec2-user/logs/nekofolio-api/out.log',
      error_file: '/home/ec2-user/logs/nekofolio-api/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Tự rotate log để tránh file quá lớn (cần cài pm2-logrotate)
      // pm2 install pm2-logrotate
    },
  ],
};