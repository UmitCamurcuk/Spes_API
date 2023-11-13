const express = require('express')
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const cors = require('cors')
const DB_url = process.env.DB_URL
app.use(cors({
    origin: true,
    optionsSuccessStatus: 200,
    credentials: true,
}));
app.use(express.urlencoded())
app.use(express.json())
app.listen(process.env.PORT)

//DB Connection and Settings
mongoose.connect(DB_url,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    }
)
    .then(result => { console.log(`DB CONNECTED AND SERVER RUNNING ON ${process.env.PORT}`) })
    .catch(err => { console.log(err) });

//Routes 
const UserRoute = require("./Controlers/UserController");
app.use("/User", UserRoute);
const AuthRoute = require("./Controlers/AuthController");
app.use("/Auth", AuthRoute);
const AttributeRoute = require("./Controlers/AttributeController");
app.use("/Attribute", AttributeRoute);
const ItemTypeRoute = require("./Controlers/ItemTypeController");
app.use("/ItemType", ItemTypeRoute);
const ItemRoute = require("./Controlers/ItemController");
app.use("/Item", ItemRoute);
const FamilyRoute = require("./Controlers/FamilyController");
app.use("/Family", FamilyRoute);
const PermissionRoute = require("./Controlers/PermissionController");
app.use("/Permission", PermissionRoute);
const RoleRoute = require("./Controlers/RoleController");
app.use("/Role", RoleRoute);