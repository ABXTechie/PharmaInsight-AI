import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const registerUser = async ({ name, email, password }) => {
  // 1. Check if all fields are provided
  if (!name || !email || !password) {
    throw new Error("Please fill all fields");
  }

  // 2. Check if email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  // 3. Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // 4. Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  // 5. Generate JWT
  const token = generateToken(user._id);

  // 6. Return response
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    token,
  };
};


const loginUser = async ({ email, password }) => {
  // 1. Validate input
  if (!email || !password) {
    throw new Error("Please provide email and password");
  }

  // 2. Find user
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 3. Compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // 4. Generate token
  const token = generateToken(user._id);

  // 5. Return response
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    token,
  };
};

export { registerUser, loginUser };