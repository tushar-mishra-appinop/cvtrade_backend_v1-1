module.exports = {
    errorHandler: async(message, statusCode) => {
        let error = new Error(message)
        error.status = statusCode
        return error
    }
}