import { describe, it, expect } from "vitest";
import Product from "@/lib/models/Product";
import { validProduct } from "../setup/fixtures";

describe("Product model schema validation", () => {
  it("creates a valid product with all required fields", async () => {
    const product = await Product.create(validProduct);
    expect(product._id).toBeDefined();
    expect(product.name).toBe("Lavender Bar Soap");
    expect(product.active).toBe(true);
    expect(product.featured).toBe(false);
  });

  it("rejects a product with no name", async () => {
    const { name: _name, ...withoutName } = validProduct;
    await expect(Product.create(withoutName)).rejects.toThrow();
  });

  it("rejects a product with a name longer than 100 characters", async () => {
    await expect(
      Product.create({ ...validProduct, name: "x".repeat(101) })
    ).rejects.toThrow();
  });

  it("rejects a product with no description", async () => {
    const { description: _desc, ...withoutDesc } = validProduct;
    await expect(Product.create(withoutDesc)).rejects.toThrow();
  });

  it("rejects a product with no category", async () => {
    const { category: _cat, ...withoutCat } = validProduct;
    await expect(Product.create(withoutCat)).rejects.toThrow();
  });

  it("rejects a product with a negative price", async () => {
    await expect(Product.create({ ...validProduct, price: -1 })).rejects.toThrow();
  });

  it("rejects a negative inventory count", async () => {
    await expect(Product.create({ ...validProduct, inventory: -1 })).rejects.toThrow();
  });

  it("defaults inventory to 0", async () => {
    const { inventory: _inv, ...withoutInventory } = validProduct;
    const product = await Product.create(withoutInventory);
    expect(product.inventory).toBe(0);
  });

  it("defaults active to true", async () => {
    const product = await Product.create(validProduct);
    expect(product.active).toBe(true);
  });

  it("defaults featured to false", async () => {
    const product = await Product.create(validProduct);
    expect(product.featured).toBe(false);
  });

  it("stores a variant with a name", async () => {
    const product = await Product.create({
      ...validProduct,
      variants: [{ name: "Unscented", price: 7.5 }],
    });
    expect(product.variants[0].name).toBe("Unscented");
  });
});
