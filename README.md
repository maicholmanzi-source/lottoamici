# sito-lotto

Deploy pronto per Railway con persistenza su PostgreSQL.

## Accesso utenti con approvazione admin

Questa versione include:
- registrazione con username e password
- login e logout
- account admin dedicato
- approvazione o rifiuto utenti dal pannello `/admin.html`
- contenuti pubblici limitati alla home
- utenti, sessioni e schedine personali salvati su database PostgreSQL

## Variabili ambiente richieste

- `DATABASE_URL`
- `ADMIN_USERNAME` (default: `admin`)
- `ADMIN_PASSWORD` (default: `cambiami-subito-123`)

Imposta subito una password admin forte nelle variabili del servizio.

## Tabelle create automaticamente

All'avvio dell'app vengono create automaticamente queste tabelle, se non esistono già:
- `users`
- `sessions`
- `user_tickets`

## Nota Railway

Su Railway aggiungi un servizio PostgreSQL al progetto e collega `DATABASE_URL` all'app.
Dopo il deploy, utenti e schedine personali resteranno salvati nel database anche dopo redeploy o riavvii.
