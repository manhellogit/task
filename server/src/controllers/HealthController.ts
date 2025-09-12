import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { success } from '../utils/response';

export class HealthController {
  async healthCheck(req: Request, res: Response) {
    try {
      const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
      
      return success(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbStatus,
        memory: {
          used: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          total: Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100
        },
        version: process.env.npm_package_version || '1.0.0'
      }, 'Server is healthy');
    } catch (err) {
      return success(res, {
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }, 'Server health check failed');
    }
  }

  async databaseCheck(req: Request, res: Response) {
    try {
      const { connection } = mongoose;
      if (connection.readyState !== 1 || !connection.db) {
        throw new Error('Database not connected');
      }
      await connection.db.admin().ping();
      
      return success(res, {
        status: 'connected',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        name: mongoose.connection.name
      }, 'Database is healthy');
    } catch (err) {
      return success(res, {
        status: 'error',
        message: 'Database connection failed'
      }, 'Database check failed');
    }
  }
}
