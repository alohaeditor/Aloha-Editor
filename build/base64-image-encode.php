<?php
//$url = '../src/';
$url = 'http://cdn.aloha-editor.org/latest/';

$css_file = 'aloha.css';
$css_file_orig = 'aloha.orig.css';

$css_orig = file_get_contents($url.'css/'.$css_file);
$css_orig = str_replace('url(../', 'url('.$url.'', $css_orig);
$css_orig = preg_replace("#url\(((\w+://)?(\w+)(\.[a-z0-9\-/?=_&%]+)+\.(png|gif|jpg))\)#e",
							"'url(data:image/\\5;base64,'.base64_encode(@file_get_contents('\\1')).')'",
							$css_orig);

echo "\n";
echo $css_orig;
echo "\n";
?>
