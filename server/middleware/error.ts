import type { Request, Response, NextFunction } from 'express'
export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ message: error.message || 'Validation error' })
  }

  if (error?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid identifier format' })
  }

  if (error?.code === 11000) {
    const keyPattern = error.keyPattern || error.keyValue || {}
    const field = Object.keys(keyPattern)[0]
    let message = 'A record with this unique value already exists.'
    if (field === 'email') {
      message = 'An account with this email address already exists.'
    } else if (field === 'studentId') {
      message = 'A student with this Student ID is already registered.'
    } else if (field === 'applicationNumber') {
      message = 'An application with this number already exists.'
    }
    return res.status(409).json({ message })
  }

  const status = typeof error?.status === 'number' ? error.status : 500
  const message = status === 500 ? 'An unexpected server error occurred.' : (error.message || 'Something went wrong')
  return res.status(status).json({ message })
}
