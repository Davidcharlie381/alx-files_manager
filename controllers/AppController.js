const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AppController {
  static async getStatus(req, res) {
    const isRedisAlive = await redisClient.isAlive();
    const isDBAlive = await dbClient.isAlive();

    const status = {
      redis: isRedisAlive,
      db: isDBAlive,
    };

    res.status(200).json(status);
  }

  static async getStats(req, res) {
    const usersCount = await dbClient.nbUsers();
    const filesCount = await dbClient.nbFiles();

    const stats = {
      users: usersCount,
      files: filesCount,
    };

    res.status(200).json(stats);
  }
}

module.exports = AppController
