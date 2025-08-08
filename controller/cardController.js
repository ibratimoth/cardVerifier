const CardServices = require('./../services/cardServices');

class CardController {
    constructor() {
        this.cardServices = new CardServices();
    }

    // async getAll(req, res) {
    //     try {
    //         const results = await this.cardServices.getAll();

    //         if (!results.success) {
    //             return res.status(500).json({
    //                 statusCode: 500,
    //                 success: false,
    //                 message: results.message || 'error',
    //                 error: results.error
    //             })
    //         }
    //         if (results.success && results.data.length === 0) {
    //             return res.status(200).json({
    //                 statusCode: 200,
    //                 success: true,
    //                 message: results.message || 'no content found',
    //                 data: results.data
    //             })
    //         }
    //         return res.status(200).json({
    //             statusCode: 200,
    //             success: true,
    //             message: results.message,
    //             data: results.data
    //         })

    //     } catch (error) {
    //         console.log(error)
    //         return res.status(500).json({
    //             statusCode: 500,
    //             success: false,
    //             message: results.message || 'error',
    //             error: results.error
    //         })
    //     }
    // }

    async getAll(req, res) {
        try {
            const results = await this.cardServices.getAll();

            const plainRequests = Array.isArray(results.data)
                ? results.data
                : [];

            //console.log(JSON.stringify(plainRequests, null, 2));
            console.log('Inafika');
            return res.render('index', {
                requests: plainRequests,
                error: results.success ? null : results.message
            });
        } catch (error) {
            console.log(error)
            return res.render('forbidden')
        }
    }

    async update(req, res) {
        try {
            const { card_id } = req.params;

            const results = await this.cardServices.findById(card_id);

            if (!results || !results.data) {
                return res.status(404).json({
                    statusCode: 404,
                    success: false,
                    message: 'Card not found'
                });
            }

            let card = results.data;

            console.log("Current Status:", card.status);
            console.log("Current Scanned:", card.scanned);
            console.log("Card Name:", card.name);

            if (card.status === card.scanned) {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    message: 'Card already fully verified and is no longer valid.'
                });
            }

            if (card.scanned === null) {
                card.scanned = 1;
                const cardData = {
                    scanned: card.scanned
                }
                await this.cardServices.update(card_id, cardData);

                return res.status(200).json({
                    statusCode: 200,
                    success: true,
                    message: `Card ${card.name} updated to scanned: ${card.scanned}.`
                });

            } else if (card.status === 2 && card.scanned === 1) {
                card.scanned = 2;
                const cardData = {
                    scanned: card.scanned
                }
                await this.cardServices.update(card_id, cardData);

                return res.status(200).json({
                    statusCode: 200,
                    success: true,
                    message: `Card ${card.name} updated to scanned: ${card.scanned}. Card is now fully verified.`
                });
            } else {
                return res.status(400).json({
                    statusCode: 400,
                    success: false,
                    message: 'Invalid card state for verification.'
                });
            }

        } catch (error) {
            console.error("Error during card update:", error);
            return res.status(500).json({
                statusCode: 500,
                success: false,
                message: 'Internal server error during card verification.',
                error: error.message
            });
        }
    }
}

module.exports = CardController;