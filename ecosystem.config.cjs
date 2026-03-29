module.exports = {
  apps: [
    {
      name: 'siken-bot',
      script: 'pnpm',
      args: 'start',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      restart_delay: 5000,
      max_memory_restart: '300M',
      watch: false,
      merge_logs: true,
      out_file: './logs/out.log',
      error_file: './logs/err.log',
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
}
