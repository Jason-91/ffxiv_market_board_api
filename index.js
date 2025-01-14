require('dotenv').config(); 

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;

const xivApiPrivateKey = process.env.XIV_API_PRIVATE_KEY; 

app.use(cors());

app.get('/items', async (req, res) => {
    const itemName = req.query.item;

    if (!itemName) {
        return res.status(400).json({ message: 'Missing query parameter: item' });
    }

    if (typeof itemName !== 'string') {
        return res.status(400).json({ message: 'Invalid query parameter: item (expected string)' });
    }

    try {
        const response = await axios.get('https://beta.xivapi.com/api/1/search', {
            params: {
                query: `Name~"${itemName}"`,
                sheets: 'Item',
            },
            headers: {
                Authorization: `Bearer ${xivApiPrivateKey}`,
            },
        });

        // console.log("Full XIV API Response:", response);
        // console.log("XIV API Response Data:", response.data);
        // console.log("XIV API Results:", response.data.results);

        if (response.data && response.data.results && response.data.results.length > 0) {
            const itemFields = response.data.results.map(result => result.fields);

            res.json(itemFields);
        } else {
            res.status(404).json({ message: 'No items found matching your search.' });
        }
    } catch (error) {
        console.error('Error fetching data from XIVAPI:', error);
        if (error.response) {
            console.error('XIVAPI Response Data:', error.response.data);
            res.status(error.response.status).json({ message: `XIVAPI Error: ${error.response.status} - ${error.response.data.Message || error.response.data.error || 'Unknown error'}` });
        } else if (error.request) {
            res.status(500).json({ message: 'No response from XIVAPI server' });
        } else {
            res.status(500).json({ message: 'An unexpected error occurred' });
        }
    }
});

app.get('/data-centers', async (req, res) => {
    const desiredRegion = req.query.region || 'North-America';

    try {
        const [dataCentersResponse, worldsResponse] = await Promise.all([
            axios.get('/api/v2/data-centers/', { baseURL: 'https://universalis.app' }),
            axios.get('/api/v2/worlds', { baseURL: 'https://universalis.app' }),
        ]);

        const dataCenters = dataCentersResponse.data.filter(
            (dataCenter) => dataCenter.region === desiredRegion
        );

        const worldsMap = worldsResponse.data.reduce((acc, world) => {
            acc[world.id] = world.name;
            return acc;
        }, {});

        const serverList = dataCenters.map((dataCenter) => ({
            name: dataCenter.name,
            region: dataCenter.region,
            worlds: dataCenter.worlds.map((worldId) => worldsMap[worldId]),
        }));

        res.json({ 
            status: 'success', 
            data: { serverList },
            message: null
        });

    } catch (error) {
        console.error('Error fetching data centers:', error);
        res.status(500).json({ 
            status: 'error', 
            message: error.message || 'Failed to fetch data centers',
            data: null
        });
    }
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
});