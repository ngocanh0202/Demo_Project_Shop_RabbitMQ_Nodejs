const amqplib = require('amqplib')

const amqplib_url_cloud = "amqps://xrfpuzka:ffANfnC_4rHE1fsAq68oJfCGxs3NkugC@octopus.rmq3.cloudamqp.com/xrfpuzka"

const receiveQueue = async () =>{
    try{
        const conn = await amqplib.connect(amqplib_url_cloud)
        
        const channel = await conn.createChannel()
        
        const nameQueue = "q1"

        await channel.assertQueue(nameQueue,{
            durable: true
        })

        await channel.consume(nameQueue, (msg)=>{
            console.log("MSG::",msg.content.toString())
        },{
            noAck: true
        })

    }catch(error){
        console.error(""+error.message)
    }
}

receiveQueue()