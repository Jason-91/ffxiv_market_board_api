require('dotenv').config(); 

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 8000;

const xivApiPrivateKey = process.env.XIV_API_PRIVATE_KEY; 

app.use(cors());

app.get('/search-itemname', async (req, res) => {
    const item_name = req?.query?.item_name;
    const isValid = typeof item_name === 'string';

    if (isValid) {
        console.log("Attempting to call FFXIV API");
        await axios ({
            method: 'get',
            url: `/search?indexes=item&string=${item_name}&sort_field=LevelItem&sort_order=desc&limit=100&private_keys=${xivApiPrivateKey}`,
            baseURL: `https://xivapi.com`
        })
        .then((value) => {
            console.log("Received response from item_name endpoint");
            // console.log(value);
            // console.log(value.data);
            // console.log(value.data.Results);
            const { data } = value;
            const { Results } = data;

            res.json({
                message: 'success',
                data: Results.map((data) => {
                    return {
                        item_id: data.ID,
                        item_name: data.Name,
                        item_url: data.Url,
                        item_icon: data.Icon,
                    }
                })
            })
        })
        .catch((error) => {
            console.log('Received error response from item_name endpoint');
            res.json({message: 'error: something terrible has happened!...'});
        });
    } else {
        res.json({ message: `error: invalid query type. Expected string but received ${item_name} type of ${typeof item_name}`});
    }
});

app.get('/data-centers', async (req, res) => {
    const desiredRegion = req.query.region || 'North-America';
    let dataCenters, worlds;

    await axios ({
        method: `get`,
        url: `/api/v2/data-centers/`,
        baseURL: `https://universalis.app`
    })
    .then((value) => {
        // console.log("Received response from data-centers endpoint for data centers");
        // console.log(value);
        // console.log(value.data);
        const { data } = value;
        dataCenters = data.filter(dataCenter => dataCenter.region === desiredRegion);
        // console.log(dataCenters);

    })
    .catch((error) => {
        console.log('Received error response from data-centers endpoint for data centers');
        result = { message: 'error: failure to fetch data centers' + error };
    });

    await axios ({
        method: `get`,
        url: `/api/v2/worlds`,
        baseURL: `https://universalis.app`
    })
    .then((value) => {
        // console.log("Received response from data-centers endpoint for worlds");
        // console.log(value);
        // console.log(value.data);
        const { data } = value
        worlds = data
        // console.log(worlds);
    })
    .catch((error) => {
        console.log('Received error response from data-centers endpoint for worlds');
        result = { message: 'error: failure to fetch data centers' + error };
    });

    const serverList = dataCenters.map(dataCenter => ({
        ...dataCenter,
        worlds: dataCenter.worlds.map(worldId => worlds.find(world => world.id === worldId).name)
    }));

    res.json({serverList});
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`)
});



app.get('/search-marketboard', async (req, res) => {
    const { dataID, dataCenter } = req.query
})