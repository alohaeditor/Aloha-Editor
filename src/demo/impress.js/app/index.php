<?php
session_start();

$pageId = false;
$cmd = false;

// XSS handling required
if (!empty($_REQUEST['pageId'])) {
	$pageId = $_REQUEST['pageId'];
}

echo '<span style="font-family:Verdana">';
if (!empty($_REQUEST['cmd'])) {
	$cmd = $_REQUEST['cmd'];
	
	if ($cmd == 'reset') {
		session_destroy();
		echo 'Session cleared. Back <a href="../">home</a>.<br />';
	}
}

echo '<br /><br />* App <a href="../">--></a>';

echo "\n\n<br /><br /><br />made with milk & <a href='http://aloha-editor.org'>Aloha Editor</a> &middot; 
	<a href='http://bartaz.github.com/impress.js'>impress.js</a><br/>
</span>";
?>