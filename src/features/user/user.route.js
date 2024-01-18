import express from 'express'
const router = express.Router()
import { getAllUsers, create, login, getUserById,myProfile, getUserProfile } from './user.controller.js'
import auth from '../../middleware/auth.js'

router.get('/', auth, getAllUsers)
router.get('/me', auth, myProfile)
router.get('/profile/:userId', getUserProfile)
router.get('/:userId', auth, getUserById)
router.post('/register', create)
router.post('/login', login)


export default router
