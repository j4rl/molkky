# molkky

Mölkky scorecard med frivillig inloggning, MySQLi-lagring och statistik.

## Kör lokalt

Appen är byggd för XAMPP/PHP och MySQLi utan PDO.

Standardinställningar finns i `config.php`:

- host: `localhost`
- user: `root`
- password: tomt
- database: `molkky`

`api.php` skapar databasen och tabellerna automatiskt om MySQL-användaren har rättigheter. Annars kan `schema.sql` köras manuellt i phpMyAdmin.

Temaväljaren använder `https://ld.j4rl.se/ld-theme-toggle.js`. CSS-filer exporterade från `theme.j4rl.se` kan laddas via knappen `CSS` i toppbaren.
