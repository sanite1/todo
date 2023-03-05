const express = require("express")
const bodyParser = require("body-parser")
const date = require(__dirname +"/date.js")
const mongoose = require("mongoose")
const _ = require("lodash")

const app = express()
app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs")

app.use(express.static("public"));

// Global variables
// var items = ["Buy Food", "Buy Drinks"];
// var workTodos = [];

// Connecting to the database
const url = "mongodb+srv://admin-collins:sanite1@cluster0.c6qjn.mongodb.net/todolistDB"

mongoose.connect(url)

// A new todo schema
const todoSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    }
})

// A new list schema
const listSchema = new mongoose.Schema({
    name: {
        // this is for validation 
        type: String,
        required: true
    },
    // relationship with the todo schema
    items: [todoSchema]
})

// Then a new model for the item with a todo schema
const Item = mongoose.model("Item", todoSchema);

// Then a new model for the list with a list schema
const List = mongoose.model("List", listSchema);

// Default items to be added to new todo lists
const item1 = new Item({
    name: "Welcome to your todolists!"
})
const item2 = new Item({
    name: "Click the + sign to add items."
})



app.get("/", (req, res) => {
    // res.sendFile(__dirname + "/index.html")
    let day = date.getDate()

    // To find all the documents in the items collection
    Item.find((err, result) => {
        // Check if there's an error
        if(err) {
            console.log(err);
        } else {
            let items = []
            // check if the result is empty
            if(result.length ===0) {
                // inserting an array of objects into the items collection
                Item.insertMany([item1, item2], (err) => {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("Successfully added items");
                        res.redirect("/")
                    }
                })
            } else {
                // if the items collection isn't empty
                result.forEach((item) => {
                    items.push(item.name)
                })

                res.render("lists", {listTitle: "Today", newItem: items});
            }
        }
    })

})

app.post("/", (req, res) => {
    // getting the list to add and name of the list from form
    const itemName = req.body.todoItem;
    const listName = req.body.list

    // creating a new item
    const newTodo = new Item({
        name: itemName
    })

    // To check if its the home route
    if(listName === "Today") {
        // if it is the home route... just add a new list
        newTodo.save()
        res.redirect("/")
    } else {
        // if it is not the home route check for the list name in the list collection
        List.findOne({name: listName}, (err, result) => {
            if(err) {
                console.log(err);
            } else {
                // if list name is found push the new todo item to the items document in the list document
                result.items.push(newTodo)
                result.save()
                res.redirect("/" + listName)
            }
        })
    }
})

app.post("/delete", (req, res) => {
    // getting the list to delete and name of the list from form
    const checkedItem = req.body.checkbox;
    const listName = req.body.listName;

    // to chech if it is the home route
    if(listName === "Today") {
        // You can also use Item.findByIdAndRemove
        // if so, delete from the idems collection directly
        Item.deleteOne({name: checkedItem}, (err) => {
            if(err) {
                console.log(err);
            } else {
                console.log("Successfully deleted " + checkedItem);
                res.redirect("/")
            }
        })

    } else {
        // if it isn't the home route
        List.findOneAndUpdate(
            {name: listName}, // item to check for
            {$pull: {items: {name: checkedItem}}}, // What to update
            (err, result) => { // callback function
                if(!err) {
                    res.redirect("/" + listName)
                }
            }
        )
    }
})

app.get("/:header", (req, res) => {
    // using lodash to capitalize the first letter of the gotten parameter
    const listTitle =  _.capitalize(req.params.header);
    
    // since it isn't the gome route we use the list collection directly
    // we want to find all the items in the todo
    List.findOne({name: listTitle}, (err, result) => {
        if(!err) {
            // check if no result is found in the listTitle todo
            if(!result) {
                // create new list 
                const list = new List({
                    name: listTitle,
                    items: [item1, item2]
                })
                // Then save
                list.save((err) => {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("Successfully added items");
                        res.redirect("/" + (listTitle))
                    }
                })

            } else {
                // Show existing list
                let items = []
                result.items.forEach((item) => {
                    items.push(item.name)
                })
                // console.log(result)

                res.render("lists", {listTitle: result.name, newItem: items})
            }
        }
    })
    
})

app.get("/about", (req, res) => {
    res.render("about")
})
 
let port = process.env.PORT || 5000;

app.listen(port, () => {
    console.log("Server listening on port " + port)
})