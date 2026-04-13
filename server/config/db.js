const mongoose = require("mongoose");
const dns = require("dns");

// Force Google DNS — fixes querySrv ECONNREFUSED on networks that block SRV records
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,   // force IPv4 — avoids IPv6 DNS issues on Windows
    });

    isConnected = true;

    console.log(`✅  MongoDB connected — host: ${conn.connection.host}`);

    // Graceful shutdown
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("⚡  MongoDB disconnected on app termination");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌  MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️   MongoDB disconnected — will attempt reconnection");
  isConnected = false;
});

module.exports = connectDB;
