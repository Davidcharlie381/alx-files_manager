const crypto = require('crypto');
const dbClient = require('../utils/db');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    // Check if the email already exists
    const existingUser = await dbClient.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Already exist' });
    }

    // Hash the password using SHA1
    const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

    // Create a new user
    const newUser = {
      email,
      password: hashedPassword,
    };

    // Save the new user in the collection users
    const result = await dbClient.insertUser(newUser);

    // Return the new user with only email and id
    const createdUser = {
      id: result.insertedId,
      email,
    };

    res.status(201).json(createdUser);
  }
}

module.exports = UsersController;
