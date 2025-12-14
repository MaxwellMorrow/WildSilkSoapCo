/**
 * Script to create a test product for Square integration testing
 * 
 * Usage: 
 *   - On Windows: $env:MONGODB_URI="your-uri"; node scripts/create-test-product.js
 *   - On Mac/Linux: MONGODB_URI="your-uri" node scripts/create-test-product.js
 * 
 * Or set MONGODB_URI in your environment before running
 */

const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: { type: [String], default: [] },
  category: { type: String, required: true },
  inventory: { type: Number, default: 0 },
  variants: { type: Array, default: [] },
  featured: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);

async function createTestProduct() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in environment variables');
      console.log('Please add MONGODB_URI to your .env.local file');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Check if test product already exists
    const existingProduct = await Product.findOne({ 
      name: 'Square Test Product' 
    });

    if (existingProduct) {
      console.log('⚠️  Test product already exists!');
      console.log(`   Product ID: ${existingProduct._id}`);
      console.log('   Updating existing product...');
      
      existingProduct.name = 'Square Test Product';
      existingProduct.description = 'This is a test product created for Square integration testing. Perfect for testing checkout flows and payment processing.';
      existingProduct.price = 19.99;
      existingProduct.category = 'Bar Soap';
      existingProduct.inventory = 100;
      existingProduct.active = true;
      existingProduct.featured = false;
      
      await existingProduct.save();
      console.log('✅ Test product updated successfully!');
      console.log(`   Product ID: ${existingProduct._id}`);
    } else {
      // Create new test product
      const testProduct = await Product.create({
        name: 'Square Test Product',
        description: 'This is a test product created for Square integration testing. Perfect for testing checkout flows and payment processing.',
        price: 19.99,
        category: 'Bar Soap',
        inventory: 100,
        images: [],
        active: true,
        featured: false,
      });

      console.log('✅ Test product created successfully!');
      console.log(`   Product ID: ${testProduct._id}`);
      console.log(`   Name: ${testProduct.name}`);
      console.log(`   Price: $${testProduct.price}`);
      console.log(`   Category: ${testProduct.category}`);
      console.log(`   Inventory: ${testProduct.inventory}`);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test product:', error);
    process.exit(1);
  }
}

createTestProduct();

