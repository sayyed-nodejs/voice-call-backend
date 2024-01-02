import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'

const app = express()
const APP_PORT = process.env.PORT
app.use(cors()).use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 6000,
})

const connectedUsers = {} // Keep track of connected users

// socket code
io.on('connection', socket => {
  console.log('a user connected', socket.id)

  socket.emit('me', socket.id)

  // Add the user to the connected users list
  connectedUsers[socket.id] = socket.id

  // Emit the list of online users to all clients
  io.emit('onlineUsers', Object.values(connectedUsers))

  socket.on('disconnect', reason => {
    console.log('user disconnected', reason)

    // Remove the user from the connected users list
    delete connectedUsers[socket.id]

    // Emit the updated list of online users to all clients
    io.emit('onlineUsers', Object.values(connectedUsers))

    socket.broadcast.emit('callEnded')
  })

  socket.on('callUser', data => {
    console.log(`callUser event from ${data.from} to ${data.name}`)
    io.to(data.userToCall).emit('callUser', {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    })
  })

  socket.on('answerCall', data => {
    console.log(`answerCall event from ${data.from} to ${data.to}`)
    io.to(data.to).emit('callAccepted', data.signal)
  })
})

// default route
app.get('/', async (req, res) => {
  res.send('Welcome to the voice calling API!')
})

server.listen(APP_PORT, () => {
  console.log(`Server started on port ${APP_PORT}`)
})
