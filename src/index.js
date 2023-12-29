import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import { ExpressPeerServer } from 'peer'

const app = express()
const APP_PORT = process.env.PORT
app.use(cors()).use(express.json())

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 6000,
})

// socket code
io.on('connection', socket => {
  console.log('a user connected', socket.id)

  socket.emit('me', socket.id)

  socket.on('disconnect', () => {
    console.log('user disconnected')
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

  //   socket.on('reject-call', data => {
  //     console.log(`reject-call event from ${data.calleeID} to ${data.callerID}`)
  //     socket.to(data.callerID).emit('call-rejected', {
  //       calleeID: data.calleeID,
  //     })
  //   })

  socket.on('user-connected', userID => {
    console.log(`user-connected event for ${userID}`)
    socket.broadcast.emit('user-connected', userID)
  })

  socket.on('user-disconnected', userID => {
    console.log(`user-disconnected event for ${userID}`)
    socket.broadcast.emit('user-disconnected', userID)
  })
})

// default route
app.get('/', async (req, res) => {
  res.send('Welcome to the voice calling API!')
})

// Static folder
// const __dirpathname = path.resolve()
// app.use('/public', express.static(path.join(__dirpathname, './public')))

const peerServer = ExpressPeerServer(server, {})

app.use('/peerjs', peerServer)

server.listen(APP_PORT, () => {
  console.log(`Server started on port ${APP_PORT}`)
})
