import { PrismaClient } from '../src/generated/prisma/index.js'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function addUser() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('Dtt1990vn!', 10)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'dotoan159@gmail.com' }
    })
    
    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { email: 'dotoan159@gmail.com' },
        data: {
          password: hashedPassword,
          name: 'Do Toan',
          role: 'ADMIN', // Can be ADMIN, AUTHOR, or READER
        },
      })
      console.log('User updated successfully:', updatedUser)
    } else {
      // Create new user
      const user = await prisma.user.create({
        data: {
          email: 'dotoan159@gmail.com',
          password: hashedPassword,
          name: 'Do Toan',
          role: 'ADMIN', // Can be ADMIN, AUTHOR, or READER
        },
      })
      console.log('User created successfully:', user)
    }
  } catch (error) {
    console.error('Error with user operation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addUser()