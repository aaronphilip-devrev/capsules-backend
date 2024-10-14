const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const timeCapsuleSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    required: true,
  },
  image: {
    type: String,  // This will store the Base64 encoded image
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  recipients: [
    {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const TimeCapsule = mongoose.model("TimeCapsule", timeCapsuleSchema);

module.exports = TimeCapsule;
