const mongoose = require("mongoose");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
const uri = "mongodb+srv://adilmalik1338_db_user:GSohbXP2KkpCnXLB@cluster0.c7hxxeo.mongodb.net/EventNest?retryWrites=true&w=majority";
mongoose.connect(uri)
  .then(() => { console.log("CONNECTED TO MONGO"); process.exit(0); })
  .catch((e) => { console.error("FAILED", e.message); process.exit(1); });
