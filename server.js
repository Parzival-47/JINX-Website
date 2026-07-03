const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files (css, js, images)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/:page', (req, res) => {
    const page = req.params.page;
    res.sendFile(path.join(__dirname, page), (err) => {
        if (err) res.status(404).send('Page not found');
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running at http://localhost:${PORT}`);
    console.log(`Open your browser and go to: http://localhost:3000`);
});