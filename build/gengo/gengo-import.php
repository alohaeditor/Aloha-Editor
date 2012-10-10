<?php
require_once 'nls.php';

/* todos
- str replace " or ' 
*/

// start test data
$data = '{fu:"bar",baz:["bat"]}';

$data = 'define({"button.strong.tooltip":"Strong","button.em.tooltip":"Emphasize","button.b.tooltip":"Fett","button.i.tooltip":"Kursiv","button.u.tooltip":"Unterstrichen","button.cite.tooltip":"Zitat","button.q.tooltip":"","button.code.tooltip":"Code","button.abbr.tooltip":"Abk\u00fcrzung","button.del.tooltip":"Durchgestrichen","button.sub.tooltip":"Tiefgestellt","button.sup.tooltip":"Hochgestellt","button.p.tooltip":"Absatz","button.h1.tooltip":"\u00dcberschrift 1","button.h2.tooltip":"\u00dcberschrift 2","button.h3.tooltip":"\u00dcberschrift 3","button.h4.tooltip":"\u00dcberschrift 4","button.h5.tooltip":"\u00dcberschrift 5","button.h6.tooltip":"\u00dcberschrift 6","button.pre.tooltip":"Vorformatierter text","button.title.tooltip":"Titel","button.removeFormat.tooltip":"Formatierung entfernen","button.removeFormat.text":"Formatierung entfernen","GENTICS_button_p":"GENTICS_button_p_de","GENTICS_button_h1":"GENTICS_button_h1_de","GENTICS_button_h2":"GENTICS_button_h2_de","GENTICS_button_h3":"GENTICS_button_h3_de","GENTICS_button_h4":"GENTICS_button_h4_de","GENTICS_button_h5":"GENTICS_button_h5_de","GENTICS_button_h6":"GENTICS_button_h6_de","GENTICS_button_pre":"GENTICS_button_pre_de","GENTICS_button_title":"GENTICS_button_title_de"});';

$data = "define( {
	'root':  {
		'plugin.abbr.floatingmenu.tab.abbr': 'Abbreviation',
		'floatingmenu.tab.format': 'Format',
		'floatingmenu.tab.insert': 'Insert',
		'yes': 'Yes',
		'no': 'No',
		'cancel': 'Cancel',
		'repository.no_item_found': 'No item found.',
		'repository.loading': 'Loading',
		'repository.no_items_found_yet': 'No items found yet...'
	},
	'de':  true,
	'eo':  true,
	'fi':  true,
	'fr':  true,
	'it':  true,
	'pl':  true,
	'ru':  true
} );";


$data = '{"button.strong.tooltip":"Strong","button.em.tooltip":"Emphasize","button.b.tooltip":"Bold","button.i.tooltip":"Italic","button.u.tooltip":"Underline","button.cite.tooltip":"Cite","button.q.tooltip":"","button.code.tooltip":"Code","button.abbr.tooltip":"Abbreviation","button.del.tooltip":"Strikethrough","button.sub.tooltip":"Subscript","button.sup.tooltip":"Superscript","button.p.tooltip":"Paragraph","button.h1.tooltip":"Heading 1","button.h2.tooltip":"Heading 2","button.h3.tooltip":"Heading 3","button.h4.tooltip":"Heading 4","button.h5.tooltip":"Heading 5","button.h6.tooltip":"Heading 6","button.pre.tooltip":"Pre formated text","button.title.tooltip":"Title","button.removeFormat.tooltip":"Remove formatting","button.removeFormat.text":"Remove formatting","GENTICS_button_p":"GENTICS_button_p","GENTICS_button_h1":"GENTICS_button_h1","GENTICS_button_h2":"GENTICS_button_h2","GENTICS_button_h3":"GENTICS_button_h3","GENTICS_button_h4":"GENTICS_button_h4","GENTICS_button_h5":"GENTICS_button_h5","GENTICS_button_h6":"GENTICS_button_h6","GENTICS_button_pre":"GENTICS_button_pre","GENTICS_button_title":"GENTICS_button_title","formatBold":"Ctrl+b","formatItalic":"Ctrl+i","formatUnderline":"Ctrl+u","formatParagraph":"Alt+Ctrl+0","formatH1":"Alt+Ctrl+1","formatH2":"Alt+Ctrl+2","formatH3":"Alt+Ctrl+3","formatH4":"Alt+Ctrl+4","formatH5":"Alt+Ctrl+5","formatH6":"Alt+Ctrl+6","formatPre":"Alt+Ctrl+P","formatDel":"Ctrl+\\","formatSub":"Ctrl+,","formatSup":"Ctrl+."}';

// end test data

$importDir = './import/';

//$command = "rm -r $importDir*"; 
//system($command);


$section = 'lib.aloha';
$language = 'en';
$language = 'de';

//convert_nls_file($section, $language, $data);


// aloha core
$path = '../../src/lib/aloha/'; // nls
read_nls_dir($path, false);


// aloha plugins
$path = '../../src/plugins/common/';
read_nls_dir($path);

$path = '../../src/plugins/extra/';
read_nls_dir($path);



