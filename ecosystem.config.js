module.exports = {
  apps: [{
    name: 'snake-game',
    script: 'npm',
    args: 'start -- -p 3033',
    cwd: '/home/gelt/apps/snake-game',
    env: {
      NODE_ENV: 'production',
      PORT: 3033,
    },
  }],
}
