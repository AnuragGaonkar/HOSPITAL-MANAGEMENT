const mongoose = require('mongoose');

const InventoryItemSchema = new mongoose.Schema({
  hospital: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true,
  },

  itemName: { type: String, required: true },
  itemCategory: { type: String, required: true },
  itemDescription: String,
  sku: { type: String, required: true },

  stockInformation: {
    quantity: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    batchDetails: [{
      batchNumber: String,
      manufactureDate: Date,
      expiryDate: Date,
    }],
  },

  supplierInformation: {
    supplierName: String,
    supplierContact: String,
    supplierEmail: String,
    supplierAddress: String,
  },

  storageInformation: {
    storageLocation: String,
    storageConditions: String,
  },

  additionalInformation: {
    notes: String,
    enteredBy: String,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);