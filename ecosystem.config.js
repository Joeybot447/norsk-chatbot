module.exports = {
  apps: [
    {
      name: 'norsk-chatbot',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/home/openclaw/.openclaw/workspace/projects/norsk-chatbot-ai',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '500M',
      error_file: '/home/openclaw/.pm2/logs/norsk-chatbot-error.log',
      out_file: '/home/openclaw/.pm2/logs/norsk-chatbot-out.log',
      time: true,
    },
  ],
};
