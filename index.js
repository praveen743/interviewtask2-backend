const express = require("express");
const app = express();
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jswt = require("jsonwebtoken");
const secret = "AkYeHoPkd";
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
const URL = "mongodb+srv://praveen7:prmdb7@cluster0.soobe.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";


app.use(express.json())
app.use(cors({
    origin: "*"
}))

let authenticate = function (req, res, next) {
    try{
        if (req.headers.authorization) {
            let result = jswt.verify(req.headers.authorization, secret);
            if (result) {
                next();
            }
            else {
                res.json({ message: "token invalid" })
            }
        }
        else {
            res.json({ message: "not authorized" })
        }
    }catch{
        console.log("token expired");
        res.json({ message: "token expired" })
    }
   
}

app.post('/register', async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("RECbots");
        let user = await db.collection("registeration").findOne({ email: req.body.email });
        console.log(user)
        if (user) {
            res.json({ message: "Email already exist!" });
            connection.close();
        }
        else {
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.password, salt);
            req.body.password = hash;
            await db.collection("registeration").insertOne(req.body)
            res.json({ message: "registered" });
            connection.close();
        }
    } catch (error) {
        console.log(error)
        res.json(["error"])
    }
})

 

app.post('/login', async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("RECbots");
        let user = await db.collection("registeration").findOne({ email: req.body.email });
        // console.log(user)

        if (user) {
            let passwordcheck = await bcrypt.compare(req.body.password, user.password)
            if (passwordcheck) {
                let token = jswt.sign({ userid: user._id }, secret, { expiresIn: '1h' });
                res.json({ message: "login", user, token });
            }
            else {
                res.json({ message: "email id or password incorrect" });
            }
        }
        else {
            res.json({ message: "email id or password incorrect" });
        }
        connection.close();

    } catch (error) {
        res.json(["email id or password incorrect"])
    }
})

app.get("/card/:id",authenticate,async function (req, res) {
    try {
         let connection = await mongoClient.connect(URL);
        let db = connection.db("RECbots");
        console.log(req.params.id)

        let taskdata = await db.collection("registeration").find({email:req.params.id}).toArray();
      console.log(taskdata)
        await connection.close();
        res.json(taskdata);
    } catch (error) {
        console.log(error)
    }

});

app.put("/upgrade", async function (req, res) {
    try {
        let connection = await mongoClient.connect(URL);
        let db = connection.db("RECbots");
        // let objId = mongodb.ObjectId(req.params.id)
//    console.log(req.body.upplan)
        var updatedarr = await db.collection("registeration").updateOne({ email: req.body.email }, { $set:{plan:req.body.upplan} })
        console.log(updatedarr);
        await connection.close();
        res.json({ message: "Plan Updated" })
    } catch (error) {
        res.json(error);
        console.log(error)
    }
});
 

app.listen(3001,console.log('app is running'))
