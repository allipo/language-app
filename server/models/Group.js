const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    enum: ['zh', 'fr', 'de', 'it', 'ja', 'es']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  translatedName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  languageExplanation: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000
  },
  groupPicture: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\..+/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  color: {
    type: String,
    default: '#000000',
    trim: true,
    validate: {
      validator: function(v) {
        return /^#[0-9A-Fa-f]{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid hex color!`
    }
  },
  backgroundSound: {
    type: String,
    default: '',
    trim: true,
    validate: {
      validator: function(v) {
        return v === '' || /^https?:\/\/.+\..+/.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.every(tag => typeof tag === 'string' && tag.length <= 50);
      },
      message: props => 'Tags must be strings and less than 50 characters'
    }
  },
  words: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Word'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Group', groupSchema); 