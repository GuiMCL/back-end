module.exports = {
  apps: [
    {
      name: "api-cha",
      cwd: "/root/apps/back-end",
      script: "node",
      args: "dist/server.js",
      instances: 1,
      exec_mode: "fork",
      watch: false,
      env: {
        NODE_ENV: "production",
        NODE_OPTIONS: "--max-old-space-size=512"
      }
    }
  ]
};
