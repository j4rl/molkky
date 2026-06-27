<?php

declare(strict_types=1);

require_once __DIR__ . '/config.php';

session_name(APP_SESSION_NAME);
session_start();

header('Content-Type: application/json; charset=utf-8');

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

function respond(array $payload, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): never
{
    respond(['ok' => false, 'error' => $message], $status);
}

function request_json(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        fail('Ogiltig JSON.');
    }

    return $decoded;
}

function db(): mysqli
{
    static $db = null;

    if ($db instanceof mysqli) {
        return $db;
    }

    $server = new mysqli(DB_HOST, DB_USER, DB_PASS, '', DB_PORT);
    $server->set_charset('utf8mb4');
    $server->query('CREATE DATABASE IF NOT EXISTS `' . DB_NAME . '` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    $server->select_db(DB_NAME);

    $server->query(
        'CREATE TABLE IF NOT EXISTS molkky_users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(40) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $server->query(
        'CREATE TABLE IF NOT EXISTS molkky_games (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNSIGNED NOT NULL,
            ruleset_name VARCHAR(120) NOT NULL,
            winner_name VARCHAR(80) NOT NULL,
            winner_score INT NOT NULL,
            player_key VARCHAR(255) NOT NULL,
            players_json LONGTEXT NOT NULL,
            game_json LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX user_id_created_at (user_id, created_at),
            INDEX player_key_created_at (player_key, created_at),
            CONSTRAINT fk_molkky_games_user FOREIGN KEY (user_id) REFERENCES molkky_users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
    );

    $db = $server;
    return $db;
}

function current_user(): ?array
{
    if (empty($_SESSION['user_id'])) {
        return null;
    }

    $stmt = db()->prepare('SELECT id, username, created_at FROM molkky_users WHERE id = ? LIMIT 1');
    $stmt->bind_param('i', $_SESSION['user_id']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();

    return $user ?: null;
}

function require_user(): array
{
    $user = current_user();
    if (!$user) {
        fail('Du behöver vara inloggad.', 401);
    }

    return $user;
}

function clean_username(string $username): string
{
    $username = trim($username);
    if (!preg_match('/^[\p{L}\p{N}_ .-]{3,40}$/u', $username)) {
        fail('Användarnamn ska vara 3-40 tecken och kan innehålla bokstäver, siffror, mellanslag, punkt, bindestreck och understreck.');
    }

    return preg_replace('/\s+/', ' ', $username);
}

function player_key(array $players): string
{
    $names = array_map(
        static fn ($player) => mb_strtolower(trim((string)($player['name'] ?? '')), 'UTF-8'),
        $players
    );
    $names = array_values(array_filter($names, static fn ($name) => $name !== ''));
    sort($names, SORT_NATURAL | SORT_FLAG_CASE);

    return mb_substr(implode('|', $names), 0, 255, 'UTF-8');
}

try {
    $action = $_GET['action'] ?? 'me';
    $payload = request_json();

    if ($action === 'me') {
        respond(['ok' => true, 'user' => current_user()]);
    }

    if ($action === 'register') {
        $username = clean_username((string)($payload['username'] ?? ''));
        $password = (string)($payload['password'] ?? '');
        if (mb_strlen($password, 'UTF-8') < 6) {
            fail('Lösenordet behöver vara minst 6 tecken.');
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = db()->prepare('INSERT INTO molkky_users (username, password_hash) VALUES (?, ?)');
        try {
            $stmt->bind_param('ss', $username, $hash);
            $stmt->execute();
        } catch (mysqli_sql_exception $error) {
            if ((int)$error->getCode() === 1062) {
                fail('Användarnamnet finns redan.');
            }
            throw $error;
        }

        $_SESSION['user_id'] = db()->insert_id;
        respond(['ok' => true, 'user' => current_user()]);
    }

    if ($action === 'login') {
        $username = clean_username((string)($payload['username'] ?? ''));
        $password = (string)($payload['password'] ?? '');

        $stmt = db()->prepare('SELECT id, username, password_hash FROM molkky_users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user || !password_verify($password, (string)$user['password_hash'])) {
            fail('Fel användarnamn eller lösenord.', 401);
        }

        $_SESSION['user_id'] = (int)$user['id'];
        respond(['ok' => true, 'user' => current_user()]);
    }

    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        respond(['ok' => true]);
    }

    if ($action === 'save_game') {
        $user = require_user();
        $players = $payload['players'] ?? [];
        if (!is_array($players) || count($players) < 1) {
            fail('Spelet saknar spelare.');
        }

        $rulesetName = trim((string)($payload['rulesetName'] ?? 'Mölkky'));
        $winnerName = trim((string)($payload['winner']['name'] ?? ''));
        $winnerScore = (int)($payload['winner']['score'] ?? 0);
        if ($winnerName === '' || $winnerScore < 0) {
            fail('Spelet saknar vinnare.');
        }

        $playersJson = json_encode($players, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $gameJson = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($playersJson === false || $gameJson === false) {
            fail('Kunde inte serialisera spelet.');
        }

        $key = player_key($players);
        $userId = (int)$user['id'];
        $stmt = db()->prepare(
            'INSERT INTO molkky_games (user_id, ruleset_name, winner_name, winner_score, player_key, players_json, game_json)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->bind_param('ississs', $userId, $rulesetName, $winnerName, $winnerScore, $key, $playersJson, $gameJson);
        $stmt->execute();

        respond(['ok' => true, 'id' => db()->insert_id]);
    }

    if ($action === 'stats') {
        $user = require_user();
        $userId = (int)$user['id'];

        $stmt = db()->prepare(
            'SELECT COUNT(*) AS games,
                    COALESCE(SUM(winner_name = ?), 0) AS wins,
                    COALESCE(MAX(winner_score), 0) AS best,
                    COALESCE(ROUND(AVG(winner_score), 1), 0) AS average
             FROM molkky_games
             WHERE user_id = ?'
        );
        $stmt->bind_param('si', $user['username'], $userId);
        $stmt->execute();
        $summary = $stmt->get_result()->fetch_assoc() ?: ['games' => 0, 'wins' => 0, 'best' => 0, 'average' => 0];

        $stmt = db()->prepare(
            'SELECT id, ruleset_name, winner_name, winner_score, players_json, game_json, created_at
             FROM molkky_games
             WHERE user_id = ?
             ORDER BY created_at DESC
             LIMIT 30'
        );
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $recent = [];
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $players = json_decode((string)$row['players_json'], true);
            $game = json_decode((string)$row['game_json'], true);
            $recent[] = [
                'id' => (int)$row['id'],
                'rulesetName' => $row['ruleset_name'],
                'winner' => ['name' => $row['winner_name'], 'score' => (int)$row['winner_score']],
                'players' => is_array($players) ? $players : [],
                'turns' => is_array($game) ? ($game['turns'] ?? []) : [],
                'finishedAt' => $row['created_at'],
            ];
        }

        $stmt = db()->prepare(
            'SELECT player_key, COUNT(*) AS games, MAX(created_at) AS latest
             FROM molkky_games
             WHERE user_id = ?
             GROUP BY player_key
             HAVING COUNT(*) > 1
             ORDER BY latest DESC
             LIMIT 12'
        );
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $groups = [];
        $result = $stmt->get_result();
        while ($row = $result->fetch_assoc()) {
            $groups[] = [
                'players' => explode('|', (string)$row['player_key']),
                'games' => (int)$row['games'],
                'latest' => $row['latest'],
            ];
        }

        respond(['ok' => true, 'summary' => $summary, 'recent' => $recent, 'groups' => $groups]);
    }

    fail('Okänd åtgärd.', 404);
} catch (mysqli_sql_exception $error) {
    fail('Databasfel: ' . $error->getMessage(), 500);
} catch (Throwable $error) {
    fail('Serverfel: ' . $error->getMessage(), 500);
}
