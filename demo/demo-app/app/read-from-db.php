<?php
$dbFile = 'db.sqlite';

error_log("\n\n".'###### read from DB '.$dbFile, 3, "demo-app.log");


// create table 'aloha' and insert sample data if SQLite dbFile does not exist
if ( !file_exists($dbFile) ) {
	error_log("\n".'SQLite Database does not exist '.$dbFile, 3, "demo-app.log");
	try {
		$db = new SQLiteDatabase($dbFile, 0666, $error);
		$db->query("BEGIN;
			CREATE TABLE aloha (
				id INTEGER PRIMARY KEY,
				pageId CHAR(255),
				contentId CHAR(255),
				content TEXT
			);

			INSERT INTO aloha 
				(id, pageId, contentId, content)
			VALUES
				(NULL, NULL, NULL, 'Click to edit');

			COMMIT;");
			error_log("\n".'SQLite Database created '.$dbFile, 3, "demo-app.log");
	} catch (Exception $e) {
		die($error);
	}
} else {
	// db already exists
	$db = new SQLiteDatabase($dbFile, 0666, $error);
}



// check if we have already a data set for this and save data

// XSS handling required
$pageId = sqlite_escape_string($_REQUEST['pageId']);

$query = "SELECT * FROM aloha 
	WHERE
		pageId = '".$pageId."';";

$result = $db->query($query, $error);

$exists = false;
$data = array();
while($result->valid()) {
	
	$exists = true;
    $row=$result->current();
	$data[] = $row;
    $result->next();
	error_log("\n".'data available for page '.$pageId, 3, "demo-app.log");
}
error_log("\n".'error: '.print_r($data, true), 3, "demo-app.log");

if ( !empty($error) ) {
	error_log("\n".'error: '.print_r($error, true), 3, "demo-app.log");
} else {
	print_r(json_encode($data));
}

?>