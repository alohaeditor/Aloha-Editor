<?php
require_once 'lib/JSLikeHTMLElement.php';



// Save Data

// XSS handling required
$pageId = $_REQUEST['pageId'];
$contentId = $_REQUEST['contentId'];
$content =  $_REQUEST['content'];

error_log("\n\n".'###### save as file '.$pageId, 3, "demo-app.log");


$filePath = preg_replace('%^(/*)[^/]+%', '$2..', $pageId);
$pageContent = file_get_contents($filePath);
$error = false;


$doc = new DOMDocument();
//$doc->resolveExternals = true;
$doc->registerNodeClass('DOMElement', 'JSLikeHTMLElement');
if (!$doc->loadHTML($pageContent)) {
	$error = 'Could not load HTML';
} else {
	$elem = $doc->getElementById($contentId);
	//error_log("\n innerhtml: ".print_r($elem->innerHTML, true), 3, "demo-app.log");

	// set innerHTML
	$elem->innerHTML = $content;

	if (!file_put_contents($filePath, $doc->saveHTML())) {
		$error = 'Could not update file.';
	}

}

if ( !empty($error) ) {
	error_log("\nerror: ".print_r($error, true), 3, "demo-app.log");
} else {
	echo 'Content saved.';
}

?>