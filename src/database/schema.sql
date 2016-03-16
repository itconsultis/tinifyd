CREATE DATABASE `tinifyd` DEFAULT CHARSET=utf8;


CREATE TABLE `migration` (
  `id` int unsigned not null auto_increment,
  `name` varchar(255) not null,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_uniq_1` (`name`)
) ENGINE=InnoDB;


CREATE TABLE `blob` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `hash` binary(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blob_uniq_1` (`hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `blob_path` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `blob_id` int(11) unsigned NOT NULL,
  `hash` binary(20) NOT NULL,
  `path` text NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `blob_path_uniq_1` (`hash`),
  KEY `blob_path_idx_1`  (`blob_id`),
  CONSTRAINT `blob_path_fk_1` FOREIGN KEY (`blob_id`) REFERENCES `blob`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE `semaphore` (
  `id` BINARY(20) NOT NULL,
  `created_at` timestamp NOT NULL default CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

