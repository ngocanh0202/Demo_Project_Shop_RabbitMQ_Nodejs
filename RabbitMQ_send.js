const amqp = require('amqplib');

class RabbitMQ {
  constructor(seller) {
    this.connection = null;
    this.channel = null;
    this.url = "amqps://xrfpuzka:ffANfnC_4rHE1fsAq68oJfCGxs3NkugC@octopus.rmq3.cloudamqp.com/xrfpuzka"
    this.seller = seller
  }

  async sendMessage(message) {
    // khởi tạo kết nối
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertQueue(this.seller, { durable: true, maxLength:1000});
    } catch (error) {
      console.error('Lỗi khi kết nối tới RabbitMQ:', error);
    }

    // nhận tin nhắn
    try {
      if (this.channel) {
        await this.channel.sendToQueue(this.seller, Buffer.from(JSON.stringify(message)),{
          persistent:true
        });
        console.log('Đã gửi tin nhắn:', message);
      }
      else{
        console.log(this.channel)
      }
    } catch (error) {
      console.error('Lỗi khi gửi tin nhắn:', error);
    }
    // đóng kết nối
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = RabbitMQ;