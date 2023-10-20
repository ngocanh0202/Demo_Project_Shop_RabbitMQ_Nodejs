const amqp = require('amqplib');
const mysqlConnection = require('./database');

class RabbitMQ {
  constructor(seller) {
    this.connection = null;
    this.channel = null;
    this.url = "amqps://xrfpuzka:ffANfnC_4rHE1fsAq68oJfCGxs3NkugC@octopus.rmq3.cloudamqp.com/xrfpuzka";
    this.seller = seller;
  }

  async saveMessageToDatabase(m) {
    const insertQuery = "INSERT INTO message (seller_name, product_id, buyer_name) VALUES (?,?,?)";
    mysqlConnection.query(insertQuery, [this.seller,m[0].Id, m[0].Username], (err, results) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Thêm thành công");
      }
    });
  }

  async receiveMessage() {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.seller, { durable: true,maxLength:1000 });
    
    } catch (error) {
      console.error('Lỗi khi kết nối tới RabbitMQ:', error);
    }

    try {
      if (this.channel) {
        await this.channel.consume(this.seller, async (msg) => {
          const message = msg.content.toString();
          const m = JSON.parse(message)
          console.log(m, typeof m, m[0].Id, m[0].Username)
          await this.saveMessageToDatabase(m);
        },{
          noAck:true
        });
      } else {
        console.log(this.channel);
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }

    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = RabbitMQ;