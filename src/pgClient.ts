import { Client } from "pg";

export interface PgConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export class PgClient {
  private client: Client;

  constructor(config: PgConfig) {
    this.client = new Client(config);
  }

  async connect() {
    await this.client.connect();
  }

  async disconnect() {
    await this.client.end();
  }

  async query(sql: string, params?: any[]): Promise<any> {
    await this.connect();
    try {
      const res = await this.client.query(sql, params);
      return res.rows;
    } catch (err) {
      throw err;
    }
  }
}
