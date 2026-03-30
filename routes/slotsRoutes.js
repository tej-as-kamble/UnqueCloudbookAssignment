const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const userController = require("../controllers/userController");

router.post("/add-slot", auth, authorize(["professor"]), userController.addSlot);
router.delete("/delete-slot/:slotId", auth, authorize(["professor"]), userController.deleteSlot);
router.get("/slots/:professorId", auth, userController.slots);


module.exports = router;

