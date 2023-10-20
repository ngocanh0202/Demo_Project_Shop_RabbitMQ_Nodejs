const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: '*****',
    password: '******',
    database: 'rabbitmq',
});

connection.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối đến cơ sở dữ liệu: ' + err.stack);
        return;
    }
    console.log('Kết nối thành công với ID ' + connection.threadId);
});

module.exports = connection;