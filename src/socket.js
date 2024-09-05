// console.log("This is a socket file")
// const io = require('socket.io')(process.env.PORT,{
//      cors : {
//           origin : '*',
//           methods : ['GET','POST']
//      }
// })

 
// let users = [];
// const addUser = (userId,socketId,userInfo) => {
//      console.log(userId, ": UserId")
//      console.log(socketId, ": UserId")
//      console.log(userInfo, ": userInfo")
//      const checkUser = users.some(u=> u.userId === userId );

//      if(!checkUser){
//           console.log('in check user')
//           users.push({userId,socketId,userInfo});
//           console.log(users, ": PUSHED users")
//      }
// }
// const userRemove = (socketId) => {
//      users = users.filter(u=>u.socketId !== socketId );
// }

// const findFriend = (id) => {
//      return users.find(u=>u.userId === id);
// }

// const userLogout = (userId) => {
//      users = users.filter(u=>u.userId !== userId)
// }


// // io.on('connection',(socket)=>{
// //      console.log('Socket is connecting...')
// //      socket.on('addUser',(userId,userInfo)=>{
// //           console.log(userId, ": USERID in Socket file")
// //           console.log(userInfo, ": userInfo in Socket file")
// //           addUser(userId,socket.id,userInfo);
// //           io.emit('getUser',users);

// //      const us = users.filter(u=>u.userId !== userId);
// //      const con = 'new_user_add';
// //      for(var i = 0; i <us.length; i++ ){
// //           socket.to(us[i].socketId).emit('new_user_add',con);
// //      }




// //      });
// //      socket.on('sendMessage',(data)=>{
// //           const user = findFriend(data.reseverId);
// //           console.log(data.reseverId, ": data.reseverId")
          
// //           if(user !== undefined){
// //                socket.to(user.socketId).emit('getMessage', data)
// //           }          
// //      })

// //      socket.on('messageSeen',msg =>{
// //           const user = findFriend(msg.senderId);   
// //           console.log(msg.senderId, ": msg.senderId")       
// //           if(user !== undefined){
// //                socket.to(user.socketId).emit('msgSeenResponse', msg)
// //           }          
// //      })

// //      socket.on('delivaredMessage',msg =>{
// //           const user = findFriend(msg.senderId);
// //           console.log(msg.senderId, ": msg.senderId in delivered message")          
// //           if(user !== undefined){
// //                socket.to(user.socketId).emit('msgDelivaredResponse', msg)
// //           }          
// //      })
// //      socket.on('seen',data =>{
// //           const user = findFriend(data.senderId);   
// //           console.log(data.senderId, ": data.senderId in seen message")       
// //           if(user !== undefined){
// //                socket.to(user.socketId).emit('seenSuccess', data)
// //           } 
// //      })


// //      socket.on('typingMessage',(data)=>{
// //           const user = findFriend(data.reseverId);
// //           console.log(data.reseverId, ": data.reseverId in typing message")
// //           if(user !== undefined){
// //                socket.to(user.socketId).emit('typingMessageGet',{
// //                     senderId : data.senderId,                   
// //                     reseverId :  data.reseverId,
// //                     msg : data.msg                    
                     
// //                })
// //           }
// //      })

// //      socket.on('logout',userId => {
// //           userLogout(userId);
// //      })


// //      socket.on('disconnect',() =>{
// //           console.log('user is disconnect... ');
// //           userRemove(socket.id);
// //           io.emit('getUser',users);
// //      })
// // })

// module.exports = {
//      addUser,
//      userRemove,
//      findFriend,
//      userLogout
// }



