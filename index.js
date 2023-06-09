const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

const uri = "mongodb+srv://mariorafael:dEroAlLEuroSzb6P@cluster0.nxrqlkq.mongodb.net/?retryWrites=true&w=majority";
let client = null;
const app = express();
const port = 3000;

async function connect() {
  if (client != null) {
    return client;
  }

  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");
    return client;
  } catch (err) {
    console.log('Error connecting to MongoDB', err);
    throw err;
  }
}

app.use(express.json());

app.get('/movies', async (req, res) => {   

    query = {}
    if (req.query) { 
        for (const key in req.query) { 
            console.log(`${key}: ${req.query[key]}`); 
            query[key] = new RegExp(`${req.query[key]}`) 
        } 
    }
    console.log(query);

    const client = await connect();

    const db = client.db('api_movies');

    const collection = db.collection('movies');

    const movies = await collection.find(query).toArray();
    res.status(200).json(movies);

});

app.get('/users', async (req, res) => {   

    query = {}
    if (req.query) { 
        for (const key in req.query) { 
            console.log(`${key}: ${req.query[key]}`); 
            query[key] = new RegExp(`${req.query[key]}`) 
        } 
    }
    console.log(query);

    const client = await connect();

    const db = client.db('api_movies');

    const collection = db.collection('users');

    const users = await collection.find(query).toArray();
    res.status(200).json(users);

});

app.post('/movies', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('movies');
    const { title, gender, year } = req.body;
    console.log(title, gender, year);

    const new_movie = {
        'title': title,
        'gender': gender,
        'year': year
    };

    const result = await collection.insertOne(new_movie);
    console.log(result);

    res.status(201).json(result.insertedId);
});

app.post('/users', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('users');
    const { name, age, email, favourite_movies, reviews } = req.body;
    console.log(name, age, email, favourite_movies, reviews);

    const new_user = {
        'name': name,
        'age': age,
        'email': email,
        'favourite_movies': favourite_movies,
        'reviews': reviews
    };

    const result = await collection.insertOne(new_user);
    console.log(result);

    res.status(201).json(result.insertedId);
});

app.get('/movies/:id', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('movies');
    let movie = null;

    try{
         movie = await collection.findOne({ _id: new ObjectId(req.params.id)});
    }
    catch (err) {
        console.log(err);
        res.status(400).send("Invalid id");
        return;
    }

    if (movie) {
        res.status(200).json(movie);
    }
    else {
        res.status(404).send("Movie not found");
    }
});

app.get('/users/:id', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('users');
    let movie = null;

    try{
         movie = await collection.findOne({ _id: new ObjectId(req.params.id)});
    }
    catch (err) {
        console.log(err);
        res.status(400).send("Invalid id");
        return;
    }

    if (movie) {
        res.status(200).json(movie);
    }
    else {
        res.status(404).send("User not found");
    }
});

app.put('/movies/:id', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('movies');
    const { title, gender, year } = req.body;
    console.log(title, gender, year);

    const updated_movie = {
        'title': title,
        'gender': gender,
        'year': year
    };

    const result = await collection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: updated_movie });

    if (result.modifiedCount === 1) {
        res.status(200).send(updated_movie);
    }
    else {
        res.status(404).send("Movie not found");
    }
});

app.put('/users/:id', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('users');
    const { name, age, email, favourite_movies, reviews } = req.body;
    console.log(name, age, email, favourite_movies, reviews);

    const updated_user = {
        'name': name,
        'age': age,
        'email': email,
        'favourite_movies': favourite_movies,
        'reviews': reviews
    };

    const result = await collection.updateOne({ _id: new ObjectId(req.params.id) }, { $set: updated_user });

    if (result.modifiedCount === 1) {
        res.status(200).send(updated_user);
    }
    else {
        res.status(404).send("User not found");
    }
});

app.put('/users/:id/favourite_movies/:movie_id', async (req, res) => {
    const userId = req.params.id;
    const movieId = req.params.movie_id;

    const client = await connect();
    const db = client.db('api_movies');
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const moviesCollection = db.collection('movies');
    const movie = await moviesCollection.findOne({ _id: new ObjectId(movieId) });

    if (!movie) {
        res.status(404).send("Movie not found");
        return;
    }

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $addToSet: { favourite_movies: movie } }
    );

    if (result.modifiedCount === 1) {
        res.status(200).send(result);
    } else {
        res.status(500).send("Error on Update");
    }
});

app.put('/users/:id/reviews/:movie_id', async (req, res) => {
    const userId = req.params.id;
    const movieId = req.params.movie_id;
    const { rating, comment } = req.body;

    const client = await connect();
    const db = client.db('api_movies');
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(userId) });

    if (!user) {
        res.status(404).send("User not found");
        return;
    }

    const moviesCollection = db.collection('movies');
    const movie = await moviesCollection.findOne({ _id: new ObjectId(movieId) });

    if (!movie) {
        res.status(404).send("Movie not found");
        return;
    }

    const review = {
        movie: movie,
        rating: rating,
        comment: comment
    };

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $push: { reviews: review } }
    );

    if (result.modifiedCount === 1) {
        res.status(200).send(result);
    } else {
        res.status(500).send("Error on Update");
    }
});

app.put('/movies/:id/gender', async (req, res) => { 
    const client = await connect(); 
    const db = client.db('api_movies'); 
    const collection = db.collection('movies'); 
    const { gender } = req.body; 
    const result = await collection.updateOne({ _id: new ObjectId(req.params.id) }, 
    {$addToSet: { gender: { $each: gender } }}); 

    if (result.modifiedCount === 1) { res.status(200).send(result); 
    } 

    else { res.status(404).send("Error on Update"); } 
});

app.delete('/movies/:id', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('movies');

    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 1) {
        res.status(200).send("Movie deleted");
    }
    else {
        res.status(404).send("Movie not found");
    }
});

app.delete('/users/:id', async (req, res) => {
    const client = await connect();
    const db = client.db('api_movies');
    const collection = db.collection('users');

    const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 1) {
        res.status(200).send("User deleted");
    }
    else {
        res.status(404).send("User not found");
    }
});

app.listen(port, () => console.log(`Listening on http://localhost:${port}`));
