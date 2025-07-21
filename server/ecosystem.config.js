
module.exports = {
  apps: [{
    name: 'eatfitbymax-server',
    script: 'server.js',
    cwd: '/home/runner/workspace/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      HOST: '0.0.0.0'
    },
    listen_timeout: 10000,
    kill_timeout: 5000,
    error_file: '/home/runner/workspace/logs/err.log',
    out_file: '/home/runner/workspace/logs/out.log',
    log_file: '/home/runner/workspace/logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    // Forcer le redémarrage en cas d'erreur
    exp_backoff_restart_delay: 100
  }]
};
