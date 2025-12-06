import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProductVariant {
  name: string;
  price?: number; // Optional price override
  inventory?: number;
}

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  inventory: number;
  variants: IProductVariant[];
  featured: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>({
  name: { type: String, required: true },
  price: { type: Number },
  inventory: { type: Number, default: 0 },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [100, "Product name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    images: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    inventory: {
      type: Number,
      required: true,
      min: [0, "Inventory cannot be negative"],
      default: 0,
    },
    variants: {
      type: [ProductVariantSchema],
      default: [],
    },
    featured: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
ProductSchema.index({ category: 1 });
ProductSchema.index({ featured: 1 });
ProductSchema.index({ active: 1 });
ProductSchema.index({ createdAt: -1 });

// Prevent model recompilation in development
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;

