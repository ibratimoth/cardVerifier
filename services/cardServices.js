const CardRepository = require('./../repositories/cardRepository');

class CardServices {
    constructor() {
        this.cardRepositroy = new CardRepository()
    }

    async getAll() {
        try {
            const results = await this.cardRepositroy.getAll();

            if (results.length > 0) {
                return { success: true, message: "Card searched successfully", data: results }
            }
            return { success: true, message: "no card found", data: [] }
        } catch (error) {
            console.log('error while fetching cards:', error);
            return { success: false, message: "error", error: results.error }
        }
    }

    async findById(cardId) {
        try {
            const results = await this.cardRepositroy.findById(cardId);

            if (results) {
                return { success: true, message: "Card searched successfully", data: results }
            }
            return { success: false, message: "no card found", data: null }
        } catch (error) {
            console.log('error while fetching cards:', error);
            return { success: false, message: "error", error: results.error }
        }
    }

    async update(cardId, cardData) {
        try {
            const results = await this.cardRepositroy.update(cardId, cardData);
            if (results) {
                return { success: true, message: "Card updated successfully", data: results }
            }
            return { success: false, message: "no card updated", data: null }
        } catch (error) {
            console.log('error while fetching cards:', error);
            return { success: false, message: "error", error: results.error }
        }
    }
}

module.exports = CardServices;