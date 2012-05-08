<?php
session_start();

error_log("\n\n".'###### read from session ', 3, "demo-app.log");


// XSS handling required
$pageId = $_REQUEST['pageId'];
$cmd = false;

if (!empty($_REQUEST['cmd'])) {
	$cmd = $_REQUEST['cmd'];
}

if ($cmd == 'reset') {
	session_destroy();
}

$data = false;
$json_data = false;
if (!empty($_SESSION[md5($pageId)])) {
	$data = $_SESSION[md5($pageId)];
	
	foreach($data as $k => $v) {
		$json_data[$k] = unserialize($v);
	}
}

if (!empty($data)) {
	
	error_log("\n".'data available for page '.$pageId, 3, "demo-app.log");
}


if ( !empty($error) ) {
	error_log("\n".'error: '.print_r($error, true), 3, "demo-app.log");
} else {
	print_r(json_encode($json_data));
}

?>