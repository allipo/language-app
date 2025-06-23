const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  word: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  translation: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  definition: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  translatedDefinition: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  article: {
    type: String,
    required: false,
    trim: true,
    maxlength: 10
  },
  plural: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  sentence: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  translatedSentence: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  picture: {
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
  romajiPinyin: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  kana: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  sentenceRomajiPinyin: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  sentenceKana: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  wordInSentence: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  wordInSentenceKana: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  wordInSentenceRomajiPinyin: {
    type: String,
    required: false,
    trim: true,
    maxlength: 100
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Word', wordSchema); 