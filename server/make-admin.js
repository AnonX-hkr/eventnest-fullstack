require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const result = await User.findOneAndUpdate(
    { email: "adilmalik1338@gmail.com" },
    { role: "admin" },
    { new: true }
  );
  if (result) {
    console.log(`SUCCESS: ${result.name} (${result.email}) -> role: ${result.role}`);
  } else {
    console.log("NOT FOUND: No account with adilmalik1338@gmail.com — sign up first, then re-run.");
  }
  process.exit(0);
}).catch((err) => {
  console.error("DB ERROR:", err.message);
  process.exit(1);
});