function read_nls_dir($root_dir, $plugin = true) {
    
    // get aloha core translation
    if ($plugin != true) {
        echo '################################# lib.aloha';
        $dir = $root_dir.'nls/';
        
        // convert master
        $section = 'lib.aloha';
        
        // master
        $language = 'en';
        $data = file_get_contents($dir.'i18n.js');
        convert_nls_file($section, $language, $data);
        
        // convert other languages
        $languages = get_directories($dir);
        foreach ($languages as $language) {
            $path = $dir.$language.'/i18n.js';
            if (is_file($path)) {
                $data = file_get_contents($path);
                convert_nls_file($section, $language, $data);
            } else {
                echo "[notice] file $path not found\n";
            }
        }
    } else {
        
        
        echo "\n read root $root_dir \n";
        
        $plugins = get_directories($root_dir);
        print_r($plugins);
    
        //$section = str_replace('/', '.', $root_dir);
        $section = str_replace(array('/', 'src.'), array('.', ''), $root_dir);
        $section = preg_replace("/[\.]{2,}/", ".", $section);
        //$section = preg_replace(array("/[\.]{2,}/", ".src."), array(".", ""), $section);
    
        if (preg_match('/^\.(.*)/', $section)) {
            $section = substr($section, 1);
        }
    
        if (preg_match('/(.*)\.$/', $section)) {
            $section = substr($section, 0, -1);
        }
                
        $section_tpl = $section;
        
        foreach ($plugins as $plugin) {
            $section = $section_tpl.'.'.$plugin;
            echo "\n section $section \n";
            
            // master
            $language = 'en';
            $dir = $root_dir.$plugin.'/nls/';
            $path = $dir.'i18n.js';

            echo "\n read nls $path \n";
            
            echo 'check for file... ';
            if (is_file($path)) {
                echo 'is file... ';
                $data = file_get_contents($path);
                echo 'got contents... ';
                if (!empty($data)) { // do we need this?
                    echo 'convert nls file... ';
                    convert_nls_file($section, $language, $data, $plugin);
                } else {
                    print_r($data);
                }
                echo 'done... ';
            } else {
                echo "[notice] file $path not found\n";
            }

            // convert other languages
            $plugin_path = $root_dir.$plugin.'/nls/';
            $languages = get_directories($plugin_path);
            //print_r($languages);
            foreach ($languages as $language) {
                $path = $dir.$language.'/i18n.js';
                echo "\n read nls sub $path \n";
                if (is_file($path)) {
                    $data = file_get_contents($path);
                    convert_nls_file($section, $language, $data, $plugin);
                } else {
                    echo "[notice] file $path not found\n";
                }
            }
            
        }
        
    }
}




function convert_nls_file($section, $language, $data, $plugin = false) {
    
    $import_dir = './import/';
    

	// remove comments
	$data = preg_replace('(//.+)', '', $data);

    // clean file input
    $data = str_replace('define(', '', $data);
    $data = str_replace(');', '', $data);

    // singe quotes to double quotes (maybe not so good ...)
    $data = str_replace('\'', '"', $data);

    $data = str_replace(array("\r\n", "\r", "\n", "\t"), ' ', $data);
    $data = preg_replace("/[ ]{2,}/", " ", $data);
    $data = trim($data);

    //$data = str_replace(array("{ ", " }"), array("{", "}"), $data);
    
    // typo stuff
    $data = str_replace(array("} ,", 
                            "{ root:", 
                            "\", \"",
                            "{ ", " }",
                            "src."
                            ), 
                        array("},", 
                            "{root:", 
                            "\",\"",
                            "{", "}",
                            ""
                        ), $data);

    // cleanup master file
    //preg_match('/^{ "root": \{(.*)\},(.*)/', $data, $found);
    //preg_match('/^{ \'root\': \{(.*)\},(.*)/', $data, $found);
    preg_match('/^{[\'|"]{1}root[\'|"]{1}: \{(.*)\},(.*)/', $data, $found);
   
    
    //print_r($found);
    
    if (count($found) < 3) {
         preg_match('/^\{root: \{(.*)\},(.*)/', $data, $found);
    }
    
    if (count($found) == 3) {
        echo "\n is master file \n";
        $data = '{'.trim($found[1]).'}';
    }
    
    /*
    echo "\n data found \n";
    //print_r($found);
    //echo "\n\n";


    echo "\n data to parse \n";
    print_r($data);
    echo "\n\n";
    */

    $parsed = array();
    
    //parse_jsobj($data, $parsed);
    try {
        echo 'try ...';
		// hex encoded stuff
        $data = str_replace(array("\\"), "#@#", $data);		
		$data = preg_replace_callback('/#@#u([0-9a-f]{4})/i', 'replace_unicode_escape_sequence', $data);
		
        parse_jsobj($data, $parsed);
	    echo 'parsing ok ...';
    } catch (Exception $e) {
        echo 'Exception: ',  $e->getMessage(), "\n";

        //echo "\n data to parse \n";
        //print_r($data);
        //echo "\n\n";
	    echo 'parsing ERROR ...';
    }
    
    
    //print_r($parsed);

    $out = "<?php\n\n";
    foreach ($parsed as $key => $value) {
        //echo $key.' -- '.$value."\n";
        $out .= "\$lang['$key'] = '$value';\n";
    }
    $out .= "\n?>";

    $path = $import_dir.$language.'/';
    if (!is_dir($path)) {
        mkdir($path);
    } 
    
    $path .= $section.'.php';
    //echo $path."\n";

    echo "\n write data to path: $path \n";
    //echo $out;
    //echo "\n\n";
    
    file_put_contents($path, $out);
    
    // generate old file format
    /*
    if (empty($plugin)) {
        $old = 'aloha';
    } else {
        // @todo $plugin_path_name with array replacement (camelcase some times)
        //$old = 'com.gentics.aloha.plugins.'.$plugin_path_name;
        $old = 'Com.gentics.aloha.plugins.'.ucfirst($plugin);
    }
    $path = $import_dir.$language.'/'.$old.'.php';
    echo "\nwrite data to old path: $path \n";
    file_put_contents($path, $out);
    // */
}


function replace_unicode_escape_sequence($match) {
    return mb_convert_encoding(pack('H*', $match[1]), 'UTF-8', 'UCS-2BE');
}
