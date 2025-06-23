const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const { Storage } = require('@google-cloud/storage');
const fileUpload = require('express-fileupload');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const connectDB = require('./db');
const Word = require('./models/Word');
const Group = require('./models/Group');
const adminRoutes = require('./routes/admin');

// Debug logging for environment variables
console.log('Environment variables loaded:');
console.log('Project ID:', process.env.SERVER_GOOGLE_CLOUD_PROJECT_ID);
console.log('Bucket Name:', process.env.SERVER_GOOGLE_CLOUD_BUCKET_NAME);
console.log('Client Email:', process.env.SERVER_GOOGLE_CLOUD_CLIENT_EMAIL);
console.log('Private Key exists:', !!process.env.SERVER_GOOGLE_CLOUD_PRIVATE_KEY);
console.log('JWT Secret exists:', !!process.env.SERVER_JWT_SECRET);

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // limit each IP to 50 uploads per hour
  standardHeaders: true,
  legacyHeaders: false
});

const groupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 group operations per 15 minutes
  standardHeaders: true,
  legacyHeaders: false
});

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.SERVER_GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.SERVER_GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.SERVER_GOOGLE_CLOUD_PRIVATE_KEY.replace(/\\n/g, '\n')
  }
});

const bucket = storage.bucket(process.env.SERVER_GOOGLE_CLOUD_BUCKET_NAME);

const app = express();
app.set('trust proxy', 1);
connectDB();

app.use(cors({
  origin: [
    'https://vocabinet.netlify.app', 
    'https://allisons-language-app.netlify.app',
    'http://localhost:3000'
  ]
}));
app.use(express.json());
app.use(fileUpload());
app.use(generalLimiter);
app.use('/api/upload', uploadLimiter);
app.use('/api/groups', groupLimiter);

// Input sanitization middleware
app.use((req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
});

// File upload validation
const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const allowedAudioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

// Admin routes
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Upload file to Google Cloud Storage
app.post('/api/upload', async (req, res) => {
  try {
    console.log('Upload endpoint called');
    console.log('Project ID:', process.env.SERVER_GOOGLE_CLOUD_PROJECT_ID);
    console.log('Bucket Name:', process.env.SERVER_GOOGLE_CLOUD_BUCKET_NAME);
    console.log('Client Email:', process.env.SERVER_GOOGLE_CLOUD_CLIENT_EMAIL);
    console.log('Private Key exists:', !!process.env.SERVER_GOOGLE_CLOUD_PRIVATE_KEY);

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Validate file types
    for (const [fieldName, file] of Object.entries(req.files)) {
      const isImage = fieldName.includes('Picture');
      const isAudio = fieldName.includes('Sound');
      
      if (isImage && !allowedImageTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: `Invalid image type. Allowed types: ${allowedImageTypes.join(', ')}` 
        });
      }
      
      if (isAudio && !allowedAudioTypes.includes(file.mimetype)) {
        return res.status(400).json({ 
          message: `Invalid audio type. Allowed types: ${allowedAudioTypes.join(', ')}` 
        });
      }
    }

    const uploadPromises = Object.entries(req.files).map(async ([fieldName, file]) => {
      // Generate hash from file content
      const hash = crypto.createHash('md5').update(file.data).digest('hex');
      const extension = file.name.split('.').pop();
      const fileName = `${hash}.${extension}`;
      
      const blob = bucket.file(fileName);
      
      // Check if file already exists
      const [exists] = await blob.exists();
      if (exists) {
        return {
          fieldName,
          publicUrl: `https://storage.googleapis.com/${process.env.SERVER_GOOGLE_CLOUD_BUCKET_NAME}/${fileName}`
        };
      }

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype
        }
      });

      return new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', () => {
          resolve({
            fieldName,
            publicUrl: `https://storage.googleapis.com/${process.env.SERVER_GOOGLE_CLOUD_BUCKET_NAME}/${fileName}`
          });
        });
        blobStream.end(file.data);
      });
    });

    const results = await Promise.all(uploadPromises);
    const response = results.reduce((acc, { fieldName, publicUrl }) => {
      acc[fieldName] = publicUrl;
      return acc;
    }, {});

    res.status(200).json(response);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Test endpoint for Google Cloud Storage
