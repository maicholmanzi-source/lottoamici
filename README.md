# sito-lotto

Deploy pronto per Railway.

## Accesso utenti con approvazione admin

Questa versione include:
- registrazione con username e password
- login e logout
- account admin dedicato
- approvazione o rifiuto utenti dal pannello `/admin.html`
- contenuti pubblici limitati alla home

## Credenziali admin iniziali

L'account admin viene creato automaticamente all'avvio con queste variabili d'ambiente:
- `ADMIN_USERNAME` (default: `admin`)
- `ADMIN_PASSWORD` (default: `cambiami-subito-123`)

Imposta subito una password tua nelle variabili del servizio.

## Nota importante sulla persistenza

Gli utenti e le sessioni vengono salvati in `data/auth-data.json`.
Senza un database o uno storage persistente, su Railway questi dati possono andare persi dopo redeploy o riavvio.
Questa versione va bene come base funzionante; per produzione conviene passare a un database persistente.
