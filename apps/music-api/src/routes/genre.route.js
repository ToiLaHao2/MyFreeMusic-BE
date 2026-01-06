const express = require("express");
const { getAllGenres } = require("../controllers/genre.controller");

const router = express.Router();

router.get("/", getAllGenres);

module.exports = router;
