import express from 'express';
import cors from 'cors';
import axios from 'axios';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 8000;

const xivApiPrivateKey = process.env.XIV_API_PRIVATE_KEY; 

app.use(cors());

app.get('/items', async (req, res) => {
    const itemName = req.query.item;
  
    if (!itemName) {
      return res.status(400).json({ message: 'Missing query parameter: item' });
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
  
      if (response.data && response.data.results && response.data.results.length > 0) {
        const itemResults = response.data.results.map(result => {
            return Object.assign({ itemId: result.row_id }, result.fields);
        });
        console.log(itemResults);
        res.json(itemResults);
    } else {
        res.status(404).json({ message: 'No items found matching your search.' });
      }
    } catch (error) {
      console.error('Error fetching data from XIVAPI:', error);
      if (error.response) {
        res.status(error.response.status).json({ message: error.response.data.Message || error.response.data.error || 'Unknown error' });
      } else if (error.request) {
        res.status(500).json({ message: 'No response from XIVAPI server' });
      } else {
        res.status(500).json({ message: 'An unexpected error occurred' });
      }
    }
  });

app.get('/market-board-current', async (req, res) => {
    const { worldDcRegion, itemId } = req.query;
  
    if (!worldDcRegion || !itemId) {
      return res.status(400).json({ message: 'Missing required parameters: worldDcRegion and itemId' });
    }
  
    try {
      const baseUrl = 'https://universalis.app/api/v2';
      const url = `${baseUrl}/${worldDcRegion}/${itemId}`;
  
      const response = await axios.get(url);
  
      if (response.data) {
        res.json(response.data);
      } else {
        res.status(404).json({ message: 'No data found for the requested items.' });
      }
    } catch (error) {
      console.error('Error fetching market board data:', error);
      if (error.response) {
        res.status(error.response.status).json({ message: error.response.data.message || 'Unknown error' });
      } else if (error.request) {
        res.status(500).json({ message: 'No response from Universalis API server' });
      } else {
        res.status(500).json({ message: 'An unexpected error occurred' });
      }
    }
  });
  
  app.get('/market-board-history', async (req, res) => {
    const { worldDcRegion, itemId, entriesWithin } = req.query;

    if (!worldDcRegion || !itemId) {
        return res.status(400).json({ message: 'Missing required parameters: worldDcRegion and itemId' });
    }

    try {
        const baseUrl = 'https://universalis.app/api/v2/history';
        let url = `${baseUrl}/${worldDcRegion}/${itemId}`;

        const params = new URLSearchParams();
        if (entriesWithin) {
            params.append('entriesWithin', entriesWithin.toString());
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const response = await axios.get(url);

        if (response.data && response.data.entries && response.data.entries.length > 0) {
            res.json(response.data);
        } else if (response.data){
            res.json({ ...response.data, message: 'No history data found within the specified time range.' });
        } else {
          res.status(404).json({ message: 'No history data found for the requested item.' });
        }
    } catch (error) {
        console.error('Error fetching market board history:', error);
        if (error.response) {
            res.status(error.response.status).json({ message: error.response.data.message || 'Unknown error' });
        } else if (error.request) {
            res.status(500).json({ message: 'No response from Universalis API server' });
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