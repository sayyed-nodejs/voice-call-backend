import userModel from './user.model.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export const create = async (req, res) => {
  const { name, email, phone, password, confirmPassword } = req.body
  try {
    if (password !== confirmPassword) {
      return res.status(400).json({
        message: 'password and confirmPassword must be same',
      })
    }

    const newUser = await userModel.create({ name, email, phone, password })

    return res.status(201).json({
      message: 'User created successfully',
      newUser,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'User already exist',
      })
    }

    console.log('Error while creating user : ', error)
    return res.status(500).json({
      message: 'Something went wrong while creating user',
    })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await userModel.findOne({ email })
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' })
    } else {
      const passwordMatch = await bcrypt.compare(password, user.password)
      if (!passwordMatch) {
        return res.status(400).json({ message: 'Invalid email or password' })
      } else {
        const accessToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET
        )
        return res.status(200).json({
          message: 'Logged in successfully',
          user,
          accessToken,
        })
      }
    }
  } catch (error) {
    console.log('Error while login : ', error)
    return res.status(500).json({
      message: 'Something went wrong',
    })
  }
}

export const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1
  const limit = parseInt(req.query.limit) || 50
  try {
    const users = await userModel
      .find({}).select('name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)

    const totalDocuments = await userModel.countDocuments()
    const totalPages = Math.ceil(totalDocuments / limit)

    return res.status(200).json({
      users,
      totalDocuments,
      page,
      limit,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages,
      totalPages,
    })
  } catch (error) {
    console.log('Error while getting list of users : ', error)
    return res.status(500).json({
      message: 'Something went wrong while fetching users',
    })
  }
}

export const getUserById = async (req, res) => {
  try {
    const userId = req.params.userId
    const user = await userModel.findById(userId).select('name')
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    return res.status(200).json({
      user,
    })
  } catch (error) {
    console.log('Error while fetching user by id : ', error)
    return res.status(500).json({
      message: 'Something went wrong while fetching user',
    })
  }
}

export const myProfile = (req, res) => {
  try {
    return res.status(200).json({
      profile: req.user,
    })
  } catch (error) {
    console.log('Error while getting profile : ', error)
    return res.status(500).json({
      message: 'Something went wrong while fetching user',
    })
  }
}

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.userId
    const user = await userModel.findById(userId).select({ name: true })
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      })
    }

    return res.status(200).json({
      message: 'User fetched',
      user,
    })
  } catch (error) {
    console.log('Error while getting user profile : ', error)
    return res.status(500).json({
      message: 'Something went wrong while getting user profile',
    })
  }
}
