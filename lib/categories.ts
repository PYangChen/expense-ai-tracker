export const CATEGORIES: Record<string, { emoji: string; color: string }> = {
  餐飲: { emoji: "🍜", color: "#ff7a3d" },
  交通: { emoji: "🚇", color: "#00a6e0" },
  購物: { emoji: "🛍️", color: "#ff4f8b" },
  娛樂: { emoji: "🎮", color: "#8b5cf6" },
  居家: { emoji: "🏠", color: "#10b3a0" },
  醫療: { emoji: "💊", color: "#f0405a" },
  教育: { emoji: "📚", color: "#f2b200" },
  其他: { emoji: "✨", color: "#7a86a3" },
};

export const categoryMeta = (name: string) => CATEGORIES[name] ?? CATEGORIES["其他"];
