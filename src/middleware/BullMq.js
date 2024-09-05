const { Queue } = require('bullmq')
const { PROJECT_NAME } = process.env
const orderqueue = new Queue(`${PROJECT_NAME}_order-queue`, {
    connection: {
        host: '127.0.0.1',
        port: '6379'
    }
})


module.exports = {
    executeOrder: async (order) => {
        try {

            const res = await orderqueue.add(`${order._id}`, order,{ removeOnComplete: true, removeOnFail: false})
            console.log('Job added to queue : ', res.id)
            return true;
        } catch (error) {
            
            console.log(error.message, " : error occured in bullmq")
        }
    }
}