# Documentazione API Chatbot

API_DOMAIN=`aikosmo-server-production.up.railway.app`

## Endpoint

### 1. Inizializzare una sessione di chat

- **URL:** `https://${API_URL}/new_chat`
- **Metodo:** `POST`

- **Headers:**
  - `X-API-Key`: `API_KEY`

- **Parametri di Query:**
  - `language`: Codice della lingua (es. `"en"`)
  - `chatbot_slug`: Identificatore per lo specifico chatbot

- **Risposta:**
```json
  {
    "message": "Messaggio introduttivo",
    "suggested_questions": ["Domanda 1", "Domanda 2"],
    "token": "session_token"
  }
```

## 2. Ottenere il Messaggio Introduttivo

- **URL:** `https://${API_URL}/intro_message`
- **Metodo:** `POST`

- **Headers:**
  - `X-API-Key`: `API_KEY`

- **Parametri di Query:**
  - `language`: Codice della lingua (es. `"en"`)
  - `chatbot_slug`: Identificatore per lo specifico chatbot
  - `token`: Token di sessione esistente

- **Risposta:**
```json
  {
    "message": "Messaggio introduttivo",
    "suggested_questions": ["Domanda 1", "Domanda 2"],
    "history": [
      {"role": "user", "content": "Messaggio"},
      {"role": "assistant", "content": "Risposta"}
    ],
    "token": "session_token"
  }
```

## 3. Connessione WebSocket

- **URL:** `wss://${API_URL}/ws/${token}/${language}?chatbot_slug=${CHATBOT_SLUG}`

- **Headers:**
  - `X-API-Key`: `API_KEY`

### Comunicazione WebSocket

#### Inviare Messaggi

Invia messaggi dell'utente direttamente attraverso la connessione WebSocket.

#### Ricevere Messaggi

La connessione WebSocket riceve vari tipi di messaggi:

1. **Messaggi Regolari:** Risposte di testo dal chatbot.
2. **Messaggi di Controllo:**
   - <&#124;keep_alive&#124;>: Segnale di keep-alive.
   - <&#124;on_checking&#124;>: Il chatbot sta verificando la disponibilità.
   - <&#124;on_done_checking&#124;>: Il chatbot ha finito di verificare la disponibilità.
   - <&#124;reset&#124;>: Il chatbot sta reimpostando l'ultimo messaggio per riscriverlo.
   - <&#124;on_streaming_done&#124;>: Il chatbot ha finito di trasmettere il messaggio corrente.


### Flusso di Utilizzo

1. Inizializza una sessione di chat usando l'endpoint `/new_chat` oppure ottieni il messaggio introduttivo usando `/intro_message`.
2. Stabilisci una connessione WebSocket usando il token ricevuto.
3. Invia messaggi dell'utente tramite il WebSocket.
4. Ricevi e processa le risposte del chatbot e i messaggi di controllo.
5. Gestisci i messaggi di controllo speciali per azioni specifiche del chatbot.


### Esempi

[Questo esempio](./example.ts) mostra come usare l'API. In quel codice non viene usata l'API key perche' e' sotto il nostro dominio. Ma il concetto e' identico.
