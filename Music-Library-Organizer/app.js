const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const multer = require('multer');  // Add multer for file upload
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Setup multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/music');  // Store files in 'public/music' folder
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));  // Rename file to avoid conflicts
  }
});

const upload = multer({ storage: storage });

// Load and Save Album Functions
const loadAlbums = () => {
  const data = fs.readFileSync('./data/albums.json');
  return JSON.parse(data);
};

const saveAlbums = (albums) => {
  fs.writeFileSync('./data/albums.json', JSON.stringify(albums));
};

// Home Route - Display all albums
app.get('/', (req, res) => {
  const albums = loadAlbums();
  res.render('index', { albums });
});
app.post('/delete/:id', (req, res) => {
    const albumId = req.params.id;
  
    // Load the current album list
    let albums = loadAlbums(); // Assuming this function reads from the albums.json file
  
    // Find and remove the album with the specified id
    albums = albums.filter(album => album.id !== albumId);
  
    // Save the updated albums list
    saveAlbums(albums); // Assuming this function writes back to albums.json
  
    // Send a response or redirect after deletion
    res.redirect('/');
  });
// Add Album Route with File Upload
app.get('/add', (req, res) => {
  res.render('album', { album: null });
});

app.post('/add', upload.single('songFile'), (req, res) => {
  const albums = loadAlbums();
  const newAlbum = {
    id: Date.now().toString(),
    name: req.body.name,
    artist: req.body.artist,
    genre: req.body.genre,
    playCount: req.body.playCount || 0,
    songFile: req.file ? req.file.filename : null,  // Save file name if uploaded
  };
  albums.push(newAlbum);
  saveAlbums(albums);
  res.redirect('/');
});

// Edit Album Route
app.get('/edit/:id', (req, res) => {
  const albums = loadAlbums();
  const album = albums.find((a) => a.id === req.params.id);
  res.render('album', { album });
});

app.post('/edit/:id', upload.single('songFile'), (req, res) => {
  const albums = loadAlbums();
  const albumIndex = albums.findIndex((a) => a.id === req.params.id);
  if (albumIndex !== -1) {
    albums[albumIndex] = {
      id: req.params.id,
      name: req.body.name,
      artist: req.body.artist,
      genre: req.body.genre,
      playCount: req.body.playCount || 0,
      songFile: req.file ? req.file.filename : albums[albumIndex].songFile,  // Update file if uploaded
    };
    saveAlbums(albums);
  }
  res.redirect('/');
});

// Play the Song
app.get('/play/:id', (req, res) => {
  const albums = loadAlbums();
  const album = albums.find((a) => a.id === req.params.id);
  if (album && album.songFile) {
    res.sendFile(path.join(__dirname, 'public/music', album.songFile));  // Serve the song file
  } else {
    res.status(404).send('Song not found');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
