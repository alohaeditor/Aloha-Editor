<?php
session_start();

error_log("\n\n".'###### save to session ', 3, "demo-app.log");

// XSS handling required
$pageId = $_REQUEST['pageId'];
$contentId = $_REQUEST['contentId'];
$content =  $_REQUEST['content'];

$data = false;
if (!empty($pageId)) {
	$contentItemId = md5($pageId.'#'.$contentId);
	$data['id'] = $contentItemId;
	$data['pageId'] = $pageId;
	$data['contentId'] = $contentId;
	$data['content'] = $content;
	
	$_SESSION[md5($pageId)][$contentItemId] = serialize($data);
}

if ( !empty($error) ) {
	error_log("\n".'error: '.print_r($error, true), 3, "demo-app.log");
} else {
	echo 'Content saved.';
}

?>