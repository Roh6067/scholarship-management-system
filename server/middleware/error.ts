import type { Request, Response, NextFunction } from 'express'
export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) { const status = error?.name === 'ValidationError' ? 400 : error?.code === 11000 ? 409 : 500; res.status(status).json({ message: status === 500 ? 'Something went wrong' : error.message }) }
