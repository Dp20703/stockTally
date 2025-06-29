const watchlistModel = require('../models/watchlist.model');

// Create watchlist
module.exports.createWatchlist = async ({ watchlistName, user }) => {

    const watchlist = new watchlistModel({ watchlistName, user: user._id });
    await watchlist.save();

    // Link watchlist to user if not already linked
    if (!user.watchlists.includes(watchlist._id)) {
        user.watchlists.push(watchlist._id);
        await user.save();
    }

    return watchlist;
}

// Add stocks to watchlist
module.exports.addStocks = async ({ watchlistId, stocks, user }) => {

    const watchlist = await watchlistModel.findOne({
        _id: watchlistId,
        user: user._id,
    });

    if (!watchlist) {
        throw new Error('watchlist not found.')
    }

    // Sanitize and normalize stock data
    const cleanedStocks = stocks.map(stock => ({
        stockName: stock.stockName?.trim(),
        stockSymbol: stock.stockSymbol?.trim().toUpperCase(),
    }));

    // Check for duplicate stock symbols
    const duplicateStocks = new Set();
    for (const stock of cleanedStocks) {
        if (duplicateStocks.has(stock.stockSymbol)) {
            throw new Error(`Duplicate stock symbol: ${stock.stockSymbol}`);
        }
        duplicateStocks.add(stock.stockSymbol);
    }

    // console.log("cleanedStocks:", cleanedStocks);
    // console.log("duplicateStocks:", duplicateStocks);

    // Check if the watchlist already contains the maximum of 10 stocks
    const availableSlots = 10 - watchlist.stocks.length;

    if (availableSlots <= 0) {
        throw new Error('Watchlist already contains the maximum of 10 stocks.');
    }

    // Create a Set of existing stock symbols
    const existingStocks = new Set(
        watchlist.stocks.map(stock => stock.stockSymbol)
    )
    // console.log("existingStocks:", existingStocks);
    // Filter only unique new stocks
    const uniqueStocks = cleanedStocks.filter(
        stock => !existingStocks.has(stock.stockSymbol)
    )
    // console.log("uniqueStocks:", uniqueStocks);

    if (uniqueStocks.length === 0) {
        throw new Error('All provided stock symbols already exist in the watchlist.');
    }


    // Check if the user can add more stocks
    if (uniqueStocks.length > availableSlots) {
        throw new Error(`You can only add ${availableSlots} more stock(s).`);
    }


    // Push new stocks into the existing array
    watchlist.stocks.push(...uniqueStocks);
    await watchlist.save();

};

// update watchlist
module.exports.updateWatchlist = async ({ watchlistName, stocks, id }) => {
    // Update watchlist name if provided
    if (watchlistName) {
        await watchlistModel.findByIdAndUpdate(
            id,
            { $set: { watchlistName } },
            { new: true }
        );
    }

    // Update each stock individually by stockId
    if (Array.isArray(stocks)) {
        for (const stock of stocks) {
            const { stockId, stockName, stockSymbol } = stock;

            if (stockId && (stockName || stockSymbol)) {
                const stockUpdate = {};
                if (stockName) stockUpdate["stocks.$.stockName"] = stockName;
                if (stockSymbol) stockUpdate["stocks.$.stockSymbol"] = stockSymbol.trim().toUpperCase();

                await watchlistModel.findOneAndUpdate(
                    { _id: id, "stocks._id": stockId },
                    { $set: stockUpdate },
                    { new: true }
                );
            }
        }
    }

    const updatedWatchlist = await watchlistModel.findById(id);
    return updatedWatchlist;
}