const card = require('./../models/cardModel');

class CardRepository{
    async getAll(){
        return await card.findAll({order: [['created_at', 'DESC']]});
    }

    async findById(cardId){
        return await card.findByPk(cardId)
    }

    async update(cardId, cardData){
        const Card = await card.findByPk(cardId)

        if(!Card){
            throw new Error('Card not found');
        }

        await Card.update(cardData);
        return Card;
    }
}

module.exports = CardRepository;