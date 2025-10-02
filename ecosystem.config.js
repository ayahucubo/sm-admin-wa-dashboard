module.exports = {
  apps: [
    {
      name: 'sm-admin-wa-dashboard',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/sm-admin-wa-new',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/var/www/logs/sm-admin-error.log',
      out_file: '/var/www/logs/sm-admin-out.log',
      log_file: '/var/www/logs/sm-admin-combined.log',
      time: true,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: '.env.production'
    }
  ]
};