import mongoose, { InferSchemaType, Model, Schema } from "mongoose";

const itemSchema = new Schema(
  {
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "TWD" },
    category: { type: String, required: true },
    date: { type: String, default: null }, // YYYY-MM-DD，文字沒提到則為 null
  },
  { _id: false },
);

const expenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rawText: { type: String, required: true },
    items: { type: [itemSchema], default: [] },
    total: { type: Number, required: true },
  },
  { timestamps: true },
);

export type ExpenseDoc = InferSchemaType<typeof expenseSchema>;

export const Expense: Model<ExpenseDoc> =
  (mongoose.models.Expense as Model<ExpenseDoc>) ||
  mongoose.model<ExpenseDoc>("Expense", expenseSchema);
