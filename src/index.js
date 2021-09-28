const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const  { generateMessage,generateLocationMessage } = require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} = require('./utils/users')
const Filter = require('bad-words')
const { callbackify } = require('util')
const app = express();
const server = http.createServer(app) // by using const app = epxress() this internally performs the left side code but since we are using socket.io also as a server we are tweking the express server a little bit
const io = socketio(server) // to configure socket.io
// socket io exprects to pass raw http server as argument hence we manually create http server to pass it to it
const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')
console.log(publicDirectoryPath)
console.log(__dirname)
app.use(express.static(publicDirectoryPath))
let count = 0
io.on('connection',(socket)=>{
    console.log('New webSocket conncetion')
    socket.on('join',({username,room},callback)=>{

        const {error,user} = addUser({id:socket.id,username,room})
        if(error){
            return callback(error)
        }

        socket.join(user.room) // join the room with given name
        socket.emit("Message",generateMessage('Admin','Welcome!'));
        socket.emit('Message',generateMessage('Important Note','Share location buttion is not available for phones currently!'))
        socket.broadcast.to(user.room).emit('Message',generateMessage(user.username+' has joined the chat room!')) //  broadcast to emit to everybody but this conncetion
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback() // no arguments means no error in joining
    })
    socket.on('SendMessage',(msg,acknowledge)=>{
        const user = getUser(socket.id)

        const filter = new Filter()
        if(filter.isProfane(msg)){
            return acknowledge('Bad Words not Allowed')
        }
        if(user.room){
        io.to(user.room).emit('Message',generateMessage(user.username,msg))
        }
        acknowledge()
    })
    socket.on('sendLocation',(location,acknowledge)=>{
        const user = getUser(socket.id)
            const loc = 'http://google.com/maps?q='+location.latitude+','+location.longitude
        io.to(user.room).emit('LocationMessage',generateLocationMessage(user.username,loc))
        acknowledge()
    })
    socket.on('disconnect',()=>{
        const removedUser = removeUser(socket.id)
        if(removedUser){
            io.to(removedUser.room).emit('Message',generateMessage(removedUser.username+' has Left!!'))
            io.to(removedUser.room).emit('roomData',{
                room:removedUser.room,
                users:getUsersInRoom(removedUser.room)
            })
        }
    }) // disconnet is a built-in when user leaves the chat room
})
server.listen(port,()=>{
    
    console.log('Server listenning on Port',port)
    
})