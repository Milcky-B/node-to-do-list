const express = require("express");
const Task = require("../db/model/tasks");
const auth = require("../middleware/middlewareAuth");

const router = new express.Router();

router.post("/", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });
  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err.message);
  }
});


//GET ?completed=true || false
//GET ?limit=5&skip=5
//GET ?sortBy=desc
router.get("/", auth, async (req, res) => {
  let sorted=undefined;
  if(req.query.sortBy){
    sorted=req.query.sortBy==="desc"? -1:1
  }
  try {
    let tasks;
    if (req.query.completed) {
      const completed = req.query.completed === "true";
      tasks = await Task.find({ owner: req.user._id, completed})
        .limit(parseInt(req.query.limit))
        .skip(parseInt(req.query.skip))
        .sort({createdAt:sorted});
    } else {
      tasks = await Task.find({ owner: req.user._id })
        .limit(parseInt(req.query.limit))
        .skip(parseInt(req.query.skip))
        .sort({createdAt:sorted});
    }
    if (tasks.length === 0) res.status(400).send("No task found for user");
    res.send(tasks);
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) res.status(404).send("No task found by that ID");
    else res.send(task);
  } catch (err) {
    res.status(500).send();
  }
});

router.patch("/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const id = req.params.id;

  try {
    const task = await Task.findOne({ _id: id, owner: req.user._id });
    if (!task) res.status(404).send("No task found by that id");
    else {
      updates.forEach((update) => (task[update] = req.body[update]));
      await task.save();
      res.send(task);
    }
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.delete("/:id", auth, async (req, res) => {
  const id = req.params.id;
  try {
    const task = await Task.findOneAndDelete({ _id: id, owner: req.user._id });
    if (!task) return res.status(400).send("No task by that ID");
    res.send(`${task.description} deleted`);
  } catch (err) {
    res.status(500).send();
  }
});

module.exports = router;
