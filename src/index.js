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
  pingTimeout: 1000,
  pingInterval: 1000,
})

const availableUsers = [] // Keep track of available for call availableUsers

// socket code
io.on('connection', socket => {
  console.log('a user connected', socket.id)

  socket.emit('me', { id: socket.id })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    const index = availableUsers.indexOf(socket.id)
    if (index !== -1) {
      availableUsers.splice(index, 1)
    }

    io.emit('availableUsers', availableUsers)
  })

  socket.on('call', () => {
    console.log('User is calling:', socket.id)
    availableUsers.push(socket.id)

    console.log('availableUsers', availableUsers)

    if (availableUsers.length >= 2) {
      // const randomIndex1 = Math.floor(Math.random() * availableUsers.length)
      // const randomIndex2 = Math.floor(Math.random() * availableUsers.length)
      const randomIndex1 = 0
      const randomIndex2 = 1

      console.log('randomIndex1, randomIndex2', randomIndex1, randomIndex2)

      const user1 = availableUsers[randomIndex1]
      const user2 = availableUsers[randomIndex2]

      io.to(user1).emit('startCall', user2)
      io.to(user2).emit('startCall', user1)

      // Remove the pairedavailableUsers from the list
      availableUsers.splice(randomIndex1, 1)
      availableUsers.splice(
        randomIndex2 > randomIndex1 ? randomIndex2 - 1 : randomIndex2,
        1
      )

      io.emit('availableUsers', availableUsers)
    }
  })

  // Handle signaling
  socket.on('signal', ({ signal, to }) => {
    console.log('Received signal from:', socket.id, ' to:', to)
    io.to(to).emit('signal', { signal, from: socket.id })
  })
})

// default route
app.get('/', async (req, res) => {
  res.send('Welcome to the voice calling API!')
})

server.listen(APP_PORT, () => {
  console.log(`Server started on port ${APP_PORT}`)
})
