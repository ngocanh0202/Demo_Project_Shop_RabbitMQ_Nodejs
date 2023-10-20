const express = require('express');
const bodyParser = require('body-parser');
const mysqlConnection = require('./database');
const session = require('express-session');
const RabbitMQ = require('./RabbitMQ_Receive')
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('seller'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Đăng ký
app.get('/register',(req,res)=>{
    res.sendFile(__dirname + '/seller/seller_register.html')
})

app.post('/register',(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    const repassword = req.body.repassword;
    
    if(username == "" ||password=="" ||repassword ==""){
        return res.send('Phải điền các trường');
    }

    if (password !== repassword) {
        return res.send('Mật khẩu và xác nhận mật khẩu không khớp.');
    }

    const insertQuery = 'INSERT INTO seller (username, password) VALUES (?, ?)';
    mysqlConnection.query(insertQuery, [username, password], (err, results) => {
        if (err) {
            console.error('Lỗi khi chèn dữ liệu: ' + err.message);
            res.send('Đã xảy ra lỗi khi đăng ký.');
        } else {
            res.send('Đăng ký thành công');
        }
    });
})

// Đăng nhập tài khoản
app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/seller/seller_login.html');
});

app.post('/login', (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;
    
    if(username == "" || password==""){
        return res.send("Phải điền đủ các trường")
    }
    
    const query = "select 1 from seller where username = ? and password = ? "
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
    if (!req.session.username) {
        res.redirect('/login');
    } else {
        res.sendFile(__dirname + '/seller/seller.html');
    }
})
app.post('/home',(req, res)=>{

    
})
// product
app.get('/products', (req, res) => {
    const query = "SELECT * FROM product where username = ?";
    mysqlConnection.query(query,[req.session.username], (err, results) => {
        if (err) {
            res.status(500).json({ message: 'Lỗi truy vấn cơ sở dữ liệu' });
        } else {
            res.json(results);
        }
    });
});

// Thêm sản phẩm
app.get('/add_new_product',(req,res)=>{
    if (!req.session.username) {
        res.redirect('/login');
    } else {
        res.sendFile(__dirname + '/seller/seller_add.html');
    }
})
app.post('/add_new_product',(req,res)=>{
    const id = req.body.id;
    const name = req.body.name;
    const price = req.body.price;

    if(id==""||name==""||price==""){
        return res.send("Phải nhập đầy đủ các trường")
    }
    const insertQuery = "insert into product values(?,?,?,?)"
    mysqlConnection.query(insertQuery,[id,name,price,req.session.username],(err,results)=>{
        if (err) {
            console.error('Lỗi khi chèn dữ liệu: ' + err.message);
            res.send('Đã xảy ra lỗi khi thêm mới sản phẩm.');
        } else {
            res.send('Thêm sản phẩm thành công')
        }
    })
})

app.get('/RabbitMQ',(req,res)=>{
    if (!req.session.username) {
        res.redirect('/login');
    } else {
        res.sendFile(__dirname + '/seller/seller_arlet.html');
    }
})


app.get('/invoices',(req,res)=>{
    const seller = req.session.username;
    const rabbitmq = new RabbitMQ(seller);
    rabbitmq.receiveMessage();

    const query = "select * from message where seller_name = ? "
    mysqlConnection.query(query,[seller],(err,results)=>{
        if(err){
            console.log(err)
        }else{
            res.json(results)
        }
    })
})

app.post('/confirm',(req,res)=>{
    const id = req.body.message_id
    const product_id = req.body.product_id
    const buyer = req.body.buyername

    mysqlConnection.beginTransaction(function(err) {

        const deleteQuery = "delete from message where id = ? ";
        const insertQuery = "insert into invoice (username,product_id) values (?,?)";
        
        // Xóa tin nhắn
        mysqlConnection.query(deleteQuery, [id], function(err, results) {
            if (err) {
                return mysqlConnection.rollback(function() {
                    throw err;
                });
            }
    
            // Chèn vào hóa đơn
            mysqlConnection.query(insertQuery, [buyer, product_id], function(err, results) {
                if (err) {
                    return mysqlConnection.rollback(function() {
                        throw err;
                    });
                }
    
                // Commit giao dịch nếu thành công
                mysqlConnection.commit(function(err) {
                    if (err) {
                        return mysqlConnection.rollback(function() {
                            throw err;
                        });
                    }
                    console.log("Đã xóa và chèn thành công");
                    return res.redirect('/RabbitMQ')
                });
            });
        });
    });

})


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});