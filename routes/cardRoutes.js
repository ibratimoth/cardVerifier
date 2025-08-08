const express = require('express');
const router = express.Router('');
const cardController = require('./../controller/cardController');
const CardController = new cardController();

router.get('/', CardController.getAll.bind(CardController));
router.patch('/:card_id', CardController.update.bind(CardController));

module.exports = router;