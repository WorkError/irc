var mainTalk = {
  
  //Obiekt na informacje o naszym userze
  userData: {},
  actuallyuser: "",

  //Funkcja dodajaca naszego scrollbara
  render(){
    SimpleScrollbar.initEl(document.querySelector(".messBox"))
  },
  //Powitanie nowego Usera
  incognitoMess(preMess, soloMess){
    //Tworzenie  podstawowej struktury wiadomosci
    var container = document.createElement("div")
    var descriptionDiv = document.createElement('div')

    //Span na godzine i profil bota
    var preMessSpan = document.createElement(`span`)
    preMessSpan.innerHTML = preMess

    //Span na tresc wiadomsoci
    var soloMessSpan = document.createElement(`span`)
    soloMessSpan.innerHTML = soloMess
    soloMessSpan.style.color = `lightblue`

    descriptionDiv.appendChild(preMessSpan)
    descriptionDiv.appendChild(soloMessSpan)

    
    container.appendChild(descriptionDiv)
    var content = document.querySelector(".ss-content")
    content.insertBefore(container, content.childNodes[0] )
   
  },

  //Funkcja pobierajaca nickname
   newUser() {
    var nickname = prompt("Podaj swój nick")
    this.actuallyuser = nickname
    //Obsluga bledu (pusty nickname)
    if (nickname === "" || nickname === null) return this.newUser()
    //Wysylamy fetcha do servera (dodanie nowego usera)
   
    //Fetch z wiadomoscia od bota (komunikat o dolaczeniu do pokoju)
    this.userData.nick = nickname 
    fetch("/bot", {    
      method: "POST",     
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        message: `${nickname} dołącza do pokoju`,
        messTime: this.getTime(),
      }),
    })

    //Fetch ktorym tworzymy usera na serverze 
    fetch("/addUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    })

    this.userData.nick = this.actuallyuser 
    //Powitanie nowego Usera
    this.incognitoMess(`${this.getTime()} <@BOT>`, ` Witaj ${nickname}`)
  },


  //Funkcja ktora zaleznie od podanego typu, tworzy i zwraca nam spana z zawartscia i odpowiednim kolorem
  createElement(type, innerHTML, colorHex) {
    var element = document.createElement(`span`)
    element.innerHTML = " " + innerHTML
    element.style.color = `#${colorHex}`
    element.classList.add(type)
    //Jesli to wiadomosc to uzywamy emotek
    if (type == 'message') $(element).emoticonize()
    return element
  },

  //Funkcja tworzaca asynchronicznie wiadomosc (zbiera wszystko do kupy)
  async createMessage(userData) {
    //Tworzenie struktury wiadomosci
    var container = document.createElement("div")
    var descriptionDiv = document.createElement("div")

    //Tworzenie contentu wiadomosci z uzycie funkcj createElement
    descriptionDiv.appendChild(this.createElement("time", userData.messTime, '000000'))
    descriptionDiv.appendChild(this.createElement("nick", `<@${userData.nick}>`, userData.color))
    descriptionDiv.appendChild(this.createElement("message", userData.message, 'add8e6'))

    //Ochrona przed spamem, brak wypuszczania pustych wiadomsoci
    if (userData.message != "") container.appendChild(descriptionDiv)
    document.querySelector(".ss-content").appendChild(container)
    mainTalk.scrollToBottom('.ss-content')
  },


    // Funkcja sprawdzajaca czy podana wiadomosc w inpucie to komenda (nick color quit)
    //StartsWith sprawdza czy podany string zaczyna sie od konkretnej wartosci
   commands(text) {   
    if (text.startsWith("/nick")) {
      //Wycinamy wszystkie znaki po komendzie i obslugujemy bledy pustej wiadomosci
      var newNick = text.slice(5, text.length)
      if (newNick != "" && newNick != " " && newNick != undefined) {
        //Idk czemu zawsze dodaje mi spacje przed
        newNick = newNick.slice(1)

        //Fetch z wiadomoscia od bota (komunikat o zmianie nicku)
        this.userData.nick = this.actuallyuser
        fetch("/bot", {    
          method: "POST",     
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            message: `${this.userData.nick} zmienil nick na ${newNick}`,
            messTime: this.getTime(),
          }),
        })

        //Fetch na server zmieniajacy dane o userze
        fetch("/newNick", {      
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nick: newNick }),
        })
        this.actuallyuser = newNick
        this.userData.nick = newNick 
      }
      //Obsluga pustego nicku
      else  alert("Podano pusty nick")        
      return false
    }
    //Komenda color
    else if (text.startsWith("/color")) {
      //Losujemy color i wysylamy na server
      var rndColor = Math.floor(Math.random() * 16777215).toString(16);

      //Fetch z wiadomoscia od bota (komunikat o zmianie koloru)
      this.userData.nick = this.actuallyuser   
      fetch("/bot", {    
        method: "POST",     
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `${this.userData.nick} zmienil color na #${rndColor}`,
          messTime: this.getTime(),
        }),
      })
      //Fetch ze zmiana koloru
      fetch("/color", {
        method: "POST",     
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          color: rndColor,
        }),
      })
      return false
    }
    //Komenda wyjscia 
    else if (text.startsWith("/quit")) {
       //Fetch z wiadomoscia od bota (komunikat o opuszczeniu pokoju)
       this.userData.nick = this.actuallyuser 
      fetch("/bot", {    
        method: "POST",     
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `${this.userData.nick} opuszcza pokoj`,
          messTime: this.getTime(),
        }),
      })
      
      //Odswiezenie okna == wyjscie
      window.location.reload()      
    }
    //Wiadomosc nie jest komenda
    else return true   
  },

  //Korekta czasu gdy sa to pojedyncze liczby
  helper(time){
    time = time.toString()
    if(time.length == 1) return `0${time}`
    else return time
  },

  //Funkcja wyrzucajaca string z czasem
  getTime(){
    let hh = new Date().getHours()
    let mm = new Date().getMinutes()
    return `[${this.helper(hh)}:${this.helper(mm)}]`
  },

  //Pobieranie danych usera z servera
  async sendMess() {
    fetch("/pushTo")
      .then((response) => response.json())  
      .then((data) => {
        this.userData = JSON.parse(data)
        this.sendMess()
        this.createMessage(this.userData)     
      })
  },

  //Scrollowanie na dol diva
  scrollToBottom (id) {
    var div = document.querySelector(id);
    div.scrollTop = div.scrollHeight - div.clientHeight;
 }

}

//Kolejno: REnder naszego scrollbara, dodanie usera, wysylanie messa
mainTalk.render()
mainTalk.newUser()
mainTalk.sendMess()        

//Nasluchujemy klawiature i sprawdzamy czy klikany jest ENTER
window.addEventListener("keypress", (e) => {
  if (e.code == "Enter") {
    //Pobieramy wartosc i czyscimy inputa
    var message = document.querySelector("input").value
    document.querySelector("input").value = ""
    //Puste waidomosci  
    if (message === "") { }
    
    //Sprawdzamy czy value jest komenda
    if (mainTalk.commands(message)) {
      //Funkcja renderujaca aktualny czas 
      var messTime = mainTalk.getTime() 
      fetch("/sendMess", {    
        method: "POST",     
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, messTime}),
      })
    }    

  }
});

