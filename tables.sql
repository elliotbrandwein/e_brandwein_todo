DROP DATABASE IF EXISTS instapics;
CREATE DATABASE to_do;

\c to_do;

CREATE TABLE users (
	id		serial primary	key,
	name 	text not null,
	password 	text	
);

CREATE TABLE messages (
	id		 serial primary key,
	userid	 int references	users(id),
	message	 text not null,
	due_date date not null
);	


INSERT INTO users (username, password) VALUES ('elliot', '123');


