const express = require('express');
const bodyParser = require('body-parser');
const mysqlConnection = require('./database');
const session = require('express-session');
const RabbitMQ = require('./RabbitMQ_send');
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('buyer'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));


// Đăng ký tài khoản
app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/buyer/buyer_register.html');
});

app.post('/register', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const repassword = req.body.repassword;
    
    if(username == "" ||password=="" ||repassword ==""){
        return res.send('Phải điền các trường');
    }

    if (password !== repassword) {
        return res.send('Mật khẩu và xác nhận mật khẩu không khớp.');
    }

    const insertQuery = 'INSERT INTO customer (username, password) VALUES (?, ?)';
    mysqlConnection.query(insertQuery, [username, password], (err, results) => {
        if (err) {
            console.error('Lỗi khi chèn dữ liệu: ' + err.message);
            res.send('Đã xảy ra lỗi khi đăng ký.');
        } else {
            res.send('Đăng ký thành công');
        }
    });

});

// Đăng nhập tài khoản
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/buyer/buyer_login.html');
});

app.post('/login', (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;
    
    if(username == "" || password==""){
        return res.send("Phải điền đủ các trường")
    }
    
    const query = "select 1 from customer where username = ? and password = ? "
    mysqlConnection.query(query,[username,password],(err, results)=>{
        if (err) {
            console.error('Lỗi khi chèn dữ liệu: ' + err.message);
            res.send('Đã xảy ra lỗi khi đăng ký.');
        } else {
            if(results.length > 0){
                req.session.username = username;
                req.session.loggedIn = true;
                res.redirect('/home');
            }
            else{
                res.send('Đăng Nhập thất bại');
            }
            
        }
    })
})

// Home 
app.get('/home',(req,res)=>{
    if(!req.session.username){
        res.redirect('/login')
    }
    else{
        res.sendFile(__dirname+'/buyer/buyer.html')
    }
})

app.get('/products',(req,res)=>{
    const query = "select * from product"
    mysqlConnection.query(query,[],(err,results)=>{
        if(err){
            res.status(500).json({ message: 'Lỗi truy vấn cơ sở dữ liệu' });
        }
        else{
            res.json(results);
        }
    })
})

app.post('/buy',(req,res)=>{
    const ID = req.body.ID;
    const username = req.session.username;
    const seller = req.body.seller;
    const rabbitmq = new RabbitMQ(seller) 
    const message = [
        {
            Id: ID,
            Username: username
        }
    ];
    rabbitmq.sendMessage(message);


    res.send("Gửi thông báo thành công")
})




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});