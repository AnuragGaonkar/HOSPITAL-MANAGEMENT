import React, { useState } from 'react';
import Dashboard from '../Institute/Dashboard';
import './InventoryForm.css';

const InventoryForm = () => {
  // Define state for each input field
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(0);
  const [unitPrice, setUnitPrice] = useState(0);
  const [batchNumber, setBatchNumber] = useState('');
  const [manufactureDate, setManufactureDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierAddress, setSupplierAddress] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [storageConditions, setStorageConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [enteredBy, setEnteredBy] = useState('User123'); // Assume this is set from logged-in user context

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Build the inventory item object based on form inputs
    const inventoryItem = {
      itemName,
      itemCategory,
      itemDescription,
      sku,
      stockInformation: {
        quantity,
        reorderLevel,
        unitPrice,
        batchDetails: [
          {
            batchNumber,
            manufactureDate,
            expiryDate
          }
        ]
      },
      supplierInformation: {
        supplierName,
        supplierContact,
        supplierEmail,
        supplierAddress
      },
      storageInformation: {
        storageLocation,
        storageConditions
      },
      additionalInformation: {
        notes,
        dateOfEntry: new Date().toISOString(),
        enteredBy
      }
    };

    // Here you would typically send the data to your backend API
    console.log('Inventory Item:', inventoryItem);

    // Reset form fields
    setItemName('');
    setItemCategory('');
    setItemDescription('');
    setSku('');
    setQuantity(0);
    setReorderLevel(0);
    setUnitPrice(0);
    setBatchNumber('');
    setManufactureDate('');
    setExpiryDate('');
    setSupplierName('');
    setSupplierContact('');
    setSupplierEmail('');
    setSupplierAddress('');
    setStorageLocation('');
    setStorageConditions('');
    setNotes('');
  };

  return (
    <>
      <Dashboard />
    <div className="container">
      <h2>Inventory Management Form</h2>
      <form onSubmit={handleSubmit}>
        {/* Item Details */}
        <fieldset>
          <legend>Item Details</legend>

          <div className="form-group">
            <label htmlFor="itemName">Item Name<span className="required">*</span></label>
            <input
              type="text"
              id="itemName"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="itemCategory">Item Category<span className="required">*</span></label>
            <select
              id="itemCategory"
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              required
            >
              <option value="">Select Category</option>
              <option value="Medicine">Medicine</option>
              <option value="Consumable">Consumable</option>
              <option value="Equipment">Equipment</option>
              {/* Add more categories as needed */}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="itemDescription">Item Description</label>
            <textarea
              id="itemDescription"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="sku">SKU/Item Code<span className="required">*</span></label>
            <input
              type="text"
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
          </div>
        </fieldset>

        {/* Stock Information */}
        <fieldset>
          <legend>Stock Information</legend>

          <div className="form-group">
            <label htmlFor="quantity">Quantity in Stock<span className="required">*</span></label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reorderLevel">Reorder Level<span className="required">*</span></label>
            <input
              type="number"
              id="reorderLevel"
              value={reorderLevel}
              onChange={(e) => setReorderLevel(e.target.value)}
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="unitPrice">Unit Price (₹)<span className="required">*</span></label>
            <input
              type="number"
              id="unitPrice"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              step="0.01"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="batchNumber">Batch Number<span className="required">*</span></label>
            <input
              type="text"
              id="batchNumber"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="manufactureDate">Manufacture Date<span className="required">*</span></label>
            <input
              type="date"
              id="manufactureDate"
              value={manufactureDate}
              onChange={(e) => setManufactureDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date<span className="required">*</span></label>
            <input
              type="date"
              id="expiryDate"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>
        </fieldset>

        {/* Supplier Information */}
        <fieldset>
          <legend>Supplier Information</legend>

          <div className="form-group">
            <label htmlFor="supplierName">Supplier Name<span className="required">*</span></label>
            <input
              type="text"
              id="supplierName"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supplierContact">Supplier Contact<span className="required">*</span></label>
            <input
              type="tel"
              id="supplierContact"
              value={supplierContact}
              onChange={(e) => setSupplierContact(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="supplierEmail">Supplier Email</label>
            <input
              type="email"
              id="supplierEmail"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="supplierAddress">Supplier Address</label>
            <textarea
              id="supplierAddress"
              value={supplierAddress}
              onChange={(e) => setSupplierAddress(e.target.value)}
              rows="3"
            />
          </div>
        </fieldset>

        {/* Storage Information */}
        <fieldset>
          <legend>Storage Information</legend>

          <div className="form-group">
            <label htmlFor="storageLocation">Storage Location<span className="required">*</span></label>
            <input
              type="text"
              id="storageLocation"
              value={storageLocation}
              onChange={(e) => setStorageLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="storageConditions">Storage Conditions</label>
            <input
              type="text"
              id="storageConditions"
              value={storageConditions}
              onChange={(e) => setStorageConditions(e.target.value)}
              placeholder="e.g., Cool and Dry Place"
            />
          </div>
        </fieldset>

        {/* Additional Information */}
        <fieldset>
          <legend>Additional Information</legend>

          <div className="form-group">
            <label htmlFor="notes">Notes/Remarks</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            />
          </div>
        </fieldset>

        <button type="submit">Save Item</button>
      </form>
    </div>
    </>
  );
};

export default InventoryForm;
