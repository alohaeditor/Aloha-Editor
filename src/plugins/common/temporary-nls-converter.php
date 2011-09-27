<?php

exec('git mv i18n nls');
exec('git mv nls/en.json nls/i18n.js');
chdir('nls');

$languages = array();
foreach (glob("*.json") as $element) {
	echo "renaming $element";
	$langdir = basename($element, '.json');
	mkdir($langdir);
	$languages[] = $langdir;
	exec("git mv $element $langdir/i18n.js");

	file_put_contents("$langdir/i18n.js", 'define(' . file_get_contents("$langdir/i18n.js") . ');');
}

$contents =
'define({'. chr(10) .
'	root: ' . file_get_contents('i18n.js') . chr(10) . ',';

$contents .= implode(',' . chr(10), array_map(function($language) {
	return "	\"$language\":true";
}, $languages));
$contents .= chr(10) . '});';
echo $contents;
file_put_contents('i18n.js', $contents);

?>