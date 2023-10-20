const amqplib = require('amqplib')

const amqplib_url_cloud = "amqps://xrfpuzka:ffANfnC_4rHE1fsAq68oJfCGxs3NkugC@octopus.rmq3.cloudamqp.com/xrfpuzka"

const sendQueue = async (msg) =>{
    try{
        const conn = await amqplib.connect(amqplib_url_cloud)
        
        const channel = await conn.createChannel()
        
        const nameQueue = "q2"

        await channel.assertQueue(nameQueue,{
            durable: true
        })

        await channel.sendToQueue(nameQueue, Buffer.from(msg),{
            //expiration:"10000"
            persistent:true
        })
        
    }catch(error){
        console.error(""+error.message)
    }
}

sendQueue("hello world")