app.get('/api/test-storage', async (req, res) => {
  try {
    // Try to list files in the bucket
    const [files] = await bucket.getFiles();
    res.json({ 
      success: true, 
      message: 'Storage connection successful',
      files: files.map(file => file.name)
    });
  } catch (error) {
    console.error('Storage test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Storage connection failed',
      error: error.message 
    });
  }
});

// Get all groups (names only)
app.get('/api/groups/names', async (req, res) => {
  try {
    const { page = 1, limit = 10, language, search } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (language && language !== 'all') {
      query.language = language;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { translatedName: { $regex: search, $options: 'i' } }
      ];
    }

    const [groups, total] = await Promise.all([
      Group.find(query)
        .select('_id name translatedName groupPicture language color tags')
        .skip(skip)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 }),
      Group.countDocuments(query)
    ]);

    res.json({
      groups,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all words
app.get('/api/words', async (req, res) => {
  try {
    const words = await Word.find();
    res.json(words);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new word
app.post('/api/words', async (req, res) => {
  const word = new Word(req.body);
  try {
    const newWord = await word.save();
    res.status(201).json(newWord);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add new group
app.post('/api/groups', async (req, res) => {
  const group = new Group(req.body);
  try {
    const newGroup = await group.save();
    res.status(201).json(newGroup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add words to group
app.post('/api/groups/:groupId/words', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    const wordPromises = req.body.map(async (wordData) => {
      const word = new Word({
        ...wordData,
        group: req.params.groupId
      });
      const savedWord = await word.save();
      group.words.push(savedWord._id);
      return savedWord;
    });

    const savedWords = await Promise.all(wordPromises);
    await group.save();
    
    res.status(201).json(savedWords);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a group
app.delete('/api/groups/:groupId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Delete all words associated with this group
    await Word.deleteMany({ group: req.params.groupId });
    
    // Delete the group itself
    await Group.findByIdAndDelete(req.params.groupId);
    
    res.json({ message: 'Group deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get words for a specific group
app.get('/api/groups/:groupId/words', async (req, res) => {
  try {
    const words = await Word.find({ group: req.params.groupId })
      .select('word translation article plural sentence translatedSentence picture group createdAt definition translatedDefinition romajiPinyin kana sentenceRomajiPinyin sentenceKana wordInSentence wordInSentenceKana wordInSentenceRomajiPinyin');
    res.json(words);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a group
app.put('/api/groups/:groupId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    console.log('Updating group:', req.params.groupId);
    console.log('Current group data:', group);
    console.log('Update data:', req.body);
    
    // Validate language if it's being updated
    if (req.body.language) {
      const validLanguages = ['zh', 'fr', 'de', 'it', 'ja', 'es'];
      if (!validLanguages.includes(req.body.language)) {
        return res.status(400).json({ message: 'Invalid language code' });
      }
    }
    
    // Use $set to only update changed fields
    const updatedGroup = await Group.findByIdAndUpdate(
      req.params.groupId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    console.log('Updated group:', updatedGroup);
    res.json(updatedGroup);
  } catch (err) {
    console.error('Error updating group:', err);
    res.status(400).json({ message: err.message });
  }
});

// Update words for a group
app.put('/api/groups/:groupId/words', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Get existing words
    const existingWords = await Word.find({ group: req.params.groupId });
    const existingWordMap = new Map(existingWords.map(w => [w._id.toString(), w]));

    // Process each word in the request
    const wordPromises = req.body.map(async (wordData) => {
      if (wordData._id && existingWordMap.has(wordData._id)) {
        // Update existing word using $set
        return Word.findByIdAndUpdate(
          wordData._id,
          { $set: wordData },
          { new: true }
        );
      } else {
        // Create new word
        const word = new Word({
          ...wordData,
          group: req.params.groupId
        });
        const savedWord = await word.save();
        group.words.push(savedWord._id);
        return savedWord;
      }
    });

    const savedWords = await Promise.all(wordPromises);
    await group.save();
    
    res.json(savedWords);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get complete group info including all words
app.get('/api/groups/:groupId/complete', async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId)
      .populate('words');
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 