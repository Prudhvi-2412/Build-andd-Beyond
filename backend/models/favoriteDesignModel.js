const mongoose = require('mongoose');

const favoriteDesignSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true,
    },
    designs: [
      {
        designId: { type: String, required: true },
        category: { type: String, required: true },
        title: { type: String, required: true },
        imageUrl: { type: String, required: true },
        _id: false,
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FavoriteDesign ||
  mongoose.model('FavoriteDesign', favoriteDesignSchema);
