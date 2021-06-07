//---------------------------------------EXPRESS BASICS----------------------------------------
var express = require('express');
var session = require('express-session');
const path = require('path');

app = express(),                   
PORT = process.env.PORT || 3000;   

app.use(express.json())         
app.use(express.static(path.join(__dirname + "/static")))    

//Tworzenie sesji express
app.use(session(
    {
        secret: 'GieratIRC',
        resave: true,    
        saveUninitialized: true,
        cookie: {
            httpOnly: true
        },
    })
)


//---------------------------------------------------ROUNTING----------------------------------
//Domyslny Routing naszej strony glownej
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname + "/static/public/index.html"))
})

//Dodawanie usera
app.post("/addUser", function (req, res) {
    //Tworzenie kalsy user
    let user = new User(req.body.nickname);
    //Zmiany dla biezacej sesji
    req.session.nick = user.nick;
    req.session.color = user.color;
    res.sendStatus(200);
})

//Deklaracja tablicy na wiadomosci do wyslania
let pushedArr = [];
//Deklaracja obiektu wiadomosci do wyslania
let mainMess = {
    messText: JSON.stringify({}),
    messListen: function (val) { },
    set currentMess(val) {
        this.messText = val;
        this.messListen(val);
    },
    //Zwrot wiadomosci jak json
    toJson: function (listener) {
        this.messListen = listener;
    },
};

//Przelecenie przez cala tablice i zwrocenie wiadomosci
mainMess.toJson(function (val) {
    pushedArr.forEach((res) => res.json(mainMess.messText));
    pushedArr = [];
})



//Tablica zbierajaca wiadomosci do przepchniecia na chat
app.get("/pushTo", (req, res) => {
    pushedArr.push(res);
})

//Odpowiedz bota
app.post("/bot", function (req, res) {
    //Obiekt odpowiedni dla naszego bota
    let newMessage = {
        nick: 'BOT',
        color: '000000',
        messTime: req.body.messTime,
        message: req.body.message,
    }
    //Edycja naszego obiektu 
    mainMess.currentMess = JSON.stringify(newMessage);
    res.sendStatus(200);
})

//adres tworzacy normalna wiadomosc 
app.post("/sendMess", function (req, res) {
    let newMessage = {
        nick: req.session.nick,
        color: req.session.color,
        messTime: req.body.messTime,
        message: req.body.message,
    }
        mainMess.currentMess = JSON.stringify(newMessage);
    res.sendStatus(200);
})


//Adres zmieniajacy aktualny kolor usera
app.post("/color", (req, res) => {
    req.session.color = req.body.color;
    res.sendStatus(200);
})

//Adres zmieniajacy nick naszego usera
app.post("/newNick", function (req, res) {
    req.session.nick = req.body.nick;
    res.sendStatus(200);
})



//Prosta funkcja user zwracajaca obiekt z nickiem i kolorem
class User {
    constructor(nick) {
        this.nick = nick;
        this.color = Math.floor(Math.random() * 16777215).toString(16);
    }
    get getUser() {
        return { nick: this.nick, color: this.color };
    }
}

app.listen(PORT, () => console.log('Serwer startuje na porcie 3000'))