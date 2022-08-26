module.exports = {
  apps : [
      {
        name: "GEID",
        script: "server.js",
        watch: false,
        instances: "max",
        exec_mode: "cluster",
        increment_var : 'PORT',
        env: {
            "PORT": 3000,
            "PATH": process.env.PATH,
            "NODE_ENV": "development",
            "GEID_EMAIL": "danticbudget@gmail.com",
            "GEID_PASS": "ozmhyownmptmkchd",
            "MONGODB_URI": "mongodb://127.0.0.1:27017",
            "host": "geidbudget.com",
            "PUSHER_APP_ID": "1419227",
            "PUSHER_APP_KEY": "afe8843e634234387127",
            "PUSHER_APP_SECRET": "9c8305992ac23a278ac1",
            "PUSHER_APP_CLUSTER": "ap2"
        },
        env_production: {
            "PORT": 81,
            "PATH": process.env.PATH,
            "NODE_ENV": "production",
            "GEID_EMAIL": "danticbudget@gmail.com",
            "GEID_PASS": "ozmhyownmptmkchd",
            "MONGODB_URI": "mongodb://127.0.0.1:27017",
            "host": "geidbudget.com",
            "PUSHER_APP_ID": "1419227",
            "PUSHER_APP_KEY": "afe8843e634234387127",
            "PUSHER_APP_SECRET": "9c8305992ac23a278ac1",
            "PUSHER_APP_CLUSTER": "ap2"
        }
      }
  ]
}
