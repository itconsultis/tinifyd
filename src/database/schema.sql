CREATE DATABASE `tinifyd` DEFAULT CHARSET=utf8;

CREATE TABLE `migration` (
  `id` int unsigned not null auto_increment,
  `name` varchar(255) not null,
  PRIMARY KEY (`id`),
  UNIQUE KEY `migration_uniq_1` (`name`)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS `blob` (
  `id` BINARY(16) not null,
  `mime` varchar(255)
  `path` TEXT default null,
  `optimized_at` timestamp default current_timestamp null,
  PRIMARY KEY (`id`),
  KEY `blob_idx_1` (`optimized_at`)
) ENGINE=InnoDB;

INSERT INTO `migration` SET `name` = '20160301190117-initial_schema';
