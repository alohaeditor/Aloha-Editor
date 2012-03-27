<?php
session_start();

$pageId = false;
$cmd = false;

// XSS handling required
if (!empty($_REQUEST['pageId'])) {
	$pageId = $_REQUEST['pageId'];
}


$data = false;
$json_data = false;
if (!empty($_SESSION[md5($pageId)])) {
	$data = $_SESSION[md5($pageId)];
	
	foreach($data as $k => $v) {
		$json_data[$k] = unserialize($v);
	}
}

if ( !empty($error) ) {
	echo 'error: '.print_r($error, true);
} else {
	print_r(json_encode($json_data));
}

?>