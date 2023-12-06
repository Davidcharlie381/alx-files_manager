const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    this.client = new MongoClient(`mongodb://${host}:${port}`, { useNewUrlParser: true, useUnifiedTopology: true });
    this.dbName = database;
  }

  async isAlive() {
    try {
      await this.client.connect();
      return true;
    } catch (error) {
      return false;
    } finally {
      await this.client.close();
    }
  }

  async nbUsers() {
    try {
      await this.client.connect();
      const db = this.client.db(this.dbName);
      const usersCollection = db.collection('users');
      const userCount = await usersCollection.countDocuments();
      return userCount;
    } finally {
      await this.client.close();
    }
  }

  async nbFiles() {
    try {
      await this.client.connect();
      const db = this.client.db(this.dbName);
      const filesCollection = db.collection('files');
      const fileCount = await filesCollection.countDocuments();
      return fileCount;
    } finally {
      await this.client.close();
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
