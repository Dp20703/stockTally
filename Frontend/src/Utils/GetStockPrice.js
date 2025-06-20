import React, { useEffect, useState } from 'react';
import axios from 'axios';
import CalUnRealProfit from './CalUnRealProfit';
import Loader from './Loader';

const GetStockPrice = ({ stockSymbol, quantity, buyPrice, sellPrice }) => {
    const [stockPrice, setStockPrice] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch stock price
    const fetchStockPrice = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
            // console.log('Token not found. Please log in.');
            setLoading(false);
            return;
        }

        const url = `${process.env.REACT_APP_BACKEND_URL}/trades/price/${stockSymbol}`;
        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 200) {
                setStockPrice(response.data.price);
            } else {
                // console.log('Failed to fetch stock price.');
            }
        } catch (err) {
            return err
        }
        setLoading(false);
    };
    useEffect(() => {
        fetchStockPrice();
    }, [stockSymbol]);

    return (
        <>
            {loading ?
                (<div><Loader type="dot" /></div>)
                : stockPrice ? (
                    <div className='d-flex justify-content-center  align-items-center gap-3'>
                        <div>
                            <strong>Stock Price:</strong>₹{stockPrice}</div>
                        <div>
                            <div>
                                <strong>Unrealized Profit:</strong>
                                <CalUnRealProfit
                                    stockPrice={stockPrice}
                                    quantity={quantity}
                                    buyPrice={buyPrice}
                                    sellPrice={sellPrice}
                                /></div>
                        </div>
                    </div>
                ) : (
                    <div>No price available</div>
                )}
        </>
    );
};

export default GetStockPrice;
