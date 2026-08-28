import { randomUUID } from "node:crypto";
import { getDatabase } from "../config/mongo.js";

const collection = async () => (await getDatabase()).collection("auth_users");

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  createdAt: user.createdAt,
});

export const userRepository = {
  async create({ email, passwordHash, displayName, role }) {
    const user = {
      id: randomUUID(), email, passwordHash, displayName, role, createdAt: new Date(),
    };
    try {
      await (await collection()).insertOne(user);
      return publicUser(user);
    } catch (error) {
      if (error.code === 11000) {
        throw Object.assign(new Error("An account with this email already exists"), { statusCode: 409 });
      }
      throw error;
    }
  },

  async findByEmail(email) {
    const user = await (await collection()).findOne({ email });
    if (!user) throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    return { ...publicUser(user), passwordHash: user.passwordHash };
  },
};
