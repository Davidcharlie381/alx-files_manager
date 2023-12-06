import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.getUserById(userId);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId = 0, isPublic = false, data } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }

    if ((type === 'file' || type === 'image') && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.getFileById(parentId);

      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }

      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const storingFolderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const localPath = path.join(storingFolderPath, uuidv4());

    if (type === 'file' || type === 'image') {
      const fileDataBuffer = Buffer.from(data, 'base64');
      fs.writeFileSync(localPath, fileDataBuffer);
    } else if (type === 'folder') {
      fs.mkdirSync(localPath);
    }

    const newFile = {
      userId: user._id.toString(),
      name,
      type,
      isPublic,
      parentId,
      localPath: type === 'folder' ? null : localPath,
    };

    const result = await dbClient.insertFile(newFile);

    return res.status(201).json({
      id: result.insertedId,
      userId: newFile.userId,
      name: newFile.name,
      type: newFile.type,
      isPublic: newFile.isPublic,
      parentId: newFile.parentId,
      localPath: newFile.localPath,
    });
  }

  static async putPublish(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    const user = await dbClient.getUserById(userId);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getFileById(fileId);

    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    file.isPublic = true;

    await dbClient.updateFile(fileId, { isPublic: true });

    return res.status(200).json(file);
  }

  static async putUnpublish(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = req.params.id;

    const user = await dbClient.getUserById(userId);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await dbClient.getFileById(fileId);

    if (!file || file.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    file.isPublic = false;

    await dbClient.updateFile(fileId, { isPublic: false });

    return res.status(200).json(file);
      }
  
}

module.exports = FilesController;
