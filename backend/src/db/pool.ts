// backend/src/db/pool.ts — Resilient Database Pool with MySQL & Embedded Persistent SQL Engine
import mysql from 'mysql2/promise';
import { env } from '../config/env';
import { executeSqliteQuery } from './sqlite-engine';

let mysqlPool: mysql.Pool | null = null;
let mysqlAvailable: boolean | null = null;
let lastCheckTime = 0;
const CHECK_INTERVAL_MS = 30000; // Check MySQL availability every 30s

function getMysqlPool(): mysql.Pool {
  if (!mysqlPool) {
    mysqlPool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      multipleStatements: true,
      charset: 'utf8mb4'
    });
  }
  return mysqlPool;
}

export async function testConnection(): Promise<boolean> {
  const now = Date.now();
  if (mysqlAvailable !== null && now - lastCheckTime < CHECK_INTERVAL_MS) {
    return mysqlAvailable;
  }

  try {
    const p = getMysqlPool();
    const connection = await p.getConnection();
    await connection.ping();
    connection.release();
    mysqlAvailable = true;
    lastCheckTime = now;
    return true;
  } catch {
    mysqlAvailable = false;
    lastCheckTime = now;
    return false;
  }
}

/**
 * Resilient Connection Wrapper for Transactions
 */
class ResilientConnection {
  private mysqlConn: mysql.PoolConnection | null = null;
  private isMysql: boolean = false;

  constructor(mysqlConn: mysql.PoolConnection | null, isMysql: boolean) {
    this.mysqlConn = mysqlConn;
    this.isMysql = isMysql;
  }

  async query<T extends mysql.QueryResult = any>(sql: string, params?: any): Promise<[T, mysql.FieldPacket[]]> {
    if (this.isMysql && this.mysqlConn) {
      try {
        return (await this.mysqlConn.query<T>(sql, params)) as [T, mysql.FieldPacket[]];
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
          console.warn(`[DB] MySQL disconnected during query, falling back to embedded SQL engine.`);
          this.isMysql = false;
          return (await executeSqliteQuery(sql, Array.isArray(params) ? params : [params])) as unknown as [T, mysql.FieldPacket[]];
        }
        throw err;
      }
    }
    return (await executeSqliteQuery(sql, Array.isArray(params) ? params : (params ? [params] : []))) as unknown as [T, mysql.FieldPacket[]];
  }

  async execute<T extends mysql.QueryResult = any>(sql: string, params?: any): Promise<[T, mysql.FieldPacket[]]> {
    return this.query<T>(sql, params);
  }

  async beginTransaction(): Promise<void> {
    if (this.isMysql && this.mysqlConn) {
      await this.mysqlConn.beginTransaction();
    } else {
      await executeSqliteQuery('BEGIN TRANSACTION');
    }
  }

  async commit(): Promise<void> {
    if (this.isMysql && this.mysqlConn) {
      await this.mysqlConn.commit();
    } else {
      await executeSqliteQuery('COMMIT');
    }
  }

  async rollback(): Promise<void> {
    if (this.isMysql && this.mysqlConn) {
      await this.mysqlConn.rollback();
    } else {
      try {
        await executeSqliteQuery('ROLLBACK');
      } catch {
        // ignore rollback error
      }
    }
  }

  release(): void {
    if (this.mysqlConn) {
      try {
        this.mysqlConn.release();
      } catch {
        // ignore
      }
    }
  }
}

class ResilientPool {
  async query<T extends mysql.QueryResult = any>(sql: string, params?: any): Promise<[T, mysql.FieldPacket[]]> {
    const isOnline = await testConnection();
    if (isOnline) {
      try {
        const p = getMysqlPool();
        return (await p.query<T>(sql, params)) as [T, mysql.FieldPacket[]];
      } catch (err: any) {
        if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ER_BAD_DB_ERROR') {
          mysqlAvailable = false;
          return (await executeSqliteQuery(sql, Array.isArray(params) ? params : (params ? [params] : []))) as unknown as [T, mysql.FieldPacket[]];
        }
        throw err;
      }
    }
    return (await executeSqliteQuery(sql, Array.isArray(params) ? params : (params ? [params] : []))) as unknown as [T, mysql.FieldPacket[]];
  }

  async execute<T extends mysql.QueryResult = any>(sql: string, params?: any): Promise<[T, mysql.FieldPacket[]]> {
    return this.query<T>(sql, params);
  }

  async getConnection(): Promise<any> {
    const isOnline = await testConnection();
    if (isOnline) {
      try {
        const p = getMysqlPool();
        const conn = await p.getConnection();
        return new ResilientConnection(conn, true);
      } catch {
        mysqlAvailable = false;
        return new ResilientConnection(null, false);
      }
    }
    return new ResilientConnection(null, false);
  }

  async end(): Promise<void> {
    if (mysqlPool) {
      await mysqlPool.end();
      mysqlPool = null;
    }
  }
}

export const pool = new ResilientPool() as unknown as mysql.Pool;
