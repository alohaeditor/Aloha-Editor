<?php
$ok = true;

// do a short system check
$filename = 'demo-app.log';
if (!is_writable($filename)) {
    $ok = false;
}

$filename = 'save-to-session.php';
if (!is_readable($filename)) {
    $ok = false;
}

$filename = 'read-from-session.php';
if (!is_readable($filename)) {
    $ok = false;
}

$filename = 'save-to-db.php';
if (!is_readable($filename)) {
    $ok = false;
}

$filename = 'read-from-db.php';
if (!is_readable($filename)) {
    $ok = false;
}

if ($ok != true) {
	echo 'The *.php files in /app/ needs to be readable.';
} else {
	echo 'OK';
}
?>