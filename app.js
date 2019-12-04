//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const _ = require("lodash");
const app = express();
//create DB with MongoDB/Mongoose
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://admin-kevin:Digital09@cluster0-msg0g.mongodb.net/todolistDB",{useNewUrlParser: true});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const food = new Item({
  name: "Buy Food"
});
const cook = new Item({
  name: "Cook Food"
});
const eat = new Item({
  name: "Eat Food"
});

const defaultItems =[food,cook,eat];
const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/", function(req, res) {

  Item.find({}, function(err, results) {
    if(results.length === 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log('error adding items');
        }else{
          console.log('items added');
        }
      });
      res.redirect("/");
    }
    res.render("list", {listTitle: "Today", newListItems: results});
  });


});

app.post("/", function(req, res){
const itemName = req.body.newItem;
const listName = req.body.list;
  const item = new Item({
    name: itemName
  });
List.findOne({name: listName},function(req,foundList){
  if(!foundList){
    item.save();
    res.redirect("/");
  }else{
    foundList.items.push(item);
    foundList.save();
    res.redirect("/list/"+listName);
  }
});
});
//delete items from MongoDB
app.post("/delete",function(req, res){
  const itemID = req.body.checkbox;
  const listName = req.body.list;
  List.findOne({name:listName}, function(err, results) {
    if(!results){
      Item.findByIdAndRemove(itemID,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("item removed");
          res.redirect("/");
        }
      });

    }else{
      List.findOneAndUpdate({name:listName},{$pull:{items:{_id:itemID}}},function(err){
      if(!err){
        console.log('successfully deleted');
      }else{
        console.log("opps there was an error deleteing");
      }
      });
      res.redirect("/"+listName);
    }

  });


});
app.get("/list/:listName", function(req,res){
const currentListName = _.lowerCase(req.params.listName);
  List.findOne({name:currentListName}, function(err, results) {
    if(!results){
      const list = new List({
        name: currentListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/list/"+currentListName);
    }else{
      console.log(results);
     res.render("list", {listTitle: currentListName, newListItems: results.items});
    }

  });

  console.log(req.params.listName);
//  res.render("list", {listTitle: "Work List", newListItems: workItems});
});

app.get("/about", function(req, res){
  res.render("about");
});
//look for port on heroku or local
let port = process.env.PORT;
if(port == null || port ==""){
  port = 3000;
}
app.listen(port, function() {
  console.log("Server started on port "+port);
});
