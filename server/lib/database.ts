import mongoose from 'mongoose'

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not configured')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 })
  if (mongoose.connection.readyState !== 1) throw new Error('MongoDB connection was not established')
    
  await mongoose.model('User').createIndexes()
}

export function databaseReady() {
  return mongoose.connection.readyState === 1
}
