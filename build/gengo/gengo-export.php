#!/usr/bin/php
<?php
require_once 'nls.php';

$export_translation = false;

// available translations
$all_translations = array('en' => 'English' , 'ar' => 'Arabic' , 'be' => 'Belarussian' , 'bn' => 'Bengali' , 'pt-br' => 'Brazilian' , 'bg' => 'Bulgarian' , 'ca' => 'Catalan' , 'zh-hans' => 'Chinese, Simplified' , 'zh-hant' => 'Chinese, Traditional' , 'cs' => 'Czech' , 'da' => 'Danish' , 'nl' => 'Dutch' , 'en-pi' => 'English, Pirate' , 'eo' => 'Esperanto' , 'et' => 'Estonian' , 'fi' => 'Finnish' , 'fr' => 'French' , 'gl' => 'Galician' , 'de' => 'German' , 'el' => 'Greek' , 'he' => 'Hebrew' , 'hi' => 'Hindi' , 'hu' => 'Hungarian' , 'it' => 'Italian' , 'jp' => 'Japanese' , 'ko' => 'Korean' , 'lt' => 'Lithuanian' , 'mk' => 'Macedonian' , 'mr' => 'Marathi' , 'nb-no' => 'Norwegian' , 'fa' => 'Persian' , 'pl' => 'Polish' , 'pt' => 'Portuguese' , 'ro' => 'Romanian' , 'ru' => 'Russian' , 'sr' => 'Serbian' , 'sl' => 'Slovenian', 'sk' => 'Slovak' , 'es' => 'Spanish' , 'sw' => 'Swahili' , 'sv' => 'Swedish' , 'tl' => 'Tagalog' , 'ta' => 'Tamil' , 'th' => 'Thai' , 'tr' => 'Turkish' , 'uk' => 'Ukrainian' , 'cy' => 'Welsh');


if (!empty($argv[1])) {
	$argv[1] = strtolower($argv[1]);
}

// print the help message
if (!empty($argv[1]) && in_array($argv[1], array('--help', '-help', '-h', '-?'))) {
	echo "\nExport translations from gengo.com to Aloha Editor\n\n";
	echo "Usage: \n";
	echo "Export all completely translated languages: php " . $argv[0] ."\n";
	echo "Export a specific languages: php " . $argv[0] ." en\n\n";
	echo "For detailed information navigate to: http://aloha-editor.org/guides/translation.html\n\n";

	echo "Available translations: \n";
	foreach ($all_translations as $iso_code => $name) {
		echo $name . ' - ' . $iso_code . "\n";
	}
	exit;
}


if (!empty($argv[1]) && !array_key_exists(trim($argv[1]), $all_translations)) {
	// show an error message -- the specified language is not available
	echo "\nExport translation error: Invalid language code.\n\n";
	echo "For detailed information navigate to: http://aloha-editor.org/guides/translation.html\n\n";

	echo "Available translations: \n";
	foreach ($all_translations as $iso_code => $name) {
		echo $name . ' - ' . $iso_code . "\n";
	}
	exit;
} else if (!empty($argv[1]) && array_key_exists(trim($argv[1]), $all_translations)) {
	// export the specified language
	$export_translation = array($argv[1]);
} else if (empty($argv[1])) {
	// export all available, completely translated languages
	$export_translation = array();
} else {
	// something is not like expected
	echo "\nExport translation error: Something went wrong. Here are some options:\n\n";
	echo " * Read the help message with the command: php " . $argv[0] ." -h\n\n";
	echo " * Navigate to: http://aloha-editor.org/guides/translation.html for detailed information\n";
	exit;
}


if (count($export_translation) == 1) {
	//$exportUrl = 'http://mygengo.com/string/p/aloha-editor-1/export/language/' . $export_translation[0] . '/34a78b1cb2c6103bd494c279d3e3711a0ec1bee5ea3a4100ff78655bb5b02067';
	// @todo needs fix (we need en to write the master file...)
	$exportUrl = 'http://mygengo.com/string/p/aloha-editor-1/export/all/34a78b1cb2c6103bd494c279d3e3711a0ec1bee5ea3a4100ff78655bb5b02067';
	//$export_translation[] = 'en';
} else {
	$exportUrl = 'http://mygengo.com/string/p/aloha-editor-1/export/all/34a78b1cb2c6103bd494c279d3e3711a0ec1bee5ea3a4100ff78655bb5b02067';
}


$exportDir = './export/';
$exportZipFile = './export.zip';

// remove old download and fetch file
$command = "rm $exportZipFile"; 
@system($command);


$exportZipFileData = file_get_contents($exportUrl);
file_put_contents($exportZipFile, $exportZipFileData);

// unzip the downloaded zip archive
$zip = new ZipArchive;
$res = $zip->open($exportZipFile);
if ($res === true) {
	$command = "rm -r $exportDir*"; 
	system($command);
	$zip->extractTo($exportDir);
	$zip->close();
	echo "\n[ok] Translations downloaded and extracted\n";
} else {
	echo "\n[error] Translations not downloaded or extracted\n";
}

// process all downloaded php language files and convert it to the aloha i18n format
$languages = get_directories($exportDir);
$translations = array();

