const mongoose = require("mongoose");
const uri = "mongodb+srv://adilmalik1338_db_user:GSohbXP2KkpCnXLB@cluster0.c7hxxeo.mongodb.net/EventNest?retryWrites=true&w=majority";
mongoose.connect(uri)
  .then(() => { console.log("CONNECTED TO MONGO"); process.exit(0); })
  .catch((e) => { console.error("FAILED", e.message); process.exit(1); });
