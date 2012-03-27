<?php
/* refine 
- utf-8 entities
- leere strings
*/
require_once 'nls.php';

define("ENVIRONMENT_LIVE", false);



// URL to the MyGengo public download of all translations
$exportUrl = 'http://mygengo.com/string/p/aloha-editor-1/export/all/34a78b1cb2c6103bd494c279d3e3711a0ec1bee5ea3a4100ff78655bb5b02067';
// test project
//$exportUrl = 'http://mygengo.com/string/p/aloha-test-1/export/all/8fced2397fb2dcec3761431ad4dbc4f007998ddc16e2f188b684d99aa8e839d3';

$exportDir = './export/';
$exportZipFile = './export.zip';


// remove old download and fetch file

 
//deactivated for now to test new structure


$command = "rm $exportZipFile"; 
system($command);

$exportZipFileData = file_get_contents($exportUrl);
file_put_contents($exportZipFile, $exportZipFileData);

// unzip the downloaded zip archive
$zip = new ZipArchive;
$res = $zip->open($exportZipFile);
if ($res === TRUE) {
	$command = "rm -r $exportDir*"; 
	system($command);
	$zip->extractTo($exportDir);
	$zip->close();
	echo "\n[ok] Translations downloaded and extracted\n";
} else {
	echo "\n[error] Translations not downloaded or extracted\n";
}

// process all downloaded php language files and convert it to the aloha i8ln format
$languages =  get_directories($exportDir);
$translations = array();
//print_r($languages);

foreach ($languages as $language) {
	echo "\nread files for language: $language\n";
	$sections = get_files($exportDir.$language.'/', '');
	//print_r($sections);
	
	foreach ($sections as $section) {
		echo "read section: $section\n";

		$lang = array();
		require_once $exportDir.$language.'/'.$section;
		//print_r($lang);
		
		foreach ($lang as $i8ln_key => $i8ln_value) {
			$section = str_replace('.php', '', $section);
			//$translations[$language][$section][$i8ln_key] = $i8ln_value;
			$translations[$section][$language][$i8ln_key] = $i8ln_value;
		}
	}
}

//print_r($translations);

generate_nls($translations);

/*
input:
 - translations/de/aloha.php
 - translations/de/plugin.format.php (new)
 - translations/de/Com.gentics.aloha.plugins.Format.php (old)

$lang['floatingmenu.tab.insert'] = 'Einfügen';
$lang['yes'] = 'Ja';


output: 
 - lib/aloha/nls/de/il8n.js
 - plugins/common/format/nls/de/il8n.js (de)
 - plugins/common/format/nls/il8n.js (master - en)

master file:
define( {
	'root':  {
		'floatingmenu.tab.insert': 'Insert',
		'yes': 'Yes'
	},
	'de':  true,
	'fr':  true
} );

lang file:

*/

function generate_nls($translations) {
	$exportDir = './nls/';
	
	foreach ($translations as $section => $language_data) {
		echo "generate $section\n";
		
		$out = "define({\n";
		$out .= "\t\"root\":  {\n";
		
		$master = $language_data['en'];
		unset($language_data['en']);
		
		$available_languages = array_keys($language_data);
		
		echo "master data:\n";
		//print_r($master);
		//echo "data \n";
		//print_r($language_data);
		//echo "available_languages:\n";
		//print_r($available_languages);
		
		foreach ($master as $translate_key => $translate_string) {
			//$translate_string = htmlentities($translate_string, ENT_SUBSTITUTE); // needs php 5.4
			//$translate_string = htmlentities($translate_string, ENT_QUOTES, 'UTF-8'); // produces html entities
			// @hack
            $translate_string = str_replace(array("*\///*"), "\\\\", $translate_string);
            $translate_string = str_replace(array("*\//*"), "\\", $translate_string);
            // @hack end
            
			$out .= "\t\t\"$translate_key\": \"$translate_string\",\n";
		}
		$out = substr($out, 0, -2);
		$out .= "\n\t},\n";
		
		foreach ($available_languages as $lang_code) {
			$out .= "\t\t\"$lang_code\": true,\n";
		}
		$out = substr($out, 0, -2);
		$out .= "\n});\n";
		
		
		echo "\n write master for $section \n";
		//echo $out;
		
		write_nls_file($section, 'en', $out);
		
		$out = '';
		foreach ($available_languages as $lang_code) {
			
			echo "\n write language file for $section: $lang_code \n";
			$out = "define({\n";

			foreach ($language_data[$lang_code] as $translate_key => $translate_string) {
				//$translate_string = htmlentities($translate_string, ENT_SUBSTITUTE); // needs php 5.4
				//$translate_string = htmlentities($translate_string, ENT_QUOTES, 'UTF-8'); // produces html entities
				$out .= "\t\"$translate_key\": \"$translate_string\",\n";
			}

			$out = substr($out, 0, -2);
			$out .= "\n});\n";

			//echo $out;
			
			write_nls_file($section, $lang_code, $out);
		}
		
	}
}

function write_nls_file($path_pattern, $language, $data) {
	date_default_timezone_set('Europe/Vienna');
	$file_name = 'i8ln-'.date('ymd').'.js';
	
	if (ENVIRONMENT_LIVE == true) {
	    $file_name = 'i8ln.js';
	}

	$path_dir = '../../src/'.str_replace('.', '/', $path_pattern).'/nls/';
	$parent_dir = $path_dir;
	
	// is master or not
	if ($language != 'en') {
	    $path_dir .= $language.'/';
	}
	
	$path = $path_dir.$file_name;
	
	// check if folder exists
	if (!is_dir($path_dir) && is_dir($parent_dir)) {
	    if (mkdir($path_dir)) {
	        echo "\n[ok] create dir: ".$path_dir."\n";
	    } else {
	        echo "\n[error] create dir: ".$path_dir."\n";
	    }
	}
	
	if (is_dir($path_dir)) {
    	//echo "\n write nls file to: $path_dir \n";
    	//print_r(get_directories($path_dir));
    	echo "\n write nls file to: $path \n";
    	file_put_contents($path, $data);
	} else {
	    echo "\n can not write nls file to: $path \n";
	}

}

?>