const mongojs = require('mongojs')
const JSONStream = require('JSONStream')

// we can also provide some credentials
const db = mongojs('localhost:27017/grove')

console.log(db.ids);
db.ids.find(function (err, docs) {
    // docs is an array of all the documents in mycollection
    console.error(docs)
})

db.ids.find({}).pipe(JSONStream.stringify()).pipe(process.stdout)