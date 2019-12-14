const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const mysql = require('mysql');

const PORT = process.env.PORT || 8080;

app.get("/notes", (request, response) => {
    response.sendFile(path.join(__dirname, "..", "notes.html"));
    console.log("Your Notes!");

})
app.get("*", (request, response) => {
    response.sendFile(path.join(__dirname, "..", "index.html"));
    console.log("Your Index!");

})



app.listen(PORT, () => {
    console.log(`Server is listening on PORT ${PORT}`);
});