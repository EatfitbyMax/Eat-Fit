
module.exports = {
  apps: [{
    name: 'eatfitbymax-server',
    script: 'server.js',
    cwd: '/home/runner/workspace/server',
    instances: 1,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0'
    },
    listen_timeout: 8000,
    kill_timeout: 3000,
    wait_ready: true,
    ready_timeout: 5000,
    error_file: '/home/runner/workspace/logs/err.log',
    out_file: '/home/runner/workspace/logs/out.log',
    log_file: '/home/runner/workspace/logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '5s',
    max_restarts: 5,
    exp_backoff_restart_delay: 100
  }]
};
