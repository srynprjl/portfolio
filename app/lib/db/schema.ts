/**
 * DDL for both drivers. Kept as strings (not .sql files) so the
 * compiled server has no runtime file-path concerns.
 * Identifiers match src/db/types.ts — never build them from user input.
 */

export const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS profile (
  id TEXT PRIMARY KEY,
  firstName TEXT NOT NULL DEFAULT '',
  lastName TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS skills (
  id TEXT PRIMARY KEY,
  languages TEXT NOT NULL DEFAULT '[]',
  frameworks TEXT NOT NULL DEFAULT '[]',
  tools TEXT NOT NULL DEFAULT '[]',
  traits TEXT NOT NULL DEFAULT '[]',
  custom TEXT NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS code_profiles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS socials (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  hide INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS experience (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL DEFAULT '',
  organization TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  startDate TEXT NOT NULL DEFAULT '',
  endDate TEXT NOT NULL DEFAULT '',
  period TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS education (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  degree TEXT NOT NULL DEFAULT '',
  expected TEXT NOT NULL DEFAULT '',
  completed TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  motivation TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  chips TEXT NOT NULL DEFAULT '[]',
  sources TEXT NOT NULL DEFAULT '[]',
  liveUrl TEXT NOT NULL DEFAULT '',
  hideFromPage INTEGER NOT NULL DEFAULT 0,
  hideFromResume INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS designs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  files TEXT NOT NULL DEFAULT '[]',
  sources TEXT NOT NULL DEFAULT '[]',
  liveUrl TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS blogs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  author TEXT NOT NULL DEFAULT '',
  date TEXT NOT NULL DEFAULT '',
  excerpt TEXT NOT NULL DEFAULT '',
  file TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  tags TEXT NOT NULL DEFAULT '[]',
  coverImage TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  hide INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS visitors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ip TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  path TEXT NOT NULL DEFAULT '',
  userAgent TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  duration INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  anonymous INTEGER NOT NULL DEFAULT 0,
  read INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);
`

export const MARIADB_SCHEMA = `
CREATE TABLE IF NOT EXISTS profile (
  id VARCHAR(64) PRIMARY KEY,
  firstName TEXT,
  lastName TEXT,
  title TEXT,
  location TEXT,
  bio MEDIUMTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS skills (
  id VARCHAR(64) PRIMARY KEY,
  languages TEXT,
  frameworks TEXT,
  tools TEXT,
  traits TEXT,
  custom TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS code_profiles (
  id VARCHAR(128) PRIMARY KEY,
  label TEXT,
  url TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS socials (
  id VARCHAR(128) PRIMARY KEY,
  label TEXT,
  url TEXT,
  icon VARCHAR(64),
  hide TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS experience (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role TEXT,
  organization TEXT,
  location TEXT,
  startDate TEXT,
  endDate TEXT,
  period TEXT,
  summary MEDIUMTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS education (
  id INT PRIMARY KEY AUTO_INCREMENT,
  institution TEXT,
  location TEXT,
  degree TEXT,
  expected TEXT,
  completed TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(128) PRIMARY KEY,
  title TEXT,
  date TEXT,
  summary MEDIUMTEXT,
  motivation MEDIUMTEXT,
  image TEXT,
  chips TEXT,
  sources TEXT,
  liveUrl TEXT,
  hideFromPage TINYINT(1) NOT NULL DEFAULT 0,
  hideFromResume TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS designs (
  id VARCHAR(128) PRIMARY KEY,
  title TEXT,
  date TEXT,
  summary MEDIUMTEXT,
  description MEDIUMTEXT,
  image TEXT,
  tags TEXT,
  files TEXT,
  sources TEXT,
  liveUrl TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS blogs (
  id VARCHAR(128) PRIMARY KEY,
  title TEXT,
  author TEXT,
  date TEXT,
  excerpt MEDIUMTEXT,
  file VARCHAR(255),
  category TEXT,
  tags TEXT,
  coverImage TEXT,
  content MEDIUMTEXT,
  hide TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS visitors (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ip TEXT,
  country TEXT,
  city TEXT,
  path TEXT,
  userAgent TEXT,
  referrer TEXT,
  duration INT NOT NULL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name TEXT,
  email TEXT,
  subject TEXT,
  body MEDIUMTEXT,
  ip TEXT,
  country TEXT,
  anonymous TINYINT(1) NOT NULL DEFAULT 0,
  read TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`