foreach ($languages as $language) {
	echo "\nread files for language: $language\n";
	$sections = get_files($exportDir.$language.'/', '');
	//print_r($sections);
	$translation_status[$language]['total'] = 0;
	$translation_status[$language]['translated'] = 0;

	foreach ($sections as $section) {
		echo "read section: $section\n";

		$lang = array();
		require_once $exportDir.$language.'/'.$section;

		foreach ($lang as $i18n_key => $i18n_value) {
			$section = str_replace('.php', '', $section);
			$i18n_value = trim($i18n_value);
			$translations[$section][$language][$i18n_key] = $i18n_value;

			$translation_status[$language]['total']++;
			if (!empty($i18n_value)) {
				$translation_status[$language]['translated']++;
			}
		}
	}
}


$full_translated = array();
foreach ($translation_status as $lang => $status) {
	//echo $lang . ' - ' . $status['translated'] . '/' . $status['total'] . ' -- ' . ($status['total'] - $status['translated']). "\n";
	if ($status['total'] - $status['translated'] == 0) {
		$full_translated[] = $lang;
	}
}

// when importing one specific language reset the full_translated check
if (count($export_translation) == 1) {
	$full_translated = array_merge($full_translated, $export_translation);
}

generate_nls($translations, $full_translated, $export_translation);

function generate_nls($translations, $full_translated, $export_translation) {
	$exportDir = './nls/';

	foreach ($translations as $section => $language_data) {
		echo "\n\n*** generate $section\n";

		$out = "define({\n";
		$out .= "\t\"root\":  {\n";

		if (!empty($language_data['en'])) {
			// in case you just import a specific language don't rewrite the master file
			$master = $language_data['en'];
			unset($language_data['en']);

			$available_languages = array_keys($language_data);

			foreach ($master as $translate_key => $translate_string) {
				if (!empty($translate_key)) {
					//$translate_string = htmlentities($translate_string, ENT_SUBSTITUTE); // needs php 5.4
					//$translate_string = htmlentities($translate_string, ENT_QUOTES, 'UTF-8'); // produces html entities
					$translate_string = addslashes($translate_string);
					$out .= "\t\t\"$translate_key\": \"$translate_string\",\n";
				}
			}
			$out = substr($out, 0, -2);
			$out .= "\n\t},\n";
			foreach ($available_languages as $lang_code) {
				if (in_array($lang_code, $full_translated)) {
					$out .= "\t\t\"$lang_code\": true,\n";
				}
			}
			$out = substr($out, 0, -2);
			$out .= "\n});\n";

			echo "\n# write master\n";

			write_nls_file($section, 'en', $out);
		} else {
			$available_languages = array_keys($language_data);
		}

		if (count($export_translation) == 1) {
			$available_languages = $export_translation;
		}

		$out = '';
		foreach ($available_languages as $lang_code) {
			if (in_array($lang_code, $full_translated)) {
				echo "\n# write language file: $lang_code \n";
				$out = "define({\n";

				foreach ($language_data[$lang_code] as $translate_key => $translate_string) {
					if (!empty($translate_key)) {
						//$translate_string = htmlentities($translate_string, ENT_SUBSTITUTE); // needs php 5.4
						//$translate_string = htmlentities($translate_string, ENT_QUOTES, 'UTF-8'); // produces html entities
						$translate_string = addslashes($translate_string);
						$out .= "\t\"$translate_key\": \"$translate_string\",\n";
					}
				}

				$out = substr($out, 0, -2);
				$out .= "\n});\n";

				write_nls_file($section, $lang_code, $out);
			}
		}
		
	}
}

function write_nls_file($path_pattern, $language, $data) {
	date_default_timezone_set('Europe/Vienna');
	$file_name = 'i18n.js';

	$pa = explode('.', $path_pattern);
	$plugin = strtolower(array_pop($pa));

	// check for plugin folder
	$plugin_path = '../../src/plugins/common/'.$plugin;

	if (!is_dir($plugin_path)) {
		$plugin_path = '../../src/plugins/extra/'.$plugin;
	}

	if (!is_dir($plugin_path) && $plugin == 'aloha') {
		$plugin_path = '../../src/lib/'.$plugin;
	}

	if (!is_dir($plugin_path)) {
		echo $plugin_path.' does not exist';
		$plugin_path = '*** ERROR plugin path not found ***';
	}

	$path_dir = $plugin_path.'/nls/';
	$parent_dir = $path_dir;

	// is master or not
	if ($language != 'en') {
	    $path_dir .= $language.'/';
	}

	// rm all old / available translation dirs
	//$command = "rm -rf $parent_dir*"; 
	//system($command);

	$path = $path_dir.$file_name;

	// check if folder exists
	if (!is_dir($path_dir) && is_dir($parent_dir)) {
	    if (mkdir($path_dir)) {
	        echo "[ok] create dir: ".$path_dir."\n";
	    } else {
	        echo "[error] create dir: ".$path_dir."\n";
	    }
	}

	if (is_dir($path_dir)) {
		echo "[ok] write nls file to: $path \n";
		file_put_contents($path, $data);
	} else {
	    echo "[error] can not write nls file to: $path \n";
	}
}
?>