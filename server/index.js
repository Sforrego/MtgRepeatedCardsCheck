const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Route to compare decks
app.post('/compare-decks', async (req, res) => {
  const { decks } = req.body; // Array of deck URLs or raw lists
  
  try {
    // Fetch deck data (from Moxfield/Archidekt or raw text)
    const deckData = await Promise.all(decks.map(fetchDeckData));

    // Find shared cards
    const sharedCards = findSharedCards(deckData);

    res.json({ sharedCards });
  } catch (error) {
    res.status(500).json({ error: 'Error comparing decks' });
  }
});

// Fetch deck data from Moxfield or Archidekt API or raw lists
async function fetchDeckData(deck) {
    if (deck.startsWith('https://moxfield.com')) {
      try {
        // Fetch from Moxfield API
        console.log("fetching from moxfield")
        const deckId = deck.split('/').pop();
        const response = await axios.get(`https://api.moxfield.com/v2/decks/all/${deckId}`);
        return Object.keys(response.data.mainboard)
      } catch (error) {
        console.error(`Error fetching Moxfield deck: ${error}`);
        throw new Error('Invalid Moxfield URL or deck not found');
      }
    } else if (deck.startsWith('https://archidekt.com')) {
      try {
        // Fetch from Archidekt API
        const deckId = deck.split('/').pop();
        const response = await axios.get(`https://archidekt.com/api/decks/${deckId}/`);
        return response.data.cards.map(card => card.card.oracleCard.name);
      } catch (error) {
        console.error(`Error fetching Archidekt deck: ${error}`);
        throw new Error('Invalid Archidekt URL or deck not found');
      }
    } else {
      // Parse raw card list
      return deck.split('\n').map(line => line.trim()).filter(line => line);
    }
  }

// List of cards to ignore
const ignoreList = ['Plains', 'Island', 'Swamp', 'Mountain', 'Forest'];

function normalizeCardName(card) {
    return card.replace(/^\d+\s*/, '').trim().replace(/\s*\(.*$/, '').trim();
  }
  
    
function findSharedCards(deckData) {
const cardCount = {};
deckData.forEach((deck, deckIndex) => {
    deck.forEach(card => {
    const normalizedCard = normalizeCardName(card);

    // Skip basic lands
    if (ignoreList.includes(normalizedCard)) return;

    if (!cardCount[normalizedCard]) {
        cardCount[normalizedCard] = [];
    }
    cardCount[normalizedCard].push(deckIndex + 1); // Track deck numbers
    });
});

// Filter cards appearing in more than 1 deck
const sharedCards = Object.entries(cardCount)
    .filter(([card, decks]) => decks.length > 1)
    .map(([card, decks]) => ({ card, decks }));

return sharedCards;
}
  


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
