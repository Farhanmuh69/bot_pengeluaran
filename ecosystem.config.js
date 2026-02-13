{
    "apps": [{
        "name": "bot-pengeluaran",
        "script": "index.js",
        "cwd": "/www/wwwroot/bot-pengeluaran",
        "instances": 1,
        "exec_mode": "fork",
        "watch": false,
        "max_memory_restart": "500M",
        "env": {
            "NODE_ENV": "production",
            "PORT": 3000
        },
        "error_file": "/www/wwwlogs/bot-pengeluaran-error.log",
        "out_file": "/www/wwwlogs/bot-pengeluaran-out.log",
        "log_date_format": "YYYY-MM-DD HH:mm:ss Z",
        "merge_logs": true,
        "autorestart": true,
        "max_restarts": 10,
        "min_uptime": "10s"
    }]
}
