CREATE DATABASE IF NOT EXISTS molkky CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE molkky;

CREATE TABLE IF NOT EXISTS molkky_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(40) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS molkky_games (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
